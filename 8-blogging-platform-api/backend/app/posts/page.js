// app/posts/page.js
import prisma from '@/lib/prisma'
import Link from 'next/link'

export default async function PostsPage({ searchParams }) {
  const search = searchParams?.search || ''
  const category = searchParams?.category || ''

  // Construir filtro dinámico
  let where = {}

  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { content: { contains: search, mode: 'insensitive' } },
    ]
  }

  if (category) {
    where.category = { has: category }
  }

  const posts = await prisma.post.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">📝 Posts</h1>
        <Link
          href="/posts/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          + Nuevo Post
        </Link>
      </div>

      {/* Formulario de búsqueda */}
      <form className="flex gap-2 mb-8" method="GET">
        <input
          type="text"
          name="search"
          defaultValue={search}
          placeholder="Buscar en título o contenido..."
          className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        <input
          type="text"
          name="category"
          defaultValue={category}
          placeholder="Filtrar por tag..."
          className="w-40 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        <button
          type="submit"
          className="bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition"
        >
          Buscar
        </button>
        {(search || category) && (
          <Link
            href="/posts"
            className="bg-red-100 text-red-600 px-4 py-2 rounded-lg hover:bg-red-200 transition"
          >
            Limpiar
          </Link>
        )}
      </form>

      {/* Resultados */}
      {posts.length === 0 ? (
        <p className="text-gray-500 text-center py-12">No se encontraron posts.</p>
      ) : (
        <ul className="space-y-4">
          {posts.map((post) => (
            <li key={post.id} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition">
              <div className="flex justify-between items-start">
                <Link href={`/posts/${post.id}`} className="text-xl font-semibold text-blue-700 hover:underline">
                  {post.title}
                </Link>
                <span className="text-xs text-gray-400 ml-4 whitespace-nowrap">
                  {new Date(post.createdAt).toLocaleDateString('es-ES')}
                </span>
              </div>
              <p className="text-gray-600 mt-2 line-clamp-2">{post.content}</p>
              {post.category?.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {post.category.map((tag) => (
                    <Link
                      key={tag}
                      href={`/posts?category=${tag}`}
                      className="bg-blue-50 text-blue-600 text-xs px-2 py-1 rounded-full hover:bg-blue-100 transition"
                    >
                      #{tag}
                    </Link>
                  ))}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      <p className="text-sm text-gray-400 mt-6 text-right">{posts.length} resultado(s)</p>
    </div>
  )
}
