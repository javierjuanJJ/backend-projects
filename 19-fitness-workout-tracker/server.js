// server.js — Entry point para desarrollo y producción standalone
import 'dotenv/config'
import app from './src/server/app.js'
import { DEFAULTS } from './src/server/config.js'

const PORT = process.env.PORT ?? DEFAULTS.PORT

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`\n🏋️  Workout Tracker API running on http://localhost:${PORT}`)
    console.log(`📖  Swagger docs at http://localhost:${PORT}/api/docs`)
    console.log(`🌍  Environment: ${process.env.NODE_ENV ?? 'development'}\n`)
  })
}

export default app
