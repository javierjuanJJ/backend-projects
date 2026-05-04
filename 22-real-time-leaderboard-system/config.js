// config.js
export const DEFAULTS = {
  PORT: 3000,
  LIMIT_PAGINATION: 10,
  LIMIT_OFFSET: 0,
  LIMIT_MAX: 100,
  LEADERBOARD_TTL: Number(process.env.LEADERBOARD_CACHE_TTL ?? 60),
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN ?? '7d',
  BCRYPT_ROUNDS: 10,
}

export const ACCEPTED_ORIGINS = process.env.ACCEPTED_ORIGINS
  ? process.env.ACCEPTED_ORIGINS.split(',').map((o) => o.trim())
  : [
      'http://localhost:3000',
      'http://localhost:5173',
      'http://localhost:4173',
    ]
