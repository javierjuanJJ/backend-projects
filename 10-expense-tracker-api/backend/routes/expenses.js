import { Router } from 'express'
import { ExpensesController } from '../controllers/expenses.js'
import { validateJob, validatePartialJob } from '../schemas/jobs.js'

export const expensesRouter = Router()

function validateCreate (req, res, next) {
  const result = validateJob(req.body)
  if (result.success) {
    req.body = result.data // vamos a tener los datos validados y limpios
    return next()
  }

  return res.status(400).json({ error: 'Invalid request', details: result.error.errors })
}

expensesRouter.get('/', ExpensesController.getAll)
expensesRouter.get('/:id', ExpensesController.getId)
expensesRouter.post('/', validateCreate, ExpensesController.create)
expensesRouter.put('/:id', ExpensesController.update)
expensesRouter.delete('/:id', ExpensesController.delete)