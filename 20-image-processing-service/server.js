/**
 * @file server.js
 * @description Custom Next.js server with Express middleware.
 * Mounts all API routes under /api and delegates everything else to Next.js.
 */
import { createServer } from 'http'
import next from 'next'
import app from './src/server/app.js'
import { startConsumer } from './src/server/services/queueService.js'
import { processImageJob } from './src/server/services/imageService.js'

const dev = process.env.NODE_ENV !== 'production'
const PORT = parseInt(process.env.PORT ?? '3000', 10)

const nextApp = next({ dev })
const handle = nextApp.getRequestHandler()

nextApp.prepare().then(async () => {
  // Next.js handles everything not caught by Express
  app.all('*', (req, res) => handle(req, res))

  const server = createServer(app)

  // Start RabbitMQ consumer for async image transformations
  if (process.env.NODE_ENV !== 'test') {
    try {
      await startConsumer(processImageJob)
      console.log('✅ RabbitMQ consumer started')
    } catch (err) {
      console.warn('⚠️  RabbitMQ unavailable — async transforms disabled:', err.message)
    }
  }

  server.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`)
    console.log(`📄 API docs at  http://localhost:${PORT}/api/docs`)
    console.log(`🌍 Environment: ${process.env.NODE_ENV ?? 'development'}`)
  })
})
