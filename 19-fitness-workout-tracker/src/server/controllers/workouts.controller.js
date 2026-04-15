// src/server/controllers/workouts.controller.js
import { WorkoutModel } from '../models/workout.model.js'
import { DEFAULTS } from '../config.js'

export class WorkoutsController {
  /**
   * @swagger
   * /api/workouts:
   *   get:
   *     summary: List authenticated user's workouts
   *     tags: [Workouts]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: limit
   *         schema: { type: integer, default: 10 }
   *       - in: query
   *         name: offset
   *         schema: { type: integer, default: 0 }
   *       - in: query
   *         name: completed
   *         schema: { type: boolean }
   *         description: Filter by completion status
   *     responses:
   *       200:
   *         description: List of workouts
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/WorkoutListResponse'
   *       401:
   *         $ref: '#/components/responses/Unauthorized'
   */
  static async getAll(req, res) {
    try {
      const { limit = DEFAULTS.LIMIT_PAGINATION, offset = DEFAULTS.LIMIT_OFFSET, completed } = req.query

      const completedFilter = completed === 'true' ? true : completed === 'false' ? false : undefined

      const { workouts, total } = await WorkoutModel.getAll({
        userId: req.user.id,
        limit,
        offset,
        completed: completedFilter,
      })

      return res.json({ data: workouts, total, limit: Number(limit), offset: Number(offset) })
    } catch (error) {
      console.error('[WorkoutsController.getAll]', error)
      return res.status(500).json({ error: 'Internal server error' })
    }
  }

  /**
   * @swagger
   * /api/workouts/{id}:
   *   get:
   *     summary: Get a specific workout by ID
   *     tags: [Workouts]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema: { type: string, format: uuid }
   *     responses:
   *       200:
   *         description: Workout found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Workout'
   *       401:
   *         $ref: '#/components/responses/Unauthorized'
   *       404:
   *         $ref: '#/components/responses/NotFound'
   */
  static async getById(req, res) {
    try {
      const { id } = req.params

      const workout = await WorkoutModel.getById({ id, userId: req.user.id })
      if (!workout) {
        return res.status(404).json({ error: 'Workout not found' })
      }

      return res.json(workout)
    } catch (error) {
      console.error('[WorkoutsController.getById]', error)
      return res.status(500).json({ error: 'Internal server error' })
    }
  }

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
   *     responses:
   *       201:
   *         description: Workout created
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Workout'
   *       400:
   *         $ref: '#/components/responses/ValidationError'
   *       401:
   *         $ref: '#/components/responses/Unauthorized'
   */
  static async create(req, res) {
    try {
      const { name, scheduledDate, notes, exercises } = req.body

      const workout = await WorkoutModel.create({
        userId: req.user.id,
        name,
        scheduledDate,
        notes,
        exercises,
      })

      return res.status(201).json(workout)
    } catch (error) {
      console.error('[WorkoutsController.create]', error)
      return res.status(500).json({ error: 'Internal server error' })
    }
  }

  /**
   * @swagger
   * /api/workouts/{id}:
   *   put:
   *     summary: Replace a workout completely (PUT)
   *     tags: [Workouts]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema: { type: string, format: uuid }
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/CreateWorkoutDto'
   *     responses:
   *       200:
   *         description: Workout updated
   *       401:
   *         $ref: '#/components/responses/Unauthorized'
   *       404:
   *         $ref: '#/components/responses/NotFound'
   */
  static async update(req, res) {
    try {
      const { id } = req.params
      const { name, scheduledDate, notes, isCompleted, exercises } = req.body

      const existing = await WorkoutModel.getById({ id, userId: req.user.id })
      if (!existing) {
        return res.status(404).json({ error: 'Workout not found' })
      }

      const updated = await WorkoutModel.update({
        id,
        userId: req.user.id,
        name,
        scheduledDate,
        notes,
        isCompleted,
        exercises,
      })

      return res.json(updated)
    } catch (error) {
      console.error('[WorkoutsController.update]', error)
      return res.status(500).json({ error: 'Internal server error' })
    }
  }

  /**
   * @swagger
   * /api/workouts/{id}:
   *   patch:
   *     summary: Partially update a workout (PATCH)
   *     tags: [Workouts]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema: { type: string, format: uuid }
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/PatchWorkoutDto'
   *     responses:
   *       200:
   *         description: Workout partially updated
   *       401:
   *         $ref: '#/components/responses/Unauthorized'
   *       404:
   *         $ref: '#/components/responses/NotFound'
   */
  static async partialUpdate(req, res) {
    try {
      const { id } = req.params
      const partialData = req.body

      const existing = await WorkoutModel.getById({ id, userId: req.user.id })
      if (!existing) {
        return res.status(404).json({ error: 'Workout not found' })
      }

      const updated = await WorkoutModel.partialUpdate({
        id,
        userId: req.user.id,
        partialData,
      })

      return res.json(updated)
    } catch (error) {
      console.error('[WorkoutsController.partialUpdate]', error)
      return res.status(500).json({ error: 'Internal server error' })
    }
  }

  /**
   * @swagger
   * /api/workouts/{id}:
   *   delete:
   *     summary: Delete a workout
   *     tags: [Workouts]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema: { type: string, format: uuid }
   *     responses:
   *       200:
   *         description: Workout deleted
   *       401:
   *         $ref: '#/components/responses/Unauthorized'
   *       404:
   *         $ref: '#/components/responses/NotFound'
   */
  static async delete(req, res) {
    try {
      const { id } = req.params

      const existing = await WorkoutModel.getById({ id, userId: req.user.id })
      if (!existing) {
        return res.status(404).json({ error: 'Workout not found' })
      }

      await WorkoutModel.delete({ id, userId: req.user.id })

      return res.json({ message: 'Workout deleted successfully' })
    } catch (error) {
      console.error('[WorkoutsController.delete]', error)
      return res.status(500).json({ error: 'Internal server error' })
    }
  }
}
