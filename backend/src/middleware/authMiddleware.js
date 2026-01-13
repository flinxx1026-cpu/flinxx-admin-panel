import jwt from 'jsonwebtoken'
import prisma from '../config/database.js'

/**
 * Verify Admin Token - For admin panel operations only
 * Does NOT check user ban status (admins are in Admin table)
 * Used for: ban management, user management, dashboard, etc.
 */
export const verifyAdminToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]

    if (!token) {
      return res.status(401).json({ message: 'No token provided' })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret-key')
    
    console.log(`🔐 Verifying admin token for: ${decoded.email}`)
    
    // For admin routes, we just verify the token is valid
    // Admins are in the Admin table, not the User table, so no ban check needed
    req.admin = decoded
    req.user = decoded
    console.log(`✅ Admin token verified for: ${decoded.email}`)
    next()
  } catch (error) {
    console.error('🔐 Admin token verification failed:', error.message)
    return res.status(401).json({ message: 'Invalid or expired token' })
  }
}

/**
 * Verify User Token - For user-facing operations
 * DOES check if user is banned
 * Used for: user routes, protected endpoints that users access
 */
export const verifyUserToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]

    if (!token) {
      return res.status(401).json({ message: 'No token provided' })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret-key')
    
    console.log(`🔐 Verifying user token for: ${decoded.email}`)
    
    // Check if user is banned (for regular users with UUID id)
    if (decoded.id && typeof decoded.id === 'string' && decoded.id.length === 36) {
      // This is a user token with UUID format, check ban status
      const user = await prisma.user.findUnique({
        where: { id: decoded.id }
      })

      if (user && user.banned === true) {
        console.log(`🚫 Token rejected - user ${decoded.id} is banned`)
        return res.status(403).json({ 
          code: "USER_BANNED",
          message: 'Your account has been banned'
        })
      }
    }

    req.admin = decoded
    req.user = decoded
    console.log(`✅ User token verified for: ${decoded.email}`)
    next()
  } catch (error) {
    console.error('🔐 User token verification failed:', error.message)
    return res.status(401).json({ message: 'Invalid or expired token' })
  }
}

export default verifyAdminToken
