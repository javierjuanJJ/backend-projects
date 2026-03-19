// app/posts/new/page.js
import prisma from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import Link from 'next/link'

export default function NewPostPage() {
  // Server Action: crear post
  async function createPost(formData) {
    'use server'
    const title = formData.get('title')
    const content = formData.get('content')
    const categoryRaw = formData.get('category')

    // Convertir string con comas a array de tags
    const category = categoryRaw
      ? categoryRaw.split(',').map((t) => t.trim()).filter(Boolean)
      : []

    await prisma.post.create({
      data: { title, content, category },
    })

    revalidatePath('/posts')
    redirect('/posts')
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Link href="/posts" className="text-blue-600 hover:underline text-sm">
        ← Volver a Posts
      </Link>
      <h1 className="text-2xl font-bold mt-4 mb-6 text-gray-800">➕ Crear Nuevo Post</h1>

      <form action={createPost} className="space-y-5 bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
            Título *
          </label>
          <input
            type="text"
            id="title"
            name="title"
            placeholder="Ej: Introducción a Next.js"
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
            placeholder="Escribe el contenido del post aquí..."
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
            placeholder="nextjs, react, tutorial"
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition font-medium text-lg"
        >
          Crear Post
        </button>
      </form>
    </div>
  )
}
