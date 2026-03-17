// app/api/users/route.js
// Rutas: GET /api/users | POST /api/users (registro)

import prisma from '../../../lib/prisma.js'
import { hashPassword, generateToken } from '../../../lib/auth.js'
import { ok, created, error } from '../../../lib/response.js'

// ─────────────────────────────────────────────
// GET /api/users
// Lista todos los usuarios (sin exponer password ni token)
// Query params opcionales:
//   ?search=texto  → filtra por nombre o email
// ─────────────────────────────────────────────
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')

    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {}

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        updatedAt: true,
        // ⚠️ Nunca exponer password ni token
      },
      orderBy: { createdAt: 'desc' },
    })

    return ok({ users, total: users.length })
  } catch (err) {
    console.error('[GET /api/users]', err)
    return error('Error al obtener usuarios', 500)
  }
}

// ─────────────────────────────────────────────
// POST /api/users
// Registra un nuevo usuario
// Body: { name, email, password }
// ─────────────────────────────────────────────
export async function POST(request) {
  try {
    const body = await request.json()
    const { name, email, password } = body

    // Validaciones básicas
    if (!name || !email || !password) {
      return error('name, email y password son requeridos')
    }

    if (password.length < 6) {
      return error('La contraseña debe tener al menos 6 caracteres')
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return error('El email no es válido')
    }

    // Verificar si el email ya existe
    const existingUser = await prisma.user.findUnique({ where: { email } })
    if (existingUser) {
      return error('El email ya está registrado', 409)
    }

    // Cifrar contraseña con bcrypt (12 rondas)
    const hashedPassword = await hashPassword(password)

    // Crear usuario
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      },
    })

    // Generar JWT
    const token = generateToken({ id: user.id, email: user.email, name: user.name })

    // Guardar token en la base de datos
    await prisma.user.update({
      where: { id: user.id },
      data: { token },
    })

    return created({ user, token })
  } catch (err) {
    console.error('[POST /api/users]', err)
    return error('Error al crear usuario', 500)
  }
}
