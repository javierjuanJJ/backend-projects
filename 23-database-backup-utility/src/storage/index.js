// src/storage/index.js
// Storage router — dispatches upload/download to the correct backend

const { STORAGE_BACKENDS, STORAGE_ALIASES } = require('../consts/storage');
const { logger } = require('../logging');
const { ICONS } = require('../consts/messages');

const { uploadLocal, downloadLocal } = require('./local');
const { uploadS3, downloadS3 } = require('./aws-s3');
const { uploadGCS, downloadGCS } = require('./gcs');
const { uploadAzure, downloadAzure } = require('./azure');
const { uploadSSH, downloadSSH } = require('./ssh');
const { uploadFTP, downloadFTP } = require('./ftp');
const { uploadSamba, downloadSamba } = require('./samba');
const { uploadNFS, downloadNFS } = require('./nfs');

/**
 * Normalize a storage string from CLI input to a backend constant
 */
function resolveStorage(storageInput) {
  if (!storageInput) throw new Error('Storage backend is required (-s / --storage)');
  const normalized = STORAGE_ALIASES[storageInput.toLowerCase().trim()];
  if (!normalized) {
    throw new Error(
      `Unknown storage backend: "${storageInput}"\n` +
      `Supported: ${Object.keys(STORAGE_ALIASES).join(', ')}`
    );
  }
  return normalized;
}

/**
 * Upload a backup file to the configured storage backend
 * @param {string} sourcePath - Local path to the backup file
 * @param {string} storage    - Storage backend key (from CLI)
 * @param {object} options    - All parsed CLI options
 * @returns {Promise<string>} - Remote path or URI of the uploaded file
 */
async function uploadBackup(sourcePath, storage, options) {
  const backend = resolveStorage(storage);

  logger.info(`${ICONS.UPLOAD} Storage backend: ${backend}`);

  switch (backend) {
    case STORAGE_BACKENDS.LOCAL:
      return uploadLocal(sourcePath, options);

    case STORAGE_BACKENDS.AWS_S3:
      return uploadS3(sourcePath, options);

    case STORAGE_BACKENDS.GCS:
      return uploadGCS(sourcePath, options);

    case STORAGE_BACKENDS.AZURE:
      return uploadAzure(sourcePath, options);

    case STORAGE_BACKENDS.SSH:
      return uploadSSH(sourcePath, options);

    case STORAGE_BACKENDS.FTP:
      return uploadFTP(sourcePath, options);

    case STORAGE_BACKENDS.SAMBA:
      return uploadSamba(sourcePath, options);

    case STORAGE_BACKENDS.NFS:
      return uploadNFS(sourcePath, options);

    default:
      throw new Error(`No upload handler for storage backend: ${backend}`);
  }
}

/**
 * Download a backup file from the configured storage backend
 * @param {string} remoteKey - Remote file path or key
 * @param {string} localDir  - Local directory to download into
 * @param {string} storage   - Storage backend key
 * @param {object} options   - All parsed CLI options
 * @returns {Promise<string>} - Local path to the downloaded file
 */
async function downloadBackup(remoteKey, localDir, storage, options) {
  const backend = resolveStorage(storage);

  logger.info(`${ICONS.DOWNLOAD} Downloading from: ${backend}`);

  switch (backend) {
    case STORAGE_BACKENDS.LOCAL:
      return downloadLocal(remoteKey, localDir);

    case STORAGE_BACKENDS.AWS_S3:
      return downloadS3(remoteKey, localDir, options);

    case STORAGE_BACKENDS.GCS:
      return downloadGCS(remoteKey, localDir, options);

    case STORAGE_BACKENDS.AZURE:
      return downloadAzure(remoteKey, localDir, options);

    case STORAGE_BACKENDS.SSH:
      return downloadSSH(remoteKey, localDir, options);

    case STORAGE_BACKENDS.FTP:
      return downloadFTP(remoteKey, localDir, options);

    case STORAGE_BACKENDS.SAMBA:
      return downloadSamba(remoteKey, localDir, options);

    case STORAGE_BACKENDS.NFS:
      return downloadNFS(remoteKey, localDir, options);

    default:
      throw new Error(`No download handler for storage backend: ${backend}`);
  }
}

module.exports = { uploadBackup, downloadBackup, resolveStorage };
