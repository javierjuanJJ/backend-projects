// src/compression/index.js
// Compress and decompress backup files using archiver / extract-zip

const archiver = require('archiver');
const extractZip = require('extract-zip');
const fs = require('fs');
const path = require('path');
const { logger } = require('../logging');
const { ICONS } = require('../consts/messages');

/**
 * Compress a file or directory into a .zip archive
 * @param {string} sourcePath  - Path to file or directory to compress
 * @param {string} outputPath  - Path for the output .zip file (auto-appended if not .zip)
 * @returns {Promise<string>}  - Path to the created zip file
 */
async function compress(sourcePath, outputPath) {
  if (!outputPath.endsWith('.zip')) outputPath += '.zip';

  logger.info(`${ICONS.COMPRESS} Compressing: ${path.basename(sourcePath)} → ${path.basename(outputPath)}`);

  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(outputPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', () => {
      const bytes = archive.pointer();
      logger.info(`${ICONS.SUCCESS} Compression done — ${formatBytes(bytes)}`);
      resolve(outputPath);
    });

    archive.on('warning', (err) => {
      if (err.code === 'ENOENT') {
        logger.warn(`${ICONS.WARNING} Compression warning: ${err.message}`);
      } else {
        reject(err);
      }
    });

    archive.on('error', reject);
    archive.pipe(output);

    const stat = fs.statSync(sourcePath);
    if (stat.isDirectory()) {
      archive.directory(sourcePath, path.basename(sourcePath));
    } else {
      archive.file(sourcePath, { name: path.basename(sourcePath) });
    }

    archive.finalize();
  });
}

/**
 * Decompress a .zip archive to a directory
 * @param {string} zipPath    - Path to the .zip file
 * @param {string} outputDir  - Directory to extract into
 * @returns {Promise<string>} - Path to the output directory
 */
async function decompress(zipPath, outputDir) {
  logger.info(`${ICONS.COMPRESS} Decompressing: ${path.basename(zipPath)} → ${outputDir}`);

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  await extractZip(zipPath, { dir: path.resolve(outputDir) });
  logger.info(`${ICONS.SUCCESS} Decompression done → ${outputDir}`);
  return outputDir;
}

/**
 * Determine if a file is compressed (ends with .zip)
 */
function isCompressed(filePath) {
  return filePath.endsWith('.zip');
}

function formatBytes(bytes) {
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  if (bytes === 0) return '0 B';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
}

module.exports = { compress, decompress, isCompressed };
