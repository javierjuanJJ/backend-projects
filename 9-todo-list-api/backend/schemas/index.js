// src/schemas/index.js
// Validaciones Zod para Users y Tasks

import { z } from 'zod'

// ─────────────────────────────────────────────
// USER SCHEMAS
// ─────────────────────────────────────────────

const userSchema = z.object({
  name: z
    .string({ error: 'El nombre es obligatorio' })
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(80, 'El nombre no puede exceder 80 caracteres')
    .trim(),

  email: z
    .string({ error: 'El email es obligatorio' })
    .email('El email no tiene un formato válido')
    .toLowerCase(),

  password: z
    .string({ error: 'La contraseña es obligatoria' })
    .min(6, 'La contraseña debe tener al menos 6 caracteres')
    .max(100, 'La contraseña no puede exceder 100 caracteres'),
})

const loginSchema = z.object({
  email: z
    .string({ error: 'El email es obligatorio' })
    .email('El email no tiene un formato válido')
    .toLowerCase(),

  password: z
    .string({ error: 'La contraseña es obligatoria' })
    .min(1, 'La contraseña es obligatoria'),
})

export const validateUser        = (input) => userSchema.safeParse(input)
export const validatePartialUser = (input) => userSchema.partial().safeParse(input)
export const validateLogin       = (input) => loginSchema.safeParse(input)

// ─────────────────────────────────────────────
// TASK SCHEMAS
// ─────────────────────────────────────────────

const taskSchema = z.object({
  title: z
    .string({ error: 'El título es obligatorio' })
    .min(3, 'El título debe tener al menos 3 caracteres')
    .max(120, 'El título no puede exceder 120 caracteres')
    .trim(),

  description: z
    .string({ error: 'La descripción es obligatoria' })
    .min(5, 'La descripción debe tener al menos 5 caracteres')
    .trim(),
})

export const validateTask        = (input) => taskSchema.safeParse(input)
export const validatePartialTask = (input) => taskSchema.partial().safeParse(input)
