import express from 'express'
import prisma from '../config/database.js'
import { verifyAdminToken } from '../middleware/authMiddleware.js'

const router = express.Router()

// Debug route - raw SQL test
router.get('/debug/sql-test', async (req, res) => {
  try {
    console.log('🧪 Raw SQL test endpoint called')
    const result = await prisma.$queryRaw`SELECT id, email, display_name FROM "users" LIMIT 5`
    res.json({ 
      success: true,
      data: result
    })
  } catch (error) {
    console.error('🧪 Raw SQL test failed:', error)
    res.status(500).json({ 
      success: false,
      error: error.message,
      stack: error.stack
    })
  }
})

// Debug route - test database without auth
router.get('/debug/test', async (req, res) => {
  try {
    console.log('🧪 Debug test endpoint called')
    const count = await prisma.user.count()
    const sample = await prisma.user.findFirst()
    res.json({ 
      success: true,
      totalUsers: count,
      sampleUser: sample
    })
  } catch (error) {
    console.error('🧪 Debug test failed:', error)
    res.status(500).json({ 
      success: false,
      error: error.message,
      stack: error.stack
    })
  }
})

// GET users - public read access for now
router.get('/', async (req, res) => {
  try {
    const { search } = req.query
    console.log(`📨 Users endpoint called with search: "${search || 'none'}"`)

    // Use raw SQL to avoid any relation loading issues
    let users
    if (search && search.trim()) {
      console.log(`🔍 Searching for users with query: "${search}"`)
      users = await prisma.$queryRaw`
        SELECT id, email, display_name, photo_url, created_at, age, gender 
        FROM "users" 
        WHERE email ILIKE ${'%' + search + '%'} OR display_name ILIKE ${'%' + search + '%'}
        LIMIT 100
      `
      console.log(`✅ Found ${users.length} user(s) matching search: "${search}"`)
    } else {
      // Fetch all users
      console.log('📥 Fetching all users from database...')
      users = await prisma.$queryRaw`
        SELECT id, email, display_name, photo_url, created_at, age, gender 
        FROM "users" 
        LIMIT 100
      `
      console.log(`✅ Fetched all ${users.length} users from database`)
    }
    
    res.json({ users })
  } catch (error) {
    console.error('❌ Error fetching users:', error)
    console.error('Error message:', error.message)
    console.error('Error code:', error.code)
    console.error('Error stack:', error.stack)
    res.status(500).json({ 
      message: 'Error fetching users', 
      error: error.message,
      code: error.code,
      stack: error.stack
    })
  }
})

// Protect all write operations with authentication
router.use(verifyAdminToken)

router.post('/:userId/ban', async (req, res) => {
  try {
    const { userId } = req.params
    res.json({ message: 'User ban feature not yet implemented', userId })
  } catch (error) {
    console.error('Error banning user:', error)
    res.status(500).json({ message: 'Error banning user' })
  }
})

router.post('/:userId/unban', async (req, res) => {
  try {
    const { userId } = req.params
    res.json({ message: 'User unban feature not yet implemented', userId })
  } catch (error) {
    console.error('Error unbanning user:', error)
    res.status(500).json({ message: 'Error unbanning user' })
  }
})

router.post('/:userId/warn', async (req, res) => {
  try {
    const { userId } = req.params
    // This would typically store a warning record - for now just return success
    res.json({ message: 'Warning sent to user' })
  } catch (error) {
    console.error('Error warning user:', error)
    res.status(500).json({ message: 'Error warning user' })
  }
})

router.post('/:userId/reset-coins', async (req, res) => {
  try {
    const { userId } = req.params
    res.json({ message: 'Coins reset feature not yet implemented', userId })
  } catch (error) {
    console.error('Error resetting coins:', error)
    res.status(500).json({ message: 'Error resetting coins' })
  }
})

export default router

