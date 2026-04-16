/**
 * @file tests/helpers/auth.js
 * @description Utility functions for generating test JWT tokens.
 */
import jwt from 'jsonwebtoken'

const TEST_SECRET = process.env.JWT_SECRET ?? 'test-secret'

/**
 * Generate a signed JWT for use in tests.
 * @param {{ id?: string, email?: string, role?: string }} overrides
 */
export function generateTestToken(overrides = {}) {
  const payload = {
    id:    overrides.id    ?? 'test-user-uuid',
    email: overrides.email ?? 'test@example.com',
    role:  overrides.role  ?? 'customer',
  }
  return jwt.sign(payload, TEST_SECRET, { expiresIn: '1h' })
}

export const TEST_USER = {
  id:    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  email: 'test@example.com',
  role:  'customer',
}

export const TEST_ADMIN = {
  id:    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  email: 'admin@example.com',
  role:  'admin',
}
