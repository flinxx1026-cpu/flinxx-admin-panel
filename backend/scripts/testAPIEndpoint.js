import dotenv from 'dotenv'
import { PrismaClient } from '@prisma/client'
import fetch from 'node-fetch'

dotenv.config()

const prisma = new PrismaClient()

async function testAPIEndpoint() {
  try {
    console.log('🧪 Testing /api/admin/users endpoint...\n')

    // First, verify database has users
    const dbUsers = await prisma.user.count()
    console.log(`📊 Database has ${dbUsers} users\n`)

    // Test the API endpoint
    const response = await fetch('http://localhost:3001/api/admin/users')
    
    if (!response.ok) {
      console.error(`❌ API returned status ${response.status}`)
      return
    }

    const data = await response.json()
    console.log(`✅ API Response received`)
    console.log(`   Total users from API: ${data.users.length}`)
    
    if (data.users.length > 0) {
      console.log(`\n📋 First 5 users from API:`)
      data.users.slice(0, 5).forEach((user, idx) => {
        console.log(`   ${idx + 1}. ID: ${user.id}, Username: ${user.username}, Email: ${user.email}`)
      })
    }

  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

testAPIEndpoint()
