// src/schemas/notes.js
import { z } from 'zod'

// ─── Schema principal ──────────────────────────────────────────────────────
const noteSchema = z.object({
  title: z
    .string({ error: 'El título es obligatorio y debe ser texto' })
    .trim()
    .min(1, 'El título no puede estar vacío')
    .min(3, 'El título debe tener al menos 3 caracteres')
    .max(150, 'El título no puede superar los 150 caracteres'),

  content: z
    .string({ error: 'El contenido es obligatorio y debe ser texto' })
    .trim()
    .min(1, 'El contenido no puede estar vacío'),

  filename: z
    .string()
    .trim()
    .optional()
    .nullable(),

  tags: z
    .union([
      z.string().trim(),        // "tag1,tag2"
      z.array(z.string().trim()) // ["tag1","tag2"]
    ])
    .optional()
    .nullable()
    .transform(val => {
      if (!val) return null
      if (Array.isArray(val)) return val.filter(Boolean).join(',')
      return val
    }),
})

// ─── Schema de query params (listado) ─────────────────────────────────────
export const querySchema = z.object({
  limit: z
    .string()
    .optional()
    .transform(v => (v !== undefined ? Number(v) : 10))
    .refine(n => !isNaN(n) && n > 0 && n <= 100, 'limit debe ser un número entre 1 y 100'),

  offset: z
    .string()
    .optional()
    .transform(v => (v !== undefined ? Number(v) : 0))
    .refine(n => !isNaN(n) && n >= 0, 'offset debe ser un número >= 0'),

  search: z.string().trim().optional(),

  tag: z.string().trim().optional(),

  orderBy: z
    .enum(['createdAt', 'updatedAt', 'title'], {
      error: 'orderBy debe ser "createdAt", "updatedAt" o "title"',
    })
    .optional()
    .default('createdAt'),

  order: z
    .enum(['asc', 'desc'], { error: 'order debe ser "asc" o "desc"' })
    .optional()
    .default('desc'),
})

// ─── Exports ───────────────────────────────────────────────────────────────
export function validateNote(input) {
  return noteSchema.safeParse(input)
}

export function validatePartialNote(input) {
  return noteSchema.partial().safeParse(input)
}

export function validateQuery(input) {
  return querySchema.safeParse(input)
}
