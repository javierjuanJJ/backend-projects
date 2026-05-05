// src/notifications/slack.js
// Slack webhook notification sender

const axios = require('axios');
const { logger } = require('../logging');
const { ICONS, MESSAGES } = require('../consts/messages');

/**
 * Send a Slack notification via incoming webhook
 * @param {string} webhookUrl - Slack incoming webhook URL
 * @param {object} payload    - Notification data
 */
async function sendSlackNotification(webhookUrl, payload) {
  if (!webhookUrl) return;

  try {
    const message = buildSlackMessage(payload);
    await axios.post(webhookUrl, message, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 10_000,
    });
    logger.info(MESSAGES.NOTIFICATION_SENT());
  } catch (err) {
    logger.warn(MESSAGES.NOTIFICATION_FAILED(err.message));
  }
}

/**
 * Build a rich Slack Block Kit message
 */
function buildSlackMessage({ event, database, dbms, host, backupType, storage, filePath, duration, sizeBytes, error }) {
  const isSuccess = event === 'BACKUP_SUCCESS' || event === 'RESTORE_SUCCESS';
  const isBackup = event?.startsWith('BACKUP');
  const emoji = isSuccess ? ICONS.SUCCESS : ICONS.ERROR;
  const color = isSuccess ? '#36a64f' : '#e01e5a';
  const title = isBackup
    ? (isSuccess ? `${emoji} Backup Completed` : `${emoji} Backup Failed`)
    : (isSuccess ? `${emoji} Restore Completed` : `${emoji} Restore Failed`);

  const fields = [];

  if (database) fields.push({ type: 'mrkdwn', text: `*Database:*\n${database}` });
  if (dbms) fields.push({ type: 'mrkdwn', text: `*DBMS:*\n${dbms}` });
  if (host) fields.push({ type: 'mrkdwn', text: `*Host:*\n${host}` });
  if (backupType) fields.push({ type: 'mrkdwn', text: `*Backup Type:*\n${backupType}` });
  if (storage) fields.push({ type: 'mrkdwn', text: `*Storage:*\n${storage}` });
  if (filePath) fields.push({ type: 'mrkdwn', text: `*File:*\n\`${filePath}\`` });
  if (duration) fields.push({ type: 'mrkdwn', text: `*Duration:*\n${duration}` });
  if (sizeBytes) fields.push({ type: 'mrkdwn', text: `*Size:*\n${formatBytes(sizeBytes)}` });
  if (error) fields.push({ type: 'mrkdwn', text: `*Error:*\n\`${error}\`` });

  fields.push({ type: 'mrkdwn', text: `*Timestamp:*\n${new Date().toISOString()}` });

  return {
    attachments: [
      {
        color,
        blocks: [
          {
            type: 'header',
            text: { type: 'plain_text', text: title, emoji: true },
          },
          {
            type: 'section',
            fields,
          },
          {
            type: 'context',
            elements: [
              {
                type: 'mrkdwn',
                text: `Sent by *db-backup-cli* ${ICONS.DATABASE}`,
              },
            ],
          },
        ],
      },
    ],
  };
}

function formatBytes(bytes) {
  if (!bytes) return 'N/A';
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  if (bytes === 0) return '0 B';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
}

module.exports = { sendSlackNotification };
