// src/routes/movies.routes.js

import { Router } from 'express'
import { MovieController } from '../controllers/movies.controller.js'
import { authenticate } from '../middlewares/auth.middleware.js'
import { requireRole } from '../middlewares/roles.middleware.js'
import { validateMovie, validatePartialMovie } from '../schemas/movie.schema.js'

export const moviesRouter = Router()

const validate = (fn) => (req, res, next) => {
  const result = fn(req.body)
  if (!result.success) return res.status(400).json({ error: 'Validation error', details: result.error.errors })
  req.body = result.data
  next()
}

moviesRouter.get('/',     MovieController.getAll)
moviesRouter.get('/:id',  MovieController.getById)
moviesRouter.post('/',    authenticate, requireRole('admin'), validate(validateMovie),        MovieController.create)
moviesRouter.put('/:id',  authenticate, requireRole('admin'), validate(validateMovie),        MovieController.update)
moviesRouter.patch('/:id',authenticate, requireRole('admin'), validate(validatePartialMovie), MovieController.partialUpdate)
moviesRouter.delete('/:id',authenticate,requireRole('admin'),                                 MovieController.delete)
