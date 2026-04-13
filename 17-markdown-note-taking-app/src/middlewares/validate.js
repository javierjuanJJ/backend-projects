// src/middlewares/validate.js
import {
  validateNote,
  validatePartialNote,
  validateQuery,
} from '../schemas/notes.js'

// ─── Helper para formatear errores Zod ───────────────────────────────────
const formatErrors = (zodErrors) =>
  zodErrors.map(e => ({
    field:   e.path.join('.') || 'root',
    message: e.message,
  }))

// ─── POST /notes — creación (JSON body o archivo subido) ──────────────────
export const validateCreateNote = (req, res, next) => {
  // Si multer procesó un archivo, inyectamos su contenido en el input
  const input = req.file
    ? { ...req.body, content: req.file.buffer?.toString('utf-8') ?? '' }
    : req.body

  const result = validateNote(input)

  if (!result.success) {
    return res.status(400).json({
      error:   'Datos de entrada inválidos',
      details: formatErrors(result.error.errors),
    })
  }

  // Sobreescribimos req.body con los datos ya validados y transformados por Zod
  req.body = result.data
  next()
}

// ─── PUT /notes/:id — reemplazo completo ─────────────────────────────────
export const validateUpdateNote = (req, res, next) => {
  const result = validateNote(req.body)

  if (!result.success) {
    return res.status(400).json({
      error:   'Datos de entrada inválidos',
      details: formatErrors(result.error.errors),
    })
  }

  req.body = result.data
  next()
}

// ─── PATCH /notes/:id — actualización parcial ────────────────────────────
export const validatePatchNote = (req, res, next) => {
  const result = validatePartialNote(req.body)

  if (!result.success) {
    return res.status(400).json({
      error:   'Datos de entrada inválidos',
      details: formatErrors(result.error.errors),
    })
  }

  req.body = result.data
  next()
}

// ─── GET /notes — validación de query params ─────────────────────────────
export const validateQueryParams = (req, res, next) => {
  const result = validateQuery(req.query)

  if (!result.success) {
    return res.status(400).json({
      error:   'Parámetros de consulta inválidos',
      details: formatErrors(result.error.errors),
    })
  }

  // req.query con los valores ya casteados (limit/offset como números, defaults aplicados)
  req.query = result.data
  next()
}
