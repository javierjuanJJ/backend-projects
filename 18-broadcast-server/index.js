#!/usr/bin/env node

"use strict";

const { program } = require("commander");
const chalk = require("chalk");

const { COMMANDS, EXIT_CODES, DEFAULT_PORT, DEFAULT_HOST } = require("./src/constants");
const {
  BroadcastServerError,
  InvalidCommandError,
  InvalidOptionError,
  PortInUseError,
  ServerStartError,
  ServerShutdownError,
  ClientConnectionError,
  ClientDisconnectionError,
  MessageSendError,
  MessageBroadcastError,
} = require("./src/errors");
const { startServer, stopServer } = require("./src/server/server");
const { connectClient, disconnectClient } = require("./src/client/client");

// ─── Error Display ────────────────────────────────────────────────────────────

/**
 * Centralised error renderer. Maps each custom error type to a tailored
 * user-facing message and the correct process exit code.
 * @param {Error} err
 */
const handleError = (err) => {
  console.error(); // blank line for readability

  if (err instanceof PortInUseError) {
    console.error(chalk.red(`🔴 [PORT IN USE] ${err.message}`));
    process.exit(EXIT_CODES.SERVER_ERROR);
  }

  if (err instanceof ServerStartError) {
    console.error(chalk.red(`🔴 [SERVER ERROR] ${err.message}`));
    if (err.originalError) {
      console.error(chalk.gray(`   Caused by: ${err.originalError.message}`));
    }
    process.exit(EXIT_CODES.SERVER_ERROR);
  }

  if (err instanceof ServerShutdownError) {
    console.error(chalk.red(`🔴 [SHUTDOWN ERROR] ${err.message}`));
    process.exit(EXIT_CODES.SERVER_ERROR);
  }

  if (err instanceof MessageBroadcastError) {
    console.error(chalk.red(`🔴 [BROADCAST ERROR] ${err.message}`));
    process.exit(EXIT_CODES.SERVER_ERROR);
  }

  if (err instanceof ClientConnectionError) {
    console.error(chalk.red(`🔴 [CONNECTION ERROR] ${err.message}`));
    console.error(
      chalk.yellow(
        `   Tip: Make sure the server is running with "broadcast-server start"`
      )
    );
    process.exit(EXIT_CODES.CLIENT_ERROR);
  }

  if (err instanceof ClientDisconnectionError) {
    console.error(chalk.red(`🔴 [DISCONNECTION ERROR] ${err.message}`));
    process.exit(EXIT_CODES.CLIENT_ERROR);
  }

  if (err instanceof MessageSendError) {
    console.error(chalk.red(`🔴 [SEND ERROR] ${err.message}`));
    process.exit(EXIT_CODES.CLIENT_ERROR);
  }

  if (err instanceof InvalidCommandError) {
    console.error(chalk.red(`🔴 [INVALID COMMAND] ${err.message}`));
    program.help();
    process.exit(EXIT_CODES.INVALID_COMMAND);
  }

  if (err instanceof InvalidOptionError) {
    console.error(chalk.red(`🔴 [INVALID OPTION] ${err.message}`));
    process.exit(EXIT_CODES.INVALID_COMMAND);
  }

  if (err instanceof BroadcastServerError) {
    // Fallback for any other custom error
    console.error(chalk.red(`🔴 [ERROR:${err.code}] ${err.message}`));
    process.exit(EXIT_CODES.GENERAL_ERROR);
  }

  // Unexpected / native errors
  console.error(chalk.red(`🔴 [UNEXPECTED ERROR] ${err.message}`));
  console.error(chalk.gray(err.stack));
  process.exit(EXIT_CODES.GENERAL_ERROR);
};

// ─── Graceful Shutdown ────────────────────────────────────────────────────────

/**
 * Registers OS signal handlers so Ctrl+C triggers a clean server shutdown.
 */
const registerShutdownHandlers = () => {
  const shutdown = async () => {
    try {
      await stopServer();
      process.exit(EXIT_CODES.SUCCESS);
    } catch (err) {
      handleError(err);
    }
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
};

// ─── Option Validation ────────────────────────────────────────────────────────

/**
 * Validates and parses the --port option.
 * Throws InvalidOptionError for non-numeric or out-of-range values.
 * @param {string|number} value
 * @returns {number}
 */
const parsePort = (value) => {
  const port = parseInt(value, 10);
  if (isNaN(port) || port < 1 || port > 65535) {
    throw new InvalidOptionError(
      "--port",
      `must be a number between 1 and 65535 (got "${value}")`
    );
  }
  return port;
};

// ─── Command Handlers ─────────────────────────────────────────────────────────

/**
 * Handles the "start" command: validates options, starts the server,
 * and registers shutdown hooks.
 * @param {{ port: string, host: string }} opts
 */
const runStartCommand = async (opts) => {
  const port = parsePort(opts.port);
  const host = opts.host;

  registerShutdownHandlers();
  await startServer({ port, host });

  // Keep the process alive — the server runs until Ctrl+C
};

/**
 * Handles the "connect" command: validates options and connects the client.
 * @param {{ port: string, host: string }} opts
 */
const runConnectCommand = async (opts) => {
  const port = parsePort(opts.port);
  const host = opts.host;

  await connectClient({ port, host });

  // Process stays alive while readline loop is running.
  // SIGINT (Ctrl+C) will close readline → disconnects gracefully.
  process.on("SIGINT", () => {
    console.log(chalk.yellow("\n👋 Disconnecting..."));
    disconnectClient();
    process.exit(EXIT_CODES.SUCCESS);
  });
};

// ─── CLI Definition ───────────────────────────────────────────────────────────

program
  .name("broadcast-server")
  .description("A simple Socket.IO broadcast server CLI")
  .version("1.0.0");

const sharedOptions = [
  ["-p, --port <number>", "Port to listen on / connect to", String(DEFAULT_PORT)],
  ["-H, --host <host>", "Hostname to bind / connect to", DEFAULT_HOST],
];

// ── broadcast-server start ────────────────────────────────────────────────────
program
  .command(COMMANDS.START)
  .description("Start the broadcast server")
  .option(...sharedOptions[0])
  .option(...sharedOptions[1])
  .action(async (opts) => {
    try {
      await runStartCommand(opts);
    } catch (err) {
      handleError(err);
    }
  });

// ── broadcast-server connect ──────────────────────────────────────────────────
program
  .command(COMMANDS.CONNECT)
  .description("Connect a client to the broadcast server")
  .option(...sharedOptions[0])
  .option(...sharedOptions[1])
  .action(async (opts) => {
    try {
      await runConnectCommand(opts);
    } catch (err) {
      handleError(err);
    }
  });

// ─── Unknown Commands ─────────────────────────────────────────────────────────

program.on("command:*", ([unknownCmd]) => {
  handleError(new InvalidCommandError(unknownCmd));
});

// ─── Global Uncaught Error Safety Net ────────────────────────────────────────

process.on("uncaughtException", (err) => {
  handleError(err);
});

process.on("unhandledRejection", (reason) => {
  handleError(reason instanceof Error ? reason : new Error(String(reason)));
});

// ─── Entry Point ──────────────────────────────────────────────────────────────

program.parse(process.argv);

// If no subcommand is provided, show help
if (!process.argv.slice(2).length) {
  program.help();
}
