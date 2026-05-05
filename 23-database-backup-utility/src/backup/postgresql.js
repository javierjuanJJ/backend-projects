// src/backup/postgresql.js
// PostgreSQL backup and restore operations

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const { logger } = require('../logging');
const { ICONS } = require('../consts/messages');
const { BACKUP_TYPES } = require('../consts/databases');

/**
 * Execute a PostgreSQL backup using pg_dump
 */
async function postgresqlBackup({
  host,
  port = 5432,
  username,
  password,
  database,
  backupType = BACKUP_TYPES.FULL,
  tables = [],
  outputDir,
  outputFile,
}) {
  ensurePgDump();

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const ext = tables.length > 0 ? '.sql' : '.dump';
  const filename = outputFile || `postgresql_${database}_${backupType}_${timestamp}${ext}`;
  const filePath = path.join(outputDir || process.cwd(), filename);

  const env = {
    ...process.env,
    PGPASSWORD: password,
    PGHOST: host,
    PGPORT: String(port),
    PGUSER: username,
    PGDATABASE: database,
  };

  const args = buildPgDumpArgs({ database, backupType, tables, filePath });

  logger.info(`${ICONS.POSTGRESQL} Running pg_dump for "${database}" (${backupType})...`);

  await runCommand('pg_dump', args, env);

  logger.info(`${ICONS.SUCCESS} PostgreSQL dump saved to: ${filePath}`);
  return filePath;
}

/**
 * Restore a PostgreSQL database from a dump file
 */
async function postgresqlRestore({
  host,
  port = 5432,
  username,
  password,
  database,
  filePath,
  tables = [],
}) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Restore file not found: ${filePath}`);
  }

  const env = {
    ...process.env,
    PGPASSWORD: password,
    PGHOST: host,
    PGPORT: String(port),
    PGUSER: username,
  };

  const isSql = filePath.endsWith('.sql');
  logger.info(`${ICONS.RESTORE} Restoring PostgreSQL database "${database}" from ${filePath}...`);

  if (isSql) {
    // Use psql for plain SQL files
    const args = ['-d', database, '-f', filePath];
    if (tables.length > 0) {
      logger.warn(`${ICONS.WARNING} Selective table restore with .sql files requires manual filtering`);
    }
    await runCommand('psql', args, env);
  } else {
    // Use pg_restore for custom format
    const args = ['-d', database, '--clean', '--if-exists'];
    if (tables.length > 0) {
      tables.forEach((t) => args.push('-t', t));
      logger.info(`${ICONS.TABLE} Restoring specific tables: ${tables.join(', ')}`);
    }
    args.push(filePath);
    await runCommand('pg_restore', args, env);
  }

  logger.info(`${ICONS.SUCCESS} PostgreSQL restore completed for "${database}"`);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildPgDumpArgs({ database, backupType, tables, filePath }) {
  const args = [];

  if (backupType === BACKUP_TYPES.FULL) {
    if (tables.length > 0) {
      // Plain SQL for specific tables
      tables.forEach((t) => args.push('-t', t));
      args.push('-f', filePath);
      logger.info(`${ICONS.TABLE} Backing up specific tables: ${tables.join(', ')}`);
    } else {
      // Custom format (binary) for full backup — allows selective restore later
      args.push('-Fc', '-f', filePath);
    }
  } else if (backupType === BACKUP_TYPES.INCREMENTAL) {
    // pg_basebackup for incremental (WAL-based)
    const dir = filePath.replace('.dump', '_wal');
    args.push('--wal-method=stream', '-D', dir);
    logger.warn(`${ICONS.WARNING} Incremental PostgreSQL backup uses pg_basebackup. Directory: ${dir}`);
    return ['pg_basebackup', args]; // Override command
  } else if (backupType === BACKUP_TYPES.DIFFERENTIAL) {
    args.push('-Fc', '-f', filePath);
    logger.warn(`${ICONS.WARNING} Differential backup uses custom format; combine with WAL archiving for true differential`);
  }

  args.push(database);
  return args;
}

function runCommand(command, args, env) {
  return new Promise((resolve, reject) => {
    const proc = spawn(command, args, { stdio: ['inherit', 'inherit', 'pipe'], env });

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

function ensurePgDump() {
  try {
    execSync('pg_dump --version', { stdio: 'ignore' });
  } catch {
    throw new Error('pg_dump not found. Please install PostgreSQL client tools.');
  }
}

module.exports = { postgresqlBackup, postgresqlRestore };
