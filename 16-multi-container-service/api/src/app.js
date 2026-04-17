import express          from 'express'
import { corsMiddleware } from './middlewares/cors.js'
import { todosRouter }   from './routes/todos.js'
import { connectDB }     from './db.js'
import { DEFAULTS }      from './config.js'

const PORT = process.env.PORT ?? DEFAULTS.PORT
const app  = express()

app.use(corsMiddleware())
app.use(express.json())

app.use('/todos', todosRouter)
app.get('/health', (_req, res) => res.json({ status: 'ok' }))
app.use((_req, res) => res.status(404).json({ error: 'Ruta no encontrada' }))

if (process.env.NODE_ENV !== 'test') {
  await connectDB()
  app.listen(PORT, () => console.log(`🚀 API en http://localhost:${PORT}`))
}

export default app
