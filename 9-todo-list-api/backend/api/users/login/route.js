// app/api/users/login/route.js
// POST /api/users/login
// Autentica al usuario y devuelve JWT

import prisma from '../../../../lib/prisma.js'
import { verifyPassword, generateToken } from '../../../../lib/auth.js'
import { ok, error } from '../../../../lib/response.js'

export async function POST(request) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return error('email y password son requeridos')
    }

    // Buscar usuario por email
    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      return error('Credenciales inválidas', 401)
    }

    // Verificar contraseña contra el hash almacenado
    const passwordValid = await verifyPassword(password, user.password)
    if (!passwordValid) {
      return error('Credenciales inválidas', 401)
    }

    // Generar nuevo JWT
    const token = generateToken({ id: user.id, email: user.email, name: user.name })

    // Actualizar token en DB
    await prisma.user.update({
      where: { id: user.id },
      data: { token },
    })

    return ok({
      message: 'Login exitoso',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    })
  } catch (err) {
    console.error('[POST /api/users/login]', err)
    return error('Error en el login', 500)
  }
}
