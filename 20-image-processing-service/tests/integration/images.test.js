/**
 * @file tests/integration/images.test.js
 * @description Integration tests for image management endpoints.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import app from '../../src/server/app.js'
import { generateTestToken, TEST_USER } from '../helpers/auth.js'

// ── Mocks ─────────────────────────────────────────────────────────────────────
vi.mock('../../src/server/lib/prisma.js', () => ({
  default: {
    image:          { create: vi.fn(), findUnique: vi.fn(), findMany: vi.fn(), count: vi.fn(), delete: vi.fn() },
    imageTransform: { create: vi.fn(), update: vi.fn(), findUnique: vi.fn() },
    $transaction:   vi.fn(),
    $queryRaw:      vi.fn().mockResolvedValue([]),
  },
}))

vi.mock('../../src/server/services/imageService.js', () => ({
  getMetadata:    vi.fn().mockResolvedValue({ width: 800, height: 600, format: 'jpeg', size: 12000, hasAlpha: false }),
  generateBlurhash: vi.fn().mockResolvedValue('LGF5?xYk^6#M@-5c,1J5@[or[Q6.'),
  extractPalette: vi.fn().mockResolvedValue([{ r: 100, g: 150, b: 200 }]),
  processImageJob: vi.fn(),
}))

vi.mock('../../src/server/services/queueService.js', () => ({
  publishTransformJob: vi.fn().mockResolvedValue(true),
  startConsumer:       vi.fn(),
}))

import prisma from '../../src/server/lib/prisma.js'

const TOKEN = generateTestToken(TEST_USER)

const MOCK_IMAGE = {
  id:        'img-uuid-0001',
  userId:    TEST_USER.id,
  filename:  'test-image.jpg',
  url:       'http://localhost:3000/uploads/test-image.jpg',
  format:    'jpeg',
  width:     800,
  height:    600,
  size:      12000,
  blurhash:  'LGF5?xYk^6#M',
  palette:   [{ r: 100, g: 150, b: 200 }],
  createdAt: new Date().toISOString(),
  transformations: [],
}

describe('GET /api/images', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 401 without token', async () => {
    const res = await request(app).get('/api/images')
    expect(res.status).toBe(401)
  })

  it('returns paginated image list', async () => {
    prisma.$transaction.mockResolvedValue([[MOCK_IMAGE], 1])

    const res = await request(app)
      .get('/api/images?page=1&limit=10')
      .set('Authorization', `Bearer ${TOKEN}`)

    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('images')
    expect(res.body).toHaveProperty('total')
    expect(res.body.images).toHaveLength(1)
  })

  it('returns 400 for invalid pagination params', async () => {
    const res = await request(app)
      .get('/api/images?limit=999')
      .set('Authorization', `Bearer ${TOKEN}`)

    expect(res.status).toBe(400)
  })
})

describe('GET /api/images/:id', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns image details for owner', async () => {
    prisma.image.findUnique.mockResolvedValue(MOCK_IMAGE)

    const res = await request(app)
      .get(`/api/images/${MOCK_IMAGE.id}`)
      .set('Authorization', `Bearer ${TOKEN}`)

    expect(res.status).toBe(200)
    expect(res.body.id).toBe(MOCK_IMAGE.id)
  })

  it('returns 404 when image does not exist', async () => {
    prisma.image.findUnique.mockResolvedValue(null)

    const res = await request(app)
      .get('/api/images/non-existent-id')
      .set('Authorization', `Bearer ${TOKEN}`)

    expect(res.status).toBe(404)
  })

  it('returns 403 when accessing another user\'s image', async () => {
    prisma.image.findUnique.mockResolvedValue({ ...MOCK_IMAGE, userId: 'other-user-id' })

    const res = await request(app)
      .get(`/api/images/${MOCK_IMAGE.id}`)
      .set('Authorization', `Bearer ${TOKEN}`)

    expect(res.status).toBe(403)
  })
})

describe('POST /api/images/:id/transform', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 202 and queues the job', async () => {
    prisma.image.findUnique.mockResolvedValue(MOCK_IMAGE)
    prisma.imageTransform.create.mockResolvedValue({ id: 'transform-uuid', status: 'pending' })

    const res = await request(app)
      .post(`/api/images/${MOCK_IMAGE.id}/transform`)
      .set('Authorization', `Bearer ${TOKEN}`)
      .send({ transformations: { resize: { width: 400, height: 300 }, format: 'webp' } })

    expect(res.status).toBe(202)
    expect(res.body).toHaveProperty('transformId')
    expect(res.body.status).toBe('pending')
  })

  it('returns 400 for empty transformations', async () => {
    const res = await request(app)
      .post(`/api/images/${MOCK_IMAGE.id}/transform`)
      .set('Authorization', `Bearer ${TOKEN}`)
      .send({ transformations: {} })

    expect(res.status).toBe(400)
  })

  it('returns 400 for negative resize dimensions', async () => {
    const res = await request(app)
      .post(`/api/images/${MOCK_IMAGE.id}/transform`)
      .set('Authorization', `Bearer ${TOKEN}`)
      .send({ transformations: { resize: { width: -100, height: 200 } } })

    expect(res.status).toBe(400)
  })

  it('returns 404 when image does not exist', async () => {
    prisma.image.findUnique.mockResolvedValue(null)

    const res = await request(app)
      .post('/api/images/non-existent/transform')
      .set('Authorization', `Bearer ${TOKEN}`)
      .send({ transformations: { rotate: 90 } })

    expect(res.status).toBe(404)
  })

  it('returns 401 without token', async () => {
    const res = await request(app)
      .post('/api/images/some-id/transform')
      .send({ transformations: { rotate: 90 } })

    expect(res.status).toBe(401)
  })
})

describe('DELETE /api/images/:id', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 204 on successful deletion', async () => {
    prisma.image.findUnique.mockResolvedValue(MOCK_IMAGE)
    prisma.image.delete.mockResolvedValue(MOCK_IMAGE)

    const res = await request(app)
      .delete(`/api/images/${MOCK_IMAGE.id}`)
      .set('Authorization', `Bearer ${TOKEN}`)

    expect(res.status).toBe(204)
  })

  it('returns 403 when deleting another user\'s image', async () => {
    prisma.image.findUnique.mockResolvedValue({ ...MOCK_IMAGE, userId: 'other-user' })

    const res = await request(app)
      .delete(`/api/images/${MOCK_IMAGE.id}`)
      .set('Authorization', `Bearer ${TOKEN}`)

    expect(res.status).toBe(403)
  })
})
