// src/scheduler/index.js
// Cron-based backup scheduler using node-cron

const cron = require('node-cron');
const chalk = require('chalk');
const { logger } = require('../logging');
const { ICONS } = require('../consts/messages');
const { runBackup } = require('../backup');

/**
 * Start a cron-scheduled backup
 * @param {object} opts - All CLI options (cron + backup options)
 */
async function runSchedule(opts) {
  const { cron: cronExpression, database, dbms, storage } = opts;

  if (!cron.validate(cronExpression)) {
    logger.error(`${ICONS.ERROR} Invalid cron expression: "${cronExpression}"`);
    logger.info(`${ICONS.INFO} Examples:`);
    logger.info(`  "0 2 * * *"     → Every day at 2:00 AM`);
    logger.info(`  "0 */6 * * *"   → Every 6 hours`);
    logger.info(`  "*/30 * * * *"  → Every 30 minutes`);
    logger.info(`  "0 2 * * 0"     → Every Sunday at 2:00 AM`);
    process.exit(1);
  }

  const nextRun = getNextRun(cronExpression);
  logger.info(`\n${ICONS.SCHEDULE} Backup scheduler started`);
  logger.info(`${ICONS.DATABASE} Database : ${chalk.cyan(database || opts.host)}`);
  logger.info(`${ICONS.BULLET}  DBMS     : ${chalk.cyan(dbms)}`);
  logger.info(`${ICONS.BULLET}  Storage  : ${chalk.cyan(storage)}`);
  logger.info(`${ICONS.BULLET}  Cron     : ${chalk.yellow(cronExpression)}`);
  logger.info(`${ICONS.BULLET}  Next run : ${chalk.green(nextRun)}`);
  logger.info(chalk.gray('\nPress Ctrl+C to stop the scheduler.\n'));

  let runCount = 0;

  const task = cron.schedule(cronExpression, async () => {
    runCount++;
    const timestamp = new Date().toISOString();
    logger.info(`\n${ICONS.RUNNING} [Run #${runCount}] Starting scheduled backup at ${timestamp}`);

    try {
      await runBackup(opts);
      logger.info(`${ICONS.SUCCESS} [Run #${runCount}] Scheduled backup completed`);
    } catch (err) {
      logger.error(`${ICONS.ERROR} [Run #${runCount}] Scheduled backup failed: ${err.message}`);
      // Don't exit — keep scheduler running even if one run fails
    }

    const next = getNextRun(cronExpression);
    logger.info(`${ICONS.SCHEDULE} Next scheduled run: ${chalk.green(next)}\n`);
  }, {
    scheduled: true,
    timezone: process.env.TZ || 'UTC',
  });

  // Graceful shutdown
  process.on('SIGINT', () => {
    logger.info(`\n${ICONS.DISCONNECT} Scheduler stopped by user`);
    task.stop();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    logger.info(`\n${ICONS.DISCONNECT} Scheduler terminated`);
    task.stop();
    process.exit(0);
  });
}

/**
 * Get a human-readable next run time for a cron expression
 */
function getNextRun(expression) {
  try {
    // Parse the cron and find the next run
    const parts = expression.split(' ');
    return `(cron: ${expression}) — next execution calculated by node-cron`;
  } catch {
    return 'unknown';
  }
}

module.exports = { runSchedule };
