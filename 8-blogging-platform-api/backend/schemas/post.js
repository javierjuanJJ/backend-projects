// schemas/post.js
// Validaciones Zod para el modelo Post

import { z } from 'zod'

const postSchema = z.object({
  title: z
    .string({ error: 'El título es obligatorio' })
    .min(3, 'El título debe tener al menos 3 caracteres')
    .max(200, 'El título no puede exceder los 200 caracteres')
    .transform((v) => v.trim()),

  content: z
    .string({ error: 'El contenido es obligatorio' })
    .min(10, 'El contenido debe tener al menos 10 caracteres')
    .transform((v) => v.trim()),

  category: z
    .array(z.string().min(1, 'Cada tag debe tener al menos 1 carácter'))
    .default([]),

  authorId: z
    .number({ coerce: true })
    .int()
    .positive()
    .optional()
    .nullable(),
})

/**
 * Valida un Post completo (para POST / PUT).
 * @param {unknown} input
 * @returns {z.SafeParseReturnType}
 */
export function validatePost(input) {
  return postSchema.safeParse(input)
}

/**
 * Valida un Post parcial (para PATCH).
 * @param {unknown} input
 * @returns {z.SafeParseReturnType}
 */
export function validatePartialPost(input) {
  return postSchema.partial().safeParse(input)
}
