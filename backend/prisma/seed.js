import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * DISABLED SEEDING FILE
 * 
 * This file has been DISABLED to prevent accidental seeding of production database.
 * 
 * IMPORTANT: DO NOT USE npm run seed on production!
 * 
 * If you need to add initial admin credentials, use the dedicated script:
 * cd backend && node scripts/seedAdmin.js
 * 
 * For development/testing only, create a separate development seed file.
 */

async function main() {
  console.log('⚠️  SEEDING DISABLED FOR PRODUCTION')
  console.log('')
  console.log('This seeding file has been disabled to prevent accidental')
  console.log('deletion of production data.')
  console.log('')
  console.log('If you need to:')
  console.log('  1. Create admin user: node scripts/seedAdmin.js')
  console.log('  2. Reset development DB: Contact your team lead')
  console.log('  3. View database: Use cleanupProduction.js for production cleanup')
  console.log('')
  console.log('DO NOT RUN npm run seed ON PRODUCTION!')
  process.exit(0)
}

main()
  .catch((error) => {
    console.error('❌ Fatal error:', error)
    process.exit(1)
  })
