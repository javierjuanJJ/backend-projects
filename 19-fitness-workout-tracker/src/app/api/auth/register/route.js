// src/app/api/auth/register/route.js
import { createHandler } from '../../../../lib/express-handler.js'

export const POST = createHandler('/api/auth/register')
