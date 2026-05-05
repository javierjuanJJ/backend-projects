// src/backup/index.js
// Backup orchestrator — routes to the correct DBMS handler

const path = require('path');
const os = require('os');
const { logger, logBackupStart, logBackupSuccess, logBackupError, formatDuration } = require('../logging');
const { ICONS } = require('../consts/messages');
const { DBMS, BACKUP_TYPES, DBMS_BACKUP_TYPE_SUPPORT, DBMS_TABLE_SUPPORT, DBMS_COLLECTION_SUPPORT } = require('../consts/databases');
const { mysqlBackup } = require('./mysql');
const { postgresqlBackup } = require('./postgresql');
const { mongodbBackup } = require('./mongodb');
const { sqliteBackup } = require('./sqlite');
const { compress } = require('../compression');
const { uploadBackup } = require('../storage');
const { sendSlackNotification } = require('../notifications/slack');

/**
 * Main backup entry point
 * @param {object} options - All parsed CLI options
 */
async function runBackup(options) {
  const {
    host, port, username, password, database, dbms,
    backupType = BACKUP_TYPES.FULL,
    compression = false,
    storage,
    tables = [],
    collections = [],
    slackWebhook = process.env.SLACK_WEBHOOK_URL,
    // Storage-specific options passed through
    ...storageOptions
  } = options;

  // Use temp dir as staging area
  const tempDir = path.join(os.tmpdir(), `db-backup-${Date.now()}`);
  const fs = require('fs');
  fs.mkdirSync(tempDir, { recursive: true });

  const startTime = Date.now();

  logBackupStart({ database, host, dbms, backupType, storage, tables, collections });

  let backupPath;

  try {
    // ── 1. Run the DBMS-specific backup ─────────────────────────────────────
    backupPath = await runDbmsBackup({
      dbms, host, port, username, password, database,
      backupType, tables, collections, outputDir: tempDir,
    });

    // ── 2. Optionally compress ───────────────────────────────────────────────
    if (compression) {
      logger.info(`${ICONS.COMPRESS} Compressing backup...`);
      backupPath = await compress(backupPath, backupPath);
    }

    // ── 3. Upload to storage backend ─────────────────────────────────────────
    const remotePath = await uploadBackup(backupPath, storage, storageOptions);

    const duration = Date.now() - startTime;
    const stat = fs.statSync(backupPath);

    logBackupSuccess({
      database,
      filePath: remotePath || backupPath,
      sizeBytes: stat.size,
      duration,
      storage,
    });

    // ── 4. Optional Slack notification ───────────────────────────────────────
    if (slackWebhook) {
      await sendSlackNotification(slackWebhook, {
        event: 'BACKUP_SUCCESS',
        database, dbms, host, backupType, storage,
        filePath: remotePath || backupPath,
        duration: formatDuration(duration),
        sizeBytes: stat.size,
      });
    }

    logger.info(`\n${ICONS.DONE} All done! Backup completed in ${formatDuration(duration)}\n`);
    return { success: true, filePath: remotePath || backupPath };
  } catch (err) {
    const duration = Date.now() - startTime;
    logBackupError({ database, error: err, duration });

    if (slackWebhook) {
      await sendSlackNotification(slackWebhook, {
        event: 'BACKUP_FAILED',
        database, dbms, host, backupType, storage,
        error: err.message,
        duration: formatDuration(duration),
      });
    }

    throw err;
  } finally {
    // Cleanup temp directory
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch (_) {
      // ignore cleanup errors
    }
  }
}

/**
 * Route to the correct DBMS backup handler
 */
async function runDbmsBackup({ dbms, host, port, username, password, database, backupType, tables, collections, outputDir }) {
  switch (dbms) {
    case DBMS.MYSQL:
      return mysqlBackup({ host, port, username, password, database, backupType, tables, outputDir });

    case DBMS.POSTGRESQL:
      return postgresqlBackup({ host, port, username, password, database, backupType, tables, outputDir });

    case DBMS.MONGODB:
      return mongodbBackup({ host, port, username, password, database, backupType, collections, outputDir });

    case DBMS.SQLITE:
      return sqliteBackup({ host, database, backupType, tables, outputDir });

    default:
      throw new Error(`Unsupported DBMS: ${dbms}. Supported: ${Object.values(DBMS).join(', ')}`);
  }
}

module.exports = { runBackup };
