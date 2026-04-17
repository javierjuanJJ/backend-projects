import mongoose from 'mongoose'
import { TodoModel } from '../models/todo.js'
import { DEFAULTS }  from '../config.js'

export class TodoService {
  static async getAll({ text, title, limit = DEFAULTS.LIMIT_PAGINATION, offset = DEFAULTS.LIMIT_OFFSET } = {}) {
    const filter = {}
    if (text)        filter.$text  = { $search: text }
    else if (title)  filter.title  = { $regex: title, $options: 'i' }

    return TodoModel.find(filter).skip(Number(offset)).limit(Number(limit)).lean({ virtuals: true })
  }

  static async getById(id) {
    if (!mongoose.Types.ObjectId.isValid(id)) return null
    return TodoModel.findById(id).lean({ virtuals: true })
  }

  static async create({ title, description }) {
    const todo = new TodoModel({ title, description })
    await todo.save()
    return todo.toJSON()
  }

  static async update({ id, title, description }) {
    if (!mongoose.Types.ObjectId.isValid(id)) return null
    return TodoModel.findByIdAndUpdate(id, { title, description }, { new: true, runValidators: true }).lean({ virtuals: true })
  }

  static async partialUpdate({ id, partialData }) {
    if (!mongoose.Types.ObjectId.isValid(id)) return null
    return TodoModel.findByIdAndUpdate(id, { $set: partialData }, { new: true, runValidators: true }).lean({ virtuals: true })
  }

  static async delete(id) {
    if (!mongoose.Types.ObjectId.isValid(id)) return null
    return TodoModel.findByIdAndDelete(id).lean({ virtuals: true })
  }
}
