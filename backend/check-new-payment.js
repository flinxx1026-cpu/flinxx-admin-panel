import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkNewPayment() {
  try {
    console.log('🔍 Checking most recent payments...\n')
    
    const recentPayments = await prisma.$queryRaw`
      SELECT id, plan_name, amount, status, created_at
      FROM payments
      ORDER BY created_at DESC
      LIMIT 15
    `
    
    console.log('📋 Last 15 Payments:')
    recentPayments.forEach((p, i) => {
      console.log(`${i+1}. ${p.plan_name}: ₹${p.amount} - ${p.status} - ${p.created_at}`)
    })
    
    // Check if any have 18900
    const wrong = await prisma.$queryRaw`
      SELECT COUNT(*) as count
      FROM payments
      WHERE amount = 18900
    `
    console.log(`\n❌ Payments with ₹18900: ${wrong[0].count}`)
    
    const correct = await prisma.$queryRaw`
      SELECT COUNT(*) as count
      FROM payments
      WHERE amount IN (69, 149, 189)
    `
    console.log(`✅ Payments with correct amounts: ${correct[0].count}`)
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

checkNewPayment()
