import { PrismaClient } from '@prisma/client'
import bcryptjs from 'bcryptjs'

const prisma = new PrismaClient()

async function createTestUsers() {
  try {
    console.log('🔄 Creating test users...')
    
    const users = [
      { email: 'user1@test.com', username: 'user1', password: 'password123' },
      { email: 'user2@test.com', username: 'user2', password: 'password123' },
      { email: 'user3@test.com', username: 'user3', password: 'password123' }
    ]

    for (const userData of users) {
      const hashedPassword = bcryptjs.hashSync(userData.password, 10)
      const user = await prisma.user.create({
        data: {
          email: userData.email,
          username: userData.username,
          password: hashedPassword,
          verified: true,
          coins: 100
        }
      })
      console.log(`✅ Created user: ${user.username}`)
    }

    // Fetch and display all users
    const allUsers = await prisma.user.findMany()
    console.log(`\n📊 Total users in database: ${allUsers.length}`)
    console.log('Users:', JSON.stringify(allUsers, null, 2))
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

createTestUsers()
