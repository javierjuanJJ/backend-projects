import * as z from 'zod'

const expensesSchema = z.object({
  description: z
    .string({
      error: 'La descripción es obligatorio',
    })
    .min(3, 'La descripción debe tener al menos 3 caracteres')
    .max(100, 'La descripción no puede exceder los 100 caracteres'),
  categories: array(z.string()),
})

export function validateJob (input) {
  return expensesSchema.safeParse(input)
}

export function validatePartialJob (input) {
  return expensesSchema.partial().safeParse(input)
}