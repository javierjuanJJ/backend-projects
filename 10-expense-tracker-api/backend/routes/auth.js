import { Router } from 'express'
import { AuthController } from '../controllers/auth.js'
import { validateUser } from '../schemas/users.js'

export const authRouter = Router()

// ─── Middlewares de validación Zod (mismo patrón que validateCreate/validateUpdate) ──

function validateRegister(req, res, next) {
  const result = validateUser(req.body)
  if (result.success) {
    req.body = result.data   // datos validados y limpios
    return next()
  }
  return res.status(400).json({ error: 'Invalid request', details: result.error.errors })
}

function validateLogin(req, res, next) {
  const result = validateUser(req.body)
  if (!result.success) {
    return res.status(400).json({ error: JSON.parse(result.error.message) })
  }
  req.body = result.data
  next()
}

// ─── Rutas ────────────────────────────────────────────────────────────────────

authRouter.post('/register', validateRegister, AuthController.register)
authRouter.post('/login',    validateLogin,    AuthController.login)
