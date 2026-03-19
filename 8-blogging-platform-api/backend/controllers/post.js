// controllers/post.js
// Controlador de Posts — lógica HTTP desacoplada de la capa de datos

import { NextResponse } from 'next/server'
import { PostModel } from '@/models/post'
import { validatePost, validatePartialPost } from '@/schemas/post'
import { DEFAULTS } from '@/config'

export class PostController {
  /**
   * GET /api/posts
   * Query: text, id, category, limit, offset
   */
  static async getAll(request) {
    try {
      const { searchParams } = new URL(request.url)

      const params = {
        text: searchParams.get('text') || searchParams.get('search') || undefined,
        id: searchParams.get('id') || undefined,
        category: searchParams.get('category') || undefined,
        limit: searchParams.get('limit') ?? DEFAULTS.LIMIT_PAGINATION,
        offset: searchParams.get('offset') ?? DEFAULTS.LIMIT_OFFSET,
      }

      const result = await PostModel.getAll(params)

      return NextResponse.json({
        success: true,
        data: result.posts,
        total: result.total,
        limit: result.limit,
        offset: result.offset,
      })
    } catch (error) {
      console.error('[PostController.getAll]', error)
      return NextResponse.json(
        { success: false, error: 'Error interno del servidor' },
        { status: 500 }
      )
    }
  }

  /**
   * GET /api/posts/:id
   */
  static async getById(request, { params }) {
    try {
      const id = parseInt(params.id)
      if (isNaN(id) || id <= 0) {
        return NextResponse.json({ success: false, error: 'ID inválido' }, { status: 400 })
      }

      const post = await PostModel.getById(id)
      if (!post) {
        return NextResponse.json({ success: false, error: 'Post no encontrado' }, { status: 404 })
      }

      return NextResponse.json({ success: true, data: post })
    } catch (error) {
      console.error('[PostController.getById]', error)
      return NextResponse.json(
        { success: false, error: 'Error interno del servidor' },
        { status: 500 }
      )
    }
  }

  /**
   * POST /api/posts
   * Body: { title, content, category, authorId? }
   */
  static async create(request) {
    try {
      const body = await request.json()

      const result = validatePost(body)
      if (!result.success) {
        return NextResponse.json(
          { success: false, error: 'Datos inválidos', details: result.error.flatten().fieldErrors },
          { status: 400 }
        )
      }

      const post = await PostModel.create(result.data)
      return NextResponse.json({ success: true, data: post }, { status: 201 })
    } catch (error) {
      console.error('[PostController.create]', error)
      return NextResponse.json(
        { success: false, error: 'Error interno del servidor' },
        { status: 500 }
      )
    }
  }

  /**
   * PUT /api/posts/:id — actualización completa
   */
  static async update(request, { params }) {
    try {
      const id = parseInt(params.id)
      if (isNaN(id) || id <= 0) {
        return NextResponse.json({ success: false, error: 'ID inválido' }, { status: 400 })
      }

      const existing = await PostModel.getById(id)
      if (!existing) {
        return NextResponse.json({ success: false, error: 'Post no encontrado' }, { status: 404 })
      }

      const body = await request.json()
      const result = validatePost(body)
      if (!result.success) {
        return NextResponse.json(
          { success: false, error: 'Datos inválidos', details: result.error.flatten().fieldErrors },
          { status: 400 }
        )
      }

      const updated = await PostModel.update({ id, ...result.data })
      return NextResponse.json({ success: true, data: updated })
    } catch (error) {
      console.error('[PostController.update]', error)
      return NextResponse.json(
        { success: false, error: 'Error interno del servidor' },
        { status: 500 }
      )
    }
  }

  /**
   * PATCH /api/posts/:id — actualización parcial
   */
  static async partialUpdate(request, { params }) {
    try {
      const id = parseInt(params.id)
      if (isNaN(id) || id <= 0) {
        return NextResponse.json({ success: false, error: 'ID inválido' }, { status: 400 })
      }

      const existing = await PostModel.getById(id)
      if (!existing) {
        return NextResponse.json({ success: false, error: 'Post no encontrado' }, { status: 404 })
      }

      const body = await request.json()
      const result = validatePartialPost(body)
      if (!result.success) {
        return NextResponse.json(
          { success: false, error: 'Datos inválidos', details: result.error.flatten().fieldErrors },
          { status: 400 }
        )
      }

      const updated = await PostModel.partialUpdate({ id, ...result.data })
      return NextResponse.json({ success: true, data: updated })
    } catch (error) {
      console.error('[PostController.partialUpdate]', error)
      return NextResponse.json(
        { success: false, error: 'Error interno del servidor' },
        { status: 500 }
      )
    }
  }

  /**
   * DELETE /api/posts/:id
   */
  static async delete(request, { params }) {
    try {
      const id = parseInt(params.id)
      if (isNaN(id) || id <= 0) {
        return NextResponse.json({ success: false, error: 'ID inválido' }, { status: 400 })
      }

      const existing = await PostModel.getById(id)
      if (!existing) {
        return NextResponse.json({ success: false, error: 'Post no encontrado' }, { status: 404 })
      }

      await PostModel.delete(id)
      return NextResponse.json({ success: true, message: `Post #${id} eliminado correctamente` })
    } catch (error) {
      console.error('[PostController.delete]', error)
      return NextResponse.json(
        { success: false, error: 'Error interno del servidor' },
        { status: 500 }
      )
    }
  }
}
