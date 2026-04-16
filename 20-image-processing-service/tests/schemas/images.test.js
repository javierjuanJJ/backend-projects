/**
 * @file tests/schemas/images.test.js
 * @description Unit tests for image transformation Zod schemas.
 */
import { describe, it, expect } from 'vitest'
import { validateTransform, validatePagination } from '../../src/server/schemas/images.js'

describe('validateTransform', () => {
  it('accepts a resize transformation', () => {
    const result = validateTransform({ transformations: { resize: { width: 300, height: 200 } } })
    expect(result.success).toBe(true)
  })

  it('accepts a full transformation payload', () => {
    const result = validateTransform({
      transformations: {
        resize:    { width: 800, height: 600 },
        rotate:    90,
        format:    'webp',
        compress:  80,
        filters:   { grayscale: true, sepia: false },
        watermark: { text: '© Test', opacity: 0.5 },
      },
    })
    expect(result.success).toBe(true)
  })

  it('rejects empty transformations object', () => {
    const result = validateTransform({ transformations: {} })
    expect(result.success).toBe(false)
  })

  it('rejects negative resize dimensions', () => {
    const result = validateTransform({ transformations: { resize: { width: -1, height: 200 } } })
    expect(result.success).toBe(false)
  })

  it('rejects rotate > 360', () => {
    const result = validateTransform({ transformations: { rotate: 400 } })
    expect(result.success).toBe(false)
  })

  it('rejects invalid format', () => {
    const result = validateTransform({ transformations: { format: 'bmp' } })
    expect(result.success).toBe(false)
  })

  it('rejects compress > 100', () => {
    const result = validateTransform({ transformations: { compress: 150 } })
    expect(result.success).toBe(false)
  })

  it('rejects watermark opacity > 1', () => {
    const result = validateTransform({
      transformations: { watermark: { text: 'hi', opacity: 2 } },
    })
    expect(result.success).toBe(false)
  })
})

describe('validatePagination', () => {
  it('accepts valid page and limit', () => {
    const result = validatePagination({ page: '2', limit: '20' })
    expect(result.success).toBe(true)
    expect(result.data.page).toBe(2)
    expect(result.data.limit).toBe(20)
  })

  it('uses defaults when params are missing', () => {
    const result = validatePagination({})
    expect(result.success).toBe(true)
    expect(result.data.page).toBe(1)
    expect(result.data.limit).toBe(10)
  })

  it('rejects limit > 100', () => {
    const result = validatePagination({ page: '1', limit: '200' })
    expect(result.success).toBe(false)
  })
})
