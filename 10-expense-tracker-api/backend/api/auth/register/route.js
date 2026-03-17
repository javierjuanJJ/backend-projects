import prisma from "@/lib/prisma";
import { hashPassword, generateToken } from "@/lib/auth";
import { created, badRequest, serverError } from "@/lib/response";

/**
 * POST /api/auth/register
 * Body: { email: string, password: string }
 *
 * Registra un nuevo usuario con contraseña cifrada con bcrypt
 * y devuelve un JWT token.
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Validaciones
    if (!email || !password) {
      return badRequest("Email y contraseña son requeridos");
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return badRequest("Email inválido");
    }
    if (password.length < 6) {
      return badRequest("La contraseña debe tener al menos 6 caracteres");
    }

    // Verificar si el usuario ya existe
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return badRequest("El email ya está registrado");
    }

    // Cifrar contraseña con bcrypt (12 salt rounds)
    const hashedPassword = await hashPassword(password);

    // Crear usuario en la BD
    const user = await prisma.user.create({
      data: { email, password: hashedPassword },
      select: { id: true, email: true, createdAt: true },
    });

    // Generar JWT
    const token = generateToken({ id: user.id, email: user.email });

    // Guardar token en la BD
    await prisma.user.update({
      where: { id: user.id },
      data: { token },
    });

    return created({
      user: { id: user.id, email: user.email, createdAt: user.createdAt },
      token,
    });
  } catch (error) {
    console.error("[POST /api/auth/register]", error);
    return serverError();
  }
}
