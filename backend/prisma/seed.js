import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  try {
    // Create the admin user
    const admin = await prisma.admin.upsert({
      where: { email: 'Nikhilyadav1026@flinxx.com' },
      update: {},
      create: {
        email: 'Nikhilyadav1026@flinxx.com',
        password: '$2a$10$WJuzGs/nCpQXzcmraVjQG.eOb0AFhqyKhQvwLl1lGealSRyMkYnhO',
        role: 'ADMIN',
      },
    })

    console.log('✅ Admin user created/updated:', admin)
  } catch (error) {
    console.error('❌ Error seeding database:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
