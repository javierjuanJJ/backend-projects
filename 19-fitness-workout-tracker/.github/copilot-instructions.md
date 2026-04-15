# Workout Tracker API — GitHub Copilot Instructions
# Archivo: .github/copilot-instructions.md
# Estas instrucciones aplican a todo el workspace del proyecto.

## Contexto del proyecto

Este es el backend de **Workout Tracker**, una API RESTful construida con:
- **Next.js 14** (App Router) + **Express** como servidor HTTP
- **Prisma ORM** sobre **PostgreSQL**
- **JWT** para autenticación
- **Zod** para validación de esquemas
- **Vitest** para tests unitarios e integración
- **pnpm** como gestor de paquetes

## Estructura y patrones de código

### Nunca hagas esto
- ❌ No uses `require()` — solo ES modules (`import`/`export`)
- ❌ No uses `.then()` — solo `async/await`
- ❌ No uses `uuid` library — usa `crypto.randomUUID()`
- ❌ No accedas a Prisma directamente desde controllers — usa los Models
- ❌ No expongas `passwordHash` en ninguna respuesta
- ❌ No uses `zod.parse()` — siempre `zod.safeParse()`
- ❌ No crees archivos `.ts` — el proyecto es **JavaScript puro**

### Siempre haz esto
- ✅ Valida inputs con Zod en las rutas antes de llegar al controller
- ✅ Verifica `workout.userId === req.user.id` en operaciones de escritura
- ✅ Maneja errores con try/catch y respuestas JSON estandarizadas
- ✅ Documenta endpoints nuevos con JSDoc `@swagger` para OpenAPI 3.0
- ✅ Crea el test Vitest correspondiente junto a cada nuevo endpoint

## Schema de base de datos (Prisma)

```
User         → id, username, email, passwordHash, createdAt
Exercise     → id, name, description, category, muscleGroup, createdAt
Workout      → id, userId, name, scheduledDate, isCompleted, notes, createdAt
WorkoutDetail → id, workoutId, exerciseId, sets, reps, weightKg, exerciseOrder
```

## Convención de respuestas HTTP

| Situación | Status |
|-----------|--------|
| Obtener recursos | 200 |
| Crear recurso | 201 |
| Sin contenido | 204 |
| Validación fallida | 400 |
| No autenticado | 401 |
| Sin permiso | 403 |
| No encontrado | 404 |
| Error interno | 500 |

## Respuesta de error estándar

```json
{
  "error": "Mensaje legible",
  "details": []
}
```

## Variables de entorno importantes

- `DATABASE_URL` — cadena de conexión Prisma a PostgreSQL
- `JWT_SECRET` — clave para firmar/verificar tokens
- `JWT_EXPIRES_IN` — expiración del token (ej: `7d`)
- `BCRYPT_SALT_ROUNDS` — rondas de hash para contraseñas
- `CORS_ORIGINS` — orígenes permitidos separados por comas

## Tests — Vitest

Los tests van en `/tests/` y usan `supertest` para llamadas HTTP. Cada test:
1. Registra un usuario de prueba antes del suite
2. Hace login para obtener JWT
3. Usa el JWT en los headers de las peticiones
4. Limpia la base de datos al finalizar (`afterAll`)
