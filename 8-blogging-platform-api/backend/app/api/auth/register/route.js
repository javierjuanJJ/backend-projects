// app/api/auth/register/route.js
import { POST_register } from '@/routes/users'
import { handlePreflight } from '@/middlewares/cors'

export async function OPTIONS(request) {
  return handlePreflight(request) ?? new Response(null, { status: 204 })
}

export { POST_register as POST }
