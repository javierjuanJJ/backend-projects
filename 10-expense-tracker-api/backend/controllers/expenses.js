import { DEFAULTS } from "../config.js"
import { ExpensesModel } from "../models/expense.js"

export class ExpensesController {
  static async getAll(req, res) {
    const { text, title, level, limit = DEFAULTS.LIMIT_PAGINATION, technology, offset = DEFAULTS.LIMIT_OFFSET } = req.query

    const jobs = await ExpensesModel.getAll({ text, title, level, limit, technology, offset })

    const limitNumber = Number(limit)
    const offsetNumber = Number(offset)

    return res.json({ data: jobs, total: jobs.length, limit: limitNumber, offset: offsetNumber })
  }

  static async getId(req, res) {
    const { id } = req.params

    const job = await ExpensesModel.getById(id)

    if (!job) {
      return res.status(404).json({ error: 'Job not found' })
    }

    return res.json(job)
  }

  static async create(req, res) {
    const { titulo, empresa, ubicacion, data } = req.body

    const newJob = await ExpensesModel.create({ titulo, empresa, ubicacion, data })

    return res.status(201).json(newJob)
  }

  static async update(req, res) {
    const { id } = req.params

    const { titulo, empresa, ubicacion, data } = req.body

    const job = ExpensesModel.getById({ id })

    if (!job) {
      return res.status(404).json({ error: 'Job not found' })
    }

    const updatedJob = await ExpensesModel.update({ id, titulo, empresa, ubicacion, data })
    return res.status(201).json(updatedJob)

  }
  static async partialUpdate(req, res) {
    const { id } = req.params

    const partialData = req.body
  
    // Obtener el job por id
    const job = ExpensesModel.getById(id)
  
    if (!job) {
      return res.status(404).json({ error: 'Job not found' })
    }
  
    // Actualizar parcialmente
    const updatedJob = await ExpensesModel.partialUpdate({id, partialData})
  
    return res.status(200).json(updatedJob) // 200 porque es PATCH
  }

  

  static async delete(req, res) {
    const { id } = req.params

    const job = await ExpensesModel.getById(id)

    if (!job) {
      return res.status(404).json({ error: 'Job not found' })
    }

    const jobsNonDeleted = await ExpensesModel.delete(id)

    return res.status(201).json(`Job deleted succesfully`)
  }
}