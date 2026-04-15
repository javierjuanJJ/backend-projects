import { z } from 'zod'

const shortUrlSchema = z.object({
  url: z
    .string({
      required_error: 'La URL es obligatoria',
      invalid_type_error: 'La URL debe ser un string',
    })
    .url({ message: 'Debe ser una URL válida (ej: https://example.com)' })
    .min(1, 'La URL no puede estar vacía'),
})

const updateShortUrlSchema = z.object({
  url: z
    .string({
      required_error: 'La URL es obligatoria',
      invalid_type_error: 'La URL debe ser un string',
    })
    .url({ message: 'Debe ser una URL válida (ej: https://example.com)' })
    .min(1, 'La URL no puede estar vacía'),
})

export function validateShortUrl(input) {
  return shortUrlSchema.safeParse(input)
}

export function validateUpdateShortUrl(input) {
  return updateShortUrlSchema.safeParse(input)
}
