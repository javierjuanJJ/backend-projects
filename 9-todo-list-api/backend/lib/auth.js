// src/lib/auth.js
// Utilidades de cifrado y JWT

import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { JWT_SECRET, SALT_ROUNDS } from '../config/index.js'

// ── Contraseñas ────────────────────────────────────────────
export const hashPassword = (password) => bcrypt.hash(password, SALT_ROUNDS)

export const verifyPassword = (password, hash) => bcrypt.compare(password, hash)

// ── JWT ────────────────────────────────────────────────────
export const generateToken = (payload, expiresIn = '7d') =>
  jwt.sign(payload, JWT_SECRET, { expiresIn })

export const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET)
  } catch {
    return null
  }
}

/**
 * Extrae el Bearer token del header Authorization
 * @param {import('express').Request} req
 * @returns {string|null}
 */
export const extractToken = (req) => {
  const auth = req.headers['authorization'] || ''
  if (!auth.startsWith('Bearer ')) return null
  return auth.slice(7)
}
