// tests/setup.js
// Setup global ejecutado antes de cada suite de tests

import { beforeAll, afterAll, vi } from 'vitest'
import { prisma } from '../src/lib/prisma.js'

// ── Mock de servicios externos ────────────────────────────
// Evita llamadas reales a SendGrid, Twilio y Stripe en tests

vi.mock('../src/services/email.service.js', () => ({
  sendReservationConfirmationEmail: vi.fn().mockResolvedValue(undefined),
  sendCancellationEmail: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('../src/services/whatsapp.service.js', () => ({
  sendReservationWhatsApp: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('../src/services/stripe.service.js', () => ({
  createPaymentIntent: vi.fn().mockResolvedValue({
    clientSecret: 'pi_test_secret',
    paymentIntentId: 'pi_test_id',
  }),
  constructWebhookEvent: vi.fn(),
}))

// ── Variables de entorno de test ─────────────────────────
process.env.JWT_ACCESS_SECRET  = 'test_access_secret_very_long_string'
process.env.JWT_REFRESH_SECRET = 'test_refresh_secret_very_long_string'
process.env.JWT_ACCESS_EXPIRES_IN  = '15m'
process.env.JWT_REFRESH_EXPIRES_IN = '7d'
process.env.NODE_ENV = 'test'

// ── Conexión y desconexión de BD ─────────────────────────
beforeAll(async () => {
  await prisma.$connect()
})

afterAll(async () => {
  await prisma.$disconnect()
})
