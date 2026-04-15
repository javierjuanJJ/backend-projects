# generate-workout-endpoint
# GitHub Copilot Skill — Workout Tracker
# Genera un endpoint completo: controller + model + route + schema + test

## Descripción

Genera un nuevo endpoint REST para la API de Workout Tracker siguiendo los patrones establecidos del proyecto. Incluye controller, model (Prisma), route (Express), schema (Zod) y test (Vitest).

## Uso

```
@generate-workout-endpoint <recurso> <método> <descripción>
```

**Ejemplos:**
```
@generate-workout-endpoint workout POST "Crear un nuevo entrenamiento con ejercicios"
@generate-workout-endpoint report GET "Obtener informe de progreso del usuario"
@generate-workout-endpoint exercise GET "Listar ejercicios filtrados por categoría"
```

## Instrucciones del skill

Al ejecutar este skill, genera los siguientes archivos:

### 1. Schema Zod (`src/server/schemas/<recurso>.schema.js`)

```js
import { z } from 'zod'

// Define el schema para <recurso>
// Usa tipos estrictos, mensajes de error claros en inglés
// Exporta validateX y validatePartialX
```

### 2. Model Prisma (`src/server/models/<recurso>.model.js`)

```js
import { prisma } from '../../lib/prisma.js'

export class <Recurso>Model {
  // Métodos estáticos async
  // Siempre filtrar por userId cuando aplique
  // Include relaciones necesarias
}
```

### 3. Controller (`src/server/controllers/<recurso>.controller.js`)

```js
export class <Recurso>Controller {
  // Métodos estáticos async
  // try/catch en todos
  // Respuestas JSON estandarizadas
  // Verificar ownership del recurso
}
```

### 4. Route (`src/server/routes/<recurso>.routes.js`)

```js
import { Router } from 'express'
import { authMiddleware } from '../middlewares/auth.middleware.js'
// Define rutas con validación Zod y authMiddleware
// Documenta con @swagger JSDoc para OpenAPI 3.0
```

### 5. Test (`tests/<recurso>.test.js`)

```js
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import supertest from 'supertest'
// Tests: happy path, 401, 403, 404, 400 validación
// Setup: crear usuario + login antes del suite
// Teardown: limpiar DB después del suite
```

## Reglas de generación

- Usa `crypto.randomUUID()` para IDs en seeds/fixtures de test
- Nunca expongas `passwordHash` en respuestas
- Los errores siempre retornan `{ error: string, details?: array }`
- Los listados siempre retornan `{ data: array, total: number }`
- Las creaciones retornan status 201
- Añade comentarios `@swagger` OpenAPI 3.0 en cada ruta
