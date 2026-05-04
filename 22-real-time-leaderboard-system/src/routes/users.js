// src/routes/users.js
import { Router } from 'express'
import { UserController } from '../controllers/users.js'
import { authMiddleware } from '../middlewares/auth.js'

export const usersRouter = Router()

usersRouter.get('/',     authMiddleware, UserController.getAll)
usersRouter.get('/:id',  authMiddleware, UserController.getById)
usersRouter.patch('/:id',authMiddleware, UserController.partialUpdate)
usersRouter.delete('/:id',authMiddleware, UserController.delete)
