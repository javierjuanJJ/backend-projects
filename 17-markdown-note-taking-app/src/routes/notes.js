// src/routes/notes.js
import { Router } from 'express'
import { NoteController }     from '../controllers/notes.js'
import { uploadMiddleware }   from '../middlewares/upload.js'
import {
  validateCreateNote,
  validateUpdateNote,
  validatePatchNote,
  validateQueryParams,
} from '../middlewares/validate.js'

export const notesRouter = Router()

// ─── Wrapper para capturar errores de multer antes de Zod ─────────────────
const withUpload = (req, res, next) => {
  uploadMiddleware(req, res, (err) => {
    if (err) {
      const status = err.code === 'LIMIT_FILE_SIZE' ? 413 : (err.status ?? 400)
      const msg    = err.code === 'LIMIT_FILE_SIZE'
        ? `El archivo supera el tamaño máximo permitido`
        : err.message
      return res.status(status).json({ error: msg })
    }
    next()
  })
}

// ─────────────────────────────────────────────────────────────────────────
//  RUTAS
// ─────────────────────────────────────────────────────────────────────────

// Comprobar gramática de un texto libre SIN guardar (debe ir antes de /:id)
notesRouter.post('/check', NoteController.checkGrammarRaw)

// Listado
notesRouter.get('/', validateQueryParams, NoteController.getAll)

// Creación — acepta JSON body  o  multipart/form-data con campo "file"
notesRouter.post('/', withUpload, validateCreateNote, NoteController.create)

// CRUD individual
notesRouter.get('/:id',    NoteController.getById)
notesRouter.put('/:id',    validateUpdateNote, NoteController.update)
notesRouter.patch('/:id',  validatePatchNote,  NoteController.partialUpdate)
notesRouter.delete('/:id', NoteController.delete)

// Acciones específicas por nota
notesRouter.get('/:id/render', NoteController.render)       // → HTML renderizado
notesRouter.post('/:id/check', NoteController.checkGrammar) // → análisis de gramática
