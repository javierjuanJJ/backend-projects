import mongoose from 'mongoose'

const todoSchema = new mongoose.Schema(
  {
    title: {
      type:      String,
      required:  [true, 'El título es obligatorio'],
      trim:      true,
      minlength: [3,   'Mínimo 3 caracteres'],
      maxlength: [100, 'Máximo 100 caracteres'],
    },
    description: { type: String, trim: true, default: '' },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        ret.id = ret._id.toString()
        delete ret._id
        return ret
      },
    },
  }
)

// Índice de texto para búsqueda full-text
todoSchema.index({ title: 'text', description: 'text' })

export const TodoModel = mongoose.model('Todo', todoSchema)
