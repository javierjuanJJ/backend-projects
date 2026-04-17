// src/middlewares/auth.middleware.js
// Verifica el JWT Access Token en la cabecera Authorization

import jwt from 'jsonwebtoken'
import { JWT } from '../config.js'

/**
 * Middleware que verifica el JWT Access Token.
 * Inyecta req.user = { id, email, role } si es válido.
 */
export const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required. Provide a Bearer token.' })
  }

  const token = authHeader.split(' ')[1]

  try {
    const decoded = jwt.verify(token, JWT.ACCESS_SECRET)
    req.user = { id: decoded.id, email: decoded.email, role: decoded.role }
    return next()
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired. Please refresh your session.' })
    }
    return res.status(401).json({ error: 'Invalid token.' })
  }
}
