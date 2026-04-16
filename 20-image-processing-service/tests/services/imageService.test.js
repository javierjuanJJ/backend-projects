/**
 * @file tests/services/imageService.test.js
 * @description Unit tests for the Sharp image transformation service.
 * Sharp itself is mocked to avoid needing real image files.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Mock sharp ────────────────────────────────────────────────────────────────
const mockSharpInstance = {
  rotate:    vi.fn().mockReturnThis(),
  flip:      vi.fn().mockReturnThis(),
  flop:      vi.fn().mockReturnThis(),
  resize:    vi.fn().mockReturnThis(),
  extract:   vi.fn().mockReturnThis(),
  grayscale: vi.fn().mockReturnThis(),
  recomb:    vi.fn().mockReturnThis(),
  composite: vi.fn().mockReturnThis(),
  jpeg:      vi.fn().mockReturnThis(),
  png:       vi.fn().mockReturnThis(),
  webp:      vi.fn().mockReturnThis(),
  avif:      vi.fn().mockReturnThis(),
  tiff:      vi.fn().mockReturnThis(),
  metadata:  vi.fn().mockResolvedValue({ width: 1200, height: 800, format: 'jpeg', size: 50000, hasAlpha: false }),
  stats:     vi.fn().mockResolvedValue({ dominant: { r: 100, g: 150, b: 200 } }),
  raw:       vi.fn().mockReturnThis(),
  ensureAlpha: vi.fn().mockReturnThis(),
  toBuffer:  vi.fn().mockResolvedValue({ data: Buffer.from([0, 0, 0, 255]), info: { width: 4, height: 4 } }),
  toFile:    vi.fn().mockResolvedValue({ format: 'webp', width: 800, height: 600, size: 30000 }),
}

vi.mock('sharp', () => ({ default: vi.fn(() => mockSharpInstance) }))
vi.mock('blurhash', () => ({ encode: vi.fn().mockReturnValue('LGF5?xYk') }))

import { applyTransformations, getMetadata, generateBlurhash, extractPalette } from '../../src/server/services/imageService.js'

describe('getMetadata', () => {
  it('returns image metadata', async () => {
    const meta = await getMetadata('/fake/path.jpg')
    expect(meta).toMatchObject({ width: 1200, height: 800, format: 'jpeg' })
  })
})

describe('generateBlurhash', () => {
  it('returns a blurhash string', async () => {
    const hash = await generateBlurhash('/fake/path.jpg')
    expect(typeof hash).toBe('string')
  })
})

describe('extractPalette', () => {
  it('returns dominant colour', async () => {
    const palette = await extractPalette('/fake/path.jpg')
    expect(palette).toEqual([{ r: 100, g: 150, b: 200 }])
  })
})

describe('applyTransformations', () => {
  beforeEach(() => vi.clearAllMocks())

  it('calls rotate when rotate is specified', async () => {
    await applyTransformations('/in.jpg', '/out.jpg', { rotate: 90 })
    expect(mockSharpInstance.rotate).toHaveBeenCalledWith(90)
  })

  it('calls flip when flip is true', async () => {
    await applyTransformations('/in.jpg', '/out.jpg', { flip: true })
    expect(mockSharpInstance.flip).toHaveBeenCalled()
  })

  it('calls flop (mirror) when mirror is true', async () => {
    await applyTransformations('/in.jpg', '/out.jpg', { mirror: true })
    expect(mockSharpInstance.flop).toHaveBeenCalled()
  })

  it('calls resize with correct dimensions', async () => {
    await applyTransformations('/in.jpg', '/out.jpg', { resize: { width: 400, height: 300 } })
    expect(mockSharpInstance.resize).toHaveBeenCalledWith(expect.objectContaining({ width: 400, height: 300 }))
  })

  it('calls extract for crop', async () => {
    await applyTransformations('/in.jpg', '/out.jpg', { crop: { width: 200, height: 200, x: 10, y: 10 } })
    expect(mockSharpInstance.extract).toHaveBeenCalledWith({ left: 10, top: 10, width: 200, height: 200 })
  })

  it('calls grayscale for grayscale filter', async () => {
    await applyTransformations('/in.jpg', '/out.jpg', { filters: { grayscale: true } })
    expect(mockSharpInstance.grayscale).toHaveBeenCalled()
  })

  it('calls recomb for sepia filter', async () => {
    await applyTransformations('/in.jpg', '/out.jpg', { filters: { sepia: true } })
    expect(mockSharpInstance.recomb).toHaveBeenCalled()
  })

  it('calls webp for webp format', async () => {
    await applyTransformations('/in.jpg', '/out.webp', { format: 'webp', compress: 80 })
    expect(mockSharpInstance.webp).toHaveBeenCalledWith({ quality: 80 })
  })

  it('calls composite for watermark', async () => {
    await applyTransformations('/in.jpg', '/out.jpg', { watermark: { text: '© Test', opacity: 0.5 } })
    expect(mockSharpInstance.composite).toHaveBeenCalled()
  })

  it('returns file info from toFile', async () => {
    const result = await applyTransformations('/in.jpg', '/out.webp', { format: 'webp' })
    expect(result).toMatchObject({ format: 'webp', width: 800, height: 600, size: 30000 })
  })

  it('does not rotate when rotate is 0', async () => {
    await applyTransformations('/in.jpg', '/out.jpg', { rotate: 0 })
    expect(mockSharpInstance.rotate).not.toHaveBeenCalled()
  })
})
