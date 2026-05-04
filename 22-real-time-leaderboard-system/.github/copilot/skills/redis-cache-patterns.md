# Skill: Redis Cache Patterns

## Purpose
Generate correct Redis cache read/write/invalidate code for leaderboard API endpoints using ioredis.

## When to use
Say: **"Add Redis cache to [model/endpoint]"** or **"Cache the leaderboard query"**

## Cache key conventions

| Data | Key pattern | TTL |
|---|---|---|
| Leaderboard (game, period, limit) | `leaderboard:{gameId}:{period}:{limit}` | 60s |
| User profile | `user:{userId}` | 300s |
| Game metadata | `game:{gameId}` | 600s |
| Score count | `score:count:{gameId}` | 30s |

`period` values: `alltime`, `weekly`, `daily`

## Pattern 1: Cache-aside (read-through)

```js
static async getLeaderboard({ gameId, period = 'alltime', limit = 10 }) {
  const cacheKey = `leaderboard:${gameId}:${period}:${limit}`

  // 1. Try cache
  const cached = await redis.get(cacheKey)
  if (cached) return JSON.parse(cached)

  // 2. Query DB
  const result = await prisma.score.findMany({
    where: buildWhere(gameId, period),
    orderBy: { score_value: 'desc' },
    take: limit,
    select: {
      score_value: true,
      achieved_at: true,
      user: { select: { id: true, username: true } },
    },
  })

  // 3. Store in cache
  await redis.setex(cacheKey, 60, JSON.stringify(result))
  return result
}
```

## Pattern 2: Invalidate on write

```js
// Call this after any score INSERT / DELETE
static async #invalidateLeaderboardCache(gameId) {
  const keys = await redis.keys(`leaderboard:${gameId}:*`)
  if (keys.length > 0) await redis.del(keys)
}
```

## Pattern 3: Atomic increment (score counters)

```js
// Increment counter without a full DB query
static async incrementScoreCount(gameId) {
  const key = `score:count:${gameId}`
  const exists = await redis.exists(key)
  if (!exists) {
    // Populate from DB on first hit
    const count = await prisma.score.count({ where: { game_id: gameId } })
    await redis.setex(key, 30, count)
  } else {
    await redis.incr(key)
  }
}
```

## Redis client singleton (`src/lib/redis.js`)

```js
import Redis from 'ioredis'

const redis = new Redis(process.env.REDIS_URL, {
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  lazyConnect: false,
})

redis.on('error', (err) => {
  console.error('[Redis] Connection error:', err.message)
})

export { redis }
```

## Rules
1. Always `JSON.stringify` / `JSON.parse` — Redis stores strings only.
2. Always set TTL with `setex` — never `set` without expiry in production.
3. If Redis is down, **fail open**: catch the error, log it, proceed to DB.
4. Never cache responses that include `password_hash`.

## Checklist
- [ ] Key follows `resource:id:filter` pattern
- [ ] TTL set (never eternal cache)
- [ ] Invalidation called after every write
- [ ] Redis errors caught and logged (don't crash the request)
