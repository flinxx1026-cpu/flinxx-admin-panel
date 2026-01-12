import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  try {
    // Clear existing data (careful - this deletes everything!)
    console.log('Clearing existing data...')
    await prisma.session.deleteMany({})
    await prisma.payment.deleteMany({})
    await prisma.report.deleteMany({})
    await prisma.user.deleteMany({})
    await prisma.admin.deleteMany({})

    // Create admin user
    console.log('Creating admin user...')
    const admin = await prisma.admin.create({
      data: {
        email: 'Nikhilyadav1026@flinxx.com',
        password: '$2a$10$hw//L5nGXC7fMrTjFOWnHOZJ5XTPJ9PhabzGX4GqLwYClj0haZFae',
        role: 'ADMIN',
      },
    })
    console.log('✅ Admin created')

    // Create test users
    console.log('Creating test users...')
    const users = []
    for (let i = 1; i <= 100; i++) {
      const user = await prisma.user.create({
        data: {
          email: `user${i}@test.com`,
          username: `user${i}`,
          password: 'hashed_password',
          verified: i % 2 === 0,
          banned: i > 95,
          coins: Math.floor(Math.random() * 1000),
        },
      })
      users.push(user)
    }
    console.log(`✅ Created ${users.length} users`)

    // Create sessions (user activities)
    console.log('Creating sessions...')
    for (let i = 0; i < 50; i++) {
      const user1 = users[Math.floor(Math.random() * users.length)]
      const user2 = users[Math.floor(Math.random() * users.length)]
      
      if (user1.id !== user2.id) {
        const createdAt = new Date()
        createdAt.setHours(createdAt.getHours() - Math.floor(Math.random() * 24))
        
        await prisma.session.create({
          data: {
            user1Id: user1.id,
            user2Id: user2.id,
            duration: Math.floor(Math.random() * 3600),
            quality: ['high', 'medium', 'low'][Math.floor(Math.random() * 3)],
            createdAt,
            endedAt: Math.random() > 0.4 ? new Date() : null, // 40% still ongoing
          },
        })
      }
    }
    console.log('✅ Created sessions')

    // Create payments
    console.log('Creating payments...')
    for (let i = 0; i < 30; i++) {
      const createdAt = new Date()
      createdAt.setDate(createdAt.getDate() - Math.floor(Math.random() * 7))
      
      await prisma.payment.create({
        data: {
          userId: users[Math.floor(Math.random() * users.length)].id,
          amount: Math.random() * 500 + 10,
          status: Math.random() > 0.2 ? 'completed' : 'pending',
          transactionId: `txn_${Math.random().toString(36).substr(2, 9)}`,
          createdAt,
        },
      })
    }
    console.log('✅ Created payments')

    // Create reports
    console.log('Creating reports...')
    const reportReasons = [
      'Inappropriate behavior',
      'Spam',
      'Harassment',
      'Fake profile',
      'Offensive language',
      'Scam attempt',
    ]
    for (let i = 0; i < 25; i++) {
      const createdAt = new Date()
      createdAt.setHours(createdAt.getHours() - Math.floor(Math.random() * 48))
      
      await prisma.report.create({
        data: {
          reportedUserId: users[Math.floor(Math.random() * users.length)].id,
          reason: reportReasons[Math.floor(Math.random() * reportReasons.length)],
          evidence: `Evidence for report ${i}`,
          status: ['pending', 'reviewed', 'resolved'][Math.floor(Math.random() * 3)],
          createdAt,
        },
      })
    }
    console.log('✅ Created reports')

    console.log('\n✅ Database seeded successfully!')
    console.log('\n📊 Summary:')
    console.log(`  • Admin users: 1`)
    console.log(`  • Regular users: ${users.length}`)
    console.log(`  • Sessions: 50`)
    console.log(`  • Payments: 30`)
    console.log(`  • Reports: 25`)
    console.log('\n🔐 Login credentials:')
    console.log('  Email: Nikhilyadav1026@flinxx.com')
    console.log('  Password: nkhlydv')
  } catch (error) {
    console.error('❌ Error seeding database:', error.message)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
  .catch((error) => {
    console.error('❌ Fatal error:', error)
    process.exit(1)
  })
