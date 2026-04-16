/**
 * @file schemas/products.js
 * @description Zod validation schemas for product and cart endpoints.
 */
import { z } from 'zod'

export const productSchema = z.object({
  name:        z.string().min(2).max(255),
  slug:        z.string().min(2).max(255).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
  description: z.string().max(5000).optional(),
  priceCents:  z.number().int().positive(),
  currency:    z.enum(['usd', 'eur', 'gbp']).default('usd'),
  stock:       z.number().int().min(0).default(0),
  categoryId:  z.string().uuid().optional(),
  isActive:    z.boolean().default(true),
})

export const cartItemSchema = z.object({
  productId: z.string().uuid(),
  quantity:  z.number().int().positive().max(999),
})

export const validateProduct        = (input) => productSchema.safeParse(input)
export const validatePartialProduct = (input) => productSchema.partial().safeParse(input)
export const validateCartItem       = (input) => cartItemSchema.safeParse(input)
