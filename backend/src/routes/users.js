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
    const result = await prisma.$queryRaw`SELECT COUNT(*) as count FROM "users"`
    const sample = await prisma.$queryRaw`SELECT id, email, display_name FROM "users" LIMIT 1`
    res.json({ 
      success: true,
      totalUsers: result[0]?.count || 0,
      sampleUser: sample[0] || null
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
    const { ban_reason } = req.body
    
    console.log(`🚫 Banning user: ${userId}`)
    
    // Ban the user
    await prisma.$executeRaw`
      UPDATE "users" 
      SET 
        is_banned = true,
        ban_reason = ${ban_reason || 'Banned by admin'},
        updated_at = NOW()
      WHERE id = ${userId}::uuid
    `
    
    console.log(`✅ User ${userId} has been banned`)
    res.json({ 
      success: true,
      message: 'User has been banned successfully',
      userId 
    })
  } catch (error) {
    console.error('❌ Error banning user:', error)
    res.status(500).json({ 
      success: false,
      message: 'Error banning user',
      error: error.message 
    })
  }
})

router.post('/:userId/unban', async (req, res) => {
  try {
    const { userId } = req.params
    
    console.log(`✅ Unbanning user: ${userId}`)
    
    // Unban the user
    await prisma.$executeRaw`
      UPDATE "users" 
      SET 
        is_banned = false,
        ban_reason = NULL,
        updated_at = NOW()
      WHERE id = ${userId}::uuid
    `
    
    console.log(`✅ User ${userId} has been unbanned`)
    res.json({ 
      success: true,
      message: 'User has been unbanned successfully',
      userId 
    })
  } catch (error) {
    console.error('❌ Error unbanning user:', error)
    res.status(500).json({ 
      success: false,
      message: 'Error unbanning user',
      error: error.message 
    })
  }
})

router.post('/:userId/warn', async (req, res) => {
  try {
    const { userId } = req.params
    const { warning_message } = req.body
    
    console.log(`⚠️ Sending warning to user: ${userId}`)
    
    // Increment warning count and update last warning time
    await prisma.$executeRaw`
      UPDATE "users" 
      SET 
        warning_count = COALESCE(warning_count, 0) + 1,
        last_warning_at = NOW(),
        updated_at = NOW()
      WHERE id = ${userId}::uuid
    `
    
    // Send system warning message to user
    const warningMsg = warning_message || 'You have received a warning from an admin. Please review our community guidelines.'
    await prisma.$executeRaw`
      INSERT INTO "messages" (id, sender_id, receiver_id, message, created_at, is_read)
      VALUES (
        gen_random_uuid(),
        'admin'::uuid,
        ${userId}::uuid,
        ${'[SYSTEM WARNING] ' + warningMsg},
        NOW(),
        false
      )
    `
    
    console.log(`✅ Warning sent to user ${userId}`)
    res.json({ 
      success: true,
      message: 'Warning sent to user successfully',
      userId 
    })
  } catch (error) {
    console.error('❌ Error warning user:', error)
    res.status(500).json({ 
      success: false,
      message: 'Error sending warning to user',
      error: error.message 
    })
  }
})

export default router

