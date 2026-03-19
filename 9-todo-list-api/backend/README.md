# Next.js + Express — Prisma ORM · Users & Tasks

Dos proyectos con la **misma arquitectura** (controllers · models · schemas · middlewares) aplicada
a dos frameworks distintos: **Express** y **Next.js App Router**.

---

## 📁 Estructura de directorios

### Express (`express-prisma-api/`)

```
src/
├── app.js                  ← Entry point (CORS global + rutas + errorHandler)
├── config/
│   └── index.js            ← DEFAULTS, JWT_SECRET, ACCEPTED_ORIGINS
├── lib/
│   ├── prisma.js           ← Singleton PrismaClient
│   └── auth.js             ← hashPassword · verifyPassword · generateToken · verifyToken
├── schemas/
│   └── index.js            ← Zod: userSchema · loginSchema · taskSchema (+ .partial())
├── middlewares/
│   └── index.js            ← corsMiddleware · requireAuth · validate() · validatePartial() · errorHandler
├── models/
│   ├── user.js             ← UserModel  (getAll · getById · getByEmail · create · update · partialUpdate · delete)
│   └── task.js             ← TaskModel  (getAll · getById · create · update · partialUpdate · delete)
├── controllers/
│   ├── user.js             ← UserController  (getAll · getId · create · login · update · partialUpdate · delete)
│   └── task.js             ← TaskController  (getAll · getId · create · update · partialUpdate · delete)
└── routes/
    ├── users.js            ← Router + middlewares de validación + controller
    └── tasks.js            ← Router + middlewares de validación + controller
prisma/
├── schema.prisma
└── seed.js
```

### Next.js (`nextjs-prisma-orm/`)

```
lib/
├── config.js               ← DEFAULTS · JWT_SECRET · ACCEPTED_ORIGINS
├── prisma.js               ← Singleton PrismaClient (global hot-reload safe)
├── auth.js                 ← hashPassword · verifyPassword · generateToken · verifyToken · requireAuth
├── schemas.js              ← Zod: validateUser · validatePartialUser · validateLogin · validateTask · validatePartialTask
├── response.js             ← ok · created · badRequest · unauthorized · forbidden · notFound · conflict · serverError · zodErrorDetails
├── cors.js                 ← addCorsHeaders · handleOptions · handlePrismaError
└── models/
    ├── user.js             ← UserModel
    └── task.js             ← TaskModel
app/api/
├── users/
│   ├── route.js            ← GET (lista) · POST (registro)
│   ├── login/route.js      ← POST (login)
│   └── [id]/route.js       ← GET · PUT · PATCH · DELETE
└── tasks/
    ├── route.js            ← GET (lista + filtros) · POST (crear)
    └── [id]/route.js       ← GET · PUT · PATCH · DELETE
prisma/
├── schema.prisma
└── seed.js
```

---

## ⚙️ Setup inicial (igual para ambos proyectos)

```bash
# 1. Copiar variables de entorno
cp .env.example .env
# Editar .env → DATABASE_URL y JWT_SECRET

# 2. Instalar dependencias
npm install

# 3. Crear tablas en PostgreSQL
npx prisma migrate dev --name init

# 4. Generar Prisma Client
npx prisma generate

# 5. Poblar con datos de ejemplo
npm run prisma:seed

# 6. Arrancar
npm run dev          # Express: http://localhost:3001
npm run dev          # Next.js: http://localhost:3000
```

---

## 🗄 Modelos Prisma

### User
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | Int PK | Auto-incremental |
| `name` | String | Nombre |
| `email` | String UNIQUE | Email |
| `password` | String | **Hash bcrypt** (12 rondas) |
| `token` | String? | JWT guardado en DB |
| `createdAt` | DateTime | Auto |
| `updatedAt` | DateTime | Auto |

### Task
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | Int PK | Auto-incremental |
| `title` | String | Título |
| `description` | String | Descripción |
| `userId` | Int FK | Relación con User (cascade delete) |
| `createdAt` | DateTime | Auto |
| `updatedAt` | DateTime | Auto |

---

## ✅ Validaciones Zod

| Schema | Reglas |
|--------|--------|
| `name` | string · min 2 · max 80 · trim |
| `email` | string · email válido · toLowerCase |
| `password` | string · min 6 · max 100 |
| `title` | string · min 3 · max 120 · trim |
| `description` | string · min 5 · trim |

Los errores Zod se devuelven con formato uniforme en ambos proyectos:
```json
{
  "error": "Datos inválidos",
  "details": [
    { "field": "email",    "message": "El email no tiene un formato válido" },
    { "field": "password", "message": "La contraseña debe tener al menos 6 caracteres" }
  ]
}
```

---

## 🔐 Seguridad

- **Contraseñas**: cifradas con `bcrypt` (12 rondas de sal). Nunca se devuelven al cliente.
- **JWT**: firmado con `JWT_SECRET`, expira en 7 días. Se guarda en el campo `token` del usuario.
- **Rutas protegidas**: requieren `Authorization: Bearer <token>`.
- **Ownership**: sólo el propietario puede editar/borrar su usuario o sus tasks (403 si no).

---

## 📡 Endpoints

### 👤 Users

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| `POST` | `/users` | ✗ | Registro (devuelve JWT) |
| `POST` | `/users/login` | ✗ | Login (devuelve JWT) |
| `GET` | `/users` | ✗ | Listar · `?search=` · `?limit=` · `?offset=` |
| `GET` | `/users/:id` | ✗ | Detalle + tasks del usuario |
| `PUT` | `/users/:id` | 🔒 | Actualización completa |
| `PATCH` | `/users/:id` | 🔒 | Actualización parcial |
| `DELETE` | `/users/:id` | 🔒 | Eliminar (cascade tasks) |

### 📋 Tasks

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| `GET` | `/tasks` | ✗ | Listar todas |
| `GET` | `/tasks?id=5` | ✗ | **Filtro por ID exacto** |
| `GET` | `/tasks?search=texto` | ✗ | **Busca en title Y description** |
| `GET` | `/tasks?title=texto` | ✗ | **Busca solo en title** |
| `GET` | `/tasks?userId=2` | ✗ | Filtra por propietario |
| `GET` | `/tasks/:id` | ✗ | Detalle de una task |
| `POST` | `/tasks` | 🔒 | Crear task |
| `PUT` | `/tasks/:id` | 🔒 | Actualización completa |
| `PATCH` | `/tasks/:id` | 🔒 | Actualización parcial |
| `DELETE` | `/tasks/:id` | 🔒 | Eliminar |

---

## 🧪 Ejemplos curl

```bash
# Registrar
curl -X POST http://localhost:3001/users \
  -H "Content-Type: application/json" \
  -d '{"name":"Juan","email":"juan@test.com","password":"secret123"}'

# Login y guardar token
TOKEN=$(curl -s -X POST http://localhost:3001/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":"juan@test.com","password":"secret123"}' | jq -r '.data.token')

# Crear task
curl -X POST http://localhost:3001/tasks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"title":"Mi tarea","description":"Descripción detallada de la tarea"}'

# Filtrar por texto en title y description
curl "http://localhost:3001/tasks?search=detallada"

# Filtrar por ID exacto
curl "http://localhost:3001/tasks?id=1"

# PATCH — actualización parcial
curl -X PATCH http://localhost:3001/tasks/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"title":"Título actualizado"}'

# Eliminar
curl -X DELETE http://localhost:3001/tasks/1 \
  -H "Authorization: Bearer $TOKEN"
```

---

## 🔄 Comandos Prisma

```bash
npx prisma migrate dev --name nombre   # Nueva migración
npx prisma generate                    # Regenerar cliente
npx prisma db seed                     # Ejecutar seed
npx prisma studio                      # UI visual → localhost:5555
npx prisma migrate reset               # ⚠️ Resetear DB (borra datos)
```
