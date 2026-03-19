// middlewares/auth.js
// HOF para proteger Route Handlers con JWT (equivalente a middleware de Express)

import { NextResponse } from 'next/server'
import { getAuthPayload } from '@/lib/auth'

/**
 * Protege un Route Handler exigiendo un JWT válido en el header Authorization.
 *
 * Uso en route.js:
 *   export const GET = withAuth(async (req, ctx, user) => { ... })
 *
 * @param {Function} handler  — (request, ctx, user) => Promise<Response>
 * @returns {Function}
 */
export function withAuth(handler) {
  return async function (request, ctx) {
    const user = getAuthPayload(request)

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'No autorizado. Proporciona un token Bearer válido.' },
        { status: 401 }
      )
    }

    return handler(request, ctx, user)
  }
}
