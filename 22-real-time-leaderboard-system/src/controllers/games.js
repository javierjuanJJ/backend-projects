// src/controllers/games.js
import { GameModel } from '../models/games.js'
import { DEFAULTS } from '../../config.js'

export class GameController {
  static async getAll(req, res) {
    const { limit = DEFAULTS.LIMIT_PAGINATION, offset = DEFAULTS.LIMIT_OFFSET, name } = req.query

    try {
      const games = await GameModel.getAll({ limit: Number(limit), offset: Number(offset), name })
      return res.json({ data: games, total: games.length, limit: Number(limit), offset: Number(offset) })
    } catch (e) {
      return res.status(500).json({ error: e.message })
    }
  }

  static async getById(req, res) {
    const { id } = req.params

    try {
      const game = await GameModel.getById(id)
      if (!game) return res.status(404).json({ error: 'Game not found' })
      return res.json(game)
    } catch (e) {
      return res.status(500).json({ error: e.message })
    }
  }

  static async create(req, res) {
    try {
      const game = await GameModel.create(req.body)
      return res.status(201).json(game)
    } catch (e) {
      return res.status(500).json({ error: e.message })
    }
  }

  static async update(req, res) {
    const { id } = req.params

    try {
      const game = await GameModel.getById(id)
      if (!game) return res.status(404).json({ error: 'Game not found' })

      const updated = await GameModel.update({ id, ...req.body })
      return res.json(updated)
    } catch (e) {
      const status = e.status ?? 500
      return res.status(status).json({ error: e.message })
    }
  }

  static async partialUpdate(req, res) {
    const { id } = req.params

    try {
      const game = await GameModel.getById(id)
      if (!game) return res.status(404).json({ error: 'Game not found' })

      const updated = await GameModel.partialUpdate({ id, partialData: req.body })
      return res.json(updated)
    } catch (e) {
      const status = e.status ?? 500
      return res.status(status).json({ error: e.message })
    }
  }

  static async delete(req, res) {
    const { id } = req.params

    try {
      const game = await GameModel.getById(id)
      if (!game) return res.status(404).json({ error: 'Game not found' })

      await GameModel.delete(id)
      return res.json({ message: 'Game deleted successfully' })
    } catch (e) {
      return res.status(500).json({ error: e.message })
    }
  }
}
