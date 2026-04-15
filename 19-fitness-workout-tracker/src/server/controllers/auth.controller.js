// src/server/controllers/auth.controller.js
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { UserModel } from '../models/user.model.js'
import { DEFAULTS } from '../config.js'

export class AuthController {
  /**
   * @swagger
   * /api/auth/register:
   *   post:
   *     summary: Register a new user
   *     tags: [Auth]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/RegisterDto'
   *           example:
   *             username: johndoe
   *             email: john@example.com
   *             password: Password123!
   *     responses:
   *       201:
   *         description: User registered successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/AuthResponse'
   *       400:
   *         $ref: '#/components/responses/ValidationError'
   *       409:
   *         $ref: '#/components/responses/Conflict'
   */
  static async register(req, res) {
    try {
      const { username, email, password } = req.body

      const existing = await UserModel.existsByEmailOrUsername(email, username)
      if (existing) {
        const field = existing.email === email ? 'email' : 'username'
        return res.status(409).json({ error: `A user with that ${field} already exists` })
      }

      const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS) || DEFAULTS.BCRYPT_SALT_ROUNDS
      const passwordHash = await bcrypt.hash(password, saltRounds)

      const user = await UserModel.create({ username, email, passwordHash })

      const token = jwt.sign(
        { id: user.id, email: user.email, username: user.username },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || DEFAULTS.JWT_EXPIRES_IN }
      )

      return res.status(201).json({ token, user })
    } catch (error) {
      console.error('[AuthController.register]', error)
      return res.status(500).json({ error: 'Internal server error' })
    }
  }

  /**
   * @swagger
   * /api/auth/login:
   *   post:
   *     summary: Login and get JWT token
   *     tags: [Auth]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/LoginDto'
   *           example:
   *             email: john@example.com
   *             password: Password123!
   *     responses:
   *       200:
   *         description: Login successful
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/AuthResponse'
   *       400:
   *         $ref: '#/components/responses/ValidationError'
   *       401:
   *         $ref: '#/components/responses/Unauthorized'
   */
  static async login(req, res) {
    try {
      const { email, password } = req.body

      const user = await UserModel.getByEmail(email)
      if (!user) {
        return res.status(401).json({ error: 'Invalid email or password' })
      }

      const isValid = await bcrypt.compare(password, user.passwordHash)
      if (!isValid) {
        return res.status(401).json({ error: 'Invalid email or password' })
      }

      const token = jwt.sign(
        { id: user.id, email: user.email, username: user.username },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || DEFAULTS.JWT_EXPIRES_IN }
      )

      // No enviar passwordHash al cliente
      const { passwordHash: _, ...safeUser } = user

      return res.status(200).json({ token, user: safeUser })
    } catch (error) {
      console.error('[AuthController.login]', error)
      return res.status(500).json({ error: 'Internal server error' })
    }
  }
}
