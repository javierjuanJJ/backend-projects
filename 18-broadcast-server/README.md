# broadcast-server

A CLI broadcast server built with **Socket.IO**. Clients connect to a running
server and every message sent by any client is broadcast to **all** connected
clients in real time.

---

## Project Structure

```
broadcast-server/
├── index.js                  ← CLI entry point & global error handler
├── package.json
└── src/
    ├── constants/
    │   └── index.js          ← All magic strings / config values
    ├── errors/
    │   └── index.js          ← Custom error hierarchy
    ├── server/
    │   ├── server.js         ← Socket.IO server lifecycle
    │   └── clientManager.js  ← Connected-client registry
    └── client/
        └── client.js         ← Socket.IO client + readline input loop
```

---

## Installation

```bash
npm install
```

To use the `broadcast-server` command globally:

```bash
npm link
```

---

## Usage

### Start the server

```bash
broadcast-server start
# or with options:
broadcast-server start --port 4000 --host 0.0.0.0
```

### Connect a client

Open one or more terminals and run:

```bash
broadcast-server connect
# or with options:
broadcast-server connect --port 4000 --host localhost
```

Type a message and press **Enter** — it will appear in every connected
client's terminal.

Press **Ctrl+C** to disconnect or stop the server gracefully.

---

## Options (both commands)

| Flag              | Default       | Description                         |
|-------------------|---------------|-------------------------------------|
| `-p, --port`      | `3001`        | Port to listen on / connect to      |
| `-H, --host`      | `localhost`   | Hostname to bind / connect to       |

---

## Custom Error Classes

| Class                     | Code                        | When thrown                              |
|---------------------------|-----------------------------|------------------------------------------|
| `BroadcastServerError`    | `BROADCAST_SERVER_ERROR`    | Base class                               |
| `InvalidCommandError`     | `INVALID_COMMAND`           | Unknown CLI command                      |
| `InvalidOptionError`      | `INVALID_OPTION`            | Bad `--port` or `--host` value           |
| `ServerStartError`        | `SERVER_START_ERROR`        | Server fails to start                    |
| `PortInUseError`          | `PORT_IN_USE`               | Port already occupied                    |
| `MessageBroadcastError`   | `MESSAGE_BROADCAST_ERROR`   | Broadcast fails                          |
| `ServerShutdownError`     | `SERVER_SHUTDOWN_ERROR`     | Shutdown teardown fails                  |
| `ClientConnectionError`   | `CLIENT_CONNECTION_ERROR`   | Cannot reach the server                  |
| `ClientDisconnectionError`| `CLIENT_DISCONNECTION_ERROR`| Unexpected drop                          |
| `MessageSendError`        | `MESSAGE_SEND_ERROR`        | Message cannot be emitted                |

All errors are caught exclusively in **`index.js`** — no `try/catch` inside
domain functions.
