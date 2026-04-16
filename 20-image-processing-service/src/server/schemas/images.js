/**
 * @file schemas/images.js
 * @description Zod validation schemas for image management endpoints.
 */
import { z } from 'zod'

// ── Shared sub-schemas ───────────────────────────────────────────────────────
const resizeSchema = z.object({
  width:  z.number({ required_error: 'width is required' }).int().positive().max(10000),
  height: z.number({ required_error: 'height is required' }).int().positive().max(10000),
})

const cropSchema = z.object({
  width:  z.number().int().positive(),
  height: z.number().int().positive(),
  x:      z.number().int().min(0),
  y:      z.number().int().min(0),
})

const filtersSchema = z.object({
  grayscale: z.boolean().optional(),
  sepia:     z.boolean().optional(),
})

const watermarkSchema = z.object({
  text:    z.string().min(1).max(100),
  opacity: z.number().min(0).max(1).optional().default(0.5),
})

// ── Main transform schema ────────────────────────────────────────────────────
export const transformSchema = z.object({
  transformations: z.object({
    resize:    resizeSchema.optional(),
    crop:      cropSchema.optional(),
    rotate:    z.number().min(0).max(360).optional(),
    flip:      z.boolean().optional(),
    mirror:    z.boolean().optional(),
    compress:  z.number().int().min(1).max(100).optional(),
    format:    z.enum(['jpeg', 'png', 'webp', 'avif', 'tiff']).optional(),
    filters:   filtersSchema.optional(),
    watermark: watermarkSchema.optional(),
  }).refine(
    (data) => Object.keys(data).length > 0,
    { message: 'At least one transformation must be specified' }
  ),
})

// ── Pagination query schema ───────────────────────────────────────────────────
export const paginationSchema = z.object({
  page:  z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
})

export const validateTransform   = (input) => transformSchema.safeParse(input)
export const validatePagination  = (input) => paginationSchema.safeParse(input)
