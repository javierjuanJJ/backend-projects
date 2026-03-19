import { z } from 'zod'

// ─── Schema base ──────────────────────────────────────────────────────────────

const userSchema = z.object({
  email: z
    .string({ error: 'El email es obligatorio' })
    .email('El email no tiene un formato válido')
    .toLowerCase()
    .trim(),

  password: z
    .string({ error: 'La contraseña es obligatoria' })
    .min(6,  'La contraseña debe tener al menos 6 caracteres')
    .max(100, 'La contraseña no puede superar 100 caracteres'),
})

// ─── Exportados ───────────────────────────────────────────────────────────────

export function validateUser(input) {
  return userSchema.safeParse(input)
}

export function validatePartialUser(input) {
  return userSchema.partial().safeParse(input)
}
