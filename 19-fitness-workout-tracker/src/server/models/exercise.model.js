// src/server/models/exercise.model.js
import { prisma } from '../../lib/prisma.js'
import { DEFAULTS } from '../config.js'

export class ExerciseModel {
  /**
   * Lista ejercicios del catálogo con filtros opcionales.
   */
  static async getAll({ category, muscleGroup, search, limit = DEFAULTS.LIMIT_PAGINATION, offset = DEFAULTS.LIMIT_OFFSET } = {}) {
    const where = {}

    if (category) where.category = { equals: category, mode: 'insensitive' }
    if (muscleGroup) where.muscleGroup = { equals: muscleGroup, mode: 'insensitive' }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [exercises, total] = await Promise.all([
      prisma.exercise.findMany({
        where,
        orderBy: [{ category: 'asc' }, { name: 'asc' }],
        take: Number(limit),
        skip: Number(offset),
      }),
      prisma.exercise.count({ where }),
    ])

    return { exercises, total }
  }

  /**
   * Obtiene un ejercicio por id.
   * @param {string} id
   */
  static async getById(id) {
    return prisma.exercise.findUnique({ where: { id } })
  }
}
