import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import jwt from 'jsonwebtoken'
import { createServer } from 'http'
import { Server } from 'socket.io'
import { connectDB } from './config/database.js'
import prisma from './config/database.js'
import { connectRedis, getRedisClient } from './config/redis.js'
import authRoutes from './routes/auth.js'
import adminRoutes from './routes/admin.js'
import dashboardRoutes from './routes/dashboard.js'
import usersRoutes from './routes/users.js'
import userRoutes from './routes/user.js'
import reportUserRoute from './routes/reportUser.js'
import reportsRoutes from './routes/reports.js'
import settingsRoutes from './routes/settings.js'
import appealsRoutes from './routes/appeals.js'
import userAppealsRoutes from './routes/userAppeals.js'
import createSessionsRouter from './routes/sessions.js'
import { verifyUserToken } from './middleware/userAuthMiddleware.js'
import { errorHandler } from './middleware/errorHandler.js'
import socketAuthMiddleware from './middleware/socketAuthMiddleware.js'

dotenv.config()

const app = express()
const httpServer = createServer(app)

console.log("=" .repeat(50))
console.log("🚀 SERVER STARTING")
console.log("=" .repeat(50))

// 🔥 CORS MUST BE FIRST - BEFORE EVERYTHING ELSE
const corsOrigins = [
  "https://flinxx-admin-panel.vercel.app",
  "https://flinxx-backend-frontend.vercel.app",
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:3003",
  "http://localhost:5000",
  "http://15.206.146.133",
  process.env.FRONTEND_URL,
  process.env.ADMIN_PANEL_URL
].filter(o => o && o !== 'undefined')

console.log("✅ CORS Origins:", corsOrigins)

const corsOptions = {
  origin: corsOrigins,
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  maxAge: 86400
}

// 🔥 APPLY CORS FIRST - ABSOLUTELY FIRST
app.use(cors(corsOptions))
app.options('*', cors(corsOptions))

console.log("✅ CORS middleware applied")

// Then all other middleware
app.use(express.json())

const io = new Server(httpServer, {
  cors: corsOptions
})
const PORT = process.env.PORT || 3001

// Initialize server with async setup
const initServer = async () => {
  // Connect Database
  connectDB()

  // Connect Redis for realtime active users tracking
  await connectRedis()

  // Socket.io authentication middleware
// Validates token and checks if user is banned before allowing connection
io.use(socketAuthMiddleware)

// ===== HELPER FUNCTION: Broadcast Active Users Count =====
const broadcastActiveUsersUpdate = async () => {
  try {
    const redis = getRedisClient()
    let activeUsersCount = 0
    let activeMaleUsers = 0
    let activeFemaleUsers = 0
    
    if (redis && redis.isOpen) {
      // Get counts from Redis (same sets as main backend)
      activeUsersCount = await redis.sCard('active_users')
      activeMaleUsers = await redis.sCard('online_males')
      activeFemaleUsers = await redis.sCard('online_females')
      console.log(`📡 Broadcasting from Redis: Active=${activeUsersCount}, Male=${activeMaleUsers}, Female=${activeFemaleUsers}`)
    } else {
      // Fallback to database if Redis unavailable
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
      activeUsersCount = await prisma.user.count({
        where: { last_seen: { gte: fiveMinutesAgo } }
      })
      activeMaleUsers = await prisma.user.count({
        where: { gender: 'male', last_seen: { gte: fiveMinutesAgo } }
      })
      activeFemaleUsers = await prisma.user.count({
        where: { gender: 'female', last_seen: { gte: fiveMinutesAgo } }
      })
      console.log(`📡 Broadcasting from DB: Active=${activeUsersCount}, Male=${activeMaleUsers}, Female=${activeFemaleUsers}`)
    }
    
    // Emit to all admins via Socket.io
    io.emit('admin:activeUsersUpdate', {
      activeUsers: activeUsersCount,
      activeMaleUsers: activeMaleUsers,
      activeFemaleUsers: activeFemaleUsers,
      updatedAt: new Date().toISOString()
    })
  } catch (err) {
    console.error('❌ Error broadcasting active users:', err.message)
  }
}

// Socket.io connection handling
io.on('connection', async (socket) => {
  const userId = socket.user?.id
  const userEmail = socket.user?.email
  const userGender = socket.user?.gender

  console.log(`✅ Socket connected for user ${userId} (${userEmail})`)
  
  // Active user tracking is handled by the main flinxx backend (server.js)
  // Admin panel only READS from Redis sets, does not write

  // Join user to personal room for real-time updates
  if (userId) {
    socket.join(`user:${userId}`)
    console.log(`📍 User ${userId} joined room: user:${userId}`)
  }

  // ===== BROADCAST ACTIVE USERS UPDATE TO ALL ADMINS =====
  await broadcastActiveUsersUpdate()

  // Handle ban event from admin panel
  socket.on('admin:ban_user', async (data) => {
    try {
      const { targetUserId } = data
      console.log(`🚫 Admin ban event received for user: ${targetUserId}`)

      // Force disconnect the banned user
      io.to(`user:${targetUserId}`).emit('force_logout', {
        reason: 'Your account has been banned',
        code: 'USER_BANNED'
      })

      console.log(`⚡ Force logout sent to user: ${targetUserId}`)
    } catch (error) {
      console.error('❌ Error handling ban event:', error)
    }
  })

  // ===== SESSION MONITORING =====
  // Admin joins session as spectator (NEW: adminJoinSession event - spectator mode)
  socket.on('adminJoinSession', async (data) => {
    try {
      const { sessionId } = data
      const adminId = userId
      console.log(`👁️ Admin ${adminId} joining session ${sessionId} as spectator`)

      // Join the session room for WebRTC stream relay
      const room = `session-${sessionId}`
      socket.join(room)
      console.log(`📍 Admin joined spectator room: ${room}`)

      // ✅ CRITICAL: Emit ONLY to admin, NOT to participants
      // Admin is in "spectator mode" - invisible to other participants
      socket.emit('adminSpectatorMode', {
        message: 'Admin joined as spectator',
        sessionId: sessionId,
        timestamp: new Date().toISOString()
      })

      // 🔔 Notify participants to send their WebRTC offers
      // This tells the video chat participants to send their streams to the spectator
      io.emit('spectator:request_offer', {
        spectatorId: socket.id,
        sessionId: sessionId,
        message: 'A spectator has joined - please send your WebRTC offer'
      })

      console.log(`✅ Admin ${adminId} in spectator mode for session ${sessionId}`)
      console.log(`📢 Requested offers from participants in session ${sessionId}`)
    } catch (error) {
      console.error('❌ Error admin joining session:', error)
      socket.emit('session:error', {
        message: 'Failed to join session',
        error: error.message
      })
    }
  })

  // Admin requests to monitor a live session (LEGACY: session:admin_join)
  socket.on('session:admin_join', (data) => {
    try {
      const { sessionId } = data
      const adminId = userId
      console.log(`🎬 Admin ${adminId} joining session ${sessionId} as spectator`)

      // Join the session room
      socket.join(`session:${sessionId}`)
      console.log(`📍 Admin joined room: session:${sessionId}`)

      // Notify the session participants that admin is monitoring
      io.to(`session:${sessionId}`).emit('session:admin_monitoring', {
        adminId: adminId,
        message: 'An administrator is monitoring this session'
      })

      socket.emit('session:join_success', {
        sessionId: sessionId,
        message: 'Successfully joined session for monitoring'
      })
    } catch (error) {
      console.error('❌ Error admin joining session:', error)
      socket.emit('session:error', {
        message: 'Failed to join session',
        error: error.message
      })
    }
  })

  // Admin leaves session monitoring
  socket.on('session:admin_leave', (data) => {
    try {
      const { sessionId } = data
      const adminId = userId
      console.log(`🚪 Admin ${adminId} leaving session ${sessionId}`)

      socket.leave(`session:${sessionId}`)
      console.log(`📍 Admin left room: session:${sessionId}`)

      socket.emit('session:left', {
        sessionId: sessionId,
        message: 'Left session monitoring'
      })
    } catch (error) {
      console.error('❌ Error admin leaving session:', error)
    }
  })

  // Relay WebRTC offer from session user to admin spectator
  socket.on('spectator:offer', (data) => {
    try {
      const { sessionId, offer, to } = data
      console.log(`📤 Relaying WebRTC offer to spectator in session ${sessionId}`)

      // Send offer only to the specific recipients (admin spectators in the room)
      // NOT broadcast to all participants
      io.to(`session-${sessionId}`).emit('spectator:offer', {
        offer: offer,
        from: socket.id,
        sessionId: sessionId
      })
    } catch (error) {
      console.error('❌ Error relaying offer:', error)
    }
  })

  // Relay WebRTC answer from spectator to session user
  socket.on('spectator:answer', (data) => {
    try {
      const { sessionId, answer, to } = data
      console.log(`📥 Relaying WebRTC answer from spectator in session ${sessionId} to ${to}`)

      // Send answer to the specific recipient
      io.to(to).emit('spectator:answer', {
        answer: answer,
        from: socket.id,
        sessionId: sessionId
      })
    } catch (error) {
      console.error('❌ Error relaying answer:', error)
    }
  })

  // Relay ICE candidates for spectator connection
  socket.on('spectator:ice_candidate', (data) => {
    try {
      const { sessionId, candidate, to } = data
      console.log(`🧊 Relaying ICE candidate for spectator in session ${sessionId}`)

      // Send ICE candidate to specific recipient
      if (to) {
        io.to(to).emit('spectator:ice_candidate', {
          candidate: candidate,
          from: socket.id,
          sessionId: sessionId
        })
      } else {
        // Fallback: send to entire spectator room
        io.to(`session-${sessionId}`).emit('spectator:ice_candidate', {
          candidate: candidate,
          from: socket.id,
          sessionId: sessionId
        })
      }
    } catch (error) {
      console.error('❌ Error relaying ICE candidate:', error)
    }
  })

  // Track new session start
  socket.on('session:started', (data) => {
    try {
      const { sessionId, user1Id, user2Id } = data
      console.log(`📹 New session started: ${sessionId}`)

      // Broadcast to all admin clients that a new session started
      io.emit('session:live', {
        sessionId: sessionId,
        user1Id: user1Id,
        user2Id: user2Id,
        startedAt: new Date().toISOString()
      })
    } catch (error) {
      console.error('❌ Error tracking session start:', error)
    }
  })

  // Track session end
  socket.on('session:completed', (data) => {
    try {
      const { sessionId, duration } = data
      console.log(`✅ Session completed: ${sessionId} (${duration}s)`)

      // Broadcast to all admin clients that session ended
      io.emit('session:removed', {
        sessionId: sessionId,
        duration: duration,
        endedAt: new Date().toISOString()
      })
    } catch (error) {
      console.error('❌ Error tracking session end:', error)
    }
  })

  socket.on('disconnect', async () => {
    console.log(`🔌 Socket disconnected for user ${userId} (${userEmail})`)
    
    // Active user removal is handled by the main flinxx backend
    // Admin panel only broadcasts updated counts
    
    // ===== BROADCAST UPDATED COUNTS TO ALL ADMINS =====
    await broadcastActiveUsersUpdate()
  })

  socket.on('error', (error) => {
    console.error(`❌ Socket error for user ${userId}:`, error)
  })
})

  // Routes - More specific routes FIRST
  const sessionsRouter = createSessionsRouter(io)
  app.use('/api/auth', authRoutes)
  app.use('/api/user', userRoutes)
  app.use('/api/report-user', reportUserRoute)
  app.use('/api/admin/dashboard', dashboardRoutes)
  app.use('/api/admin/users', usersRoutes(io))
  app.use('/api/admin/sessions', sessionsRouter)
  app.use('/api/admin/reports', reportsRoutes)
  app.use('/api/admin/appeals', appealsRoutes)
  app.use('/api/appeals', userAppealsRoutes)
  app.use('/api/admin/settings', settingsRoutes)
  app.use('/api/admin', adminRoutes)

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'Admin Panel API is running' })
  })

  // DEBUG: Show CORS configuration
  app.get('/api/cors-debug', (req, res) => {
    res.json({
      corsOrigins: corsOptions.origin,
      currentOrigin: req.get('origin'),
      allowed: corsOptions.origin.includes(req.get('origin')),
      timestamp: new Date().toISOString()
    })
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

  httpServer.listen(PORT, () => {
    console.log(`Admin Panel API running on port ${PORT}`)
    console.log(`Socket.io ready for real-time communication`)
  })
}

// Call the async initialization function
initServer().catch(err => {
  console.error('❌ Server initialization failed:', err)
  process.exit(1)
})

export default app

// Trigger restart for Prisma client update
