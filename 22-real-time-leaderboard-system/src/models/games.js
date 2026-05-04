// src/models/games.js
import { prisma } from '../lib/prisma.js'

export class GameModel {
  /**
   * List all games with pagination.
   * @param {{ limit?: number, offset?: number, name?: string }} params
   */
  static async getAll({ limit = 10, offset = 0, name } = {}) {
    try {
      const where = name
        ? { name: { contains: name } }
        : undefined

      return await prisma.game.findMany({
        where,
        skip: Number(offset),
        take: Number(limit),
        orderBy: { created_at: 'desc' },
      })
    } catch (e) {
      throw new Error(`DB: getAll games failed — ${e.message}`)
    }
  }

  /**
   * Find a game by UUID.
   * @param {string} id
   */
  static async getById(id) {
    try {
      return await prisma.game.findUnique({ where: { id } })
    } catch (e) {
      throw new Error(`DB: getById game ${id} failed — ${e.message}`)
    }
  }

  /**
   * Create a new game.
   * @param {{ name: string, description?: string }} data
   */
  static async create({ name, description }) {
    try {
      return await prisma.game.create({
        data: { id: crypto.randomUUID(), name, description },
      })
    } catch (e) {
      throw new Error(`DB: create game failed — ${e.message}`)
    }
  }

  /**
   * Full update of a game.
   * @param {{ id: string, name: string, description?: string }} params
   */
  static async update({ id, name, description }) {
    try {
      return await prisma.game.update({
        where: { id },
        data: { name, description },
      })
    } catch (e) {
      if (e.code === 'P2025') throw Object.assign(new Error('Game not found'), { status: 404 })
      throw new Error(`DB: update game ${id} failed — ${e.message}`)
    }
  }

  /**
   * Partial update of a game.
   * @param {{ id: string, partialData: object }} params
   */
  static async partialUpdate({ id, partialData }) {
    try {
      return await prisma.game.update({ where: { id }, data: partialData })
    } catch (e) {
      if (e.code === 'P2025') throw Object.assign(new Error('Game not found'), { status: 404 })
      throw new Error(`DB: partialUpdate game ${id} failed — ${e.message}`)
    }
  }

  /**
   * Delete a game by id.
   * @param {string} id
   */
  static async delete(id) {
    try {
      await prisma.game.delete({ where: { id } })
    } catch (e) {
      if (e.code === 'P2025') throw Object.assign(new Error('Game not found'), { status: 404 })
      throw new Error(`DB: delete game ${id} failed — ${e.message}`)
    }
  }
}
