/**
 * @file middlewares/upload.js
 * @description Multer file upload middleware.
 * Validates MIME type, enforces max file size, and generates unique filenames.
 */
import multer from 'multer'
import path from 'path'
import { randomUUID } from 'crypto'
import { mkdirSync } from 'fs'
import { ALLOWED_MIME_TYPES, DEFAULTS } from '../config.js'

const UPLOAD_DIR = process.env.UPLOAD_DIR ?? DEFAULTS.UPLOAD_DIR

// Ensure upload directory exists
mkdirSync(UPLOAD_DIR, { recursive: true })

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase()
    const uniqueName = `${randomUUID()}${ext}`
    cb(null, uniqueName)
  },
})

const fileFilter = (_req, file, cb) => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(
      Object.assign(new Error(`Unsupported file type: ${file.mimetype}`), { status: 400 }),
      false,
    )
  }
}

const MAX_FILE_SIZE_BYTES =
  parseInt(process.env.MAX_FILE_SIZE_MB ?? DEFAULTS.MAX_FILE_SIZE_MB, 10) * 1024 * 1024

export const uploadMiddleware = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE_BYTES },
}).single('image')

/**
 * Wraps uploadMiddleware to return a proper JSON error on multer failures.
 */
export const handleUpload = (req, res, next) => {
  uploadMiddleware(req, res, (err) => {
    if (!err) return next()

    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        error: `File too large. Maximum allowed size is ${process.env.MAX_FILE_SIZE_MB ?? DEFAULTS.MAX_FILE_SIZE_MB} MB`,
      })
    }
    return res.status(err.status ?? 400).json({ error: err.message })
  })
}
