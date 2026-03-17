// app/api/users/[id]/route.js
// Rutas: GET /api/users/:id | PUT /api/users/:id | DELETE /api/users/:id

import prisma from '../../../../lib/prisma.js'
import { hashPassword, requireAuth } from '../../../../lib/auth.js'
import { ok, error, notFound } from '../../../../lib/response.js'

// ─────────────────────────────────────────────
// GET /api/users/:id
// Obtiene un usuario por ID
// ─────────────────────────────────────────────
export async function GET(request, { params }) {
  try {
    const { id } = await params
    const userId = parseInt(id)

    if (isNaN(userId)) {
      return error('ID inválido')
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        updatedAt: true,
        tasks: {
          select: { id: true, title: true, description: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    if (!user) return notFound('Usuario')

    return ok({ user })
  } catch (err) {
    console.error('[GET /api/users/:id]', err)
    return error('Error al obtener usuario', 500)
  }
}

// ─────────────────────────────────────────────
// PUT /api/users/:id
// Actualiza un usuario (requiere autenticación)
// Body: { name?, email?, password? }
// ─────────────────────────────────────────────
export async function PUT(request, { params }) {
  try {
    // Verificar autenticación
    const auth = requireAuth(request)
    if (auth.error) return error(auth.error, auth.status)

    const { id } = await params
    const userId = parseInt(id)

    if (isNaN(userId)) return error('ID inválido')

    // Solo el propio usuario puede actualizarse
    if (auth.user.id !== userId) {
      return error('No tienes permiso para actualizar este usuario', 403)
    }

    const body = await request.json()
    const { name, email, password } = body

    const updateData = {}
    if (name) updateData.name = name
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) return error('El email no es válido')
      // Verificar que el nuevo email no esté en uso
      const existing = await prisma.user.findUnique({ where: { email } })
      if (existing && existing.id !== userId) return error('El email ya está en uso', 409)
      updateData.email = email
    }
    if (password) {
      if (password.length < 6) return error('La contraseña debe tener al menos 6 caracteres')
      updateData.password = await hashPassword(password)
    }

    if (Object.keys(updateData).length === 0) {
      return error('No se proporcionaron campos para actualizar')
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: { id: true, name: true, email: true, updatedAt: true },
    })

    return ok({ user: updated })
  } catch (err) {
    console.error('[PUT /api/users/:id]', err)
    return error('Error al actualizar usuario', 500)
  }
}

// ─────────────────────────────────────────────
// DELETE /api/users/:id
// Elimina un usuario y sus tasks en cascada (requiere auth)
// ─────────────────────────────────────────────
export async function DELETE(request, { params }) {
  try {
    const auth = requireAuth(request)
    if (auth.error) return error(auth.error, auth.status)

    const { id } = await params
    const userId = parseInt(id)

    if (isNaN(userId)) return error('ID inválido')

    if (auth.user.id !== userId) {
      return error('No tienes permiso para eliminar este usuario', 403)
    }

    const exists = await prisma.user.findUnique({ where: { id: userId } })
    if (!exists) return notFound('Usuario')

    await prisma.user.delete({ where: { id: userId } })

    return ok({ message: 'Usuario eliminado correctamente' })
  } catch (err) {
    console.error('[DELETE /api/users/:id]', err)
    return error('Error al eliminar usuario', 500)
  }
}
