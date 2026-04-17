// src/models/movie.model.js

import { prisma } from '../lib/prisma.js'
import { DEFAULTS } from '../config.js'

export class MovieModel {
  /**
   * Lista todas las películas con filtros opcionales y paginación
   */
  static async getAll({ genre, search, limit = DEFAULTS.LIMIT_PAGINATION, offset = DEFAULTS.LIMIT_OFFSET } = {}) {
    const where = {
      deletedAt: null,
      ...(genre && { genre: { name: { contains: genre } } }),
      ...(search && {
        OR: [
          { title: { contains: search } },
          { description: { contains: search } },
        ],
      }),
    }

    const [movies, total] = await prisma.$transaction([
      prisma.movie.findMany({
        where,
        include: { genre: true },
        take: Number(limit),
        skip: Number(offset),
        orderBy: { title: 'asc' },
      }),
      prisma.movie.count({ where }),
    ])

    return { movies, total }
  }

  /**
   * Obtiene una película por ID con sus funciones próximas
   */
  static async getById(id) {
    return prisma.movie.findUnique({
      where: { id, deletedAt: null },
      include: {
        genre: true,
        showtimes: {
          where: { startTime: { gte: new Date() } },
          include: { room: { select: { id: true, name: true, totalCapacity: true } } },
          orderBy: { startTime: 'asc' },
        },
      },
    })
  }

  /**
   * Crea una nueva película
   */
  static async create({ title, description, posterUrl, durationMinutes, genreId }) {
    return prisma.movie.create({
      data: { title, description, posterUrl, durationMinutes, genreId },
      include: { genre: true },
    })
  }

  /**
   * Actualiza una película completamente
   */
  static async update({ id, title, description, posterUrl, durationMinutes, genreId }) {
    return prisma.movie.update({
      where: { id },
      data: { title, description, posterUrl, durationMinutes, genreId },
      include: { genre: true },
    })
  }

  /**
   * Actualiza parcialmente una película
   */
  static async partialUpdate({ id, ...data }) {
    return prisma.movie.update({
      where: { id },
      data,
      include: { genre: true },
    })
  }

  /**
   * Soft delete: marca deletedAt en lugar de borrar físicamente
   */
  static async softDelete(id) {
    return prisma.movie.update({
      where: { id },
      data: { deletedAt: new Date() },
    })
  }
}
