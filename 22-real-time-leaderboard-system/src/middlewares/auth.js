// src/middlewares/auth.js
import jwt from 'jsonwebtoken'

/**
 * Express middleware — verifies Bearer JWT token.
 * On success, sets req.user = { userId, username }
 */
export function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization']

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authorization header missing or malformed' })
  }

  const token = authHeader.slice(7) // strip "Bearer "

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET)
    req.user = {
      userId: payload.userId,
      username: payload.username,
    }
    return next()
  } catch (e) {
    if (e.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' })
    }
    return res.status(403).json({ error: 'Invalid token' })
  }
}
