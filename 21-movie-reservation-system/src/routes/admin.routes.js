// src/routes/admin.routes.js

import { Router } from 'express'
import { AdminController } from '../controllers/admin.controller.js'
import { authenticate } from '../middlewares/auth.middleware.js'
import { requireRole } from '../middlewares/roles.middleware.js'

export const adminRouter = Router()

// Todos los endpoints de admin requieren autenticación y rol admin
adminRouter.use(authenticate, requireRole('admin'))

adminRouter.get('/reservations',         AdminController.getAllReservations)
adminRouter.get('/reports/stats',        AdminController.getStats)
adminRouter.get('/users',                AdminController.getAllUsers)
adminRouter.patch('/users/:id/promote',  AdminController.promoteUser)
