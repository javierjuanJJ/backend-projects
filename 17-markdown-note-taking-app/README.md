# 📝 Markdown Notes API

API REST para tomar notas en formato Markdown. Construida con **Express**, **Prisma ORM** y la librería **marked**.

## Stack

| Capa | Tecnología |
|------|-----------|
| Framework | Express 4 |
| ORM | Prisma 6 (SQLite en dev, PostgreSQL en prod) |
| Markdown | marked 14 |
| Validación | Zod 3 |
| Subida de archivos | Multer (memoria) |
| CORS | cors + configuración personalizada |

---

## Estructura del proyecto

```
markdown-notes-api/
├── prisma/
│   ├── schema.prisma          ← modelo Note
│   └── seed.js                ← datos de ejemplo
├── src/
│   ├── app.js                 ← punto de entrada Express
│   ├── config/
│   │   └── index.js           ← DEFAULTS, ACCEPTED_ORIGINS
│   ├── lib/
│   │   └── prisma.js          ← singleton PrismaClient
│   ├── controllers/
│   │   └── notes.js           ← lógica de cada endpoint
│   ├── middlewares/
│   │   ├── cors.js            ← corsMiddleware configurable
│   │   ├── upload.js          ← multer (memoria, filtra .md/.txt)
│   │   └── validate.js        ← wrappers Zod para cada ruta
│   ├── models/
│   │   └── note.js            ← NoteModel (Prisma + marked + checkGrammar)
│   ├── routes/
│   │   └── notes.js           ← Router Express
│   └── schemas/
│       └── notes.js           ← schemas Zod
├── .env.example
├── .gitignore
└── package.json
```

---

## Puesta en marcha

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar variables de entorno

```bash
cp .env.example .env
# Editar .env si es necesario
```

### 3. Generar cliente Prisma y migrar base de datos

```bash
npx prisma generate
npx prisma migrate dev --name init
```

### 4. Poblar con datos de ejemplo (opcional)

```bash
npm run db:seed
```

### 5. Arrancar el servidor

```bash
npm run dev      # desarrollo (--watch)
npm start        # producción
```

El servidor estará disponible en `http://localhost:3000`.

---

## Endpoints

### `GET /health`
Health check del servidor.

---

### `GET /notes`
Lista todas las notas con paginación y filtros.

**Query params:**

| Param | Tipo | Default | Descripción |
|-------|------|---------|-------------|
| `search` | string | — | Busca en título y contenido |
| `tag` | string | — | Filtra por tag |
| `limit` | number | 10 | Notas por página (1–100) |
| `offset` | number | 0 | Desplazamiento |
| `orderBy` | string | `createdAt` | Campo de orden (`createdAt`, `updatedAt`, `title`) |
| `order` | string | `desc` | Dirección (`asc` o `desc`) |

**Respuesta:**
```json
{
  "data": [...],
  "total": 5,
  "limit": 10,
  "offset": 0
}
```

---

### `POST /notes`
Crea una nueva nota. Acepta dos formatos:

**A) JSON body:**
```json
{
  "title": "Mi nota",
  "content": "# Hola\n\nEsto es **markdown**.",
  "tags": "personal,ideas"
}
```

**B) `multipart/form-data` con archivo `.md`:**
```
field: title  → "Mi nota"
field: tags   → "personal"
field: file   → archivo.md   (campo obligatorio)
```

---

### `POST /notes/check`
Comprueba la gramática/estructura de un texto Markdown **sin guardar**.

**Body:**
```json
{ "content": "# Mi título\n\n```js\nconsole.log('hola')\n```" }
```

**Respuesta:**
```json
{
  "summary": { "errors": 0, "warnings": 0, "info": 1, "valid": true },
  "issues": [
    { "type": "info", "rule": "consecutive-headings", "line": 3, "message": "..." }
  ]
}
```

---

### `GET /notes/:id`
Devuelve una nota completa incluyendo el contenido Markdown.

---

### `PUT /notes/:id`
Reemplaza completamente una nota. Requiere todos los campos obligatorios (`title`, `content`).

---

### `PATCH /notes/:id`
Actualiza parcialmente una nota. Solo los campos enviados son modificados.

---

### `DELETE /notes/:id`
Elimina una nota. Devuelve `{ "message": "Nota eliminada correctamente", "id": "..." }`.

---

### `GET /notes/:id/render`
Devuelve el HTML renderizado del contenido Markdown de la nota.

**Respuesta:**
```json
{
  "id": "clxyz...",
  "title": "Mi nota",
  "html": "<h1>Mi nota</h1><p>Esto es <strong>markdown</strong>.</p>"
}
```

---

### `POST /notes/:id/check`
Comprueba la gramática de una nota ya guardada.

**Respuesta:** igual que `POST /notes/check` pero incluye `id` y `title`.

---

## Reglas de gramática que se comprueban

| Regla | Tipo | Descripción |
|-------|------|-------------|
| `bom-chars` | warning | Caracteres BOM / zero-width |
| `heading-space` | error | Heading `#` sin espacio posterior |
| `empty-link-text` | warning | Link con texto vacío |
| `empty-link-url` | error | Link con URL vacía |
| `missing-alt` | warning | Imagen sin texto alternativo |
| `unclosed-code-block` | error | Bloque de código sin cerrar |
| `list-style` | info | Mezcla de `- ` y `* ` en listas |
| `consecutive-headings` | info | Dos encabezados seguidos sin contenido |
| `table-columns` | error | Tabla con número inconsistente de columnas |

---

## Variables de entorno

| Variable | Default | Descripción |
|----------|---------|-------------|
| `DATABASE_URL` | `file:./dev.db` | Cadena de conexión Prisma |
| `PORT` | `3000` | Puerto del servidor |
| `NODE_ENV` | `development` | Entorno (`development` / `production` / `test`) |
| `ACCEPTED_ORIGINS` | *(lista interna)* | Orígenes CORS extra, separados por coma |

---

## Scripts npm

| Script | Descripción |
|--------|-------------|
| `npm run dev` | Servidor con hot reload (`--watch`) |
| `npm start` | Servidor en producción |
| `npm run db:migrate` | Crear/aplicar migraciones Prisma |
| `npm run db:generate` | Regenerar Prisma Client |
| `npm run db:seed` | Poblar con datos de ejemplo |
| `npm run db:studio` | Abrir Prisma Studio en el navegador |
| `npm run db:reset` | Resetear base de datos y re-sembrar |
