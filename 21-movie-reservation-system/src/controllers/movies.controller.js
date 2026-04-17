// src/controllers/movies.controller.js

import { MovieModel } from '../models/movie.model.js'
import { DEFAULTS } from '../config.js'

export class MovieController {
  static async getAll(req, res, next) {
    try {
      const { genre, search, limit = DEFAULTS.LIMIT_PAGINATION, offset = DEFAULTS.LIMIT_OFFSET } = req.query
      const { movies, total } = await MovieModel.getAll({ genre, search, limit, offset })
      return res.json({ data: movies, total, limit: Number(limit), offset: Number(offset) })
    } catch (err) {
      next(err)
    }
  }

  static async getById(req, res, next) {
    try {
      const { id } = req.params
      const movie = await MovieModel.getById(id)
      if (!movie) return res.status(404).json({ error: 'Movie not found' })
      return res.json(movie)
    } catch (err) {
      next(err)
    }
  }

  static async create(req, res, next) {
    try {
      const movie = await MovieModel.create(req.body)
      return res.status(201).json(movie)
    } catch (err) {
      next(err)
    }
  }

  static async update(req, res, next) {
    try {
      const { id } = req.params
      const existing = await MovieModel.getById(id)
      if (!existing) return res.status(404).json({ error: 'Movie not found' })
      const updated = await MovieModel.update({ id, ...req.body })
      return res.json(updated)
    } catch (err) {
      next(err)
    }
  }

  static async partialUpdate(req, res, next) {
    try {
      const { id } = req.params
      const existing = await MovieModel.getById(id)
      if (!existing) return res.status(404).json({ error: 'Movie not found' })
      const updated = await MovieModel.partialUpdate({ id, ...req.body })
      return res.json(updated)
    } catch (err) {
      next(err)
    }
  }

  static async delete(req, res, next) {
    try {
      const { id } = req.params
      const existing = await MovieModel.getById(id)
      if (!existing) return res.status(404).json({ error: 'Movie not found' })
      await MovieModel.softDelete(id)
      return res.json({ message: 'Movie deleted successfully' })
    } catch (err) {
      next(err)
    }
  }
}
