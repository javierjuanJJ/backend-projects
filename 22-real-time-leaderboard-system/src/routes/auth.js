// src/routes/auth.js
import { Router } from 'express'
import { AuthController } from '../controllers/auth.js'
import { validateRegister, validateLogin } from '../schemas/auth.js'

export const authRouter = Router()

function validateBody(validateFn) {
  return (req, res, next) => {
    const result = validateFn(req.body)
    if (!result.success) {
      return res.status(400).json({ error: 'Invalid request', details: result.error.issues })
    }
    req.body = result.data
    return next()
  }
}

// Public — no authMiddleware
authRouter.post('/register', validateBody(validateRegister), AuthController.register)
authRouter.post('/login',    validateBody(validateLogin),    AuthController.login)
