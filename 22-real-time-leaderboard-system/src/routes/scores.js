// src/routes/scores.js
import { Router } from 'express'
import { ScoreController } from '../controllers/scores.js'
import { authMiddleware } from '../middlewares/auth.js'
import { validateScore } from '../schemas/scores.js'

export const scoresRouter = Router()

function validateBody(validateFn) {
  return (req, res, next) => {
    const result = validateFn(req.body)
    if (!result.success) {
      return res.status(400).json({ error: 'Invalid request', details: result.error.issues })
    }
    req.body = result.data
    return next()
  }
}

// ─── Score CRUD ──────────────────────────────────────────────────────────────
scoresRouter.get('/',     authMiddleware, ScoreController.getAll)
scoresRouter.get('/:id',  authMiddleware, ScoreController.getById)
scoresRouter.post('/',    authMiddleware, validateBody(validateScore), ScoreController.create)
scoresRouter.delete('/:id', authMiddleware, ScoreController.delete)

// ─── Leaderboard ─────────────────────────────────────────────────────────────
// GET /scores/leaderboard/:gameId?period=alltime|weekly|daily&limit=10
scoresRouter.get('/leaderboard/:gameId', authMiddleware, ScoreController.getLeaderboard)
