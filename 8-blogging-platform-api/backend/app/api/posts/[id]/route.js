// app/api/posts/[id]/route.js
// Punto de entrada Next.js — delega en routes/posts.js
import { GET_post, PUT_post, PATCH_post, DELETE_post } from '@/routes/posts'
import { handlePreflight } from '@/middlewares/cors'

export async function OPTIONS(request) {
  return handlePreflight(request) ?? new Response(null, { status: 204 })
}

export { GET_post as GET, PUT_post as PUT, PATCH_post as PATCH, DELETE_post as DELETE }
