// src/server/models/user.model.js
import { prisma } from '../../lib/prisma.js'

export class UserModel {
  /**
   * Busca un usuario por email.
   * @param {string} email
   */
  static async getByEmail(email) {
    return prisma.user.findUnique({ where: { email } })
  }

  /**
   * Busca un usuario por id (sin exponer passwordHash).
   * @param {string} id
   */
  static async getById(id) {
    return prisma.user.findUnique({
      where: { id },
      select: { id: true, username: true, email: true, createdAt: true },
    })
  }

  /**
   * Comprueba si ya existe un usuario con ese email o username.
   * @param {string} email
   * @param {string} username
   */
  static async existsByEmailOrUsername(email, username) {
    return prisma.user.findFirst({
      where: { OR: [{ email }, { username }] },
      select: { id: true, email: true, username: true },
    })
  }

  /**
   * Crea un nuevo usuario.
   * @param {{ username: string, email: string, passwordHash: string }} data
   */
  static async create({ username, email, passwordHash }) {
    return prisma.user.create({
      data: { id: crypto.randomUUID(), username, email, passwordHash },
      select: { id: true, username: true, email: true, createdAt: true },
    })
  }
}
