import prisma from '../lib/prisma.js'
import { hashPassword } from '../lib/auth.js'

export class UserModel {
  /**
   * Busca un usuario por email (incluye password para verificar en login)
   */
  static async getByEmail(email) {
    return prisma.user.findUnique({ where: { email } })
  }

  /**
   * Busca un usuario por ID (sin exponer password)
   */
  static async getById(id) {
    return prisma.user.findUnique({
      where: { id: Number(id) },
      select: { id: true, email: true, createdAt: true, updatedAt: true },
    })
  }

  /**
   * Crea un usuario con contraseña cifrada con bcrypt
   */
  static async create({ email, password }) {
    const hashedPassword = await hashPassword(password)
    return prisma.user.create({
      data: { email, password: hashedPassword },
      select: { id: true, email: true, createdAt: true },
    })
  }

  /**
   * Guarda el JWT en el campo token del usuario
   */
  static async saveToken(id, token) {
    return prisma.user.update({
      where: { id: Number(id) },
      data:  { token },
      select: { id: true, email: true },
    })
  }

  /**
   * Actualización parcial (PATCH) — solo los campos enviados
   */
  static async partialUpdate({ id, partialData }) {
    const data = { ...partialData }
    if (data.password) data.password = await hashPassword(data.password)
    return prisma.user.update({
      where: { id: Number(id) },
      data,
      select: { id: true, email: true, updatedAt: true },
    })
  }

  /**
   * Elimina un usuario (sus expenses se borran en cascade)
   */
  static async delete(id) {
    return prisma.user.delete({ where: { id: Number(id) } })
  }
}
