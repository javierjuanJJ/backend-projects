// app/api/posts/route.js
// Punto de entrada Next.js — delega en routes/posts.js
import { GET_posts, POST_posts } from '@/routes/posts'
import { handlePreflight } from '@/middlewares/cors'

export async function OPTIONS(request) {
  return handlePreflight(request) ?? new Response(null, { status: 204 })
}

export { GET_posts as GET, POST_posts as POST }
