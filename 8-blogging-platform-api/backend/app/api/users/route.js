// app/api/users/route.js
import { GET_users } from '@/routes/users'
import { handlePreflight } from '@/middlewares/cors'

export async function OPTIONS(request) {
  return handlePreflight(request) ?? new Response(null, { status: 204 })
}

export { GET_users as GET }
