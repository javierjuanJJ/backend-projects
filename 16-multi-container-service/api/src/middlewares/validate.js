import { validateTodo, validatePartialTodo } from '../schemas/todo.js'

const formatErrors = errors =>
  errors.map(e => ({ field: e.path.join('.'), message: e.message }))

export function validateCreate(req, res, next) {
  const result = validateTodo(req.body)
  if (!result.success)
    return res.status(400).json({ error: 'Datos inválidos', details: formatErrors(result.error.errors) })
  req.body = result.data
  return next()
}

export function validateUpdate(req, res, next) {
  const result = validatePartialTodo(req.body)
  if (!result.success)
    return res.status(400).json({ error: 'Datos inválidos', details: formatErrors(result.error.errors) })
  req.body = result.data
  return next()
}
