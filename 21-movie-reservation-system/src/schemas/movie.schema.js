// src/schemas/movie.schema.js

import * as z from 'zod'

const movieSchema = z.object({
  title: z
    .string({ error: 'Title is required' })
    .min(1, 'Title cannot be empty')
    .max(150, 'Title must not exceed 150 characters'),
  description: z.string().max(5000).optional(),
  posterUrl: z.string().url('posterUrl must be a valid URL').optional().or(z.literal('')),
  durationMinutes: z
    .number({ error: 'Duration must be a number' })
    .int('Duration must be an integer')
    .positive('Duration must be positive')
    .max(600, 'Duration cannot exceed 600 minutes')
    .optional(),
  genreId: z
    .string({ error: 'genreId is required' })
    .min(1, 'genreId cannot be empty'),
})

export const validateMovie = (input) => movieSchema.safeParse(input)
export const validatePartialMovie = (input) => movieSchema.partial().safeParse(input)
