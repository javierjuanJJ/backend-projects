import 'dotenv/config'
import express from 'express'
import { authRouter }     from './routes/auth.js'
import { expensesRouter } from './routes/expenses.js'
import { corsMiddleware }  from './middlewares/cors.js'
import { errorHandler, notFoundHandler } from './middlewares/errorHandler.js'
import { DEFAULTS } from './config.js'

const PORT = process.env.PORT ?? DEFAULTS.PORT
const app  = express()

// ─── Middlewares globales ─────────────────────────────────────────────────────
app.use(corsMiddleware())
app.use(express.json())

// ─── Rutas ────────────────────────────────────────────────────────────────────
app.use('/auth',     authRouter)
app.use('/expenses', expensesRouter)

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'API Express + Prisma Expenses 🚀' })
})

// ─── 404 + Error global (siempre al final) ────────────────────────────────────
app.use(notFoundHandler)
app.use(errorHandler)

// ─── Arrancar solo si no es entorno de test ───────────────────────────────────
if (!process.env.NODE_ENV || process.env.NODE_ENV === 'development') {
  app.listen(PORT, () => {
    console.log(`✅ Servidor levantado en http://localhost:${PORT}`)
    console.log(`   → POST /auth/register`)
    console.log(`   → POST /auth/login`)
    console.log(`   → GET  /expenses`)
    console.log(`   → POST /expenses`)
    console.log(`   → GET  /expenses/:id`)
    console.log(`   → PUT  /expenses/:id`)
    console.log(`   → PATCH /expenses/:id`)
    console.log(`   → DELETE /expenses/:id`)
  })
}

export default app
