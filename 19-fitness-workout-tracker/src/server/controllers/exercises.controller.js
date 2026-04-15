// src/server/controllers/exercises.controller.js
import { ExerciseModel } from '../models/exercise.model.js'
import { DEFAULTS } from '../config.js'

export class ExercisesController {
  /**
   * @swagger
   * /api/exercises:
   *   get:
   *     summary: List all exercises from the catalog
   *     tags: [Exercises]
   *     parameters:
   *       - in: query
   *         name: category
   *         schema: { type: string }
   *         description: Filter by category (e.g. Strength, Cardio, Flexibility)
   *       - in: query
   *         name: muscleGroup
   *         schema: { type: string }
   *         description: Filter by muscle group (e.g. Chest, Legs, Full Body)
   *       - in: query
   *         name: search
   *         schema: { type: string }
   *         description: Search in name or description
   *       - in: query
   *         name: limit
   *         schema: { type: integer, default: 10 }
   *       - in: query
   *         name: offset
   *         schema: { type: integer, default: 0 }
   *     responses:
   *       200:
   *         description: List of exercises
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ExerciseListResponse'
   */
  static async getAll(req, res) {
    try {
      const { category, muscleGroup, search, limit = DEFAULTS.LIMIT_PAGINATION, offset = DEFAULTS.LIMIT_OFFSET } = req.query

      const { exercises, total } = await ExerciseModel.getAll({ category, muscleGroup, search, limit, offset })

      return res.json({ data: exercises, total, limit: Number(limit), offset: Number(offset) })
    } catch (error) {
      console.error('[ExercisesController.getAll]', error)
      return res.status(500).json({ error: 'Internal server error' })
    }
  }

  /**
   * @swagger
   * /api/exercises/{id}:
   *   get:
   *     summary: Get exercise by ID
   *     tags: [Exercises]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema: { type: string, format: uuid }
   *     responses:
   *       200:
   *         description: Exercise found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Exercise'
   *       404:
   *         $ref: '#/components/responses/NotFound'
   */
  static async getById(req, res) {
    try {
      const { id } = req.params

      const exercise = await ExerciseModel.getById(id)
      if (!exercise) {
        return res.status(404).json({ error: 'Exercise not found' })
      }

      return res.json(exercise)
    } catch (error) {
      console.error('[ExercisesController.getById]', error)
      return res.status(500).json({ error: 'Internal server error' })
    }
  }
}
