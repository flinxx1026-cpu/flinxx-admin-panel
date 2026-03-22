import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function fixAmounts() {
  try {
    console.log('🔧 Starting payment amount fix...')
    
    // Show before
    const before = await prisma.$queryRaw`
      SELECT plan_name, amount, COUNT(*) as count, CAST(SUM(amount) AS INTEGER) as total
      FROM payments
      GROUP BY plan_name, amount
      ORDER BY plan_name
    `
    
    console.log('\n📊 BEFORE FIX:')
    before.forEach(row => {
      console.log(`  ${row.plan_name}: ₹${row.amount} × ${row.count} txns = ₹${row.total}`)
    })
    
    // Get revenue before
    const revBefore = await prisma.$queryRaw`
      SELECT CAST(COALESCE(SUM(amount), 0) AS INTEGER) as total
      FROM payments
      WHERE status = 'completed' OR status = 'paid'
    `
    console.log(`\n💰 Total Revenue BEFORE: ₹${revBefore[0].total}`)
    
    // Fix: divide by 100
    const fixed = await prisma.$executeRaw`
      UPDATE payments
      SET amount = amount / 100
      WHERE amount > 100
    `
    
    console.log(`\n✅ Fixed ${fixed} payment records`)
    
    // Show after
    const after = await prisma.$queryRaw`
      SELECT plan_name, amount, COUNT(*) as count, CAST(SUM(amount) AS INTEGER) as total
      FROM payments
      GROUP BY plan_name, amount
      ORDER BY plan_name
    `
    
    console.log('\n📊 AFTER FIX:')
    after.forEach(row => {
      console.log(`  ${row.plan_name}: ₹${row.amount} × ${row.count} txns = ₹${row.total}`)
    })
    
    // Get revenue after
    const revAfter = await prisma.$queryRaw`
      SELECT CAST(COALESCE(SUM(amount), 0) AS INTEGER) as total
      FROM payments
      WHERE status = 'completed' OR status = 'paid'
    `
    console.log(`\n💰 Total Revenue AFTER: ₹${revAfter[0].total}`)
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

fixAmounts()
