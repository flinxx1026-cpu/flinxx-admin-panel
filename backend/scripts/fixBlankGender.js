import prisma from '../config/database.js'

/**
 * Fix blank/NULL gender values in users table
 * 
 * Options:
 * Option A: Set all blank to 'unspecified' (recommended)
 * Option B: Randomly assign male/female
 * Option C: Skip - leave them as is
 */

const OPTION = process.argv[2] || 'A' // Default to Option A

async function fixBlankGender() {
  try {
    console.log('🔍 Checking for users with blank/NULL gender...')
    
    // Find users with blank or NULL gender
    const blankGenderUsers = await prisma.$queryRaw`
      SELECT id, email, username
      FROM users
      WHERE gender IS NULL OR gender = '' OR LOWER(gender) NOT IN ('male', 'female')
    `
    
    console.log(`📊 Found ${blankGenderUsers.length} users with blank/invalid gender`)
    
    if (blankGenderUsers.length === 0) {
      console.log('✅ No users with blank gender found!')
      return
    }
    
    console.log('\n📋 Users with blank gender:')
    blankGenderUsers.slice(0, 5).forEach(user => {
      console.log(`   - ${user.email} (${user.username})`)
    })
    if (blankGenderUsers.length > 5) {
      console.log(`   ... and ${blankGenderUsers.length - 5} more`)
    }
    
    let updateCount = 0
    
    if (OPTION.toUpperCase() === 'A') {
      console.log('\n🔧 Option A: Setting all blank gender to "unspecified"...')
      const result = await prisma.$executeRaw`
        UPDATE users
        SET gender = 'unspecified'
        WHERE gender IS NULL OR gender = '' OR LOWER(gender) NOT IN ('male', 'female')
      `
      updateCount = result
      console.log(`✅ Updated ${updateCount} users to "unspecified"`)
      
    } else if (OPTION.toUpperCase() === 'B') {
      console.log('\n🔧 Option B: Randomly assigning male/female to blank users...')
      for (const user of blankGenderUsers) {
        const randomGender = Math.random() > 0.5 ? 'male' : 'female'
        await prisma.user.update({
          where: { id: user.id },
          data: { gender: randomGender }
        })
        updateCount++
      }
      console.log(`✅ Updated ${updateCount} users with random gender assignment`)
      
    } else if (OPTION.toUpperCase() === 'C') {
      console.log('\n⏭️  Option C: Skipping - leaving blank gender as is')
      console.log('💡 Run with "A" or "B" argument to fix')
      console.log('   Example: node scripts/fixBlankGender.js A')
      return
      
    } else {
      console.log('❌ Invalid option. Use A, B, or C')
      console.log('   A = Set to "unspecified"')
      console.log('   B = Random male/female')
      console.log('   C = Skip')
      return
    }
    
    console.log('\n📊 Summary:')
    console.log(`   Total updated: ${updateCount}`)
    console.log(`   Remaining blank: 0`)
    console.log('✨ Blank gender fix completed!')
    
  } catch (error) {
    console.error('❌ Error fixing blank gender:', error.message)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

console.log('🚀 Blank Gender Fixer')
console.log(`📌 Option selected: ${OPTION.toUpperCase()}`)
console.log('---')
fixBlankGender()
