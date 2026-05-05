// src/logging/index.js
// Centralized logging with Winston + file rotation

const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');
const fs = require('fs');
const chalk = require('chalk');
const { ICONS } = require('../consts/messages');

// Ensure logs directory exists
const LOG_DIR = path.join(process.cwd(), 'logs');
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

// Custom format for console output (with colors and icons)
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf(({ level, message, timestamp, ...meta }) => {
    let icon = ICONS.INFO;
    let colorFn = chalk.cyan;

    switch (level) {
      case 'error':
        icon = ICONS.ERROR;
        colorFn = chalk.red;
        break;
      case 'warn':
        icon = ICONS.WARNING;
        colorFn = chalk.yellow;
        break;
      case 'info':
        icon = ICONS.INFO;
        colorFn = chalk.cyan;
        break;
      case 'debug':
        icon = ICONS.BULLET;
        colorFn = chalk.gray;
        break;
    }

    const metaStr = Object.keys(meta).length ? chalk.gray(` ${JSON.stringify(meta)}`) : '';
    return `${chalk.gray(timestamp)} ${colorFn(`${icon} ${message}`)}${metaStr}`;
  })
);

// Format for file output (clean JSON)
const fileFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Daily rotate transport for backup activity logs
const activityTransport = new DailyRotateFile({
  filename: path.join(LOG_DIR, 'backup-activity-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  maxSize: '20m',
  maxFiles: '30d',
  level: 'info',
  format: fileFormat,
});

// Error-only file
const errorTransport = new DailyRotateFile({
  filename: path.join(LOG_DIR, 'errors-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  maxSize: '10m',
  maxFiles: '30d',
  level: 'error',
  format: fileFormat,
});

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  transports: [
    new winston.transports.Console({ format: consoleFormat }),
    activityTransport,
    errorTransport,
  ],
});

/**
 * Log the start of a backup operation
 */
function logBackupStart({ database, host, dbms, backupType, storage, tables, collections }) {
  logger.info(`${ICONS.BACKUP} Backup started`, {
    event: 'BACKUP_START',
    database,
    host,
    dbms,
    backupType,
    storage,
    tables: tables || null,
    collections: collections || null,
    startTime: new Date().toISOString(),
  });
}

/**
 * Log the successful completion of a backup
 */
function logBackupSuccess({ database, filePath, sizeBytes, duration, storage }) {
  const sizeStr = formatBytes(sizeBytes);
  const durStr = formatDuration(duration);
  logger.info(`${ICONS.SUCCESS} Backup completed in ${durStr}, size: ${sizeStr}`, {
    event: 'BACKUP_SUCCESS',
    database,
    filePath,
    sizeBytes,
    duration,
    storage,
    endTime: new Date().toISOString(),
  });
}

/**
 * Log a failed backup
 */
function logBackupError({ database, error, duration }) {
  logger.error(`${ICONS.ERROR} Backup failed: ${error}`, {
    event: 'BACKUP_FAILED',
    database,
    error: error.toString(),
    stack: error.stack,
    duration,
    endTime: new Date().toISOString(),
  });
}

/**
 * Log the start of a restore
 */
function logRestoreStart({ database, filePath, dbms }) {
  logger.info(`${ICONS.RESTORE} Restore started`, {
    event: 'RESTORE_START',
    database,
    filePath,
    dbms,
    startTime: new Date().toISOString(),
  });
}

/**
 * Log successful restore
 */
function logRestoreSuccess({ database, duration }) {
  logger.info(`${ICONS.SUCCESS} Restore completed in ${formatDuration(duration)}`, {
    event: 'RESTORE_SUCCESS',
    database,
    duration,
    endTime: new Date().toISOString(),
  });
}

/**
 * Log failed restore
 */
function logRestoreError({ database, error, duration }) {
  logger.error(`${ICONS.ERROR} Restore failed: ${error}`, {
    event: 'RESTORE_FAILED',
    database,
    error: error.toString(),
    stack: error.stack,
    duration,
    endTime: new Date().toISOString(),
  });
}

// ─── Utility ─────────────────────────────────────────────────────────────────

function formatBytes(bytes) {
  if (!bytes) return 'N/A';
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  if (bytes === 0) return '0 B';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
}

function formatDuration(ms) {
  if (!ms) return 'N/A';
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  if (hours > 0) return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s (${ms}ms)`;
}

module.exports = {
  logger,
  logBackupStart,
  logBackupSuccess,
  logBackupError,
  logRestoreStart,
  logRestoreSuccess,
  logRestoreError,
  formatBytes,
  formatDuration,
};
