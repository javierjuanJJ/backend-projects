# 🏋️ Workout Tracker API

API RESTful para rastrear entrenamientos y progreso de usuarios, construida con **Next.js + Express**, **Prisma ORM**, **JWT** y **PostgreSQL**.

---

## 🗂️ Estructura del proyecto

```
workout-tracker/
├── src/
│   ├── app/
│   │   └── api/                    # Rutas API de Next.js (entry points)
│   │       ├── auth/
│   │       │   ├── register/route.js
│   │       │   └── login/route.js
│   │       ├── exercises/
│   │       │   └── route.js
│   │       ├── workouts/
│   │       │   ├── route.js
│   │       │   └── [id]/
│   │       │       └── route.js
│   │       └── reports/
│   │           └── route.js
│   ├── server/                     # Lógica Express
│   │   ├── app.js                  # Express app
│   │   ├── config.js               # Constantes globales
│   │   ├── controllers/
│   │   │   ├── auth.controller.js
│   │   │   ├── exercises.controller.js
│   │   │   ├── workouts.controller.js
│   │   │   └── reports.controller.js
│   │   ├── middlewares/
│   │   │   ├── cors.js
│   │   │   ├── auth.middleware.js
│   │   │   └── error.middleware.js
│   │   ├── models/
│   │   │   ├── user.model.js
│   │   │   ├── exercise.model.js
│   │   │   ├── workout.model.js
│   │   │   └── workoutDetail.model.js
│   │   ├── routes/
│   │   │   ├── auth.routes.js
│   │   │   ├── exercises.routes.js
│   │   │   ├── workouts.routes.js
│   │   │   └── reports.routes.js
│   │   └── schemas/
│   │       ├── auth.schema.js
│   │       └── workout.schema.js
│   └── lib/
│       └── prisma.js               # Cliente Prisma singleton
├── prisma/
│   ├── schema.prisma
│   └── seed.js
├── tests/
│   ├── auth.test.js
│   ├── exercises.test.js
│   ├── workouts.test.js
│   └── reports.test.js
├── .github/
│   ├── workflows/
│   │   ├── ci.yml
│   │   └── deploy.yml
│   └── copilot/
│       └── agents/
│           └── nextjs-express-api.agent.md
├── copilot/
│   ├── agents/
│   ├── skills/
│   └── instructions/
├── ansible/
│   ├── playbook.yml
│   └── inventory.ini
├── docker-compose.yml
├── docker-compose.prod.yml
├── Dockerfile
├── .env.example
└── README.md
```

---

## 🚀 Tecnologías

| Capa | Tecnología |
|------|-----------|
| Framework | Next.js 14 + Express |
| ORM | Prisma |
| Base de datos | PostgreSQL |
| Autenticación | JWT (jsonwebtoken) |
| Validación | Zod |
| Tests | Vitest |
| Package Manager | pnpm |
| Contenedores | Docker + Docker Compose |
| CI/CD | GitHub Actions |
| Deploy | Cubepath |

---

## ⚡ Inicio rápido

### Prerrequisitos
- Node.js >= 20
- pnpm >= 9
- Docker & Docker Compose

### 1. Clonar e instalar dependencias

```bash
git clone https://github.com/tu-org/workout-tracker.git
cd workout-tracker
pnpm install
```

### 2. Configurar variables de entorno

```bash
cp .env.example .env
# Edita .env con tus valores
```

### 3. Levantar base de datos

```bash
docker compose up postgres -d
```

### 4. Migrar y sembrar la base de datos

```bash
pnpm prisma migrate dev --name init
pnpm prisma db seed
```

### 5. Iniciar servidor de desarrollo

```bash
pnpm dev
```

La API estará disponible en `http://localhost:3000`

---

## 📡 Endpoints principales

### Auth
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/auth/register` | Registro de usuario |
| POST | `/api/auth/login` | Login → devuelve JWT |

### Exercises
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/exercises` | Listar ejercicios del catálogo |
| GET | `/api/exercises/:id` | Detalle de ejercicio |

### Workouts
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/workouts` | Listar entrenamientos del usuario |
| POST | `/api/workouts` | Crear entrenamiento |
| GET | `/api/workouts/:id` | Detalle de entrenamiento |
| PUT | `/api/workouts/:id` | Actualizar entrenamiento |
| PATCH | `/api/workouts/:id` | Actualización parcial |
| DELETE | `/api/workouts/:id` | Eliminar entrenamiento |

### Reports
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/reports` | Informe de entrenamientos pasados y progreso |

> Todos los endpoints de `/workouts` y `/reports` requieren header `Authorization: Bearer <token>`

---

## 🧪 Tests

```bash
# Ejecutar todos los tests
pnpm test

# Con cobertura
pnpm test:coverage

# Watch mode
pnpm test:watch
```

---

## 🐳 Docker

```bash
# Desarrollo
docker compose up

# Producción
docker compose -f docker-compose.prod.yml up -d
```

---

## 📖 Documentación API (OpenAPI)

La documentación Swagger UI está disponible en:

```
http://localhost:3000/api/docs
```

El spec OpenAPI 3.0 se genera automáticamente con `swagger-jsdoc` y se sirve con `swagger-ui-express`.

---

## 🔐 Seguridad

- Contraseñas hasheadas con **bcrypt** (salt rounds: 12)
- Tokens JWT con expiración configurable (`JWT_EXPIRES_IN`)
- CORS restrictivo — solo orígenes permitidos en `.env`
- Validación de inputs con **Zod** en todas las rutas
- Usuarios solo acceden a sus propios recursos (autorización por `user_id`)

---

## 🚢 CI/CD

El pipeline de GitHub Actions ejecuta:

1. `pnpm install`
2. Prisma generate
3. Migraciones en PostgreSQL de test
4. `pnpm test` — si fallan, **no se despliega**
5. Build de imagen Docker
6. Push a registry
7. Deploy en **Cubepath** vía Ansible

---

## 📚 Referencias

- [OpenAPI 3.0 Specification](https://swagger.io/specification/)
- [Prisma Docs](https://www.prisma.io/docs)
- [Next.js Route Handlers](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [awesome-copilot](https://github.com/github/awesome-copilot)
