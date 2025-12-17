import express from 'express'
import jwt from 'jsonwebtoken'
import bcryptjs from 'bcryptjs'
import prisma from '../config/database.js'

const router = express.Router()

// Endpoint to create admin user (for initial setup)
router.post('/create-admin', async (req, res) => {
  try {
    console.log('🔐 Create admin request received')
    
    // Delete existing admin if any (to ensure correct password hash)
    await prisma.admin.deleteMany({
      where: { email: 'Nikhilyadav1026@flinxx.com' }
    })
    console.log('Deleted existing admin if present')
    
    // Hash the password using bcryptjs with 10 salt rounds
    const hashedPassword = bcryptjs.hashSync('nkhlydv', 10)
    console.log('✅ Password hashed with bcryptjs')
    
    // Create admin user with properly hashed password
    const admin = await prisma.admin.create({
      data: {
        email: 'Nikhilyadav1026@flinxx.com',
        password: hashedPassword,
        role: 'ADMIN'
      }
    })
    
    console.log('✅ Admin user created successfully!')
    res.json({
      message: 'Admin user created successfully',
      email: admin.email,
      role: admin.role,
      status: 'success'
    })
  } catch (error) {
    console.error('❌ Error creating admin:', error.message)
    res.status(500).json({ 
      message: 'Failed to create admin',
      error: error.message
    })
  }
})

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body
    console.log('🔐 Login attempt:', { email, passwordProvided: !!password })

    // Try to find admin in database
    const admin = await prisma.admin.findUnique({
      where: { email }
    })
    console.log('📊 Database query result:', admin ? 'Admin found' : 'Admin not found')

    if (!admin) {
      console.log('❌ Admin not found:', email)
      return res.status(401).json({ message: 'Invalid credentials' })
    }

    console.log('🔑 Checking password...')
    const isValidPassword = bcryptjs.compareSync(password, admin.password)
    console.log('✅ Password valid:', isValidPassword)
    
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid credentials' })
    }

    const token = jwt.sign(
      { id: admin.id, email: admin.email, role: admin.role },
      process.env.JWT_SECRET || 'secret-key',
      { expiresIn: '24h' }
    )

    console.log('🎉 Token generated successfully')
    res.json({
      token,
      admin: {
        id: admin.id,
        email: admin.email,
        role: admin.role
      }
    })
  } catch (error) {
    console.error('💥 Login error:', error)
    res.status(500).json({ message: 'Login failed', error: error.message })
  }
})

export default router

