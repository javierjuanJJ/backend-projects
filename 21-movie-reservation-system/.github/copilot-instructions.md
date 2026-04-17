# GitHub Copilot Instructions — Movie Reservation System

## Contexto del Proyecto

Este proyecto es una **API REST para un sistema de reserva de películas** construida con:
- **Next.js** (App Router + API Routes)
- **Express.js** como HTTP framework
- **Prisma** como ORM sobre **MySQL**
- **JWT** para autenticación (Access Token 15min + Refresh Token 7d)
- **Zod** para validación de schemas
- **pnpm** como gestor de paquetes
- **Vitest + Supertest** para tests
- **JavaScript** (sin TypeScript)

## Estructura de Directorios

```
src/
├── app/api/          → Next.js API Routes (entrada HTTP)
├── controllers/      → Lógica de negocio por recurso
├── models/           → Queries Prisma por entidad
├── middlewares/      → Auth, CORS, roles, error handler
├── schemas/          → Validaciones Zod
├── services/         → Email (SendGrid), WhatsApp (Twilio), QR, Stripe
└── lib/prisma.js     → Cliente Prisma singleton
```

## Convenciones de Código

### SIEMPRE
- Usar `import/export` ES Modules (no `require`)
- Usar clases estáticas para Controllers y Models
- Validar con Zod en el router ANTES de llegar al controller
- Usar `prisma.$transaction()` para operaciones multi-tabla
- Usar soft deletes (`deletedAt`) en movies, no DELETE físico
- Retornar errores como `{ error: string, details?: any }`
- Retornar listados como `{ data: [], total: N, limit: N, offset: N }`
- Nunca exponer el campo `password` en respuestas

### NUNCA
- Hardcodear secrets o URLs (usar `process.env`)
- Usar `any` ni coerciones inseguras
- Hacer queries sin `try/catch` en los controllers
- Olvidar el `where: { deletedAt: null }` en movies
- Permitir que dos usuarios reserven el mismo asiento simultáneamente

## Flujo de Autenticación

```
POST /api/auth/login → { accessToken (15m), refreshToken (7d) }
POST /api/auth/refresh → { accessToken (15m) }  [usa refreshToken en body]
Header: Authorization: Bearer <accessToken>
```

## Roles

- `user` → puede ver películas, funciones, reservar y cancelar sus reservas
- `admin` → todo lo anterior + gestión de películas/funciones/salas + reportes

## Entidades Principales (Prisma)

`Genre → Movie → Showtime ← Room ← Seat`
`User → Reservation → ReservationSeat → Seat`
`Showtime → Reservation`

## Tests

- Usar **Vitest** como runner
- Usar **Supertest** para tests de integración HTTP
- Usar base de datos de test separada (`_test` suffix)
- Limpiar la DB en `beforeEach` con `deleteMany()` en orden correcto (FK constraints)
- Mockear SendGrid, Twilio y Stripe con `vi.mock()`

## Servicios Externos

| Servicio | Para qué |
|---|---|
| **SendGrid** | Email de confirmación con QR adjunto |
| **Twilio WhatsApp** | Notificación de reserva confirmada |
| **Stripe** | Procesamiento de pagos al reservar |
| **node-qrcode** | Generación del QR de la reserva |

## Agentes de Copilot Disponibles

Usa `@api-architect` para diseñar endpoints y estructura de código.
Usa `@prisma-db` para queries, migraciones y seeds.
Usa `@tdd-movie-api` para generar tests de cualquier módulo.
