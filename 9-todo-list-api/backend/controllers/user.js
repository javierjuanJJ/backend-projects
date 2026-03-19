// src/controllers/user.js
// Controlador de Users — delega toda la lógica al Model

import { DEFAULTS } from '../config/index.js'
import { UserModel } from '../models/user.js'
import { hashPassword, verifyPassword, generateToken } from '../lib/auth.js'

export class UserController {
  // ── GET /users ─────────────────────────────────────────────
  static async getAll(req, res, next) {
    try {
      const {
        search,
        limit  = DEFAULTS.LIMIT_PAGINATION,
        offset = DEFAULTS.LIMIT_OFFSET,
      } = req.query

      const { users, total } = await UserModel.getAll({ search, limit, offset })

      return res.json({
        data:   users,
        total,
        limit:  Number(limit),
        offset: Number(offset),
      })
    } catch (err) {
      next(err)
    }
  }

  // ── GET /users/:id ─────────────────────────────────────────
  static async getId(req, res, next) {
    try {
      const { id } = req.params
      const user = await UserModel.getById(id)

      if (!user) return res.status(404).json({ error: 'Usuario no encontrado' })

      return res.json(user)
    } catch (err) {
      next(err)
    }
  }

  // ── POST /users ────────────────────────────────────────────
  static async create(req, res, next) {
    try {
      const { name, email, password } = req.body // ya validado por Zod middleware

      const hashedPassword = await hashPassword(password)
      const user = await UserModel.create({ name, email, password: hashedPassword })

      const token = generateToken({ id: user.id, email: user.email, name: user.name })
      await UserModel.saveToken(user.id, token)

      return res.status(201).json({ data: { user, token } })
    } catch (err) {
      next(err)
    }
  }

  // ── POST /users/login ──────────────────────────────────────
  static async login(req, res, next) {
    try {
      const { email, password } = req.body

      const user = await UserModel.getByEmail(email)
      if (!user) return res.status(401).json({ error: 'Credenciales inválidas' })

      const valid = await verifyPassword(password, user.password)
      if (!valid)  return res.status(401).json({ error: 'Credenciales inválidas' })

      const token = generateToken({ id: user.id, email: user.email, name: user.name })
      await UserModel.saveToken(user.id, token)

      return res.json({
        data: {
          token,
          user: { id: user.id, name: user.name, email: user.email },
        },
      })
    } catch (err) {
      next(err)
    }
  }

  // ── PUT /users/:id ─────────────────────────────────────────
  static async update(req, res, next) {
    try {
      const { id } = req.params

      // Solo el propio usuario puede modificarse
      if (req.user.id !== Number(id)) {
        return res.status(403).json({ error: 'Sin permiso para modificar este usuario' })
      }

      const exists = await UserModel.getById(id)
      if (!exists) return res.status(404).json({ error: 'Usuario no encontrado' })

      const { name, email, password } = req.body
      const hashedPassword = await hashPassword(password)

      const updated = await UserModel.update(id, { name, email, password: hashedPassword })
      return res.json({ data: updated })
    } catch (err) {
      next(err)
    }
  }

  // ── PATCH /users/:id ───────────────────────────────────────
  static async partialUpdate(req, res, next) {
    try {
      const { id } = req.params

      if (req.user.id !== Number(id)) {
        return res.status(403).json({ error: 'Sin permiso para modificar este usuario' })
      }

      const exists = await UserModel.getById(id)
      if (!exists) return res.status(404).json({ error: 'Usuario no encontrado' })

      const partialData = { ...req.body }

      // Si viene password, la ciframos antes de guardar
      if (partialData.password) {
        partialData.password = await hashPassword(partialData.password)
      }

      const updated = await UserModel.partialUpdate(id, partialData)
      return res.status(200).json({ data: updated })
    } catch (err) {
      next(err)
    }
  }

  // ── DELETE /users/:id ──────────────────────────────────────
  static async delete(req, res, next) {
    try {
      const { id } = req.params

      if (req.user.id !== Number(id)) {
        return res.status(403).json({ error: 'Sin permiso para eliminar este usuario' })
      }

      const exists = await UserModel.getById(id)
      if (!exists) return res.status(404).json({ error: 'Usuario no encontrado' })

      await UserModel.delete(id)
      return res.json({ message: 'Usuario eliminado correctamente' })
    } catch (err) {
      next(err)
    }
  }
}
