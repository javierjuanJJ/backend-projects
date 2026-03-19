// app/api/auth/login/route.js
import { POST_login } from '@/routes/users'
import { handlePreflight } from '@/middlewares/cors'

export async function OPTIONS(request) {
  return handlePreflight(request) ?? new Response(null, { status: 204 })
}

export { POST_login as POST }
