// src/schemas/showtime.schema.js

import * as z from 'zod'

const showtimeSchema = z.object({
  movieId: z.string().min(1, 'movieId is required'),
  roomId: z.string().min(1, 'roomId is required'),
  startTime: z
    .string()
    .datetime({ message: 'startTime must be a valid ISO 8601 datetime' })
    .refine(
      (val) => new Date(val) > new Date(),
      'startTime must be in the future'
    ),
  price: z
    .number({ error: 'Price is required' })
    .positive('Price must be positive')
    .multipleOf(0.01, 'Price can have at most 2 decimal places'),
})

export const validateShowtime = (input) => showtimeSchema.safeParse(input)
export const validatePartialShowtime = (input) => showtimeSchema.partial().safeParse(input)
