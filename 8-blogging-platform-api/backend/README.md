# Next.js + Prisma ORM — Posts & Auth (arquitectura MVC)

Proyecto fullstack con arquitectura **Controllers / Models / Schemas / Middlewares / Routes**,
inspirada en Express pero adaptada al App Router de **Next.js 15**.
Incluye autenticación JWT, contraseñas cifradas con bcrypt, validación Zod y CORS configurado.

---

## 🗂️ Estructura del Proyecto

```
nextjs-prisma-posts/
│
├── config/
│   └── index.js              ← Constantes globales (DEFAULTS, CORS, JWT, bcrypt)
│
├── schemas/                  ← Validación Zod (equivalente a /schemas en Express)
│   ├── post.js               ← validatePost / validatePartialPost
│   └── user.js               ← validateAuth / validatePartialUser
│
├── models/                   ← Acceso a datos con Prisma (equivalente a /models)
│   ├── post.js               ← PostModel.getAll / getById / create / update / delete
│   └── user.js               ← UserModel + lógica bcrypt/token
│
├── controllers/              ← Lógica HTTP desacoplada (equivalente a /controllers)
│   ├── post.js               ← PostController (getAll, getById, create, update, patch, delete)
│   └── user.js               ← UserController (register, login, logout, me, users CRUD)
│
├── middlewares/              ← Middlewares reutilizables
│   ├── cors.js               ← applyCors() + handlePreflight()
│   └── auth.js               ← withAuth() HOF protector de rutas
│
├── routes/                   ← Conexión handlers ↔ middlewares (equivalente a /routes)
│   ├── posts.js              ← GET_posts, POST_posts, GET_post, PUT_post, PATCH_post…
│   └── users.js              ← POST_register, POST_login, GET_me, GET_users…
│
├── lib/
│   ├── prisma.js             ← Singleton Prisma Client
│   └── auth.js               ← hashPassword, verifyPassword, generateToken, getAuthPayload
│
├── prisma/
│   ├── schema.prisma         ← Modelos User + Post
│   └── seed.js               ← Datos de prueba
│
└── app/
    └── api/                  ← Route handlers de Next.js (solo delegan a /routes)
        ├── posts/route.js
        ├── posts/[id]/route.js
        ├── auth/register/route.js
        ├── auth/login/route.js
        ├── auth/logout/route.js
        ├── auth/me/route.js
        ├── users/route.js
        └── users/[id]/route.js
```

---

## 📋 Modelos de BD

### User
| Campo        | Tipo     | Descripción                               |
|-------------|----------|-------------------------------------------|
| id          | Int PK   | Autoincremental                           |
| username    | String   | Único · min 3 · solo letras/números/_     |
| password    | String   | bcrypt hash (12 rounds)                   |
| token       | String?  | JWT activo · null = sin sesión            |
| createdAt   | DateTime | Automática                                |
| updated_at  | DateTime | Automática                                |

### Post
| Campo        | Tipo     | Descripción                               |
|-------------|----------|-------------------------------------------|
| id          | Int PK   | Autoincremental                           |
| title       | String   | min 3 · max 200                           |
| content     | String   | min 10                                    |
| category    | String[] | Array de tags                             |
| authorId    | Int?     | FK → User (opcional)                      |
| createdAt   | DateTime | Automática                                |
| updated_at  | DateTime | Automática                                |

---

## 🚀 Instalación

```bash
# 1. Instalar dependencias (incluye zod, bcryptjs, jsonwebtoken)
npm install

# 2. Configurar entorno
cp .env.example .env

# 3. Generar JWT_SECRET seguro
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
# Pega el resultado en .env como JWT_SECRET

# 4. Crear tablas en BD
npm run db:migrate
# Escribe un nombre, p.ej: "init"

# 5. Poblar con datos de prueba (alice / bob)
npm run db:seed

# 6. Arrancar
npm run dev
```

---

## 🔌 API Reference

### Auth

| Método | Endpoint              | Body                        | Auth   |
|--------|-----------------------|-----------------------------|--------|
| POST   | /api/auth/register    | { username, password }      | ❌     |
| POST   | /api/auth/login       | { username, password }      | ❌     |
| POST   | /api/auth/logout      | —                           | ✅ JWT |
| GET    | /api/auth/me          | —                           | ✅ JWT |
| PUT    | /api/auth/me          | { username?, password? }    | ✅ JWT |

### Posts

| Método | Endpoint              | Body / Query                     | Auth |
|--------|-----------------------|----------------------------------|------|
| GET    | /api/posts            | ?text= &id= &category= &limit= &offset= | ❌ |
| POST   | /api/posts            | { title, content, category[] }   | ❌   |
| GET    | /api/posts/:id        | —                                | ❌   |
| PUT    | /api/posts/:id        | { title, content, category[] }   | ❌   |
| PATCH  | /api/posts/:id        | { title?, content?, category? }  | ❌   |
| DELETE | /api/posts/:id        | —                                | ❌   |

### Users

| Método | Endpoint              | Auth   |
|--------|-----------------------|--------|
| GET    | /api/users            | ✅ JWT |
| GET    | /api/users/:id        | ❌     |
| DELETE | /api/users/:id        | ✅ JWT (solo el propio usuario) |

---

## 🧪 Ejemplos cURL

```bash
# Registrar usuario
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"juan","password":"mipass123"}'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"juan","password":"mipass123"}'

# Crear post
curl -X POST http://localhost:3000/api/posts \
  -H "Content-Type: application/json" \
  -d '{"title":"Mi post","content":"Contenido del post aquí.","category":["nextjs","react"]}'

# Listar posts con búsqueda y paginación
curl "http://localhost:3000/api/posts?text=prisma&limit=5&offset=0"

# Actualización parcial PATCH
curl -X PATCH http://localhost:3000/api/posts/1 \
  -H "Content-Type: application/json" \
  -d '{"category":["actualizado"]}'

# Eliminar post
curl -X DELETE http://localhost:3000/api/posts/1

# Ver perfil con JWT
curl http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer <token>"

# Logout
curl -X POST http://localhost:3000/api/auth/logout \
  -H "Authorization: Bearer <token>"
```

---

## 🔍 Validación Zod

Los schemas en `/schemas` validan toda entrada antes de llegar al controlador:

```js
// POST /api/posts — body inválido
{
  "title": "Hi",        // ❌ min 3 chars → "El título debe tener al menos 3 caracteres"
  "content": "corto",   // ❌ min 10 chars
  "category": [123]     // ❌ debe ser array de strings
}

// Respuesta 400:
{
  "success": false,
  "error": "Datos inválidos",
  "details": {
    "title": ["El título debe tener al menos 3 caracteres"],
    "content": ["El contenido debe tener al menos 10 caracteres"]
  }
}
```

---

## 🌐 CORS

Orígenes permitidos configurados en `config/index.js`:
```js
export const CORS_ACCEPTED_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:1234',
  'http://localhost:5173',
  'http://localhost:4321',
]
```
Añade tu dominio de producción aquí. Todos los endpoints responden a preflight `OPTIONS`.

---

## 🛡️ Seguridad

- **bcrypt (12 rounds)** — contraseñas nunca en texto plano
- **JWT (HS256)** firmado con secreto de entorno, expiración configurable
- Token persistido en BD → logout real posible aunque el JWT no haya expirado
- `password` y `token` nunca devueltos en respuestas de API (Prisma `select`)
- Mensaje único en login fallido (no revela si falla usuario o contraseña)
- CORS estricto con lista blanca de orígenes

---

## 🛠️ Scripts

```bash
npm run dev          # Servidor de desarrollo
npm run build        # Build de producción
npm run db:migrate   # Aplicar migraciones Prisma
npm run db:seed      # Sembrar datos de prueba
npm run db:studio    # Abrir Prisma Studio (GUI)
npm run db:reset     # Resetear BD y re-migrar
```
