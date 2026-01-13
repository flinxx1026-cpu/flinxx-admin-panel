import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const testUserId = '4c75b411-f49b-44ae-b07d-403f6d059953'

async function main() {
  try {
    console.log(`\n🔍 Testing ban endpoint for user: ${testUserId}\n`)

    // Check if user exists
    console.log('📋 Checking if user exists in database...')
    const user = await prisma.user.findUnique({
      where: { id: testUserId }
    })

    if (user) {
      console.log('✅ User found:', {
        id: user.id,
        email: user.email,
        display_name: user.display_name,
        banned: user.banned
      })

      // Try to ban the user
      console.log('\n🚫 Attempting to ban user...')
      const bannedUser = await prisma.user.update({
        where: { id: testUserId },
        data: { banned: true }
      })

      console.log('✅ User banned successfully:', {
        id: bannedUser.id,
        email: bannedUser.email,
        banned: bannedUser.banned
      })
    } else {
      console.log('❌ User not found in database')
      
      // Show some users that do exist
      console.log('\n📊 Users in database:')
      const users = await prisma.user.findMany({
        take: 5,
        select: { id: true, email: true, display_name: true, banned: true }
      })
      
      if (users.length > 0) {
        users.forEach(u => {
          console.log(`  - ${u.id}: ${u.email} (${u.display_name || 'no name'})`)
        })
      } else {
        console.log('  No users found in database')
      }
    }
  } catch (error) {
    console.error('❌ Error:', error.message)
    console.error('Code:', error.code)
    console.error('Meta:', error.meta)
  } finally {
    await prisma.$disconnect()
  }
}

main()
