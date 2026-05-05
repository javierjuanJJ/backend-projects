// src/backup/mongodb.js
// MongoDB backup and restore operations

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const { logger } = require('../logging');
const { ICONS } = require('../consts/messages');
const { BACKUP_TYPES } = require('../consts/databases');

/**
 * Execute a MongoDB backup using mongodump
 */
async function mongodbBackup({
  host,
  port = 27017,
  username,
  password,
  database,
  backupType = BACKUP_TYPES.FULL,
  collections = [],
  outputDir,
}) {
  ensureMongodump();

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const dumpDir = path.join(
    outputDir || process.cwd(),
    `mongodb_${database}_${backupType}_${timestamp}`
  );

  fs.mkdirSync(dumpDir, { recursive: true });

  const args = buildMongodumpArgs({ host, port, username, password, database, backupType, collections, dumpDir });

  logger.info(`${ICONS.MONGODB} Running mongodump for "${database}" (${backupType})...`);

  await runCommand('mongodump', args);

  logger.info(`${ICONS.SUCCESS} MongoDB dump saved to: ${dumpDir}`);
  return dumpDir;
}

/**
 * Restore a MongoDB database from a dump directory or archive
 */
async function mongodbRestore({
  host,
  port = 27017,
  username,
  password,
  database,
  filePath,
  collections = [],
}) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Restore path not found: ${filePath}`);
  }

  logger.info(`${ICONS.RESTORE} Restoring MongoDB database "${database}" from ${filePath}...`);

  const args = [
    `--host=${host}`,
    `--port=${port}`,
    `--db=${database}`,
    '--drop', // Drop existing collections before restore
  ];

  if (username && password) {
    args.push(`--username=${username}`, `--password=${password}`, '--authenticationDatabase=admin');
  }

  // If archive file (zip was decompressed to dir)
  const stat = fs.statSync(filePath);
  if (stat.isDirectory()) {
    args.push(`--dir=${filePath}`);
  } else {
    args.push(`--archive=${filePath}`, '--gzip');
  }

  if (collections.length > 0) {
    // mongorestore handles one collection at a time with --collection
    for (const col of collections) {
      logger.info(`${ICONS.COLLECTION} Restoring collection: ${col}`);
      await runCommand('mongorestore', [...args, `--collection=${col}`]);
    }
  } else {
    await runCommand('mongorestore', args);
  }

  logger.info(`${ICONS.SUCCESS} MongoDB restore completed for "${database}"`);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildMongodumpArgs({ host, port, username, password, database, backupType, collections, dumpDir }) {
  const args = [
    `--host=${host}`,
    `--port=${port}`,
    `--db=${database}`,
    `--out=${dumpDir}`,
  ];

  if (username && password) {
    args.push(`--username=${username}`, `--password=${password}`, '--authenticationDatabase=admin');
  }

  if (backupType === BACKUP_TYPES.INCREMENTAL) {
    // MongoDB uses oplog for incremental backups
    args.push('--oplog');
    logger.warn(`${ICONS.WARNING} MongoDB incremental backup uses oplog. Ensure oplog is enabled (replica set required).`);
  }

  if (collections.length > 0) {
    // mongodump only supports one collection per run with --collection
    // For multiple, we run separate commands; here we just log and use first
    args.push(`--collection=${collections[0]}`);
    if (collections.length > 1) {
      logger.warn(`${ICONS.WARNING} mongodump only supports one collection per run. Use multiple backup commands for: ${collections.slice(1).join(', ')}`);
    }
    logger.info(`${ICONS.COLLECTION} Backing up collection: ${collections[0]}`);
  }

  return args;
}

function runCommand(command, args) {
  return new Promise((resolve, reject) => {
    const proc = spawn(command, args, { stdio: ['inherit', 'inherit', 'pipe'] });

    let stderr = '';
    proc.stderr.on('data', (d) => { stderr += d.toString(); });

    proc.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`${command} exited with code ${code}: ${stderr}`));
      } else {
        resolve();
      }
    });

    proc.on('error', (err) => reject(new Error(`Failed to start ${command}: ${err.message}`)));
  });
}

function ensureMongodump() {
  try {
    execSync('mongodump --version', { stdio: 'ignore' });
  } catch {
    throw new Error('mongodump not found. Please install MongoDB Database Tools.');
  }
}

module.exports = { mongodbBackup, mongodbRestore };
