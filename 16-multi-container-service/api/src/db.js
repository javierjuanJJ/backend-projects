import mongoose from 'mongoose'

const MONGO_URI = process.env.MONGO_URI ?? 'mongodb://localhost:27017/todosdb'

export const connectDB = async () => {
  try {
    await mongoose.connect(MONGO_URI)
    console.log(`✅ MongoDB conectado: ${MONGO_URI}`)
  } catch (error) {
    console.error('❌ Error MongoDB:', error.message)
    process.exit(1)
  }
}

mongoose.connection.on('disconnected', () => console.warn('⚠️  MongoDB desconectado'))
mongoose.connection.on('reconnected',  () => console.log('🔄 MongoDB reconectado'))
