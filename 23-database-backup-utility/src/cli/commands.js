// src/cli/commands.js
// Commander command definitions for backup, restore, and schedule

const { Command } = require('commander');
const chalk = require('chalk');
const { printBanner, printStorageHelp } = require('./help');
const { validateBackupOptions, validateRestoreOptions } = require('./validate');
const { runBackup } = require('../backup');
const { loadConfig, printExampleConfig } = require('./config');
const { dryRunBackup, dryRunRestore } = require('./dryRun');
const { listBackups } = require('../storage/list');
const { runRestore } = require('../restore');
const { runSchedule } = require('../scheduler');
const { logger } = require('../logging');
const { ICONS } = require('../consts/messages');

/**
 * Parse comma-separated string into trimmed array
 */
function parseList(val) {
  return val.split(',').map((s) => s.trim()).filter(Boolean);
}

/**
 * Build and return the root CLI program
 */
function buildCLI() {
  const program = new Command();

  program
    .name('db-backup')
    .description('Universal database backup & restore CLI')
    .version('1.0.0')
    .hook('preAction', (thisCommand, actionCommand) => {
      // Only print banner for real action commands (not help-storage which prints its own)
      if (actionCommand.name() !== 'help-storage') printBanner();
    });

  // ──────────────────────────────────────────────────────────────────────────
  // BACKUP COMMAND
  // ──────────────────────────────────────────────────────────────────────────
  program
    .command('backup')
    .description(`${ICONS.BACKUP} Create a database backup`)
    .addHelpText('after', `
${chalk.bold('Core Options:')}
  -h, --host <IP>                     Database host IP or hostname
  -u, --username <USERNAME>           Database username
  -p, --password <PASSWORD>           Database password
  -db, --database-name <NAME>         Database name to back up
  --dbms <DBMS>                       DBMS type: mysql | postgresql | mongodb | sqlite
  -bt, --backup-type <TYPE>           Backup type: full | incremental | differential (default: full)
  -c, --compression                   Compress the backup file (zip)
  -s, --storage <STORAGE>             Storage backend (see --help-storage)
  -i, --identity-file <PATH>          Path to SSH private key (required for ssh storage)
  --port <PORT>                       Database port (uses DBMS default if omitted)
  -t, --tables <TABLES>               Tables to back up (comma-separated, MySQL/PostgreSQL/SQLite only)
  -cl, --collections <COLLECTIONS>    Collections to back up (comma-separated, MongoDB only)
  --slack-webhook <URL>               Slack incoming webhook URL for notifications

${chalk.bold('Storage-specific Options (see --help-storage <STORAGE> for details):')}
  Local:   --save-path <PATH>
  AWS S3:  --aws-bucket, --aws-region, --aws-access-key-id, --aws-secret-access-key, ...
  GCS:     --gcs-bucket, --gcs-key-file, --gcs-project-id, ...
  Azure:   --azure-connection-string, --azure-container, ...
  SSH:     --ssh-path, --ssh-port, --ssh-passphrase
  FTP:     --ftp-host, --ftp-username, --ftp-password, --ftp-path, --ftp-port, --ftp-secure
  Samba:   --smb-host, --smb-share, --smb-username, --smb-password, --smb-domain, --smb-path
  NFS:     --nfs-mount-path, --nfs-path

${chalk.bold('Examples:')}
  ${chalk.gray('Full MySQL backup to local directory:')}
  db-backup backup -h localhost -u root -p pass -db myapp --dbms mysql \\
    -s local --save-path /backups

  ${chalk.gray('PostgreSQL specific tables to AWS S3 with compression:')}
  db-backup backup -h db.example.com -u admin -p pass -db shop --dbms postgresql \\
    -bt full -t orders,products -c -s aws-s3 --aws-bucket my-backups --aws-region us-east-1

  ${chalk.gray('MongoDB collection backup via SSH with Slack notification:')}
  db-backup backup -h mongo.prod -u mongouser -p pass -db catalog --dbms mongodb \\
    -cl products,inventory -s ssh -i ~/.ssh/id_rsa --ssh-path /mnt/backups \\
    --slack-webhook https://hooks.slack.com/services/xxx/yyy/zzz

  ${chalk.gray('SQLite backup to GCS:')}
  db-backup backup -h /var/db/app.db --dbms sqlite \\
    -s gcs --gcs-bucket my-bucket --gcs-key-file /etc/gcp/key.json
`)
    // Core DB options
    .option('-h, --host <IP>', 'Database host IP or hostname')
    .option('-u, --username <USERNAME>', 'Database username')
    .option('-p, --password <PASSWORD>', 'Database password')
    .option('-db, --database-name <NAME>', 'Database name')
    .option('--dbms <DBMS>', 'DBMS type: mysql | postgresql | mongodb | sqlite')
    .option('--port <PORT>', 'Database port (default varies per DBMS)', parseInt)
    .option('-bt, --backup-type <TYPE>', 'Backup type: full | incremental | differential', 'full')
    .option('-c, --compression', 'Compress backup file (zip)', false)
    .option('-s, --storage <STORAGE>', 'Storage backend')
    .option('-i, --identity-file <PATH>', 'Path to SSH private key')
    .option('-t, --tables <TABLES>', 'Tables to backup (comma-separated)', parseList)
    .option('-cl, --collections <COLLECTIONS>', 'Collections to backup (comma-separated)', parseList)
    .option('--slack-webhook <URL>', 'Slack webhook URL for notifications')
    // Local
    .option('--save-path <PATH>', 'Local save path (for --storage local)')
    // AWS S3
    .option('--aws-bucket <BUCKET>', 'S3 bucket name')
    .option('--aws-region <REGION>', 'AWS region', 'us-east-1')
    .option('--aws-access-key-id <KEY>', 'AWS Access Key ID')
    .option('--aws-secret-access-key <KEY>', 'AWS Secret Access Key')
    .option('--aws-session-token <TOKEN>', 'AWS Session Token')
    .option('--aws-endpoint <URL>', 'Custom S3-compatible endpoint')
    .option('--aws-force-path-style', 'Force S3 path-style (for MinIO)', false)
    .option('--aws-s3-prefix <PREFIX>', 'S3 key prefix', 'backups')
    // GCS
    .option('--gcs-bucket <BUCKET>', 'GCS bucket name')
    .option('--gcs-key-file <PATH>', 'GCS service account JSON key file')
    .option('--gcs-project-id <ID>', 'Google Cloud project ID')
    .option('--gcs-prefix <PREFIX>', 'GCS object prefix', 'backups')
    // Azure
    .option('--azure-connection-string <STRING>', 'Azure Storage connection string')
    .option('--azure-container <NAME>', 'Azure Blob container name')
    .option('--azure-account-name <NAME>', 'Azure Storage account name')
    .option('--azure-account-key <KEY>', 'Azure Storage account key')
    .option('--azure-prefix <PREFIX>', 'Azure blob prefix', 'backups')
    // SSH
    .option('--ssh-path <PATH>', 'Remote directory path for SSH/SFTP storage')
    .option('--ssh-port <PORT>', 'SSH port', '22')
    .option('--ssh-passphrase <PASS>', 'Passphrase for encrypted SSH key')
    // FTP
    .option('--ftp-host <HOST>', 'FTP server hostname')
    .option('--ftp-username <USER>', 'FTP username')
    .option('--ftp-password <PASS>', 'FTP password')
    .option('--ftp-path <PATH>', 'FTP remote directory path')
    .option('--ftp-port <PORT>', 'FTP port', '21')
    .option('--ftp-secure', 'Enable FTPS/TLS', false)
    // Samba
    .option('--smb-host <HOST>', 'Samba server hostname')
    .option('--smb-share <SHARE>', 'Samba share name')
    .option('--smb-username <USER>', 'Samba username', 'guest')
    .option('--smb-password <PASS>', 'Samba password')
    .option('--smb-domain <DOMAIN>', 'Windows domain/workgroup', 'WORKGROUP')
    .option('--smb-path <PATH>', 'Sub-directory in Samba share')
    .option('--smb-port <PORT>', 'Samba port', '445')
    // NFS
    .option('--nfs-mount-path <PATH>', 'Local NFS mount point')
    .option('--nfs-path <PATH>', 'Sub-directory inside NFS mount', '/')
    .option('--dry-run', 'Simulate backup without executing (shows plan + validation)', false)
    .option('--config <PATH>', 'Path to JSON config file (CLI flags override config)')
    .action(async (opts) => {
      mapDatabaseNameAlias(opts);
      const merged = loadConfig(opts.config, opts);
      mapDatabaseNameAlias(merged);
      validateBackupOptions(merged);
      if (merged.dryRun) {
        dryRunBackup(merged);
        return;
      }
      try {
        await runBackup(merged);
      } catch (err) {
        logger.error(`${ICONS.ERROR} ${err.message}`);
        process.exit(1);
      }
    });

  // ──────────────────────────────────────────────────────────────────────────
  // RESTORE COMMAND
  // ──────────────────────────────────────────────────────────────────────────
  program
    .command('restore')
    .description(`${ICONS.RESTORE} Restore a database from a backup file`)
    .addHelpText('after', `
${chalk.bold('Examples:')}
  ${chalk.gray('Restore MySQL from local file:')}
  db-backup restore -h localhost -u root -p pass -db myapp --dbms mysql \\
    -rf /backups/mysql_myapp_full_2024.sql

  ${chalk.gray('Restore PostgreSQL specific tables from S3:')}
  db-backup restore -h localhost -u postgres -p pass -db shop --dbms postgresql \\
    -rf backups/postgresql_shop_full_2024.dump -t orders,products \\
    -s aws-s3 --aws-bucket my-backups

  ${chalk.gray('Restore MongoDB collections from compressed SSH backup:')}
  db-backup restore -h localhost -u mongo -p pass -db catalog --dbms mongodb \\
    -rf /mnt/backups/mongodb_catalog_full_2024.zip \\
    -cl products,inventory
`)
    .option('-h, --host <IP>', 'Database host IP or hostname')
    .option('-u, --username <USERNAME>', 'Database username')
    .option('-p, --password <PASSWORD>', 'Database password')
    .option('-db, --database-name <NAME>', 'Target database name')
    .option('--dbms <DBMS>', 'DBMS type: mysql | postgresql | mongodb | sqlite')
    .option('--port <PORT>', 'Database port', parseInt)
    .option('-rf, --restore-file <PATH>', 'Path to backup file (local or remote key)')
    .option('-s, --storage <STORAGE>', 'Storage backend to download from (optional)')
    .option('-i, --identity-file <PATH>', 'SSH private key (for SSH storage)')
    .option('-t, --tables <TABLES>', 'Tables to restore (comma-separated, PostgreSQL only)', parseList)
    .option('-cl, --collections <COLLECTIONS>', 'Collections to restore (comma-separated, MongoDB only)', parseList)
    .option('--slack-webhook <URL>', 'Slack webhook URL for notifications')
    // Storage options (same as backup for download)
    .option('--save-path <PATH>', 'Local save path')
    .option('--aws-bucket <BUCKET>', 'S3 bucket name')
    .option('--aws-region <REGION>', 'AWS region', 'us-east-1')
    .option('--aws-access-key-id <KEY>', 'AWS Access Key ID')
    .option('--aws-secret-access-key <KEY>', 'AWS Secret Access Key')
    .option('--gcs-bucket <BUCKET>', 'GCS bucket name')
    .option('--gcs-key-file <PATH>', 'GCS service account key file')
    .option('--azure-connection-string <STRING>', 'Azure connection string')
    .option('--azure-container <NAME>', 'Azure container name')
    .option('--ssh-path <PATH>', 'Remote path for SSH/SFTP')
    .option('--ssh-port <PORT>', 'SSH port', '22')
    .option('--ftp-host <HOST>', 'FTP server')
    .option('--ftp-username <USER>', 'FTP username')
    .option('--ftp-password <PASS>', 'FTP password')
    .option('--ftp-port <PORT>', 'FTP port', '21')
    .option('--ftp-secure', 'Enable FTPS', false)
    .option('--smb-host <HOST>', 'Samba server')
    .option('--smb-share <SHARE>', 'Samba share')
    .option('--smb-username <USER>', 'Samba username')
    .option('--smb-password <PASS>', 'Samba password')
    .option('--nfs-mount-path <PATH>', 'NFS mount point')
    .option('--dry-run', 'Simulate restore without executing', false)
    .option('--config <PATH>', 'Path to JSON config file')
    .action(async (opts) => {
      mapDatabaseNameAlias(opts);
      const merged = loadConfig(opts.config, opts);
      mapDatabaseNameAlias(merged);
      validateRestoreOptions(merged);
      if (merged.dryRun) {
        dryRunRestore(merged);
        return;
      }
      try {
        await runRestore(merged);
      } catch (err) {
        logger.error(`${ICONS.ERROR} ${err.message}`);
        process.exit(1);
      }
    });

  // ──────────────────────────────────────────────────────────────────────────
  // SCHEDULE COMMAND
  // ──────────────────────────────────────────────────────────────────────────
  program
    .command('schedule')
    .description(`${ICONS.SCHEDULE} Schedule automatic backups with cron`)
    .addHelpText('after', `
${chalk.bold('Examples:')}
  ${chalk.gray('Daily backup at 2am:')}
  db-backup schedule --cron "0 2 * * *" -h localhost -u root -p pass \\
    -db myapp --dbms mysql -s local --save-path /backups

  ${chalk.gray('Every 6 hours, MongoDB to S3:')}
  db-backup schedule --cron "0 */6 * * *" -h mongo.prod -u user -p pass \\
    -db catalog --dbms mongodb -s aws-s3 --aws-bucket my-backups
`)
    .option('--cron <EXPRESSION>', 'Cron expression for schedule (e.g. "0 2 * * *")')
    // All backup options passthrough
    .option('-h, --host <IP>', 'Database host')
    .option('-u, --username <USERNAME>', 'Database username')
    .option('-p, --password <PASSWORD>', 'Database password')
    .option('-db, --database-name <NAME>', 'Database name')
    .option('--dbms <DBMS>', 'DBMS type')
    .option('-bt, --backup-type <TYPE>', 'Backup type', 'full')
    .option('-c, --compression', 'Compress backup', false)
    .option('-s, --storage <STORAGE>', 'Storage backend')
    .option('-i, --identity-file <PATH>', 'SSH key path')
    .option('-t, --tables <TABLES>', 'Tables (comma-separated)', parseList)
    .option('-cl, --collections <COLLECTIONS>', 'Collections (comma-separated)', parseList)
    .option('--slack-webhook <URL>', 'Slack webhook URL')
    .option('--save-path <PATH>', 'Local save path')
    .option('--aws-bucket <BUCKET>', 'S3 bucket')
    .option('--aws-region <REGION>', 'AWS region', 'us-east-1')
    .option('--aws-access-key-id <KEY>', 'AWS Access Key ID')
    .option('--aws-secret-access-key <KEY>', 'AWS Secret Access Key')
    .option('--gcs-bucket <BUCKET>', 'GCS bucket')
    .option('--gcs-key-file <PATH>', 'GCS key file')
    .option('--azure-connection-string <STRING>', 'Azure connection string')
    .option('--azure-container <NAME>', 'Azure container')
    .option('--ssh-path <PATH>', 'SSH remote path')
    .option('--ftp-host <HOST>', 'FTP host')
    .option('--ftp-username <USER>', 'FTP username')
    .option('--ftp-password <PASS>', 'FTP password')
    .option('--ftp-path <PATH>', 'FTP path')
    .option('--smb-host <HOST>', 'SMB host')
    .option('--smb-share <SHARE>', 'SMB share')
    .option('--nfs-mount-path <PATH>', 'NFS mount path')
    .action(async (opts) => {
      mapDatabaseNameAlias(opts);
      if (!opts.cron) {
        logger.error(`${ICONS.ERROR} --cron expression is required for scheduling`);
        process.exit(1);
      }
      validateBackupOptions(opts);
      await runSchedule(opts);
    });

  // ──────────────────────────────────────────────────────────────────────────
  // STORAGE HELP COMMAND
  // ──────────────────────────────────────────────────────────────────────────
  program
    .command('help-storage [STORAGE]')
    .description(`${ICONS.INFO} Show detailed help for a storage backend`)
    .addHelpText('after', `
${chalk.bold('Available storage backends:')}
  local, aws-s3, gcs, azure, ssh, ftp, samba, nfs

${chalk.bold('Examples:')}
  db-backup help-storage
  db-backup help-storage aws-s3
  db-backup help-storage ssh
`)
    .action((storageType) => {
      printBanner();
      printStorageHelp(storageType);
    });

  // ── LIST COMMAND ──────────────────────────────────────────────────────────
  program
    .command('list')
    .description(`${ICONS.LIST || '📋'} List backups in a storage backend`)
    .option('-s, --storage <STORAGE>', 'Storage backend to list from')
    .option('--prefix <PREFIX>', 'Filter by filename prefix')
    .option('--save-path <PATH>', 'Local directory')
    .option('--aws-bucket <BUCKET>', 'S3 bucket')
    .option('--aws-region <REGION>', 'AWS region', 'us-east-1')
    .option('--aws-access-key-id <KEY>', 'AWS Access Key ID')
    .option('--aws-secret-access-key <KEY>', 'AWS Secret Access Key')
    .option('--aws-endpoint <URL>', 'Custom S3 endpoint')
    .option('--aws-s3-prefix <PREFIX>', 'S3 prefix', 'backups')
    .option('--gcs-bucket <BUCKET>', 'GCS bucket')
    .option('--gcs-key-file <PATH>', 'GCS key file')
    .option('--gcs-prefix <PREFIX>', 'GCS prefix', 'backups')
    .option('--azure-connection-string <STRING>', 'Azure connection string')
    .option('--azure-container <n>', 'Azure container')
    .option('--azure-prefix <PREFIX>', 'Azure prefix', 'backups')
    .option('-h, --host <HOST>', 'SSH/FTP host')
    .option('-u, --username <USER>', 'SSH/FTP username')
    .option('-p, --password <PASS>', 'SSH/FTP password')
    .option('-i, --identity-file <PATH>', 'SSH private key')
    .option('--ssh-path <PATH>', 'SSH remote directory')
    .option('--ssh-port <PORT>', 'SSH port', '22')
    .option('--ftp-host <HOST>', 'FTP host')
    .option('--ftp-username <USER>', 'FTP username')
    .option('--ftp-password <PASS>', 'FTP password')
    .option('--ftp-path <PATH>', 'FTP path')
    .option('--ftp-port <PORT>', 'FTP port', '21')
    .option('--ftp-secure', 'FTPS', false)
    .option('--nfs-mount-path <PATH>', 'NFS mount point')
    .option('--nfs-path <PATH>', 'NFS sub-path', '/')
    .action(async (opts) => {
      if (!opts.storage) {
        logger.error(`${ICONS.ERROR} --storage (-s) is required`);
        process.exit(1);
      }
      try {
        await listBackups(opts.storage, opts, opts.prefix);
      } catch (err) {
        logger.error(`${ICONS.ERROR} ${err.message}`);
        process.exit(1);
      }
    });

  // ── CONFIG EXAMPLE COMMAND ─────────────────────────────────────────────────
  program
    .command('config-example')
    .description(`ℹ️  Print an example config JSON file`)
    .action(() => printExampleConfig());

  return program;
}

/**
 * Commander uses camelCase for options with dashes.
 * Map --database-name → databaseName → database, etc.
 */
function mapDatabaseNameAlias(opts) {
  if (opts.databaseName) opts.database = opts.databaseName;
  if (opts.backupType) opts.backupType = opts.backupType;
  if (opts.identityFile) opts.identityFile = opts.identityFile;
  if (opts.restoreFile) opts.restoreFile = opts.restoreFile;
}

module.exports = { buildCLI };
