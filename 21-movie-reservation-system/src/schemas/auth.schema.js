// src/schemas/auth.schema.js

import * as z from 'zod'

const registerSchema = z.object({
  username: z
    .string({ error: 'Username is required' })
    .min(3, 'Username must be at least 3 characters')
    .max(50, 'Username must not exceed 50 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers and underscores'),
  email: z
    .string({ error: 'Email is required' })
    .email('Invalid email format')
    .max(100, 'Email must not exceed 100 characters'),
  password: z
    .string({ error: 'Password is required' })
    .min(8, 'Password must be at least 8 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one lowercase, one uppercase and one number'
    ),
})

const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
})

const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
})

export const validateRegister = (input) => registerSchema.safeParse(input)
export const validateLogin = (input) => loginSchema.safeParse(input)
export const validateRefresh = (input) => refreshSchema.safeParse(input)
