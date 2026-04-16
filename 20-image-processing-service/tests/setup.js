/**
 * @file tests/setup.js
 * @description Global test setup: environment variables required by the app.
 */
import { vi } from 'vitest'

// Set test environment variables before any module is loaded
process.env.JWT_SECRET      = 'test-secret-minimum-32-chars-long-!!'
process.env.JWT_EXPIRES_IN  = '1h'
process.env.NODE_ENV        = 'test'
process.env.DATABASE_URL    = 'postgresql://test:test@localhost:5432/test'
process.env.RABBITMQ_URL    = 'amqp://localhost:5672'
process.env.UPLOAD_DIR      = '/tmp/test-uploads'
process.env.CACHE_DIR       = '/tmp/test-cache'

// Prevent sharp from trying to access the filesystem during module init
vi.mock('fs', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    mkdirSync: vi.fn(),
  }
})
