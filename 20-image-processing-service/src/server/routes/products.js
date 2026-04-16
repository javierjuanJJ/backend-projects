/**
 * @file routes/products.js
 * @description Product catalogue and shopping cart routes.
 */
import { Router } from 'express'
import { ProductController } from '../controllers/products.js'
import { authMiddleware, adminOnly } from '../middlewares/auth.js'
import { apiRateLimiter } from '../middlewares/rateLimiter.js'

export const productsRouter = Router()

productsRouter.use(apiRateLimiter)

// ── Public product endpoints ─────────────────────────────────────────────────
productsRouter.get('/',    ProductController.list)
productsRouter.get('/:id', ProductController.getById)

// ── Admin-only product management ────────────────────────────────────────────
productsRouter.post('/',    authMiddleware, adminOnly, ProductController.create)
productsRouter.patch('/:id', authMiddleware, adminOnly, ProductController.update)
productsRouter.delete('/:id', authMiddleware, adminOnly, ProductController.delete)

// ── Cart (authenticated users) ───────────────────────────────────────────────
productsRouter.get('/cart',               authMiddleware, ProductController.getCart)
productsRouter.post('/cart',              authMiddleware, ProductController.upsertCart)
productsRouter.delete('/cart/:productId', authMiddleware, ProductController.removeFromCart)
