import express from 'express'
import jwt from 'jsonwebtoken'
import bcryptjs from 'bcryptjs'

const router = express.Router()

// Mock admin data - replace with DB queries
const admins = [
  {
    id: '1',
    name: 'Admin User',
    email: 'admin@flinxx.com',
    password: bcryptjs.hashSync('password', 10),
    role: 'Super Admin'
  }
]

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body
    console.log('Login attempt:', { email, receivedPassword: password ? 'provided' : 'missing' })

    const admin = admins.find(a => a.email === email)
    if (!admin) {
      console.log('Admin not found:', email)
      return res.status(401).json({ message: 'Invalid credentials' })
    }

    console.log('Admin found, checking password...')
    const isValidPassword = bcryptjs.compareSync(password, admin.password)
    console.log('Password valid:', isValidPassword)
    
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid credentials' })
    }

    const token = jwt.sign(
      { id: admin.id, email: admin.email, role: admin.role },
      process.env.JWT_SECRET || 'secret-key',
      { expiresIn: '24h' }
    )

    console.log('Token generated successfully')
    res.json({
      token,
      admin: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: admin.role
      }
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ message: 'Login failed', error: error.message })
  }
})

export default router
