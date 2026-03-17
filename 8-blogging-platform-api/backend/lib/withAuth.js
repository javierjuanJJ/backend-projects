// lib/withAuth.js
// HOF que protege un Route Handler de Next.js con JWT

import { NextResponse } from 'next/server'
import { getAuthPayload } from './auth'

/**
 * Envuelve un handler de API y exige un JWT válido.
 *
 * Uso:
 *   export const GET = withAuth(async (req, ctx, user) => { ... })
 *
 * @param {(req: Request, ctx: any, user: {id, username}) => Promise<Response>} handler
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
