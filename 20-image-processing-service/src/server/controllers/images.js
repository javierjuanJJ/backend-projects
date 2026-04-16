/**
 * @file controllers/images.js
 * @description Handles image upload, listing, retrieval and queuing transformations.
 */
import path from 'path'
import { unlink } from 'fs/promises'
import { ImageModel } from '../models/image.js'
import { validateTransform, validatePagination } from '../schemas/images.js'
import { getMetadata, generateBlurhash, extractPalette } from '../services/imageService.js'
import { publishTransformJob } from '../services/queueService.js'
import { cacheAside, cacheKeys, cache } from '../lib/cache.js'
import { DEFAULTS } from '../config.js'

export class ImageController {
  /**
   * @swagger
   * /api/images:
   *   post:
   *     summary: Upload an image
   *     tags: [Images]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         multipart/form-data:
   *           schema:
   *             type: object
   *             required: [image]
   *             properties:
   *               image:
   *                 type: string
   *                 format: binary
   *     responses:
   *       201:
   *         description: Image uploaded successfully
   *       400:
   *         description: No file provided or invalid file type
   *       401:
   *         description: Unauthorized
   */
  static async upload(req, res) {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' })
    }

    try {
      const filePath = req.file.path
      const meta     = await getMetadata(filePath)
      const blurhash = await generateBlurhash(filePath)
      const palette  = await extractPalette(filePath)

      const baseUrl = `${req.protocol}://${req.get('host')}`
      const url     = `${baseUrl}/uploads/${req.file.filename}`

      const image = await ImageModel.create({
        userId:   req.user.id,
        filename: req.file.filename,
        url,
        format:   meta.format,
        width:    meta.width,
        height:   meta.height,
        size:     req.file.size,
        blurhash,
        palette,
      })

      return res.status(201).json(image)
    } catch (err) {
      // Clean up orphaned file on error
      if (req.file?.path) await unlink(req.file.path).catch(() => {})
      console.error('Upload error:', err)
      return res.status(500).json({ error: 'Upload failed' })
    }
  }

  /**
   * @swagger
   * /api/images:
   *   get:
   *     summary: List all images for the authenticated user
   *     tags: [Images]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: page
   *         schema: { type: integer, default: 1 }
   *       - in: query
   *         name: limit
   *         schema: { type: integer, default: 10, maximum: 100 }
   *     responses:
   *       200:
   *         description: Paginated list of images
   */
  static async list(req, res) {
    const parsed = validatePagination(req.query)
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid query params', details: parsed.error.errors })
    }

    const { page, limit } = parsed.data

    try {
      const key    = cacheKeys.imageList(req.user.id, page, limit)
      const result = await cacheAside(key, () =>
        ImageModel.findByUser({ userId: req.user.id, page, limit })
      )
      return res.status(200).json(result)
    } catch (err) {
      console.error('List images error:', err)
      return res.status(500).json({ error: 'Could not fetch images' })
    }
  }

  /**
   * @swagger
   * /api/images/{id}:
   *   get:
   *     summary: Get image details by ID
   *     tags: [Images]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema: { type: string, format: uuid }
   *     responses:
   *       200:
   *         description: Image details
   *       404:
   *         description: Image not found
   */
  static async getById(req, res) {
    try {
      const key   = cacheKeys.image(req.params.id)
      const image = await cacheAside(key, () => ImageModel.findById(req.params.id))

      if (!image) return res.status(404).json({ error: 'Image not found' })
      if (image.userId !== req.user.id) return res.status(403).json({ error: 'Forbidden' })

      return res.status(200).json(image)
    } catch (err) {
      console.error('Get image error:', err)
      return res.status(500).json({ error: 'Could not fetch image' })
    }
  }

  /**
   * @swagger
   * /api/images/{id}/transform:
   *   post:
   *     summary: Queue an image transformation job
   *     tags: [Images]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema: { type: string, format: uuid }
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/TransformPayload'
   *     responses:
   *       202:
   *         description: Transformation queued
   *       400:
   *         description: Validation error
   *       404:
   *         description: Image not found
   *       429:
   *         description: Rate limit exceeded
   */
  static async transform(req, res) {
    const result = validateTransform(req.body)
    if (!result.success) {
      return res.status(400).json({ error: 'Validation failed', details: result.error.errors })
    }

    try {
      const image = await ImageModel.findById(req.params.id)
      if (!image)                          return res.status(404).json({ error: 'Image not found' })
      if (image.userId !== req.user.id)    return res.status(403).json({ error: 'Forbidden' })

      const transform = await ImageModel.createTransform({
        imageId:         image.id,
        transformations: result.data.transformations,
      })

      const UPLOAD_DIR = process.env.UPLOAD_DIR ?? DEFAULTS.UPLOAD_DIR
      const CACHE_DIR  = process.env.CACHE_DIR  ?? DEFAULTS.CACHE_DIR
      const ext        = result.data.transformations.format ?? path.extname(image.filename).slice(1)
      const outputName = `${transform.id}.${ext}`

      await publishTransformJob({
        transformId:     transform.id,
        imageId:         image.id,
        inputPath:       path.join(UPLOAD_DIR, image.filename),
        outputPath:      path.join(CACHE_DIR, outputName),
        outputFilename:  outputName,
        transformations: result.data.transformations,
      })

      return res.status(202).json({
        message:     'Transformation queued',
        transformId: transform.id,
        status:      'pending',
      })
    } catch (err) {
      console.error('Transform error:', err)
      return res.status(500).json({ error: 'Failed to queue transformation' })
    }
  }

  /**
   * @swagger
   * /api/images/{id}:
   *   delete:
   *     summary: Delete an image
   *     tags: [Images]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema: { type: string, format: uuid }
   *     responses:
   *       204:
   *         description: Image deleted
   *       404:
   *         description: Image not found
   */
  static async delete(req, res) {
    try {
      const image = await ImageModel.findById(req.params.id)
      if (!image)                       return res.status(404).json({ error: 'Image not found' })
      if (image.userId !== req.user.id) return res.status(403).json({ error: 'Forbidden' })

      const UPLOAD_DIR = process.env.UPLOAD_DIR ?? DEFAULTS.UPLOAD_DIR
      await unlink(path.join(UPLOAD_DIR, image.filename)).catch(() => {})
      await ImageModel.delete(image.id)

      // Bust cache
      cache.del(cacheKeys.image(image.id))

      return res.status(204).send()
    } catch (err) {
      console.error('Delete image error:', err)
      return res.status(500).json({ error: 'Could not delete image' })
    }
  }
}
