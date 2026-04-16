/**
 * @file controllers/products.js
 * @description Handles product listing, detail, and cart management.
 */
import { ProductModel } from '../models/product.js'
import { validateProduct, validatePartialProduct, validateCartItem } from '../schemas/products.js'
import { validatePagination } from '../schemas/images.js'
import { cacheAside, cacheKeys, cache } from '../lib/cache.js'

export class ProductController {
  /**
   * @swagger
   * /api/products:
   *   get:
   *     summary: List all active products
   *     tags: [Products]
   *     parameters:
   *       - in: query
   *         name: page
   *         schema: { type: integer, default: 1 }
   *       - in: query
   *         name: limit
   *         schema: { type: integer, default: 10 }
   *       - in: query
   *         name: categoryId
   *         schema: { type: string, format: uuid }
   *       - in: query
   *         name: search
   *         schema: { type: string }
   *     responses:
   *       200:
   *         description: Paginated product list
   */
  static async list(req, res) {
    const parsed = validatePagination(req.query)
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid query params', details: parsed.error.errors })
    }
    const { page, limit } = parsed.data
    const { categoryId, search } = req.query

    try {
      const key    = search || categoryId
        ? null // don't cache filtered results
        : cacheKeys.productList(page, limit)

      const fetcher = () => ProductModel.findAll({ page, limit, categoryId, search })
      const result  = key ? await cacheAside(key, fetcher) : await fetcher()

      return res.status(200).json(result)
    } catch (err) {
      console.error('List products error:', err)
      return res.status(500).json({ error: 'Could not fetch products' })
    }
  }

  /**
   * @swagger
   * /api/products/{id}:
   *   get:
   *     summary: Get a product by ID
   *     tags: [Products]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema: { type: string, format: uuid }
   *     responses:
   *       200:
   *         description: Product details
   *       404:
   *         description: Product not found
   */
  static async getById(req, res) {
    try {
      const product = await cacheAside(
        cacheKeys.product(req.params.id),
        () => ProductModel.findById(req.params.id),
      )
      if (!product) return res.status(404).json({ error: 'Product not found' })
      return res.status(200).json(product)
    } catch (err) {
      console.error('Get product error:', err)
      return res.status(500).json({ error: 'Could not fetch product' })
    }
  }

  /**
   * @swagger
   * /api/products:
   *   post:
   *     summary: Create a product (admin only)
   *     tags: [Products]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       201:
   *         description: Product created
   */
  static async create(req, res) {
    const result = validateProduct(req.body)
    if (!result.success) {
      return res.status(400).json({ error: 'Validation failed', details: result.error.errors })
    }
    try {
      const existing = await ProductModel.findBySlug(result.data.slug)
      if (existing) return res.status(409).json({ error: 'Slug already in use' })

      const product = await ProductModel.create(result.data)
      return res.status(201).json(product)
    } catch (err) {
      console.error('Create product error:', err)
      return res.status(500).json({ error: 'Could not create product' })
    }
  }

  /**
   * @swagger
   * /api/products/{id}:
   *   patch:
   *     summary: Update a product (admin only)
   *     tags: [Products]
   *     security:
   *       - bearerAuth: []
   */
  static async update(req, res) {
    const result = validatePartialProduct(req.body)
    if (!result.success) {
      return res.status(400).json({ error: 'Validation failed', details: result.error.errors })
    }
    try {
      const existing = await ProductModel.findById(req.params.id)
      if (!existing) return res.status(404).json({ error: 'Product not found' })

      const product = await ProductModel.update(req.params.id, result.data)
      cache.del(cacheKeys.product(req.params.id))
      return res.status(200).json(product)
    } catch (err) {
      console.error('Update product error:', err)
      return res.status(500).json({ error: 'Could not update product' })
    }
  }

  /**
   * @swagger
   * /api/products/{id}:
   *   delete:
   *     summary: Soft-delete a product (admin only)
   *     tags: [Products]
   *     security:
   *       - bearerAuth: []
   */
  static async delete(req, res) {
    try {
      const existing = await ProductModel.findById(req.params.id)
      if (!existing) return res.status(404).json({ error: 'Product not found' })

      await ProductModel.softDelete(req.params.id)
      cache.del(cacheKeys.product(req.params.id))
      return res.status(204).send()
    } catch (err) {
      console.error('Delete product error:', err)
      return res.status(500).json({ error: 'Could not delete product' })
    }
  }

  // ── Cart ────────────────────────────────────────────────────────────────────

  /**
   * @swagger
   * /api/products/cart:
   *   get:
   *     summary: Get current user's cart
   *     tags: [Cart]
   *     security:
   *       - bearerAuth: []
   */
  static async getCart(req, res) {
    try {
      const items = await ProductModel.getCart(req.user.id)
      const total = items.reduce((sum, i) => sum + i.product.priceCents * i.quantity, 0)
      return res.status(200).json({ items, totalCents: total, count: items.length })
    } catch (err) {
      console.error('Get cart error:', err)
      return res.status(500).json({ error: 'Could not fetch cart' })
    }
  }

  /**
   * @swagger
   * /api/products/cart:
   *   post:
   *     summary: Add or update an item in the cart
   *     tags: [Cart]
   *     security:
   *       - bearerAuth: []
   */
  static async upsertCart(req, res) {
    const result = validateCartItem(req.body)
    if (!result.success) {
      return res.status(400).json({ error: 'Validation failed', details: result.error.errors })
    }
    try {
      const product = await ProductModel.findById(result.data.productId)
      if (!product || !product.isActive) return res.status(404).json({ error: 'Product not found' })
      if (product.stock < result.data.quantity) {
        return res.status(400).json({ error: `Insufficient stock. Available: ${product.stock}` })
      }

      const item = await ProductModel.upsertCartItem({ userId: req.user.id, ...result.data })
      return res.status(200).json(item)
    } catch (err) {
      console.error('Upsert cart error:', err)
      return res.status(500).json({ error: 'Could not update cart' })
    }
  }

  /**
   * @swagger
   * /api/products/cart/{productId}:
   *   delete:
   *     summary: Remove an item from the cart
   *     tags: [Cart]
   *     security:
   *       - bearerAuth: []
   */
  static async removeFromCart(req, res) {
    try {
      await ProductModel.removeCartItem({ userId: req.user.id, productId: req.params.productId })
      return res.status(204).send()
    } catch (err) {
      if (err.code === 'P2025') return res.status(404).json({ error: 'Cart item not found' })
      console.error('Remove cart error:', err)
      return res.status(500).json({ error: 'Could not remove cart item' })
    }
  }
}
