// src/controllers/auth.controller.js

import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { UserModel } from '../models/user.model.js'
import { JWT } from '../config.js'

const generateTokens = (user) => {
  const payload = { id: user.id, email: user.email, role: user.role }
  const accessToken = jwt.sign(payload, JWT.ACCESS_SECRET, { expiresIn: JWT.ACCESS_EXPIRES_IN })
  const refreshToken = jwt.sign(payload, JWT.REFRESH_SECRET, { expiresIn: JWT.REFRESH_EXPIRES_IN })
  return { accessToken, refreshToken }
}

export class AuthController {
  static async register(req, res, next) {
    try {
      const { username, email, password } = req.body

      const existing = await UserModel.getByEmail(email)
      if (existing) {
        return res.status(409).json({ error: 'Email already exists' })
      }

      const hashedPassword = await bcrypt.hash(password, 10)
      const user = await UserModel.create({ username, email, password: hashedPassword })

      const { accessToken, refreshToken } = generateTokens(user)
      return res.status(201).json({ user, accessToken, refreshToken })
    } catch (err) {
      next(err)
    }
  }

  static async login(req, res, next) {
    try {
      const { email, password } = req.body

      const user = await UserModel.getByEmailWithPassword(email)
      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' })
      }

      const valid = await bcrypt.compare(password, user.password)
      if (!valid) {
        return res.status(401).json({ error: 'Invalid credentials' })
      }

      const safeUser = { id: user.id, email: user.email, username: user.username, role: user.role }
      const { accessToken, refreshToken } = generateTokens(safeUser)
      return res.json({ user: safeUser, accessToken, refreshToken })
    } catch (err) {
      next(err)
    }
  }

  static async refresh(req, res, next) {
    try {
      const { refreshToken } = req.body

      let decoded
      try {
        decoded = jwt.verify(refreshToken, JWT.REFRESH_SECRET)
      } catch {
        return res.status(401).json({ error: 'Invalid or expired refresh token' })
      }

      const user = await UserModel.getById(decoded.id)
      if (!user) return res.status(401).json({ error: 'User not found' })

      const { accessToken, refreshToken: newRefreshToken } = generateTokens(user)
      return res.json({ accessToken, refreshToken: newRefreshToken })
    } catch (err) {
      next(err)
    }
  }

  static async me(req, res, next) {
    try {
      const user = await UserModel.getById(req.user.id)
      if (!user) return res.status(404).json({ error: 'User not found' })
      return res.json(user)
    } catch (err) {
      next(err)
    }
  }
}
