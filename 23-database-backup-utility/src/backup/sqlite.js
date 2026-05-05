// src/backup/sqlite.js
// SQLite backup and restore operations

const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');
const { logger } = require('../logging');
const { ICONS } = require('../consts/messages');
const { BACKUP_TYPES } = require('../consts/databases');

/**
 * Execute a SQLite backup
 * For SQLite, --host is the path to the .db file (since it's file-based)
 */
async function sqliteBackup({
  host, // For SQLite, host is treated as the file path to the .db
  database, // Can also be used as file path if host is a server
  backupType = BACKUP_TYPES.FULL,
  tables = [],
  outputDir,
  outputFile,
}) {
  // SQLite file path: prefer --database as file path, fall back to --host
  const dbFilePath = database || host;

  if (!fs.existsSync(dbFilePath)) {
    throw new Error(`SQLite database file not found: ${dbFilePath}`);
  }

  if (backupType !== BACKUP_TYPES.FULL) {
    logger.warn(`${ICONS.WARNING} SQLite only supports full backups. Ignoring backup type "${backupType}".`);
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const dbName = path.basename(dbFilePath, '.db');
  const filename = outputFile || `sqlite_${dbName}_full_${timestamp}.sql`;
  const filePath = path.join(outputDir || process.cwd(), filename);

  logger.info(`${ICONS.SQLITE} Backing up SQLite database: ${dbFilePath}`);

  if (tables.length > 0) {
    // Export specific tables via .dump command
    await dumpSpecificTables(dbFilePath, tables, filePath);
    logger.info(`${ICONS.TABLE} Backed up tables: ${tables.join(', ')}`);
  } else {
    // Full dump: copy file (fastest) or use .dump via sqlite3
    await dumpFull(dbFilePath, filePath);
  }

  logger.info(`${ICONS.SUCCESS} SQLite backup saved to: ${filePath}`);
  return filePath;
}

/**
 * Restore a SQLite database from a SQL dump
 */
async function sqliteRestore({
  database,
  host,
  filePath,
}) {
  const dbFilePath = database || host;

  if (!fs.existsSync(filePath)) {
    throw new Error(`Restore file not found: ${filePath}`);
  }

  logger.info(`${ICONS.RESTORE} Restoring SQLite database to: ${dbFilePath}`);

  // Create parent directory if needed
  const dir = path.dirname(dbFilePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // If restoring from a .db file copy
  if (filePath.endsWith('.db')) {
    fs.copyFileSync(filePath, dbFilePath);
  } else {
    // Restore from SQL dump using sqlite3
    await runSqliteCommand(dbFilePath, [`.read ${filePath}`]);
  }

  logger.info(`${ICONS.SUCCESS} SQLite restore completed to: ${dbFilePath}`);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function dumpFull(dbFilePath, outputFile) {
  try {
    execSync('sqlite3 --version', { stdio: 'ignore' });
    // Use sqlite3 .dump for SQL export
    const dump = execSync(`sqlite3 "${dbFilePath}" .dump`, { maxBuffer: 500 * 1024 * 1024 });
    fs.writeFileSync(outputFile, dump);
  } catch (err) {
    if (err.message.includes('sqlite3')) {
      // Fallback: binary copy of the .db file
      logger.warn(`${ICONS.WARNING} sqlite3 CLI not found. Falling back to binary file copy.`);
      const binaryOutput = outputFile.replace('.sql', '.db');
      fs.copyFileSync(dbFilePath, binaryOutput);
      return binaryOutput;
    }
    throw err;
  }
}

async function dumpSpecificTables(dbFilePath, tables, outputFile) {
  execSync('sqlite3 --version', { stdio: 'ignore' });

  let sqlDump = '';
  for (const table of tables) {
    const dump = execSync(`sqlite3 "${dbFilePath}" ".dump ${table}"`, {
      maxBuffer: 200 * 1024 * 1024,
    }).toString();
    sqlDump += dump + '\n';
  }
  fs.writeFileSync(outputFile, sqlDump);
}

function runSqliteCommand(dbFilePath, commands) {
  return new Promise((resolve, reject) => {
    const proc = spawn('sqlite3', [dbFilePath], { stdio: ['pipe', 'inherit', 'pipe'] });

    commands.forEach((cmd) => proc.stdin.write(cmd + '\n'));
    proc.stdin.end();

    let stderr = '';
    proc.stderr.on('data', (d) => { stderr += d.toString(); });

    proc.on('close', (code) => {
      if (code !== 0) reject(new Error(`sqlite3 exited with code ${code}: ${stderr}`));
      else resolve();
    });

    proc.on('error', (err) => reject(new Error(`Failed to start sqlite3: ${err.message}`)));
  });
}

module.exports = { sqliteBackup, sqliteRestore };
