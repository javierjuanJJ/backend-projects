// src/config/index.js
import 'dotenv/config'

export const DEFAULTS = {
  PORT: 3001,
  LIMIT_PAGINATION: 10,
  LIMIT_OFFSET: 0,
}

export const ACCEPTED_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:5173',
  'http://localhost:1234',
]

export const JWT_SECRET =
  process.env.JWT_SECRET || 'fallback_secret_cambia_esto_en_produccion'

export const SALT_ROUNDS = 12
