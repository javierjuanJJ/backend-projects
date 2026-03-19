// routes/posts.js
// Definición de rutas para Posts — espejo del patrón Router de Express
// Estos handlers son importados directamente en los route.js de Next.js App Router.

import { PostController } from '@/controllers/post'
import { applyCors, handlePreflight } from '@/middlewares/cors'

/**
 * Envuelve un handler del PostController añadiendo CORS.
 * @param {Function} handler
 */
function withCors(handler) {
  return async function (request, ctx) {
    // Preflight OPTIONS
    const preflight = handlePreflight(request)
    if (preflight) return preflight

    // Ejecutar handler y añadir headers CORS a la respuesta
    const response = await handler(request, ctx)
    return applyCors(request, response) ?? response
  }
}

// ── Rutas colección: GET /api/posts  |  POST /api/posts ────────
export const GET_posts   = withCors(PostController.getAll)
export const POST_posts  = withCors(PostController.create)

// ── Rutas por ID ───────────────────────────────────────────────
export const GET_post    = withCors(PostController.getById)
export const PUT_post    = withCors(PostController.update)
export const PATCH_post  = withCors(PostController.partialUpdate)
export const DELETE_post = withCors(PostController.delete)
