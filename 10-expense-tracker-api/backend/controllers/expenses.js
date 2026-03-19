import { DEFAULTS } from '../config.js'
import { ExpenseModel } from '../models/expense.js'

export class ExpenseController {
  /**
   * GET /expenses
   * Filtros opcionales: ?search=texto  ?id=1  ?minAmount=10  ?maxAmount=500
   */
  static async getAll(req, res, next) {
    try {
      const {
        search,
        minAmount,
        maxAmount,
        limit  = DEFAULTS.LIMIT_PAGINATION,
        offset = DEFAULTS.LIMIT_OFFSET,
      } = req.query

      const userId = req.user.id

      const expenses = await ExpenseModel.getAll({
        userId,
        search,
        minAmount,
        maxAmount,
        limit,
        offset,
      })

      const limitNumber  = Number(limit)
      const offsetNumber = Number(offset)

      return res.json({ data: expenses, total: expenses.length, limit: limitNumber, offset: offsetNumber })
    } catch (err) {
      next(err)
    }
  }

  /**
   * GET /expenses/:id
   * Obtiene un gasto por su ID primario
   */
  static async getId(req, res, next) {
    try {
      const { id }   = req.params
      const userId   = req.user.id

      const expense = await ExpenseModel.getById(id, userId)

      if (!expense) {
        return res.status(404).json({ error: 'Expense not found' })
      }

      return res.json(expense)
    } catch (err) {
      next(err)
    }
  }

  /**
   * POST /expenses
   * Crea un nuevo gasto (body ya validado por Zod en la ruta)
   */
  static async create(req, res, next) {
    try {
      const { title, description, amount } = req.body
      const userId = req.user.id

      const newExpense = await ExpenseModel.create({ title, description, amount, userId })

      return res.status(201).json(newExpense)
    } catch (err) {
      next(err)
    }
  }

  /**
   * PUT /expenses/:id
   * Reemplaza todos los campos del gasto
   */
  static async update(req, res, next) {
    try {
      const { id }                         = req.params
      const { title, description, amount } = req.body
      const userId                         = req.user.id

      const expense = await ExpenseModel.getById(id, userId)

      if (!expense) {
        return res.status(404).json({ error: 'Expense not found' })
      }

      const updatedExpense = await ExpenseModel.update({ id, title, description, amount })

      return res.status(200).json(updatedExpense)
    } catch (err) {
      next(err)
    }
  }

  /**
   * PATCH /expenses/:id
   * Actualiza parcialmente el gasto (solo los campos enviados)
   */
  static async partialUpdate(req, res, next) {
    try {
      const { id }      = req.params
      const partialData = req.body   // ya validado por Zod parcial en la ruta
      const userId      = req.user.id

      const expense = await ExpenseModel.getById(id, userId)

      if (!expense) {
        return res.status(404).json({ error: 'Expense not found' })
      }

      const updatedExpense = await ExpenseModel.partialUpdate({ id, partialData })

      return res.status(200).json(updatedExpense)   // 200 porque es PATCH
    } catch (err) {
      next(err)
    }
  }

  /**
   * DELETE /expenses/:id
   */
  static async delete(req, res, next) {
    try {
      const { id } = req.params
      const userId = req.user.id

      const expense = await ExpenseModel.getById(id, userId)

      if (!expense) {
        return res.status(404).json({ error: 'Expense not found' })
      }

      await ExpenseModel.delete(id)

      return res.status(200).json({ message: 'Expense deleted successfully' })
    } catch (err) {
      next(err)
    }
  }
}
