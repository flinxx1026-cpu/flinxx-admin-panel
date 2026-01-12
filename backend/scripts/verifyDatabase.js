import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * DATABASE VERIFICATION SCRIPT
 * 
 * Verifies that:
 * 1. Only real data exists (no seeded demo data)
 * 2. Only admin account is present (if applicable)
 * 3. Database is clean and ready for production use
 */

async function verifyCleanDatabase() {
  console.log('🔍 VERIFYING PRODUCTION DATABASE...\n')

  try {
    // Get statistics
    const stats = {
      users: await prisma.user.count(),
      sessions: await prisma.session.count(),
      payments: await prisma.payment.count(),
      reports: await prisma.report.count(),
      admins: await prisma.admin.count(),
    }

    console.log('📊 Current Database State:')
    console.log(`   Users: ${stats.users}`)
    console.log(`   Sessions: ${stats.sessions}`)
    console.log(`   Payments: ${stats.payments}`)
    console.log(`   Reports: ${stats.reports}`)
    console.log(`   Admin accounts: ${stats.admins}`)
    console.log('')

    // Check for demo data patterns
    console.log('🔎 Checking for seeded/demo data patterns...\n')

    const issues = []

    // Check users for demo email patterns
    if (stats.users > 0) {
      const demoUsers = await prisma.user.findMany({
        where: {
          OR: [
            { email: { contains: 'user' } },
            { email: { contains: 'test' } },
            { username: { contains: 'user' } },
            { username: { contains: 'test' } },
          ]
        }
      })

      if (demoUsers.length > 0) {
        issues.push(`⚠️  Found ${demoUsers.length} potential demo users (emails/usernames containing 'user' or 'test')`)
        console.log('   Sample demo users:')
        demoUsers.slice(0, 5).forEach(u => {
          console.log(`     - ${u.email} (@${u.username}) created: ${u.createdAt}`)
        })
      }
    }

    // Check for multiple users created in same second (typical of seeded data)
    if (stats.users > 0) {
      const usersBySecond = await prisma.$queryRaw`
        SELECT DATE_TRUNC('second', "createdAt") as second, COUNT(*) as count
        FROM "User"
        GROUP BY DATE_TRUNC('second', "createdAt")
        HAVING COUNT(*) > 1
        ORDER BY count DESC
        LIMIT 10
      `

      if (usersBySecond.length > 0) {
        console.log('\n   ⚠️  Users created within the same second (seeding indicator):')
        usersBySecond.forEach(row => {
          console.log(`     - ${row.count} users at ${row.second}`)
        })
        issues.push(`⚠️  Found ${usersBySecond.length} timestamps with multiple user creations (typical of seeded data)`)
      }
    }

    // Check for specific test data patterns
    if (stats.payments > 0) {
      const testPayments = await prisma.payment.findMany({
        where: {
          transactionId: {
            startsWith: 'txn_'
          }
        },
        take: 5
      })

      if (testPayments.length > 0) {
        issues.push(`⚠️  Found payments with 'txn_' prefix (typical of demo data)`)
        console.log('\n   Sample transaction IDs:')
        testPayments.forEach(p => {
          console.log(`     - ${p.transactionId}`)
        })
      }
    }

    // Summary
    console.log('\n' + '='.repeat(50))
    if (issues.length === 0) {
      console.log('✅ DATABASE VERIFICATION PASSED')
      console.log('   - Database appears clean and production-ready')
      console.log('   - No obvious seeded/demo data detected')
    } else {
      console.log('⚠️  DATABASE CONTAINS POTENTIAL SEEDED DATA')
      console.log('\nIssues found:')
      issues.forEach(issue => console.log(`   ${issue}`))
      console.log('\nNext steps:')
      console.log('   1. Review the data above carefully')
      console.log('   2. Confirm it is actually demo/seeded data')
      console.log('   3. If confirmed, run: npm run cleanup-production')
    }
    console.log('='.repeat(50))

    return {
      clean: issues.length === 0,
      stats,
      issues
    }

  } catch (error) {
    console.error('❌ Error during verification:', error.message)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run verification
verifyCleanDatabase()
  .then((result) => {
    process.exit(result.clean ? 0 : 1)
  })
  .catch((error) => {
    console.error('❌ Verification failed:', error)
    process.exit(1)
  })
