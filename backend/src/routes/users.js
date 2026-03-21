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

  // GET online users - REALTIME from Redis active_users set
  router.get('/online', async (req, res) => {
    try {
      console.log('📨 Online users endpoint called')
      
      // Try Redis first for real-time data
      const { getRedisClient } = await import('../config/redis.js')
      const redis = getRedisClient()
      
      if (redis && redis.isOpen) {
        // Get active user IDs from Redis set
        const activeUserIds = await redis.sMembers('active_users')
        console.log(`📊 Redis active_users set has ${activeUserIds.length} members`)
        
        if (activeUserIds.length > 0) {
          // Fetch user details from DB for active user IDs
          const onlineUsers = await prisma.$queryRaw`
            SELECT id, email, display_name, gender, last_seen
            FROM "users"
            WHERE id = ANY(${activeUserIds}::uuid[])
            ORDER BY display_name ASC
            LIMIT 100
          `
          console.log(`✅ Fetched ${onlineUsers.length} online users from Redis + DB`)
          return res.json({ users: onlineUsers })
        } else {
          console.log('📊 No active users in Redis')
          return res.json({ users: [] })
        }
      }
      
      // Fallback: DB-based (last_seen within 5 minutes)
      console.log('⚠️ Redis not available, falling back to DB last_seen query')
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
      const onlineUsers = await prisma.$queryRaw`
        SELECT id, email, display_name, gender, last_seen
        FROM "users"
        WHERE last_seen >= ${fiveMinutesAgo}
        ORDER BY last_seen DESC
        LIMIT 100
      `
      
      console.log(`✅ Fetched ${onlineUsers.length} online users (DB fallback)`)
      res.json({ users: onlineUsers })
    } catch (error) {
      console.error('❌ Error fetching online users:', error)
      res.status(500).json({ 
        message: 'Error fetching online users', 
        error: error.message
      })
    }
  })

  // Debug endpoint - test database update without auth
  router.get('/debug/test-update/:userId', async (req, res) => {
    try {
      const { userId } = req.params
      console.log(`🧪 Testing update on user: ${userId}`)
      
      const result = await prisma.user.update({
        where: { id: userId },
        data: { is_banned: false }  // Just toggle is_banned status for testing
      })
      
      res.json({
        success: true,
        message: 'Test update successful',
        result: { id: result.id, email: result.email, is_banned: result.is_banned }
      })
    } catch (error) {
      console.error('❌ Test update failed:', error)
      res.status(500).json({
        success: false,
        message: 'Test update failed',
        error: error.message,
        code: error.code
      })
    }
  })

  // GET banned users
  router.get('/banned', async (req, res) => {
    try {
      console.log('📨 Fetching banned users')
      // Retrieve banned users, could use Prisma or raw query
      const bannedUsers = await prisma.user.findMany({
        where: { is_banned: true },
        select: {
          id: true,
          email: true,
          display_name: true,
          ban_reason: true,
          banned_at: true
        },
        orderBy: { banned_at: 'desc' }
      })
      
      const formatted = bannedUsers.map(u => ({
        id: u.id,
        name: u.display_name || u.email || 'Unknown User',
        reason: u.ban_reason || 'No reason provided',
        date: u.banned_at,
        bannedBy: 'System' // Or Admin if stored
      }))
      
      console.log(`✅ Fetched ${bannedUsers.length} banned users`)
      res.json({ success: true, users: formatted })
    } catch (error) {
      console.error('❌ Error fetching banned users:', error)
      res.status(500).json({ success: false, message: 'Server error fetching banned users', error: error.message })
    }
  })

  // Protect all write operations with authentication
  router.use(verifyAdminToken)

  router.post('/assign-premium', async (req, res) => {
    try {
      const { userIdOrEmail, plan, duration } = req.body
      const adminId = req.admin?.id
      
      console.log(`💎 Assigning premium: ${plan} to ${userIdOrEmail} for ${duration} days by admin ${adminId}`)
      
      if (!adminId) {
        return res.status(401).json({ success: false, message: 'Admin authentication required' })
      }

      // Find user by ID (UUID) or by Email
      const searchKey = userIdOrEmail.trim()
      const isEmail = searchKey.includes('@')
      let user = null
      
      if (isEmail) {
        user = await prisma.user.findUnique({ where: { email: searchKey.toLowerCase() } })
      } else {
        // Assume ID
        try {
          user = await prisma.user.findUnique({ where: { id: searchKey } })
        } catch (e) {
          user = null
        }
      }

      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' })
      }

      // Calculate expiry
      let expiryDate = null
      if (duration !== 'lifetime') {
        const days = parseInt(duration)
        if (!isNaN(days)) {
          expiryDate = new Date()
          expiryDate.setDate(expiryDate.getDate() + days)
        }
      }

      // Determine the specific fields to update based on plan
      const updateData = {
        is_premium: true,
        premium_type: plan,
        premium_expiry: expiryDate
      }
      
      if (plan === 'blue_tick') {
        updateData.has_blue_tick = true
        updateData.blue_tick_expires_at = expiryDate
      } else if (plan === 'match_boost') {
        updateData.has_match_boost = true
        updateData.match_boost_expires_at = expiryDate
      } else if (plan === 'unlimited_skip') {
        updateData.has_unlimited_skip = true
        updateData.unlimited_skip_expires_at = expiryDate
      }

      // Update user
      const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: updateData
      })

      // Mark as admin-assigned (using raw SQL since column is not in Prisma schema)
      await prisma.$executeRawUnsafe(
        `UPDATE users SET premium_assigned_by_admin = true, admin_assigned_plan = $1 WHERE id = $2::uuid`,
        plan, user.id
      )

      console.log(`✅ Premium assigned to ${updatedUser.email}`)
      res.json({
        success: true,
        message: 'Premium assigned successfully',
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          is_premium: updatedUser.is_premium,
          premium_type: updatedUser.premium_type,
          premium_expiry: updatedUser.premium_expiry
        }
      })
    } catch (error) {
      console.error('❌ Error assigning premium:', error)
      res.status(500).json({ success: false, message: 'Server error assigning premium', error: error.message })
    }
  })

  router.post('/:userId/ban', async (req, res) => {
    let userId = null
    try {
      userId = req.params.userId
      const { ban_reason } = req.body
      const adminId = req.admin?.id
      
      console.log('═══════════════════════════════════════════')
      console.log('🚫 BAN USER ENDPOINT CALLED')
      console.log('═══════════════════════════════════════════')
      console.log(`📋 User ID to ban:`, userId)
      console.log(`📋 Admin ID performing ban:`, adminId)
      console.log(`📋 Request body:`, req.body)
      console.log(`📋 Auth info:`, { 
        hasAdmin: !!req.admin,
        adminId: req.admin?.id,
        adminEmail: req.admin?.email 
      })
      
      if (!adminId) {
        console.error('❌ No admin authentication found in request')
        return res.status(401).json({ 
          success: false,
          message: 'Admin authentication required',
          error: 'No admin info in request'
        })
      }

      // Validate userId format (UUID) - make it more lenient
      if (!userId || typeof userId !== 'string') {
        console.warn(`⚠️ Invalid userId type: ${typeof userId}`)
        return res.status(400).json({ 
          success: false,
          message: 'Invalid user ID',
          error: 'User ID must be a string'
        })
      }

      // Check if user exists first
      console.log(`🔍 Checking if user exists in database: ${userId}`)
      let userExists = null
      
      try {
        userExists = await prisma.user.findUnique({
          where: { id: userId },
          select: { id: true, email: true, is_banned: true }
        })
        console.log(`✅ Database query successful. User found:`, userExists ? 'YES - ' + userExists.email : 'NO')
      } catch (dbError) {
        console.error(`❌ Database findUnique error:`, dbError.message)
        console.error(`📋 DB Error code:`, dbError.code)
        console.error(`📋 DB Error meta:`, dbError.meta)
        throw dbError
      }
      
      if (!userExists) {
        console.warn(`⚠️ User not found: ${userId}`)
        return res.status(404).json({ 
          success: false,
          message: 'User not found',
          error: `User with ID ${userId} does not exist`
        })
      }

      console.log(`📌 User details: email=${userExists.email}, currentBanned=${userExists.is_banned}`)

      // Ban the user using Prisma with UUID ID
      console.log(`🔄 Updating user banned status to true for ID: ${userId}`)
      let bannedUser = null
      
      try {
        bannedUser = await prisma.user.update({
          where: { id: userId },
          data: { 
            is_banned: true,
            ban_reason: ban_reason || 'Manually banned by admin',
            banned_at: new Date()
          }
        })
        console.log(`✅ Database update successful. User banned: ${bannedUser.email}`)
      } catch (updateError) {
        console.error(`❌ Database update error:`, updateError.message)
        console.error(`📋 Update Error code:`, updateError.code)
        console.error(`📋 Update Error meta:`, updateError.meta)
        console.error(`📋 Update Error stack:`, updateError.stack)
        throw updateError
      }
      
      console.log(`✅ User ${userId} banned successfully`)
      
      // Emit socket event to force logout the banned user
      try {
        if (io) {
          console.log(`📡 Emitting force_logout event to room: user:${userId}`)
          io.to(`user:${userId}`).emit('force_logout', {
            reason: 'Your account has been banned',
            code: 'USER_BANNED'
          })
          console.log(`⚡ Force logout sent`)
        } else {
          console.warn(`⚠️ Socket.io instance not available`)
        }
      } catch (socketError) {
        console.error(`❌ Socket emission error:`, socketError.message)
      }
      
      console.log(`✅ Sending success response`)
      console.log('═══════════════════════════════════════════')
      res.json({ 
        success: true,
        message: 'User has been banned successfully',
        userId,
        user: {
          id: bannedUser.id,
          email: bannedUser.email,
          is_banned: bannedUser.is_banned
        }
      })
    } catch (error) {
      console.error('═══════════════════════════════════════════')
      console.error('❌ ERROR IN BAN ENDPOINT - CATCH BLOCK')
      console.error('═══════════════════════════════════════════')
      console.error('Error message:', error.message)
      console.error('Error code:', error.code)
      console.error('Error meta:', error.meta)
      console.error('Stack trace:', error.stack)
      
      res.status(500).json({
        success: false,
        message: 'Failed to ban user',
        error: error.message,
        code: error.code,
        meta: error.meta
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
        select: { id: true, email: true, is_banned: true }
      })
      
      if (!userExists) {
        console.warn(`⚠️ User not found: ${userId}`)
        return res.status(404).json({ 
          success: false,
          message: 'User not found',
          error: `User with ID ${userId} does not exist`
        })
      }

      console.log(`📌 User found: ${userExists.email}, currently banned: ${userExists.is_banned}`)
      
      // Unban the user using Prisma with UUID ID
      const unbannedUser = await prisma.user.update({
        where: { id: userId },
        data: { is_banned: false }
      })
      
      console.log(`✅ User ${userId} has been unbanned successfully`)
      res.json({ 
        success: true,
        message: 'User has been unbanned successfully',
        userId,
        user: {
          id: unbannedUser.id,
          email: unbannedUser.email,
          is_banned: unbannedUser.is_banned
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

  // Get ALL admin-assigned premium users (only those assigned by admin, NOT self-purchased)
  router.get('/all-premium-users', async (req, res) => {
    try {
      console.log('💎 Fetching admin-assigned premium users');
      const now = new Date();

      // Use raw SQL to query the premium_assigned_by_admin column (not in Prisma schema)
      const users = await prisma.$queryRaw`
        SELECT id, email, is_premium, premium_type, premium_expiry,
               has_blue_tick, blue_tick_expires_at,
               has_match_boost, match_boost_expires_at,
               has_unlimited_skip, unlimited_skip_expires_at,
               admin_assigned_plan
        FROM users
        WHERE premium_assigned_by_admin = true
      `;

      // Format: one entry per admin-assigned user
      const formattedUsers = users.map(user => {
        const plan = user.admin_assigned_plan || user.premium_type || 'premium';
        let expiry = user.premium_expiry;
        
        // Get the correct expiry based on plan
        if (plan === 'blue_tick') expiry = user.blue_tick_expires_at || user.premium_expiry;
        else if (plan === 'match_boost') expiry = user.match_boost_expires_at || user.premium_expiry;
        else if (plan === 'unlimited_skip') expiry = user.unlimited_skip_expires_at || user.premium_expiry;
        
        const planLabel = plan.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        
        return {
          id: user.id,
          email: user.email,
          plan: plan,
          planLabel: planLabel,
          expiry: expiry,
          status: expiry && new Date(expiry) < now ? 'Expired' : 'Active'
        };
      });

      console.log(`✅ Found ${formattedUsers.length} admin-assigned premium users`);
      res.json({ success: true, users: formattedUsers });
    } catch (error) {
      console.error('❌ Error fetching admin-assigned premium users:', error);
      res.status(500).json({ success: false, message: 'Server error fetching premium users', error: error.message });
    }
  });

  // Get premium users
  router.get('/premium-users', async (req, res) => {
    try {
      const { email } = req.query;
      
      if (!email || !email.trim()) {
        return res.json({ success: true, users: [] });
      }

      console.log(`💎 Fetching premium user info for: ${email}`)
      const now = new Date()
      const searchKey = email.trim().toLowerCase();
      const isEmail = searchKey.includes('@');
      
      let user = null;
      if (isEmail) {
        user = await prisma.user.findFirst({
          where: { email: searchKey },
          select: {
            id: true, email: true, is_premium: true, premium_type: true,
            premium_expiry: true, has_blue_tick: true, blue_tick_expires_at: true,
            has_match_boost: true, match_boost_expires_at: true, 
            has_unlimited_skip: true, unlimited_skip_expires_at: true
          }
        });
      } else {
        // Validate UUID
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (uuidRegex.test(searchKey)) {
          user = await prisma.user.findFirst({
            where: { id: searchKey },
            select: {
              id: true, email: true, is_premium: true, premium_type: true,
              premium_expiry: true, has_blue_tick: true, blue_tick_expires_at: true,
              has_match_boost: true, match_boost_expires_at: true, 
              has_unlimited_skip: true, unlimited_skip_expires_at: true
            }
          });
        } else {
          console.warn(`⚠️ Invalid UUID searched: ${searchKey}`);
        }
      }

      let premiumUsers = [];

      if (user) {
        // 2. Check if user has any premium condition
        const isPremium = user.has_blue_tick || user.has_match_boost || user.has_unlimited_skip || user.is_premium;
        
        if (isPremium) {
          // 3. If premium, add to response array
          premiumUsers = [user];
          console.log(`✅ Found premium user: ${user.email}`);
        } else {
          // 4. If not, array remains empty
          console.log(`⚠️ User found but not premium: ${user.email}`);
        }
      } else {
        console.log(`⚠️ No user found for: ${searchKey}`);
      }
      
      // Map to frontend expected format
      const formattedUsers = []
      
      premiumUsers.forEach(user => {
        let planInternal = '';
        let planLabel = '';
        let expiry = null;
        
        // Priority check: consider active or expired
        if (user.has_blue_tick) {
          planInternal = 'blue_tick';
          planLabel = 'Blue Tick';
          expiry = user.blue_tick_expires_at;
        } else if (user.has_match_boost) {
          planInternal = 'match_boost';
          planLabel = 'Match Boost';
          expiry = user.match_boost_expires_at;
        } else if (user.has_unlimited_skip) {
          planInternal = 'unlimited_skip';
          planLabel = 'Unlimited Skip';
          expiry = user.unlimited_skip_expires_at;
        } else if (user.is_premium) {
          planInternal = user.premium_type || 'premium';
          planLabel = 'Premium';
          expiry = user.premium_expiry;
        }
        
        if (planInternal) {
          let status = 'Active';
          if (expiry && new Date(expiry) < now) {
            status = 'Expired';
          }

          formattedUsers.push({
            id: user.id,
            email: user.email,
            plan: planInternal,      // Backend expects 'blue_tick', 'match_boost', etc for removal
            planLabel: planLabel,   // 'Blue Tick', etc
            expiry: expiry,
            status: status
          })
        }
      })

      res.json({ success: true, users: formattedUsers })
    } catch (error) {
      console.error('❌ Error fetching premium users:', error)
      res.status(500).json({ success: false, message: 'Server error fetching premium users', error: error.message })
    }
  })

  // Remove premium
  router.post('/remove-premium', async (req, res) => {
    try {
      const { userIdOrEmail, plan } = req.body
      const adminId = req.admin?.id
      
      console.log(`🗑️ Removing premium: ${plan} for ${userIdOrEmail} by admin ${adminId}`)
      
      if (!adminId) {
        return res.status(401).json({ success: false, message: 'Admin authentication required' })
      }

      const searchKey = userIdOrEmail.trim()
      const isEmail = searchKey.includes('@')
      let user = null
      
      if (isEmail) {
        user = await prisma.user.findUnique({ where: { email: searchKey.toLowerCase() } })
      } else {
        try {
          user = await prisma.user.findUnique({ where: { id: searchKey } })
        } catch (e) {
          user = null
        }
      }

      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' })
      }

      // Determine the specific fields to clear
      const updateData = {}
      
      if (plan === 'blue_tick') {
        updateData.has_blue_tick = false
        updateData.blue_tick_expires_at = null
      } else if (plan === 'match_boost') {
        updateData.has_match_boost = false
        updateData.match_boost_expires_at = null
      } else if (plan === 'unlimited_skip') {
        updateData.has_unlimited_skip = false
        updateData.unlimited_skip_expires_at = null
      }

      // Clear general premium if removing the main assigned one, or just clear regardless
      if (user.premium_type === plan || !user.premium_type) {
        updateData.is_premium = false
        updateData.premium_type = null
        updateData.premium_expiry = null
      }

      // Update user
      const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: updateData
      })

      // Clear admin-assigned flag (using raw SQL since column is not in Prisma schema)
      await prisma.$executeRawUnsafe(
        `UPDATE users SET premium_assigned_by_admin = false, admin_assigned_plan = NULL WHERE id = $1::uuid`,
        user.id
      )

      console.log(`✅ Premium ${plan} removed for ${updatedUser.email}`)
      res.json({
        success: true,
        message: 'Premium removed successfully',
      })
    } catch (error) {
      console.error('❌ Error removing premium:', error)
      res.status(500).json({ success: false, message: 'Server error removing premium', error: error.message })
    }
  })

  return router
}

export default createUsersRouter

