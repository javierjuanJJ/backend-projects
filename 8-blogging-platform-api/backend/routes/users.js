// routes/users.js
// Definición de rutas para Users y Auth

import { UserController } from '@/controllers/user'
import { applyCors, handlePreflight } from '@/middlewares/cors'

/**
 * Envuelve un handler añadiendo CORS.
 * @param {Function} handler
 */
function withCors(handler) {
  return async function (request, ctx) {
    const preflight = handlePreflight(request)
    if (preflight) return preflight

    const response = await handler(request, ctx)
    return applyCors(request, response) ?? response
  }
}

// ── Auth ───────────────────────────────────────────────────────
export const POST_register = withCors(UserController.register)
export const POST_login    = withCors(UserController.login)
export const POST_logout   = withCors(UserController.logout)
export const GET_me        = withCors(UserController.getMe)
export const PUT_me        = withCors(UserController.updateMe)

// ── Users CRUD ─────────────────────────────────────────────────
export const GET_users     = withCors(UserController.getAll)
export const GET_user      = withCors(UserController.getById)
export const DELETE_user   = withCors(UserController.delete)
