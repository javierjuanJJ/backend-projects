// src/storage/ftp.js
// FTP/FTPS storage backend using basic-ftp

const fs = require('fs');
const path = require('path');
const ftp = require('basic-ftp');
const { logger } = require('../logging');
const { ICONS } = require('../consts/messages');

/**
 * Upload a backup file via FTP/FTPS
 *
 * Required options:
 *   --ftp-host        FTP server hostname or IP
 *   --ftp-username    FTP username
 *   --ftp-password    FTP password
 *   --ftp-path        Remote destination directory path
 *
 * Optional options:
 *   --ftp-port        FTP port (default: 21)
 *   --ftp-secure      Enable FTPS (TLS) — true/false (default: false)
 *   --ftp-passive     Use passive mode — true/false (default: true)
 *
 * Note: No --identity-file is required for FTP.
 * FTPS (--ftp-secure) is strongly recommended over plain FTP.
 *
 * Example:
 *   db-backup backup -h 192.168.1.10 -u admin -db mydb --dbms postgresql \
 *     -s ftp --ftp-host ftp.example.com --ftp-username ftpuser \
 *     --ftp-password secret --ftp-path /backups/postgresql --ftp-secure
 */
async function uploadFTP(sourcePath, options) {
  const {
    ftpHost,
    ftpUsername,
    ftpPassword,
    ftpPath,
    ftpPort = 21,
    ftpSecure = false,
  } = options;

  if (!ftpHost) throw new Error('FTP storage requires --ftp-host');
  if (!ftpUsername) throw new Error('FTP storage requires --ftp-username');
  if (!ftpPassword) throw new Error('FTP storage requires --ftp-password');
  if (!ftpPath) throw new Error('FTP storage requires --ftp-path');

  const client = new ftp.Client();
  client.ftp.verbose = false;

  try {
    logger.info(`${ICONS.FTP} Connecting to FTP${ftpSecure ? 'S' : ''}: ${ftpHost}:${ftpPort}`);
    await client.access({
      host: ftpHost,
      port: Number(ftpPort),
      user: ftpUsername,
      password: ftpPassword,
      secure: ftpSecure,
      secureOptions: ftpSecure ? { rejectUnauthorized: false } : undefined,
    });

    // Ensure remote directory exists
    await client.ensureDir(ftpPath);

    const remotePath = `${ftpPath.replace(/\/$/, '')}/${path.basename(sourcePath)}`;
    logger.info(`${ICONS.UPLOAD} Uploading via FTP to: ${remotePath}`);

    client.trackProgress((info) => {
      if (info.bytes > 0) {
        process.stdout.write(`\r${ICONS.UPLOAD} Uploaded: ${formatBytes(info.bytes)}`);
      }
    });

    await client.uploadFrom(sourcePath, path.basename(sourcePath));
    client.trackProgress();
    process.stdout.write('\n');

    logger.info(`${ICONS.SUCCESS} Uploaded to FTP: ${ftpHost}${remotePath}`);
    return `ftp://${ftpHost}:${ftpPort}${remotePath}`;
  } finally {
    client.close();
  }
}

/**
 * Download a backup file via FTP for restore
 */
async function downloadFTP(remoteFilePath, localDir, options) {
  const { ftpHost, ftpUsername, ftpPassword, ftpPort = 21, ftpSecure = false } = options;

  const client = new ftp.Client();

  try {
    await client.access({
      host: ftpHost,
      port: Number(ftpPort),
      user: ftpUsername,
      password: ftpPassword,
      secure: ftpSecure,
    });

    const localPath = path.join(localDir, path.basename(remoteFilePath));
    logger.info(`${ICONS.DOWNLOAD} Downloading from FTP: ${remoteFilePath}`);
    await client.downloadTo(localPath, remoteFilePath);
    logger.info(`${ICONS.SUCCESS} Downloaded to: ${localPath}`);
    return localPath;
  } finally {
    client.close();
  }
}

function formatBytes(bytes) {
  const sizes = ['B', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 B';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
}

module.exports = { uploadFTP, downloadFTP };
