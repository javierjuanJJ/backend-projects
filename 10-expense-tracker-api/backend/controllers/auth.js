import { UserModel } from '../models/user.js'
import { comparePassword, generateToken } from '../lib/auth.js'

export class AuthController {
  /**
   * POST /auth/register
   * Registra un usuario nuevo con contraseña cifrada y devuelve JWT
   */
  static async register(req, res, next) {
    try {
      const { email, password } = req.body   // ya validado por Zod en la ruta

      // Verificar email único
      const existing = await UserModel.getByEmail(email)
      if (existing) {
        return res.status(409).json({ error: 'El email ya está registrado' })
      }

      // Crear usuario (bcrypt interno en el modelo)
      const user  = await UserModel.create({ email, password })
      const token = generateToken({ id: user.id, email: user.email })
      await UserModel.saveToken(user.id, token)

      return res.status(201).json({ data: { user, token } })
    } catch (err) {
      next(err)
    }
  }

  /**
   * POST /auth/login
   * Autentica al usuario verificando bcrypt y emite un nuevo JWT
   */
  static async login(req, res, next) {
    try {
      const { email, password } = req.body   // ya validado por Zod en la ruta

      const user = await UserModel.getByEmail(email)
      if (!user) {
        return res.status(401).json({ error: 'Credenciales inválidas' })
      }

      const isValid = await comparePassword(password, user.password)
      if (!isValid) {
        return res.status(401).json({ error: 'Credenciales inválidas' })
      }

      const token = generateToken({ id: user.id, email: user.email })
      await UserModel.saveToken(user.id, token)

      // Nunca devolver el campo password
      return res.json({
        data: {
          user:  { id: user.id, email: user.email },
          token,
        },
      })
    } catch (err) {
      next(err)
    }
  }
}
