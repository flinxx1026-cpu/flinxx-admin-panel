import { PrismaClient } from '@prisma/client'
import bcryptjs from 'bcryptjs'

const prisma = new PrismaClient()

async function createTestUser() {
  try {
    console.log('📝 Creating test user via production database...\n')
    
    // Simulate user app registration flow
    const testUserData = {
      email: 'testuser@example.com',
      username: 'testuser_001',
      password: 'TestPassword123!'
    }
    
    console.log('📋 Test User Data:')
    console.log(`   Email: ${testUserData.email}`)
    console.log(`   Username: ${testUserData.username}`)
    console.log(`   Password: ${testUserData.password}\n`)
    
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: testUserData.email }
    })
    
    if (existingUser) {
      console.log('⚠️  User already exists, deleting old one...')
      await prisma.user.delete({
        where: { email: testUserData.email }
      })
      console.log('✅ Old user deleted\n')
    }
    
    // Hash password (same as user app would do)
    console.log('🔐 Hashing password...')
    const hashedPassword = bcryptjs.hashSync(testUserData.password, 10)
    console.log('✅ Password hashed\n')
    
    // Create user in database
    console.log('💾 Writing to production database (Neon)...')
    const newUser = await prisma.user.create({
      data: {
        email: testUserData.email,
        username: testUserData.username,
        password: hashedPassword,
        verified: false,
        banned: false,
        coins: 100  // Starting coins for new user
      }
    })
    
    console.log('✅ Test user created successfully!\n')
    
    // Display created user details
    console.log('========== USER CREATION RESULT ==========')
    console.log(`User ID: ${newUser.id}`)
    console.log(`Email: ${newUser.email}`)
    console.log(`Username: ${newUser.username}`)
    console.log(`Verified: ${newUser.verified}`)
    console.log(`Banned: ${newUser.banned}`)
    console.log(`Coins: ${newUser.coins}`)
    console.log(`Created: ${newUser.createdAt.toISOString()}`)
    console.log('=========================================\n')
    
    // Verify user was created
    console.log('🔍 Verifying user in database...')
    const verifyUser = await prisma.user.findUnique({
      where: { email: testUserData.email }
    })
    
    if (verifyUser) {
      console.log('✅ Verification PASSED - User exists in production database\n')
      console.log('🎉 TEST USER CREATION SUCCESSFUL')
    } else {
      console.log('❌ Verification FAILED - User not found in database')
    }
    
  } catch (error) {
    console.error('❌ Error creating test user:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

createTestUser()
