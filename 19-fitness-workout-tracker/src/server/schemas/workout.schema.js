// src/server/schemas/workout.schema.js
import { z } from 'zod'

const workoutDetailSchema = z.object({
  exerciseId: z.string().uuid('exerciseId must be a valid UUID'),
  sets: z.number({ error: 'sets must be a number' }).int().positive('sets must be a positive integer'),
  reps: z.number({ error: 'reps must be a number' }).int().min(0, 'reps cannot be negative'),
  weightKg: z.number().min(0, 'weightKg cannot be negative').optional(),
  exerciseOrder: z.number().int().positive().optional(),
})

const workoutSchema = z.object({
  name: z
    .string()
    .min(1, 'Workout name cannot be empty')
    .max(100, 'Workout name cannot exceed 100 characters')
    .optional(),
  scheduledDate: z
    .string({ error: 'scheduledDate is required' })
    .datetime({ message: 'scheduledDate must be a valid ISO 8601 datetime' }),
  notes: z.string().max(2000, 'Notes cannot exceed 2000 characters').optional(),
  isCompleted: z.boolean().optional(),
  exercises: z
    .array(workoutDetailSchema)
    .min(1, 'At least one exercise is required')
    .max(50, 'Cannot add more than 50 exercises per workout'),
})

const partialWorkoutSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  scheduledDate: z.string().datetime().optional(),
  notes: z.string().max(2000).optional(),
  isCompleted: z.boolean().optional(),
  exercises: z.array(workoutDetailSchema).min(1).max(50).optional(),
})

export const validateWorkout = (input) => workoutSchema.safeParse(input)
export const validatePartialWorkout = (input) => partialWorkoutSchema.safeParse(input)
