// lib/auth.js
// Utilidades de autenticación: bcrypt + JWT

const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

const JWT_SECRET = process.env.JWT_SECRET
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d'
const SALT_ROUNDS = 12

if (!JWT_SECRET) {
  throw new Error('❌ Falta la variable de entorno JWT_SECRET en .env')
}

// ─── Contraseña ───────────────────────────────────────────────

/**
 * Hashea una contraseña en claro usando bcrypt.
 * @param {string} plainPassword
 * @returns {Promise<string>} hash
 */
async function hashPassword(plainPassword) {
  return bcrypt.hash(plainPassword, SALT_ROUNDS)
}

/**
 * Compara una contraseña en claro con un hash bcrypt.
 * @param {string} plainPassword
 * @param {string} hashedPassword
 * @returns {Promise<boolean>}
 */
async function verifyPassword(plainPassword, hashedPassword) {
  return bcrypt.compare(plainPassword, hashedPassword)
}

// ─── JWT ──────────────────────────────────────────────────────

/**
 * Genera un JWT firmado con el payload dado.
 * @param {{ id: number, username: string }} payload
 * @returns {string} token
 */
function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })
}

/**
 * Verifica y decodifica un JWT.
 * @param {string} token
 * @returns {{ id: number, username: string, iat: number, exp: number }}
 * @throws {Error} si el token es inválido o ha expirado
 */
function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET)
}

/**
 * Extrae el token Bearer del header Authorization.
 * @param {Request} request
 * @returns {string|null}
 */
function extractToken(request) {
  const authHeader = request.headers.get('authorization') || ''
  if (!authHeader.startsWith('Bearer ')) return null
  return authHeader.slice(7).trim()
}

/**
 * Middleware helper: valida el token y devuelve el payload.
 * Lanza un NextResponse de error si no es válido.
 * @param {Request} request
 * @returns {{ id: number, username: string } | null}
 */
function getAuthPayload(request) {
  const token = extractToken(request)
  if (!token) return null
  try {
    return verifyToken(token)
  } catch {
    return null
  }
}

module.exports = { hashPassword, verifyPassword, generateToken, verifyToken, extractToken, getAuthPayload }
