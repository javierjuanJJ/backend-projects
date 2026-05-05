// src/storage/samba.js
// Samba (SMB) storage backend using samba-client

const fs = require('fs');
const path = require('path');
const SambaClient = require('samba-client');
const { logger } = require('../logging');
const { ICONS } = require('../consts/messages');

/**
 * Upload a backup file to a Samba/SMB share
 *
 * Required options:
 *   --smb-host      Samba server hostname or IP
 *   --smb-share     Share name (e.g. "backups" maps to \\server\backups)
 *
 * Optional options:
 *   --smb-username  SMB username (default: guest)
 *   --smb-password  SMB password
 *   --smb-domain    Windows domain/workgroup (default: WORKGROUP)
 *   --smb-path      Sub-directory inside the share (default: /)
 *   --smb-port      SMB port (default: 445)
 *
 * Note: No --identity-file is required for Samba.
 * Requires smbclient installed on the system.
 *
 * Example:
 *   db-backup backup -h 10.0.0.5 -u admin -db mydb --dbms mysql \
 *     -s samba --smb-host 192.168.1.20 --smb-share backups \
 *     --smb-username smbuser --smb-password secret --smb-path /mysql
 */
async function uploadSamba(sourcePath, options) {
  const {
    smbHost,
    smbShare,
    smbUsername = 'guest',
    smbPassword = '',
    smbDomain = 'WORKGROUP',
    smbPath = '/',
    smbPort = 445,
  } = options;

  if (!smbHost) throw new Error('Samba requires --smb-host');
  if (!smbShare) throw new Error('Samba requires --smb-share');

  const client = new SambaClient({
    address: `//${smbHost}/${smbShare}`,
    username: smbUsername,
    password: smbPassword,
    domain: smbDomain,
    port: smbPort,
  });

  const remoteDir = smbPath.replace(/\/$/, '');
  const remoteFile = `${remoteDir}/${path.basename(sourcePath)}`;

  logger.info(`${ICONS.SAMBA} Uploading to Samba: //${smbHost}/${smbShare}${remoteFile}`);

  try {
    await client.sendFile(sourcePath, remoteFile);
    logger.info(`${ICONS.SUCCESS} Uploaded to Samba: //${smbHost}/${smbShare}${remoteFile}`);
    return `smb://${smbHost}/${smbShare}${remoteFile}`;
  } catch (err) {
    throw new Error(`Samba upload failed: ${err.message}. Ensure smbclient is installed and the share is accessible.`);
  }
}

/**
 * Download a backup from a Samba share for restore
 */
async function downloadSamba(remoteFilePath, localDir, options) {
  const { smbHost, smbShare, smbUsername = 'guest', smbPassword = '', smbDomain = 'WORKGROUP', smbPort = 445 } = options;

  const client = new SambaClient({
    address: `//${smbHost}/${smbShare}`,
    username: smbUsername,
    password: smbPassword,
    domain: smbDomain,
    port: smbPort,
  });

  const localPath = path.join(localDir, path.basename(remoteFilePath));
  logger.info(`${ICONS.DOWNLOAD} Downloading from Samba: //${smbHost}/${smbShare}${remoteFilePath}`);

  try {
    await client.getFile(remoteFilePath, localPath);
    logger.info(`${ICONS.SUCCESS} Downloaded to: ${localPath}`);
    return localPath;
  } catch (err) {
    throw new Error(`Samba download failed: ${err.message}`);
  }
}

module.exports = { uploadSamba, downloadSamba };
