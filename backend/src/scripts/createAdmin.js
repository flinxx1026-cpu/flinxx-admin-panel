import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function createAdmin() {
  try {
    const admin = await prisma.admin.create({
      data: {
        email: 'Nikhilyadav1026@flinxx.com',
        password: '$2a$10$WJuzGs/nCpQXzcmraVjQG.eOb0AFhqyKhQvwLl1lGealSRyMkYnhO',
        role: 'ADMIN'
      }
    })

    console.log('✅ Admin created successfully:')
    console.log(admin)
  } catch (error) {
    console.error('❌ Error creating admin:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createAdmin()
