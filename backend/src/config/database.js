import mongoose from 'mongoose'

export const connectDB = async () => {
  try {
    const mongoUrl = process.env.MONGODB_URI || 'mongodb://localhost:27017/flinxx-admin'
    await mongoose.connect(mongoUrl)
    console.log('MongoDB connected successfully')
  } catch (error) {
    console.warn('MongoDB connection failed - using mock data:', error.message)
    // Don't exit - allow app to run with mock data
  }
}

export const disconnectDB = async () => {
  try {
    await mongoose.disconnect()
  } catch (error) {
    console.error('Error disconnecting from MongoDB:', error)
  }
}
