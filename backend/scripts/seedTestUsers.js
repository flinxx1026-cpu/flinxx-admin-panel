import dotenv from 'dotenv'
import { PrismaClient } from '@prisma/client'
import bcryptjs from 'bcryptjs'

dotenv.config()

const prisma = new PrismaClient()

async function seedUsers() {
  try {
    console.log('🌱 Seeding test users into database...\n')

    // Clear existing test users (keep original ones)
    const existingCount = await prisma.user.count()
    console.log(`📊 Current users in database: ${existingCount}\n`)

    // Create 25 test users
    const testUsers = []
    for (let i = 1; i <= 25; i++) {
      const email = `user${i}@example.com`
      const username = `testuser_${i.toString().padStart(3, '0')}`
      const password = bcryptjs.hashSync('password123', 10)

      testUsers.push({
        email,
        username,
        password,
        verified: Math.random() > 0.5,
        banned: Math.random() > 0.8, // 20% chance of being banned
        coins: Math.floor(Math.random() * 1000)
      })
    }

    // Insert users
    let createdCount = 0
    for (const userData of testUsers) {
      try {
        const user = await prisma.user.create({
          data: userData
        })
        createdCount++
        console.log(`✅ Created: ${user.username} (${user.email}) - ID: ${user.id}`)
      } catch (error) {
        if (error.code === 'P2002') {
          console.log(`⚠️  Skipped: ${userData.email} (already exists)`)
        } else {
          console.error(`❌ Error creating user: ${error.message}`)
        }
      }
    }

    console.log(`\n🎉 Seeding complete!`)
    console.log(`   Created: ${createdCount} new users`)

    // Show final count
    const finalCount = await prisma.user.count()
    console.log(`   Total users now: ${finalCount}`)

    // Show summary
    const activeUsers = await prisma.user.count({ where: { banned: false } })
    const bannedUsers = await prisma.user.count({ where: { banned: true } })
    const verifiedUsers = await prisma.user.count({ where: { verified: true } })

    console.log(`\n📈 Database Summary:`)
    console.log(`   Active Users: ${activeUsers}`)
    console.log(`   Banned Users: ${bannedUsers}`)
    console.log(`   Verified Users: ${verifiedUsers}`)

  } catch (error) {
    console.error('❌ Seeding error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

seedUsers()
