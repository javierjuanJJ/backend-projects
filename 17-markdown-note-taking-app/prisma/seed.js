// prisma/seed.js
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const seedNotes = [
  {
    title: 'Bienvenida a Markdown Notes',
    filename: 'welcome.md',
    tags: 'intro,docs',
    content: `# Bienvenida a Markdown Notes

Esta es tu primera nota de ejemplo creada automáticamente.

## ¿Qué puedes hacer?

- **Crear** notas en formato Markdown
- **Subir** archivos .md directamente
- **Renderizar** el HTML de cada nota
- **Comprobar** la gramática del contenido

## Ejemplo de código

\`\`\`javascript
const nota = await NoteModel.create({
  title: 'Mi primera nota',
  content: '# Hola mundo'
})
\`\`\`

> Esta API fue construida con Express, Prisma y la librería **marked**.
`
  },
  {
    title: 'Guía de Markdown',
    filename: 'markdown-guide.md',
    tags: 'guia,markdown',
    content: `# Guía rápida de Markdown

## Formato de texto

- **Negrita**: \`**texto**\`
- *Cursiva*: \`*texto*\`
- ~~Tachado~~: \`~~texto~~\`

## Listas

### No ordenadas
- Elemento 1
- Elemento 2
  - Sub-elemento

### Ordenadas
1. Primero
2. Segundo
3. Tercero

## Tablas

| Columna 1 | Columna 2 | Columna 3 |
|-----------|-----------|-----------|
| Dato A    | Dato B    | Dato C    |

## Bloques de código

\`\`\`python
def hello():
    print("Hola desde Python")
\`\`\`
`
  }
]

async function main() {
  console.log('🌱 Iniciando seed...')
  for (const note of seedNotes) {
    await prisma.note.create({ data: note })
    console.log(`  ✓ Nota creada: "${note.title}"`)
  }
  console.log('✅ Seed completado')
}

main()
  .catch(e => { console.error('❌ Error en seed:', e); process.exit(1) })
  .finally(() => prisma.$disconnect())
