// src/middlewares/roles.middleware.js
// Factory que genera middleware de autorización por rol

/**
 * Middleware factory para proteger rutas por rol.
 * Debe usarse DESPUÉS de authenticate.
 *
 * @param {...string} roles - Roles permitidos ('admin', 'user')
 * @example router.post('/', authenticate, requireRole('admin'), MovieController.create)
 */
export const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' })
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Access denied. Required role: ${roles.join(' or ')}. Your role: ${req.user.role}`,
      })
    }

    return next()
  }
}
