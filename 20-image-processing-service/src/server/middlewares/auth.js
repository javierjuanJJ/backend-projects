/**
 * @file middlewares/auth.js
 * @description JWT authentication middleware.
 * Verifies Bearer token and attaches decoded payload to req.user.
 */
import jwt from 'jsonwebtoken'

/**
 * Middleware that validates the JWT from the Authorization header.
 * On success, attaches `req.user = { id, email, role }`.
 */
export const authMiddleware = (req, res, next) => {
  const authHeader = req.headers['authorization']

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authorization header missing or malformed' })
  }

  const token = authHeader.split(' ')[1]

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.user = { id: decoded.id, email: decoded.email, role: decoded.role }
    return next()
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token has expired' })
    }
    return res.status(401).json({ error: 'Invalid token' })
  }
}

/**
 * Middleware that restricts access to admin users only.
 * Must be used AFTER authMiddleware.
 */
export const adminOnly = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' })
  }
  return next()
}
