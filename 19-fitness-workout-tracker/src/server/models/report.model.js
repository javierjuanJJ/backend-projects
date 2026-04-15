// src/server/models/report.model.js
import { prisma } from '../../lib/prisma.js'

export class ReportModel {
  /**
   * Genera un informe de progreso completo para el usuario.
   * @param {string} userId
   */
  static async getProgress(userId) {
    const [totalWorkouts, completedWorkouts, workoutsByMonth, mostUsedExercises, recentWorkouts] =
      await Promise.all([
        // Total de entrenamientos
        prisma.workout.count({ where: { userId } }),

        // Entrenamientos completados
        prisma.workout.count({ where: { userId, isCompleted: true } }),

        // Entrenamientos agrupados por mes (últimos 6 meses)
        prisma.$queryRaw`
          SELECT
            TO_CHAR(scheduled_date, 'YYYY-MM') AS month,
            COUNT(*)::int                       AS total,
            SUM(CASE WHEN is_completed THEN 1 ELSE 0 END)::int AS completed
          FROM workouts
          WHERE user_id = ${userId}
            AND scheduled_date >= NOW() - INTERVAL '6 months'
          GROUP BY month
          ORDER BY month ASC
        `,

        // Ejercicios más usados
        prisma.$queryRaw`
          SELECT
            e.id,
            e.name,
            e.category,
            e.muscle_group AS "muscleGroup",
            COUNT(wd.id)::int AS times_used,
            AVG(wd.weight_kg)::float AS avg_weight_kg
          FROM workout_details wd
          JOIN exercises e ON e.id = wd.exercise_id
          JOIN workouts w ON w.id = wd.workout_id
          WHERE w.user_id = ${userId}
          GROUP BY e.id, e.name, e.category, e.muscle_group
          ORDER BY times_used DESC
          LIMIT 5
        `,

        // Últimos 5 entrenamientos completados
        prisma.workout.findMany({
          where: { userId, isCompleted: true },
          include: {
            workoutDetails: {
              include: { exercise: true },
              orderBy: { exerciseOrder: 'asc' },
            },
          },
          orderBy: { scheduledDate: 'desc' },
          take: 5,
        }),
      ])

    const completionRate = totalWorkouts > 0
      ? parseFloat(((completedWorkouts / totalWorkouts) * 100).toFixed(1))
      : 0

    return {
      summary: {
        totalWorkouts,
        completedWorkouts,
        pendingWorkouts: totalWorkouts - completedWorkouts,
        completionRate,
      },
      workoutsByMonth,
      mostUsedExercises,
      recentCompletedWorkouts: recentWorkouts,
    }
  }
}
