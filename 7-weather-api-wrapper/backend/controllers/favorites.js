// src/controllers/favorites.js
// Controlador CRUD para ubicaciones favoritas

import { FavoriteLocationModel } from '../models/weather.js'

export class FavoritesController {
  /** GET /favorites */
  static async getAll(req, res, next) {
    try {
      const favorites = await FavoriteLocationModel.getAll()
      return res.json({ data: favorites, total: favorites.length })
    } catch (err) {
      next(err)
    }
  }

  /** GET /favorites/:id */
  static async getById(req, res, next) {
    try {
      const { id } = req.params
      const favorite = await FavoriteLocationModel.getById(id)

      if (!favorite) {
        return res.status(404).json({ error: 'Ubicación favorita no encontrada' })
      }

      return res.json(favorite)
    } catch (err) {
      next(err)
    }
  }

  /** POST /favorites */
  static async create(req, res, next) {
    try {
      const { name, location } = req.body
      const newFavorite = await FavoriteLocationModel.create({ name, location })
      return res.status(201).json(newFavorite)
    } catch (err) {
      next(err)
    }
  }

  /** PUT /favorites/:id */
  static async update(req, res, next) {
    try {
      const { id } = req.params
      const { name, location } = req.body

      const exists = await FavoriteLocationModel.getById(id)
      if (!exists) {
        return res.status(404).json({ error: 'Ubicación favorita no encontrada' })
      }

      const updated = await FavoriteLocationModel.update({ id, name, location })
      return res.json(updated)
    } catch (err) {
      next(err)
    }
  }

  /** PATCH /favorites/:id */
  static async partialUpdate(req, res, next) {
    try {
      const { id } = req.params
      const partialData = req.body

      const exists = await FavoriteLocationModel.getById(id)
      if (!exists) {
        return res.status(404).json({ error: 'Ubicación favorita no encontrada' })
      }

      const updated = await FavoriteLocationModel.partialUpdate({ id, partialData })
      return res.status(200).json(updated)
    } catch (err) {
      next(err)
    }
  }

  /** DELETE /favorites/:id */
  static async delete(req, res, next) {
    try {
      const { id } = req.params

      const exists = await FavoriteLocationModel.getById(id)
      if (!exists) {
        return res.status(404).json({ error: 'Ubicación favorita no encontrada' })
      }

      await FavoriteLocationModel.delete(id)
      return res.json({ message: 'Ubicación favorita eliminada correctamente' })
    } catch (err) {
      next(err)
    }
  }
}
