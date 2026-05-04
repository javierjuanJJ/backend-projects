# Skill: Generate Prisma Model

## Purpose
Generate a complete `src/models/[resource].js` with Prisma queries, Redis cache invalidation, and JSDoc — ready to plug into the controller.

## When to use
Say: **"Generate model for [resource]"** or **"Write Prisma model for [resource]"**

## Output template

`src/models/[resource].js`:

```js
import { prisma } from '../lib/prisma.js'
import { redis } from '../lib/redis.js'

const CACHE_TTL = Number(process.env.LEADERBOARD_CACHE_TTL ?? 60)
const CACHE_PREFIX = '[resource]'

export class [Resource]Model {
  /**
   * List [resource]s with optional filters and pagination.
   * @param {{ limit?: number, offset?: number }} params
   */
  static async getAll({ limit = 10, offset = 0 } = {}) {
    try {
      return await prisma.[resource].findMany({
        skip: Number(offset),
        take: Number(limit),
        orderBy: { created_at: 'desc' },
        // TODO: add select: {} to exclude sensitive fields if needed
      })
    } catch (e) {
      throw new Error(`DB: getAll [resource] failed — ${e.message}`)
    }
  }

  /**
   * Find a single [resource] by UUID.
   * @param {string} id
   */
  static async getById(id) {
    try {
      return await prisma.[resource].findUnique({ where: { id } })
    } catch (e) {
      throw new Error(`DB: getById [resource] ${id} failed — ${e.message}`)
    }
  }

  /**
   * Create a new [resource].
   * @param {object} data
   */
  static async create(data) {
    try {
      const item = await prisma.[resource].create({
        data: { id: crypto.randomUUID(), ...data },
      })
      await [Resource]Model.#invalidateCache()
      return item
    } catch (e) {
      throw new Error(`DB: create [resource] failed — ${e.message}`)
    }
  }

  /**
   * Full update of a [resource].
   * @param {{ id: string } & object} params
   */
  static async update({ id, ...data }) {
    try {
      const item = await prisma.[resource].update({ where: { id }, data })
      await [Resource]Model.#invalidateCache()
      return item
    } catch (e) {
      throw new Error(`DB: update [resource] ${id} failed — ${e.message}`)
    }
  }

  /**
   * Partial update — merges only provided fields.
   * @param {{ id: string, partialData: object }} params
   */
  static async partialUpdate({ id, partialData }) {
    try {
      const item = await prisma.[resource].update({ where: { id }, data: partialData })
      await [Resource]Model.#invalidateCache()
      return item
    } catch (e) {
      throw new Error(`DB: partialUpdate [resource] ${id} failed — ${e.message}`)
    }
  }

  /**
   * Delete a [resource] by id.
   * @param {string} id
   */
  static async delete(id) {
    try {
      await prisma.[resource].delete({ where: { id } })
      await [Resource]Model.#invalidateCache()
    } catch (e) {
      throw new Error(`DB: delete [resource] ${id} failed — ${e.message}`)
    }
  }

  // ─── Private: cache helpers ───────────────────────────────
  static async #invalidateCache() {
    const keys = await redis.keys(`${CACHE_PREFIX}:*`)
    if (keys.length) await redis.del(keys)
  }
}
```

## Leaderboard-specific model additions
For the `Score` model, add these extra methods after `delete`:

```js
  /**
   * Top N scores for a game, cached.
   * @param {{ gameId: string, limit?: number, since?: Date }} params
   */
  static async getLeaderboard({ gameId, limit = 10, since = null }) {
    const cacheKey = `leaderboard:${gameId}:${since?.toISOString() ?? 'alltime'}:${limit}`
    const cached = await redis.get(cacheKey)
    if (cached) return JSON.parse(cached)

    const where = { game_id: gameId }
    if (since) where.achieved_at = { gte: since }

    const results = await prisma.score.findMany({
      where,
      orderBy: { score_value: 'desc' },
      take: limit,
      select: {
        id: true,
        score_value: true,
        achieved_at: true,
        user: { select: { id: true, username: true } },
      },
    })

    await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(results))
    return results
  }
```

## Checklist
- [ ] All methods have try/catch with descriptive messages
- [ ] `crypto.randomUUID()` used in `create`
- [ ] `password_hash` never in select
- [ ] Cache invalidated on write operations
- [ ] JSDoc on every public method
