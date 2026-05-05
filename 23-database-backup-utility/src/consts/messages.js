// src/consts/messages.js
// CLI icons, colors, and message templates

const ICONS = {
  // Status
  SUCCESS: '✅',
  ERROR: '❌',
  WARNING: '⚠️ ',
  INFO: 'ℹ️ ',
  PENDING: '⏳',
  RUNNING: '🔄',
  DONE: '🎉',

  // Operations
  BACKUP: '💾',
  RESTORE: '♻️ ',
  COMPRESS: '🗜️ ',
  UPLOAD: '☁️ ',
  DOWNLOAD: '📥',
  SCHEDULE: '🗓️ ',
  LOG: '📋',
  LIST: '📋',
  NOTIFY: '🔔',
  CONNECT: '🔌',
  DISCONNECT: '🔌',
  KEY: '🔑',
  LOCK: '🔒',

  // Database
  DATABASE: '🗄️ ',
  TABLE: '📊',
  COLLECTION: '📁',
  MYSQL: '🐬',
  POSTGRESQL: '🐘',
  MONGODB: '🍃',
  SQLITE: '📦',

  // Storage
  LOCAL: '💻',
  AWS: '☁️ ',
  GCS: '☁️ ',
  AZURE: '☁️ ',
  SSH: '🔐',
  FTP: '📡',
  SAMBA: '🗂️ ',
  NFS: '📂',

  // Time
  START: '🕐',
  END: '🕐',
  DURATION: '⏱️ ',

  // Actions
  CHECK: '✔️ ',
  CROSS: '✖️ ',
  ARROW: '➜',
  BULLET: '•',
  SEPARATOR: '─',
};

const COLORS = {
  SUCCESS: 'green',
  ERROR: 'red',
  WARNING: 'yellow',
  INFO: 'cyan',
  MUTED: 'gray',
  HIGHLIGHT: 'bold',
  TITLE: 'blueBright',
};

const MESSAGES = {
  BACKUP_START: (db, host) => `${ICONS.BACKUP} Starting backup of database "${db}" on ${host}...`,
  BACKUP_SUCCESS: (db, duration) => `${ICONS.SUCCESS} Backup of "${db}" completed successfully in ${duration}`,
  BACKUP_FAILED: (db, error) => `${ICONS.ERROR} Backup of "${db}" failed: ${error}`,

  RESTORE_START: (file) => `${ICONS.RESTORE} Starting restore from "${file}"...`,
  RESTORE_SUCCESS: (db, duration) => `${ICONS.SUCCESS} Restore to "${db}" completed successfully in ${duration}`,
  RESTORE_FAILED: (db, error) => `${ICONS.ERROR} Restore to "${db}" failed: ${error}`,

  COMPRESS_START: (file) => `${ICONS.COMPRESS} Compressing backup file "${file}"...`,
  COMPRESS_SUCCESS: (original, compressed) => `${ICONS.SUCCESS} Compression complete: ${original} → ${compressed}`,

  UPLOAD_START: (storage) => `${ICONS.UPLOAD} Uploading to ${storage}...`,
  UPLOAD_SUCCESS: (path) => `${ICONS.SUCCESS} Upload successful: ${path}`,
  UPLOAD_FAILED: (error) => `${ICONS.ERROR} Upload failed: ${error}`,

  CONNECT_DB: (dbms, host) => `${ICONS.CONNECT} Connecting to ${dbms} at ${host}...`,
  CONNECT_SUCCESS: (dbms) => `${ICONS.SUCCESS} Connected to ${dbms}`,
  CONNECT_FAILED: (dbms, error) => `${ICONS.ERROR} Failed to connect to ${dbms}: ${error}`,

  VALIDATION_ERROR: (field, msg) => `${ICONS.ERROR} Validation error for "${field}": ${msg}`,
  MISSING_PARAM: (param) => `${ICONS.ERROR} Missing required parameter: ${param}`,
  INCOMPATIBLE: (feature, dbms) => `${ICONS.WARNING} "${feature}" is not supported for ${dbms}`,

  SCHEDULE_SET: (cron) => `${ICONS.SCHEDULE} Backup scheduled with cron: "${cron}"`,
  NOTIFICATION_SENT: () => `${ICONS.NOTIFY} Slack notification sent`,
  NOTIFICATION_FAILED: (error) => `${ICONS.WARNING} Failed to send Slack notification: ${error}`,
};

const BANNER = `
  ██████╗ ██████╗       ██████╗  █████╗  ██████╗██╗  ██╗██╗   ██╗██████╗ 
  ██╔══██╗██╔══██╗      ██╔══██╗██╔══██╗██╔════╝██║ ██╔╝██║   ██║██╔══██╗
  ██║  ██║██████╔╝█████╗██████╔╝███████║██║     █████╔╝ ██║   ██║██████╔╝
  ██║  ██║██╔══██╗╚════╝██╔══██╗██╔══██║██║     ██╔═██╗ ██║   ██║██╔═══╝ 
  ██████╔╝██████╔╝      ██████╔╝██║  ██║╚██████╗██║  ██╗╚██████╔╝██║     
  ╚═════╝ ╚═════╝       ╚═════╝ ╚═╝  ╚═╝ ╚═════╝╚═╝  ╚═╝ ╚═════╝ ╚═╝     
`;

module.exports = { ICONS, COLORS, MESSAGES, BANNER };
