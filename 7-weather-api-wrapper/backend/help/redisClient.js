// src/redisClient.js
// ──────────────────────────────────────────────────────────────────────────────
// Singleton de conexión a Redis usando node-redis v4
// Docs: https://redis.io/docs/latest/develop/clients/nodejs/connect/
// ──────────────────────────────────────────────────────────────────────────────

import { createClient } from 'redis';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

let client = null;

/**
 * Retorna (y crea si no existe) el cliente Redis singleton.
 * La conexión se reutiliza en toda la aplicación.
 */
export async function getRedisClient() {
  if (client && client.isOpen) {
    return client;
  }

  client = createClient({
    url: REDIS_URL,
    socket: {
      // Reintenta la conexión automáticamente con backoff exponencial
      reconnectStrategy: (retries) => Math.min(retries * 50, 2000),
    },
  });

  // Listeners de eventos del ciclo de vida
  client.on('connect', () => console.log('[Redis] Conectando...'));
  client.on('ready', () => console.log('[Redis] ✅ Listo y conectado'));
  client.on('error', (err) => console.error('[Redis] ❌ Error:', err.message));
  client.on('reconnecting', () => console.warn('[Redis] ♻️  Reconectando...'));
  client.on('end', () => console.log('[Redis] Conexión cerrada'));

  await client.connect();
  return client;
}

/**
 * Cierra limpiamente la conexión Redis.
 * Llama esto al apagar la aplicación.
 */
export async function closeRedisClient() {
  if (client && client.isOpen) {
    await client.quit();
    client = null;
    console.log('[Redis] Conexión cerrada correctamente');
  }
}
