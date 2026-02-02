import dotenv from 'dotenv'
import prisma from './src/config/database.js'
import bcryptjs from 'bcryptjs'

dotenv.config()

async function createAdmin() {
  try {
    console.log('🔐 Creating admin user...')
    
    // Delete existing admin if any
    await prisma.admin.deleteMany({
      where: { email: 'Nikhilyadav1026@flinxx.com' }
    })
    console.log('✓ Cleared existing admins')
    
    // Hash the password
    const hashedPassword = bcryptjs.hashSync('nkhlydv', 10)
    console.log('✓ Password hashed')
    
    // Create admin
    const admin = await prisma.admin.create({
      data: {
        email: 'Nikhilyadav1026@flinxx.com',
        password: hashedPassword,
        role: 'ADMIN'
      }
    })
    
    console.log('✅ Admin user created successfully!')
    console.log('📧 Email:', admin.email)
    console.log('🔑 Password: nkhlydv')
    console.log('👤 Role:', admin.role)
    
    await prisma.$disconnect()
    process.exit(0)
  } catch (error) {
    console.error('❌ Error:', error.message)
    await prisma.$disconnect()
    process.exit(1)
  }
}

createAdmin()
