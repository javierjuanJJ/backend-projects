// app/api/auth/logout/route.js
import prisma from '@/lib/prisma'
import { getAuthPayload } from '@/lib/auth'
import { NextResponse } from 'next/server'

/**
 * POST /api/auth/logout
 * Header: Authorization: Bearer <token>
 *
 * Invalida el token guardado en BD (lo pone a null).
 */
export async function POST(request) {
  try {
    const payload = getAuthPayload(request)
    if (!payload) {
      return NextResponse.json(
        { success: false, error: 'Token inválido o no proporcionado' },
        { status: 401 }
      )
    }

    // Borrar el token de la BD → sesión invalidada
    await prisma.user.update({
      where: { id: payload.id },
      data: { token: null },
    })

    return NextResponse.json({ success: true, message: 'Sesión cerrada correctamente' })
  } catch (error) {
    console.error('[POST /api/auth/logout]', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
