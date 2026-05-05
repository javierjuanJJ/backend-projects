// src/storage/ssh.js
// SSH/SFTP storage backend using ssh2-sftp-client

const fs = require('fs');
const path = require('path');
const SftpClient = require('ssh2-sftp-client');
const { logger } = require('../logging');
const { ICONS } = require('../consts/messages');

/**
 * Upload a backup file via SFTP
 *
 * Required options:
 *   -h / --host              Remote SSH host (IP or hostname) for the backup server
 *   -u / --username          SSH username
 *   -i / --identity-file     Path to SSH private key file (e.g. ~/.ssh/id_rsa)
 *   --ssh-path               Remote destination directory path
 *
 * Optional options:
 *   --ssh-port               SSH port (default: 22)
 *   -p / --password          SSH password (if not using key-based auth)
 *   --ssh-passphrase         Passphrase for encrypted private key
 *
 * Note: --identity-file is required for SSH storage.
 * Key-based authentication is strongly recommended over passwords.
 *
 * Example:
 *   db-backup backup -h 10.0.0.1 -u admin -db mydb --dbms mysql \
 *     -s ssh -i ~/.ssh/backup_key --ssh-path /mnt/backups/mysql
 */
async function uploadSSH(sourcePath, options) {
  const {
    host: sshHost,
    username: sshUsername,
    password: sshPassword,
    identityFile,
    sshPath,
    sshPort = 22,
    sshPassphrase,
  } = extractSSHOptions(options);

  if (!sshHost) throw new Error('SSH storage requires --host (SSH server)');
  if (!sshUsername) throw new Error('SSH storage requires --username');
  if (!sshPath) throw new Error('SSH storage requires --ssh-path');
  if (!identityFile && !sshPassword) throw new Error('SSH storage requires --identity-file or --password');

  const sftp = new SftpClient();
  const remotePath = `${sshPath.replace(/\/$/, '')}/${path.basename(sourcePath)}`;

  try {
    const connectOptions = buildConnectOptions({ sshHost, sshPort, sshUsername, sshPassword, identityFile, sshPassphrase });
    logger.info(`${ICONS.SSH} Connecting to SFTP: ${sshUsername}@${sshHost}:${sshPort}`);
    await sftp.connect(connectOptions);

    // Ensure remote directory exists
    await sftp.mkdir(sshPath, true).catch(() => {}); // ignore if exists

    logger.info(`${ICONS.UPLOAD} Uploading via SFTP to: ${remotePath}`);
    await sftp.fastPut(sourcePath, remotePath, {
      step: (transferred, chunk, total) => {
        const pct = Math.round((transferred / total) * 100);
        process.stdout.write(`\r${ICONS.UPLOAD} Upload progress: ${pct}%`);
      },
    });

    process.stdout.write('\n');
    logger.info(`${ICONS.SUCCESS} Uploaded to ${sshHost}:${remotePath}`);
    return `sftp://${sshHost}:${sshPort}${remotePath}`;
  } finally {
    await sftp.end().catch(() => {});
  }
}

/**
 * Download a backup file via SFTP for restore
 */
async function downloadSSH(remoteFilePath, localDir, options) {
  const { host: sshHost, username: sshUsername, password: sshPassword, identityFile, sshPort = 22, sshPassphrase } = extractSSHOptions(options);

  const sftp = new SftpClient();
  const localPath = path.join(localDir, path.basename(remoteFilePath));

  try {
    const connectOptions = buildConnectOptions({ sshHost, sshPort, sshUsername, sshPassword, identityFile, sshPassphrase });
    logger.info(`${ICONS.DOWNLOAD} Downloading via SFTP from: ${sshHost}:${remoteFilePath}`);
    await sftp.connect(connectOptions);
    await sftp.fastGet(remoteFilePath, localPath, {
      step: (transferred, chunk, total) => {
        const pct = Math.round((transferred / total) * 100);
        process.stdout.write(`\r${ICONS.DOWNLOAD} Download progress: ${pct}%`);
      },
    });
    process.stdout.write('\n');
    logger.info(`${ICONS.SUCCESS} Downloaded to: ${localPath}`);
    return localPath;
  } finally {
    await sftp.end().catch(() => {});
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function extractSSHOptions(options) {
  return {
    host: options.sshHost || options.host,
    username: options.sshUsername || options.username,
    password: options.sshPassword || options.password,
    identityFile: options.identityFile,
    sshPath: options.sshPath,
    sshPort: options.sshPort || 22,
    sshPassphrase: options.sshPassphrase,
  };
}

function buildConnectOptions({ sshHost, sshPort, sshUsername, sshPassword, identityFile, sshPassphrase }) {
  const opts = {
    host: sshHost,
    port: Number(sshPort),
    username: sshUsername,
  };

  if (identityFile) {
    const fs = require('fs');
    opts.privateKey = fs.readFileSync(identityFile);
    if (sshPassphrase) opts.passphrase = sshPassphrase;
  } else if (sshPassword) {
    opts.password = sshPassword;
  }

  return opts;
}

module.exports = { uploadSSH, downloadSSH };
