import express from 'express'
import prisma from '../config/database.js'
import { verifyUserToken } from '../middleware/userAuthMiddleware.js'

const router = express.Router()

// Get user profile - protected by verifyUserToken
// This endpoint updates last_seen on every request
router.get('/profile', verifyUserToken, async (req, res) => {
  try {
    const userId = req.user?.id
    console.log(`📋 User profile request for: ${userId}`)

    if (!userId) {
      return res.status(401).json({ 
        success: false,
        message: 'User ID not found in token' 
      })
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        is_banned: true,
        last_seen: true,
        created_at: true
      }
    })

    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      })
    }

    console.log(`✅ User profile retrieved: ${userId}`)
    res.json({ 
      success: true,
      user 
    })
  } catch (error) {
    console.error('❌ Error fetching user profile:', error.message)
    res.status(500).json({ 
      success: false,
      message: 'Error fetching user profile',
      error: error.message 
    })
  }
})

export default router
