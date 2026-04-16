/**
 * @file tests/schemas/auth.test.js
 * @description Unit tests for auth Zod schemas.
 */
import { describe, it, expect } from 'vitest'
import { validateRegister, validateLogin } from '../../src/server/schemas/auth.js'

describe('validateRegister', () => {
  it('accepts a valid registration payload', () => {
    const result = validateRegister({ email: 'user@example.com', password: 'Password1' })
    expect(result.success).toBe(true)
    expect(result.data.email).toBe('user@example.com')
  })

  it('rejects invalid email', () => {
    const result = validateRegister({ email: 'not-an-email', password: 'Password1' })
    expect(result.success).toBe(false)
  })

  it('rejects password shorter than 8 chars', () => {
    const result = validateRegister({ email: 'user@example.com', password: 'Ab1' })
    expect(result.success).toBe(false)
  })

  it('rejects password without uppercase letter', () => {
    const result = validateRegister({ email: 'user@example.com', password: 'password1' })
    expect(result.success).toBe(false)
  })

  it('rejects password without a number', () => {
    const result = validateRegister({ email: 'user@example.com', password: 'PasswordOnly' })
    expect(result.success).toBe(false)
  })

  it('lowercases email', () => {
    const result = validateRegister({ email: 'USER@EXAMPLE.COM', password: 'Password1' })
    expect(result.success).toBe(true)
    expect(result.data.email).toBe('user@example.com')
  })
})

describe('validateLogin', () => {
  it('accepts valid credentials', () => {
    const result = validateLogin({ email: 'user@example.com', password: 'anypassword' })
    expect(result.success).toBe(true)
  })

  it('rejects missing password', () => {
    const result = validateLogin({ email: 'user@example.com' })
    expect(result.success).toBe(false)
  })
})
