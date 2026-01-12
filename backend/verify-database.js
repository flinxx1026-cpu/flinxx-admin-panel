import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkDatabase() {
  console.log('\n========== DATABASE VERIFICATION ==========\n')
  
  try {
    const userCount = await prisma.user.count()
    const activeUserCount = await prisma.user.count({ where: { banned: false } })
    const bannedUserCount = await prisma.user.count({ where: { banned: true } })
    const sessionCount = await prisma.session.count()
    const ongoingSessionCount = await prisma.session.count({ where: { endedAt: null } })
    const paymentCount = await prisma.payment.count({ where: { status: 'completed' } })
    const reportCount = await prisma.report.count({ where: { status: 'pending' } })

    const payments = await prisma.payment.findMany({ where: { status: 'completed' } })
    const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0)

    console.log('✅ DATABASE COUNTS:')
    console.log(`  Total Users: ${userCount}`)
    console.log(`  Active Users (not banned): ${activeUserCount}`)
    console.log(`  Banned Users: ${bannedUserCount}`)
    console.log(`  Total Sessions: ${sessionCount}`)
    console.log(`  Ongoing Sessions (endedAt = null): ${ongoingSessionCount}`)
    console.log(`  Completed Payments: ${paymentCount}`)
    console.log(`  Total Revenue: $${totalRevenue.toFixed(2)}`)
    console.log(`  Pending Reports: ${reportCount}`)
    console.log('\n✅ These are the EXACT values the API should return')
    console.log('========================================\n')

  } catch (error) {
    console.error('Error checking database:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

checkDatabase()
