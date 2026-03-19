// src/routes/favorites.js
// Rutas CRUD del recurso /favorites

import { Router } from 'express'
import { FavoritesController } from '../controllers/favorites.js'
import { validateFavoriteLocation, validatePartialFavoriteLocation } from '../schemas/weather.js'

export const favoritesRouter = Router()

// ── Middlewares de validación ─────────────────────────────────────────────────
function validateCreate(req, res, next) {
  const result = validateFavoriteLocation(req.body)

  if (!result.success) {
    return res.status(400).json({
      error: 'Datos inválidos',
      details: result.error.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      })),
    })
  }

  req.body = result.data
  return next()
}

function validatePartialUpdate(req, res, next) {
  const result = validatePartialFavoriteLocation(req.body)

  if (!result.success) {
    return res.status(400).json({
      error: 'Datos inválidos',
      details: result.error.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      })),
    })
  }

  req.body = result.data
  return next()
}

// ────────────────────────────────────────────────────────────────────────────
// GET    /favorites
// GET    /favorites/:id
// POST   /favorites
// PUT    /favorites/:id
// PATCH  /favorites/:id
// DELETE /favorites/:id
// ────────────────────────────────────────────────────────────────────────────
favoritesRouter.get('/',     FavoritesController.getAll)
favoritesRouter.get('/:id',  FavoritesController.getById)
favoritesRouter.post('/',    validateCreate,        FavoritesController.create)
favoritesRouter.put('/:id',  validateCreate,        FavoritesController.update)
favoritesRouter.patch('/:id', validatePartialUpdate, FavoritesController.partialUpdate)
favoritesRouter.delete('/:id', FavoritesController.delete)
