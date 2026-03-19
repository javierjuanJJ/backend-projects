// src/models/task.js
// Capa de acceso a datos para Task

import prisma from '../lib/prisma.js'
import { DEFAULTS } from '../config/index.js'

export class TaskModel {
  // ── READ ALL ── filtros: id exacto | search en title+description | solo title | userId
  static async getAll({ id, search, title, userId, limit = DEFAULTS.LIMIT_PAGINATION, offset = DEFAULTS.LIMIT_OFFSET } = {}) {
    // ── Filtro por ID exacto ──────────────────────────────────
    if (id) {
      const task = await prisma.task.findUnique({
        where: { id: Number(id) },
        include: { user: { select: { id: true, name: true, email: true } } },
      })
      return { tasks: task ? [task] : [], total: task ? 1 : 0 }
    }

    // ── Construir where dinámico ──────────────────────────────
    const where = {}

    if (userId) where.userId = Number(userId)

    if (search) {
      // Busca la cadena en title O en description completo
      where.OR = [
        { title:       { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    } else if (title) {
      // Busca solo en title
      where.title = { contains: title, mode: 'insensitive' }
    }

    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
        include: { user: { select: { id: true, name: true, email: true } } },
        orderBy: { createdAt: 'desc' },
        take:  Number(limit),
        skip:  Number(offset),
      }),
      prisma.task.count({ where }),
    ])

    return { tasks, total }
  }

  // ── READ ONE ───────────────────────────────────────────────
  static async getById(id) {
    return prisma.task.findUnique({
      where: { id: Number(id) },
      include: { user: { select: { id: true, name: true, email: true } } },
    })
  }

  // ── CREATE ─────────────────────────────────────────────────
  static async create({ title, description, userId }) {
    return prisma.task.create({
      data: { title, description, userId: Number(userId) },
      include: { user: { select: { id: true, name: true, email: true } } },
    })
  }

  // ── UPDATE COMPLETO (PUT) ──────────────────────────────────
  static async update(id, { title, description }) {
    return prisma.task.update({
      where: { id: Number(id) },
      data: { title, description },
      include: { user: { select: { id: true, name: true, email: true } } },
    })
  }

  // ── UPDATE PARCIAL (PATCH) ─────────────────────────────────
  static async partialUpdate(id, partialData) {
    return prisma.task.update({
      where: { id: Number(id) },
      data: partialData,
      include: { user: { select: { id: true, name: true, email: true } } },
    })
  }

  // ── DELETE ─────────────────────────────────────────────────
  static async delete(id) {
    return prisma.task.delete({ where: { id: Number(id) } })
  }
}
