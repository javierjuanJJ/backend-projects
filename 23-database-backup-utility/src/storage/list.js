// src/storage/list.js
// List backup files in any storage backend

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const { logger } = require('../logging');
const { ICONS } = require('../consts/messages');
const { STORAGE_BACKENDS, STORAGE_ALIASES } = require('../consts/storage');

/**
 * List backups in the given storage backend
 * @param {string} storage   - Storage backend key
 * @param {object} options   - All parsed CLI options
 * @param {string} prefix    - Optional prefix/path filter
 */
async function listBackups(storage, options, prefix) {
  const backend = STORAGE_ALIASES[storage?.toLowerCase()?.trim()];
  if (!backend) throw new Error(`Unknown storage backend: ${storage}`);

  logger.info(`${ICONS.LIST} Listing backups in ${chalk.cyan(backend)}...`);

  let items = [];

  switch (backend) {
    case STORAGE_BACKENDS.LOCAL:
      items = listLocal(options.savePath || options.nfsMountPath, prefix);
      break;
    case STORAGE_BACKENDS.NFS:
      items = listLocal(path.join(options.nfsMountPath, options.nfsPath || '/'), prefix);
      break;
    case STORAGE_BACKENDS.AWS_S3:
      items = await listS3(options, prefix);
      break;
    case STORAGE_BACKENDS.GCS:
      items = await listGCS(options, prefix);
      break;
    case STORAGE_BACKENDS.AZURE:
      items = await listAzure(options, prefix);
      break;
    case STORAGE_BACKENDS.SSH:
      items = await listSSH(options, prefix);
      break;
    case STORAGE_BACKENDS.FTP:
      items = await listFTP(options, prefix);
      break;
    default:
      throw new Error(`List not supported for: ${backend}`);
  }

  printTable(items, backend);
  return items;
}

// ─── Per-backend list implementations ────────────────────────────────────────

function listLocal(dir, prefix) {
  if (!dir || !fs.existsSync(dir)) {
    throw new Error(`Directory not found: ${dir}`);
  }
  return fs.readdirSync(dir)
    .filter((f) => !prefix || f.startsWith(prefix))
    .map((f) => {
      const full = path.join(dir, f);
      const stat = fs.statSync(full);
      return { name: f, path: full, size: stat.size, modified: stat.mtime };
    })
    .sort((a, b) => b.modified - a.modified);
}

async function listS3(options, prefix) {
  const { S3Client, ListObjectsV2Command } = require('@aws-sdk/client-s3');
  const { awsBucket, awsRegion = 'us-east-1', awsS3Prefix = 'backups' } = options;

  const client = new S3Client({
    region: awsRegion,
    ...(options.awsAccessKeyId && {
      credentials: {
        accessKeyId: options.awsAccessKeyId,
        secretAccessKey: options.awsSecretAccessKey,
      },
    }),
    ...(options.awsEndpoint && { endpoint: options.awsEndpoint, forcePathStyle: true }),
  });

  const resp = await client.send(new ListObjectsV2Command({
    Bucket: awsBucket,
    Prefix: prefix || awsS3Prefix,
  }));

  return (resp.Contents || []).map((obj) => ({
    name: path.basename(obj.Key),
    path: `s3://${awsBucket}/${obj.Key}`,
    size: obj.Size,
    modified: obj.LastModified,
  })).sort((a, b) => b.modified - a.modified);
}

async function listGCS(options, prefix) {
  const { Storage } = require('@google-cloud/storage');
  const { gcsBucket, gcsKeyFile, gcsProjectId, gcsPrefix = 'backups' } = options;

  const storage = new Storage({ keyFilename: gcsKeyFile, projectId: gcsProjectId });
  const [files] = await storage.bucket(gcsBucket).getFiles({ prefix: prefix || gcsPrefix });

  return files.map((f) => ({
    name: path.basename(f.name),
    path: `gs://${gcsBucket}/${f.name}`,
    size: parseInt(f.metadata.size || 0),
    modified: new Date(f.metadata.updated),
  })).sort((a, b) => b.modified - a.modified);
}

async function listAzure(options, prefix) {
  const { BlobServiceClient } = require('@azure/storage-blob');
  const { azureConnectionString, azureContainer, azureAccountName, azureAccountKey, azurePrefix = 'backups' } = options;

  const connStr = azureConnectionString || process.env.AZURE_STORAGE_CONNECTION_STRING;
  let client;
  if (connStr) {
    client = BlobServiceClient.fromConnectionString(connStr);
  } else {
    const { StorageSharedKeyCredential } = require('@azure/storage-blob');
    client = new BlobServiceClient(
      `https://${azureAccountName}.blob.core.windows.net`,
      new StorageSharedKeyCredential(azureAccountName, azureAccountKey)
    );
  }

  const containerClient = client.getContainerClient(azureContainer);
  const items = [];
  const pfx = prefix || azurePrefix;
  for await (const blob of containerClient.listBlobsFlat({ prefix: pfx })) {
    items.push({
      name: path.basename(blob.name),
      path: `azure://${azureContainer}/${blob.name}`,
      size: blob.properties.contentLength,
      modified: blob.properties.lastModified,
    });
  }
  return items.sort((a, b) => b.modified - a.modified);
}

async function listSSH(options, prefix) {
  const SftpClient = require('ssh2-sftp-client');
  const sftp = new SftpClient();
  const { host, username, password, identityFile, sshPath, sshPort = 22 } = options;

  const connectOptions = { host, port: Number(sshPort), username };
  if (identityFile) connectOptions.privateKey = fs.readFileSync(identityFile);
  else connectOptions.password = password;

  try {
    await sftp.connect(connectOptions);
    const list = await sftp.list(sshPath || '/');
    return list
      .filter((f) => f.type === '-' && (!prefix || f.name.startsWith(prefix)))
      .map((f) => ({
        name: f.name,
        path: `sftp://${host}:${sshPort}${sshPath}/${f.name}`,
        size: f.size,
        modified: new Date(f.modifyTime * 1000),
      }))
      .sort((a, b) => b.modified - a.modified);
  } finally {
    await sftp.end().catch(() => {});
  }
}

async function listFTP(options, prefix) {
  const ftp = require('basic-ftp');
  const { ftpHost, ftpUsername, ftpPassword, ftpPort = 21, ftpSecure = false, ftpPath = '/' } = options;

  const client = new ftp.Client();
  try {
    await client.access({ host: ftpHost, port: Number(ftpPort), user: ftpUsername, password: ftpPassword, secure: ftpSecure });
    const list = await client.list(ftpPath);
    return list
      .filter((f) => f.type === ftp.FileType.File && (!prefix || f.name.startsWith(prefix)))
      .map((f) => ({
        name: f.name,
        path: `ftp://${ftpHost}:${ftpPort}${ftpPath}/${f.name}`,
        size: f.size,
        modified: f.modifiedAt || new Date(),
      }))
      .sort((a, b) => b.modified - a.modified);
  } finally {
    client.close();
  }
}

// ─── Display ──────────────────────────────────────────────────────────────────

function printTable(items, backend) {
  if (items.length === 0) {
    console.log(chalk.yellow(`\n${ICONS.WARNING} No backups found.\n`));
    return;
  }

  const COL = { name: 50, size: 12, date: 26 };
  const hr = chalk.gray('─'.repeat(COL.name + COL.size + COL.date + 6));
  const header = [
    chalk.bold.cyan(padEnd('Name', COL.name)),
    chalk.bold.cyan(padStart('Size', COL.size)),
    chalk.bold.cyan(padEnd('  Modified', COL.date)),
  ].join(' ');

  console.log(`\n${ICONS.LIST}  ${chalk.bold(`Backups in ${backend}`)} — ${chalk.gray(items.length + ' file(s)')}`);
  console.log(hr);
  console.log(header);
  console.log(hr);

  for (const item of items) {
    const nameStr = item.name.length > COL.name
      ? item.name.slice(0, COL.name - 3) + '...'
      : padEnd(item.name, COL.name);
    const sizeStr = chalk.green(padStart(formatBytes(item.size), COL.size));
    const dateStr = chalk.gray(padEnd('  ' + formatDate(item.modified), COL.date));
    console.log(`${nameStr} ${sizeStr} ${dateStr}`);
    console.log(chalk.gray(`  ${ICONS.ARROW} ${item.path}`));
  }

  console.log(hr);
  console.log(chalk.gray(`Total: ${items.length} file(s), ${formatBytes(items.reduce((s, i) => s + (i.size || 0), 0))}\n`));
}

function padEnd(str, len) { return str.padEnd(len).slice(0, len); }
function padStart(str, len) { return str.padStart(len).slice(0, len); }

function formatBytes(bytes) {
  if (!bytes) return '-';
  const s = ['B', 'KB', 'MB', 'GB', 'TB'];
  if (bytes === 0) return '0 B';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${s[i]}`;
}

function formatDate(d) {
  if (!d) return '-';
  return new Date(d).toISOString().replace('T', ' ').slice(0, 19);
}

module.exports = { listBackups };
