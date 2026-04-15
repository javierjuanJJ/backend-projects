# nextjs-express-workout.instructions.md
# Instrucciones específicas para el stack Next.js + Express de Workout Tracker

## Stack y versiones

- Next.js 14 (App Router)
- Express 4.x como middleware/servidor standalone
- Prisma 5.x
- PostgreSQL 16
- jsonwebtoken 9.x
- Zod 3.x
- Vitest 1.x
- pnpm 9.x

## Arquitectura de la API

Next.js actúa como entry point de las rutas (App Router `route.js`), pero toda la lógica de negocio vive en el servidor Express (`src/server/`). El patrón es:

```
Next.js route handler
  └── Express app (como handler)
        ├── CORS middleware
        ├── Auth middleware (JWT)
        ├── Zod validation middleware
        ├── Controller (lógica HTTP)
        └── Model (queries Prisma)
```

## Convenciones de archivos

- Todos los archivos: `.js` (no `.ts`, no `.mjs`)
- Importaciones: ES modules (`import`/`export`)
- Nombrado: camelCase para archivos de código, kebab-case para configuración

## Patrón de Controller

```js
// src/server/controllers/workouts.controller.js
export class WorkoutController {
  static async getAll(req, res) {
    try {
      const { limit = 10, offset = 0, completed } = req.query
      const workouts = await WorkoutModel.getAll({
        userId: req.user.id,
        limit: Number(limit),
        offset: Number(offset),
        completed: completed === 'true' ? true : completed === 'false' ? false : undefined
      })
      return res.json({ data: workouts, total: workouts.length, limit: Number(limit), offset: Number(offset) })
    } catch (error) {
      console.error('[WorkoutController.getAll]', error)
      return res.status(500).json({ error: 'Internal server error' })
    }
  }
}
```

## Patrón de Model con Prisma

```js
// src/server/models/workout.model.js
import { prisma } from '../../lib/prisma.js'

export class WorkoutModel {
  static async getAll({ userId, limit = 10, offset = 0, completed }) {
    const where = { userId }
    if (completed !== undefined) where.isCompleted = completed

    return prisma.workout.findMany({
      where,
      include: {
        workoutDetails: {
          include: { exercise: true },
          orderBy: { exerciseOrder: 'asc' }
        }
      },
      orderBy: { scheduledDate: 'asc' },
      take: limit,
      skip: offset
    })
  }

  static async getById({ id, userId }) {
    return prisma.workout.findFirst({
      where: { id, userId },
      include: { workoutDetails: { include: { exercise: true } } }
    })
  }
}
```

## Patrón de Route con validación

```js
// src/server/routes/workouts.routes.js
import { Router } from 'express'
import { WorkoutController } from '../controllers/workouts.controller.js'
import { authMiddleware } from '../middlewares/auth.middleware.js'
import { validateWorkout, validatePartialWorkout } from '../schemas/workout.schema.js'

export const workoutsRouter = Router()

const validateCreate = (req, res, next) => {
  const result = validateWorkout(req.body)
  if (!result.success) {
    return res.status(400).json({ error: 'Validation failed', details: result.error.errors })
  }
  req.body = result.data
  next()
}

const validateUpdate = (req, res, next) => {
  const result = validatePartialWorkout(req.body)
  if (!result.success) {
    return res.status(400).json({ error: 'Validation failed', details: result.error.errors })
  }
  req.body = result.data
  next()
}

workoutsRouter.use(authMiddleware) // Todas las rutas requieren auth

workoutsRouter.get('/', WorkoutController.getAll)
workoutsRouter.post('/', validateCreate, WorkoutController.create)
workoutsRouter.get('/:id', WorkoutController.getById)
workoutsRouter.put('/:id', validateCreate, WorkoutController.update)
workoutsRouter.patch('/:id', validateUpdate, WorkoutController.partialUpdate)
workoutsRouter.delete('/:id', WorkoutController.delete)
```

## Singleton de Prisma Client

```js
// src/lib/prisma.js
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error']
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

## CORS middleware

```js
// src/server/middlewares/cors.js
import cors from 'cors'

const getAllowedOrigins = () => {
  const origins = process.env.CORS_ORIGINS ?? 'http://localhost:3000'
  return origins.split(',').map(o => o.trim())
}

export const corsMiddleware = () => cors({
  origin: (origin, callback) => {
    const allowed = getAllowedOrigins()
    if (!origin || allowed.includes(origin)) return callback(null, true)
    return callback(new Error(`Origin ${origin} not allowed by CORS`))
  },
  credentials: true
})
```

## Generación de reportes

El endpoint `/api/reports` debe retornar:

```json
{
  "data": {
    "totalWorkouts": 42,
    "completedWorkouts": 35,
    "completionRate": 83.3,
    "workoutsByMonth": [...],
    "mostUsedExercises": [...],
    "progressByExercise": [...]
  }
}
```

Utiliza agregaciones de Prisma (`groupBy`, `_count`, `_avg`) para eficiencia.
