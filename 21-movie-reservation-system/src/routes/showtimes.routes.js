// src/routes/showtimes.routes.js

import { Router } from 'express'
import { ShowtimeController } from '../controllers/showtimes.controller.js'
import { authenticate } from '../middlewares/auth.middleware.js'
import { requireRole } from '../middlewares/roles.middleware.js'
import { validateShowtime } from '../schemas/showtime.schema.js'

export const showtimesRouter = Router()

const validate = (fn) => (req, res, next) => {
  const result = fn(req.body)
  if (!result.success) return res.status(400).json({ error: 'Validation error', details: result.error.errors })
  req.body = result.data
  next()
}

showtimesRouter.get('/',            ShowtimeController.getAll)
showtimesRouter.get('/:id',         ShowtimeController.getById)
showtimesRouter.get('/:id/seats',   authenticate, ShowtimeController.getAvailableSeats)
showtimesRouter.post('/',           authenticate, requireRole('admin'), validate(validateShowtime), ShowtimeController.create)
showtimesRouter.delete('/:id',      authenticate, requireRole('admin'), ShowtimeController.delete)
