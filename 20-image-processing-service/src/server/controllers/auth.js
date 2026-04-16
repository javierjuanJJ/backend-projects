/**
 * @file controllers/auth.js
 * @description Handles user registration and login.
 * Passwords are hashed with bcrypt before storage.
 * JWTs are signed with HS256.
 */
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { UserModel } from '../models/user.js'
import { validateRegister, validateLogin } from '../schemas/auth.js'
import { DEFAULTS } from '../config.js'

const sign = (user) =>
  jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN ?? DEFAULTS.JWT_EXPIRES_IN },
  )

export class AuthController {
  /**
   * @swagger
   * /api/register:
   *   post:
   *     summary: Register a new user
   *     tags: [Auth]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [email, password]
   *             properties:
   *               email:    { type: string, format: email }
   *               password: { type: string, minLength: 8 }
   *     responses:
   *       201:
   *         description: User created successfully
   *       400:
   *         description: Validation error
   *       409:
   *         description: Email already in use
   */
  static async register(req, res) {
    const result = validateRegister(req.body)
    if (!result.success) {
      return res.status(400).json({ error: 'Validation failed', details: result.error.errors })
    }

    const { email, password } = result.data

    try {
      const existing = await UserModel.findByEmail(email)
      if (existing) {
        return res.status(409).json({ error: 'Email is already registered' })
      }

      const passwordHash = await bcrypt.hash(password, DEFAULTS.BCRYPT_ROUNDS)
      const user = await UserModel.create({ email, passwordHash })
      const token = sign(user)

      return res.status(201).json({ user, token })
    } catch (err) {
      console.error('Register error:', err)
      return res.status(500).json({ error: 'Registration failed' })
    }
  }

  /**
   * @swagger
   * /api/login:
   *   post:
   *     summary: Log in and receive a JWT
   *     tags: [Auth]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [email, password]
   *             properties:
   *               email:    { type: string, format: email }
   *               password: { type: string }
   *     responses:
   *       200:
   *         description: Login successful
   *       400:
   *         description: Validation error
   *       401:
   *         description: Invalid credentials
   */
  static async login(req, res) {
    const result = validateLogin(req.body)
    if (!result.success) {
      return res.status(400).json({ error: 'Validation failed', details: result.error.errors })
    }

    const { email, password } = result.data

    try {
      const user = await UserModel.findByEmail(email)
      if (!user) {
        return res.status(401).json({ error: 'Invalid email or password' })
      }

      const passwordMatch = await bcrypt.compare(password, user.passwordHash)
      if (!passwordMatch) {
        return res.status(401).json({ error: 'Invalid email or password' })
      }

      const { passwordHash: _, ...safeUser } = user
      const token = sign(safeUser)

      return res.status(200).json({ user: safeUser, token })
    } catch (err) {
      console.error('Login error:', err)
      return res.status(500).json({ error: 'Login failed' })
    }
  }

  /**
   * @swagger
   * /api/me:
   *   get:
   *     summary: Get current authenticated user
   *     tags: [Auth]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Current user data
   *       401:
   *         description: Unauthorized
   */
  static async me(req, res) {
    try {
      const user = await UserModel.findById(req.user.id)
      if (!user) return res.status(404).json({ error: 'User not found' })
      return res.status(200).json(user)
    } catch (err) {
      console.error('Me error:', err)
      return res.status(500).json({ error: 'Could not fetch user' })
    }
  }
}
