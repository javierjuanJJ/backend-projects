// src/server/controllers/reports.controller.js
import { ReportModel } from '../models/report.model.js'

export class ReportsController {
  /**
   * @swagger
   * /api/reports:
   *   get:
   *     summary: Get workout progress report for the authenticated user
   *     tags: [Reports]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Progress report
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ReportResponse'
   *       401:
   *         $ref: '#/components/responses/Unauthorized'
   */
  static async getProgress(req, res) {
    try {
      const report = await ReportModel.getProgress(req.user.id)
      return res.json({ data: report })
    } catch (error) {
      console.error('[ReportsController.getProgress]', error)
      return res.status(500).json({ error: 'Internal server error' })
    }
  }
}
