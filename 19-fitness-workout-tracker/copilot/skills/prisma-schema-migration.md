# prisma-schema-migration
# GitHub Copilot Skill — Workout Tracker
# Genera migraciones y actualizaciones del schema Prisma

## Descripción

Ayuda a gestionar el schema de Prisma para Workout Tracker: genera nuevos modelos, campos, relaciones e índices, y proporciona el comando de migración correspondiente.

## Uso

```
@prisma-schema-migration <acción> <descripción>
```

**Ejemplos:**
```
@prisma-schema-migration add-field "Añadir campo duration_minutes a Workout"
@prisma-schema-migration add-model "Crear modelo WorkoutTemplate"
@prisma-schema-migration add-index "Índice para búsqueda por muscle_group en Exercise"
```

## Schema actual de referencia

```prisma
model User {
  id           String    @id @default(uuid())
  username     String    @unique @db.VarChar(50)
  email        String    @unique @db.VarChar(100)
  passwordHash String    @map("password_hash") @db.VarChar(255)
  createdAt    DateTime  @default(now()) @map("created_at")
  workouts     Workout[]

  @@map("users")
}

model Exercise {
  id             String          @id @default(uuid())
  name           String          @db.VarChar(100)
  description    String?         @db.Text
  category       String?         @db.VarChar(50)
  muscleGroup    String?         @map("muscle_group") @db.VarChar(50)
  createdAt      DateTime        @default(now()) @map("created_at")
  workoutDetails WorkoutDetail[]

  @@map("exercises")
}

model Workout {
  id             String          @id @default(uuid())
  userId         String          @map("user_id") @db.VarChar(36)
  name           String          @default("Nueva rutina") @db.VarChar(100)
  scheduledDate  DateTime        @map("scheduled_date")
  isCompleted    Boolean         @default(false) @map("is_completed")
  notes          String?         @db.Text
  createdAt      DateTime        @default(now()) @map("created_at")
  user           User            @relation(fields: [userId], references: [id], onDelete: Cascade)
  workoutDetails WorkoutDetail[]

  @@index([userId])
  @@index([scheduledDate])
  @@map("workouts")
}

model WorkoutDetail {
  id             String   @id @default(uuid())
  workoutId      String   @map("workout_id") @db.VarChar(36)
  exerciseId     String   @map("exercise_id") @db.VarChar(36)
  sets           Int      @default(1)
  reps           Int      @default(0)
  weightKg       Decimal? @default(0.00) @map("weight_kg") @db.Decimal(5, 2)
  exerciseOrder  Int?     @map("exercise_order")
  workout        Workout  @relation(fields: [workoutId], references: [id], onDelete: Cascade)
  exercise       Exercise @relation(fields: [exerciseId], references: [id], onDelete: Restrict)

  @@index([workoutId])
  @@map("workout_details")
}
```

## Instrucciones de generación

1. Proporciona el bloque Prisma actualizado con el cambio solicitado
2. Incluye el comando de migración:
   ```bash
   pnpm prisma migrate dev --name <nombre-descriptivo-en-snake-case>
   ```
3. Si se añaden campos, sugiere actualizar:
   - El schema Zod correspondiente
   - Los métodos del Model afectado
   - Los tests relacionados
4. Sigue las convenciones de naming:
   - Modelos en PascalCase
   - Campos en camelCase en Prisma, snake_case en DB (`@map`)
   - Tablas en plural snake_case (`@@map`)
5. Siempre añade índices para Foreign Keys y campos usados en WHERE frecuentes
