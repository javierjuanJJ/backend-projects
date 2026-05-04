// src/schemas/games.js
import { z } from 'zod'

const gameSchema = z.object({
  name: z
    .string({ error: 'name is required' })
    .min(1, 'Name cannot be empty')
    .max(100, 'Name cannot exceed 100 characters'),
  description: z
    .string()
    .max(2000, 'Description cannot exceed 2000 characters')
    .optional(),
})

export const validateGame = (input) => gameSchema.safeParse(input)
export const validatePartialGame = (input) => gameSchema.partial().safeParse(input)
