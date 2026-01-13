import prisma from '../config/database.js'

export const checkBanStatus = async (req, res, next) => {
  try {
    // Get user ID from JWT token
    const token = req.headers.authorization?.split(' ')[1]
    if (!token) {
      // No token, continue (public endpoints)
      return next()
    }

    // For now, we'll check ban status on actual requests
    // In a real scenario, you'd decode the JWT here
    // For this implementation, we'll let auth middleware handle it
    next()
  } catch (error) {
    console.error('Error checking ban status:', error)
    next()
  }
}

export const verifyUserNotBanned = async (req, res, next) => {
  try {
    // This middleware should be used on protected user routes
    // to ensure banned users can't access resources
    const userId = req.user?.id || req.params.userId
    
    if (!userId) {
      return next()
    }

    console.log(`🔍 Checking ban status for user: ${userId}`)

    // Check if user is banned
    const bannedUser = await prisma.$queryRaw`
      SELECT is_banned, ban_reason 
      FROM "users" 
      WHERE id = ${userId}::uuid
      LIMIT 1
    `

    if (bannedUser && bannedUser.length > 0 && bannedUser[0].is_banned) {
      console.log(`🚫 Access denied - user ${userId} is banned`)
      return res.status(403).json({
        success: false,
        message: 'Your account has been banned',
        reason: bannedUser[0].ban_reason || 'No reason provided',
        error_code: 'USER_BANNED'
      })
    }

    console.log(`✅ User ${userId} is not banned - access allowed`)
    next()
  } catch (error) {
    console.error('Error verifying user ban status:', error)
    res.status(500).json({
      success: false,
      message: 'Error verifying user status',
      error: error.message
    })
  }
}

export default checkBanStatus
