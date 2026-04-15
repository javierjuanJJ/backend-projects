// src/server/routes/auth.routes.js
import { Router } from 'express'
import { AuthController } from '../controllers/auth.controller.js'
import { validateRegister, validateLogin } from '../schemas/auth.schema.js'

export const authRouter = Router()

const validateRegisterMiddleware = (req, res, next) => {
  const result = validateRegister(req.body)
  if (!result.success) {
    return res.status(400).json({ error: 'Validation failed', details: result.error.errors })
  }
  req.body = result.data
  return next()
}

const validateLoginMiddleware = (req, res, next) => {
  const result = validateLogin(req.body)
  if (!result.success) {
    return res.status(400).json({ error: 'Validation failed', details: result.error.errors })
  }
  req.body = result.data
  return next()
}

authRouter.post('/register', validateRegisterMiddleware, AuthController.register)
authRouter.post('/login', validateLoginMiddleware, AuthController.login)
