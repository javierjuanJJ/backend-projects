// src/lib/redis.js
import Redis from 'ioredis'

const redis = new Redis(process.env.REDIS_URL ?? 'redis://localhost:6379', {
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  lazyConnect: false,
})

redis.on('error', (err) => {
  // Fail open — log the error but don't crash the process
  console.error('[Redis] Connection error:', err.message)
})

redis.on('connect', () => {
  if (process.env.NODE_ENV !== 'test') {
    console.log('[Redis] Connected')
  }
})

export { redis }
