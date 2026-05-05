// src/storage/nfs.js
// NFS storage backend — uses Node.js fs (NFS must already be mounted on the system)

const fs = require('fs');
const path = require('path');
const { logger } = require('../logging');
const { ICONS } = require('../consts/messages');

/**
 * Upload a backup file to an NFS mount point
 *
 * Required options:
 *   --nfs-mount-path    Local mount point of the NFS share
 *                       (The NFS share must already be mounted on the system
 *                        via /etc/fstab or `mount` command)
 *
 * Optional options:
 *   --nfs-path          Sub-directory inside the mount point (default: /)
 *
 * Note: No --identity-file, --username, or --password is required for NFS.
 * NFS access control is handled at the server (exports) and OS level.
 *
 * How to mount NFS before using this tool:
 *   Linux:   sudo mount -t nfs 192.168.1.10:/exports/backups /mnt/nfs-backups
 *   macOS:   sudo mount -t nfs 192.168.1.10:/exports/backups /mnt/nfs-backups
 *   Windows: Use "Map Network Drive" or: mount \\192.168.1.10\backups Z:
 *
 * Example:
 *   db-backup backup -h localhost -u root -db mydb --dbms mysql \
 *     -s nfs --nfs-mount-path /mnt/nfs-backups --nfs-path /mysql
 */
async function uploadNFS(sourcePath, options) {
  const { nfsMountPath, nfsPath = '/' } = options;

  if (!nfsMountPath) throw new Error('NFS storage requires --nfs-mount-path');

  if (!fs.existsSync(nfsMountPath)) {
    throw new Error(
      `NFS mount point not found: ${nfsMountPath}\n` +
      `Ensure the NFS share is mounted. Example:\n` +
      `  sudo mount -t nfs <server>:<export> ${nfsMountPath}`
    );
  }

  const destDir = path.join(nfsMountPath, nfsPath.replace(/^\//, ''));

  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }

  const destPath = path.join(destDir, path.basename(sourcePath));

  logger.info(`${ICONS.NFS} Copying backup to NFS: ${destPath}`);

  // Stream copy for large files
  await streamCopy(sourcePath, destPath);

  logger.info(`${ICONS.SUCCESS} Backup saved to NFS: ${destPath}`);
  return destPath;
}

/**
 * Download from NFS (copy from mount point to local temp dir)
 */
async function downloadNFS(remoteFilePath, localDir, options) {
  const { nfsMountPath } = options;
  if (!nfsMountPath) throw new Error('NFS storage requires --nfs-mount-path');

  // remoteFilePath may be absolute or relative to mount
  const sourcePath = path.isAbsolute(remoteFilePath)
    ? remoteFilePath
    : path.join(nfsMountPath, remoteFilePath);

  const localPath = path.join(localDir, path.basename(sourcePath));

  logger.info(`${ICONS.DOWNLOAD} Copying from NFS: ${sourcePath}`);
  await streamCopy(sourcePath, localPath);
  logger.info(`${ICONS.SUCCESS} Downloaded to: ${localPath}`);
  return localPath;
}

/**
 * Stream file copy (handles large files without loading into memory)
 */
function streamCopy(src, dest) {
  return new Promise((resolve, reject) => {
    const total = fs.statSync(src).size;
    let transferred = 0;

    const readStream = fs.createReadStream(src);
    const writeStream = fs.createWriteStream(dest);

    readStream.on('data', (chunk) => {
      transferred += chunk.length;
      const pct = Math.round((transferred / total) * 100);
      process.stdout.write(`\r${ICONS.UPLOAD} Copy progress: ${pct}%`);
    });

    readStream.on('error', reject);
    writeStream.on('error', reject);
    writeStream.on('finish', () => {
      process.stdout.write('\n');
      resolve();
    });

    readStream.pipe(writeStream);
  });
}

module.exports = { uploadNFS, downloadNFS };
