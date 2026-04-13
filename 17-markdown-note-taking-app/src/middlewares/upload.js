// src/middlewares/upload.js
import multer from 'multer'
import { DEFAULTS } from '../config/index.js'

const ALLOWED_MIMETYPES = [
  'text/plain',
  'text/markdown',
  'application/octet-stream',
]

const MAX_SIZE_BYTES = DEFAULTS.MAX_FILE_SIZE_MB * 1024 * 1024

// Usamos memoryStorage: el contenido llega como Buffer en req.file.buffer
// No se escribe nada en disco
const storage = multer.memoryStorage()

const fileFilter = (_req, file, cb) => {
  const isMarkdownExt = /\.(md|markdown|txt)$/i.test(file.originalname)
  const isMimeAllowed = ALLOWED_MIMETYPES.includes(file.mimetype)

  if (isMarkdownExt || isMimeAllowed) {
    return cb(null, true)
  }

  return cb(
    Object.assign(
      new Error('Solo se permiten archivos .md, .markdown o .txt'),
      { status: 400 }
    )
  )
}

export const uploadMiddleware = multer({
  storage,
  limits: { fileSize: MAX_SIZE_BYTES },
  fileFilter,
}).single('file') // El campo del formulario multipart debe llamarse "file"
