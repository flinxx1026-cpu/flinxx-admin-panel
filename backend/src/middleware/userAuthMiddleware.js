import jwt from 'jsonwebtoken'
import prisma from '../config/database.js'

export const verifyUserToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]

    if (!token) {
      return res.status(401).json({ message: 'No token provided' })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret-key')
    
    console.log(`🔐 Verifying user token for: ${decoded.id}`)
    
    // Check if user is banned (CRITICAL - check on every request)
    if (decoded.id && typeof decoded.id === 'string' && decoded.id.length === 36) {
      const bannedStatus = await prisma.$queryRaw`
        SELECT id, is_banned, ban_reason 
        FROM "users" 
        WHERE id = ${decoded.id}::uuid
        LIMIT 1
      `

      if (bannedStatus && bannedStatus.length > 0) {
        const user = bannedStatus[0]
        
        if (user.is_banned) {
          console.log(`🚫 User ${decoded.id} is BANNED - rejecting request`)
          return res.status(403).json({
            success: false,
            message: 'Your account has been banned',
            reason: user.ban_reason || 'No reason provided',
            error_code: 'USER_BANNED',
            is_banned: true
          })
        }
      }

      // Update last_seen on user activity
      try {
        await prisma.$queryRaw`
          UPDATE "users"
          SET last_seen = NOW()
          WHERE id = ${decoded.id}::uuid
        `
        console.log(`⏰ Updated last_seen for user: ${decoded.id}`)
      } catch (updateError) {
        console.error(`⚠️ Failed to update last_seen for user ${decoded.id}:`, updateError.message)
        // Don't fail the auth request if last_seen update fails
      }
    }

    req.user = decoded
    console.log(`✅ User token verified: ${decoded.id}`)
    next()
  } catch (error) {
    console.error('🔐 Token verification failed:', error.message)
    res.status(401).json({ 
      success: false,
      message: 'Invalid or expired token' 
    })
  }
}

export default verifyUserToken
