import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({
  log: ['warn', 'error'],
})

export const connectDB = async () => {
  try {
    await prisma.$connect()
    console.log('✅ PostgreSQL connected successfully via Prisma')
    
    // Test the connection
    const result = await prisma.$queryRaw`SELECT NOW()`
    console.log('✅ Database query test successful:', result)
  } catch (error) {
    console.error('❌ PostgreSQL connection failed:', error.message)
    console.error('Error details:', error)
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
