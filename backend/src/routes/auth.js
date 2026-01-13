import express from 'express'
import jwt from 'jsonwebtoken'
import bcryptjs from 'bcryptjs'
import prisma from '../config/database.js'

const router = express.Router()

// User signup endpoint
router.post('/signup', async (req, res) => {
  try {
    const { email, username, password, confirmPassword } = req.body

    // Validation
    if (!email || !username || !password || !confirmPassword) {
      return res.status(400).json({ message: 'All fields are required' })
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' })
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' })
    }

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: email.toLowerCase() },
          { username: username.toLowerCase() }
        ]
      }
    })

    if (existingUser) {
      return res.status(409).json({ 
        message: existingUser.email === email.toLowerCase() 
          ? 'Email already registered' 
          : 'Username already taken' 
      })
    }

    // Hash password
    const hashedPassword = bcryptjs.hashSync(password, 10)

    // Create user
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        username: username.toLowerCase(),
        password: hashedPassword,
        verified: false,
        banned: false,
        coins: 0
      }
    })

    console.log('✅ User registered successfully:', { id: user.id, email: user.email })

    // Generate token
    const token = jwt.sign(
      { id: user.id, email: user.email, username: user.username },
      process.env.JWT_SECRET || 'secret-key',
      { expiresIn: '24h' }
    )

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        verified: user.verified
      }
    })
  } catch (error) {
    console.error('❌ Signup error:', error)
    res.status(500).json({ message: 'Signup failed', error: error.message })
  }
})

// User login endpoint
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' })
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    })

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' })
    }

    if (user.banned === true) {
      return res.status(403).json({
        code: "USER_BANNED",
        message: 'Your account is banned'
      })
    }

    // Check password
    const isValidPassword = bcryptjs.compareSync(password, user.password)

    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid credentials' })
    }

    // Generate token
    const token = jwt.sign(
      { id: user.id, email: user.email, username: user.username },
      process.env.JWT_SECRET || 'secret-key',
      { expiresIn: '24h' }
    )

    console.log('✅ User logged in successfully:', { id: user.id, email: user.email })

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        verified: user.verified,
        coins: user.coins
      }
    })
  } catch (error) {
    console.error('❌ Login error:', error)
    res.status(500).json({ message: 'Login failed', error: error.message })
  }
})

// Get current user info (requires token)
router.get('/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]
    
    if (!token) {
      return res.status(401).json({ message: 'No token provided' })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret-key')
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.id }
    })

    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    res.json({
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        verified: user.verified,
        coins: user.coins,
        banned: user.banned
      }
    })
  } catch (error) {
    console.error('❌ Error getting user info:', error)
    res.status(401).json({ message: 'Invalid or expired token' })
  }
})

export default router
