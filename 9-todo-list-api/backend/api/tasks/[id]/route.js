// app/api/tasks/[id]/route.js
// Rutas: GET /api/tasks/:id | PUT /api/tasks/:id | DELETE /api/tasks/:id

import prisma from '../../../../lib/prisma.js'
import { requireAuth } from '../../../../lib/auth.js'
import { ok, error, notFound } from '../../../../lib/response.js'

// ─────────────────────────────────────────────
// GET /api/tasks/:id
// Obtiene una task por su ID primario
// ─────────────────────────────────────────────
export async function GET(request, { params }) {
  try {
    const { id } = await params
    const taskId = parseInt(id)

    if (isNaN(taskId)) return error('ID inválido')

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    })

    if (!task) return notFound('Task')

    return ok({ task })
  } catch (err) {
    console.error('[GET /api/tasks/:id]', err)
    return error('Error al obtener task', 500)
  }
}

// ─────────────────────────────────────────────
// PUT /api/tasks/:id
// Actualiza una task (requiere autenticación + ser el dueño)
// Body: { title?, description? }
// ─────────────────────────────────────────────
export async function PUT(request, { params }) {
  try {
    const auth = requireAuth(request)
    if (auth.error) return error(auth.error, auth.status)

    const { id } = await params
    const taskId = parseInt(id)

    if (isNaN(taskId)) return error('ID inválido')

    // Verificar que la task existe y pertenece al usuario
    const existing = await prisma.task.findUnique({ where: { id: taskId } })
    if (!existing) return notFound('Task')

    if (existing.userId !== auth.user.id) {
      return error('No tienes permiso para modificar esta task', 403)
    }

    const body = await request.json()
    const { title, description } = body

    const updateData = {}
    if (title) {
      if (title.trim().length < 3) return error('El título debe tener al menos 3 caracteres')
      updateData.title = title.trim()
    }
    if (description) updateData.description = description.trim()

    if (Object.keys(updateData).length === 0) {
      return error('No se proporcionaron campos para actualizar')
    }

    const task = await prisma.task.update({
      where: { id: taskId },
      data: updateData,
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    })

    return ok({ task })
  } catch (err) {
    console.error('[PUT /api/tasks/:id]', err)
    return error('Error al actualizar task', 500)
  }
}

// ─────────────────────────────────────────────
// DELETE /api/tasks/:id
// Elimina una task (requiere autenticación + ser el dueño)
// ─────────────────────────────────────────────
export async function DELETE(request, { params }) {
  try {
    const auth = requireAuth(request)
    if (auth.error) return error(auth.error, auth.status)

    const { id } = await params
    const taskId = parseInt(id)

    if (isNaN(taskId)) return error('ID inválido')

    const existing = await prisma.task.findUnique({ where: { id: taskId } })
    if (!existing) return notFound('Task')

    if (existing.userId !== auth.user.id) {
      return error('No tienes permiso para eliminar esta task', 403)
    }

    await prisma.task.delete({ where: { id: taskId } })

    return ok({ message: 'Task eliminada correctamente' })
  } catch (err) {
    console.error('[DELETE /api/tasks/:id]', err)
    return error('Error al eliminar task', 500)
  }
}
