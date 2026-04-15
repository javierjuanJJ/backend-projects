// src/server/app.js
import express from 'express'
import swaggerJsdoc from 'swagger-jsdoc'
import swaggerUi from 'swagger-ui-express'

import { corsMiddleware } from './middlewares/cors.js'
import { errorMiddleware } from './middlewares/error.middleware.js'
import { authRouter } from './routes/auth.routes.js'
import { exercisesRouter } from './routes/exercises.routes.js'
import { workoutsRouter } from './routes/workouts.routes.js'
import { reportsRouter } from './routes/reports.routes.js'

const app = express()

// ── Middlewares globales ─────────────────────────────────────
app.use(corsMiddleware())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// ── OpenAPI / Swagger ────────────────────────────────────────
const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: '3.0.4',
    info: {
      title: 'Workout Tracker API',
      version: '1.0.0',
      description:
        'RESTful API for tracking workouts and progress. Built with Next.js + Express, Prisma ORM and JWT authentication.',
      contact: { name: 'Workout Tracker', url: 'https://github.com/your-org/workout-tracker' },
      license: { name: 'MIT' },
    },
    servers: [
      { url: 'http://localhost:3000', description: 'Development' },
      { url: 'https://your-app.cubepath.io', description: 'Production' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      },
      responses: {
        Unauthorized: {
          description: 'Missing or invalid JWT token',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
        },
        ValidationError: {
          description: 'Input validation failed',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
        },
        NotFound: {
          description: 'Resource not found',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
        },
        Conflict: {
          description: 'Resource already exists',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
        },
      },
      schemas: {
        ErrorResponse: {
          type: 'object',
          properties: {
            error: { type: 'string', example: 'Resource not found' },
            details: { type: 'array', items: { type: 'object' } },
          },
        },
        RegisterDto: {
          type: 'object',
          required: ['username', 'email', 'password'],
          properties: {
            username: { type: 'string', minLength: 3, maxLength: 50, example: 'johndoe' },
            email: { type: 'string', format: 'email', example: 'john@example.com' },
            password: { type: 'string', minLength: 8, example: 'Password123!' },
          },
        },
        LoginDto: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email' },
            password: { type: 'string' },
          },
        },
        AuthResponse: {
          type: 'object',
          properties: {
            token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
            user: {
              type: 'object',
              properties: {
                id: { type: 'string', format: 'uuid' },
                username: { type: 'string' },
                email: { type: 'string' },
                createdAt: { type: 'string', format: 'date-time' },
              },
            },
          },
        },
        Exercise: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string', example: 'Push Ups' },
            description: { type: 'string' },
            category: { type: 'string', example: 'Strength' },
            muscleGroup: { type: 'string', example: 'Chest' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        ExerciseListResponse: {
          type: 'object',
          properties: {
            data: { type: 'array', items: { $ref: '#/components/schemas/Exercise' } },
            total: { type: 'integer' },
            limit: { type: 'integer' },
            offset: { type: 'integer' },
          },
        },
        WorkoutDetailDto: {
          type: 'object',
          required: ['exerciseId', 'sets', 'reps'],
          properties: {
            exerciseId: { type: 'string', format: 'uuid' },
            sets: { type: 'integer', minimum: 1 },
            reps: { type: 'integer', minimum: 0 },
            weightKg: { type: 'number', minimum: 0, example: 60.5 },
            exerciseOrder: { type: 'integer', minimum: 1 },
          },
        },
        CreateWorkoutDto: {
          type: 'object',
          required: ['scheduledDate', 'exercises'],
          properties: {
            name: { type: 'string', maxLength: 100, example: 'Chest Day' },
            scheduledDate: { type: 'string', format: 'date-time', example: '2025-06-20T09:00:00.000Z' },
            notes: { type: 'string', example: 'Focus on form today' },
            isCompleted: { type: 'boolean', default: false },
            exercises: { type: 'array', items: { $ref: '#/components/schemas/WorkoutDetailDto' }, minItems: 1 },
          },
        },
        PatchWorkoutDto: {
          type: 'object',
          properties: {
            name: { type: 'string', maxLength: 100 },
            scheduledDate: { type: 'string', format: 'date-time' },
            notes: { type: 'string' },
            isCompleted: { type: 'boolean' },
            exercises: { type: 'array', items: { $ref: '#/components/schemas/WorkoutDetailDto' } },
          },
        },
        Workout: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            userId: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            scheduledDate: { type: 'string', format: 'date-time' },
            isCompleted: { type: 'boolean' },
            notes: { type: 'string', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
            workoutDetails: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string', format: 'uuid' },
                  sets: { type: 'integer' },
                  reps: { type: 'integer' },
                  weightKg: { type: 'number', nullable: true },
                  exerciseOrder: { type: 'integer', nullable: true },
                  exercise: { $ref: '#/components/schemas/Exercise' },
                },
              },
            },
          },
        },
        WorkoutListResponse: {
          type: 'object',
          properties: {
            data: { type: 'array', items: { $ref: '#/components/schemas/Workout' } },
            total: { type: 'integer' },
            limit: { type: 'integer' },
            offset: { type: 'integer' },
          },
        },
        ReportResponse: {
          type: 'object',
          properties: {
            data: {
              type: 'object',
              properties: {
                summary: {
                  type: 'object',
                  properties: {
                    totalWorkouts: { type: 'integer' },
                    completedWorkouts: { type: 'integer' },
                    pendingWorkouts: { type: 'integer' },
                    completionRate: { type: 'number', example: 83.3 },
                  },
                },
                workoutsByMonth: { type: 'array', items: { type: 'object' } },
                mostUsedExercises: { type: 'array', items: { type: 'object' } },
                recentCompletedWorkouts: { type: 'array', items: { $ref: '#/components/schemas/Workout' } },
              },
            },
          },
        },
      },
    },
    tags: [
      { name: 'Auth', description: 'User registration and login' },
      { name: 'Exercises', description: 'Exercise catalog (read-only)' },
      { name: 'Workouts', description: 'Workout management (requires auth)' },
      { name: 'Reports', description: 'Progress reports (requires auth)' },
    ],
  },
  apis: ['./src/server/controllers/*.js'],
})

app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec))
app.get('/api/docs.json', (req, res) => res.json(swaggerSpec))

// ── Health check ─────────────────────────────────────────────
app.get('/api/health', (req, res) =>
  res.json({ status: 'ok', timestamp: new Date().toISOString(), env: process.env.NODE_ENV })
)

// ── Rutas de la API ──────────────────────────────────────────
app.use('/api/auth', authRouter)
app.use('/api/exercises', exercisesRouter)
app.use('/api/workouts', workoutsRouter)
app.use('/api/reports', reportsRouter)

// ── 404 handler ──────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found` })
})

// ── Error handler centralizado ───────────────────────────────
app.use(errorMiddleware)

export default app
