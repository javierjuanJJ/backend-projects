// lib/response.js
// Helpers para respuestas API consistentes

import { NextResponse } from 'next/server'

/**
 * Respuesta exitosa
 */
export function ok(data, status = 200) {
  return NextResponse.json({ success: true, data }, { status })
}

/**
 * Respuesta de creación exitosa
 */
export function created(data) {
  return NextResponse.json({ success: true, data }, { status: 201 })
}

/**
 * Respuesta de error
 */
export function error(message, status = 400, details = null) {
  return NextResponse.json(
    { success: false, error: message, ...(details && { details }) },
    { status }
  )
}

/**
 * 404 Not Found
 */
export function notFound(resource = 'Recurso') {
  return NextResponse.json(
    { success: false, error: `${resource} no encontrado` },
    { status: 404 }
  )
}

/**
 * 401 Unauthorized
 */
export function unauthorized(message = 'No autorizado') {
  return NextResponse.json({ success: false, error: message }, { status: 401 })
}
