// src/config/index.js
import 'dotenv/config'

export const DEFAULTS = {
  PORT: 3000,
  LIMIT_PAGINATION: 10,
  LIMIT_OFFSET: 0,
  MAX_FILE_SIZE_MB: 5,
}

export const ACCEPTED_ORIGINS = (process.env.ACCEPTED_ORIGINS ?? '')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean)
  .concat([
    'http://localhost:3000',
    'http://localhost:5173',
    'http://localhost:4321',
  ])
