// src/controllers/users.js
import { UserModel } from '../models/users.js'
import { DEFAULTS } from '../../config.js'

export class UserController {
  static async getAll(req, res) {
    const { limit = DEFAULTS.LIMIT_PAGINATION, offset = DEFAULTS.LIMIT_OFFSET } = req.query

    try {
      const users = await UserModel.getAll({ limit: Number(limit), offset: Number(offset) })
      return res.json({ data: users, total: users.length, limit: Number(limit), offset: Number(offset) })
    } catch (e) {
      return res.status(500).json({ error: e.message })
    }
  }

  static async getById(req, res) {
    const { id } = req.params

    try {
      const user = await UserModel.getById(id)
      if (!user) return res.status(404).json({ error: 'User not found' })
      return res.json(user)
    } catch (e) {
      return res.status(500).json({ error: e.message })
    }
  }

  static async partialUpdate(req, res) {
    const { id } = req.params

    // Users can only update their own profile
    if (req.user.userId !== id) {
      return res.status(403).json({ error: 'You can only update your own profile' })
    }

    try {
      const user = await UserModel.getById(id)
      if (!user) return res.status(404).json({ error: 'User not found' })

      const updated = await UserModel.partialUpdate({ id, partialData: req.body })
      return res.json(updated)
    } catch (e) {
      const status = e.status ?? 500
      return res.status(status).json({ error: e.message })
    }
  }

  static async delete(req, res) {
    const { id } = req.params

    // Users can only delete their own account
    if (req.user.userId !== id) {
      return res.status(403).json({ error: 'You can only delete your own account' })
    }

    try {
      const user = await UserModel.getById(id)
      if (!user) return res.status(404).json({ error: 'User not found' })

      await UserModel.delete(id)
      return res.json({ message: 'User deleted successfully' })
    } catch (e) {
      return res.status(500).json({ error: e.message })
    }
  }
}
