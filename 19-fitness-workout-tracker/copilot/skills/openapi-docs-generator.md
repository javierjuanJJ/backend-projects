# openapi-docs-generator
# GitHub Copilot Skill — Workout Tracker
# Genera documentación OpenAPI 3.0 (swagger-jsdoc) para endpoints

## Descripción

Genera comentarios JSDoc compatibles con `swagger-jsdoc` para documentar endpoints de la API de Workout Tracker según la especificación OpenAPI 3.0.

## Uso

```
@openapi-docs-generator <endpoint> <método> <descripción>
```

**Ejemplos:**
```
@openapi-docs-generator /api/workouts POST "Crear entrenamiento"
@openapi-docs-generator /api/workouts/{id} PATCH "Actualizar parcialmente entrenamiento"
@openapi-docs-generator /api/reports GET "Obtener informe de progreso"
```

## Plantilla de referencia

### Endpoint protegido (requiere JWT)

```js
/**
 * @swagger
 * /api/workouts:
 *   post:
 *     summary: Create a new workout
 *     tags: [Workouts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateWorkoutDto'
 *           example:
 *             name: "Chest Day"
 *             scheduledDate: "2025-06-15T09:00:00.000Z"
 *             notes: "Focus on form"
 *             exercises:
 *               - exerciseId: "e1b1a1a1-1111-4444-8888-000000000001"
 *                 sets: 3
 *                 reps: 12
 *                 weightKg: 60.0
 *     responses:
 *       201:
 *         description: Workout created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/WorkoutResponse'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
```

### Componentes reutilizables a definir

```js
/**
 * @swagger
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *   responses:
 *     Unauthorized:
 *       description: Missing or invalid JWT token
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ErrorResponse'
 *     ValidationError:
 *       description: Input validation failed
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ErrorResponse'
 *     InternalError:
 *       description: Internal server error
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ErrorResponse'
 *   schemas:
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         error:
 *           type: string
 *         details:
 *           type: array
 *           items:
 *             type: object
 */
```

## Reglas de documentación

1. Todos los endpoints protegidos llevan `security: [{ bearerAuth: [] }]`
2. Todos los tags son: `Auth`, `Exercises`, `Workouts`, `Reports`
3. Los schemas de request/response se definen en `components/schemas` y se referencian con `$ref`
4. Siempre incluye al menos un `example` realista en el requestBody
5. Documenta todos los posibles códigos de error (400, 401, 403, 404, 500)
6. Los campos opcionales se marcan con `required: false` o simplemente no se incluyen en `required: []`
