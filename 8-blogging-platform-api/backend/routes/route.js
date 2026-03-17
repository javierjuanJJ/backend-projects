// app/api/auth/register/route.js
import prisma from '@/lib/prisma'
import { hashPassword, generateToken } from '@/lib/auth'
import { NextResponse } from 'next/server'

/**
 * POST /api/auth/register
 * Body: { username, password }
 *
 * Crea un nuevo usuario con la contraseña hasheada con bcrypt
 * y genera su JWT inicial.
 */
export async function POST(request) {
  try {
    const body = await request.json()
    const { username, password } = body

    // ── Validaciones ──────────────────────────────────────────
    if (!username || typeof username !== 'string' || username.trim().length < 3) {
      return NextResponse.json(
        { success: false, error: 'El username debe tener al menos 3 caracteres' },
        { status: 400 }
      )
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      return NextResponse.json(
        { success: false, error: 'La contraseña debe tener al menos 6 caracteres' },
        { status: 400 }
      )
    }

    // ── Verificar unicidad ────────────────────────────────────
    const existing = await prisma.user.findUnique({
      where: { username: username.trim() },
    })
    if (existing) {
      return NextResponse.json(
        { success: false, error: 'El username ya está en uso' },
        { status: 409 }
      )
    }

    // ── Hashear contraseña (bcrypt, 12 rounds) ────────────────
    const hashedPassword = await hashPassword(password)

    // ── Crear usuario ─────────────────────────────────────────
    const user = await prisma.user.create({
      data: {
        username: username.trim(),
        password: hashedPassword,
      },
    })

    // ── Generar JWT y guardarlo en BD ─────────────────────────
    const token = generateToken({ id: user.id, username: user.username })

    await prisma.user.update({
      where: { id: user.id },
      data: { token },
    })

    return NextResponse.json(
      {
        success: true,
        message: 'Usuario registrado correctamente',
        data: {
          id: user.id,
          username: user.username,
          token,
          createdAt: user.createdAt,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('[POST /api/auth/register]', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
