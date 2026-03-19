// src/lib/redis.js
// Singleton del cliente Redis con node-redis v4
// Docs: https://redis.io/docs/latest/develop/clients/nodejs/connect/

import { createClient } from 'redis'
import { DEFAULTS } from '../config.js'

const REDIS_URL = process.env.REDIS_URL ?? 'redis://localhost:6379'

let client = null

/**
 * Retorna (y crea si no existe) el cliente Redis singleton.
 * La conexión se reutiliza en toda la aplicación.
 */
export async function getRedisClient() {
  if (client?.isOpen) return client

  client = createClient({
    url: REDIS_URL,
    socket: {
      reconnectStrategy: (retries) => Math.min(retries * 50, 2000),
    },
  })

  client.on('connect',     () => console.log('[Redis] Conectando...'))
  client.on('ready',       () => console.log('[Redis] ✅ Listo'))
  client.on('error',  (err) => console.error('[Redis] ❌', err.message))
  client.on('reconnecting',() => console.warn('[Redis] ♻️  Reconectando...'))

  await client.connect()
  return client
}

export async function closeRedisClient() {
  if (client?.isOpen) {
    await client.quit()
    client = null
    console.log('[Redis] Conexión cerrada')
  }
}

// ── Helpers de caché ──────────────────────────────────────────────────────────

/**
 * Obtiene un valor JSON desde Redis.
 * @returns {object|null} objeto parseado, o null si no existe
 */
export async function cacheGet(key) {
  const redis = await getRedisClient()
  const raw = await redis.get(key)
  return raw ? JSON.parse(raw) : null
}

/**
 * Guarda un objeto JSON en Redis con TTL opcional.
 * @param {string} key
 * @param {object} value
 * @param {number} [ttl] segundos de expiración (default: CACHE_TTL env o 12h)
 */
export async function cacheSet(key, value, ttl) {
  const redis = await getRedisClient()
  const expiresIn = ttl ?? parseInt(process.env.CACHE_TTL_SECONDS ?? DEFAULTS.CACHE_TTL, 10)
  await redis.set(key, JSON.stringify(value), { EX: expiresIn })
}

/**
 * Elimina una clave del caché.
 * @returns {boolean} true si existía y fue eliminada
 */
export async function cacheDel(key) {
  const redis = await getRedisClient()
  const count = await redis.del(key)
  return count > 0
}

/**
 * Retorna el TTL restante en segundos de una clave (-2 si no existe).
 */
export async function cacheTTL(key) {
  const redis = await getRedisClient()
  return redis.ttl(key)
}
