import jwt from 'jsonwebtoken'
import prisma from '../config/database.js'

/**
 * Socket.io authentication middleware
 * Validates JWT token and checks if user is banned
 * Rejects banned users from establishing socket connections
 */
export const socketAuthMiddleware = async (socket, next) => {
  try {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1]

    if (!token) {
      console.log('🔌 Socket connection rejected: No token provided')
      return next(new Error('No authentication token provided'))
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret-key')
    console.log(`🔐 Socket authenticating user: ${decoded.email}`)

    // Check if user is banned
    if (decoded.id && typeof decoded.id === 'number') {
      const user = await prisma.user.findUnique({
        where: { id: decoded.id }
      })

      if (user && user.banned === true) {
        console.log(`🚫 Socket connection rejected - user ${decoded.id} is banned`)
        return next(new Error('USER_BANNED'))
      }

      socket.user = { ...decoded, banned: false }
    } else {
      socket.user = decoded
    }

    console.log(`✅ Socket authenticated for user: ${decoded.email}`)
    next()
  } catch (error) {
    console.error('🔌 Socket authentication failed:', error.message)
    next(new Error(`Authentication failed: ${error.message}`))
  }
}

export default socketAuthMiddleware
