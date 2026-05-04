// server.js
import app from './app.js'
import { DEFAULTS } from './config.js'

const PORT = process.env.PORT ?? DEFAULTS.PORT

app.listen(PORT, () => {
  console.log(`🏆 Leaderboard API running at http://localhost:${PORT}`)
  console.log(`   Environment : ${process.env.NODE_ENV ?? 'development'}`)
  console.log(`   Health      : http://localhost:${PORT}/health`)
})
