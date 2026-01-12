import dotenv from 'dotenv'
import { PrismaClient } from '@prisma/client'
import bcryptjs from 'bcryptjs'

dotenv.config()

const prisma = new PrismaClient()

async function testSignup() {
  try {
    console.log('🧪 Testing User Signup...\n')

    // Create a new test user
    const testEmail = `user_${Date.now()}@test.com`
    const testUsername = `user_${Date.now()}`
    const testPassword = 'testPassword123'

    console.log(`📝 Creating new user:`)
    console.log(`   Email: ${testEmail}`)
    console.log(`   Username: ${testUsername}`)
    console.log(`   Password: ${testPassword}\n`)

    // Hash the password
    const hashedPassword = bcryptjs.hashSync(testPassword, 10)

    // Create user
    const newUser = await prisma.user.create({
      data: {
        email: testEmail,
        username: testUsername,
        password: hashedPassword,
        verified: false,
        banned: false,
        coins: 0
      }
    })

    console.log('✅ User created successfully!')
    console.log(`   ID: ${newUser.id}`)
    console.log(`   Email: ${newUser.email}`)
    console.log(`   Username: ${newUser.username}`)
    console.log(`   Created At: ${newUser.createdAt.toISOString()}\n`)

    // Verify user exists by fetching
    const fetchedUser = await prisma.user.findUnique({
      where: { id: newUser.id }
    })

    if (fetchedUser) {
      console.log('✅ User verified in database:')
      console.log(`   ID: ${fetchedUser.id}`)
      console.log(`   Email: ${fetchedUser.email}`)
      console.log(`   Username: ${fetchedUser.username}\n`)
    }

    // Test login - verify password
    const passwordMatch = bcryptjs.compareSync(testPassword, fetchedUser.password)
    console.log(`✅ Password verification: ${passwordMatch ? 'PASSED' : 'FAILED'}\n`)

    // Check user count after signup
    const totalUsers = await prisma.user.count()
    const activeUsers = await prisma.user.count({ where: { banned: false } })
    console.log(`📊 Database Stats After Signup:`)
    console.log(`   Total Users: ${totalUsers}`)
    console.log(`   Active Users: ${activeUsers}\n`)

    console.log('🎉 Signup test completed successfully!')

  } catch (error) {
    console.error('❌ Error during signup test:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

testSignup()
