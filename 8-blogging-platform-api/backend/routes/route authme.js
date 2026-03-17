// app/api/auth/me/route.js
import prisma from '@/lib/prisma'
import { getAuthPayload } from '@/lib/auth'
import { NextResponse } from 'next/server'

/**
 * GET /api/auth/me
 * Header: Authorization: Bearer <token>
 *
 * Devuelve el perfil del usuario autenticado con sus posts.
 */
export async function GET(request) {
  try {
    const payload = getAuthPayload(request)
    if (!payload) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.id },
      select: {
        id: true,
        username: true,
        createdAt: true,
        updated_at: true,
        // Nunca devolver password ni token en la respuesta
        posts: {
          orderBy: { createdAt: 'desc' },
          select: { id: true, title: true, category: true, createdAt: true },
        },
      },
    })

    if (!user) {
      return NextResponse.json({ success: false, error: 'Usuario no encontrado' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: user })
  } catch (error) {
    console.error('[GET /api/auth/me]', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

/**
 * PUT /api/auth/me
 * Header: Authorization: Bearer <token>
 * Body: { username?, password? }
 *
 * Actualiza el perfil del usuario autenticado.
 */
export async function PUT(request) {
  try {
    const payload = getAuthPayload(request)
    if (!payload) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { username, password } = body
    const updateData = {}

    if (username !== undefined) {
      if (typeof username !== 'string' || username.trim().length < 3) {
        return NextResponse.json(
          { success: false, error: 'El username debe tener al menos 3 caracteres' },
          { status: 400 }
        )
      }
      // Verificar que no esté en uso por otro usuario
      const taken = await prisma.user.findUnique({ where: { username: username.trim() } })
      if (taken && taken.id !== payload.id) {
        return NextResponse.json(
          { success: false, error: 'El username ya está en uso' },
          { status: 409 }
        )
      }
      updateData.username = username.trim()
    }

    if (password !== undefined) {
      if (typeof password !== 'string' || password.length < 6) {
        return NextResponse.json(
          { success: false, error: 'La nueva contraseña debe tener al menos 6 caracteres' },
          { status: 400 }
        )
      }
      const { hashPassword } = require('@/lib/auth')
      updateData.password = await hashPassword(password)
    }

    const updated = await prisma.user.update({
      where: { id: payload.id },
      data: updateData,
      select: { id: true, username: true, createdAt: true, updated_at: true },
    })

    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    console.error('[PUT /api/auth/me]', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
