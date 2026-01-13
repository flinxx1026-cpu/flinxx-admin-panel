import jwt from 'jsonwebtoken'
import prisma from '../config/database.js'

export const verifyAdminToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]

    if (!token) {
      return res.status(401).json({ message: 'No token provided' })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret-key')
    
    console.log(`🔐 Verifying admin token for: ${decoded.email}`)
    
    // Admins don't need ban check - they are in the Admin table, not Users table
    // Only check ban status if this is a regular user token (with UUID id)
    if (decoded.id && typeof decoded.id === 'string' && decoded.id.length === 36) {
      // This is a user token (UUID format), check ban status
      const bannedUser = await prisma.$queryRaw`
        SELECT is_banned, ban_reason 
        FROM "users" 
        WHERE id = ${decoded.id}::uuid
        LIMIT 1
      `

      if (bannedUser && bannedUser.length > 0 && bannedUser[0].is_banned) {
        console.log(`🚫 Token rejected - user ${decoded.id} is banned`)
        return res.status(403).json({ 
          message: 'Your account has been banned',
          reason: bannedUser[0].ban_reason || 'No reason provided',
          error_code: 'USER_BANNED'
        })
      }
    }

    req.admin = decoded
    req.user = decoded
    console.log(`✅ Token verified for admin: ${decoded.email}`)
    next()
  } catch (error) {
    console.error('🔐 Token verification failed:', error.message)
    res.status(401).json({ message: 'Invalid or expired token' })
  }
}

export default verifyAdminToken
