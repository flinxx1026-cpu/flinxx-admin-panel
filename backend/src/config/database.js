import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export const connectDB = async () => {
  try {
    await prisma.$connect()
    console.log('PostgreSQL connected successfully via Prisma')
  } catch (error) {
    console.error('PostgreSQL connection failed:', error.message)
    process.exit(1)
  }
}

export const disconnectDB = async () => {
  try {
    await prisma.$disconnect()
  } catch (error) {
    console.error('Error disconnecting from PostgreSQL:', error)
  }
}

export default prisma
