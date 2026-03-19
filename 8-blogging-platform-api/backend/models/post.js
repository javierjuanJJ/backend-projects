// models/post.js
// Capa de acceso a datos para Post (Prisma ORM)

import prisma from '@/lib/prisma'
import { DEFAULTS } from '@/config'

export class PostModel {
  /**
   * Obtiene todos los posts con filtros opcionales y paginación.
   * @param {{ text?, id?, category?, limit?, offset? }} params
   */
  static async getAll({
    text,
    id,
    category,
    limit = DEFAULTS.LIMIT_PAGINATION,
    offset = DEFAULTS.LIMIT_OFFSET,
  } = {}) {
    const limitNum = Math.max(1, Number(limit))
    const offsetNum = Math.max(0, Number(offset))

    let where = {}

    if (id) {
      where.id = parseInt(id)
    } else if (text) {
      where.OR = [
        { title: { contains: text, mode: 'insensitive' } },
        { content: { contains: text, mode: 'insensitive' } },
      ]
    }

    if (category) {
      where.category = { has: category }
    }

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where,
        include: { author: { select: { id: true, username: true } } },
        orderBy: { createdAt: 'desc' },
        take: limitNum,
        skip: offsetNum,
      }),
      prisma.post.count({ where }),
    ])

    return { posts, total, limit: limitNum, offset: offsetNum }
  }

  /**
   * Obtiene un post por ID.
   * @param {number} id
   */
  static async getById(id) {
    return prisma.post.findUnique({
      where: { id },
      include: { author: { select: { id: true, username: true } } },
    })
  }

  /**
   * Crea un nuevo post.
   * @param {{ title, content, category, authorId? }} data
   */
  static async create({ title, content, category = [], authorId = null }) {
    return prisma.post.create({
      data: { title, content, category, authorId },
      include: { author: { select: { id: true, username: true } } },
    })
  }

  /**
   * Actualización completa de un post (PUT).
   * @param {{ id, title, content, category, authorId? }} data
   */
  static async update({ id, title, content, category = [], authorId }) {
    return prisma.post.update({
      where: { id },
      data: { title, content, category, ...(authorId !== undefined && { authorId }) },
      include: { author: { select: { id: true, username: true } } },
    })
  }

  /**
   * Actualización parcial de un post (PATCH).
   * @param {{ id, ...partialData }} params
   */
  static async partialUpdate({ id, ...partialData }) {
    return prisma.post.update({
      where: { id },
      data: partialData,
      include: { author: { select: { id: true, username: true } } },
    })
  }

  /**
   * Elimina un post por ID.
   * @param {number} id
   */
  static async delete(id) {
    return prisma.post.delete({ where: { id } })
  }
}
