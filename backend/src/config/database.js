import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({
  log: ['warn', 'error'],
})

export const connectDB = async () => {
  try {
    await prisma.$connect()
    console.log('✅ PostgreSQL connected successfully via Prisma')
    
    // Test the connection with a simpler approach
    try {
      const result = await prisma.$queryRaw`SELECT 1`
      console.log('✅ Database query test successful')
    } catch (queryError) {
      console.warn('⚠️ Database test query failed:', queryError.message)
      // Continue anyway - connection is still valid
    }
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
