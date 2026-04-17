import { z } from 'zod'

const todoSchema = z.object({
  title: z
    .string({ required_error: 'El título es obligatorio' })
    .min(3,   'Mínimo 3 caracteres')
    .max(100, 'Máximo 100 caracteres')
    .trim(),
  description: z.string().trim().optional().default(''),
})

export const validateTodo        = input => todoSchema.safeParse(input)
export const validatePartialTodo = input => todoSchema.partial().safeParse(input)
