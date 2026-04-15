// src/server/schemas/auth.schema.js
import { z } from 'zod'

const registerSchema = z.object({
  username: z
    .string({ error: 'Username is required' })
    .min(3, 'Username must be at least 3 characters')
    .max(50, 'Username cannot exceed 50 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers and underscores'),
  email: z
    .string({ error: 'Email is required' })
    .email('Invalid email address')
    .max(100, 'Email cannot exceed 100 characters'),
  password: z
    .string({ error: 'Password is required' })
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password cannot exceed 100 characters'),
})

const loginSchema = z.object({
  email: z.string({ error: 'Email is required' }).email('Invalid email address'),
  password: z.string({ error: 'Password is required' }).min(1, 'Password is required'),
})

export const validateRegister = (input) => registerSchema.safeParse(input)
export const validateLogin = (input) => loginSchema.safeParse(input)
