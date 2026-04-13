// src/controllers/notes.js
import { NoteModel } from '../models/note.js'
import { DEFAULTS } from '../config/index.js'

export class NoteController {

  // GET /notes — Listar notas con paginación y filtros
  static async getAll(req, res) {
    const {
      search,
      tag,
      limit   = DEFAULTS.LIMIT_PAGINATION,
      offset  = DEFAULTS.LIMIT_OFFSET,
      orderBy = 'createdAt',
      order   = 'desc',
    } = req.query

    try {
      const { notes, total } = await NoteModel.getAll({
        search, tag, limit, offset, orderBy, order,
      })

      return res.json({
        data:    notes,
        total,
        limit:   Number(limit),
        offset:  Number(offset),
      })
    } catch (error) {
      console.error('[NoteController.getAll]', error)
      return res.status(500).json({ error: 'Error interno al obtener las notas' })
    }
  }

  // GET /notes/:id — Obtener una nota por id
  static async getById(req, res) {
    const { id } = req.params

    try {
      const note = await NoteModel.getById(id)

      if (!note) {
        return res.status(404).json({ error: 'Nota no encontrada' })
      }

      return res.json(note)
    } catch (error) {
      console.error('[NoteController.getById]', error)
      return res.status(500).json({ error: 'Error interno al obtener la nota' })
    }
  }

  // POST /notes — Crear una nota (JSON o archivo .md subido vía multer)
  static async create(req, res) {
    const { title, content, tags } = req.body

    // Si se subió un archivo, tomamos su contenido
    const fileContent = req.file
      ? req.file.buffer.toString('utf-8')
      : null

    const finalContent = fileContent ?? content
    const filename     = req.file?.originalname ?? null

    try {
      const newNote = await NoteModel.create({
        title,
        content: finalContent,
        filename,
        tags,
      })

      return res.status(201).json(newNote)
    } catch (error) {
      console.error('[NoteController.create]', error)
      return res.status(500).json({ error: 'Error interno al crear la nota' })
    }
  }

  // PUT /notes/:id — Reemplazar completamente una nota
  static async update(req, res) {
    const { id }                  = req.params
    const { title, content, tags } = req.body

    try {
      const existing = await NoteModel.getById(id)

      if (!existing) {
        return res.status(404).json({ error: 'Nota no encontrada' })
      }

      const updated = await NoteModel.update({ id, title, content, tags })
      return res.json(updated)
    } catch (error) {
      console.error('[NoteController.update]', error)
      return res.status(500).json({ error: 'Error interno al actualizar la nota' })
    }
  }

  // PATCH /notes/:id — Actualizar parcialmente una nota
  static async partialUpdate(req, res) {
    const { id }      = req.params
    const partialData = req.body

    try {
      const existing = await NoteModel.getById(id)

      if (!existing) {
        return res.status(404).json({ error: 'Nota no encontrada' })
      }

      const updated = await NoteModel.partialUpdate({ id, partialData })
      return res.json(updated)
    } catch (error) {
      console.error('[NoteController.partialUpdate]', error)
      return res.status(500).json({ error: 'Error interno al actualizar la nota' })
    }
  }

  // DELETE /notes/:id — Eliminar una nota
  static async delete(req, res) {
    const { id } = req.params

    try {
      const existing = await NoteModel.getById(id)

      if (!existing) {
        return res.status(404).json({ error: 'Nota no encontrada' })
      }

      await NoteModel.delete(id)
      return res.json({ message: 'Nota eliminada correctamente', id })
    } catch (error) {
      console.error('[NoteController.delete]', error)
      return res.status(500).json({ error: 'Error interno al eliminar la nota' })
    }
  }

  // GET /notes/:id/render — Devolver el HTML renderizado de la nota
  static async render(req, res) {
    const { id } = req.params

    try {
      const note = await NoteModel.getById(id)

      if (!note) {
        return res.status(404).json({ error: 'Nota no encontrada' })
      }

      const html = NoteModel.renderHtml(note.content)
      return res.json({ id, title: note.title, html })
    } catch (error) {
      console.error('[NoteController.render]', error)
      return res.status(500).json({ error: 'Error interno al renderizar la nota' })
    }
  }

  // POST /notes/:id/check — Comprobar la gramática/estructura Markdown
  static async checkGrammar(req, res) {
    const { id } = req.params

    try {
      const note = await NoteModel.getById(id)

      if (!note) {
        return res.status(404).json({ error: 'Nota no encontrada' })
      }

      const result = NoteModel.checkGrammar(note.content)
      return res.json({ id, title: note.title, ...result })
    } catch (error) {
      console.error('[NoteController.checkGrammar]', error)
      return res.status(500).json({ error: 'Error interno al comprobar la gramática' })
    }
  }

  // POST /notes/check — Comprobar gramática de un texto sin guardar
  static async checkGrammarRaw(req, res) {
    const { content } = req.body

    if (!content || typeof content !== 'string') {
      return res.status(400).json({ error: 'El campo "content" es obligatorio y debe ser texto' })
    }

    try {
      const result = NoteModel.checkGrammar(content)
      return res.json(result)
    } catch (error) {
      console.error('[NoteController.checkGrammarRaw]', error)
      return res.status(500).json({ error: 'Error interno al comprobar la gramática' })
    }
  }
}
