// src/server/routes/exercises.routes.js
import { Router } from 'express'
import { ExercisesController } from '../controllers/exercises.controller.js'

export const exercisesRouter = Router()

exercisesRouter.get('/', ExercisesController.getAll)
exercisesRouter.get('/:id', ExercisesController.getById)
