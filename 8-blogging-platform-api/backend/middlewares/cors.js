// middlewares/cors.js
// Middleware CORS para Next.js App Router (equivalente al corsMiddleware de Express)

import { NextResponse } from 'next/server'
import { CORS_ACCEPTED_ORIGINS } from '@/config'

/**
 * Aplica cabeceras CORS a una respuesta.
 * Si el Origin no está permitido, devuelve 403.
 *
 * @param {Request} request
 * @param {Response | NextResponse} response  — respuesta a decorar
 * @param {string[]} acceptedOrigins
 * @returns {NextResponse | null}  null = origen permitido, response decorada con CORS headers
 */
export function applyCors(
  request,
  response,
  acceptedOrigins = CORS_ACCEPTED_ORIGINS
) {
  const origin = request.headers.get('origin')

  // Sin origin (same-origin / herramientas como curl) → siempre permitido
  const isAllowed = !origin || acceptedOrigins.includes(origin)

  if (!isAllowed) {
    return NextResponse.json(
      { success: false, error: `Origen no permitido: ${origin}` },
      { status: 403 }
    )
  }

  if (origin) {
    response.headers.set('Access-Control-Allow-Origin', origin)
  }
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS')
  response.headers.set(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization'
  )
  response.headers.set('Access-Control-Max-Age', '86400') // 24h preflight cache

  return response
}

/**
 * Maneja la solicitud OPTIONS (preflight CORS).
 * Úsalo al inicio de cualquier route handler.
 *
 * @param {Request} request
 * @param {string[]} acceptedOrigins
 * @returns {NextResponse | null}  NextResponse si es preflight, null si no lo es
 */
export function handlePreflight(request, acceptedOrigins = CORS_ACCEPTED_ORIGINS) {
  if (request.method !== 'OPTIONS') return null

  const origin = request.headers.get('origin')
  const isAllowed = !origin || acceptedOrigins.includes(origin)

  if (!isAllowed) {
    return new NextResponse(null, { status: 403 })
  }

  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': origin ?? '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  })
}
