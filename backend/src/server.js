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
app.post('/api/check-ban', (req, res) => {
  try {
    console.log('📌 Check ban endpoint called')
    const authHeader = req.headers.authorization
    
    if (!authHeader) {
      console.log('❌ No authorization header')
      return res.status(401).json({ 
        success: false,
        message: 'No token provided'
      })
    }

    const token = authHeader.replace('Bearer ', '')
    console.log(`🔐 Token received: ${token.substring(0, 20)}...`)

    // Verify token
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret-key')
      console.log(`✅ Token verified, userId: ${decoded.id}`)
      
      // For now, just verify the token is valid
      return res.json({
        success: true,
        is_banned: false,
        message: 'User is active',
        userId: decoded.id
      })
    } catch (error) {
      console.log(`❌ Token verification failed: ${error.message}`)
      return res.status(401).json({
        success: false,
        message: 'Invalid token',
        error: error.message
      })
    }
  } catch (error) {
    console.error('❌ Check ban error:', error)
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
