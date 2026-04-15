// src/server/routes/workouts.routes.js
import { Router } from 'express'
import { WorkoutsController } from '../controllers/workouts.controller.js'
import { authMiddleware } from '../middlewares/auth.middleware.js'
import { validateWorkout, validatePartialWorkout } from '../schemas/workout.schema.js'

export const workoutsRouter = Router()

const validateCreate = (req, res, next) => {
  const result = validateWorkout(req.body)
  if (!result.success) {
    return res.status(400).json({ error: 'Validation failed', details: result.error.errors })
  }
  req.body = result.data
  return next()
}

const validatePartial = (req, res, next) => {
  const result = validatePartialWorkout(req.body)
  if (!result.success) {
    return res.status(400).json({ error: 'Validation failed', details: result.error.errors })
  }
  req.body = result.data
  return next()
}

// Todas las rutas de workouts requieren autenticación
workoutsRouter.use(authMiddleware)

workoutsRouter.get('/', WorkoutsController.getAll)
workoutsRouter.post('/', validateCreate, WorkoutsController.create)
workoutsRouter.get('/:id', WorkoutsController.getById)
workoutsRouter.put('/:id', validateCreate, WorkoutsController.update)
workoutsRouter.patch('/:id', validatePartial, WorkoutsController.partialUpdate)
workoutsRouter.delete('/:id', WorkoutsController.delete)
