/**
 * @file middlewares/rateLimiter.js
 * @description Rate limiting middleware using express-rate-limit.
 * Stricter limit applied to the image transformation endpoint.
 */
import rateLimit from 'express-rate-limit'
import { DEFAULTS } from '../config.js'

const windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS ?? DEFAULTS.RATE_LIMIT_WINDOW_MS, 10)
const max      = parseInt(process.env.RATE_LIMIT_MAX ?? DEFAULTS.RATE_LIMIT_MAX, 10)

/**
 * Rate limiter for image transformation endpoint.
 * Default: 20 requests per 15 minutes per IP.
 */
export const transformRateLimiter = rateLimit({
  windowMs,
  max,
  standardHeaders: true,  // Return RateLimit-* headers
  legacyHeaders: false,
  keyGenerator: (req) => req.user?.id ?? req.ip, // rate-limit per user when authenticated
  handler: (_req, res) =>
    res.status(429).json({
      error: 'Too many transformation requests. Please try again later.',
      retryAfter: Math.ceil(windowMs / 1000),
    }),
})

/**
 * General API rate limiter — more permissive.
 * 200 requests per 15 minutes per IP.
 */
export const apiRateLimiter = rateLimit({
  windowMs,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) =>
    res.status(429).json({ error: 'Too many requests. Please slow down.' }),
})
