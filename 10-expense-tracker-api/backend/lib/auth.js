import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const JWT_SECRET     = process.env.JWT_SECRET     || 'cambia-esto-en-produccion'
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d'

export const hashPassword    = (password)       => bcrypt.hash(password, 12)
export const comparePassword = (password, hash) => bcrypt.compare(password, hash)

export const generateToken = (payload) =>
  jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })

export const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET)
  } catch {
    return null
  }
}
