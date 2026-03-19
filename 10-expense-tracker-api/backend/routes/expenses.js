import { Router } from 'express'
import { ExpenseController } from '../controllers/expenses.js'
import { validateExpense, validatePartialExpense } from '../schemas/expenses.js'
import { authMiddleware } from '../middlewares/auth.js'

export const expensesRouter = Router()

// ─── Todas las rutas de expenses requieren JWT ────────────────────────────────
expensesRouter.use(authMiddleware)

// ─── Middlewares de validación Zod (mismo patrón que en jobs) ────────────────

function validateCreate(req, res, next) {
  const result = validateExpense(req.body)
  if (result.success) {
    req.body = result.data   // datos validados y limpios
    return next()
  }
  return res.status(400).json({ error: 'Invalid request', details: result.error.errors })
}

const validateUpdate = (req, res, next) => {
  const result = validatePartialExpense(req.body)
  if (!result.success) {
    return res.status(400).json({ error: JSON.parse(result.error.message) })
  }
  req.body = result.data
  next()
}

// ─── Rutas ────────────────────────────────────────────────────────────────────

expensesRouter.get('/',     ExpenseController.getAll)
expensesRouter.get('/:id',  ExpenseController.getId)
expensesRouter.post('/',    validateCreate,  ExpenseController.create)
expensesRouter.patch('/:id', validateUpdate, ExpenseController.partialUpdate)
expensesRouter.put('/:id',   validateCreate, ExpenseController.update)
expensesRouter.delete('/:id',               ExpenseController.delete)
