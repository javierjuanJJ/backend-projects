// models/user.js
// Capa de acceso a datos para User (Prisma ORM)

import prisma from '@/lib/prisma'
import { hashPassword } from '@/lib/auth'

export class UserModel {
  /**
   * Obtiene todos los usuarios (sin exponer password/token).
   */
  static async getAll() {
    return prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        username: true,
        createdAt: true,
        updated_at: true,
        _count: { select: { posts: true } },
      },
    })
  }

  /**
   * Obtiene un usuario por ID (sin exponer password/token).
   * @param {number} id
   */
  static async getById(id) {
    return prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        createdAt: true,
        updated_at: true,
        posts: {
          select: { id: true, title: true, category: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
        },
      },
    })
  }

  /**
   * Obtiene un usuario por username (con campos sensibles — solo para auth interna).
   * @param {string} username
   */
  static async getByUsername(username) {
    return prisma.user.findUnique({ where: { username } })
  }

  /**
   * Crea un nuevo usuario hasheando la contraseña.
   * @param {{ username, password }} data
   */
  static async create({ username, password }) {
    const hashedPassword = await hashPassword(password)
    return prisma.user.create({
      data: { username, password: hashedPassword },
    })
  }

  /**
   * Actualiza campos del usuario (parcial).
   * Si se envía password, se rehashea con bcrypt.
   * @param {{ id, username?, password? }} params
   */
  static async partialUpdate({ id, username, password }) {
    const updateData = {}
    if (username !== undefined) updateData.username = username
    if (password !== undefined) updateData.password = await hashPassword(password)

    return prisma.user.update({
      where: { id },
      data: updateData,
      select: { id: true, username: true, createdAt: true, updated_at: true },
    })
  }

  /**
   * Guarda el token JWT activo en BD.
   * @param {{ id, token }} params
   */
  static async saveToken({ id, token }) {
    return prisma.user.update({ where: { id }, data: { token } })
  }

  /**
   * Invalida el token JWT (logout).
   * @param {number} id
   */
  static async clearToken(id) {
    return prisma.user.update({ where: { id }, data: { token: null } })
  }

  /**
   * Elimina un usuario. Los posts quedan huérfanos (authorId = null).
   * @param {number} id
   */
  static async delete(id) {
    await prisma.post.updateMany({ where: { authorId: id }, data: { authorId: null } })
    return prisma.user.delete({ where: { id } })
  }
}
