import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import jwt from 'jsonwebtoken'
import { connectDB } from './config/database.js'
import prisma from './config/database.js'
import authRoutes from './routes/auth.js'
import adminRoutes from './routes/admin.js'
import dashboardRoutes from './routes/dashboard.js'
import usersRoutes from './routes/users.js'
import reportsRoutes from './routes/reports.js'
import settingsRoutes from './routes/settings.js'
import { verifyUserToken } from './middleware/userAuthMiddleware.js'
import { errorHandler } from './middleware/errorHandler.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(
  cors({
    origin: [
      "https://flinxx-admin-panel.vercel.app",
      "http://localhost:5173",
      process.env.FRONTEND_URL
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

console.log("Allowed Origins:", [
  "https://flinxx-admin-panel.vercel.app",
  "http://localhost:5173",
  process.env.FRONTEND_URL,
]);

app.use(express.json())

// Connect Database
connectDB()

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/admin/dashboard', dashboardRoutes)
app.use('/api/admin/users', usersRoutes)
app.use('/api/admin/reports', reportsRoutes)
app.use('/api/admin/settings', settingsRoutes)

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'Admin Panel API is running' })
})

// Check if user is banned
app.post('/api/check-ban', async (req, res) => {
  try {
    const authHeader = req.headers.authorization
    console.log('📌 Check ban endpoint called')
    
    if (!authHeader) {
      console.log('❌ No authorization header')
      return res.status(401).json({ 
        success: false,
        message: 'No token provided'
      })
    }

    const token = authHeader.replace('Bearer ', '')

    // Verify token
    let decoded
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret-key')
      console.log(`✅ Token verified, userId: ${decoded.id}`)
    } catch (error) {
      console.log(`❌ Token verification failed: ${error.message}`)
      return res.status(401).json({
        success: false,
        message: 'Invalid token',
        error: error.message
      })
    }

    const userId = decoded.id
    
    if (!userId) {
      console.log('❌ No userId in token')
      return res.status(400).json({ 
        success: false,
        message: 'No user ID in token'
      })
    }

    console.log(`🔍 Checking ban status for user: ${userId}`)

    try {
      const user = await prisma.users.findUnique({
        where: { id: userId },
        select: { id: true, is_banned: true, ban_reason: true }
      })

      if (!user) {
        console.log(`❌ User ${userId} not found`)
        return res.status(404).json({
          success: false,
          message: 'User not found'
        })
      }
      
      if (user.is_banned) {
        console.log(`⚠️ User ${userId} is banned: ${user.ban_reason}`)
        return res.status(403).json({
          success: false,
          message: 'Your account has been banned',
          reason: user.ban_reason || 'No reason provided',
          error_code: 'USER_BANNED',
          is_banned: true
        })
      }

      console.log(`✅ User ${userId} is not banned`)
      return res.json({
        success: true,
        is_banned: false,
        message: 'User account is active'
      })
    } catch (dbError) {
      console.error(`❌ Database error: ${dbError.message}`)
      throw dbError
    }
  } catch (error) {
    console.error('❌ Error in check-ban endpoint:', error)
    res.status(500).json({
      success: false,
      message: 'Error checking ban status',
      error: error.message
    })
  }
})

// Database health check
app.get('/api/db-health', async (req, res) => {
  try {
    const result = await prisma.$queryRaw`SELECT NOW()`
    res.json({ 
      status: 'Database connection is healthy',
      timestamp: result[0]?.now
    })
  } catch (error) {
    console.error('❌ Database connection failed:', error.message)
    res.status(500).json({ 
      status: 'Database connection failed',
      error: error.message
    })
  }
})

// Error handling
app.use(errorHandler)

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' })
})

app.listen(PORT, () => {
  console.log(`Admin Panel API running on port ${PORT}`)
})

export default app
