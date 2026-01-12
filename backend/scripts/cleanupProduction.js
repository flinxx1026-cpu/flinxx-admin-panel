import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

/**
 * PRODUCTION DATA CLEANUP SCRIPT
 * 
 * This script removes all seeded/demo data from production database
 * while preserving the primary admin account.
 * 
 * IMPORTANT: This script should ONLY be run on production after:
 * 1. Full database backup is taken
 * 2. User confirmation is received
 * 3. No active API requests are being processed
 */

async function cleanupProduction() {
  const timestamp = new Date().toISOString()
  const logFile = `cleanup_log_${timestamp.replace(/[:.]/g, '-')}.txt`
  
  const log = (message) => {
    const logMessage = `[${new Date().toISOString()}] ${message}`
    console.log(logMessage)
    fs.appendFileSync(logFile, logMessage + '\n')
  }

  try {
    log('========== PRODUCTION CLEANUP STARTED ==========')
    log(`Timestamp: ${timestamp}`)
    log('')

    // Get counts before cleanup
    log('📊 Getting pre-cleanup statistics...')
    const preCleanupStats = {
      users: await prisma.user.count(),
      sessions: await prisma.session.count(),
      payments: await prisma.payment.count(),
      reports: await prisma.report.count(),
      admins: await prisma.admin.count(),
    }
    
    log(`Pre-cleanup counts:`)
    log(`  - Users: ${preCleanupStats.users}`)
    log(`  - Sessions: ${preCleanupStats.sessions}`)
    log(`  - Payments: ${preCleanupStats.payments}`)
    log(`  - Reports: ${preCleanupStats.reports}`)
    log(`  - Admins: ${preCleanupStats.admins}`)
    log('')

    // CLEANUP PROCESS - DELETE IN REVERSE DEPENDENCY ORDER
    log('🗑️  Starting data deletion (reverse dependency order)...')

    // 1. Delete sessions (no dependencies)
    log('Deleting Sessions...')
    const deletedSessions = await prisma.session.deleteMany({})
    log(`✅ Deleted ${deletedSessions.count} sessions`)

    // 2. Delete payments (no dependencies)
    log('Deleting Payments...')
    const deletedPayments = await prisma.payment.deleteMany({})
    log(`✅ Deleted ${deletedPayments.count} payments`)

    // 3. Delete reports (references users but no cascade)
    log('Deleting Reports...')
    const deletedReports = await prisma.report.deleteMany({})
    log(`✅ Deleted ${deletedReports.count} reports`)

    // 4. Delete all users (organic and seeded)
    log('Deleting Users...')
    const deletedUsers = await prisma.user.deleteMany({})
    log(`✅ Deleted ${deletedUsers.count} users`)

    // 5. PRESERVE admin account - DO NOT DELETE
    log('Preserving Admin account...')
    const adminCount = await prisma.admin.count()
    log(`✅ Admin account preserved (${adminCount} admin(s) remain)`)

    log('')

    // Get counts after cleanup
    log('📊 Getting post-cleanup statistics...')
    const postCleanupStats = {
      users: await prisma.user.count(),
      sessions: await prisma.session.count(),
      payments: await prisma.payment.count(),
      reports: await prisma.report.count(),
      admins: await prisma.admin.count(),
    }

    log(`Post-cleanup counts:`)
    log(`  - Users: ${postCleanupStats.users}`)
    log(`  - Sessions: ${postCleanupStats.sessions}`)
    log(`  - Payments: ${postCleanupStats.payments}`)
    log(`  - Reports: ${postCleanupStats.reports}`)
    log(`  - Admins: ${postCleanupStats.admins}`)
    log('')

    // Summary
    log('========== CLEANUP SUMMARY ==========')
    log(`Deleted records:`)
    log(`  - ${preCleanupStats.users} Users → ${postCleanupStats.users} remaining`)
    log(`  - ${preCleanupStats.sessions} Sessions → ${postCleanupStats.sessions} remaining`)
    log(`  - ${preCleanupStats.payments} Payments → ${postCleanupStats.payments} remaining`)
    log(`  - ${preCleanupStats.reports} Reports → ${postCleanupStats.reports} remaining`)
    log(`  - Admin account: PRESERVED (${postCleanupStats.admins})`)
    log('')
    log('✅ CLEANUP COMPLETED SUCCESSFULLY')
    log(`Log file: ${logFile}`)
    log('========== END OF CLEANUP ==========')

    return {
      success: true,
      deleted: {
        users: preCleanupStats.users,
        sessions: preCleanupStats.sessions,
        payments: preCleanupStats.payments,
        reports: preCleanupStats.reports,
      },
      remaining: postCleanupStats,
      logFile,
    }

  } catch (error) {
    log(`❌ ERROR during cleanup: ${error.message}`)
    log(`Stack: ${error.stack}`)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run cleanup
cleanupProduction()
  .then((result) => {
    process.exit(result.success ? 0 : 1)
  })
  .catch((error) => {
    console.error('❌ Cleanup failed:', error)
    process.exit(1)
  })
