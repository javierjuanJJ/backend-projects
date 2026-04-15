// src/server/models/workout.model.js
import { prisma } from '../../lib/prisma.js'
import { DEFAULTS } from '../config.js'

const workoutInclude = {
  workoutDetails: {
    include: { exercise: true },
    orderBy: { exerciseOrder: 'asc' },
  },
}

export class WorkoutModel {
  /**
   * Lista los entrenamientos del usuario con filtros y paginación.
   */
  static async getAll({ userId, limit = DEFAULTS.LIMIT_PAGINATION, offset = DEFAULTS.LIMIT_OFFSET, completed } = {}) {
    const where = { userId }
    if (completed !== undefined) where.isCompleted = completed

    const [workouts, total] = await Promise.all([
      prisma.workout.findMany({
        where,
        include: workoutInclude,
        orderBy: { scheduledDate: 'asc' },
        take: Number(limit),
        skip: Number(offset),
      }),
      prisma.workout.count({ where }),
    ])

    return { workouts, total }
  }

  /**
   * Obtiene un entrenamiento por id y userId (garantiza ownership).
   */
  static async getById({ id, userId }) {
    return prisma.workout.findFirst({
      where: { id, userId },
      include: workoutInclude,
    })
  }

  /**
   * Crea un entrenamiento con sus detalles de ejercicios.
   */
  static async create({ userId, name, scheduledDate, notes, exercises }) {
    return prisma.workout.create({
      data: {
        id: crypto.randomUUID(),
        userId,
        name: name ?? 'Nueva rutina',
        scheduledDate: new Date(scheduledDate),
        notes,
        workoutDetails: {
          create: exercises.map((ex, index) => ({
            id: crypto.randomUUID(),
            exerciseId: ex.exerciseId,
            sets: ex.sets,
            reps: ex.reps,
            weightKg: ex.weightKg ?? 0,
            exerciseOrder: ex.exerciseOrder ?? index + 1,
          })),
        },
      },
      include: workoutInclude,
    })
  }

  /**
   * Reemplaza completamente un entrenamiento (PUT).
   */
  static async update({ id, userId, name, scheduledDate, notes, isCompleted, exercises }) {
    return prisma.$transaction(async (tx) => {
      // Borrar detalles anteriores
      await tx.workoutDetail.deleteMany({ where: { workoutId: id } })

      return tx.workout.update({
        where: { id, userId },
        data: {
          name: name ?? 'Nueva rutina',
          scheduledDate: new Date(scheduledDate),
          notes,
          isCompleted: isCompleted ?? false,
          workoutDetails: {
            create: exercises.map((ex, index) => ({
              id: crypto.randomUUID(),
              exerciseId: ex.exerciseId,
              sets: ex.sets,
              reps: ex.reps,
              weightKg: ex.weightKg ?? 0,
              exerciseOrder: ex.exerciseOrder ?? index + 1,
            })),
          },
        },
        include: workoutInclude,
      })
    })
  }

  /**
   * Actualización parcial de un entrenamiento (PATCH).
   */
  static async partialUpdate({ id, userId, partialData }) {
    const data = {}

    if (partialData.name !== undefined) data.name = partialData.name
    if (partialData.scheduledDate !== undefined) data.scheduledDate = new Date(partialData.scheduledDate)
    if (partialData.notes !== undefined) data.notes = partialData.notes
    if (partialData.isCompleted !== undefined) data.isCompleted = partialData.isCompleted

    if (partialData.exercises !== undefined) {
      return prisma.$transaction(async (tx) => {
        await tx.workoutDetail.deleteMany({ where: { workoutId: id } })
        return tx.workout.update({
          where: { id, userId },
          data: {
            ...data,
            workoutDetails: {
              create: partialData.exercises.map((ex, index) => ({
                id: crypto.randomUUID(),
                exerciseId: ex.exerciseId,
                sets: ex.sets,
                reps: ex.reps,
                weightKg: ex.weightKg ?? 0,
                exerciseOrder: ex.exerciseOrder ?? index + 1,
              })),
            },
          },
          include: workoutInclude,
        })
      })
    }

    return prisma.workout.update({
      where: { id, userId },
      data,
      include: workoutInclude,
    })
  }

  /**
   * Elimina un entrenamiento (CASCADE elimina sus detalles automáticamente).
   */
  static async delete({ id, userId }) {
    return prisma.workout.delete({ where: { id, userId } })
  }
}
