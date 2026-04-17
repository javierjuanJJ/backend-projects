// src/models/genre.model.js

import { prisma } from '../lib/prisma.js'

export class GenreModel {
  static async getAll() {
    return prisma.genre.findMany({ orderBy: { name: 'asc' } })
  }

  static async getById(id) {
    return prisma.genre.findUnique({ where: { id } })
  }

  static async create({ name }) {
    return prisma.genre.create({ data: { name } })
  }

  static async update({ id, name }) {
    return prisma.genre.update({ where: { id }, data: { name } })
  }

  static async delete(id) {
    return prisma.genre.delete({ where: { id } })
  }
}
