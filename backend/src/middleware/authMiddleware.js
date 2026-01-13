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
    
    // Check if user is banned (for regular users)
    if (decoded.id && typeof decoded.id === 'number') {
      // This is a user token with numeric ID, check ban status
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
    console.log(`✅ Token verified for admin: ${decoded.email}`)
    next()
  } catch (error) {
    console.error('🔐 Token verification failed:', error.message)
    res.status(401).json({ message: 'Invalid or expired token' })
  }
}

export default verifyAdminToken
