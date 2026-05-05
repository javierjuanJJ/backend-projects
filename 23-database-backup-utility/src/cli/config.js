// src/cli/config.js
// Optional JSON/JS config file support — merges file config with CLI options
// Config file values are overridden by explicit CLI flags.

const fs = require('fs');
const path = require('path');
const { logger } = require('../logging');
const { ICONS } = require('../consts/messages');

/**
 * Load a config file and merge with CLI options.
 * CLI options always win over config file values.
 *
 * Supported formats: .json  |  .js (CommonJS module exporting an object)
 *
 * @param {string} configPath - Path to config file (from --config flag)
 * @param {object} cliOpts    - Raw options object from Commander
 * @returns {object}          - Merged options
 */
function loadConfig(configPath, cliOpts) {
  if (!configPath) return cliOpts;

  const resolved = path.resolve(configPath);
  if (!fs.existsSync(resolved)) {
    logger.error(`${ICONS.ERROR} Config file not found: ${resolved}`);
    process.exit(1);
  }

  let fileConfig = {};
  try {
    if (resolved.endsWith('.js')) {
      fileConfig = require(resolved);
    } else {
      fileConfig = JSON.parse(fs.readFileSync(resolved, 'utf8'));
    }
    logger.info(`${ICONS.INFO} Loaded config from: ${resolved}`);
  } catch (err) {
    logger.error(`${ICONS.ERROR} Failed to parse config file: ${err.message}`);
    process.exit(1);
  }

  // Merge: CLI values take precedence — only fill in missing keys from file
  const merged = { ...fileConfig };
  for (const [key, value] of Object.entries(cliOpts)) {
    // Commander sets booleans to false by default; only override if explicitly set
    if (value !== undefined && value !== null && value !== false) {
      merged[key] = value;
    } else if (merged[key] === undefined) {
      merged[key] = value;
    }
  }

  return merged;
}

/**
 * Print an example config file to stdout
 */
function printExampleConfig() {
  const example = {
    "// comment": "Remove comments before using. CLI flags always override these values.",
    host: "localhost",
    username: "root",
    password: "yourpassword",
    database: "myapp",
    dbms: "mysql",
    backupType: "full",
    compression: false,
    storage: "local",
    savePath: "/mnt/backups",
    slackWebhook: "https://hooks.slack.com/services/T00/B00/xxx",
    "// AWS S3 example": "---",
    awsBucket: "my-db-backups",
    awsRegion: "us-east-1",
    "// GCS example": "---",
    gcsBucket: "my-gcs-bucket",
    gcsKeyFile: "/etc/gcp/sa.json",
    "// Azure example": "---",
    azureContainer: "db-backups",
    azureConnectionString: "DefaultEndpointsProtocol=https;AccountName=...",
    "// SSH example": "---",
    identityFile: "~/.ssh/id_rsa",
    sshPath: "/mnt/remote-backups",
    sshPort: "22",
    "// FTP example": "---",
    ftpHost: "ftp.example.com",
    ftpUsername: "ftpuser",
    ftpPassword: "ftppass",
    ftpPath: "/backups",
    ftpSecure: true,
    "// Samba example": "---",
    smbHost: "192.168.1.20",
    smbShare: "backups",
    smbUsername: "smbuser",
    smbPassword: "smbpass",
    "// NFS example": "---",
    nfsMountPath: "/mnt/nfs-backups",
    nfsPath: "/mysql",
  };

  console.log(JSON.stringify(example, null, 2));
}

module.exports = { loadConfig, printExampleConfig };
