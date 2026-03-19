// src/schemas/weather.js
// Validaciones con Zod para los endpoints de clima y favoritos
// Docs: https://zod.dev

import * as z from 'zod'

// ── Regex helpers ─────────────────────────────────────────────────────────────
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/
const DATE_TIME_REGEX = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/
const LAT_LON_REGEX = /^-?\d+(\.\d+)?,-?\d+(\.\d+)?$/

const DYNAMIC_KEYWORDS = [
  'today', 'yesterday', 'tomorrow',
  'last7days', 'last30days', 'last365days',
  'next7days', 'next30days',
  'lastyear', 'thisyear',
]

// ── Validador de fecha o keyword dinámico ─────────────────────────────────────
const dateOrKeyword = z
  .string()
  .refine(
    (val) =>
      DYNAMIC_KEYWORDS.includes(val) ||
      DATE_REGEX.test(val) ||
      DATE_TIME_REGEX.test(val),
    {
      message:
        'Debe ser una fecha válida (yyyy-MM-dd), datetime (yyyy-MM-ddTHH:mm:ss) o keyword dinámico (today, yesterday, last7days…)',
    }
  )

// ── Schema para query params de GET /weather ─────────────────────────────────
export const weatherQuerySchema = z.object({
  location: z
    .string({ error: 'La ubicación es obligatoria' })
    .min(2, 'La ubicación debe tener al menos 2 caracteres')
    .max(200, 'La ubicación es demasiado larga'),

  date1: dateOrKeyword.optional(),
  date2: dateOrKeyword.optional(),

  unitGroup: z
    .enum(['us', 'uk', 'metric', 'base'], {
      error: "unitGroup debe ser 'us', 'uk', 'metric' o 'base'",
    })
    .optional()
    .default('metric'),

  lang: z
    .string()
    .length(2, 'El idioma debe ser un código de 2 letras (ej: es, en, fr)')
    .optional()
    .default('es'),

  include: z
    .string()
    .regex(
      /^(days|hours|minutes|alerts|current|obs|fcst|stats)(,(days|hours|minutes|alerts|current|obs|fcst|stats))*$/,
      "include debe ser una lista separada por comas: days, hours, minutes, alerts, current, obs, fcst, stats"
    )
    .optional()
    .default('days,hours,current'),

  limit: z
    .string()
    .optional()
    .transform((val) => (val !== undefined ? Number(val) : undefined))
    .pipe(z.number().int().min(1).max(30).optional()),

  offset: z
    .string()
    .optional()
    .transform((val) => (val !== undefined ? Number(val) : 0))
    .pipe(z.number().int().min(0).optional()),
})

// ── Schema para crear/actualizar ubicaciones favoritas ────────────────────────
const favoriteLocationSchema = z.object({
  name: z
    .string({ error: 'El nombre es obligatorio' })
    .min(1, 'El nombre no puede estar vacío')
    .max(100, 'El nombre no puede exceder los 100 caracteres'),

  location: z
    .string({ error: 'La ubicación es obligatoria' })
    .min(2, 'La ubicación debe tener al menos 2 caracteres')
    .max(200, 'La ubicación es demasiado larga'),
})

export function validateWeatherQuery(input) {
  return weatherQuerySchema.safeParse(input)
}

export function validateFavoriteLocation(input) {
  return favoriteLocationSchema.safeParse(input)
}

export function validatePartialFavoriteLocation(input) {
  return favoriteLocationSchema.partial().safeParse(input)
}
