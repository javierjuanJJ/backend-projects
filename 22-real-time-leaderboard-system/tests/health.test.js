// tests/health.test.js
import { describe, it, expect } from 'vitest'
import request from 'supertest'
import app from '../app.js'

describe('GET /health', () => {
  it('returns 200 with status ok (no auth required)', async () => {
    const res = await request(app).get('/health')
    expect(res.status).toBe(200)
    expect(res.body.status).toBe('ok')
    expect(res.body).toHaveProperty('timestamp')
  })
})

describe('GET /nonexistent-route', () => {
  it('returns 404 for unknown routes', async () => {
    const res = await request(app).get('/this-does-not-exist')
    expect(res.status).toBe(404)
    expect(res.body).toHaveProperty('error')
  })
})

describe('CORS middleware', () => {
  it('allows requests from accepted origins', async () => {
    const res = await request(app)
      .get('/health')
      .set('Origin', 'http://localhost:5173')
    expect(res.status).toBe(200)
    expect(res.headers['access-control-allow-origin']).toBe('http://localhost:5173')
  })

  it('blocks requests from unaccepted origins', async () => {
    const res = await request(app)
      .get('/health')
      .set('Origin', 'https://malicious-site.com')
    // Express-cors sends back the error as a 500, or simply doesn't set the header
    expect(res.headers['access-control-allow-origin']).toBeUndefined()
  })
})
