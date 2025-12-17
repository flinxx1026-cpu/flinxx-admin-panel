import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function createAdmin() {
  try {
    console.log('🔐 Creating admin user in database...\n')

    // First, check if admin already exists
    const existingAdmin = await prisma.admin.findUnique({
      where: { email: 'Nikhilyadav1026@flinxx.com' }
    })

    if (existingAdmin) {
      console.log('⚠️  Admin user already exists in database')
      console.log('Email:', existingAdmin.email)
      console.log('Role:', existingAdmin.role)
      console.log('\n✅ Database is ready for login!')
      await prisma.$disconnect()
      process.exit(0)
    }

    // Create new admin
    const admin = await prisma.admin.create({
      data: {
        email: 'Nikhilyadav1026@flinxx.com',
        password: '$2a$10$hw//L5nGXC7fMrTjFOWnHOZJ5XTPJ9PhabzGX4GqLwYClj0haZFae',
        role: 'ADMIN',
      },
    })

    console.log('✅ Admin user created successfully!')
    console.log('\nCredentials:')
    console.log('Email:    Nikhilyadav1026@flinxx.com')
    console.log('Password: nkhlydv')
    console.log('\n🎉 You can now login to the admin panel!')

  } catch (error) {
    console.error('❌ Error creating admin:', error.message)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

createAdmin()
