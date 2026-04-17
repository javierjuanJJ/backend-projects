// src/controllers/genres.controller.js

import { GenreModel } from '../models/genre.model.js'

export class GenreController {
  static async getAll(_req, res, next) {
    try {
      const genres = await GenreModel.getAll()
      return res.json({ data: genres, total: genres.length })
    } catch (err) {
      next(err)
    }
  }

  static async create(req, res, next) {
    try {
      const { name } = req.body
      const genre = await GenreModel.create({ name })
      return res.status(201).json(genre)
    } catch (err) {
      next(err)
    }
  }

  static async update(req, res, next) {
    try {
      const { id } = req.params
      const existing = await GenreModel.getById(id)
      if (!existing) return res.status(404).json({ error: 'Genre not found' })
      const updated = await GenreModel.update({ id, ...req.body })
      return res.json(updated)
    } catch (err) {
      next(err)
    }
  }

  static async delete(req, res, next) {
    try {
      const { id } = req.params
      const existing = await GenreModel.getById(id)
      if (!existing) return res.status(404).json({ error: 'Genre not found' })
      await GenreModel.delete(id)
      return res.json({ message: 'Genre deleted successfully' })
    } catch (err) {
      next(err)
    }
  }
}
