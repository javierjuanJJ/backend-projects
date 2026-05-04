// src/controllers/auth.js
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { UserModel } from '../models/users.js'
import { DEFAULTS } from '../../config.js'

export class AuthController {
  static async register(req, res) {
    const { username, email, password } = req.body

    try {
      const password_hash = await bcrypt.hash(password, DEFAULTS.BCRYPT_ROUNDS)
      const user = await UserModel.create({ username, email, password_hash })

      const token = jwt.sign(
        { userId: user.id, username: user.username },
        process.env.JWT_SECRET,
        { expiresIn: DEFAULTS.JWT_EXPIRES_IN }
      )

      return res.status(201).json({ user, token })
    } catch (e) {
      const status = e.status ?? 500
      return res.status(status).json({ error: e.message })
    }
  }

  static async login(req, res) {
    const { email, password } = req.body

    try {
      const user = await UserModel.getByEmailWithPassword(email)

      // Generic message — do NOT reveal which field is wrong (OWASP A07)
      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' })
      }

      const passwordMatch = await bcrypt.compare(password, user.password_hash)
      if (!passwordMatch) {
        return res.status(401).json({ error: 'Invalid credentials' })
      }

      const token = jwt.sign(
        { userId: user.id, username: user.username },
        process.env.JWT_SECRET,
        { expiresIn: DEFAULTS.JWT_EXPIRES_IN }
      )

      // Strip password_hash from response
      const { password_hash: _, ...publicUser } = user

      return res.json({ user: publicUser, token })
    } catch (e) {
      return res.status(500).json({ error: e.message })
    }
  }
}
