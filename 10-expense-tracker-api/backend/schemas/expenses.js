import { z } from 'zod'

// ─── Schema base ──────────────────────────────────────────────────────────────

const expenseSchema = z.object({
  title: z
    .string({ error: 'El título es obligatorio' })
    .min(1,   'El título no puede estar vacío')
    .max(150,  'El título no puede superar 150 caracteres')
    .trim(),

  description: z
    .string({ error: 'La descripción es obligatoria' })
    .min(1,   'La descripción no puede estar vacía')
    .max(500,  'La descripción no puede superar 500 caracteres')
    .trim(),

  amount: z
    .number({
      error: 'El monto es obligatorio y debe ser un número',
    })
    .positive('El monto debe ser mayor que 0')
    .finite('El monto no puede ser infinito'),
})

// ─── Exportados ───────────────────────────────────────────────────────────────

export function validateExpense(input) {
  return expenseSchema.safeParse(input)
}

export function validatePartialExpense(input) {
  return expenseSchema.partial().safeParse(input)
}
