// app/api/tasks/route.js
// Rutas: GET /api/tasks | POST /api/tasks

import prisma from '../../../lib/prisma.js'
import { requireAuth } from '../../../lib/auth.js'
import { ok, created, error } from '../../../lib/response.js'

// ─────────────────────────────────────────────
// GET /api/tasks
// Lista tasks con filtros opcionales:
//
//   ?id=5              → filtra por ID exacto
//   ?search=texto      → filtra por texto en title O description (contiene)
//   ?title=texto       → filtra solo en title (contiene)
//   ?userId=3          → filtra por usuario dueño
//
// Combinaciones permitidas: search + userId, title + userId, etc.
// ─────────────────────────────────────────────
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)

    const id      = searchParams.get('id')
    const search  = searchParams.get('search')   // busca en title Y description
    const title   = searchParams.get('title')    // busca solo en title
    const userId  = searchParams.get('userId')

    // ── Filtro por ID exacto ──
    if (id) {
      const taskId = parseInt(id)
      if (isNaN(taskId)) return error('ID inválido')

      const task = await prisma.task.findUnique({
        where: { id: taskId },
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      })

      if (!task) {
        return ok({ tasks: [], total: 0, filter: { id: taskId } })
      }

      return ok({ tasks: [task], total: 1, filter: { id: taskId } })
    }

    // ── Construir cláusula where ──
    const where = {}

    if (userId) {
      const uid = parseInt(userId)
      if (!isNaN(uid)) where.userId = uid
    }

    if (search) {
      // Busca la cadena en title O en description completo (contains, insensitive)
      where.OR = [
        { title:       { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    } else if (title) {
      // Busca solo en el campo title
      where.title = { contains: title, mode: 'insensitive' }
    }

    const tasks = await prisma.task.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return ok({
      tasks,
      total: tasks.length,
      filter: { search, title, userId },
    })
  } catch (err) {
    console.error('[GET /api/tasks]', err)
    return error('Error al obtener tasks', 500)
  }
}

// ─────────────────────────────────────────────
// POST /api/tasks
// Crea una nueva task (requiere autenticación JWT)
// Body: { title, description }
// Header: Authorization: Bearer <token>
// ─────────────────────────────────────────────
export async function POST(request) {
  try {
    // Verificar autenticación
    const auth = requireAuth(request)
    if (auth.error) return error(auth.error, auth.status)

    const body = await request.json()
    const { title, description } = body

    if (!title || !description) {
      return error('title y description son requeridos')
    }

    if (title.trim().length < 3) {
      return error('El título debe tener al menos 3 caracteres')
    }

    const task = await prisma.task.create({
      data: {
        title:       title.trim(),
        description: description.trim(),
        userId:      auth.user.id,
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    })

    return created({ task })
  } catch (err) {
    console.error('[POST /api/tasks]', err)
    return error('Error al crear task', 500)
  }
}
