/**
 * @file services/imageService.js
 * @description Sharp-based image processing service.
 * Handles all transformations, metadata extraction, blurhash and palette generation.
 */
import sharp from 'sharp'
import { encode as encodeBlurhash } from 'blurhash'
import path from 'path'
import { mkdirSync } from 'fs'
import { ImageModel } from '../models/image.js'
import { DEFAULTS } from '../config.js'

// Ensure cache dir exists at startup
mkdirSync(process.env.CACHE_DIR ?? DEFAULTS.CACHE_DIR, { recursive: true })

// ── Metadata ──────────────────────────────────────────────────────────────────

/**
 * Extract image metadata using Sharp.
 * @param {string} filePath - Absolute or relative path to image
 * @returns {Promise<{ width: number, height: number, format: string, size: number, hasAlpha: boolean }>}
 */
export async function getMetadata(filePath) {
  const meta = await sharp(filePath).metadata()
  return {
    width:    meta.width,
    height:   meta.height,
    format:   meta.format,
    size:     meta.size,
    hasAlpha: meta.hasAlpha ?? false,
  }
}

// ── Blurhash ─────────────────────────────────────────────────────────────────

/**
 * Generate a Blurhash string (short placeholder for images while loading).
 * @param {string} filePath
 * @returns {Promise<string>} Blurhash encoded string
 */
export async function generateBlurhash(filePath) {
  try {
    const { data, info } = await sharp(filePath)
      .raw()
      .ensureAlpha()
      .resize(32, 32, { fit: 'inside' })
      .toBuffer({ resolveWithObject: true })

    return encodeBlurhash(new Uint8ClampedArray(data), info.width, info.height, 4, 4)
  } catch {
    return null
  }
}

// ── Palette ──────────────────────────────────────────────────────────────────

/**
 * Extract dominant color palette from an image.
 * @param {string} filePath
 * @returns {Promise<{ r: number, g: number, b: number }[]>}
 */
export async function extractPalette(filePath) {
  try {
    const { dominant } = await sharp(filePath).stats()
    return [dominant]
  } catch {
    return null
  }
}

// ── Transformations ───────────────────────────────────────────────────────────

/**
 * Apply a set of transformations to an image using Sharp.
 * Order matters: rotate → flip/flop → resize → crop → filters → watermark → format.
 *
 * @param {string} inputPath  - Source image path
 * @param {string} outputPath - Destination image path
 * @param {object} transforms - Transformation options
 * @param {object} [transforms.resize]    - { width, height }
 * @param {object} [transforms.crop]      - { width, height, x, y }
 * @param {number} [transforms.rotate]    - Degrees (0–360)
 * @param {boolean} [transforms.flip]     - Flip vertically
 * @param {boolean} [transforms.mirror]   - Mirror horizontally (flop)
 * @param {number}  [transforms.compress] - Quality 1–100
 * @param {string}  [transforms.format]   - Target format: jpeg|png|webp|avif|tiff
 * @param {object}  [transforms.filters]  - { grayscale, sepia }
 * @param {object}  [transforms.watermark]- { text, opacity }
 * @returns {Promise<{ format: string, width: number, height: number, size: number }>}
 */
export async function applyTransformations(inputPath, outputPath, transforms) {
  const {
    resize, crop, rotate, flip, mirror,
    format, filters, compress, watermark,
  } = transforms

  let pipeline = sharp(inputPath)

  // 1. Rotate (before resize to keep pixel quality)
  if (rotate !== undefined && rotate !== 0) {
    pipeline = pipeline.rotate(rotate)
  }

  // 2. Flip (vertical) / Mirror (horizontal)
  if (flip)   pipeline = pipeline.flip()
  if (mirror) pipeline = pipeline.flop()

  // 3. Resize
  if (resize) {
    pipeline = pipeline.resize({
      width:  resize.width,
      height: resize.height,
      fit:    'inside',
      withoutEnlargement: true,
    })
  }

  // 4. Crop (extract after resize)
  if (crop) {
    pipeline = pipeline.extract({
      left:   crop.x,
      top:    crop.y,
      width:  crop.width,
      height: crop.height,
    })
  }

  // 5. Color filters
  if (filters?.grayscale) {
    pipeline = pipeline.grayscale()
  }

  if (filters?.sepia) {
    // Sepia via colour recombination matrix (ITU BT.601 approximation)
    pipeline = pipeline.recomb([
      [0.3588, 0.7044, 0.1368],
      [0.2990, 0.5870, 0.1140],
      [0.2392, 0.4696, 0.0912],
    ])
  }

  // 6. Watermark (SVG composite — bottom-right)
  if (watermark?.text) {
    const opacity = watermark.opacity ?? 0.5
    const svgBuffer = Buffer.from(
      `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="60">
        <text x="10" y="45" font-family="Arial, sans-serif" font-size="32"
          fill="rgba(255,255,255,${opacity})" stroke="rgba(0,0,0,${opacity * 0.5})"
          stroke-width="1">${escapeXml(watermark.text)}</text>
      </svg>`
    )
    pipeline = pipeline.composite([{ input: svgBuffer, gravity: 'southeast' }])
  }

  // 7. Output format + compression (always last)
  const quality = compress ?? 85
  if (format === 'jpeg' || format === 'jpg') {
    pipeline = pipeline.jpeg({ quality, mozjpeg: true })
  } else if (format === 'png') {
    pipeline = pipeline.png({ compressionLevel: Math.round((100 - quality) / 11) })
  } else if (format === 'webp') {
    pipeline = pipeline.webp({ quality })
  } else if (format === 'avif') {
    pipeline = pipeline.avif({ quality })
  } else if (format === 'tiff') {
    pipeline = pipeline.tiff({ quality })
  }

  const info = await pipeline.toFile(outputPath)
  return { format: info.format, width: info.width, height: info.height, size: info.size }
}

// ── Job Processor (called by RabbitMQ consumer) ───────────────────────────────

/**
 * Process an image transform job from the queue.
 * Updates the ImageTransform record on success or failure.
 *
 * @param {{ transformId: string, imageId: string, inputPath: string, outputPath: string, outputFilename: string, transformations: object }} job
 */
export async function processImageJob(job) {
  const { transformId, inputPath, outputPath, outputFilename, transformations } = job

  try {
    await ImageModel.updateTransform({ id: transformId, status: 'processing' })

    await applyTransformations(inputPath, outputPath, transformations)

    const baseUrl = process.env.BASE_URL ?? 'http://localhost:3000'
    const outputUrl = `${baseUrl}/cache/${outputFilename}`

    await ImageModel.updateTransform({
      id: transformId,
      status: 'done',
      outputUrl,
      outputFilename,
    })
  } catch (err) {
    console.error(`Transform job ${transformId} failed:`, err.message)
    await ImageModel.updateTransform({
      id:           transformId,
      status:       'failed',
      errorMessage: err.message,
    }).catch(() => {})
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function escapeXml(str) {
  return str.replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;',
  }[c]))
}
