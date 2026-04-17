// src/models/user.model.js

import { prisma } from '../lib/prisma.js'

// Selector de campos seguros (excluye password)
const safeUserSelect = {
  id: true,
  username: true,
  email: true,
  role: true,
  createdAt: true,
}

export class UserModel {
  /**
   * Busca un usuario por ID (sin password)
   */
  static async getById(id) {
    return prisma.user.findUnique({
      where: { id },
      select: safeUserSelect,
    })
  }

  /**
   * Busca un usuario por email (incluye password para comparación)
   */
  static async getByEmailWithPassword(email) {
    return prisma.user.findUnique({ where: { email } })
  }

  /**
   * Busca un usuario por email (sin password)
   */
  static async getByEmail(email) {
    return prisma.user.findUnique({
      where: { email },
      select: safeUserSelect,
    })
  }

  /**
   * Crea un nuevo usuario
   */
  static async create({ username, email, password, role = 'user' }) {
    return prisma.user.create({
      data: { username, email, password, role },
      select: safeUserSelect,
    })
  }

  /**
   * Promueve un usuario a admin
   */
  static async promoteToAdmin(id) {
    return prisma.user.update({
      where: { id },
      data: { role: 'admin' },
      select: safeUserSelect,
    })
  }

  /**
   * Lista todos los usuarios (solo admin)
   */
  static async getAll({ limit = 10, offset = 0 } = {}) {
    return prisma.user.findMany({
      select: safeUserSelect,
      take: Number(limit),
      skip: Number(offset),
      orderBy: { createdAt: 'desc' },
    })
  }
}
