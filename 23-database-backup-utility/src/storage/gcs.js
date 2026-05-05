// src/storage/gcs.js
// Google Cloud Storage backend using @google-cloud/storage

const fs = require('fs');
const path = require('path');
const { Storage } = require('@google-cloud/storage');
const { logger } = require('../logging');
const { ICONS } = require('../consts/messages');

/**
 * Build a GCS client
 *
 * Required options:
 *   --gcs-bucket        GCS bucket name
 *
 * Optional options:
 *   --gcs-key-file      Path to service account JSON key file
 *                       (falls back to GOOGLE_APPLICATION_CREDENTIALS env var,
 *                        then Application Default Credentials / Workload Identity)
 *   --gcs-project-id    Google Cloud project ID
 *   --gcs-prefix        Object prefix/folder inside the bucket
 *
 * Authentication priority:
 *   1. --gcs-key-file (service account JSON)
 *   2. GOOGLE_APPLICATION_CREDENTIALS env var
 *   3. gcloud auth application-default credentials
 *   4. Compute Engine / GKE Workload Identity metadata server
 */
function buildGCSClient(options) {
  const config = {};

  if (options.gcsKeyFile) {
    config.keyFilename = options.gcsKeyFile;
  }
  if (options.gcsProjectId) {
    config.projectId = options.gcsProjectId;
  }

  return new Storage(config);
}

/**
 * Upload a backup file to Google Cloud Storage
 */
async function uploadGCS(sourcePath, options) {
  const { gcsBucket, gcsPrefix = 'backups' } = options;

  if (!gcsBucket) throw new Error('GCS requires --gcs-bucket');

  const storage = buildGCSClient(options);
  const bucket = storage.bucket(gcsBucket);
  const destFileName = `${gcsPrefix}/${path.basename(sourcePath)}`;

  logger.info(`${ICONS.GCS} Uploading to GCS: gs://${gcsBucket}/${destFileName}`);

  const fileSize = fs.statSync(sourcePath).size;
  let uploaded = 0;

  await bucket.upload(sourcePath, {
    destination: destFileName,
    metadata: {
      contentType: 'application/octet-stream',
      metadata: {
        uploadedBy: 'db-backup-cli',
        uploadDate: new Date().toISOString(),
      },
    },
    resumable: fileSize > 5 * 1024 * 1024, // Use resumable upload for files > 5MB
    onUploadProgress: (evt) => {
      uploaded = evt.bytesWritten;
      const pct = fileSize ? Math.round((uploaded / fileSize) * 100) : '?';
      process.stdout.write(`\r${ICONS.UPLOAD} Upload progress: ${pct}%`);
    },
  });

  process.stdout.write('\n');
  const gcsUri = `gs://${gcsBucket}/${destFileName}`;
  logger.info(`${ICONS.SUCCESS} Uploaded to: ${gcsUri}`);
  return gcsUri;
}

/**
 * Download a backup file from GCS for restore
 */
async function downloadGCS(remoteKey, localDir, options) {
  const { gcsBucket } = options;
  if (!gcsBucket) throw new Error('GCS requires --gcs-bucket');

  const storage = buildGCSClient(options);
  const bucket = storage.bucket(gcsBucket);
  const localPath = path.join(localDir, path.basename(remoteKey));

  logger.info(`${ICONS.DOWNLOAD} Downloading from GCS: gs://${gcsBucket}/${remoteKey}`);

  await bucket.file(remoteKey).download({ destination: localPath });
  logger.info(`${ICONS.SUCCESS} Downloaded to: ${localPath}`);
  return localPath;
}

module.exports = { uploadGCS, downloadGCS };
