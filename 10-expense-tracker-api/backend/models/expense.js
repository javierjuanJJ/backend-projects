import prisma from '../lib/prisma.js'
import { DEFAULTS } from '../config.js'

export class ExpenseModel {
  /**
   * Devuelve todos los gastos del usuario con filtros opcionales.
   * Soporta: búsqueda por texto en title/description, rango de monto y paginación.
   *
   * @param {object} opts
   * @param {number}  opts.userId
   * @param {string}  [opts.search]     - texto libre en title OR description
   * @param {number}  [opts.minAmount]
   * @param {number}  [opts.maxAmount]
   * @param {number}  [opts.limit]
   * @param {number}  [opts.offset]
   */
  static async getAll({
    userId,
    search,
    minAmount,
    maxAmount,
    limit  = DEFAULTS.LIMIT_PAGINATION,
    offset = DEFAULTS.LIMIT_OFFSET,
  }) {
    const where = { userId: Number(userId) }

    // Búsqueda de cadena de texto en title O description completo
    if (search) {
      where.OR = [
        { title:       { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    }

    // Rango de monto
    if (minAmount !== undefined || maxAmount !== undefined) {
      where.amount = {}
      if (minAmount !== undefined) where.amount.gte = Number(minAmount)
      if (maxAmount !== undefined) where.amount.lte = Number(maxAmount)
    }

    const expenses = await prisma.expense.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take:    Number(limit),
      skip:    Number(offset),
    })

    return expenses
  }

  /**
   * Devuelve un gasto por ID (solo si pertenece al usuario autenticado)
   */
  static async getById(id, userId) {
    return prisma.expense.findFirst({
      where: { id: Number(id), userId: Number(userId) },
    })
  }

  /**
   * Crea un nuevo gasto asociado al usuario
   */
  static async create({ title, description, amount, userId }) {
    return prisma.expense.create({
      data: { title, description, amount: Number(amount), userId: Number(userId) },
    })
  }

  /**
   * Reemplaza todos los campos (PUT)
   */
  static async update({ id, title, description, amount }) {
    return prisma.expense.update({
      where: { id: Number(id) },
      data:  { title, description, amount: Number(amount) },
    })
  }

  /**
   * Actualización parcial (PATCH) — solo los campos enviados
   */
  static async partialUpdate({ id, partialData }) {
    const data = { ...partialData }
    if (data.amount !== undefined) data.amount = Number(data.amount)
    return prisma.expense.update({
      where: { id: Number(id) },
      data,
    })
  }

  /**
   * Elimina un gasto
   */
  static async delete(id) {
    return prisma.expense.delete({ where: { id: Number(id) } })
  }
}
