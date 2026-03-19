// app/posts/[id]/page.js
import prisma from '@/lib/prisma'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { revalidatePath } from 'next/cache'

export default async function PostDetailPage({ params }) {
  const id = parseInt(params.id)
  if (isNaN(id)) notFound()

  const post = await prisma.post.findUnique({ where: { id } })
  if (!post) notFound()

  // Server Action: Eliminar post
  async function deletePost() {
    'use server'
    await prisma.post.delete({ where: { id } })
    revalidatePath('/posts')
    redirect('/posts')
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <Link href="/posts" className="text-blue-600 hover:underline text-sm">
        ← Volver a Posts
      </Link>

      <article className="mt-6 bg-white border border-gray-200 rounded-xl p-8 shadow-sm">
        <div className="flex justify-between items-start gap-4">
          <h1 className="text-3xl font-bold text-gray-800">{post.title}</h1>
          <span className="text-xs text-gray-400 whitespace-nowrap pt-2">ID: #{post.id}</span>
        </div>

        {/* Tags / Categorías */}
        {post.category?.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {post.category.map((tag) => (
              <span key={tag} className="bg-blue-50 text-blue-600 text-xs px-2 py-1 rounded-full">
                #{tag}
              </span>
            ))}
          </div>
        )}

        <div className="flex gap-4 text-xs text-gray-400 mt-4">
          <span>📅 Creado: {new Date(post.createdAt).toLocaleString('es-ES')}</span>
          <span>✏️ Actualizado: {new Date(post.updated_at).toLocaleString('es-ES')}</span>
        </div>

        <hr className="my-6 border-gray-200" />

        <div className="prose prose-gray max-w-none text-gray-700 leading-relaxed">
          {post.content}
        </div>

        {/* Acciones */}
        <div className="flex gap-3 mt-8 pt-6 border-t border-gray-100">
          <Link
            href={`/posts/${post.id}/edit`}
            className="bg-yellow-400 text-yellow-900 px-4 py-2 rounded-lg hover:bg-yellow-500 transition font-medium"
          >
            ✏️ Editar
          </Link>
          <form action={deletePost}>
            <button
              type="submit"
              className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition font-medium"
              onClick={(e) => !confirm('¿Seguro que deseas eliminar este post?') && e.preventDefault()}
            >
              🗑️ Eliminar
            </button>
          </form>
        </div>
      </article>
    </div>
  )
}
