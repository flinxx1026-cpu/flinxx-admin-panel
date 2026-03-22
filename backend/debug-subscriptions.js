import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function debugSubscriptions() {
  try {
    console.log('🔍 Checking subscription data...\n')
    
    // Count each subscription type
    const blueTick = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM users 
      WHERE "has_blue_tick" = true AND "blue_tick_expires_at" > NOW()
    `
    
    const matchBoost = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM users 
      WHERE "has_match_boost" = true AND "match_boost_expires_at" > NOW()
    `
    
    const unlimitedSkip = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM users 
      WHERE "has_unlimited_skip" = true AND "unlimited_skip_expires_at" > NOW()
    `
    
    console.log('📊 Active Subscriptions Breakdown:')
    console.log(`  Blue Tick: ${blueTick[0].count}`)
    console.log(`  Match Boost: ${matchBoost[0].count}`)
    console.log(`  Unlimited Skip: ${unlimitedSkip[0].count}`)
    console.log(`  TOTAL: ${blueTick[0].count + matchBoost[0].count + unlimitedSkip[0].count}`)
    
    console.log('\n📋 Active Premium Users (with transactions):')
    const activeUsers = await prisma.$queryRaw`
      SELECT DISTINCT u.id,
        u."has_blue_tick", u."blue_tick_expires_at",
        u."has_match_boost", u."match_boost_expires_at",
        u."has_unlimited_skip", u."unlimited_skip_expires_at"
      FROM users u
      INNER JOIN payments p ON p."user_id" = u.id
      WHERE (
        (u."has_blue_tick" = true AND u."blue_tick_expires_at" > NOW()) OR
        (u."has_match_boost" = true AND u."match_boost_expires_at" > NOW()) OR
        (u."has_unlimited_skip" = true AND u."unlimited_skip_expires_at" > NOW())
      )
      ORDER BY u.id
    `
    
    activeUsers.forEach((user, i) => {
      console.log(`\n  User ${i+1}: ${user.id.substring(0, 8)}...`)
      if (user.has_blue_tick && user.blue_tick_expires_at > new Date()) {
        console.log(`    ✓ Blue Tick (expires: ${user.blue_tick_expires_at})`)
      }
      if (user.has_match_boost && user.match_boost_expires_at > new Date()) {
        console.log(`    ✓ Match Boost (expires: ${user.match_boost_expires_at})`)
      }
      if (user.has_unlimited_skip && user.unlimited_skip_expires_at > new Date()) {
        console.log(`    ✓ Unlimited Skip (expires: ${user.unlimited_skip_expires_at})`)
      }
    })
    
    console.log(`\nTotal users with active subs: ${activeUsers.length}`)
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

debugSubscriptions()
