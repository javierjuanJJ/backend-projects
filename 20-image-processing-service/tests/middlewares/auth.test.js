/**
 * @file tests/middlewares/auth.test.js
 * @description Unit tests for the JWT authentication middleware.
 */
import { describe, it, expect, vi } from 'vitest'
import jwt from 'jsonwebtoken'
import { authMiddleware, adminOnly } from '../../src/server/middlewares/auth.js'

const SECRET = 'test-secret'

function mockRes() {
  const res = {}
  res.status = vi.fn().mockReturnValue(res)
  res.json   = vi.fn().mockReturnValue(res)
  return res
}

describe('authMiddleware', () => {
  it('calls next() with valid token and attaches req.user', () => {
    const token = jwt.sign({ id: 'uid', email: 'u@e.com', role: 'customer' }, SECRET, { expiresIn: '1h' })
    const req  = { headers: { authorization: `Bearer ${token}` } }
    const res  = mockRes()
    const next = vi.fn()

    process.env.JWT_SECRET = SECRET
    authMiddleware(req, res, next)

    expect(next).toHaveBeenCalledOnce()
    expect(req.user).toMatchObject({ id: 'uid', email: 'u@e.com', role: 'customer' })
  })

  it('returns 401 when Authorization header is missing', () => {
    const req  = { headers: {} }
    const res  = mockRes()
    const next = vi.fn()

    authMiddleware(req, res, next)

    expect(res.status).toHaveBeenCalledWith(401)
    expect(next).not.toHaveBeenCalled()
  })

  it('returns 401 when token is expired', () => {
    const token = jwt.sign({ id: 'uid' }, SECRET, { expiresIn: '-1s' })
    const req   = { headers: { authorization: `Bearer ${token}` } }
    const res   = mockRes()
    const next  = vi.fn()

    process.env.JWT_SECRET = SECRET
    authMiddleware(req, res, next)

    expect(res.status).toHaveBeenCalledWith(401)
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.stringMatching(/expired/i) }))
    expect(next).not.toHaveBeenCalled()
  })

  it('returns 401 for a tampered token', () => {
    const req  = { headers: { authorization: 'Bearer totally.fake.token' } }
    const res  = mockRes()
    const next = vi.fn()

    authMiddleware(req, res, next)

    expect(res.status).toHaveBeenCalledWith(401)
  })
})

describe('adminOnly', () => {
  it('calls next() for admin users', () => {
    const req  = { user: { role: 'admin' } }
    const res  = mockRes()
    const next = vi.fn()

    adminOnly(req, res, next)
    expect(next).toHaveBeenCalledOnce()
  })

  it('returns 403 for non-admin users', () => {
    const req  = { user: { role: 'customer' } }
    const res  = mockRes()
    const next = vi.fn()

    adminOnly(req, res, next)
    expect(res.status).toHaveBeenCalledWith(403)
    expect(next).not.toHaveBeenCalled()
  })
})
