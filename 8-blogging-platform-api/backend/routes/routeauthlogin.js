// app/api/auth/login/route.js
import prisma from '@/lib/prisma'
import { verifyPassword, generateToken } from '@/lib/auth'
import { NextResponse } from 'next/server'

/**
 * POST /api/auth/login
 * Body: { username, password }
 *
 * Verifica credenciales, genera nuevo JWT y lo persiste en BD.
 */
export async function POST(request) {
  try {
    const body = await request.json()
    const { username, password } = body

    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: 'username y password son obligatorios' },
        { status: 400 }
      )
    }

    // ── Buscar usuario ────────────────────────────────────────
    const user = await prisma.user.findUnique({
      where: { username: username.trim() },
    })

    // Mismo mensaje para usuario no encontrado o contraseña incorrecta
    // (evita revelar qué campo falló — seguridad)
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Credenciales incorrectas' },
        { status: 401 }
      )
    }

    // ── Verificar contraseña con bcrypt ───────────────────────
    const passwordOk = await verifyPassword(password, user.password)
    if (!passwordOk) {
      return NextResponse.json(
        { success: false, error: 'Credenciales incorrectas' },
        { status: 401 }
      )
    }

    // ── Generar nuevo JWT y persistirlo ───────────────────────
    const token = generateToken({ id: user.id, username: user.username })

    await prisma.user.update({
      where: { id: user.id },
      data: { token },
    })

    return NextResponse.json({
      success: true,
      message: 'Login correcto',
      data: {
        id: user.id,
        username: user.username,
        token,
      },
    })
  } catch (error) {
    console.error('[POST /api/auth/login]', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
