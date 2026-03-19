// src/controllers/task.js
// Controlador de Tasks — delega toda la lógica al Model

import { DEFAULTS } from '../config/index.js'
import { TaskModel } from '../models/task.js'

export class TaskController {
  // ── GET /tasks ─────────────────────────────────────────────
  // Query params: id | search | title | userId | limit | offset
  static async getAll(req, res, next) {
    try {
      const {
        id,
        search,
        title,
        userId,
        limit  = DEFAULTS.LIMIT_PAGINATION,
        offset = DEFAULTS.LIMIT_OFFSET,
      } = req.query

      const { tasks, total } = await TaskModel.getAll({ id, search, title, userId, limit, offset })

      return res.json({
        data:   tasks,
        total,
        limit:  Number(limit),
        offset: Number(offset),
      })
    } catch (err) {
      next(err)
    }
  }

  // ── GET /tasks/:id ─────────────────────────────────────────
  static async getId(req, res, next) {
    try {
      const { id } = req.params
      const task = await TaskModel.getById(id)

      if (!task) return res.status(404).json({ error: 'Task no encontrada' })

      return res.json(task)
    } catch (err) {
      next(err)
    }
  }

  // ── POST /tasks ────────────────────────────────────────────
  static async create(req, res, next) {
    try {
      const { title, description } = req.body
      const userId = req.user.id // viene del middleware requireAuth

      const task = await TaskModel.create({ title, description, userId })

      return res.status(201).json({ data: task })
    } catch (err) {
      next(err)
    }
  }

  // ── PUT /tasks/:id ─────────────────────────────────────────
  static async update(req, res, next) {
    try {
      const { id } = req.params

      const existing = await TaskModel.getById(id)
      if (!existing) return res.status(404).json({ error: 'Task no encontrada' })

      if (existing.userId !== req.user.id) {
        return res.status(403).json({ error: 'Sin permiso para modificar esta task' })
      }

      const { title, description } = req.body
      const updated = await TaskModel.update(id, { title, description })

      return res.json({ data: updated })
    } catch (err) {
      next(err)
    }
  }

  // ── PATCH /tasks/:id ───────────────────────────────────────
  static async partialUpdate(req, res, next) {
    try {
      const { id } = req.params

      const existing = await TaskModel.getById(id)
      if (!existing) return res.status(404).json({ error: 'Task no encontrada' })

      if (existing.userId !== req.user.id) {
        return res.status(403).json({ error: 'Sin permiso para modificar esta task' })
      }

      const updated = await TaskModel.partialUpdate(id, req.body)
      return res.status(200).json({ data: updated })
    } catch (err) {
      next(err)
    }
  }

  // ── DELETE /tasks/:id ──────────────────────────────────────
  static async delete(req, res, next) {
    try {
      const { id } = req.params

      const existing = await TaskModel.getById(id)
      if (!existing) return res.status(404).json({ error: 'Task no encontrada' })

      if (existing.userId !== req.user.id) {
        return res.status(403).json({ error: 'Sin permiso para eliminar esta task' })
      }

      await TaskModel.delete(id)
      return res.json({ message: 'Task eliminada correctamente' })
    } catch (err) {
      next(err)
    }
  }
}
