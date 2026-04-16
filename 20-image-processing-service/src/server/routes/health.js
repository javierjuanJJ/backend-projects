/**
 * @file routes/health.js
 * @description Health check endpoint for load balancers and deployment pipelines.
 */
import { Router } from 'express'
import prisma from '../lib/prisma.js'

export const healthRouter = Router()

/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: Service health check
 *     tags: [System]
 *     responses:
 *       200:
 *         description: Service is healthy
 *       503:
 *         description: Service degraded (DB unreachable)
 */
healthRouter.get('/health', async (_req, res) => {
  const checks = { api: 'ok', database: 'unknown', timestamp: new Date().toISOString() }

  try {
    await prisma.$queryRaw`SELECT 1`
    checks.database = 'ok'
    return res.status(200).json({ status: 'healthy', checks })
  } catch (err) {
    checks.database = 'unreachable'
    return res.status(503).json({ status: 'degraded', checks, error: err.message })
  }
})
