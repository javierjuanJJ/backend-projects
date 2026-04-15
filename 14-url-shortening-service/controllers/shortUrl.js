import { ShortUrlModel } from '../models/shortUrl.js'
import { validateShortUrl, validateUpdateShortUrl } from '../schemas/shortUrl.js'
import { Prisma } from '@prisma/client'

/**
 * Formatea la respuesta de Prisma al formato esperado por la API
 */
function formatResponse(shortUrl) {
  return {
    id: String(shortUrl.id),
    url: shortUrl.url,
    shortCode: shortUrl.shortCode,
    createdAt: shortUrl.createdAt.toISOString(),
    updatedAt: shortUrl.updatedAt.toISOString(),
  }
}

export class ShortUrlController {
  /**
   * POST /shorten
   * Crea una nueva URL corta
   */
  static async create(req, res) {
    const result = validateShortUrl(req.body)

    if (!result.success) {
      return res.status(400).json({
        error: 'Validation error',
        details: result.error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      })
    }

    try {
      const { url } = result.data
      const shortUrl = await ShortUrlModel.create({ url })
      return res.status(201).json(formatResponse(shortUrl))
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        return res.status(409).json({ error: 'El shortCode ya existe, reintenta' })
      }
      console.error('[ShortUrlController.create]', error)
      return res.status(500).json({ error: 'Error interno del servidor' })
    }
  }

  /**
   * GET /shorten/:shortCode
   * Obtiene una URL corta e incrementa accessCount
   */
  static async getByShortCode(req, res) {
    const { shortCode } = req.params

    try {
      const shortUrl = await ShortUrlModel.getByShortCode(shortCode)

      if (!shortUrl) {
        return res.status(404).json({ error: 'Short URL not found' })
      }

      return res.status(200).json(formatResponse(shortUrl))
    } catch (error) {
      console.error('[ShortUrlController.getByShortCode]', error)
      return res.status(500).json({ error: 'Error interno del servidor' })
    }
  }

  /**
   * PUT /shorten/:shortCode
   * Actualiza la URL original de un shortCode
   */
  static async update(req, res) {
    const { shortCode } = req.params
    const result = validateUpdateShortUrl(req.body)

    if (!result.success) {
      return res.status(400).json({
        error: 'Validation error',
        details: result.error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      })
    }

    try {
      const { url } = result.data

      // Verificar que existe antes de actualizar
      const existing = await ShortUrlModel.getStatsByShortCode(shortCode)
      if (!existing) {
        return res.status(404).json({ error: 'Short URL not found' })
      }

      const updated = await ShortUrlModel.update({ shortCode, url })
      return res.status(200).json(formatResponse(updated))
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        return res.status(404).json({ error: 'Short URL not found' })
      }
      console.error('[ShortUrlController.update]', error)
      return res.status(500).json({ error: 'Error interno del servidor' })
    }
  }

  /**
   * DELETE /shorten/:shortCode
   * Elimina una URL corta
   */
  static async delete(req, res) {
    const { shortCode } = req.params

    try {
      const existing = await ShortUrlModel.getStatsByShortCode(shortCode)
      if (!existing) {
        return res.status(404).json({ error: 'Short URL not found' })
      }

      await ShortUrlModel.delete(shortCode)
      return res.status(204).send()
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        return res.status(404).json({ error: 'Short URL not found' })
      }
      console.error('[ShortUrlController.delete]', error)
      return res.status(500).json({ error: 'Error interno del servidor' })
    }
  }

  /**
   * GET /shorten/:shortCode/stats
   * Obtiene las estadísticas sin incrementar el contador
   */
  static async getStats(req, res) {
    const { shortCode } = req.params

    try {
      const shortUrl = await ShortUrlModel.getStatsByShortCode(shortCode)

      if (!shortUrl) {
        return res.status(404).json({ error: 'Short URL not found' })
      }

      return res.status(200).json({
        id: String(shortUrl.id),
        url: shortUrl.url,
        shortCode: shortUrl.shortCode,
        createdAt: shortUrl.createdAt.toISOString(),
        updatedAt: shortUrl.updatedAt.toISOString(),
        accessCount: shortUrl.accessCount,
      })
    } catch (error) {
      console.error('[ShortUrlController.getStats]', error)
      return res.status(500).json({ error: 'Error interno del servidor' })
    }
  }
}
