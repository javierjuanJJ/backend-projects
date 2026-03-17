// app/api/users/route.js
import prisma from '@/lib/prisma'
import { getAuthPayload } from '@/lib/auth'
import { NextResponse } from 'next/server'

/**
 * GET /api/users
 * Header: Authorization: Bearer <token>   (requiere auth)
 *
 * Lista todos los usuarios (sin exponer password ni token).
 */
export async function GET(request) {
  const payload = getAuthPayload(request)
  if (!payload) {
    return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
  }

  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        username: true,
        createdAt: true,
        updated_at: true,
        _count: { select: { posts: true } },
      },
    })

    return NextResponse.json({ success: true, data: users, total: users.length })
  } catch (error) {
    console.error('[GET /api/users]', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
