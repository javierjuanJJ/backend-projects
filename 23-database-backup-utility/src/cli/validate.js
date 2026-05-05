// src/cli/validate.js
// CLI argument validation — checks compatibility and required params

const chalk = require('chalk');
const { DBMS, BACKUP_TYPES, DBMS_BACKUP_TYPE_SUPPORT, DBMS_TABLE_SUPPORT, DBMS_COLLECTION_SUPPORT } = require('../consts/databases');
const { STORAGE_BACKENDS, STORAGE_ALIASES, STORAGE_REQUIRES_IDENTITY } = require('../consts/storage');
const { ICONS } = require('../consts/messages');
const { logger } = require('../logging');

/**
 * Validate backup options
 * Throws with a descriptive message on any incompatibility
 */
function validateBackupOptions(opts) {
  const errors = [];

  // ── Required core params ──────────────────────────────────────────────────
  if (!opts.dbms) errors.push(`${ICONS.ERROR} --dbms is required. Supported: ${Object.values(DBMS).join(', ')}`);
  if (!opts.database && opts.dbms !== DBMS.SQLITE) errors.push(`${ICONS.ERROR} --database-name (-db) is required`);
  if (!opts.host) errors.push(`${ICONS.ERROR} --host (-h) is required`);
  if (!opts.username && opts.dbms !== DBMS.SQLITE) errors.push(`${ICONS.ERROR} --username (-u) is required`);
  if (!opts.password && opts.dbms !== DBMS.SQLITE) errors.push(`${ICONS.ERROR} --password (-p) is required`);
  if (!opts.storage) errors.push(`${ICONS.ERROR} --storage (-s) is required`);

  // ── DBMS validation ───────────────────────────────────────────────────────
  if (opts.dbms && !Object.values(DBMS).includes(opts.dbms)) {
    errors.push(`${ICONS.ERROR} Unknown DBMS: "${opts.dbms}". Supported: ${Object.values(DBMS).join(', ')}`);
  }

  // ── Backup type compatibility ─────────────────────────────────────────────
  if (opts.dbms && opts.backupType) {
    const supported = DBMS_BACKUP_TYPE_SUPPORT[opts.dbms] || [];
    if (!supported.includes(opts.backupType)) {
      errors.push(
        `${ICONS.ERROR} Backup type "${opts.backupType}" is not supported for ${opts.dbms}.\n` +
        `  Supported types for ${opts.dbms}: ${supported.join(', ')}`
      );
    }
  }

  // ── Tables compatibility ──────────────────────────────────────────────────
  if (opts.tables && opts.tables.length > 0 && opts.dbms) {
    if (!DBMS_TABLE_SUPPORT[opts.dbms]) {
      errors.push(
        `${ICONS.ERROR} --tables is not supported for ${opts.dbms}. ` +
        `Tables are supported for: ${Object.entries(DBMS_TABLE_SUPPORT).filter(([, v]) => v).map(([k]) => k).join(', ')}`
      );
    }
  }

  // ── Collections compatibility ─────────────────────────────────────────────
  if (opts.collections && opts.collections.length > 0 && opts.dbms) {
    if (!DBMS_COLLECTION_SUPPORT[opts.dbms]) {
      errors.push(
        `${ICONS.ERROR} --collections is not supported for ${opts.dbms}. ` +
        `Collections are supported for: ${Object.entries(DBMS_COLLECTION_SUPPORT).filter(([, v]) => v).map(([k]) => k).join(', ')}`
      );
    }
  }

  // ── Can't specify both tables and collections ─────────────────────────────
  if (opts.tables?.length && opts.collections?.length) {
    errors.push(`${ICONS.ERROR} Cannot use both --tables and --collections at the same time`);
  }

  // ── Storage validation ────────────────────────────────────────────────────
  if (opts.storage) {
    const storageKey = STORAGE_ALIASES[opts.storage.toLowerCase().trim()];
    if (!storageKey) {
      errors.push(
        `${ICONS.ERROR} Unknown storage backend: "${opts.storage}".\n` +
        `  Supported: ${Object.keys(STORAGE_ALIASES).filter((k, i, arr) => arr.indexOf(k) === i).join(', ')}`
      );
    }

    // Identity file required for SSH
    if (storageKey && STORAGE_REQUIRES_IDENTITY[storageKey] && !opts.identityFile) {
      errors.push(`${ICONS.ERROR} --identity-file (-i) is required for SSH storage`);
    }

    // Local requires save-path
    if (storageKey === STORAGE_BACKENDS.LOCAL && !opts.savePath) {
      errors.push(`${ICONS.ERROR} --save-path is required for local storage`);
    }

    // NFS requires nfsMountPath
    if (storageKey === STORAGE_BACKENDS.NFS && !opts.nfsMountPath) {
      errors.push(`${ICONS.ERROR} --nfs-mount-path is required for NFS storage`);
    }

    // AWS S3 requires bucket
    if (storageKey === STORAGE_BACKENDS.AWS_S3 && !opts.awsBucket) {
      errors.push(`${ICONS.ERROR} --aws-bucket is required for AWS S3 storage`);
    }

    // GCS requires bucket
    if (storageKey === STORAGE_BACKENDS.GCS && !opts.gcsBucket) {
      errors.push(`${ICONS.ERROR} --gcs-bucket is required for GCS storage`);
    }

    // Azure requires container
    if (storageKey === STORAGE_BACKENDS.AZURE && !opts.azureContainer) {
      errors.push(`${ICONS.ERROR} --azure-container is required for Azure storage`);
    }
  }

  if (errors.length > 0) {
    console.error(chalk.red('\n' + '─'.repeat(60)));
    console.error(chalk.red.bold('  Validation Errors:'));
    errors.forEach((e) => console.error(chalk.red(`  ${e}`)));
    console.error(chalk.red('─'.repeat(60) + '\n'));
    process.exit(1);
  }
}

/**
 * Validate restore options
 */
function validateRestoreOptions(opts) {
  const errors = [];

  if (!opts.dbms) errors.push(`${ICONS.ERROR} --dbms is required`);
  if (!opts.database && opts.dbms !== DBMS.SQLITE) errors.push(`${ICONS.ERROR} --database-name (-db) is required`);
  if (!opts.host) errors.push(`${ICONS.ERROR} --host (-h) is required`);
  if (!opts.username && opts.dbms !== DBMS.SQLITE) errors.push(`${ICONS.ERROR} --username (-u) is required`);
  if (!opts.password && opts.dbms !== DBMS.SQLITE) errors.push(`${ICONS.ERROR} --password (-p) is required`);
  if (!opts.restoreFile) errors.push(`${ICONS.ERROR} --restore-file (-rf) is required`);

  if (errors.length > 0) {
    console.error(chalk.red('\n' + '─'.repeat(60)));
    console.error(chalk.red.bold('  Validation Errors:'));
    errors.forEach((e) => console.error(chalk.red(`  ${e}`)));
    console.error(chalk.red('─'.repeat(60) + '\n'));
    process.exit(1);
  }
}

module.exports = { validateBackupOptions, validateRestoreOptions };
