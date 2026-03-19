// src/routes/users.js
// Igual que el patrón de referencia: Router + middleware de validación + controller

import { Router } from 'express'
import { UserController } from '../controllers/user.js'
import { validate, validatePartial, requireAuth } from '../middlewares/index.js'
import { validateUser, validatePartialUser, validateLogin } from '../schemas/index.js'

export const usersRouter = Router()

// Middleware de validación completa (registro)
const validateCreate = validate(validateUser)

// Middleware de validación parcial (PATCH)
const validateUpdate = validatePartial(validatePartialUser)

// Middleware de validación de login
const validateLoginBody = validate(validateLogin)

// ─────────────────────────────────────────────
// Rutas públicas (sin autenticación)
// ─────────────────────────────────────────────
usersRouter.post('/login', validateLoginBody, UserController.login)
usersRouter.post('/',      validateCreate,    UserController.create)
usersRouter.get('/',                          UserController.getAll)
usersRouter.get('/:id',                       UserController.getId)

// ─────────────────────────────────────────────
// Rutas protegidas (requieren JWT)
// ─────────────────────────────────────────────
usersRouter.put('/:id',    requireAuth, validate(validateUser),      UserController.update)
usersRouter.patch('/:id',  requireAuth, validateUpdate,              UserController.partialUpdate)
usersRouter.delete('/:id', requireAuth,                              UserController.delete)
