// src/models/note.js
import prisma from '../lib/prisma.js'
import { marked } from 'marked'
import { DEFAULTS } from '../config/index.js'

// Configurar marked con GFM habilitado (GitHub Flavored Markdown)
marked.use({ gfm: true, breaks: false })

export class NoteModel {

  // ── Listar todas las notas (con filtros y paginación) ─────────────────
  static async getAll({ search, tag, limit = DEFAULTS.LIMIT_PAGINATION, offset = DEFAULTS.LIMIT_OFFSET, orderBy = 'createdAt', order = 'desc' }) {
    const where = {}

    if (search) {
      where.OR = [
        { title:   { contains: search } },
        { content: { contains: search } },
      ]
    }

    if (tag) {
      where.tags = { contains: tag }
    }

    const [notes, total] = await prisma.$transaction([
      prisma.note.findMany({
        where,
        orderBy: { [orderBy]: order },
        take:    Number(limit),
        skip:    Number(offset),
        select: {
          id:        true,
          title:     true,
          filename:  true,
          tags:      true,
          createdAt: true,
          updatedAt: true,
          // Excluimos content del listado para aligerar la respuesta
        },
      }),
      prisma.note.count({ where }),
    ])

    return { notes, total }
  }

  // ── Obtener una nota por id ───────────────────────────────────────────
  static async getById(id) {
    const note = await prisma.note.findUnique({ where: { id } })
    return note ?? null
  }

  // ── Crear una nota ────────────────────────────────────────────────────
  static async create({ title, content, filename, tags }) {
    const newNote = await prisma.note.create({
      data: {
        title:    title.trim(),
        content:  content.replace(/^[\u200B\u200C\u200D\u200E\u200F\uFEFF]/, ''), // strip BOM/ZWS
        filename: filename ?? null,
        tags:     tags    ?? null,
      },
    })
    return newNote
  }

  // ── Reemplazar completamente una nota (PUT) ───────────────────────────
  static async update({ id, title, content, filename, tags }) {
    const updated = await prisma.note.update({
      where: { id },
      data: {
        title:    title.trim(),
        content:  content.replace(/^[\u200B\u200C\u200D\u200E\u200F\uFEFF]/, ''),
        filename: filename ?? null,
        tags:     tags    ?? null,
      },
    })
    return updated
  }

  // ── Actualizar parcialmente una nota (PATCH) ──────────────────────────
  static async partialUpdate({ id, partialData }) {
    // Limpiar campos undefined para no sobreescribir con null accidentalmente
    const data = Object.fromEntries(
      Object.entries(partialData).filter(([, v]) => v !== undefined)
    )

    if (data.content) {
      data.content = data.content.replace(/^[\u200B\u200C\u200D\u200E\u200F\uFEFF]/, '')
    }

    const updated = await prisma.note.update({ where: { id }, data })
    return updated
  }

  // ── Eliminar una nota ─────────────────────────────────────────────────
  static async delete(id) {
    await prisma.note.delete({ where: { id } })
  }

  // ── Renderizar el Markdown de una nota a HTML ─────────────────────────
  static renderHtml(content) {
    const cleaned = content.replace(/^[\u200B\u200C\u200D\u200E\u200F\uFEFF]/, '')
    return marked.parse(cleaned)
  }

  // ── Comprobar la "gramática" / estructura Markdown ────────────────────
  static checkGrammar(content) {
    const issues = []
    const lines  = content.split('\n')

    // 1. Caracteres BOM / zero-width
    if (/[\u200B\u200C\u200D\u200E\u200F\uFEFF]/.test(content)) {
      issues.push({ type: 'warning', rule: 'bom-chars',        message: 'El documento contiene caracteres de ancho cero (BOM). Pueden interferir con el parseo de Markdown.' })
    }

    // 2. Headings mal formados (# sin espacio)
    lines.forEach((line, i) => {
      if (/^#{1,6}[^#\s]/.test(line)) {
        issues.push({ type: 'error', rule: 'heading-space', line: i + 1, message: `Heading sin espacio después de '#': "${line.slice(0, 40)}"` })
      }
    })

    // 3. Links con texto o URL vacíos
    const linkRe = /\[([^\]]*)\]\(([^)]*)\)/g
    let m
    while ((m = linkRe.exec(content)) !== null) {
      if (!m[1].trim()) issues.push({ type: 'warning', rule: 'empty-link-text', message: `Link con texto vacío. URL: "${m[2] || '(vacía)'}"` })
      if (!m[2].trim()) issues.push({ type: 'error',   rule: 'empty-link-url',  message: `Link con URL vacía. Texto: "${m[1]}"` })
    }

    // 4. Imágenes sin alt text
    const imgRe = /!\[([^\]]*)\]\([^)]+\)/g
    while ((m = imgRe.exec(content)) !== null) {
      if (!m[1].trim()) issues.push({ type: 'warning', rule: 'missing-alt', message: 'Imagen sin texto alternativo (accesibilidad).' })
    }

    // 5. Bloques de código sin cerrar
    const fences = (content.match(/^```/gm) || []).length
    if (fences % 2 !== 0) {
      issues.push({ type: 'error', rule: 'unclosed-code-block', message: `Bloque de código sin cerrar: ${fences} marcas de \`\`\` (debe ser par).` })
    }

    // 6. Estilo inconsistente de listas
    const hasDash = lines.some(l => /^- /.test(l))
    const hasStar = lines.some(l => /^\* /.test(l))
    if (hasDash && hasStar) {
      issues.push({ type: 'info', rule: 'list-style', message: 'Mezcla de "- " y "* " en listas no ordenadas. Considera usar un solo estilo.' })
    }

    // 7. Headings consecutivos sin contenido
    let lastHeading = false
    lines.forEach((line, i) => {
      const isHeading = /^#{1,6}\s/.test(line)
      if (isHeading && lastHeading) {
        issues.push({ type: 'info', rule: 'consecutive-headings', line: i + 1, message: `Dos encabezados consecutivos sin contenido entre ellos (línea ${i + 1}).` })
      }
      lastHeading = isHeading
    })

    // 8. Tablas con columnas inconsistentes
    let inTable = false, tableCols = 0
    lines.forEach((line, i) => {
      if (/^\|.+\|$/.test(line)) {
        const cols = line.split('|').filter(c => c.trim()).length
        if (!inTable) { inTable = true; tableCols = cols }
        else if (cols !== tableCols) {
          issues.push({ type: 'error', rule: 'table-columns', line: i + 1, message: `Tabla malformada: esperadas ${tableCols} columnas, encontradas ${cols}.` })
        }
      } else { inTable = false; tableCols = 0 }
    })

    const summary = {
      errors:   issues.filter(i => i.type === 'error').length,
      warnings: issues.filter(i => i.type === 'warning').length,
      info:     issues.filter(i => i.type === 'info').length,
      valid:    issues.filter(i => i.type === 'error').length === 0,
    }

    return { summary, issues }
  }
}
