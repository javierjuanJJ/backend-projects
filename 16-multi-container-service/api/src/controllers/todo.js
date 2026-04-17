import { DEFAULTS }   from '../config.js'
import { TodoService } from '../services/todo.js'

export class TodoController {
  static async getAll(req, res) {
    try {
      const { text, title, limit = DEFAULTS.LIMIT_PAGINATION, offset = DEFAULTS.LIMIT_OFFSET } = req.query
      const todos = await TodoService.getAll({ text, title, limit, offset })
      return res.json({ data: todos, total: todos.length, limit: Number(limit), offset: Number(offset) })
    } catch (e) {
      console.error('[getAll]', e)
      return res.status(500).json({ error: 'Error interno' })
    }
  }

  static async getById(req, res) {
    try {
      const todo = await TodoService.getById(req.params.id)
      if (!todo) return res.status(404).json({ error: 'Todo no encontrado' })
      return res.json(todo)
    } catch (e) {
      console.error('[getById]', e)
      return res.status(500).json({ error: 'Error interno' })
    }
  }

  static async create(req, res) {
    try {
      const newTodo = await TodoService.create(req.body)
      return res.status(201).json(newTodo)
    } catch (e) {
      console.error('[create]', e)
      return res.status(500).json({ error: 'Error interno' })
    }
  }

  static async update(req, res) {
    try {
      const updated = await TodoService.update({ id: req.params.id, ...req.body })
      if (!updated) return res.status(404).json({ error: 'Todo no encontrado' })
      return res.json(updated)
    } catch (e) {
      console.error('[update]', e)
      return res.status(500).json({ error: 'Error interno' })
    }
  }

  static async partialUpdate(req, res) {
    try {
      const updated = await TodoService.partialUpdate({ id: req.params.id, partialData: req.body })
      if (!updated) return res.status(404).json({ error: 'Todo no encontrado' })
      return res.status(200).json(updated)
    } catch (e) {
      console.error('[partialUpdate]', e)
      return res.status(500).json({ error: 'Error interno' })
    }
  }

  static async delete(req, res) {
    try {
      const deleted = await TodoService.delete(req.params.id)
      if (!deleted) return res.status(404).json({ error: 'Todo no encontrado' })
      return res.status(200).json({ message: 'Todo eliminado correctamente' })
    } catch (e) {
      console.error('[delete]', e)
      return res.status(500).json({ error: 'Error interno' })
    }
  }
}
