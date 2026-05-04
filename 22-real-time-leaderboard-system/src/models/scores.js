// src/models/scores.js
import { prisma } from '../lib/prisma.js'
import { redis } from '../lib/redis.js'
import { DEFAULTS } from '../../config.js'

const CACHE_PREFIX = 'leaderboard'

/** Build a date filter based on period string. */
function buildDateFilter(period) {
  const now = new Date()
  if (period === 'daily') {
    return new Date(now - 864e5) // 24h
  }
  if (period === 'weekly') {
    return new Date(now - 7 * 864e5) // 7 days
  }
  return null // alltime
}

export class ScoreModel {
  /**
   * List scores with pagination.
   * @param {{ limit?: number, offset?: number, userId?: string, gameId?: string }} params
   */
  static async getAll({ limit = 10, offset = 0, userId, gameId } = {}) {
    try {
      const where = {}
      if (userId) where.user_id = userId
      if (gameId) where.game_id = gameId

      return await prisma.score.findMany({
        where,
        skip: Number(offset),
        take: Number(limit),
        orderBy: { achieved_at: 'desc' },
        include: {
          user: { select: { id: true, username: true } },
          game: { select: { id: true, name: true } },
        },
      })
    } catch (e) {
      throw new Error(`DB: getAll scores failed — ${e.message}`)
    }
  }

  /**
   * Find a score by UUID.
   * @param {string} id
   */
  static async getById(id) {
    try {
      return await prisma.score.findUnique({
        where: { id },
        include: {
          user: { select: { id: true, username: true } },
          game: { select: { id: true, name: true } },
        },
      })
    } catch (e) {
      throw new Error(`DB: getById score ${id} failed — ${e.message}`)
    }
  }

  /**
   * Submit a new score for a user/game pair.
   * @param {{ userId: string, gameId: string, scoreValue: number }} params
   */
  static async create({ userId, gameId, scoreValue }) {
    try {
      const score = await prisma.score.create({
        data: {
          id: crypto.randomUUID(),
          user_id: userId,
          game_id: gameId,
          score_value: scoreValue,
        },
        include: {
          user: { select: { id: true, username: true } },
          game: { select: { id: true, name: true } },
        },
      })
      await ScoreModel.#invalidateCache(gameId)
      return score
    } catch (e) {
      throw new Error(`DB: create score failed — ${e.message}`)
    }
  }

  /**
   * Delete a score by id.
   * @param {string} id
   * @param {string} gameId — needed to invalidate cache
   */
  static async delete(id, gameId) {
    try {
      await prisma.score.delete({ where: { id } })
      await ScoreModel.#invalidateCache(gameId)
    } catch (e) {
      if (e.code === 'P2025') throw Object.assign(new Error('Score not found'), { status: 404 })
      throw new Error(`DB: delete score ${id} failed — ${e.message}`)
    }
  }

  /**
   * Leaderboard for a game — top N, with Redis cache-aside.
   * @param {{ gameId: string, period?: 'alltime'|'weekly'|'daily', limit?: number }} params
   */
  static async getLeaderboard({ gameId, period = 'alltime', limit = 10 }) {
    const cacheKey = `${CACHE_PREFIX}:${gameId}:${period}:${limit}`

    try {
      const cached = await redis.get(cacheKey)
      if (cached) return JSON.parse(cached)
    } catch (e) {
      // Redis failure — fail open, proceed to DB
      console.error('[Redis] get error:', e.message)
    }

    const since = buildDateFilter(period)
    const where = { game_id: gameId }
    if (since) where.achieved_at = { gte: since }

    try {
      const results = await prisma.score.findMany({
        where,
        orderBy: { score_value: 'desc' },
        take: Number(limit),
        select: {
          id: true,
          score_value: true,
          achieved_at: true,
          user: { select: { id: true, username: true } },
        },
      })

      try {
        await redis.setex(cacheKey, DEFAULTS.LEADERBOARD_TTL, JSON.stringify(results))
      } catch (e) {
        console.error('[Redis] setex error:', e.message)
      }

      return results
    } catch (e) {
      throw new Error(`DB: getLeaderboard for game ${gameId} failed — ${e.message}`)
    }
  }

  // ─── Private helpers ──────────────────────────────────────────────────────

  static async #invalidateCache(gameId) {
    try {
      const keys = await redis.keys(`${CACHE_PREFIX}:${gameId}:*`)
      if (keys.length > 0) await redis.del(keys)
    } catch (e) {
      console.error('[Redis] cache invalidation error:', e.message)
    }
  }
}
