import { Router } from 'express'
import { ShortUrlController } from '../controllers/shortUrl.js'

export const shortenRouter = Router()

// POST /shorten — Crear URL corta
shortenRouter.post('/', ShortUrlController.create)

// GET /shorten/:shortCode/stats — Estadísticas (ANTES del GET general para evitar conflictos)
shortenRouter.get('/:shortCode/stats', ShortUrlController.getStats)

// GET /shorten/:shortCode — Obtener URL corta (incrementa accessCount)
shortenRouter.get('/:shortCode', ShortUrlController.getByShortCode)

// PUT /shorten/:shortCode — Actualizar URL original
shortenRouter.put('/:shortCode', ShortUrlController.update)

// DELETE /shorten/:shortCode — Eliminar URL corta
shortenRouter.delete('/:shortCode', ShortUrlController.delete)
