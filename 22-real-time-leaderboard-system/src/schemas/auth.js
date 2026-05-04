// src/schemas/auth.js
import { z } from 'zod'

const registerSchema = z.object({
  username: z
    .string({ error: 'username is required' })
    .min(3, 'Username must be at least 3 characters')
    .max(50, 'Username cannot exceed 50 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers and underscores'),
  email: z
    .string({ error: 'email is required' })
    .email('Must be a valid email address')
    .max(255),
  password: z
    .string({ error: 'password is required' })
    .min(8, 'Password must be at least 8 characters')
    .max(72, 'Password cannot exceed 72 characters'),
})

const loginSchema = z.object({
  email: z.string({ error: 'email is required' }).email('Must be a valid email'),
  password: z.string({ error: 'password is required' }).min(1, 'Password is required'),
})

export const validateRegister = (input) => registerSchema.safeParse(input)
export const validateLogin = (input) => loginSchema.safeParse(input)
