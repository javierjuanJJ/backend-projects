/**
 * @file schemas/auth.js
 * @description Zod validation schemas for authentication endpoints.
 */
import { z } from 'zod'

const authSchema = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .email('Must be a valid email address')
    .toLowerCase(),
  password: z
    .string({ required_error: 'Password is required' })
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must not exceed 128 characters'),
})

export const registerSchema = authSchema.extend({
  password: z
    .string({ required_error: 'Password is required' })
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must not exceed 128 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
})

export const loginSchema = authSchema

export const validateRegister = (input) => registerSchema.safeParse(input)
export const validateLogin    = (input) => loginSchema.safeParse(input)
