// ─── Base Error ───────────────────────────────────────────────────────────────

/**
 * Base error for all broadcast-server errors.
 * All custom errors extend this class.
 */
class BroadcastServerError extends Error {
  constructor(message, code = "BROADCAST_SERVER_ERROR") {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    // Preserves correct stack trace in V8
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

// ─── Command Errors ───────────────────────────────────────────────────────────

/**
 * Thrown when an invalid or unknown CLI command is provided.
 */
class InvalidCommandError extends BroadcastServerError {
  constructor(command) {
    super(
      `Invalid command: "${command}". Use "start" to start the server or "connect" to connect a client.`,
      "INVALID_COMMAND"
    );
    this.command = command;
  }
}

/**
 * Thrown when required CLI options are missing or malformed.
 */
class InvalidOptionError extends BroadcastServerError {
  constructor(option, reason) {
    super(`Invalid option "${option}": ${reason}`, "INVALID_OPTION");
    this.option = option;
  }
}

// ─── Server Errors ────────────────────────────────────────────────────────────

/**
 * Thrown when the server fails to start.
 */
class ServerStartError extends BroadcastServerError {
  constructor(reason, originalError = null) {
    super(`Failed to start the server: ${reason}`, "SERVER_START_ERROR");
    this.originalError = originalError;
  }
}

/**
 * Thrown when the specified port is already in use.
 */
class PortInUseError extends BroadcastServerError {
  constructor(port) {
    super(
      `Port ${port} is already in use. Please choose a different port with --port <number>.`,
      "PORT_IN_USE"
    );
    this.port = port;
  }
}

/**
 * Thrown when the server fails to broadcast a message.
 */
class MessageBroadcastError extends BroadcastServerError {
  constructor(reason, originalError = null) {
    super(`Failed to broadcast message: ${reason}`, "MESSAGE_BROADCAST_ERROR");
    this.originalError = originalError;
  }
}

/**
 * Thrown when the server encounters an error shutting down.
 */
class ServerShutdownError extends BroadcastServerError {
  constructor(reason, originalError = null) {
    super(`Error during server shutdown: ${reason}`, "SERVER_SHUTDOWN_ERROR");
    this.originalError = originalError;
  }
}

// ─── Client Errors ────────────────────────────────────────────────────────────

/**
 * Thrown when the client cannot connect to the server.
 */
class ClientConnectionError extends BroadcastServerError {
  constructor(host, port, reason) {
    super(
      `Could not connect to server at ${host}:${port} — ${reason}`,
      "CLIENT_CONNECTION_ERROR"
    );
    this.host = host;
    this.port = port;
  }
}

/**
 * Thrown when the client loses connection unexpectedly.
 */
class ClientDisconnectionError extends BroadcastServerError {
  constructor(reason) {
    super(
      `Unexpectedly disconnected from server: ${reason}`,
      "CLIENT_DISCONNECTION_ERROR"
    );
    this.reason = reason;
  }
}

/**
 * Thrown when the client fails to send a message.
 */
class MessageSendError extends BroadcastServerError {
  constructor(reason, originalError = null) {
    super(`Failed to send message: ${reason}`, "MESSAGE_SEND_ERROR");
    this.originalError = originalError;
  }
}

// ─── Exports ──────────────────────────────────────────────────────────────────

module.exports = {
  BroadcastServerError,
  InvalidCommandError,
  InvalidOptionError,
  ServerStartError,
  PortInUseError,
  MessageBroadcastError,
  ServerShutdownError,
  ClientConnectionError,
  ClientDisconnectionError,
  MessageSendError,
};
