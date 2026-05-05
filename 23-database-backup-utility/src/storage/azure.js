// src/storage/azure.js
// Azure Blob Storage backend using @azure/storage-blob

const fs = require('fs');
const path = require('path');
const { BlobServiceClient, StorageSharedKeyCredential } = require('@azure/storage-blob');
const { logger } = require('../logging');
const { ICONS } = require('../consts/messages');

/**
 * Build an Azure BlobServiceClient
 *
 * Required options (one of):
 *   --azure-connection-string    Full Azure Storage connection string
 *   OR
 *   --azure-account-name + --azure-account-key
 *
 * Required options:
 *   --azure-container    Azure Blob container name
 *
 * Optional options:
 *   --azure-prefix       Blob prefix/folder (default: "backups")
 *
 * Authentication priority:
 *   1. --azure-connection-string (recommended for simplicity)
 *   2. --azure-account-name + --azure-account-key (Shared Key)
 *   3. AZURE_STORAGE_CONNECTION_STRING env var
 *   4. Managed Identity / DefaultAzureCredential (if none of the above)
 *
 * Get your connection string:
 *   Azure Portal → Storage Account → Access keys → Connection string
 *   Or via CLI: az storage account show-connection-string --name <account> --resource-group <rg>
 */
function buildAzureClient(options) {
  const connStr = options.azureConnectionString || process.env.AZURE_STORAGE_CONNECTION_STRING;

  if (connStr) {
    return BlobServiceClient.fromConnectionString(connStr);
  }

  if (options.azureAccountName && options.azureAccountKey) {
    const sharedKeyCredential = new StorageSharedKeyCredential(
      options.azureAccountName,
      options.azureAccountKey
    );
    return new BlobServiceClient(
      `https://${options.azureAccountName}.blob.core.windows.net`,
      sharedKeyCredential
    );
  }

  throw new Error(
    'Azure Blob Storage requires --azure-connection-string OR (--azure-account-name + --azure-account-key)'
  );
}

/**
 * Upload a backup file to Azure Blob Storage
 */
async function uploadAzure(sourcePath, options) {
  const { azureContainer, azurePrefix = 'backups' } = options;

  if (!azureContainer) throw new Error('Azure requires --azure-container');

  const blobServiceClient = buildAzureClient(options);
  const containerClient = blobServiceClient.getContainerClient(azureContainer);

  // Ensure container exists
  await containerClient.createIfNotExists();

  const blobName = `${azurePrefix}/${path.basename(sourcePath)}`;
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);
  const fileSize = fs.statSync(sourcePath).size;

  logger.info(`${ICONS.AZURE} Uploading to Azure: ${azureContainer}/${blobName}`);

  const fileStream = fs.createReadStream(sourcePath);
  const response = await blockBlobClient.uploadStream(
    fileStream,
    4 * 1024 * 1024, // 4MB buffer size per block
    20,              // max concurrency
    {
      blobHTTPHeaders: { blobContentType: 'application/octet-stream' },
      metadata: {
        uploadedBy: 'db-backup-cli',
        uploadDate: new Date().toISOString(),
      },
      onProgress: (ev) => {
        const pct = fileSize ? Math.round((ev.loadedBytes / fileSize) * 100) : '?';
        process.stdout.write(`\r${ICONS.UPLOAD} Upload progress: ${pct}%`);
      },
    }
  );

  process.stdout.write('\n');
  const azureUri = `https://${options.azureAccountName || 'storage'}.blob.core.windows.net/${azureContainer}/${blobName}`;
  logger.info(`${ICONS.SUCCESS} Uploaded to Azure: ${blobName}`);
  return azureUri;
}

/**
 * Download a backup from Azure Blob Storage for restore
 */
async function downloadAzure(remoteBlobName, localDir, options) {
  const { azureContainer } = options;
  if (!azureContainer) throw new Error('Azure requires --azure-container');

  const blobServiceClient = buildAzureClient(options);
  const containerClient = blobServiceClient.getContainerClient(azureContainer);
  const blockBlobClient = containerClient.getBlockBlobClient(remoteBlobName);
  const localPath = path.join(localDir, path.basename(remoteBlobName));

  logger.info(`${ICONS.DOWNLOAD} Downloading from Azure: ${azureContainer}/${remoteBlobName}`);
  await blockBlobClient.downloadToFile(localPath);
  logger.info(`${ICONS.SUCCESS} Downloaded to: ${localPath}`);
  return localPath;
}

module.exports = { uploadAzure, downloadAzure };
