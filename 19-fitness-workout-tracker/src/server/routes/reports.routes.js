// src/server/routes/reports.routes.js
import { Router } from 'express'
import { ReportsController } from '../controllers/reports.controller.js'
import { authMiddleware } from '../middlewares/auth.middleware.js'

export const reportsRouter = Router()

reportsRouter.use(authMiddleware)

reportsRouter.get('/', ReportsController.getProgress)
