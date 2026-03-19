// app/api/auth/me/route.js
import { GET_me, PUT_me } from '@/routes/users'
import { handlePreflight } from '@/middlewares/cors'

export async function OPTIONS(request) {
  return handlePreflight(request) ?? new Response(null, { status: 204 })
}

export { GET_me as GET, PUT_me as PUT }
