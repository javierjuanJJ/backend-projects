const readline = require("readline");
const { io } = require("socket.io-client");
const chalk = require("chalk");

const { DEFAULT_PORT, DEFAULT_HOST, EVENTS, MESSAGES } =
  require("../constants");
const {
  ClientConnectionError,
  ClientDisconnectionError,
  MessageSendError,
} = require("../errors");

// ─── Client State ─────────────────────────────────────────────────────────────

/** @type {import("socket.io-client").Socket | null} */
let socket = null;

/** @type {readline.Interface | null} */
let rl = null;

/** @type {string | null} */
let myClientId = null;

// ─── Readline Interface ───────────────────────────────────────────────────────

/**
 * Creates and returns a readline interface bound to stdin/stdout.
 * @returns {readline.Interface}
 */
const createReadlineInterface = () => {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false,
  });
};

/**
 * Prompts the user for input and sends each line as a message.
 * Throws MessageSendError if the socket is not connected when sending.
 */
const startInputLoop = () => {
  rl = createReadlineInterface();

  console.log(chalk.bold.cyan(`\n${MESSAGES.TYPE_MESSAGE}\n`));

  rl.on("line", (line) => {
    const text = line.trim();
    if (!text) return;

    if (!socket || !socket.connected) {
      throw new MessageSendError("Socket is not connected");
    }

    socket.emit(EVENTS.MESSAGE, { text });
    console.log(chalk.dim(MESSAGES.YOU_SENT(text)));
  });

  rl.on("close", () => {
    disconnectClient();
  });
};

// ─── Socket Event Handlers ────────────────────────────────────────────────────

/**
 * Called when the socket successfully connects to the server.
 */
const handleConnect = () => {
  console.log(
    chalk.bold.green(
      `\n${MESSAGES.CONNECTED_TO_SERVER(socket.io.opts.hostname, socket.io.opts.port)}`
    )
  );
};

/**
 * Called when the server sends this client its identity info.
 * @param {{ message: string, clientId: string, totalClients: number }} data
 */
const handleServerInfo = (data) => {
  myClientId = data.clientId;
  console.log(chalk.blue(`🆔 Your ID: ${data.clientId}`));
  console.log(
    chalk.gray(`   Total clients connected: ${data.totalClients}\n`)
  );
  startInputLoop();
};

/**
 * Called when the socket receives a broadcast message from the server.
 * @param {{ senderId: string, text: string, timestamp: string }} data
 */
const handleBroadcast = (data) => {
  const label =
    data.senderId === myClientId
      ? chalk.dim(`[you]`)
      : chalk.bold.magenta(`[${data.senderId}]`);

  const time = new Date(data.timestamp).toLocaleTimeString();
  console.log(`\n📢 ${label} ${chalk.white(data.text)} ${chalk.gray(time)}`);
};

/**
 * Called when a new client joins the server.
 * @param {{ clientId: string, totalClients: number }} data
 */
const handleClientJoined = (data) => {
  if (data.clientId !== myClientId) {
    console.log(
      chalk.green(
        `\n👤 New client joined: ${data.clientId} (total: ${data.totalClients})`
      )
    );
  }
};

/**
 * Called when a client leaves the server.
 * @param {{ clientId: string, totalClients: number }} data
 */
const handleClientLeft = (data) => {
  console.log(
    chalk.yellow(
      `\n👋 Client left: ${data.clientId} (total: ${data.totalClients})`
    )
  );
};

/**
 * Called when the socket disconnects from the server.
 * Throws ClientDisconnectionError for unexpected disconnections.
 * @param {string} reason
 */
const handleDisconnect = (reason) => {
  console.log(chalk.red(`\n${MESSAGES.DISCONNECTED_FROM_SERVER}`));

  const intentionalReasons = ["io client disconnect", "transport close"];
  if (!intentionalReasons.includes(reason)) {
    throw new ClientDisconnectionError(reason);
  }

  cleanup();
  process.exit(0);
};

/**
 * Called when a socket-level error occurs.
 * Throws ClientConnectionError so index.js can handle it.
 * @param {Error} err
 */
const handleSocketError = (err) => {
  throw new ClientConnectionError(
    socket?.io?.opts?.hostname ?? DEFAULT_HOST,
    socket?.io?.opts?.port ?? DEFAULT_PORT,
    err.message
  );
};

// ─── Lifecycle ────────────────────────────────────────────────────────────────

/**
 * Tears down the readline interface.
 */
const cleanup = () => {
  if (rl) {
    rl.close();
    rl = null;
  }
};

/**
 * Disconnects the socket and cleans up resources.
 */
const disconnectClient = () => {
  cleanup();
  if (socket && socket.connected) {
    socket.disconnect();
  }
};

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Connects to the broadcast server.
 * Throws ClientConnectionError if the connection cannot be established.
 * @param {{ port?: number, host?: string }} options
 * @returns {Promise<void>}  Resolves once the socket is connected.
 */
const connectClient = (options = {}) => {
  const port = options.port ?? DEFAULT_PORT;
  const host = options.host ?? DEFAULT_HOST;
  const url = `http://${host}:${port}`;

  return new Promise((resolve, reject) => {
    console.log(chalk.gray(`Connecting to ${url}...`));

    socket = io(url, {
      reconnection: false,
      timeout: 5000,
    });

    const connectionTimeout = setTimeout(() => {
      socket.disconnect();
      reject(new ClientConnectionError(host, port, "connection timed out"));
    }, 6000);

    socket.once(EVENTS.CONNECTION, () => {
      clearTimeout(connectionTimeout);
      handleConnect();
      resolve();
    });

    socket.once("connect_error", (err) => {
      clearTimeout(connectionTimeout);
      reject(new ClientConnectionError(host, port, err.message));
    });

    socket.on(EVENTS.SERVER_INFO, handleServerInfo);
    socket.on(EVENTS.BROADCAST, handleBroadcast);
    socket.on(EVENTS.CLIENT_JOINED, handleClientJoined);
    socket.on(EVENTS.CLIENT_LEFT, handleClientLeft);
    socket.on(EVENTS.DISCONNECT, handleDisconnect);
    socket.on(EVENTS.ERROR, handleSocketError);
  });
};

module.exports = {
  connectClient,
  disconnectClient,
};
