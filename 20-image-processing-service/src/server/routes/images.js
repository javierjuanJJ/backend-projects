/**
 * @file routes/images.js
 * @description Image management routes.
 * All routes require JWT authentication.
 */
import { Router } from 'express'
import { ImageController } from '../controllers/images.js'
import { authMiddleware } from '../middlewares/auth.js'
import { handleUpload } from '../middlewares/upload.js'
import { transformRateLimiter } from '../middlewares/rateLimiter.js'

export const imagesRouter = Router()

// All image routes require auth
imagesRouter.use(authMiddleware)

imagesRouter.post('/',                    handleUpload, ImageController.upload)
imagesRouter.get('/',                                   ImageController.list)
imagesRouter.get('/:id',                                ImageController.getById)
imagesRouter.post('/:id/transform',       transformRateLimiter, ImageController.transform)
imagesRouter.delete('/:id',               ImageController.delete)
