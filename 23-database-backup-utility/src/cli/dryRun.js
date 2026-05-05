// src/cli/dryRun.js
// Dry-run mode — simulates the full backup/restore flow without executing anything

const chalk = require('chalk');
const { ICONS } = require('../consts/messages');
const { DBMS, DBMS_DEFAULT_PORTS, DBMS_REQUIRED_TOOLS, DBMS_FILE_EXTENSIONS, DBMS_BACKUP_TYPE_SUPPORT, DBMS_TABLE_SUPPORT, DBMS_COLLECTION_SUPPORT } = require('../consts/databases');
const { STORAGE_ALIASES, STORAGE_REQUIRES_IDENTITY } = require('../consts/storage');
const { execSync } = require('child_process');
const path = require('path');

/**
 * Simulate a backup without running any actual commands.
 * Validates connectivity prerequisites, prints the command plan, and estimates output.
 */
function dryRunBackup(opts) {
  const sep = chalk.gray('─'.repeat(65));

  console.log(`\n${chalk.bold.yellow('⚡ DRY RUN MODE')} ${chalk.gray('— no changes will be made')}\n`);
  console.log(sep);

  // ── Plan ──────────────────────────────────────────────────────────────────
  section('📋 Backup Plan');
  row('DBMS', opts.dbms);
  row('Host', `${opts.host}:${opts.port || DBMS_DEFAULT_PORTS[opts.dbms] || 'default'}`);
  row('Database', opts.database || opts.host);
  row('Username', opts.username || chalk.gray('(none — SQLite)'));
  row('Backup type', opts.backupType || 'full');
  if (opts.tables?.length) row('Tables', opts.tables.join(', '));
  if (opts.collections?.length) row('Collections', opts.collections.join(', '));
  row('Compression', opts.compression ? chalk.green('yes (.zip)') : chalk.gray('no'));
  row('Storage', opts.storage);

  // ── CLI tool check ─────────────────────────────────────────────────────────
  console.log('');
  section('🔧 Required CLI Tools');
  const tools = DBMS_REQUIRED_TOOLS[opts.dbms] || [];
  for (const tool of tools) {
    const found = checkTool(tool);
    row(tool, found ? chalk.green(`✔ found`) : chalk.red(`✖ NOT FOUND — install before running`));
  }

  // ── Output file estimate ──────────────────────────────────────────────────
  console.log('');
  section('📁 Expected Output');
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const ext = opts.dbms === DBMS.MONGODB ? '/ (directory)' : DBMS_FILE_EXTENSIONS[opts.dbms] || '.bak';
  const baseName = `${opts.dbms}_${opts.database || 'db'}_${opts.backupType || 'full'}_${timestamp}${ext}`;
  const finalName = opts.compression ? baseName + '.zip' : baseName;
  row('Filename', finalName);
  row('Destination', resolveDestination(opts));

  // ── Generated command ─────────────────────────────────────────────────────
  console.log('');
  section('🖥️  Command That Would Run');
  const cmd = buildCommand(opts);
  console.log(chalk.gray('  ' + cmd));

  // ── Compatibility warnings ────────────────────────────────────────────────
  const warnings = collectWarnings(opts);
  if (warnings.length) {
    console.log('');
    section('⚠️  Compatibility Notes');
    warnings.forEach((w) => console.log(chalk.yellow(`  ${ICONS.WARNING} ${w}`)));
  }

  // ── Storage params summary ────────────────────────────────────────────────
  console.log('');
  section('☁️  Storage Parameters');
  printStorageParams(opts);

  console.log('\n' + sep);
  console.log(chalk.gray('  Remove --dry-run to execute this backup for real.\n'));
}

/**
 * Simulate a restore
 */
function dryRunRestore(opts) {
  const sep = chalk.gray('─'.repeat(65));

  console.log(`\n${chalk.bold.yellow('⚡ DRY RUN MODE')} ${chalk.gray('— no changes will be made')}\n`);
  console.log(sep);

  section('📋 Restore Plan');
  row('DBMS', opts.dbms);
  row('Host', `${opts.host}:${opts.port || DBMS_DEFAULT_PORTS[opts.dbms] || 'default'}`);
  row('Target database', opts.database || opts.host);
  row('Source file', opts.restoreFile);
  if (opts.storage) row('Download from', opts.storage);
  if (opts.tables?.length) row('Tables (selective)', opts.tables.join(', '));
  if (opts.collections?.length) row('Collections (selective)', opts.collections.join(', '));

  console.log('');
  section('🔧 Required CLI Tools');
  const tools = DBMS_REQUIRED_TOOLS[opts.dbms] || [];
  for (const tool of tools) {
    const found = checkTool(tool);
    row(tool, found ? chalk.green('✔ found') : chalk.red('✖ NOT FOUND'));
  }

  console.log('\n' + sep);
  console.log(chalk.gray('  Remove --dry-run to execute this restore for real.\n'));
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function section(title) {
  console.log(chalk.bold(`  ${title}`));
}

function row(label, value) {
  const pad = 20;
  console.log(`  ${chalk.cyan(label.padEnd(pad))} ${value}`);
}

function checkTool(tool) {
  try {
    execSync(`command -v ${tool}`, { stdio: 'ignore' });
    return true;
  } catch {
    try {
      execSync(`where ${tool}`, { stdio: 'ignore' }); // Windows
      return true;
    } catch {
      return false;
    }
  }
}

function resolveDestination(opts) {
  const storage = STORAGE_ALIASES[opts.storage?.toLowerCase()?.trim()];
  switch (storage) {
    case 'local': return opts.savePath || '(--save-path not set)';
    case 'aws-s3': return `s3://${opts.awsBucket || '(no bucket)'}/${opts.awsS3Prefix || 'backups'}/`;
    case 'gcs': return `gs://${opts.gcsBucket || '(no bucket)'}/${opts.gcsPrefix || 'backups'}/`;
    case 'azure': return `azure://${opts.azureContainer || '(no container)'}/${opts.azurePrefix || 'backups'}/`;
    case 'ssh': return `sftp://${opts.host}:${opts.sshPort || 22}${opts.sshPath || '/'}`;
    case 'ftp': return `ftp${opts.ftpSecure ? 's' : ''}://${opts.ftpHost}${opts.ftpPath || '/'}`;
    case 'samba': return `smb://${opts.smbHost}/${opts.smbShare}${opts.smbPath || '/'}`;
    case 'nfs': return path.join(opts.nfsMountPath || '(no mount)', opts.nfsPath || '/');
    default: return storage || '(unknown)';
  }
}

function buildCommand(opts) {
  switch (opts.dbms) {
    case DBMS.MYSQL:
      return `mysqldump -h${opts.host} -P${opts.port || 3306} -u${opts.username} --password=*** ${opts.database}${opts.tables?.length ? ' ' + opts.tables.join(' ') : ''}`;
    case DBMS.POSTGRESQL:
      return `PGPASSWORD=*** pg_dump -h ${opts.host} -U ${opts.username} ${opts.tables?.length ? opts.tables.map(t => `-t ${t}`).join(' ') + ' ' : ''}-Fc ${opts.database}`;
    case DBMS.MONGODB:
      return `mongodump --host=${opts.host} --db=${opts.database}${opts.collections?.length ? ' --collection=' + opts.collections[0] : ''}`;
    case DBMS.SQLITE:
      return `sqlite3 "${opts.database || opts.host}" .dump`;
    default:
      return `(no command template for ${opts.dbms})`;
  }
}

function collectWarnings(opts) {
  const w = [];
  if (opts.dbms === DBMS.MONGODB && opts.backupType === 'incremental') {
    w.push('MongoDB incremental backup requires oplog enabled (replica set).');
  }
  if (opts.dbms === DBMS.MYSQL && opts.backupType !== 'full') {
    w.push('MySQL incremental/differential backup requires binary logging enabled.');
  }
  if (opts.dbms === DBMS.POSTGRESQL && opts.backupType === 'incremental') {
    w.push('PostgreSQL incremental uses pg_basebackup — ensure WAL archiving is configured.');
  }
  return w;
}

function printStorageParams(opts) {
  const storage = STORAGE_ALIASES[opts.storage?.toLowerCase()?.trim()];
  switch (storage) {
    case 'local':
      row('save-path', opts.savePath || chalk.red('(missing)'));
      break;
    case 'aws-s3':
      row('bucket', opts.awsBucket || chalk.red('(missing)'));
      row('region', opts.awsRegion || 'us-east-1');
      row('prefix', opts.awsS3Prefix || 'backups');
      row('auth', opts.awsAccessKeyId ? 'explicit keys' : 'env/IAM role');
      if (opts.awsEndpoint) row('endpoint', opts.awsEndpoint);
      break;
    case 'gcs':
      row('bucket', opts.gcsBucket || chalk.red('(missing)'));
      row('key-file', opts.gcsKeyFile || 'Application Default Credentials');
      row('prefix', opts.gcsPrefix || 'backups');
      break;
    case 'azure':
      row('container', opts.azureContainer || chalk.red('(missing)'));
      row('auth', opts.azureConnectionString ? 'connection string' : 'account name + key');
      row('prefix', opts.azurePrefix || 'backups');
      break;
    case 'ssh':
      row('host', opts.host);
      row('port', opts.sshPort || '22');
      row('path', opts.sshPath || chalk.red('(missing)'));
      row('key', opts.identityFile || chalk.red('(missing)'));
      break;
    case 'ftp':
      row('host', opts.ftpHost || chalk.red('(missing)'));
      row('port', opts.ftpPort || '21');
      row('path', opts.ftpPath || chalk.red('(missing)'));
      row('secure', opts.ftpSecure ? chalk.green('yes (FTPS)') : chalk.yellow('no (plain FTP)'));
      break;
    case 'samba':
      row('host', opts.smbHost || chalk.red('(missing)'));
      row('share', opts.smbShare || chalk.red('(missing)'));
      row('path', opts.smbPath || '/');
      break;
    case 'nfs':
      row('mount-path', opts.nfsMountPath || chalk.red('(missing)'));
      row('sub-path', opts.nfsPath || '/');
      break;
  }
}

module.exports = { dryRunBackup, dryRunRestore };
