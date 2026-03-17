// lib/auth.js
// Utilidades de autenticación: hash de contraseñas y manejo de JWT

import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_change_in_production'
const SALT_ROUNDS = 12

// ─────────────────────────────────────────────
// CONTRASEÑAS con bcrypt
// ─────────────────────────────────────────────

/**
 * Cifra una contraseña en texto plano usando bcrypt
 * @param {string} password - Contraseña en texto plano
 * @returns {Promise<string>} Hash de la contraseña
 */
export async function hashPassword(password) {
  return bcrypt.hash(password, SALT_ROUNDS)
}

/**
 * Compara una contraseña en texto plano con su hash
 * @param {string} password - Contraseña en texto plano
 * @param {string} hash - Hash almacenado en DB
 * @returns {Promise<boolean>}
 */
export async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash)
}

// ─────────────────────────────────────────────
// JWT Tokens
// ─────────────────────────────────────────────

/**
 * Genera un JWT para el usuario
 * @param {object} payload - Datos a incluir en el token (ej: { id, email })
 * @param {string} expiresIn - Tiempo de expiración (default: '7d')
 * @returns {string} Token JWT firmado
 */
export function generateToken(payload, expiresIn = '7d') {
  return jwt.sign(payload, JWT_SECRET, { expiresIn })
}

/**
 * Verifica y decodifica un JWT
 * @param {string} token - Token JWT a verificar
 * @returns {object|null} Payload decodificado o null si es inválido
 */
export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET)
  } catch {
    return null
  }
}

/**
 * Extrae el token del header Authorization (Bearer token)
 * @param {Request} request - Request de Next.js
 * @returns {string|null} Token o null
 */
export function extractToken(request) {
  const authHeader = request.headers.get('Authorization') || request.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null
  return authHeader.substring(7)
}

/**
 * Middleware para verificar autenticación desde la Request
 * @param {Request} request
 * @returns {{ user: object }|{ error: string, status: number }}
 */
export function requireAuth(request) {
  const token = extractToken(request)
  if (!token) {
    return { error: 'No se proporcionó token de autenticación', status: 401 }
  }
  const decoded = verifyToken(token)
  if (!decoded) {
    return { error: 'Token inválido o expirado', status: 401 }
  }
  return { user: decoded }
}
