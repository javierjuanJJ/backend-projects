// src/backup/mysql.js
// MySQL backup and restore operations

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const { logger } = require('../logging');
const { ICONS } = require('../consts/messages');
const { BACKUP_TYPES } = require('../consts/databases');

/**
 * Execute a MySQL backup (dump)
 * @param {object} options
 * @returns {Promise<string>} - Path to the generated backup file
 */
async function mysqlBackup({
  host,
  port = 3306,
  username,
  password,
  database,
  backupType = BACKUP_TYPES.FULL,
  tables = [],
  outputDir,
  outputFile,
}) {
  ensureMysqldump();

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = outputFile || `mysql_${database}_${backupType}_${timestamp}.sql`;
  const filePath = path.join(outputDir || process.cwd(), filename);

  // Build mysqldump args
  const args = buildMysqldumpArgs({ host, port, username, password, database, backupType, tables });

  logger.info(`${ICONS.MYSQL} Running mysqldump for "${database}" (${backupType})...`);

  await runCommand('mysqldump', args, filePath);

  logger.info(`${ICONS.SUCCESS} MySQL dump saved to: ${filePath}`);
  return filePath;
}

/**
 * Restore a MySQL database from a dump file
 */
async function mysqlRestore({
  host,
  port = 3306,
  username,
  password,
  database,
  filePath,
}) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Restore file not found: ${filePath}`);
  }

  logger.info(`${ICONS.RESTORE} Restoring MySQL database "${database}" from ${filePath}...`);

  const env = { ...process.env, MYSQL_PWD: password };
  const args = [
    `-h${host}`,
    `-P${port}`,
    `-u${username}`,
    database,
  ];

  await runCommandFromFile('mysql', args, filePath, env);
  logger.info(`${ICONS.SUCCESS} MySQL restore completed for "${database}"`);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildMysqldumpArgs({ host, port, username, password, database, backupType, tables }) {
  const args = [
    `-h${host}`,
    `-P${port}`,
    `-u${username}`,
    `--password=${password}`,
    '--single-transaction',
    '--routines',
    '--triggers',
    '--events',
  ];

  if (backupType === BACKUP_TYPES.INCREMENTAL) {
    // Incremental: use binary log position (requires binlog enabled)
    args.push('--master-data=2', '--flush-logs');
    logger.warn(`${ICONS.WARNING} MySQL incremental backup requires binary logging enabled on the server`);
  }

  if (backupType === BACKUP_TYPES.DIFFERENTIAL) {
    args.push('--flush-logs', '--master-data=2');
    logger.warn(`${ICONS.WARNING} MySQL differential backup is based on binary logs since last full backup`);
  }

  args.push(database);

  if (tables && tables.length > 0) {
    args.push(...tables);
    logger.info(`${ICONS.TABLE} Backing up specific tables: ${tables.join(', ')}`);
  }

  return args;
}

function runCommand(command, args, outputFile) {
  return new Promise((resolve, reject) => {
    const outputStream = fs.createWriteStream(outputFile);
    const proc = spawn(command, args, { stdio: ['inherit', 'pipe', 'pipe'] });

    proc.stdout.pipe(outputStream);

    let stderr = '';
    proc.stderr.on('data', (data) => { stderr += data.toString(); });

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

function runCommandFromFile(command, args, inputFile, env) {
  return new Promise((resolve, reject) => {
    const inputStream = fs.createReadStream(inputFile);
    const proc = spawn(command, args, { stdio: ['pipe', 'inherit', 'pipe'], env });

    inputStream.pipe(proc.stdin);

    let stderr = '';
    proc.stderr.on('data', (data) => { stderr += data.toString(); });

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

function ensureMysqldump() {
  try {
    execSync('mysqldump --version', { stdio: 'ignore' });
  } catch {
    throw new Error('mysqldump not found. Please install MySQL client tools.');
  }
}

module.exports = { mysqlBackup, mysqlRestore };
