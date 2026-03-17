// app/api/posts/[id]/route.js
import prisma from '@/lib/prisma'
import { NextResponse } from 'next/server'

/**
 * GET /api/posts/:id
 * Obtiene un post por su ID
 */
export async function GET(request, { params }) {
  try {
    const id = parseInt(params.id)
    if (isNaN(id)) {
      return NextResponse.json({ success: false, error: 'ID inválido' }, { status: 400 })
    }

    const post = await prisma.post.findUnique({ where: { id } })
    if (!post) {
      return NextResponse.json({ success: false, error: 'Post no encontrado' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: post })
  } catch (error) {
    console.error('[GET /api/posts/:id]', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

/**
 * PUT /api/posts/:id
 * Actualiza un post (parcial o total)
 * Body: { title?, content?, category? }
 */
export async function PUT(request, { params }) {
  try {
    const id = parseInt(params.id)
    if (isNaN(id)) {
      return NextResponse.json({ success: false, error: 'ID inválido' }, { status: 400 })
    }

    // Verificar que el post existe
    const exists = await prisma.post.findUnique({ where: { id } })
    if (!exists) {
      return NextResponse.json({ success: false, error: 'Post no encontrado' }, { status: 404 })
    }

    const body = await request.json()
    const { title, content, category } = body

    // Construir objeto de actualización solo con los campos enviados
    const updateData = {}
    if (title !== undefined) {
      if (typeof title !== 'string' || title.trim() === '') {
        return NextResponse.json(
          { success: false, error: '"title" no puede estar vacío' },
          { status: 400 }
        )
      }
      updateData.title = title.trim()
    }
    if (content !== undefined) {
      if (typeof content !== 'string' || content.trim() === '') {
        return NextResponse.json(
          { success: false, error: '"content" no puede estar vacío' },
          { status: 400 }
        )
      }
      updateData.content = content.trim()
    }
    if (category !== undefined) {
      updateData.category = Array.isArray(category) ? category : []
    }

    const updated = await prisma.post.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    console.error('[PUT /api/posts/:id]', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

/**
 * DELETE /api/posts/:id
 * Elimina un post por ID
 */
export async function DELETE(request, { params }) {
  try {
    const id = parseInt(params.id)
    if (isNaN(id)) {
      return NextResponse.json({ success: false, error: 'ID inválido' }, { status: 400 })
    }

    // Verificar que el post existe
    const exists = await prisma.post.findUnique({ where: { id } })
    if (!exists) {
      return NextResponse.json({ success: false, error: 'Post no encontrado' }, { status: 404 })
    }

    await prisma.post.delete({ where: { id } })

    return NextResponse.json({ success: true, message: `Post #${id} eliminado correctamente` })
  } catch (error) {
    console.error('[DELETE /api/posts/:id]', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
