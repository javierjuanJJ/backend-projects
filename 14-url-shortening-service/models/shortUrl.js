import prisma from '../lib/prisma.js'
import { nanoid } from 'nanoid'

export class ShortUrlModel {
  /**
   * Genera un shortCode único usando nanoid (6 caracteres, URL-friendly)
   */
  static async generateUniqueShortCode() {
    let shortCode
    let exists = true

    // Reintentar hasta obtener un código único (colisión muy improbable)
    while (exists) {
      shortCode = nanoid(6)
      const found = await prisma.shortUrl.findUnique({ where: { shortCode } })
      exists = !!found
    }

    return shortCode
  }

  /**
   * Obtiene todas las URLs cortas
   */
  static async getAll() {
    return prisma.shortUrl.findMany({
      orderBy: { createdAt: 'desc' },
    })
  }

  /**
   * Busca por shortCode e incrementa accessCount
   */
  static async getByShortCode(shortCode) {
    const shortUrl = await prisma.shortUrl.findUnique({
      where: { shortCode },
    })

    if (!shortUrl) return null

    // Incrementar accessCount en 1 si se encuentra
    return prisma.shortUrl.update({
      where: { shortCode },
      data: { accessCount: { increment: 1 } },
    })
  }

  /**
   * Busca por shortCode SIN incrementar el contador (para stats)
   */
  static async getStatsByShortCode(shortCode) {
    return prisma.shortUrl.findUnique({
      where: { shortCode },
    })
  }

  /**
   * Crea una nueva URL corta
   */
  static async create({ url }) {
    const shortCode = await ShortUrlModel.generateUniqueShortCode()

    return prisma.shortUrl.create({
      data: {
        url,
        shortCode,
      },
    })
  }

  /**
   * Actualiza la URL de un shortCode existente
   */
  static async update({ shortCode, url }) {
    return prisma.shortUrl.update({
      where: { shortCode },
      data: { url },
    })
  }

  /**
   * Elimina una URL corta por shortCode
   */
  static async delete(shortCode) {
    return prisma.shortUrl.delete({
      where: { shortCode },
    })
  }
}
