import prisma from "@/lib/prisma";
import { comparePassword, generateToken } from "@/lib/auth";
import { ok, badRequest, unauthorized, serverError } from "@/lib/response";

/**
 * POST /api/auth/login
 * Body: { email: string, password: string }
 *
 * Autentica un usuario, verifica la contraseña con bcrypt
 * y devuelve un JWT token.
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Validaciones básicas
    if (!email || !password) {
      return badRequest("Email y contraseña son requeridos");
    }

    // Buscar usuario
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return unauthorized("Credenciales inválidas");
    }

    // Comparar contraseña con hash bcrypt
    const isValid = await comparePassword(password, user.password);
    if (!isValid) {
      return unauthorized("Credenciales inválidas");
    }

    // Generar nuevo JWT
    const token = generateToken({ id: user.id, email: user.email });

    // Actualizar token en la BD
    await prisma.user.update({
      where: { id: user.id },
      data: { token },
    });

    return ok({
      user: { id: user.id, email: user.email },
      token,
    });
  } catch (error) {
    console.error("[POST /api/auth/login]", error);
    return serverError();
  }
}
