# 🔗 ShortURL API

API REST para acortar URLs construida con **Express**, **Prisma ORM** y **nanoid**. Sigue la misma arquitectura de capas (controllers / models / routes / schemas / middleware) que un proyecto Express de referencia.

---

## 📁 Estructura del proyecto

```
shorturl-api/
├── prisma/
│   └── schema.prisma          # Modelo de BD con Prisma
├── lib/
│   └── prisma.js              # Singleton del cliente Prisma
├── models/
│   └── shortUrl.js            # Capa de datos (queries Prisma)
├── controllers/
│   └── shortUrl.js            # Lógica de negocio + respuestas HTTP
├── routes/
│   └── shorten.js             # Definición de rutas Express
├── schemas/
│   └── shortUrl.js            # Validaciones con Zod
├── middleware/
│   └── cors.js                # Middleware CORS
├── app.js                     # Entry point de Express
├── package.json
├── .env.example
└── README.md
```

---

## 🚀 Instalación y configuración

### 1. Clonar e instalar dependencias

```bash
git clone <repo>
cd shorturl-api
npm install
```

### 2. Configurar variables de entorno

```bash
cp .env.example .env
```

Edita `.env` y añade tu `DATABASE_URL`:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public"
PORT=3001
NODE_ENV=development
```

### 3. Inicializar la base de datos

```bash
# Crear tablas y generar cliente Prisma
npm run db:migrate -- --name init

# O si prefieres sin historial de migraciones (desarrollo rápido):
npm run db:push
```

### 4. Arrancar el servidor

```bash
# Desarrollo (con hot-reload)
npm run dev

# Producción
npm start
```

---

## 📡 Endpoints

### `POST /shorten`
Crea una nueva URL corta.

```bash
curl -X POST http://localhost:3001/shorten \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.example.com/some/long/url"}'
```

**Response 201:**
```json
{
  "id": "1",
  "url": "https://www.example.com/some/long/url",
  "shortCode": "abc123",
  "createdAt": "2021-09-01T12:00:00.000Z",
  "updatedAt": "2021-09-01T12:00:00.000Z"
}
```

**Response 400 (validación):**
```json
{
  "error": "Validation error",
  "details": [{ "field": "url", "message": "Debe ser una URL válida" }]
}
```

---

### `GET /shorten/:shortCode`
Obtiene la URL corta. **Incrementa `accessCount` en 1** si existe.

```bash
curl http://localhost:3001/shorten/abc123
```

**Response 200:**
```json
{
  "id": "1",
  "url": "https://www.example.com/some/long/url",
  "shortCode": "abc123",
  "createdAt": "2021-09-01T12:00:00.000Z",
  "updatedAt": "2021-09-01T12:00:00.000Z"
}
```

**Response 404:** `{ "error": "Short URL not found" }`

---

### `PUT /shorten/:shortCode`
Actualiza la URL original de un shortCode.

```bash
curl -X PUT http://localhost:3001/shorten/abc123 \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.example.com/some/updated/url"}'
```

**Response 200:**
```json
{
  "id": "1",
  "url": "https://www.example.com/some/updated/url",
  "shortCode": "abc123",
  "createdAt": "2021-09-01T12:00:00.000Z",
  "updatedAt": "2021-09-01T12:30:00.000Z"
}
```

---

### `DELETE /shorten/:shortCode`
Elimina una URL corta.

```bash
curl -X DELETE http://localhost:3001/shorten/abc123
```

**Response 204:** *(sin body)*  
**Response 404:** `{ "error": "Short URL not found" }`

---

### `GET /shorten/:shortCode/stats`
Obtiene estadísticas **sin** incrementar el contador.

```bash
curl http://localhost:3001/shorten/abc123/stats
```

**Response 200:**
```json
{
  "id": "1",
  "url": "https://www.example.com/some/long/url",
  "shortCode": "abc123",
  "createdAt": "2021-09-01T12:00:00.000Z",
  "updatedAt": "2021-09-01T12:00:00.000Z",
  "accessCount": 10
}
```

---

## 🛠️ Scripts disponibles

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Servidor con hot-reload |
| `npm start` | Servidor producción |
| `npm run db:migrate` | Crear migración y aplicarla |
| `npm run db:push` | Sincronizar schema sin migración |
| `npm run db:generate` | Regenerar cliente Prisma |
| `npm run db:studio` | Abrir Prisma Studio (GUI de BD) |
| `npm run db:reset` | Resetear BD completa |

---

## 🧱 Modelo de base de datos

```prisma
model ShortUrl {
  id          Int      @id @default(autoincrement())
  url         String
  shortCode   String   @unique
  accessCount Int      @default(0)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

---

## ⚙️ Tecnologías

- **Express** — Framework HTTP
- **Prisma ORM** — ORM tipado para PostgreSQL
- **nanoid** — Generador de IDs cortos URL-safe
- **Zod** — Validación de schemas
- **cors** — Middleware CORS
