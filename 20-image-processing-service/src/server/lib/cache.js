/**
 * @file lib/cache.js
 * @description In-memory cache wrapper using node-cache.
 * Used to cache image metadata and avoid redundant DB queries.
 */
import NodeCache from 'node-cache'
import { DEFAULTS } from '../config.js'

const TTL = parseInt(process.env.CACHE_TTL_SECONDS ?? DEFAULTS.CACHE_TTL_SECONDS, 10)

export const cache = new NodeCache({ stdTTL: TTL, checkperiod: TTL * 0.2, useClones: false })

/**
 * Wraps an async getter with cache-aside logic.
 * @param {string} key - Cache key
 * @param {() => Promise<any>} fetcher - Async function to call on cache miss
 * @param {number} [ttl] - Optional TTL override in seconds
 */
export async function cacheAside(key, fetcher, ttl) {
  const cached = cache.get(key)
  if (cached !== undefined) return cached

  const value = await fetcher()
  if (value !== null && value !== undefined) {
    cache.set(key, value, ttl ?? TTL)
  }
  return value
}

export const cacheKeys = {
  image: (id) => `image:${id}`,
  imageList: (userId, page, limit) => `images:${userId}:${page}:${limit}`,
  product: (id) => `product:${id}`,
  productList: (page, limit) => `products:${page}:${limit}`,
}
