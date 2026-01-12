import dotenv from 'dotenv'
import { PrismaClient } from '@prisma/client'

dotenv.config()

const prisma = new PrismaClient()

async function checkUsers() {
  try {
    console.log('🔍 Checking user data in database...\n')

    const totalUsers = await prisma.user.count()
    console.log(`✅ Total Users: ${totalUsers}`)

    const bannedUsers = await prisma.user.count({
      where: { banned: true }
    })
    console.log(`🚫 Banned Users: ${bannedUsers}`)

    const activeUsers = await prisma.user.count({
      where: { banned: false }
    })
    console.log(`✅ Active Users (not banned): ${activeUsers}`)

    const verifiedUsers = await prisma.user.count({
      where: { verified: true }
    })
    console.log(`✔️ Verified Users: ${verifiedUsers}`)

    const unverifiedUsers = await prisma.user.count({
      where: { verified: false }
    })
    console.log(`❌ Unverified Users: ${unverifiedUsers}`)

    // Check new signups in last 24 hours
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const newSignups = await prisma.user.count({
      where: {
        createdAt: {
          gte: oneDayAgo
        }
      }
    })
    console.log(`📝 New Signups (24h): ${newSignups}`)

    // Get a few sample users
    console.log('\n📋 Sample Users:')
    const sampleUsers = await prisma.user.findMany({
      take: 5,
      select: {
        id: true,
        username: true,
        email: true,
        banned: true,
        verified: true,
        createdAt: true
      }
    })

    sampleUsers.forEach(user => {
      console.log(
        `  - ID: ${user.id}, Username: ${user.username}, Email: ${user.email}, Banned: ${user.banned}, Verified: ${user.verified}, Created: ${user.createdAt.toISOString()}`
      )
    })

    // Check sessions and payments
    console.log('\n📊 Other Data:')
    const totalSessions = await prisma.session.count()
    const totalPayments = await prisma.payment.count()
    const totalReports = await prisma.report.count()

    console.log(`  - Total Sessions: ${totalSessions}`)
    console.log(`  - Total Payments: ${totalPayments}`)
    console.log(`  - Total Reports: ${totalReports}`)

  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

checkUsers()
