import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database with admin user...')

  try {
    // Delete existing admin if any
    await prisma.admin.deleteMany({
      where: { email: 'Nikhilyadav1026@flinxx.com' }
    })

    // Create the admin user
    const admin = await prisma.admin.create({
      data: {
        email: 'Nikhilyadav1026@flinxx.com',
        password: '$2a$10$hw//L5nGXC7fMrTjFOWnHOZJ5XTPJ9PhabzGX4GqLwYClj0haZFae',
        role: 'ADMIN',
      },
    })

    console.log('✅ Admin user created successfully!')
    console.log('Email: Nikhilyadav1026@flinxx.com')
    console.log('Password: nkhlydv')
  } catch (error) {
    console.error('❌ Error seeding database:', error.message)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
  .catch((error) => {
    console.error('❌ Fatal error:', error)
    process.exit(1)
  })
