// src/restore/index.js
// Restore orchestrator — routes to the correct DBMS restore handler

const path = require('path');
const fs = require('fs');
const os = require('os');
const { logger, logRestoreStart, logRestoreSuccess, logRestoreError, formatDuration } = require('../logging');
const { ICONS } = require('../consts/messages');
const { DBMS } = require('../consts/databases');
const { mysqlRestore } = require('../backup/mysql');
const { postgresqlRestore } = require('../backup/postgresql');
const { mongodbRestore } = require('../backup/mongodb');
const { sqliteRestore } = require('../backup/sqlite');
const { decompress, isCompressed } = require('../compression');
const { downloadBackup } = require('../storage');
const { sendSlackNotification } = require('../notifications/slack');

/**
 * Main restore entry point
 * @param {object} options - All parsed CLI options
 */
async function runRestore(options) {
  const {
    host, port, username, password, database, dbms,
    restoreFile,
    storage,
    tables = [],
    collections = [],
    slackWebhook = process.env.SLACK_WEBHOOK_URL,
    ...storageOptions
  } = options;

  if (!restoreFile) {
    throw new Error('Restore file path is required. Use --restore-file or -rf');
  }

  const startTime = Date.now();
  logRestoreStart({ database, filePath: restoreFile, dbms });

  const tempDir = path.join(os.tmpdir(), `db-restore-${Date.now()}`);
  fs.mkdirSync(tempDir, { recursive: true });

  try {
    let localFilePath = restoreFile;

    // ── 1. Download from remote storage if needed ────────────────────────────
    if (storage && storage !== 'local') {
      logger.info(`${ICONS.DOWNLOAD} Downloading backup from ${storage}...`);
      localFilePath = await downloadBackup(restoreFile, tempDir, storage, storageOptions);
    }

    // ── 2. Decompress if needed ──────────────────────────────────────────────
    if (isCompressed(localFilePath)) {
      logger.info(`${ICONS.COMPRESS} Decompressing backup...`);
      const decompressDir = path.join(tempDir, 'decompressed');
      localFilePath = await decompress(localFilePath, decompressDir);

      // Find the actual DB file inside
      const files = fs.readdirSync(localFilePath);
      if (files.length === 1) {
        localFilePath = path.join(localFilePath, files[0]);
      }
    }

    // ── 3. Run the DBMS-specific restore ────────────────────────────────────
    await runDbmsRestore({
      dbms, host, port, username, password, database,
      filePath: localFilePath, tables, collections,
    });

    const duration = Date.now() - startTime;
    logRestoreSuccess({ database, duration });

    if (slackWebhook) {
      await sendSlackNotification(slackWebhook, {
        event: 'RESTORE_SUCCESS',
        database, dbms, host,
        filePath: restoreFile,
        duration: formatDuration(duration),
      });
    }

    logger.info(`\n${ICONS.DONE} Restore completed successfully in ${formatDuration(duration)}\n`);
    return { success: true };
  } catch (err) {
    const duration = Date.now() - startTime;
    logRestoreError({ database, error: err, duration });

    if (slackWebhook) {
      await sendSlackNotification(slackWebhook, {
        event: 'RESTORE_FAILED',
        database, dbms, host,
        error: err.message,
        duration: formatDuration(duration),
      });
    }

    throw err;
  } finally {
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch (_) {}
  }
}

/**
 * Route to the correct DBMS restore handler
 */
async function runDbmsRestore({ dbms, host, port, username, password, database, filePath, tables, collections }) {
  switch (dbms) {
    case DBMS.MYSQL:
      return mysqlRestore({ host, port, username, password, database, filePath });

    case DBMS.POSTGRESQL:
      return postgresqlRestore({ host, port, username, password, database, filePath, tables });

    case DBMS.MONGODB:
      return mongodbRestore({ host, port, username, password, database, filePath, collections });

    case DBMS.SQLITE:
      return sqliteRestore({ host, database, filePath });

    default:
      throw new Error(`Unsupported DBMS: ${dbms}`);
  }
}

module.exports = { runRestore };
