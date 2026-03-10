import express from 'express'
import { expensesRouter } from './routes/expenses.js'
import { corsMiddleware } from './middlewares/cors.js'
import { DEFAULTS } from './config.js'

const PORT = process.env.PORT ?? DEFAULTS.PORT
const app = express()

app.use(corsMiddleware())
app.use(express.json())

app.use('/expenses', expensesRouter)
if (!process.env.NODE_ENV) {
  app.listen(PORT, () => {
    console.log(`Servidor levantado en http://localhost:${PORT}`)
  })
}

export default app