// src/routes/genres.routes.js

import { Router } from 'express'
import { GenreController } from '../controllers/genres.controller.js'
import { authenticate } from '../middlewares/auth.middleware.js'
import { requireRole } from '../middlewares/roles.middleware.js'

export const genresRouter = Router()

genresRouter.get('/',      GenreController.getAll)
genresRouter.post('/',     authenticate, requireRole('admin'), GenreController.create)
genresRouter.put('/:id',   authenticate, requireRole('admin'), GenreController.update)
genresRouter.delete('/:id',authenticate, requireRole('admin'), GenreController.delete)
