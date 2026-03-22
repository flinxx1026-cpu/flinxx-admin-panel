import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function fixLatestPayment() {
  try {
    console.log('🔧 Fixing latest payment amount...\n')
    
    // Find and fix the 18900 payment
    const result = await prisma.$executeRaw`
      UPDATE payments
      SET amount = 189
      WHERE amount = 18900
    `
    
    console.log(`✅ Fixed ${result} payment record(s)`)
    
    // Show the fixed payment
    const fixed = await prisma.$queryRaw`
      SELECT id, plan_name, amount, status, created_at
      FROM payments
      WHERE plan_name = 'Match Boost'
      ORDER BY created_at DESC
      LIMIT 3
    `
    
    console.log('\n📋 Recent Match Boost payments:')
    fixed.forEach((p, i) => {
      console.log(`${i+1}. ₹${p.amount} - ${p.status} - ${p.created_at}`)
    })
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

fixLatestPayment()
