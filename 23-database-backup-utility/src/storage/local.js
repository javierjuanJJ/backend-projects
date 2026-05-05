// src/storage/local.js
// Local filesystem storage backend

const fs = require('fs');
const path = require('path');
const { logger } = require('../logging');
const { ICONS } = require('../consts/messages');

/**
 * Save a backup file to local filesystem
 * @param {string} sourcePath - Temporary backup file path
 * @param {object} options
 * @param {string} options.savePath - Destination directory or full file path
 * @returns {Promise<string>} - Final destination path
 */
async function uploadLocal(sourcePath, { savePath }) {
  if (!savePath) throw new Error('Local storage requires --save-path');

  // Determine destination
  let destPath;
  const stat = fs.existsSync(savePath) ? fs.statSync(savePath) : null;

  if (stat && stat.isDirectory()) {
    destPath = path.join(savePath, path.basename(sourcePath));
  } else {
    // Treat savePath as full file path — create parent dirs if needed
    const destDir = path.dirname(savePath);
    fs.mkdirSync(destDir, { recursive: true });
    destPath = savePath;
  }

  // Create destination directory if it doesn't exist
  if (!fs.existsSync(path.dirname(destPath))) {
    fs.mkdirSync(path.dirname(destPath), { recursive: true });
  }

  logger.info(`${ICONS.LOCAL} Saving backup to: ${destPath}`);
  fs.copyFileSync(sourcePath, destPath);
  logger.info(`${ICONS.SUCCESS} Backup saved locally: ${destPath}`);

  return destPath;
}

/**
 * Download/copy a backup file from local path for restore
 */
async function downloadLocal(remotePath, localDir) {
  const destPath = path.join(localDir, path.basename(remotePath));
  fs.copyFileSync(remotePath, destPath);
  return destPath;
}

module.exports = { uploadLocal, downloadLocal };
