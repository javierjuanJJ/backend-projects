const { MESSAGES } = require("../constants");
const { MessageBroadcastError } = require("../errors");

// ─── Client Manager ───────────────────────────────────────────────────────────

/**
 * Manages the registry of connected Socket.IO clients.
 * Responsible for adding, removing and querying clients.
 */
class ClientManager {
  constructor() {
    /** @type {Map<string, import("socket.io").Socket>} */
    this._clients = new Map();
  }

  /**
   * Registers a new connected client.
   * @param {import("socket.io").Socket} socket
   */
  addClient(socket) {
    this._clients.set(socket.id, socket);
  }

  /**
   * Removes a client from the registry by socket ID.
   * @param {string} socketId
   */
  removeClient(socketId) {
    this._clients.delete(socketId);
  }

  /**
   * Returns the total number of currently connected clients.
   * @returns {number}
   */
  getCount() {
    return this._clients.size;
  }

  /**
   * Returns all connected socket instances.
   * @returns {import("socket.io").Socket[]}
   */
  getAll() {
    return Array.from(this._clients.values());
  }

  /**
   * Returns all connected socket IDs.
   * @returns {string[]}
   */
  getAllIds() {
    return Array.from(this._clients.keys());
  }

  /**
   * Checks whether a given socket ID is currently registered.
   * @param {string} socketId
   * @returns {boolean}
   */
  hasClient(socketId) {
    return this._clients.has(socketId);
  }

  /**
   * Broadcasts a message to all connected clients except the sender.
   * Throws MessageBroadcastError if the io instance is not provided.
   * @param {import("socket.io").Server} io  - Socket.IO server instance
   * @param {string} senderId               - The ID of the originating socket
   * @param {string} event                  - The event name to emit
   * @param {object} payload                - The data to broadcast
   */
  broadcastToAll(io, senderId, event, payload) {
    if (!io) {
      throw new MessageBroadcastError(
        "Socket.IO server instance is not available"
      );
    }

    const recipients = this.getCount();

    if (recipients === 0) {
      return 0;
    }

    // Emit to every connected socket including the sender
    io.emit(event, payload);

    return recipients;
  }

  /**
   * Returns a formatted summary of connected clients for logging.
   * @returns {string}
   */
  getSummary() {
    const count = this.getCount();
    if (count === 0) return "No clients connected.";
    return `Connected clients (${count}): ${this.getAllIds().join(", ")}`;
  }
}

module.exports = ClientManager;
