#!/usr/bin/env node
// index.js — Application entry point

'use strict';
require('dotenv').config({ quiet: true });

const { buildCLI } = require('./src/cli/commands');
const chalk = require('chalk');
const { ICONS } = require('./src/consts/messages');

// ── Global error handlers ───────────────────────────────────────────────────
process.on('uncaughtException', (err) => {
  console.error(chalk.red(`\n${ICONS.ERROR} Uncaught Exception: ${err.message}`));
  if (process.env.DEBUG) console.error(err.stack);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error(chalk.red(`\n${ICONS.ERROR} Unhandled Promise Rejection: ${reason}`));
  if (process.env.DEBUG && reason?.stack) console.error(reason.stack);
  process.exit(1);
});

// ── Run CLI ──────────────────────────────────────────────────────────────────
async function main() {
  const program = buildCLI();

  // Show help if no command given
  if (process.argv.length <= 2) {
    program.help();
  }

  await program.parseAsync(process.argv);
}

main().catch((err) => {
  console.error(chalk.red(`${ICONS.ERROR} Fatal error: ${err.message}`));
  process.exit(1);
});
