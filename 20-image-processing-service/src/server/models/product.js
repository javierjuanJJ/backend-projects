/**
 * @file models/product.js
 * @description Prisma model for products, categories and cart items.
 */
import prisma from '../lib/prisma.js'

export class ProductModel {
  /**
   * Paginated list of active products with optional search and category filter.
   * @param {{ page?: number, limit?: number, categoryId?: string, search?: string }}
   */
  static async findAll({ page = 1, limit = 10, categoryId, search } = {}) {
    const skip = (page - 1) * limit
    const where = {
      isActive: true,
      ...(categoryId && { categoryId }),
      ...(search && {
        OR: [
          { name:        { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      }),
    }

    const [products, total] = await prisma.$transaction([
      prisma.product.findMany({
        where,
        skip,
        take:    limit,
        orderBy: { name: 'asc' },
        include: { category: { select: { id: true, name: true, slug: true } } },
      }),
      prisma.product.count({ where }),
    ])

    return { products, total, page, limit, totalPages: Math.ceil(total / limit) }
  }

  /**
   * Find a single product by ID.
   * @param {string} id
   */
  static async findById(id) {
    return prisma.product.findUnique({
      where:   { id },
      include: { category: true },
    })
  }

  /**
   * Find a product by slug (for SEO-friendly URLs).
   * @param {string} slug
   */
  static async findBySlug(slug) {
    return prisma.product.findUnique({ where: { slug }, include: { category: true } })
  }

  /**
   * Create a new product.
   * @param {object} data
   */
  static async create(data) {
    return prisma.product.create({ data, include: { category: true } })
  }

  /**
   * Update a product (full or partial).
   * @param {string} id
   * @param {object} data
   */
  static async update(id, data) {
    return prisma.product.update({ where: { id }, data, include: { category: true } })
  }

  /**
   * Soft-delete a product by setting isActive = false.
   * @param {string} id
   */
  static async softDelete(id) {
    return prisma.product.update({ where: { id }, data: { isActive: false } })
  }

  // ── Cart ────────────────────────────────────────────────────────────────────

  static async getCart(userId) {
    return prisma.cartItem.findMany({
      where:   { userId },
      include: { product: { select: { id: true, name: true, priceCents: true, currency: true, stock: true, isActive: true } } },
    })
  }

  static async upsertCartItem({ userId, productId, quantity }) {
    return prisma.cartItem.upsert({
      where:  { userId_productId: { userId, productId } },
      create: { userId, productId, quantity },
      update: { quantity },
    })
  }

  static async removeCartItem({ userId, productId }) {
    return prisma.cartItem.delete({
      where: { userId_productId: { userId, productId } },
    })
  }

  static async clearCart(userId) {
    return prisma.cartItem.deleteMany({ where: { userId } })
  }
}
