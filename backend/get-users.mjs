import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function getUsers() {
  try {
    const users = await prisma.user.findMany({
      orderBy: { created_at: 'desc' }
    })
    console.log(`Found ${users.length} users:`)
    console.log(JSON.stringify(users, null, 2))
  } catch (error) {
    console.error('Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

getUsers()
