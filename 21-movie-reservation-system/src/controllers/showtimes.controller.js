// src/controllers/showtimes.controller.js

import { ShowtimeModel } from '../models/showtime.model.js'

export class ShowtimeController {
  static async getAll(req, res, next) {
    try {
      const { date, movieId, limit = 20, offset = 0 } = req.query
      const { showtimes, total } = await ShowtimeModel.getAll({ date, movieId, limit, offset })
      return res.json({ data: showtimes, total, limit: Number(limit), offset: Number(offset) })
    } catch (err) {
      next(err)
    }
  }

  static async getById(req, res, next) {
    try {
      const { id } = req.params
      const showtime = await ShowtimeModel.getById(id)
      if (!showtime) return res.status(404).json({ error: 'Showtime not found' })
      return res.json(showtime)
    } catch (err) {
      next(err)
    }
  }

  static async getAvailableSeats(req, res, next) {
    try {
      const { id } = req.params
      const result = await ShowtimeModel.getAvailableSeats(id)
      if (!result) return res.status(404).json({ error: 'Showtime not found' })
      return res.json(result)
    } catch (err) {
      next(err)
    }
  }

  static async create(req, res, next) {
    try {
      const showtime = await ShowtimeModel.create(req.body)
      return res.status(201).json(showtime)
    } catch (err) {
      next(err)
    }
  }

  static async delete(req, res, next) {
    try {
      const { id } = req.params
      const existing = await ShowtimeModel.getById(id)
      if (!existing) return res.status(404).json({ error: 'Showtime not found' })
      await ShowtimeModel.delete(id)
      return res.json({ message: 'Showtime deleted successfully' })
    } catch (err) {
      next(err)
    }
  }
}
