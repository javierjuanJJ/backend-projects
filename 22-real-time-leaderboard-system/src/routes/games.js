// src/routes/games.js
import { Router } from 'express'
import { GameController } from '../controllers/games.js'
import { authMiddleware } from '../middlewares/auth.js'
import { validateGame, validatePartialGame } from '../schemas/games.js'

export const gamesRouter = Router()

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

gamesRouter.get('/',      authMiddleware, GameController.getAll)
gamesRouter.get('/:id',   authMiddleware, GameController.getById)
gamesRouter.post('/',     authMiddleware, validateBody(validateGame),        GameController.create)
gamesRouter.put('/:id',   authMiddleware, validateBody(validateGame),        GameController.update)
gamesRouter.patch('/:id', authMiddleware, validateBody(validatePartialGame), GameController.partialUpdate)
gamesRouter.delete('/:id',authMiddleware, GameController.delete)
