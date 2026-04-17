// src/routes/index.js
// Ensamblador central de routers Express

import { Router } from 'express'
import { authRouter } from './auth.routes.js'
import { moviesRouter } from './movies.routes.js'
import { showtimesRouter } from './showtimes.routes.js'
import { reservationsRouter } from './reservations.routes.js'
import { genresRouter } from './genres.routes.js'
import { roomsRouter } from './rooms.routes.js'
import { adminRouter } from './admin.routes.js'

const router = Router()

router.use('/auth', authRouter)
router.use('/movies', moviesRouter)
router.use('/showtimes', showtimesRouter)
router.use('/reservations', reservationsRouter)
router.use('/genres', genresRouter)
router.use('/rooms', roomsRouter)
router.use('/admin', adminRouter)

router.get('/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }))

export default router
