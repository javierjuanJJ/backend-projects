// src/routes/tasks.js

import { Router } from 'express'
import { TaskController } from '../controllers/task.js'
import { validate, validatePartial, requireAuth } from '../middlewares/index.js'
import { validateTask, validatePartialTask } from '../schemas/index.js'

export const tasksRouter = Router()

const validateCreate = validate(validateTask)
const validateUpdate = validatePartial(validatePartialTask)

// ─────────────────────────────────────────────
// Rutas públicas
// GET /tasks              → todas
// GET /tasks?id=5         → filtro por ID exacto
// GET /tasks?search=texto → busca en title y description
// GET /tasks?title=texto  → busca solo en title
// GET /tasks?userId=2     → filtra por usuario
// GET /tasks/:id          → detalle de una task
// ─────────────────────────────────────────────
tasksRouter.get('/',    TaskController.getAll)
tasksRouter.get('/:id', TaskController.getId)

// ─────────────────────────────────────────────
// Rutas protegidas (requieren JWT)
// ─────────────────────────────────────────────
tasksRouter.post('/',     requireAuth, validateCreate, TaskController.create)
tasksRouter.put('/:id',   requireAuth, validate(validateTask), TaskController.update)
tasksRouter.patch('/:id', requireAuth, validateUpdate,         TaskController.partialUpdate)
tasksRouter.delete('/:id',requireAuth,                         TaskController.delete)
