// ─── Network ──────────────────────────────────────────────────────────────────
const DEFAULT_PORT = 3001;
const DEFAULT_HOST = "localhost";

// ─── Socket.IO Server Options ─────────────────────────────────────────────────
const SERVER_OPTIONS = {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
  pingTimeout: 10000,
  pingInterval: 5000,
};

// ─── Socket Events ────────────────────────────────────────────────────────────
const EVENTS = {
  CONNECTION: "connection",
  DISCONNECT: "disconnect",
  MESSAGE: "message",
  BROADCAST: "broadcast",
  CLIENT_JOINED: "client_joined",
  CLIENT_LEFT: "client_left",
  SERVER_INFO: "server_info",
  ERROR: "error",
};

// ─── CLI Commands ─────────────────────────────────────────────────────────────
const COMMANDS = {
  START: "start",
  CONNECT: "connect",
};

// ─── Display Messages ─────────────────────────────────────────────────────────
const MESSAGES = {
  SERVER_STARTED: (host, port) =>
    `🚀 Broadcast server running on ${host}:${port}`,
  SERVER_SHUTDOWN: "🛑 Server shutting down gracefully...",
  CLIENT_CONNECTED: (id) => `✅ Client connected: ${id}`,
  CLIENT_DISCONNECTED: (id, reason) =>
    `❌ Client disconnected: ${id} (${reason})`,
  MESSAGE_RECEIVED: (id, msg) => `📨 Message from ${id}: ${msg}`,
  BROADCAST_SENT: (count) => `📡 Broadcasted to ${count} client(s)`,
  CONNECTED_TO_SERVER: (host, port) =>
    `✅ Connected to broadcast server at ${host}:${port}`,
  DISCONNECTED_FROM_SERVER: "🔌 Disconnected from server",
  TYPE_MESSAGE: "💬 Type a message and press Enter to broadcast:",
  RECEIVED_BROADCAST: (sender, msg) => `📢 [${sender}]: ${msg}`,
  YOU_SENT: (msg) => `➤ You: ${msg}`,
};

// ─── Exit Codes ───────────────────────────────────────────────────────────────
const EXIT_CODES = {
  SUCCESS: 0,
  GENERAL_ERROR: 1,
  INVALID_COMMAND: 2,
  SERVER_ERROR: 3,
  CLIENT_ERROR: 4,
};

module.exports = {
  DEFAULT_PORT,
  DEFAULT_HOST,
  SERVER_OPTIONS,
  EVENTS,
  COMMANDS,
  MESSAGES,
  EXIT_CODES,
};
