// src/routes/rooms.routes.js

import { Router } from 'express'
import { RoomController } from '../controllers/rooms.controller.js'
import { authenticate } from '../middlewares/auth.middleware.js'
import { requireRole } from '../middlewares/roles.middleware.js'

export const roomsRouter = Router()

roomsRouter.get('/',      authenticate, requireRole('admin'), RoomController.getAll)
roomsRouter.get('/:id',   authenticate, requireRole('admin'), RoomController.getById)
roomsRouter.post('/',     authenticate, requireRole('admin'), RoomController.create)
roomsRouter.patch('/:id', authenticate, requireRole('admin'), RoomController.update)
