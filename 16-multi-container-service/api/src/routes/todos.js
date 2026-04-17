import { Router }          from 'express'
import { TodoController }  from '../controllers/todo.js'
import { validateCreate, validateUpdate } from '../middlewares/validate.js'

export const todosRouter = Router()

todosRouter.get('/',     TodoController.getAll)
todosRouter.get('/:id',  TodoController.getById)
todosRouter.post('/',    validateCreate, TodoController.create)
todosRouter.put('/:id',  validateCreate, TodoController.update)
todosRouter.patch('/:id',validateUpdate, TodoController.partialUpdate)
todosRouter.delete('/:id',              TodoController.delete)
