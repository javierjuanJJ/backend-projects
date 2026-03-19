// config/index.js
// Constantes globales de la aplicación

export const DEFAULTS = {
  PORT: 3000,
  LIMIT_PAGINATION: 10,
  LIMIT_OFFSET: 0,
}

export const CORS_ACCEPTED_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:1234',
  'http://localhost:5173',
  'http://localhost:4321',
]

export const JWT_CONFIG = {
  EXPIRES_IN: process.env.JWT_EXPIRES_IN ?? '7d',
}

export const BCRYPT_ROUNDS = 12
