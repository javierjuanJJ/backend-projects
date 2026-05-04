// app.js
import express from 'express'
import { corsMiddleware } from './src/middlewares/cors.js'
import { errorHandler } from './src/middlewares/errorHandler.js'
import { authRouter } from './src/routes/auth.js'
import { usersRouter } from './src/routes/users.js'
import { gamesRouter } from './src/routes/games.js'
import { scoresRouter } from './src/routes/scores.js'

const app = express()

// ─── Global middlewares ───────────────────────────────────────────────────────
app.use(corsMiddleware())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// ─── Health check (public) ────────────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }))

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/auth',   authRouter)
app.use('/users',  usersRouter)
app.use('/games',  gamesRouter)
app.use('/scores', scoresRouter)

// ─── 404 handler ──────────────────────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ error: 'Route not found' }))

// ─── Global error handler (must be last) ──────────────────────────────────────
app.use(errorHandler)

export default app
