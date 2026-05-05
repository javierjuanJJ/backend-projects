// src/storage/aws-s3.js
// AWS S3 storage backend using @aws-sdk/client-s3 v3

const fs = require('fs');
const path = require('path');
const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const { Upload } = require('@aws-sdk/lib-storage');
const { logger } = require('../logging');
const { ICONS } = require('../consts/messages');

/**
 * Build an S3 client from options
 *
 * Required options:
 *   --aws-bucket       Target S3 bucket name
 *   --aws-region       AWS region (e.g. us-east-1)
 *
 * Optional options:
 *   --aws-access-key-id       AWS Access Key ID (falls back to env/IAM)
 *   --aws-secret-access-key   AWS Secret Access Key
 *   --aws-session-token       Temporary session token (STS/AssumeRole)
 *   --aws-endpoint            Custom endpoint URL (e.g. MinIO, LocalStack)
 *   --aws-force-path-style    Force path-style URLs (needed for MinIO)
 *   --aws-s3-prefix           Key prefix/folder inside the bucket
 *
 * Authentication priority:
 *   1. --aws-access-key-id + --aws-secret-access-key (explicit)
 *   2. AWS_ACCESS_KEY_ID + AWS_SECRET_ACCESS_KEY env vars
 *   3. ~/.aws/credentials file (default profile or AWS_PROFILE)
 *   4. EC2/ECS/Lambda IAM role (automatic)
 */
function buildS3Client(options) {
  const config = {
    region: options.awsRegion || process.env.AWS_REGION || 'us-east-1',
  };

  if (options.awsAccessKeyId && options.awsSecretAccessKey) {
    config.credentials = {
      accessKeyId: options.awsAccessKeyId,
      secretAccessKey: options.awsSecretAccessKey,
      ...(options.awsSessionToken ? { sessionToken: options.awsSessionToken } : {}),
    };
  }

  if (options.awsEndpoint) {
    config.endpoint = options.awsEndpoint;
    config.forcePathStyle = options.awsForcePathStyle || false;
  }

  return new S3Client(config);
}

/**
 * Upload a backup file to S3
 */
async function uploadS3(sourcePath, options) {
  const { awsBucket, awsS3Prefix = 'backups' } = options;

  if (!awsBucket) throw new Error('AWS S3 requires --aws-bucket');

  const client = buildS3Client(options);
  const key = `${awsS3Prefix}/${path.basename(sourcePath)}`;
  const fileStream = fs.createReadStream(sourcePath);
  const fileSize = fs.statSync(sourcePath).size;

  logger.info(`${ICONS.AWS} Uploading to S3: s3://${awsBucket}/${key}`);

  const upload = new Upload({
    client,
    params: {
      Bucket: awsBucket,
      Key: key,
      Body: fileStream,
      ContentType: 'application/octet-stream',
      Metadata: {
        'uploaded-by': 'db-backup-cli',
        'upload-date': new Date().toISOString(),
      },
    },
    queueSize: 4,       // parallel upload parts
    partSize: 5 * 1024 * 1024, // 5 MB per part (multipart)
  });

  upload.on('httpUploadProgress', (progress) => {
    const pct = progress.total
      ? Math.round((progress.loaded / progress.total) * 100)
      : '?';
    process.stdout.write(`\r${ICONS.UPLOAD} Upload progress: ${pct}%`);
  });

  await upload.done();
  process.stdout.write('\n');

  const s3Uri = `s3://${awsBucket}/${key}`;
  logger.info(`${ICONS.SUCCESS} Uploaded to: ${s3Uri}`);
  return s3Uri;
}

/**
 * Download a backup file from S3 for restore
 */
async function downloadS3(remoteKey, localDir, options) {
  const { awsBucket } = options;
  if (!awsBucket) throw new Error('AWS S3 requires --aws-bucket');

  const client = buildS3Client(options);
  const localPath = path.join(localDir, path.basename(remoteKey));

  logger.info(`${ICONS.DOWNLOAD} Downloading from S3: s3://${awsBucket}/${remoteKey}`);

  const { Body } = await client.send(new GetObjectCommand({ Bucket: awsBucket, Key: remoteKey }));

  await new Promise((resolve, reject) => {
    const writeStream = fs.createWriteStream(localPath);
    Body.pipe(writeStream);
    writeStream.on('finish', resolve);
    writeStream.on('error', reject);
  });

  logger.info(`${ICONS.SUCCESS} Downloaded to: ${localPath}`);
  return localPath;
}

module.exports = { uploadS3, downloadS3 };
