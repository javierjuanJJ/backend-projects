// src/controllers/scores.js
import { ScoreModel } from '../models/scores.js'
import { validateLeaderboardQuery } from '../schemas/scores.js'
import { DEFAULTS } from '../../config.js'

export class ScoreController {
  static async getAll(req, res) {
    const {
      limit = DEFAULTS.LIMIT_PAGINATION,
      offset = DEFAULTS.LIMIT_OFFSET,
      userId,
      gameId,
    } = req.query

    try {
      const scores = await ScoreModel.getAll({
        limit: Math.min(Number(limit), DEFAULTS.LIMIT_MAX),
        offset: Number(offset),
        userId,
        gameId,
      })
      return res.json({ data: scores, total: scores.length, limit: Number(limit), offset: Number(offset) })
    } catch (e) {
      return res.status(500).json({ error: e.message })
    }
  }

  static async getById(req, res) {
    const { id } = req.params

    try {
      const score = await ScoreModel.getById(id)
      if (!score) return res.status(404).json({ error: 'Score not found' })
      return res.json(score)
    } catch (e) {
      return res.status(500).json({ error: e.message })
    }
  }

  static async create(req, res) {
    const { game_id, score_value } = req.body

    try {
      const score = await ScoreModel.create({
        userId: req.user.userId, // from JWT payload
        gameId: game_id,
        scoreValue: score_value,
      })
      return res.status(201).json(score)
    } catch (e) {
      return res.status(500).json({ error: e.message })
    }
  }

  static async delete(req, res) {
    const { id } = req.params

    try {
      const score = await ScoreModel.getById(id)
      if (!score) return res.status(404).json({ error: 'Score not found' })

      // Users can only delete their own scores
      if (score.user.id !== req.user.userId) {
        return res.status(403).json({ error: 'You can only delete your own scores' })
      }

      await ScoreModel.delete(id, score.game.id)
      return res.json({ message: 'Score deleted successfully' })
    } catch (e) {
      return res.status(500).json({ error: e.message })
    }
  }

  /** GET /leaderboard/:gameId?period=weekly&limit=10 */
  static async getLeaderboard(req, res) {
    const { gameId } = req.params
    const queryResult = validateLeaderboardQuery(req.query)

    if (!queryResult.success) {
      return res.status(400).json({ error: 'Invalid query params', details: queryResult.error.issues })
    }

    const { limit, offset: _offset, period } = queryResult.data

    try {
      const data = await ScoreModel.getLeaderboard({ gameId, period, limit })
      return res.json({ data, game_id: gameId, period, limit })
    } catch (e) {
      return res.status(500).json({ error: e.message })
    }
  }
}
