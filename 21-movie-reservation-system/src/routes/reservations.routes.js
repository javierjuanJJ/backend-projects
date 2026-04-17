// src/routes/reservations.routes.js

import { Router } from 'express'
import { ReservationController } from '../controllers/reservations.controller.js'
import { authenticate } from '../middlewares/auth.middleware.js'
import { validateReservation } from '../schemas/reservation.schema.js'

export const reservationsRouter = Router()

const validate = (fn) => (req, res, next) => {
  const result = fn(req.body)
  if (!result.success) return res.status(400).json({ error: 'Validation error', details: result.error.errors })
  req.body = result.data
  next()
}

reservationsRouter.get('/',     authenticate, ReservationController.getMyReservations)
reservationsRouter.get('/:id',  authenticate, ReservationController.getById)
reservationsRouter.post('/',    authenticate, validate(validateReservation), ReservationController.create)
reservationsRouter.delete('/:id', authenticate, ReservationController.cancel)
