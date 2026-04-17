// src/controllers/admin.controller.js

import { ReservationModel } from '../models/reservation.model.js'
import { UserModel } from '../models/user.model.js'

export class AdminController {
  static async getAllReservations(req, res, next) {
    try {
      const { status, limit = 20, offset = 0 } = req.query
      const { reservations, total } = await ReservationModel.getAll({ status, limit, offset })
      return res.json({ data: reservations, total, limit: Number(limit), offset: Number(offset) })
    } catch (err) {
      next(err)
    }
  }

  static async getStats(req, res, next) {
    try {
      const { startDate, endDate } = req.query
      const stats = await ReservationModel.getStats({ startDate, endDate })
      return res.json(stats)
    } catch (err) {
      next(err)
    }
  }

  static async getAllUsers(req, res, next) {
    try {
      const { limit = 20, offset = 0 } = req.query
      const users = await UserModel.getAll({ limit, offset })
      return res.json({ data: users, total: users.length, limit: Number(limit), offset: Number(offset) })
    } catch (err) {
      next(err)
    }
  }

  static async promoteUser(req, res, next) {
    try {
      const { id } = req.params
      const user = await UserModel.getById(id)
      if (!user) return res.status(404).json({ error: 'User not found' })
      if (user.role === 'admin') return res.status(409).json({ error: 'User is already an admin' })
      const updated = await UserModel.promoteToAdmin(id)
      return res.json({ message: `User ${updated.username} promoted to admin`, user: updated })
    } catch (err) {
      next(err)
    }
  }
}
