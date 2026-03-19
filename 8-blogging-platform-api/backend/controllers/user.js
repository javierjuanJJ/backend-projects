// controllers/user.js
// Controlador de Users y Auth

import { NextResponse } from 'next/server'
import { UserModel } from '@/models/user'
import { validateAuth, validatePartialUser } from '@/schemas/user'
import { verifyPassword, generateToken, getAuthPayload } from '@/lib/auth'

export class UserController {
  // ── Auth ──────────────────────────────────────────────────────

  /**
   * POST /api/auth/register
   */
  static async register(request) {
    try {
      const body = await request.json()

      const result = validateAuth(body)
      if (!result.success) {
        return NextResponse.json(
          { success: false, error: 'Datos inválidos', details: result.error.flatten().fieldErrors },
          { status: 400 }
        )
      }

      const { username, password } = result.data

      const existing = await UserModel.getByUsername(username)
      if (existing) {
        return NextResponse.json(
          { success: false, error: 'El username ya está en uso' },
          { status: 409 }
        )
      }

      const user = await UserModel.create({ username, password })
      const token = generateToken({ id: user.id, username: user.username })
      await UserModel.saveToken({ id: user.id, token })

      return NextResponse.json(
        {
          success: true,
          message: 'Usuario registrado correctamente',
          data: { id: user.id, username: user.username, token, createdAt: user.createdAt },
        },
        { status: 201 }
      )
    } catch (error) {
      console.error('[UserController.register]', error)
      return NextResponse.json(
        { success: false, error: 'Error interno del servidor' },
        { status: 500 }
      )
    }
  }

  /**
   * POST /api/auth/login
   */
  static async login(request) {
    try {
      const body = await request.json()

      const result = validateAuth(body)
      if (!result.success) {
        return NextResponse.json(
          { success: false, error: 'Datos inválidos', details: result.error.flatten().fieldErrors },
          { status: 400 }
        )
      }

      const { username, password } = result.data
      const user = await UserModel.getByUsername(username)

      // Mensaje genérico para no revelar qué campo falla (seguridad)
      if (!user || !(await verifyPassword(password, user.password))) {
        return NextResponse.json(
          { success: false, error: 'Credenciales incorrectas' },
          { status: 401 }
        )
      }

      const token = generateToken({ id: user.id, username: user.username })
      await UserModel.saveToken({ id: user.id, token })

      return NextResponse.json({
        success: true,
        message: 'Login correcto',
        data: { id: user.id, username: user.username, token },
      })
    } catch (error) {
      console.error('[UserController.login]', error)
      return NextResponse.json(
        { success: false, error: 'Error interno del servidor' },
        { status: 500 }
      )
    }
  }

  /**
   * POST /api/auth/logout
   */
  static async logout(request) {
    try {
      const payload = getAuthPayload(request)
      if (!payload) {
        return NextResponse.json(
          { success: false, error: 'Token inválido o no proporcionado' },
          { status: 401 }
        )
      }

      await UserModel.clearToken(payload.id)
      return NextResponse.json({ success: true, message: 'Sesión cerrada correctamente' })
    } catch (error) {
      console.error('[UserController.logout]', error)
      return NextResponse.json(
        { success: false, error: 'Error interno del servidor' },
        { status: 500 }
      )
    }
  }

  /**
   * GET /api/auth/me
   */
  static async getMe(request) {
    try {
      const payload = getAuthPayload(request)
      if (!payload) {
        return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
      }

      const user = await UserModel.getById(payload.id)
      if (!user) {
        return NextResponse.json({ success: false, error: 'Usuario no encontrado' }, { status: 404 })
      }

      return NextResponse.json({ success: true, data: user })
    } catch (error) {
      console.error('[UserController.getMe]', error)
      return NextResponse.json(
        { success: false, error: 'Error interno del servidor' },
        { status: 500 }
      )
    }
  }

  /**
   * PUT /api/auth/me — actualizar perfil propio
   */
  static async updateMe(request) {
    try {
      const payload = getAuthPayload(request)
      if (!payload) {
        return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
      }

      const body = await request.json()
      const result = validatePartialUser(body)
      if (!result.success) {
        return NextResponse.json(
          { success: false, error: 'Datos inválidos', details: result.error.flatten().fieldErrors },
          { status: 400 }
        )
      }

      // Verificar unicidad del nuevo username si lo está cambiando
      if (result.data.username) {
        const taken = await UserModel.getByUsername(result.data.username)
        if (taken && taken.id !== payload.id) {
          return NextResponse.json(
            { success: false, error: 'El username ya está en uso' },
            { status: 409 }
          )
        }
      }

      const updated = await UserModel.partialUpdate({ id: payload.id, ...result.data })
      return NextResponse.json({ success: true, data: updated })
    } catch (error) {
      console.error('[UserController.updateMe]', error)
      return NextResponse.json(
        { success: false, error: 'Error interno del servidor' },
        { status: 500 }
      )
    }
  }

  // ── Users CRUD ────────────────────────────────────────────────

  /**
   * GET /api/users
   */
  static async getAll(request) {
    try {
      const payload = getAuthPayload(request)
      if (!payload) {
        return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
      }

      const users = await UserModel.getAll()
      return NextResponse.json({ success: true, data: users, total: users.length })
    } catch (error) {
      console.error('[UserController.getAll]', error)
      return NextResponse.json(
        { success: false, error: 'Error interno del servidor' },
        { status: 500 }
      )
    }
  }

  /**
   * GET /api/users/:id
   */
  static async getById(request, { params }) {
    try {
      const id = parseInt(params.id)
      if (isNaN(id) || id <= 0) {
        return NextResponse.json({ success: false, error: 'ID inválido' }, { status: 400 })
      }

      const user = await UserModel.getById(id)
      if (!user) {
        return NextResponse.json({ success: false, error: 'Usuario no encontrado' }, { status: 404 })
      }

      return NextResponse.json({ success: true, data: user })
    } catch (error) {
      console.error('[UserController.getById]', error)
      return NextResponse.json(
        { success: false, error: 'Error interno del servidor' },
        { status: 500 }
      )
    }
  }

  /**
   * DELETE /api/users/:id — solo el propio usuario
   */
  static async delete(request, { params }) {
    try {
      const payload = getAuthPayload(request)
      if (!payload) {
        return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
      }

      const id = parseInt(params.id)
      if (isNaN(id) || id <= 0) {
        return NextResponse.json({ success: false, error: 'ID inválido' }, { status: 400 })
      }

      if (payload.id !== id) {
        return NextResponse.json(
          { success: false, error: 'No puedes eliminar otro usuario' },
          { status: 403 }
        )
      }

      const exists = await UserModel.getById(id)
      if (!exists) {
        return NextResponse.json({ success: false, error: 'Usuario no encontrado' }, { status: 404 })
      }

      await UserModel.delete(id)
      return NextResponse.json({ success: true, message: `Usuario #${id} eliminado correctamente` })
    } catch (error) {
      console.error('[UserController.delete]', error)
      return NextResponse.json(
        { success: false, error: 'Error interno del servidor' },
        { status: 500 }
      )
    }
  }
}
