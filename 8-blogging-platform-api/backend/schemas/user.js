// schemas/user.js
// Validaciones Zod para autenticación y usuarios

import { z } from 'zod'

const authSchema = z.object({
  username: z
    .string({ error: 'El username es obligatorio' })
    .min(3, 'El username debe tener al menos 3 caracteres')
    .max(50, 'El username no puede exceder los 50 caracteres')
    .regex(/^[a-zA-Z0-9_]+$/, 'El username solo puede contener letras, números y guiones bajos')
    .transform((v) => v.trim()),

  password: z
    .string({ error: 'La contraseña es obligatoria' })
    .min(6, 'La contraseña debe tener al menos 6 caracteres')
    .max(100, 'La contraseña no puede exceder los 100 caracteres'),
})

const updateUserSchema = z.object({
  username: z
    .string()
    .min(3, 'El username debe tener al menos 3 caracteres')
    .max(50, 'El username no puede exceder los 50 caracteres')
    .regex(/^[a-zA-Z0-9_]+$/, 'Solo letras, números y guiones bajos')
    .transform((v) => v.trim())
    .optional(),

  password: z
    .string()
    .min(6, 'La contraseña debe tener al menos 6 caracteres')
    .max(100, 'La contraseña no puede exceder los 100 caracteres')
    .optional(),
})

/**
 * Valida credenciales completas (register / login).
 * @param {unknown} input
 */
export function validateAuth(input) {
  return authSchema.safeParse(input)
}

/**
 * Valida actualización parcial de usuario.
 * @param {unknown} input
 */
export function validatePartialUser(input) {
  return updateUserSchema.safeParse(input)
}
