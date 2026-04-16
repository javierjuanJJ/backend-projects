/**
 * @file config.js
 * @description Centralised application constants and defaults.
 * All environment-dependent values are read here — never scattered across files.
 */

export const DEFAULTS = {
  PORT: 3000,
  LIMIT_PAGINATION: 10,
  LIMIT_OFFSET: 0,
  BCRYPT_ROUNDS: 10,
  JWT_EXPIRES_IN: '7d',
  MAX_FILE_SIZE_MB: 10,
  CACHE_TTL_SECONDS: 300,
  RATE_LIMIT_WINDOW_MS: 15 * 60 * 1000, // 15 minutes
  RATE_LIMIT_MAX: 20,
  UPLOAD_DIR: './uploads',
  CACHE_DIR: './cache',
}

export const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
  'image/gif',
  'image/tiff',
]

export const ACCEPTED_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:1234',
  ...(process.env.CORS_ALLOWED_ORIGINS?.split(',').map(o => o.trim()) ?? []),
]

export const TRANSFORM_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  DONE: 'done',
  FAILED: 'failed',
}

export const USER_ROLES = {
  CUSTOMER: 'customer',
  ADMIN: 'admin',
}

export const QUEUE_NAME = 'image_transforms'
