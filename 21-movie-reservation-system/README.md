# 🎬 Movie Reservation System — API

> API REST para un sistema de reserva de películas construida con **Next.js 15 + Express.js + Prisma + MySQL + JWT**

[![CI/CD](https://github.com/tu-usuario/movie-reservation/actions/workflows/ci-cd.yml/badge.svg)](https://github.com/tu-usuario/movie-reservation/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D20-brightgreen)](https://nodejs.org)
[![pnpm](https://img.shields.io/badge/pnpm-9-orange)](https://pnpm.io)

---

## 📋 Índice

1. [Stack tecnológico](#stack)
2. [Arquitectura](#arquitectura)
3. [Estructura de directorios](#estructura)
4. [Instalación rápida](#instalación)
5. [Variables de entorno](#variables-de-entorno)
6. [Endpoints](#endpoints)
7. [Flujo de reserva](#flujo-de-reserva)
8. [Tests](#tests)
9. [Docker](#docker)
10. [Despliegue (Ansible + GitHub Actions)](#despliegue)
11. [Agentes de Copilot](#agentes-de-copilot)

---

## Stack

| Capa | Tecnología | Motivo |
|---|---|---|
| Framework | Next.js 15 (App Router) + Express.js | API Routes + middleware ecosystem |
| ORM | Prisma 5 | Type-safe queries, migrations, seed |
| Base de datos | MySQL 8.0 | ACID, FK constraints, transacciones |
| Auth | JWT (Access 15min + Refresh 7d) | Stateless, seguro, renovable |
| Validación | Zod | Runtime type-safety, errores claros |
| Package manager | pnpm 9 | Rápido, eficiente en disco |
| Tests | Vitest + Supertest | Rápido, ESM nativo |
| Email | SendGrid | Transaccional + QR adjunto |
| WhatsApp | Twilio | Notificación post-reserva |
| Pagos | Stripe | Checkout seguro |
| QR | node-qrcode | Código QR de entrada |
| CI/CD | GitHub Actions | Lint → Test → Build → Deploy |
| Deploy | Ansible + Docker | Idempotente, reproducible |
| Cache | Redis 7 | Horarios del día, rate-limiting |

---

## Arquitectura

```
┌─────────────────────────────────────────────────────────┐
│                   Next.js App Router                     │
│              src/app/api/[...slug]/route.js              │
│          (catch-all que delega en Express)               │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│                   Express App (src/app.js)               │
│    corsMiddleware → express.json → routes → errorHandler │
└──────────────────────┬──────────────────────────────────┘
                       │
          ┌────────────┼────────────┐
          │            │            │
    ┌─────▼─────┐ ┌───▼────┐ ┌────▼─────┐
    │  Routes   │ │  Auth  │ │  Admin   │
    │  /movies  │ │  JWT   │ │  roles   │
    │  /showtim │ │ middle │ │ middle   │
    │  /reserv  │ │  ware  │ │  ware    │
    └─────┬─────┘ └───┬────┘ └────┬─────┘
          │            │            │
    ┌─────▼────────────▼────────────▼─────┐
    │           Controllers               │
    │  (validan Zod, llaman a Models)     │
    └─────────────────┬───────────────────┘
                      │
    ┌─────────────────▼───────────────────┐
    │        Models (Prisma ORM)          │
    │   $transaction para overbooking     │
    └─────────────────┬───────────────────┘
                      │
    ┌─────────────────▼───────────────────┐
    │           MySQL 8.0                 │
    │  genres, users, movies, rooms,      │
    │  seats, showtimes, reservations     │
    └─────────────────────────────────────┘
          │                     │
   ┌──────▼──────┐      ┌───────▼──────┐
   │   Services  │      │    Redis      │
   │ SendGrid QR │      │   (cache)     │
   │ Twilio      │      └──────────────┘
   │ Stripe      │
   └─────────────┘
```

---

## Estructura

```
movie-reservation/
├── .github/
│   ├── workflows/
│   │   └── ci-cd.yml              # Pipeline completo
│   ├── agents/
│   │   ├── api-architect.agent.md # Agente diseño de API
│   │   ├── prisma-db.agent.md     # Agente Prisma/queries
│   │   └── tdd-movie-api.agent.md # Agente tests
│   └── copilot-instructions.md    # Instrucciones globales Copilot
├── src/
│   ├── app/
│   │   └── api/[...slug]/route.js # Catch-all Next.js → Express
│   ├── controllers/               # Lógica de negocio por recurso
│   │   ├── auth.controller.js
│   │   ├── movies.controller.js
│   │   ├── showtimes.controller.js
│   │   ├── reservations.controller.js
│   │   ├── genres.controller.js
│   │   ├── rooms.controller.js
│   │   └── admin.controller.js
│   ├── models/                    # Queries Prisma por entidad
│   │   ├── user.model.js
│   │   ├── movie.model.js
│   │   ├── showtime.model.js
│   │   ├── reservation.model.js   # ⚠️ $transaction anti-overbooking
│   │   ├── genre.model.js
│   │   └── room.model.js
│   ├── middlewares/
│   │   ├── auth.middleware.js      # Verifica JWT
│   │   ├── roles.middleware.js     # requireRole('admin')
│   │   ├── cors.middleware.js      # CORS configurable
│   │   └── error.middleware.js     # Handler global
│   ├── schemas/                   # Validaciones Zod
│   │   ├── auth.schema.js
│   │   ├── movie.schema.js
│   │   ├── showtime.schema.js
│   │   └── reservation.schema.js
│   ├── services/                  # Integraciones externas
│   │   ├── email.service.js       # SendGrid + QR en email
│   │   ├── whatsapp.service.js    # Twilio WhatsApp
│   │   ├── stripe.service.js      # Pagos
│   │   ├── qr.service.js          # node-qrcode
│   │   └── notification.service.js# Orquestador
│   ├── routes/                    # Routers Express
│   │   ├── index.js
│   │   ├── auth.routes.js
│   │   ├── movies.routes.js
│   │   ├── showtimes.routes.js
│   │   ├── reservations.routes.js
│   │   ├── genres.routes.js
│   │   ├── rooms.routes.js
│   │   └── admin.routes.js
│   ├── lib/
│   │   └── prisma.js              # Singleton cliente Prisma
│   ├── config.js                  # Constantes globales
│   └── app.js                     # Express app
├── prisma/
│   ├── schema.prisma              # Schema completo con enums
│   └── seed.js                    # Datos iniciales (admin + géneros + salas)
├── tests/
│   ├── setup.js                   # Setup global + mocks externos
│   ├── helpers.js                 # Factories y utilidades
│   ├── auth.test.js
│   ├── movies.test.js
│   ├── showtimes.test.js
│   ├── reservations.test.js       # ⚠️ Tests anti-overbooking
│   └── admin.test.js
├── ansible/
│   ├── playbook.yml               # Deploy + rollback + limpieza
│   └── vars.yml                   # Variables (rellenar en CI)
├── Dockerfile                     # Multi-stage: dev | builder | prod
├── docker-compose.yml             # MySQL + Redis + API + Prisma Studio
├── next.config.js
├── vitest.config.js
├── package.json
├── .env.example
└── .gitignore
```

---

## Instalación

### Opción A — Local con Docker (recomendado)

```bash
# 1. Clonar
git clone https://github.com/tu-usuario/movie-reservation.git
cd movie-reservation

# 2. Copiar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales de SendGrid, Stripe, Twilio...

# 3. Levantar MySQL + Redis
docker compose up -d db redis

# 4. Instalar dependencias
pnpm install

# 5. Generar cliente Prisma
pnpm prisma generate

# 6. Ejecutar migraciones
pnpm prisma:migrate

# 7. Seed inicial (admin + géneros + salas + películas)
pnpm prisma:seed

# 8. Iniciar servidor de desarrollo
pnpm dev
```

API disponible en: `http://localhost:3000/api`

### Opción B — Stack completo con Docker

```bash
cp .env.example .env
# Editar .env

docker compose up -d
```

---

## Variables de entorno

| Variable | Descripción | Ejemplo |
|---|---|---|
| `DATABASE_URL` | Conexión MySQL | `mysql://user:pass@localhost:3306/db` |
| `JWT_ACCESS_SECRET` | Secreto access token | `string-larga-aleatoria` |
| `JWT_REFRESH_SECRET` | Secreto refresh token | `string-larga-aleatoria` |
| `JWT_ACCESS_EXPIRES_IN` | Duración access token | `15m` |
| `JWT_REFRESH_EXPIRES_IN` | Duración refresh token | `7d` |
| `CORS_ALLOWED_ORIGINS` | Orígenes permitidos (coma) | `http://localhost:5173` |
| `SENDGRID_API_KEY` | API Key de SendGrid | `SG.xxx...` |
| `SENDGRID_FROM_EMAIL` | Email remitente | `noreply@cinema.com` |
| `STRIPE_SECRET_KEY` | Clave secreta Stripe | `sk_test_xxx...` |
| `STRIPE_WEBHOOK_SECRET` | Secreto webhook Stripe | `whsec_xxx...` |
| `TWILIO_ACCOUNT_SID` | Account SID Twilio | `ACxxx...` |
| `TWILIO_AUTH_TOKEN` | Auth Token Twilio | `xxx...` |
| `TWILIO_WHATSAPP_FROM` | Número WhatsApp | `whatsapp:+14155238886` |
| `REDIS_URL` | URL de Redis | `redis://localhost:6379` |
| `QR_BASE_URL` | URL base para QR | `https://tu-app.com` |
| `ADMIN_EMAIL` | Email admin seed | `admin@cinema.com` |
| `ADMIN_PASSWORD` | Password admin seed | `Admin1234!` |

---

## Endpoints

### 🔓 Públicos

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/api/health` | Health check |
| `GET` | `/api/movies` | Listar películas (paginado, filtrable) |
| `GET` | `/api/movies/:id` | Detalle película con funciones próximas |
| `GET` | `/api/genres` | Listar géneros |
| `GET` | `/api/showtimes` | Listar funciones (filtro por fecha/película) |
| `GET` | `/api/showtimes/:id` | Detalle función |
| `POST` | `/api/auth/register` | Registrar usuario |
| `POST` | `/api/auth/login` | Iniciar sesión → tokens |
| `POST` | `/api/auth/refresh` | Renovar access token |

### 🔐 Requieren autenticación (cualquier usuario)

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/api/auth/me` | Perfil del usuario actual |
| `GET` | `/api/showtimes/:id/seats` | Ver asientos disponibles |
| `GET` | `/api/reservations` | Mis reservas |
| `GET` | `/api/reservations/:id` | Detalle de una reserva |
| `POST` | `/api/reservations` | Crear reserva (atómica, anti-overbooking) |
| `DELETE` | `/api/reservations/:id` | Cancelar reserva propia |

### 👑 Solo Admin

| Método | Ruta | Descripción |
|---|---|---|
| `POST` | `/api/movies` | Crear película |
| `PUT` | `/api/movies/:id` | Actualizar película |
| `PATCH` | `/api/movies/:id` | Actualizar parcialmente |
| `DELETE` | `/api/movies/:id` | Soft-delete película |
| `POST` | `/api/genres` | Crear género |
| `PUT` | `/api/genres/:id` | Actualizar género |
| `DELETE` | `/api/genres/:id` | Eliminar género |
| `GET` | `/api/rooms` | Listar salas |
| `POST` | `/api/rooms` | Crear sala con asientos |
| `POST` | `/api/showtimes` | Crear función |
| `DELETE` | `/api/showtimes/:id` | Eliminar función |
| `GET` | `/api/admin/users` | Listar usuarios |
| `PATCH` | `/api/admin/users/:id/promote` | Promover a admin |
| `GET` | `/api/admin/reservations` | Ver todas las reservas |
| `GET` | `/api/admin/reports/stats` | Dashboard ingresos/ocupación |

---

## Flujo de Reserva

```
1. Usuario se autentica  →  POST /api/auth/login
                                      ↓
2. Consulta funciones    →  GET /api/showtimes?date=2025-12-25
                                      ↓
3. Ver asientos libres   →  GET /api/showtimes/:id/seats
                                      ↓
4. Reservar              →  POST /api/reservations
                            { showtimeId, seatIds: ["A1","A2"] }
                                      ↓
                    ┌─── prisma.$transaction ───┐
                    │ 1. Verificar función futura│
                    │ 2. Verificar asientos válid│
                    │ 3. Comprobar disponibilidad│  ← previene race conditions
                    │ 4. Calcular precio total   │
                    │ 5. Crear Reservation +     │
                    │    ReservationSeats        │
                    └───────────────────────────┘
                                      ↓
5. Notificaciones        →  Email con QR (SendGrid)
   (async, no bloquea)      WhatsApp (Twilio)
```

---

## Tests

```bash
# Todos los tests
pnpm test

# Con cobertura
pnpm test:coverage

# Watch mode
pnpm test:watch
```

**Cobertura mínima exigida:** 70% líneas / 70% funciones / 60% ramas

Los servicios externos (SendGrid, Twilio, Stripe) se mockean automáticamente en `tests/setup.js`.

### Qué se testea

| Suite | Tests |
|---|---|
| `auth.test.js` | Registro, login, refresh, /me, validaciones Zod |
| `movies.test.js` | CRUD, soft-delete, roles, paginación, filtros |
| `showtimes.test.js` | Listado, asientos disponibles, creación admin |
| `reservations.test.js` | **Anti-overbooking**, cancelación, permisos |
| `admin.test.js` | Reportes, listado users, promoción a admin |

---

## Docker

```bash
# Solo infraestructura
docker compose up -d db redis

# Stack completo
docker compose up -d

# Prisma Studio (interfaz visual de BD)
docker compose --profile dev up -d prisma-studio
# Abre http://localhost:5555

# Logs de la API
docker compose logs -f api
```

---

## Despliegue

El despliegue es **automático** mediante GitHub Actions al hacer push a `main`:

```
push a main
    ↓
1. lint         → ESLint
2. test         → Vitest + MySQL en servicio de Actions
3. build        → Docker image → push a ghcr.io
4. deploy       → Ansible sobre Cubepath
5. health check → GET /api/health (retry 10x)
```

Si el health check falla, el job queda en rojo y el despliegue se considera fallido.

### Secrets de GitHub necesarios

```
CUBEPATH_SSH_KEY      # Clave SSH para conectar al servidor
CUBEPATH_HOST         # IP/hostname de Cubepath
CUBEPATH_USER         # Usuario SSH (ej: deploy)
CUBEPATH_APP_URL      # URL pública de la app
DATABASE_URL          # MySQL de producción
JWT_ACCESS_SECRET     # Secret para JWT
JWT_REFRESH_SECRET    # Secret para JWT refresh
SENDGRID_API_KEY      # SendGrid
STRIPE_SECRET_KEY     # Stripe
TWILIO_ACCOUNT_SID    # Twilio
TWILIO_AUTH_TOKEN     # Twilio
REDIS_URL             # Redis de producción
GHCR_TOKEN            # Token GHCR para Ansible (pull)
CODECOV_TOKEN         # (opcional) cobertura en codecov.io
```

### Deploy manual con Ansible

```bash
cd ansible
cp vars.yml vars_local.yml
# Editar vars_local.yml con tus valores

ansible-playbook -i inventory.ini playbook.yml -e @vars_local.yml
```

### Rollback manual

```bash
ansible-playbook -i inventory.ini playbook.yml --tags rollback
```

---

## Agentes de Copilot

Este proyecto incluye 3 agentes personalizados en `.github/agents/`:

### `@api-architect`
Diseña nuevos endpoints siguiendo los patrones del proyecto:
- Estructura controllers → models → schemas → routes
- Convenciones de respuesta `{ data, total, limit, offset }`
- Manejo de errores con status codes correctos

### `@prisma-db`
Genera queries Prisma avanzadas:
- Transacciones `$transaction` para operaciones críticas
- Queries de asientos disponibles con anti-overbooking
- Seeds y migraciones

### `@tdd-movie-api`
Genera tests Vitest + Supertest:
- Plantillas para happy path + casos de error
- Tests de autorización (401, 403)
- Tests anti-overbooking con múltiples usuarios

---

## Decisiones de Diseño

**¿Por qué soft deletes en películas?**
Permite mantener el historial de reservas intacto. Una reserva apunta a una función que apunta a una película. Si borráramos la película físicamente, las reservas quedarían huérfanas.

**¿Por qué `prisma.$transaction` para reservas?**
Sin transacción, dos usuarios podrían leer el mismo asiento como "disponible" y ambos completar la reserva (overbooking). La transacción serializa las escrituras garantizando atomicidad.

**¿Por qué Access Token corto (15min) + Refresh Token largo (7d)?**
Si el access token se compromete, expira en 15 minutos. El refresh token permite renovarlo sin que el usuario vuelva a hacer login, mejorando la UX sin sacrificar seguridad.

---

## Licencia

MIT © 2025
