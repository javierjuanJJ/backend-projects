const http = require("http");
const { Server } = require("socket.io");
const chalk = require("chalk");

const { DEFAULT_PORT, DEFAULT_HOST, SERVER_OPTIONS, EVENTS, MESSAGES } =
  require("../constants");
const {
  ServerStartError,
  PortInUseError,
  ServerShutdownError,
  MessageBroadcastError,
} = require("../errors");
const ClientManager = require("./clientManager");

// ─── Server State ─────────────────────────────────────────────────────────────

/** @type {http.Server | null} */
let httpServer = null;

/** @type {import("socket.io").Server | null} */
let ioServer = null;

/** @type {ClientManager} */
const clientManager = new ClientManager();

// ─── Event Handlers ───────────────────────────────────────────────────────────

/**
 * Handles a new incoming client connection.
 * Registers the client and sets up per-socket event listeners.
 * @param {import("socket.io").Socket} socket
 */
const handleClientConnection = (socket) => {
  clientManager.addClient(socket);

  console.log(chalk.green(MESSAGES.CLIENT_CONNECTED(socket.id)));
  console.log(chalk.gray(`  └─ ${clientManager.getSummary()}`));

  // Notify the newly connected client with server info
  socket.emit(EVENTS.SERVER_INFO, {
    message: `Welcome! You are connected as ${socket.id}`,
    clientId: socket.id,
    totalClients: clientManager.getCount(),
  });

  // Notify all other clients that a new peer joined
  socket.broadcast.emit(EVENTS.CLIENT_JOINED, {
    clientId: socket.id,
    totalClients: clientManager.getCount(),
  });

  socket.on(EVENTS.MESSAGE, (data) => handleIncomingMessage(socket, data));
  socket.on(EVENTS.DISCONNECT, (reason) =>
    handleClientDisconnection(socket, reason)
  );
  socket.on(EVENTS.ERROR, (err) => handleSocketError(socket, err));
};

/**
 * Handles an incoming message from a client and broadcasts it to all.
 * Throws MessageBroadcastError if the broadcast fails.
 * @param {import("socket.io").Socket} socket
 * @param {object|string} data
 */
const handleIncomingMessage = (socket, data) => {
  const text = typeof data === "string" ? data : data?.text ?? String(data);

  console.log(chalk.cyan(MESSAGES.MESSAGE_RECEIVED(socket.id, text)));

  const payload = {
    senderId: socket.id,
    text,
    timestamp: new Date().toISOString(),
  };

  const count = clientManager.broadcastToAll(
    ioServer,
    socket.id,
    EVENTS.BROADCAST,
    payload
  );

  console.log(chalk.gray(MESSAGES.BROADCAST_SENT(count)));
};

/**
 * Handles a client disconnection and notifies remaining clients.
 * @param {import("socket.io").Socket} socket
 * @param {string} reason
 */
const handleClientDisconnection = (socket, reason) => {
  clientManager.removeClient(socket.id);

  console.log(chalk.yellow(MESSAGES.CLIENT_DISCONNECTED(socket.id, reason)));
  console.log(chalk.gray(`  └─ ${clientManager.getSummary()}`));

  // Notify remaining clients
  ioServer.emit(EVENTS.CLIENT_LEFT, {
    clientId: socket.id,
    totalClients: clientManager.getCount(),
  });
};

/**
 * Handles a socket-level error event.
 * @param {import("socket.io").Socket} socket
 * @param {Error} err
 */
const handleSocketError = (socket, err) => {
  console.error(
    chalk.red(`⚠️  Socket error from ${socket.id}: ${err.message}`)
  );
};

// ─── HTTP Server Error Mapping ────────────────────────────────────────────────

/**
 * Maps Node.js system error codes from http.Server to custom errors.
 * @param {NodeJS.ErrnoException} err
 * @param {number} port
 */
const mapHttpServerError = (err, port) => {
  if (err.code === "EADDRINUSE") {
    throw new PortInUseError(port);
  }
  throw new ServerStartError(err.message, err);
};

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Starts the broadcast server on the given host and port.
 * Throws ServerStartError or PortInUseError on failure.
 * @param {{ port?: number, host?: string }} options
 * @returns {Promise<void>}
 */
const startServer = (options = {}) => {
  const port = options.port ?? DEFAULT_PORT;
  const host = options.host ?? DEFAULT_HOST;

  return new Promise((resolve, reject) => {
    httpServer = http.createServer();
    ioServer = new Server(httpServer, SERVER_OPTIONS);

    ioServer.on(EVENTS.CONNECTION, handleClientConnection);

    httpServer.on("error", (err) => {
      try {
        mapHttpServerError(err, port);
      } catch (mappedError) {
        reject(mappedError);
      }
    });

    httpServer.listen(port, host, () => {
      console.log(chalk.bold.green(MESSAGES.SERVER_STARTED(host, port)));
      console.log(
        chalk.gray("  Waiting for clients to connect. Press Ctrl+C to stop.\n")
      );
      resolve();
    });
  });
};

/**
 * Gracefully shuts down the server, closing all connections.
 * Throws ServerShutdownError if teardown fails.
 * @returns {Promise<void>}
 */
const stopServer = () => {
  return new Promise((resolve, reject) => {
    if (!httpServer) {
      resolve();
      return;
    }

    console.log(chalk.yellow(MESSAGES.SERVER_SHUTDOWN));

    ioServer.close((err) => {
      // "Server is not running" is benign — no active HTTP server to close
      if (err && !err.message.includes("not running")) {
        reject(new ServerShutdownError(err.message, err));
        return;
      }

      httpServer.close((httpErr) => {
        if (httpErr) {
          reject(new ServerShutdownError(httpErr.message, httpErr));
          return;
        }
        console.log(chalk.green("✅ Server stopped cleanly."));
        resolve();
      });
    });
  });
};

module.exports = {
  startServer,
  stopServer,
};
