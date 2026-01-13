import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkDatabaseSchema() {
  try {
    // Try to find all users (even with wrong schema, this will show column info)
    const result = await prisma.$queryRaw`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name='users' 
      ORDER BY ordinal_position
    `
    console.log('Users table columns:')
    console.log(JSON.stringify(result, null, 2))
  } catch (error) {
    console.error('Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

checkDatabaseSchema()
