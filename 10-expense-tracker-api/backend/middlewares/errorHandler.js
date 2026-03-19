/**
 * Middleware global de errores.
 * Debe registrarse DESPUÉS de todas las rutas en app.js  →  app.use(errorHandler)
 * Express lo reconoce por la firma de 4 argumentos (err, req, res, next).
 */
export function errorHandler(err, req, res, next) {
  console.error(`[ERROR] ${req.method} ${req.path} →`, err.message ?? err)

  // ── CORS ──────────────────────────────────────────────────────────────────
  if (err.message?.startsWith('CORS:')) {
    return res.status(403).json({ error: err.message })
  }

  // ── Prisma: registro no encontrado (P2025) ────────────────────────────────
  if (err.code === 'P2025') {
    return res.status(404).json({ error: 'Registro no encontrado' })
  }

  // ── Prisma: violación de unicidad (P2002) — ej. email duplicado ───────────
  if (err.code === 'P2002') {
    const field = err.meta?.target?.join(', ') ?? 'campo'
    return res.status(409).json({ error: `Ya existe un registro con ese ${field}` })
  }

  // ── Prisma: FK no existente (P2003) ───────────────────────────────────────
  if (err.code === 'P2003') {
    return res.status(400).json({ error: 'Referencia a un registro que no existe' })
  }

  // ── JSON malformado en el body ─────────────────────────────────────────────
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'El body no es un JSON válido' })
  }

  // ── Fallback genérico ──────────────────────────────────────────────────────
  const status  = err.status ?? err.statusCode ?? 500
  const message = process.env.NODE_ENV === 'production'
    ? 'Error interno del servidor'
    : err.message

  return res.status(status).json({ error: message })
}

/**
 * Middleware 404 — responde a rutas no registradas.
 * Registrar justo ANTES del errorHandler.
 */
export function notFoundHandler(req, res) {
  res.status(404).json({ error: `Ruta no encontrada: ${req.method} ${req.path}` })
}
