/**
 * @file routes/auth.js
 * @description Authentication routes: register, login, and current user.
 */
import { Router } from 'express'
import { AuthController } from '../controllers/auth.js'
import { authMiddleware } from '../middlewares/auth.js'
import { apiRateLimiter } from '../middlewares/rateLimiter.js'

export const authRouter = Router()

authRouter.use(apiRateLimiter)

authRouter.post('/register', AuthController.register)
authRouter.post('/login',    AuthController.login)
authRouter.get('/me',        authMiddleware, AuthController.me)
