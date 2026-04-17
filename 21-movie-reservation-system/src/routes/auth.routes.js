// src/routes/auth.routes.js

import { Router } from 'express'
import { AuthController } from '../controllers/auth.controller.js'
import { authenticate } from '../middlewares/auth.middleware.js'
import { validateRegister, validateLogin, validateRefresh } from '../schemas/auth.schema.js'

export const authRouter = Router()

const validate = (validator) => (req, res, next) => {
  const result = validator(req.body)
  if (!result.success) return res.status(400).json({ error: 'Validation error', details: result.error.errors })
  req.body = result.data
  next()
}

authRouter.post('/register', validate(validateRegister), AuthController.register)
authRouter.post('/login',    validate(validateLogin),    AuthController.login)
authRouter.post('/refresh',  validate(validateRefresh),  AuthController.refresh)
authRouter.get('/me',        authenticate,               AuthController.me)
