// app/api/users/[id]/route.js
import { GET_user, DELETE_user } from '@/routes/users'
import { handlePreflight } from '@/middlewares/cors'

export async function OPTIONS(request) {
  return handlePreflight(request) ?? new Response(null, { status: 204 })
}

export { GET_user as GET, DELETE_user as DELETE }
