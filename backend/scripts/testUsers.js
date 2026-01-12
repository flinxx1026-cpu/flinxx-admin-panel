import dotenv from 'dotenv'
import { PrismaClient } from '@prisma/client'

dotenv.config()
const prisma = new PrismaClient()

async function test() {
  const count = await prisma.user.count()
  console.log(`✅ Total users: ${count}`)
  
  const users = await prisma.user.findMany({ take: 10 })
  console.log('\n📋 Sample users:')
  users.forEach((u, i) => {
    console.log(`  ${i+1}. ${u.email} - ${u.display_name || 'N/A'}`)
  })
  
  await prisma.$disconnect()
}

test()
