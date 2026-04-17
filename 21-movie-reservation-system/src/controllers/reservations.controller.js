// src/controllers/reservations.controller.js

import { ReservationModel } from '../models/reservation.model.js'
import { NotificationService } from '../services/notification.service.js'

export class ReservationController {
  static async getMyReservations(req, res, next) {
    try {
      const { limit = 10, offset = 0 } = req.query
      const { reservations, total } = await ReservationModel.getByUser(req.user.id, { limit, offset })
      return res.json({ data: reservations, total, limit: Number(limit), offset: Number(offset) })
    } catch (err) {
      next(err)
    }
  }

  static async getById(req, res, next) {
    try {
      const { id } = req.params
      const reservation = await ReservationModel.getById(id)
      if (!reservation) return res.status(404).json({ error: 'Reservation not found' })

      // Un usuario solo puede ver sus propias reservas
      if (req.user.role !== 'admin' && reservation.user.id !== req.user.id) {
        return res.status(403).json({ error: 'Access denied' })
      }
      return res.json(reservation)
    } catch (err) {
      next(err)
    }
  }

  static async create(req, res, next) {
    try {
      const { showtimeId, seatIds } = req.body
      const reservation = await ReservationModel.create({
        userId: req.user.id,
        showtimeId,
        seatIds,
      })

      // Enviar notificaciones en background (no bloquear la respuesta)
      NotificationService.sendReservationConfirmation(reservation, req.user).catch(err =>
        console.error('[Notification Error]', err.message)
      )

      return res.status(201).json({ reservation })
    } catch (err) {
      if (err.message === 'SEAT_ALREADY_TAKEN') {
        return res.status(409).json({ error: 'One or more seats are already taken for this showtime.' })
      }
      if (err.message === 'SHOWTIME_NOT_FOUND') {
        return res.status(404).json({ error: 'Showtime not found.' })
      }
      next(err)
    }
  }

  static async cancel(req, res, next) {
    try {
      const { id } = req.params
      const reservation = await ReservationModel.cancel({
        reservationId: id,
        userId: req.user.id,
        isAdmin: req.user.role === 'admin',
      })
      return res.json({ message: 'Reservation cancelled successfully', reservation })
    } catch (err) {
      if (err.statusCode) return res.status(err.statusCode).json({ error: err.message })
      next(err)
    }
  }
}
