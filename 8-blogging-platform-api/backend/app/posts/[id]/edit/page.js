// app/posts/[id]/edit/page.js
import prisma from '@/lib/prisma'
import { notFound, redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import Link from 'next/link'

export default async function EditPostPage({ params }) {
  const id = parseInt(params.id)
  if (isNaN(id)) notFound()

  const post = await prisma.post.findUnique({ where: { id } })
  if (!post) notFound()

  // Server Action: actualizar post
  async function updatePost(formData) {
    'use server'
    const title = formData.get('title')
    const content = formData.get('content')
    const categoryRaw = formData.get('category')
    // Separar tags por coma, limpiar espacios, filtrar vacíos
    const category = categoryRaw
      ? categoryRaw.split(',').map((t) => t.trim()).filter(Boolean)
      : []

    await prisma.post.update({
      where: { id },
      data: { title, content, category },
    })

    revalidatePath('/posts')
    revalidatePath(`/posts/${id}`)
    redirect(`/posts/${id}`)
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Link href={`/posts/${id}`} className="text-blue-600 hover:underline text-sm">
        ← Volver al Post
      </Link>
      <h1 className="text-2xl font-bold mt-4 mb-6 text-gray-800">✏️ Editar Post #{id}</h1>

      <form action={updatePost} className="space-y-5 bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
            Título *
          </label>
          <input
            type="text"
            id="title"
            name="title"
            defaultValue={post.title}
            required
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>

        <div>
          <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
            Contenido *
          </label>
          <textarea
            id="content"
            name="content"
            defaultValue={post.content}
            required
            rows={6}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>

        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
            Categorías / Tags{' '}
            <span className="text-gray-400 font-normal">(separados por coma)</span>
          </label>
          <input
            type="text"
            id="category"
            name="category"
            defaultValue={post.category?.join(', ')}
            placeholder="nextjs, react, tutorial"
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition font-medium"
          >
            Guardar Cambios
          </button>
          <Link
            href={`/posts/${id}`}
            className="flex-1 text-center bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 transition font-medium"
          >
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  )
}
