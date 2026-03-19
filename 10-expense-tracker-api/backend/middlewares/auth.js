import { verifyToken } from '../lib/auth.js'

/**
 * Protege rutas que requieren autenticación.
 * Extrae el token de:  Authorization: Bearer <token>
 * Inyecta el payload en req.user = { id, email }
 */
export function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization']

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token no proporcionado' })
  }

  const token   = authHeader.slice(7)
  const payload = verifyToken(token)

  if (!payload) {
    return res.status(401).json({ error: 'Token inválido o expirado' })
  }

  req.user = payload   // { id, email, iat, exp }
  next()
}
