// app/api/users/[id]/route.js
import prisma from '@/lib/prisma'
import { getAuthPayload } from '@/lib/auth'
import { NextResponse } from 'next/server'

/**
 * GET /api/users/:id
 * Obtiene un usuario por ID (público: muestra username y posts).
 */
export async function GET(request, { params }) {
  try {
    const id = parseInt(params.id)
    if (isNaN(id)) {
      return NextResponse.json({ success: false, error: 'ID inválido' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        createdAt: true,
        posts: {
          select: { id: true, title: true, category: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    if (!user) {
      return NextResponse.json({ success: false, error: 'Usuario no encontrado' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: user })
  } catch (error) {
    console.error('[GET /api/users/:id]', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

/**
 * DELETE /api/users/:id
 * Header: Authorization: Bearer <token>
 *
 * Solo el propio usuario puede eliminarse a sí mismo.
 */
export async function DELETE(request, { params }) {
  try {
    const payload = getAuthPayload(request)
    if (!payload) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
    }

    const id = parseInt(params.id)
    if (isNaN(id)) {
      return NextResponse.json({ success: false, error: 'ID inválido' }, { status: 400 })
    }

    // Solo puede eliminarse a sí mismo
    if (payload.id !== id) {
      return NextResponse.json(
        { success: false, error: 'No puedes eliminar otro usuario' },
        { status: 403 }
      )
    }

    const exists = await prisma.user.findUnique({ where: { id } })
    if (!exists) {
      return NextResponse.json({ success: false, error: 'Usuario no encontrado' }, { status: 404 })
    }

    // Desconectar posts del usuario antes de eliminarlo
    await prisma.post.updateMany({
      where: { authorId: id },
      data: { authorId: null },
    })

    await prisma.user.delete({ where: { id } })

    return NextResponse.json({ success: true, message: `Usuario #${id} eliminado` })
  } catch (error) {
    console.error('[DELETE /api/users/:id]', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
