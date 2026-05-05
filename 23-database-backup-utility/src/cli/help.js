// src/cli/help.js
// Rich help text with icons, examples, and storage-specific parameter docs

const chalk = require('chalk');
const { ICONS, BANNER } = require('../consts/messages');

function printBanner() {
  console.log(chalk.cyanBright(BANNER));
  console.log(chalk.gray('  Universal Database Backup & Restore CLI\n'));
}

function printStorageHelp(storageType) {
  const help = STORAGE_HELP[storageType?.toLowerCase()];
  if (help) {
    console.log(help);
  } else {
    Object.values(STORAGE_HELP).forEach((h) => console.log(h));
  }
}

const STORAGE_HELP = {
  local: chalk.white(`
${chalk.bold.yellow(`${ICONS.LOCAL} LOCAL STORAGE`)}
  Save the backup directly to a local directory or file path.
  ${chalk.gray('No identity file, username, or password required for storage.')}

  ${chalk.bold('Additional Required Parameters:')}
    ${chalk.cyan('--save-path')} <PATH>        Destination directory or full file path

  ${chalk.bold('Examples:')}
    ${chalk.gray('# Full MySQL backup saved locally')}
    db-backup backup -h localhost -u root -p secret -db myapp --dbms mysql \\
      -s local --save-path /mnt/backups/mysql

    ${chalk.gray('# PostgreSQL backup with compression to specific file')}
    db-backup backup -h 10.0.0.1 -u postgres -p pass -db orders --dbms postgresql \\
      -s local --save-path /backups/orders.dump.zip -c
`),

  'aws-s3': chalk.white(`
${chalk.bold.yellow(`${ICONS.AWS} AWS S3 STORAGE`)}
  Upload backups to Amazon S3. Supports multipart upload for large files.
  ${chalk.gray('Authentication uses AWS SDK credential chain (env vars, ~/.aws/credentials, IAM role).')}

  ${chalk.bold('Required Parameters:')}
    ${chalk.cyan('--aws-bucket')} <BUCKET>         S3 bucket name

  ${chalk.bold('Optional Parameters:')}
    ${chalk.cyan('--aws-region')} <REGION>          AWS region (default: us-east-1)
    ${chalk.cyan('--aws-access-key-id')} <KEY>      AWS Access Key ID
    ${chalk.cyan('--aws-secret-access-key')} <KEY>  AWS Secret Access Key
    ${chalk.cyan('--aws-session-token')} <TOKEN>    Temporary session token (STS)
    ${chalk.cyan('--aws-endpoint')} <URL>           Custom endpoint (MinIO, LocalStack)
    ${chalk.cyan('--aws-force-path-style')}         Force path-style URLs (for MinIO)
    ${chalk.cyan('--aws-s3-prefix')} <PREFIX>       Key prefix inside bucket (default: backups)

  ${chalk.bold('Examples:')}
    ${chalk.gray('# Backup using IAM role (no keys needed on EC2)')}
    db-backup backup -h rds.aws.com -u admin -p pass -db prod --dbms postgresql \\
      -s aws-s3 --aws-bucket my-db-backups --aws-region eu-west-1

    ${chalk.gray('# Backup with explicit keys and prefix')}
    db-backup backup -h localhost -u root -p pass -db shop --dbms mysql \\
      -s aws-s3 --aws-bucket my-backups --aws-access-key-id AKIA... \\
      --aws-secret-access-key abc123 --aws-s3-prefix mysql/daily

    ${chalk.gray('# Backup to MinIO (self-hosted S3-compatible)')}
    db-backup backup -h localhost -u root -p pass -db mydb --dbms mysql \\
      -s aws-s3 --aws-bucket mybucket --aws-endpoint http://localhost:9000 \\
      --aws-access-key-id minioadmin --aws-secret-access-key minioadmin \\
      --aws-force-path-style
`),

  gcs: chalk.white(`
${chalk.bold.yellow(`${ICONS.GCS} GOOGLE CLOUD STORAGE`)}
  Upload backups to GCS. Supports resumable uploads for large files.
  ${chalk.gray('Authentication uses Application Default Credentials or a service account key file.')}

  ${chalk.bold('Required Parameters:')}
    ${chalk.cyan('--gcs-bucket')} <BUCKET>      GCS bucket name

  ${chalk.bold('Optional Parameters:')}
    ${chalk.cyan('--gcs-key-file')} <PATH>      Path to service account JSON key file
    ${chalk.cyan('--gcs-project-id')} <ID>      Google Cloud project ID
    ${chalk.cyan('--gcs-prefix')} <PREFIX>      Object prefix inside bucket (default: backups)

  ${chalk.bold('Examples:')}
    ${chalk.gray('# Backup using Application Default Credentials (gcloud auth)')}
    db-backup backup -h 127.0.0.1 -u root -p pass -db myapp --dbms mysql \\
      -s gcs --gcs-bucket my-db-backups --gcs-project-id my-project

    ${chalk.gray('# Backup with service account key file')}
    db-backup backup -h cloudsql.google.com -u user -p pass -db prod --dbms postgresql \\
      -s gcs --gcs-bucket prod-backups --gcs-key-file /etc/keys/sa.json
`),

  azure: chalk.white(`
${chalk.bold.yellow(`${ICONS.AZURE} AZURE BLOB STORAGE`)}
  Upload backups to Azure Blob Storage.
  ${chalk.gray('Use a connection string (recommended) or account name + key.')}

  ${chalk.bold('Required Parameters (one of):')}
    ${chalk.cyan('--azure-connection-string')} <STRING>   Full Azure connection string
    ${chalk.gray('OR')}
    ${chalk.cyan('--azure-account-name')} <NAME>  +  ${chalk.cyan('--azure-account-key')} <KEY>

  ${chalk.bold('Required Parameters:')}
    ${chalk.cyan('--azure-container')} <NAME>    Azure Blob container name

  ${chalk.bold('Optional Parameters:')}
    ${chalk.cyan('--azure-prefix')} <PREFIX>     Blob prefix/folder (default: backups)

  ${chalk.bold('Examples:')}
    ${chalk.gray('# Backup using connection string')}
    db-backup backup -h sqlserver.azure.com -u sa -p Pass123 -db prod --dbms mysql \\
      -s azure --azure-connection-string "DefaultEndpointsProtocol=https;AccountName=..." \\
      --azure-container db-backups

    ${chalk.gray('# Backup using account name + key')}
    db-backup backup -h localhost -u root -p pass -db shop --dbms mysql \\
      -s azure --azure-account-name mystorageaccount \\
      --azure-account-key abc123== --azure-container backups
`),

  ssh: chalk.white(`
${chalk.bold.yellow(`${ICONS.SSH} SSH / SFTP STORAGE`)}
  Upload backups to a remote server via SFTP.
  ${chalk.gray('Key-based authentication strongly recommended. Password auth also supported.')}

  ${chalk.bold('Required Parameters:')}
    ${chalk.cyan('-i / --identity-file')} <PATH>   Path to SSH private key (e.g. ~/.ssh/id_rsa)
    ${chalk.cyan('--ssh-path')} <PATH>             Remote destination directory

  ${chalk.bold('Optional Parameters:')}
    ${chalk.cyan('--ssh-port')} <PORT>             SSH port (default: 22)
    ${chalk.cyan('--ssh-passphrase')} <PASS>       Passphrase for encrypted private key
    ${chalk.cyan('-p / --password')}               SSH password (if not using key)

  ${chalk.bold('Examples:')}
    ${chalk.gray('# Backup via SSH with private key')}
    db-backup backup -h db.example.com -u dbadmin -p dbpass -db mydb --dbms postgresql \\
      -s ssh -i ~/.ssh/backup_key --ssh-path /mnt/backups/postgresql

    ${chalk.gray('# Backup to SSH server on custom port with compression')}
    db-backup backup -h 10.0.0.5 -u root -p pass -db shop --dbms mysql \\
      -s ssh -i ~/.ssh/id_ed25519 --ssh-path /backups --ssh-port 2222 -c
`),

  ftp: chalk.white(`
${chalk.bold.yellow(`${ICONS.FTP} FTP / FTPS STORAGE`)}
  Upload backups to an FTP or FTPS server.
  ${chalk.gray('No identity file required. FTPS (--ftp-secure) strongly recommended.')}

  ${chalk.bold('Required Parameters:')}
    ${chalk.cyan('--ftp-host')} <HOST>       FTP server hostname or IP
    ${chalk.cyan('--ftp-username')} <USER>   FTP username
    ${chalk.cyan('--ftp-password')} <PASS>   FTP password
    ${chalk.cyan('--ftp-path')} <PATH>       Remote destination directory

  ${chalk.bold('Optional Parameters:')}
    ${chalk.cyan('--ftp-port')} <PORT>       FTP port (default: 21)
    ${chalk.cyan('--ftp-secure')}            Enable FTPS/TLS (recommended)

  ${chalk.bold('Examples:')}
    ${chalk.gray('# Backup via FTPS (encrypted)')}
    db-backup backup -h localhost -u root -p pass -db mydb --dbms mysql \\
      -s ftp --ftp-host ftp.example.com --ftp-username ftpuser \\
      --ftp-password secret --ftp-path /backups/mysql --ftp-secure

    ${chalk.gray('# Backup via plain FTP on custom port')}
    db-backup backup -h localhost -u root -p pass -db mydb --dbms sqlite \\
      -s ftp --ftp-host 192.168.1.50 --ftp-username backup \\
      --ftp-password pass --ftp-path /data --ftp-port 2121
`),

  samba: chalk.white(`
${chalk.bold.yellow(`${ICONS.SAMBA} SAMBA / SMB STORAGE`)}
  Upload backups to a Windows/Samba SMB share.
  ${chalk.gray('No identity file required. Requires smbclient installed on the system.')}

  ${chalk.bold('Required Parameters:')}
    ${chalk.cyan('--smb-host')} <HOST>       Samba server hostname or IP
    ${chalk.cyan('--smb-share')} <SHARE>     Share name (maps to \\\\server\\share)

  ${chalk.bold('Optional Parameters:')}
    ${chalk.cyan('--smb-username')} <USER>   SMB username (default: guest)
    ${chalk.cyan('--smb-password')} <PASS>   SMB password
    ${chalk.cyan('--smb-domain')} <DOMAIN>   Windows domain/workgroup (default: WORKGROUP)
    ${chalk.cyan('--smb-path')} <PATH>       Sub-directory inside the share
    ${chalk.cyan('--smb-port')} <PORT>       SMB port (default: 445)

  ${chalk.bold('Examples:')}
    ${chalk.gray('# Backup to Samba NAS')}
    db-backup backup -h localhost -u root -p pass -db mydb --dbms mysql \\
      -s samba --smb-host 192.168.1.20 --smb-share backups \\
      --smb-username smbuser --smb-password secret --smb-path /mysql

    ${chalk.gray('# Backup to Windows share with domain')}
    db-backup backup -h localhost -u root -p pass -db mydb --dbms postgresql \\
      -s samba --smb-host fileserver --smb-share DBBackups \\
      --smb-username CORP\\\\backupuser --smb-password pass --smb-domain CORP
`),

  nfs: chalk.white(`
${chalk.bold.yellow(`${ICONS.NFS} NFS STORAGE`)}
  Save backups to a mounted NFS share (uses local fs — share must be pre-mounted).
  ${chalk.gray('No identity file, username, or password required. NFS handles auth at OS level.')}

  ${chalk.bold('Required Parameters:')}
    ${chalk.cyan('--nfs-mount-path')} <PATH>   Local mount point of the NFS share

  ${chalk.bold('Optional Parameters:')}
    ${chalk.cyan('--nfs-path')} <PATH>         Sub-directory inside the mount (default: /)

  ${chalk.bold('Mount NFS share first (Linux/macOS):')}
    ${chalk.gray('sudo mount -t nfs 192.168.1.10:/exports/backups /mnt/nfs-backups')}

  ${chalk.bold('Examples:')}
    ${chalk.gray('# Backup to NFS mount')}
    db-backup backup -h localhost -u root -p pass -db mydb --dbms mysql \\
      -s nfs --nfs-mount-path /mnt/nfs-backups --nfs-path /mysql

    ${chalk.gray('# MongoDB backup to NFS with compression')}
    db-backup backup -h localhost -u mongo -p pass -db myapp --dbms mongodb \\
      -s nfs --nfs-mount-path /mnt/nas/backups --nfs-path /mongodb -c
`)
};

module.exports = { printBanner, printStorageHelp, STORAGE_HELP };
