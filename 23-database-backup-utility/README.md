# 💾 db-backup-cli

> Universal Database Backup & Restore CLI — supports MySQL, PostgreSQL, MongoDB, SQLite with local and cloud storage backends.

---

## 📋 Table of Contents
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Commands](#commands)
  - [backup](#-backup-command)
  - [restore](#-restore-command)
  - [schedule](#-schedule-command)
  - [help-storage](#-help-storage-command)
- [Core Parameters](#core-parameters)
- [Storage Backends](#storage-backends)
- [DBMS Compatibility Matrix](#dbms-compatibility-matrix)
- [Logging & Notifications](#logging--notifications)
- [Examples](#examples)

---

## Installation

```bash
# Clone or download the project
cd db-backup-cli

# Install dependencies
npm install

# Make executable (Linux/macOS)
chmod +x index.js
npm link   # Installs `db-backup` globally
```

### Prerequisites

| DBMS       | Required CLI tools                    |
|------------|---------------------------------------|
| MySQL      | `mysqldump`, `mysql`                  |
| PostgreSQL | `pg_dump`, `pg_restore`, `psql`       |
| MongoDB    | `mongodump`, `mongorestore`           |
| SQLite     | `sqlite3` (optional, falls back to binary copy) |

| Storage  | Required                              |
|----------|---------------------------------------|
| Samba    | `smbclient` system package            |
| NFS      | NFS share must be pre-mounted         |
| Others   | No system tools required              |

---

## Quick Start

```bash
# Backup MySQL to local directory
db-backup backup -h localhost -u root -p mypassword -db myapp --dbms mysql \
  -s local --save-path /backups

# Restore from backup
db-backup restore -h localhost -u root -p mypassword -db myapp --dbms mysql \
  -rf /backups/mysql_myapp_full_2024-01-15.sql

# View help
db-backup --help
db-backup backup --help
db-backup help-storage aws-s3
```

---

## Commands

### 💾 Backup Command

```
db-backup backup [options]
```

### ♻️ Restore Command

```
db-backup restore [options]
```

### 🗓️ Schedule Command

```
db-backup schedule --cron "<CRON_EXPRESSION>" [backup options]
```

### ℹ️ Help Storage Command

```
db-backup help-storage [STORAGE]
```

---

## Core Parameters

| Short | Long                        | Description                                         | Required      |
|-------|-----------------------------|-----------------------------------------------------|---------------|
| `-h`  | `--host <IP>`               | Database host IP or hostname                        | ✅ Yes        |
| `-u`  | `--username <USERNAME>`     | Database username                                   | ✅ Yes*       |
| `-p`  | `--password <PASSWORD>`     | Database password                                   | ✅ Yes*       |
| `-db` | `--database-name <n>`    | Database name                                       | ✅ Yes*       |
|       | `--dbms <DBMS>`             | DBMS: `mysql` `postgresql` `mongodb` `sqlite`       | ✅ Yes        |
| `-bt` | `--backup-type <TYPE>`      | `full` `incremental` `differential` (default: full) | ❌ No         |
| `-c`  | `--compression`             | Compress backup (zip) — no argument                 | ❌ No         |
| `-s`  | `--storage <STORAGE>`       | Storage backend (see below)                         | ✅ Yes        |
| `-i`  | `--identity-file <PATH>`    | SSH private key path (required for SSH storage)     | ⚠️ SSH only  |
| `-t`  | `--tables <TABLES>`         | Tables to backup, comma-separated                   | ❌ Optional   |
| `-cl` | `--collections <COLS>`      | Collections to backup, comma-separated              | ❌ Optional   |
|       | `--slack-webhook <URL>`     | Slack incoming webhook URL                          | ❌ Optional   |
|       | `--port <PORT>`             | Database port (uses DBMS default if omitted)        | ❌ Optional   |

*\* Not required for SQLite (file-based)*

---

## Storage Backends

### 💻 Local

```bash
db-backup backup -h localhost -u root -p pass -db mydb --dbms mysql \
  -s local --save-path /mnt/backups
```

| Parameter       | Required | Description                   |
|-----------------|----------|-------------------------------|
| `--save-path`   | ✅ Yes   | Destination directory or file |

---

### ☁️ AWS S3

```bash
db-backup backup -h db.example.com -u admin -p pass -db prod --dbms postgresql \
  -s aws-s3 --aws-bucket my-db-backups --aws-region eu-west-1
```

| Parameter                  | Required | Default     | Description                       |
|----------------------------|----------|-------------|-----------------------------------|
| `--aws-bucket`             | ✅ Yes   |             | S3 bucket name                    |
| `--aws-region`             | ❌ No    | us-east-1   | AWS region                        |
| `--aws-access-key-id`      | ❌ No    | env/IAM     | AWS Access Key ID                 |
| `--aws-secret-access-key`  | ❌ No    | env/IAM     | AWS Secret Access Key             |
| `--aws-session-token`      | ❌ No    |             | Temporary session token (STS)     |
| `--aws-endpoint`           | ❌ No    |             | Custom endpoint (MinIO/LocalStack)|
| `--aws-force-path-style`   | ❌ No    | false       | Force path-style URLs             |
| `--aws-s3-prefix`          | ❌ No    | backups     | Key prefix inside the bucket      |

**Auth priority:** Explicit keys → env vars → `~/.aws/credentials` → IAM role

---

### ☁️ Google Cloud Storage

```bash
db-backup backup -h localhost -u root -p pass -db mydb --dbms mysql \
  -s gcs --gcs-bucket my-bucket --gcs-key-file /etc/gcp/sa.json
```

| Parameter         | Required | Default | Description                          |
|-------------------|----------|---------|--------------------------------------|
| `--gcs-bucket`    | ✅ Yes   |         | GCS bucket name                      |
| `--gcs-key-file`  | ❌ No    | ADC     | Service account JSON key file path   |
| `--gcs-project-id`| ❌ No    |         | Google Cloud project ID              |
| `--gcs-prefix`    | ❌ No    | backups | Object prefix inside bucket          |

**Auth priority:** `--gcs-key-file` → `GOOGLE_APPLICATION_CREDENTIALS` → `gcloud auth` → Workload Identity

---

### ☁️ Azure Blob Storage

```bash
db-backup backup -h localhost -u root -p pass -db mydb --dbms mysql \
  -s azure \
  --azure-connection-string "DefaultEndpointsProtocol=https;AccountName=..." \
  --azure-container db-backups
```

| Parameter                   | Required | Default | Description                           |
|-----------------------------|----------|---------|---------------------------------------|
| `--azure-connection-string` | ⚠️ One of|         | Full Azure Storage connection string  |
| `--azure-account-name`      | ⚠️ One of|         | Azure Storage account name            |
| `--azure-account-key`       | ⚠️ One of|         | Azure Storage account key             |
| `--azure-container`         | ✅ Yes   |         | Blob container name                   |
| `--azure-prefix`            | ❌ No    | backups | Blob prefix/folder                    |

---

### 🔐 SSH / SFTP

```bash
db-backup backup -h db.prod.com -u admin -p dbpass -db mydb --dbms postgresql \
  -s ssh -i ~/.ssh/id_rsa --ssh-path /mnt/backups/postgresql
```

| Parameter          | Required | Default | Description                          |
|--------------------|----------|---------|--------------------------------------|
| `-i/--identity-file` | ✅ Yes |         | Path to SSH private key              |
| `--ssh-path`       | ✅ Yes   |         | Remote destination directory         |
| `--ssh-port`       | ❌ No    | 22      | SSH port                             |
| `--ssh-passphrase` | ❌ No    |         | Passphrase for encrypted private key |
| `-p/--password`    | ❌ No    |         | SSH password (if no key)             |

> **Note:** `-h/--host` and `-u/--username` are used for the database connection. For SSH storage, the SSH server is also specified via `--host` (or use `--ssh-host` if the SSH server differs from the DB host).

---

### 📡 FTP / FTPS

```bash
db-backup backup -h localhost -u root -p pass -db mydb --dbms mysql \
  -s ftp \
  --ftp-host ftp.example.com --ftp-username ftpuser \
  --ftp-password secret --ftp-path /backups/mysql --ftp-secure
```

| Parameter       | Required | Default | Description               |
|-----------------|----------|---------|---------------------------|
| `--ftp-host`    | ✅ Yes   |         | FTP server hostname or IP |
| `--ftp-username`| ✅ Yes   |         | FTP username              |
| `--ftp-password`| ✅ Yes   |         | FTP password              |
| `--ftp-path`    | ✅ Yes   |         | Remote destination path   |
| `--ftp-port`    | ❌ No    | 21      | FTP port                  |
| `--ftp-secure`  | ❌ No    | false   | Enable FTPS/TLS           |

> **Note:** No `--identity-file` required for FTP.

---

### 🗂️ Samba / SMB

```bash
db-backup backup -h localhost -u root -p pass -db mydb --dbms mysql \
  -s samba \
  --smb-host 192.168.1.20 --smb-share backups \
  --smb-username smbuser --smb-password secret --smb-path /mysql
```

| Parameter       | Required | Default    | Description                      |
|-----------------|----------|------------|----------------------------------|
| `--smb-host`    | ✅ Yes   |            | Samba server hostname or IP      |
| `--smb-share`   | ✅ Yes   |            | Share name (\\server\share)      |
| `--smb-username`| ❌ No    | guest      | SMB username                     |
| `--smb-password`| ❌ No    |            | SMB password                     |
| `--smb-domain`  | ❌ No    | WORKGROUP  | Windows domain/workgroup         |
| `--smb-path`    | ❌ No    | /          | Sub-directory inside the share   |
| `--smb-port`    | ❌ No    | 445        | SMB port                         |

> **Note:** No `--identity-file` required for Samba. Requires `smbclient` installed.

---

### 📂 NFS

```bash
# First mount the NFS share
sudo mount -t nfs 192.168.1.10:/exports/backups /mnt/nfs-backups

# Then use it
db-backup backup -h localhost -u root -p pass -db mydb --dbms mysql \
  -s nfs --nfs-mount-path /mnt/nfs-backups --nfs-path /mysql
```

| Parameter          | Required | Default | Description                           |
|--------------------|----------|---------|---------------------------------------|
| `--nfs-mount-path` | ✅ Yes   |         | Local mount point of the NFS share    |
| `--nfs-path`       | ❌ No    | /       | Sub-directory inside mount            |

> **Note:** No `--identity-file`, `--username`, or `--password` required for NFS. Auth is handled at OS/server level.

---

## DBMS Compatibility Matrix

| Feature             | MySQL | PostgreSQL | MongoDB | SQLite |
|---------------------|:-----:|:----------:|:-------:|:------:|
| Full backup         | ✅    | ✅         | ✅      | ✅     |
| Incremental backup  | ✅    | ✅         | ✅      | ❌     |
| Differential backup | ✅    | ✅         | ❌      | ❌     |
| `--tables` filter   | ✅    | ✅         | ❌      | ✅     |
| `--collections`     | ❌    | ❌         | ✅      | ❌     |
| Selective restore   | ❌    | ✅         | ✅      | ❌     |

---

## Logging & Notifications

### Log Files

All backup activities are logged to the `logs/` directory:

```
logs/
├── backup-activity-2024-01-15.log   # All activity (JSON)
└── errors-2024-01-15.log            # Errors only (JSON)
```

Each log entry includes:
- `event` — BACKUP_START, BACKUP_SUCCESS, BACKUP_FAILED, RESTORE_START, etc.
- `database`, `host`, `dbms`, `backupType`, `storage`
- `startTime`, `endTime`, `duration`
- `sizeBytes`, `filePath`
- `error`, `stack` (on failure)

Logs rotate daily and are kept for 30 days.

### Slack Notifications

Add `--slack-webhook <URL>` to any backup or restore command:

```bash
db-backup backup -h localhost -u root -p pass -db mydb --dbms mysql \
  -s local --save-path /backups \
  --slack-webhook https://hooks.slack.com/services/T00/B00/xxx
```

Notifications include: database name, DBMS, host, backup type, storage, file path, duration, size (on success), and error details (on failure).

---

## Examples

```bash
# ─── Backup ────────────────────────────────────────────────────────────────

# Full MySQL backup → local
db-backup backup -h localhost -u root -p pass -db myapp --dbms mysql \
  -s local --save-path /backups

# PostgreSQL incremental backup → AWS S3 with compression
db-backup backup -h db.prod.com -u postgres -p pass -db orders \
  --dbms postgresql -bt incremental -c \
  -s aws-s3 --aws-bucket prod-backups --aws-region us-east-1

# MongoDB collections → SSH server
db-backup backup -h mongo.prod -u mongo -p pass -db catalog \
  --dbms mongodb -cl products,inventory \
  -s ssh -i ~/.ssh/id_rsa --ssh-path /mnt/backups/mongodb

# SQLite → GCS
db-backup backup -h /var/lib/app.db --dbms sqlite \
  -s gcs --gcs-bucket my-bucket --gcs-key-file /etc/gcp/sa.json

# MySQL specific tables → Azure Blob with Slack notification
db-backup backup -h localhost -u root -p pass -db shop --dbms mysql \
  -t orders,customers,products \
  -s azure \
  --azure-connection-string "DefaultEndpointsProtocol=https;..." \
  --azure-container db-backups \
  --slack-webhook https://hooks.slack.com/services/...

# ─── Restore ───────────────────────────────────────────────────────────────

# Restore MySQL from local file
db-backup restore -h localhost -u root -p pass -db myapp --dbms mysql \
  -rf /backups/mysql_myapp_full_2024-01-15T02-00-00.sql

# Restore PostgreSQL specific tables
db-backup restore -h localhost -u postgres -p pass -db shop --dbms postgresql \
  -rf /backups/postgresql_shop_full_2024.dump \
  -t orders,customers

# Restore MongoDB from S3
db-backup restore -h localhost -u mongo -p pass -db catalog --dbms mongodb \
  -rf backups/mongodb_catalog_full_2024.zip \
  -s aws-s3 --aws-bucket prod-backups

# ─── Schedule ──────────────────────────────────────────────────────────────

# Daily at 2 AM, MySQL → S3
db-backup schedule --cron "0 2 * * *" \
  -h localhost -u root -p pass -db myapp --dbms mysql \
  -s aws-s3 --aws-bucket my-backups \
  --slack-webhook https://hooks.slack.com/...

# Every 6 hours, MongoDB → NFS
db-backup schedule --cron "0 */6 * * *" \
  -h localhost -u mongo -p pass -db catalog --dbms mongodb \
  -s nfs --nfs-mount-path /mnt/nas/backups

# ─── Help ──────────────────────────────────────────────────────────────────

db-backup --help
db-backup backup --help
db-backup restore --help
db-backup help-storage
db-backup help-storage aws-s3
db-backup help-storage ssh
```

---

## Environment Variables

| Variable                      | Description                              |
|-------------------------------|------------------------------------------|
| `AWS_REGION`                  | AWS region (fallback for --aws-region)   |
| `AWS_ACCESS_KEY_ID`           | AWS access key                           |
| `AWS_SECRET_ACCESS_KEY`       | AWS secret key                           |
| `GOOGLE_APPLICATION_CREDENTIALS` | GCS service account key path          |
| `AZURE_STORAGE_CONNECTION_STRING` | Azure connection string              |
| `LOG_LEVEL`                   | winston log level (default: info)        |
| `TZ`                          | Timezone for scheduler (default: UTC)    |
| `DEBUG`                       | Show stack traces on errors              |

---

## Project Structure

```
db-backup-cli/
├── index.js                        # Entry point
├── package.json
├── README.md
├── logs/                           # Auto-created, log files
└── src/
    ├── cli/
    │   ├── commands.js             # Commander CLI definitions
    │   ├── validate.js             # Argument validation
    │   └── help.js                 # Help text & storage docs
    ├── consts/
    │   ├── databases.js            # DBMS constants & compatibility
    │   ├── storage.js              # Storage backend constants
    │   └── messages.js             # Icons, colors, message templates
    ├── backup/
    │   ├── index.js                # Backup orchestrator
    │   ├── mysql.js                # MySQL backup/restore
    │   ├── postgresql.js           # PostgreSQL backup/restore
    │   ├── mongodb.js              # MongoDB backup/restore
    │   └── sqlite.js               # SQLite backup/restore
    ├── restore/
    │   └── index.js                # Restore orchestrator
    ├── storage/
    │   ├── index.js                # Storage router
    │   ├── local.js                # Local filesystem
    │   ├── aws-s3.js               # AWS S3
    │   ├── gcs.js                  # Google Cloud Storage
    │   ├── azure.js                # Azure Blob Storage
    │   ├── ssh.js                  # SSH/SFTP
    │   ├── ftp.js                  # FTP/FTPS
    │   ├── samba.js                # Samba/SMB
    │   └── nfs.js                  # NFS
    ├── compression/
    │   └── index.js                # zip compress/decompress
    ├── logging/
    │   └── index.js                # Winston logger
    ├── notifications/
    │   └── slack.js                # Slack webhook
    └── scheduler/
        └── index.js                # node-cron scheduler
```

---

## 🆕 Additional Commands

### 📋 list — List backups in any storage backend

```bash
# List local backups
db-backup list -s local --save-path /mnt/backups

# List S3 backups with prefix filter
db-backup list -s aws-s3 --aws-bucket my-backups --aws-region us-east-1 --prefix mysql/

# List SSH remote directory
db-backup list -s ssh -h backup-server -u admin -i ~/.ssh/id_rsa --ssh-path /mnt/backups

# List FTP backups
db-backup list -s ftp --ftp-host ftp.example.com --ftp-username user \
  --ftp-password pass --ftp-path /backups --ftp-secure

# List GCS bucket
db-backup list -s gcs --gcs-bucket my-bucket --gcs-key-file /etc/gcp/sa.json

# List Azure container
db-backup list -s azure --azure-connection-string "DefaultEndpoints..." \
  --azure-container db-backups
```

Output shows: filename, size, last modified, full path — sorted by newest first.

---

### ⚡ --dry-run — Simulate without executing

Add `--dry-run` to any `backup` or `restore` command to see exactly what would happen without touching any database:

```bash
# Preview a backup — shows plan, CLI tool check, expected filename, command, warnings
db-backup backup -h localhost -u root -p pass -db shop --dbms mysql \
  -s aws-s3 --aws-bucket my-backups --dry-run

# Preview a restore
db-backup restore -h localhost -u root -p pass -db shop --dbms mysql \
  -rf /backups/mysql_shop_full_2026.sql --dry-run
```

Dry-run output includes:
- Full backup plan (DBMS, host, type, storage)
- Required CLI tool availability check (mysqldump, pg_dump, mongodump, etc.)
- Expected output filename and destination path
- Exact command that would run (with password masked)
- Compatibility warnings (e.g. binary logging required for incremental)
- Storage-specific parameter summary

---

### 📄 --config — Use a JSON config file

Store your backup configuration in a JSON file and reference it with `--config`. CLI flags always override config file values.

```bash
# Generate an example config
db-backup config-example > backup-config.json

# Use the config file
db-backup backup --config backup-config.json

# CLI flag overrides config (e.g. override storage for this run)
db-backup backup --config backup-config.json -s local --save-path /tmp

# Combine config + dry-run
db-backup backup --config backup-config.json --dry-run
```

Example `backup-config.json`:
```json
{
  "host": "localhost",
  "username": "root",
  "password": "secret",
  "database": "myapp",
  "dbms": "mysql",
  "backupType": "full",
  "compression": true,
  "storage": "aws-s3",
  "awsBucket": "my-db-backups",
  "awsRegion": "eu-west-1",
  "slackWebhook": "https://hooks.slack.com/services/..."
}
```

---

### 🗓️ schedule — Cron-based automatic backups

```bash
# Daily at 2 AM
db-backup schedule --cron "0 2 * * *" \
  -h localhost -u root -p pass -db myapp --dbms mysql \
  -s aws-s3 --aws-bucket my-backups --slack-webhook https://hooks.slack.com/...

# Every 6 hours, MongoDB → NFS
db-backup schedule --cron "0 */6 * * *" \
  -h mongo.prod -u user -p pass -db catalog --dbms mongodb \
  -s nfs --nfs-mount-path /mnt/nas/backups

# Weekly full backup on Sunday at 3 AM with compression
db-backup schedule --cron "0 3 * * 0" \
  -h localhost -u postgres -p pass -db shop --dbms postgresql \
  -bt full -c -s local --save-path /mnt/backups

# Use a config file for scheduling
db-backup schedule --cron "0 2 * * *" --config backup-config.json
```

The scheduler runs indefinitely, logging each execution. Press `Ctrl+C` to stop. Failures don't kill the scheduler — it keeps running for the next scheduled run.

**Common cron expressions:**

| Expression      | Meaning                    |
|-----------------|----------------------------|
| `0 2 * * *`     | Daily at 2:00 AM           |
| `0 */6 * * *`   | Every 6 hours              |
| `*/30 * * * *`  | Every 30 minutes           |
| `0 3 * * 0`     | Every Sunday at 3:00 AM    |
| `0 0 1 * *`     | First day of every month   |

Set `TZ=America/New_York` (or any tz name) in your `.env` to use a local timezone.

---

## ⚙️ Environment Variables

Copy `.env.example` to `.env` and fill in your values. All variables are optional — CLI flags always take precedence.

```bash
cp .env.example .env
```

| Variable                           | Description                                        |
|------------------------------------|----------------------------------------------------|
| `LOG_LEVEL`                        | `error` \| `warn` \| `info` \| `debug` (default: info) |
| `TZ`                               | Timezone for scheduler (default: UTC)              |
| `DEBUG`                            | Show full stack traces (any non-empty value)       |
| `SLACK_WEBHOOK_URL`                | Fallback Slack webhook URL                         |
| `AWS_REGION`                       | AWS region                                         |
| `AWS_ACCESS_KEY_ID`                | AWS access key                                     |
| `AWS_SECRET_ACCESS_KEY`            | AWS secret key                                     |
| `AWS_SESSION_TOKEN`                | AWS temporary session token                        |
| `GOOGLE_APPLICATION_CREDENTIALS`   | Path to GCS service account JSON key               |
| `AZURE_STORAGE_CONNECTION_STRING`  | Azure Blob Storage connection string               |

---

## 📂 Complete Project Structure

```
db-backup-cli/
├── index.js                        ← Entry point (dotenv, global errors, CLI boot)
├── package.json
├── .env.example                    ← All supported env vars with documentation
├── .gitignore
├── README.md
└── src/
    ├── cli/
    │   ├── commands.js             ← All 7 commands (backup/restore/schedule/list/…)
    │   ├── validate.js             ← Compatibility matrix checks + required params
    │   ├── config.js               ← JSON config file loader (--config)
    │   ├── dryRun.js               ← Dry-run simulation (--dry-run)
    │   └── help.js                 ← Rich storage help with icons + examples
    ├── consts/
    │   ├── databases.js            ← DBMS support matrices (types/tables/collections)
    │   ├── storage.js              ← Storage backend constants & required params
    │   └── messages.js             ← Icons, colors, message templates
    ├── backup/
    │   ├── index.js                ← Orchestrator: backup → compress → upload → notify
    │   ├── mysql.js                ← mysqldump with streaming + binary log support
    │   ├── postgresql.js           ← pg_dump custom/SQL + pg_basebackup incremental
    │   ├── mongodb.js              ← mongodump with oplog support
    │   └── sqlite.js               ← sqlite3 CLI dump with binary copy fallback
    ├── restore/
    │   └── index.js                ← Orchestrator: download → decompress → restore
    ├── storage/
    │   ├── index.js                ← Router dispatching to correct backend
    │   ├── list.js                 ← List backups in any backend
    │   ├── local.js                ← Local filesystem
    │   ├── aws-s3.js               ← AWS S3 (multipart upload, IAM/key auth)
    │   ├── gcs.js                  ← Google Cloud Storage (resumable upload)
    │   ├── azure.js                ← Azure Blob Storage (block upload)
    │   ├── ssh.js                  ← SSH/SFTP (key + password auth)
    │   ├── ftp.js                  ← FTP/FTPS
    │   ├── samba.js                ← Samba/SMB
    │   └── nfs.js                  ← NFS (pre-mounted share)
    ├── compression/
    │   └── index.js                ← zip/unzip (archiver + extract-zip)
    ├── logging/
    │   └── index.js                ← Winston + daily-rotate-file
    ├── notifications/
    │   └── slack.js                ← Slack Block Kit webhook notifications
    └── scheduler/
        └── index.js                ← node-cron with SIGINT/SIGTERM graceful stop
```
