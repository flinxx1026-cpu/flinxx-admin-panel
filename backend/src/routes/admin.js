import express from 'express'
import jwt from 'jsonwebtoken'
import bcryptjs from 'bcryptjs'
import prisma from '../config/database.js'

const router = express.Router()

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body
    console.log('🔐 Login attempt:', { email, passwordProvided: !!password })

    let admin = null
    
    try {
      // Try to find admin in database
      admin = await prisma.admin.findUnique({
        where: { email }
      })
      console.log('📊 Database query result:', admin ? 'Admin found' : 'Admin not found')
    } catch (dbError) {
      console.error('⚠️ Database error:', dbError.message)
      // If database query fails, use fallback
      if (email === 'Nikhilyadav1026@flinxx.com' && password === 'nkhlydv') {
        console.log('✅ Using fallback authentication')
        admin = {
          id: 1,
          email: 'Nikhilyadav1026@flinxx.com',
          password: '$2a$10$hw//L5nGXC7fMrTjFOWnHOZJ5XTPJ9PhabzGX4GqLwYClj0haZFae',
          role: 'ADMIN'
        }
      }
    }

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

