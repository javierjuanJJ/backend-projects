// src/models/user.js
// Capa de acceso a datos para User — toda la lógica de DB va aquí

import prisma from '../lib/prisma.js'
import { DEFAULTS } from '../config/index.js'

export class UserModel {
  // ── READ ALL (con filtros opcionales) ──────────────────────
  static async getAll({ search, limit = DEFAULTS.LIMIT_PAGINATION, offset = DEFAULTS.LIMIT_OFFSET } = {}) {
    const where = search
      ? {
          OR: [
            { name:  { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {}

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: { id: true, name: true, email: true, createdAt: true, updatedAt: true },
        orderBy: { createdAt: 'desc' },
        take:  Number(limit),
        skip:  Number(offset),
      }),
      prisma.user.count({ where }),
    ])

    return { users, total }
  }

  // ── READ ONE ───────────────────────────────────────────────
  static async getById(id) {
    return prisma.user.findUnique({
      where: { id: Number(id) },
      select: {
        id: true, name: true, email: true,
        createdAt: true, updatedAt: true,
        tasks: {
          select: { id: true, title: true, description: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
        },
      },
    })
  }

  // ── READ BY EMAIL (para login, incluye password) ───────────
  static async getByEmail(email) {
    return prisma.user.findUnique({ where: { email } })
  }

  // ── CREATE ─────────────────────────────────────────────────
  static async create({ name, email, password }) {
    return prisma.user.create({
      data: { name, email, password },
      select: { id: true, name: true, email: true, createdAt: true },
    })
  }

  // ── SAVE TOKEN (tras registro o login) ────────────────────
  static async saveToken(id, token) {
    return prisma.user.update({
      where: { id: Number(id) },
      data: { token },
      select: { id: true },
    })
  }

  // ── UPDATE COMPLETO (PUT) ──────────────────────────────────
  static async update(id, { name, email, password }) {
    return prisma.user.update({
      where: { id: Number(id) },
      data: { name, email, password },
      select: { id: true, name: true, email: true, updatedAt: true },
    })
  }

  // ── UPDATE PARCIAL (PATCH) ─────────────────────────────────
  static async partialUpdate(id, partialData) {
    return prisma.user.update({
      where: { id: Number(id) },
      data: partialData,
      select: { id: true, name: true, email: true, updatedAt: true },
    })
  }

  // ── DELETE ─────────────────────────────────────────────────
  static async delete(id) {
    return prisma.user.delete({ where: { id: Number(id) } })
  }
}
