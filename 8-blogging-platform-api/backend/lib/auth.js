// lib/auth.js
// Utilidades de autenticación: bcrypt + JWT

import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { BCRYPT_ROUNDS, JWT_CONFIG } from '@/config'

const JWT_SECRET = process.env.JWT_SECRET

if (!JWT_SECRET) {
  throw new Error('❌ Falta la variable de entorno JWT_SECRET en .env')
}

// ── Contraseña ────────────────────────────────────────────────

/** Hashea una contraseña usando bcrypt. */
export async function hashPassword(plainPassword) {
  return bcrypt.hash(plainPassword, BCRYPT_ROUNDS)
}

/** Compara una contraseña con su hash bcrypt. */
export async function verifyPassword(plainPassword, hashedPassword) {
  return bcrypt.compare(plainPassword, hashedPassword)
}

// ── JWT ───────────────────────────────────────────────────────

/** Genera un JWT firmado. */
export function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_CONFIG.EXPIRES_IN })
}

/** Verifica y decodifica un JWT. Lanza error si es inválido/expirado. */
export function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET)
}

/** Extrae el token Bearer del header Authorization. */
export function extractToken(request) {
  const authHeader = request.headers.get('authorization') ?? ''
  if (!authHeader.startsWith('Bearer ')) return null
  return authHeader.slice(7).trim()
}

/**
 * Obtiene el payload del JWT desde el request.
 * Devuelve null si el token no existe o es inválido.
 */
export function getAuthPayload(request) {
  const token = extractToken(request)
  if (!token) return null
  try {
    return verifyToken(token)
  } catch {
    return null
  }
}
