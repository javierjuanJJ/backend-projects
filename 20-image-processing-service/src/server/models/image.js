/**
 * @file models/image.js
 * @description Prisma model for images and their transformations.
 */
import prisma from '../lib/prisma.js'

export class ImageModel {
  /**
   * Create a new image record after upload.
   * @param {{ userId: string, filename: string, url: string, format: string, width: number, height: number, size: number, blurhash?: string, palette?: any }} data
   */
  static async create(data) {
    return prisma.image.create({ data })
  }

  /**
   * Find an image by ID.
   * @param {string} id
   */
  static async findById(id) {
    return prisma.image.findUnique({
      where: { id },
      include: { transformations: { orderBy: { createdAt: 'desc' }, take: 5 } },
    })
  }

  /**
   * Paginated list of images for a user.
   * @param {{ userId: string, page: number, limit: number }}
   */
  static async findByUser({ userId, page = 1, limit = 10 }) {
    const skip = (page - 1) * limit
    const [images, total] = await prisma.$transaction([
      prisma.image.findMany({
        where:   { userId },
        skip,
        take:    limit,
        orderBy: { createdAt: 'desc' },
        include: { transformations: { select: { id: true, status: true, outputUrl: true, createdAt: true }, take: 1, orderBy: { createdAt: 'desc' } } },
      }),
      prisma.image.count({ where: { userId } }),
    ])
    return { images, total, page, limit, totalPages: Math.ceil(total / limit) }
  }

  /**
   * Delete an image record (file must be removed separately by the controller).
   * @param {string} id
   */
  static async delete(id) {
    return prisma.image.delete({ where: { id } })
  }

  // ── Transformations ─────────────────────────────────────────────────────────

  /**
   * Create a new pending transform job record.
   * @param {{ imageId: string, transformations: object }} data
   */
  static async createTransform({ imageId, transformations }) {
    return prisma.imageTransform.create({
      data: { imageId, transformations, status: 'pending' },
    })
  }

  /**
   * Update a transform record when the job completes or fails.
   * @param {{ id: string, status: string, outputUrl?: string, outputFilename?: string, errorMessage?: string }} data
   */
  static async updateTransform({ id, status, outputUrl, outputFilename, errorMessage }) {
    return prisma.imageTransform.update({
      where: { id },
      data:  { status, outputUrl, outputFilename, errorMessage, completedAt: new Date() },
    })
  }

  /**
   * Find a transform by ID.
   * @param {string} id
   */
  static async findTransformById(id) {
    return prisma.imageTransform.findUnique({ where: { id } })
  }
}
