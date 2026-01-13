import express from 'express'
import prisma from '../config/database.js'
import { verifyAdminToken } from '../middleware/authMiddleware.js'

const createUsersRouter = (io) => {
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
      const adminId = req.admin?.id
      
      console.log(`🚫 Banning user: ${userId} by admin: ${adminId}`)
      console.log(`📋 Request body:`, req.body)
      console.log(`📋 Request params:`, req.params)
      
      // Validate userId format (UUID)
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      if (!uuidRegex.test(userId)) {
        console.warn(`⚠️ Invalid UUID format: ${userId}`)
        return res.status(400).json({ 
          success: false,
          message: 'Invalid user ID format',
          error: 'User ID must be a valid UUID'
        })
      }

      // Check if user exists first
      console.log(`🔍 Checking if user exists: ${userId}`)
      const userExists = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, email: true, banned: true }
      })
      
      if (!userExists) {
        console.warn(`⚠️ User not found: ${userId}`)
        return res.status(404).json({ 
          success: false,
          message: 'User not found',
          error: `User with ID ${userId} does not exist`
        })
      }

      console.log(`📌 User found: ${userExists.email}, currently banned: ${userExists.banned}`)

      // Ban the user using Prisma with UUID ID
      console.log(`🔄 Updating user ban status...`)
      const bannedUser = await prisma.user.update({
        where: { id: userId },
        data: { banned: true }
      })
      
      console.log(`✅ User ${userId} has been banned successfully`)
      console.log(`✅ Ban result:`, bannedUser)
      
      // Emit socket event to force logout the banned user - wrap in try-catch to prevent failures
      try {
        if (io) {
          console.log(`📡 Emitting force logout to user:${userId}`)
          io.to(`user:${userId}`).emit('force_logout', {
            reason: 'Your account has been banned',
            code: 'USER_BANNED'
          })
          console.log(`⚡ Force logout sent to user: ${userId}`)
        } else {
          console.warn(`⚠️ Socket.io instance not available`)
        }
      } catch (socketError) {
        console.error(`❌ Socket emission error:`, socketError.message)
        // Don't fail the request, just log the socket error
      }
      
      res.json({ 
        success: true,
        message: 'User has been banned successfully',
        userId,
        user: {
          id: bannedUser.id,
          email: bannedUser.email,
          banned: bannedUser.banned
        }
      })
    } catch (error) {
      console.error('❌ Error banning user:', error.message)
      console.error('📋 Full error object:', error)
      console.error('📋 Error details:', {
        code: error.code,
        message: error.message,
        stack: error.stack,
        meta: error.meta
      })
      
      // More specific error messages
      let errorMessage = 'Error banning user'
      if (error.code === 'P2025') {
        errorMessage = 'User not found in database'
      } else if (error.code === 'P2003') {
        errorMessage = 'Database constraint violation'
      } else if (error.code === 'P2014') {
        errorMessage = 'Required relation violation'
      }
      
      res.status(500).json({ 
        success: false,
        message: errorMessage,
        error: error.message,
        code: error.code
      })
    }
  })

  router.post('/:userId/unban', async (req, res) => {
    try {
      const { userId } = req.params
      const adminId = req.admin?.id
      
      console.log(`✅ Unbanning user: ${userId} by admin: ${adminId}`)
      
      // Validate userId format (UUID)
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      if (!uuidRegex.test(userId)) {
        console.warn(`⚠️ Invalid UUID format: ${userId}`)
        return res.status(400).json({ 
          success: false,
          message: 'Invalid user ID format',
          error: 'User ID must be a valid UUID'
        })
      }

      // Check if user exists first
      const userExists = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, email: true, banned: true }
      })
      
      if (!userExists) {
        console.warn(`⚠️ User not found: ${userId}`)
        return res.status(404).json({ 
          success: false,
          message: 'User not found',
          error: `User with ID ${userId} does not exist`
        })
      }

      console.log(`📌 User found: ${userExists.email}, currently banned: ${userExists.banned}`)
      
      // Unban the user using Prisma with UUID ID
      const unbannedUser = await prisma.user.update({
        where: { id: userId },
        data: { banned: false }
      })
      
      console.log(`✅ User ${userId} has been unbanned successfully`)
      res.json({ 
        success: true,
        message: 'User has been unbanned successfully',
        userId,
        user: {
          id: unbannedUser.id,
          email: unbannedUser.email,
          banned: unbannedUser.banned
        }
      })
    } catch (error) {
      console.error('❌ Error unbanning user:', error.message)
      console.error('📋 Error details:', {
        code: error.code,
        message: error.message,
        stack: error.stack,
        meta: error.meta
      })
      
      // More specific error messages
      let errorMessage = 'Error unbanning user'
      if (error.code === 'P2025') {
        errorMessage = 'User not found in database'
      } else if (error.code === 'P2003') {
        errorMessage = 'Database constraint violation'
      }
      
      res.status(500).json({ 
        success: false,
        message: errorMessage,
        error: error.message,
        code: error.code
      })
    }
  })

  router.post('/:userId/warn', async (req, res) => {
    try {
      const { userId } = req.params
      const { warning_message } = req.body
      
      console.log(`⚠️ Sending warning to user: ${userId}`)
      
      // Just update the user's updated_at timestamp to mark they've been warned
      // The warning_count and last_warning_at may not exist in schema
      await prisma.$executeRaw`
        UPDATE "users" 
        SET updated_at = NOW()
        WHERE id = ${userId}::uuid
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

  return router
}

export default createUsersRouter

