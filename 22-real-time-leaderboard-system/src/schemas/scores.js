// src/schemas/scores.js
import { z } from 'zod'
import { DEFAULTS } from '../../config.js'

const scoreSchema = z.object({
  game_id: z
    .string({ error: 'game_id is required' })
    .uuid('game_id must be a valid UUID'),
  score_value: z
    .number({ error: 'score_value is required' })
    .int('score_value must be an integer')
    .positive('score_value must be a positive number'),
})

const leaderboardQuerySchema = z.object({
  limit: z
    .string()
    .optional()
    .transform((v) => Math.min(Number(v ?? DEFAULTS.LIMIT_PAGINATION), DEFAULTS.LIMIT_MAX)),
  offset: z
    .string()
    .optional()
    .transform((v) => Number(v ?? DEFAULTS.LIMIT_OFFSET)),
  period: z.enum(['alltime', 'weekly', 'daily']).optional().default('alltime'),
})

export const validateScore = (input) => scoreSchema.safeParse(input)
export const validatePartialScore = (input) => scoreSchema.partial().safeParse(input)
export const validateLeaderboardQuery = (input) => leaderboardQuerySchema.safeParse(input)
