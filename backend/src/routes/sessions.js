import express from 'express'
import prisma from '../config/database.js'
import { getRedisClient } from '../config/redis.js'
import { verifyAdminToken } from '../middleware/authMiddleware.js'

const createSessionsRouter = (io) => {
  const router = express.Router()

  // ===== GET ACTIVE SESSIONS (Redis + DB hybrid) =====
  router.get('/', verifyAdminToken, async (req, res) => {
    try {
      console.log('📹 Fetching active video sessions...')

      const redis = getRedisClient()
      let sessions = []

      // STRATEGY 1: Try Redis first (source of truth for LIVE sessions)
      if (redis && redis.isOpen) {
        try {
          const activeSessionIds = await redis.sMembers('active_sessions')
          console.log(`📡 Redis active_sessions: ${activeSessionIds.length} sessions found`)

          if (activeSessionIds.length > 0) {
            // Fetch each session data from Redis
            const pipeline = []
            for (const sessionId of activeSessionIds) {
              pipeline.push(redis.get(`session:${sessionId}`))
            }
            const sessionDataList = await Promise.all(pipeline)

            // Parse and validate each session
            const validSessionIds = []
            for (let i = 0; i < sessionDataList.length; i++) {
              if (sessionDataList[i]) {
                try {
                  const parsed = JSON.parse(sessionDataList[i])
                  validSessionIds.push({
                    id: activeSessionIds[i],
                    ...parsed
                  })
                } catch (e) {
                  console.warn(`⚠️ Invalid JSON for session:${activeSessionIds[i]}`)
                }
              } else {
                // Session key expired but still in active_sessions set — clean up
                console.log(`🧹 Cleaning up expired session: ${activeSessionIds[i]}`)
                await redis.sRem('active_sessions', activeSessionIds[i])
              }
            }

            console.log(`✅ ${validSessionIds.length} valid sessions from Redis`)

            // Fetch full user details from DB for each valid session
            if (validSessionIds.length > 0) {
              const dbSessions = await prisma.Session.findMany({
                where: {
                  id: { in: validSessionIds.map(s => s.id) }
                },
                include: {
                  users_sessions_user1_idTousers: {
                    select: {
                      id: true,
                      email: true,
                      display_name: true,
                      photo_url: true
                    }
                  },
                  users_sessions_user2_idTousers: {
                    select: {
                      id: true,
                      email: true,
                      display_name: true,
                      photo_url: true
                    }
                  }
                }
              })

              // Merge Redis data with DB data
              const dbSessionMap = new Map(dbSessions.map(s => [s.id, s]))
              // Track user pairs to deduplicate (keep only most recent session per pair)
              const seenPairs = new Map() // "userId1-userId2" -> { session, startedAt }

              for (const redisSession of validSessionIds) {
                const dbSession = dbSessionMap.get(redisSession.id)
                
                // Filter out incomplete sessions
                if (!dbSession?.users_sessions_user1_idTousers || !dbSession?.users_sessions_user2_idTousers) {
                  continue;
                }

                // ✅ CRITICAL: If session is ended in DB, clean it from Redis and skip
                if (dbSession.ended_at) {
                  console.log(`🧹 [AUTO-CLEAN] Session ${redisSession.id} ended in DB but still in Redis — removing`)
                  await redis.sRem('active_sessions', redisSession.id)
                  await redis.del(`session:${redisSession.id}`)
                  continue;
                }

                // ✅ CRITICAL: Check if users are actually online (connected to flinxx backend)
                // The flinxx backend tracks online users in Redis 'online_users' set
                const user1Id = dbSession?.users_sessions_user1_idTousers?.id || redisSession.userId1
                const user2Id = dbSession?.users_sessions_user2_idTousers?.id || redisSession.userId2
                const user1Online = user1Id ? await redis.sIsMember('online_users', user1Id) : false
                const user2Online = user2Id ? await redis.sIsMember('online_users', user2Id) : false

                if (!user1Online && !user2Online) {
                  console.log(`🧹 [ONLINE-CHECK] Session ${redisSession.id}: both users offline — removing`)
                  await redis.sRem('active_sessions', redisSession.id)
                  await redis.del(`session:${redisSession.id}`)
                  // Mark as ended in DB
                  try {
                    const startTime = new Date(redisSession.startedAt || dbSession?.started_at)
                    const dur = Math.floor((Date.now() - startTime.getTime()) / 1000)
                    await prisma.Session.update({
                      where: { id: redisSession.id },
                      data: { ended_at: new Date(), duration_seconds: dur }
                    })
                  } catch (e) { /* already ended */ }
                  continue;
                }
                
                const startedAt = new Date(redisSession.startedAt || dbSession?.started_at)
                const now = new Date()
                const durationSeconds = Math.floor((now - startedAt) / 1000)

                const sessionObj = {
                  id: redisSession.id,
                  sessionId: `SESSION${String(redisSession.id).slice(0, 8)}`,
                  user1: {
                    id: dbSession?.users_sessions_user1_idTousers?.id || redisSession.userId1,
                    username: dbSession?.users_sessions_user1_idTousers?.display_name || 'Unknown',
                    email: dbSession?.users_sessions_user1_idTousers?.email,
                    picture: dbSession?.users_sessions_user1_idTousers?.photo_url
                  },
                  user2: {
                    id: dbSession?.users_sessions_user2_idTousers?.id || redisSession.userId2,
                    username: dbSession?.users_sessions_user2_idTousers?.display_name || 'Unknown',
                    email: dbSession?.users_sessions_user2_idTousers?.email,
                    picture: dbSession?.users_sessions_user2_idTousers?.photo_url
                  },
                  duration: durationSeconds,
                  durationFormatted: formatDuration(durationSeconds),
                  startedAt: startedAt.toLocaleString(),
                  startedAtISO: startedAt.toISOString(),
                  createdAt: startedAt,
                  isLive: true
                }

                // ✅ Deduplicate: same user pair should only show ONCE (keep most recent)
                const u1 = sessionObj.user1.id
                const u2 = sessionObj.user2.id
                const pairKey = [u1, u2].sort().join('-')

                if (seenPairs.has(pairKey)) {
                  const existing = seenPairs.get(pairKey)
                  if (startedAt > existing.startedAt) {
                    // This session is newer — replace old one and clean old from Redis
                    console.log(`🧹 [DEDUP] Removing older duplicate session: ${existing.session.id}`)
                    await redis.sRem('active_sessions', existing.session.id)
                    await redis.del(`session:${existing.session.id}`)
                    try {
                      await prisma.Session.update({
                        where: { id: existing.session.id },
                        data: { ended_at: new Date(), duration_seconds: existing.session.duration }
                      })
                    } catch (e) { /* already ended */ }
                    seenPairs.set(pairKey, { session: sessionObj, startedAt })
                  } else {
                    // This session is older — clean it from Redis
                    console.log(`🧹 [DEDUP] Removing older duplicate session: ${redisSession.id}`)
                    await redis.sRem('active_sessions', redisSession.id)
                    await redis.del(`session:${redisSession.id}`)
                    try {
                      await prisma.Session.update({
                        where: { id: redisSession.id },
                        data: { ended_at: new Date(), duration_seconds: durationSeconds }
                      })
                    } catch (e) { /* already ended */ }
                  }
                } else {
                  seenPairs.set(pairKey, { session: sessionObj, startedAt })
                }
              }

              // Build final sessions list from deduplicated map
              sessions = Array.from(seenPairs.values()).map(v => v.session)
            }
          }
        } catch (redisErr) {
          console.error('❌ Redis session fetch error:', redisErr.message)
          // Fall through to DB fallback
        }
      }

      // STRATEGY 2: DB fallback — only if Redis returned nothing
      if (sessions.length === 0) {
        console.log('📊 Falling back to database for sessions...')
        const dbSessions = await prisma.Session.findMany({
          where: {
            ended_at: null
          },
          include: {
            users_sessions_user1_idTousers: {
              select: {
                id: true,
                email: true,
                display_name: true,
                photo_url: true
              }
            },
            users_sessions_user2_idTousers: {
              select: {
                id: true,
                email: true,
                display_name: true,
                photo_url: true
              }
            }
          },
          orderBy: {
            started_at: 'desc'
          }
        })

        // Filter: only show sessions started within the last 2 hours (stale session cleanup)
        const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000)

        sessions = dbSessions
          .filter(s => new Date(s.started_at) > twoHoursAgo && s.users_sessions_user1_idTousers && s.users_sessions_user2_idTousers)
          .map((session) => {
            const startedAt = new Date(session.started_at)
            const now = new Date()
            const durationSeconds = Math.floor((now - startedAt) / 1000)

            return {
              id: session.id,
              sessionId: `SESSION${String(session.id).slice(0, 8)}`,
              user1: {
                id: session.users_sessions_user1_idTousers?.id,
                username: session.users_sessions_user1_idTousers?.display_name || 'Unknown',
                email: session.users_sessions_user1_idTousers?.email,
                picture: session.users_sessions_user1_idTousers?.photo_url
              },
              user2: {
                id: session.users_sessions_user2_idTousers?.id,
                username: session.users_sessions_user2_idTousers?.display_name || 'Unknown',
                email: session.users_sessions_user2_idTousers?.email,
                picture: session.users_sessions_user2_idTousers?.photo_url
              },
              duration: durationSeconds,
              durationFormatted: formatDuration(durationSeconds),
              startedAt: startedAt.toLocaleString(),
              startedAtISO: startedAt.toISOString(),
              createdAt: session.started_at,
              isLive: false // From DB, not confirmed via Redis
            }
          })
      }

      // Sort by most recent first
      sessions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

      console.log(`✅ Returning ${sessions.length} active sessions`)

      res.json({
        success: true,
        sessions: sessions,
        count: sessions.length,
        source: sessions.length > 0 && sessions[0].isLive ? 'redis' : 'database'
      })
    } catch (error) {
      console.error('❌ Error fetching sessions:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to fetch sessions',
        error: error.message
      })
    }
  })

  // ===== GET SPECIFIC SESSION DETAILS =====
  router.get('/:sessionId', verifyAdminToken, async (req, res) => {
    try {
      const { sessionId } = req.params
      console.log(`📹 Fetching session details: ${sessionId}`)

      // Check Redis first
      const redis = getRedisClient()
      let isLiveInRedis = false
      if (redis && redis.isOpen) {
        isLiveInRedis = await redis.sIsMember('active_sessions', sessionId)
      }

      const session = await prisma.Session.findUnique({
        where: { id: sessionId },
        include: {
          users_sessions_user1_idTousers: {
            select: {
              id: true,
              display_name: true,
              email: true,
              photo_url: true
            }
          },
          users_sessions_user2_idTousers: {
            select: {
              id: true,
              display_name: true,
              email: true,
              photo_url: true
            }
          }
        }
      })

      if (!session) {
        return res.status(404).json({
          success: false,
          message: 'Session not found'
        })
      }

      const startedAt = new Date(session.started_at)
      const now = new Date()
      const durationSeconds = Math.floor((now - startedAt) / 1000)

      res.json({
        success: true,
        session: {
          id: session.id,
          sessionId: `SESSION${String(session.id).slice(0, 8)}`,
          user1: {
            id: session.users_sessions_user1_idTousers?.id,
            username: session.users_sessions_user1_idTousers?.display_name || 'Unknown',
            email: session.users_sessions_user1_idTousers?.email,
            picture: session.users_sessions_user1_idTousers?.photo_url
          },
          user2: {
            id: session.users_sessions_user2_idTousers?.id,
            username: session.users_sessions_user2_idTousers?.display_name || 'Unknown',
            email: session.users_sessions_user2_idTousers?.email,
            picture: session.users_sessions_user2_idTousers?.photo_url
          },
          duration: durationSeconds,
          durationFormatted: formatDuration(durationSeconds),
          startedAt: startedAt.toLocaleString(),
          startedAtISO: startedAt.toISOString(),
          createdAt: session.started_at,
          isLive: isLiveInRedis,
          hasEnded: !!session.ended_at
        }
      })
    } catch (error) {
      console.error('❌ Error fetching session details:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to fetch session details',
        error: error.message
      })
    }
  })

  // ===== ADMIN JOINS SESSION AS SPECTATOR =====
  router.post('/:sessionId/join', verifyAdminToken, async (req, res) => {
    try {
      const { sessionId } = req.params
      const adminId = req.admin?.id

      console.log(`🎬 Admin ${adminId} requesting to join session ${sessionId} as spectator`)

      // Check if session is still live in Redis
      const redis = getRedisClient()
      let isLive = false
      if (redis && redis.isOpen) {
        isLive = await redis.sIsMember('active_sessions', sessionId)
      }

      // Also check DB
      const session = await prisma.Session.findUnique({
        where: { id: sessionId },
        include: {
          users_sessions_user1_idTousers: {
            select: { id: true, display_name: true }
          },
          users_sessions_user2_idTousers: {
            select: { id: true, display_name: true }
          }
        }
      })

      if (!session) {
        return res.status(404).json({
          success: false,
          message: 'Session not found'
        })
      }

      if (session.ended_at && !isLive) {
        return res.status(400).json({
          success: false,
          message: 'Session has already ended'
        })
      }

      console.log(`✅ Admin can join session ${sessionId} (live in Redis: ${isLive})`)

      res.json({
        success: true,
        message: 'Admin can join session',
        session: {
          id: session.id,
          user1: session.users_sessions_user1_idTousers?.display_name || 'Unknown',
          user2: session.users_sessions_user2_idTousers?.display_name || 'Unknown',
          isLive
        }
      })
    } catch (error) {
      console.error('❌ Error joining session:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to join session',
        error: error.message
      })
    }
  })

  // ===== ADMIN ENDS A SESSION =====
  router.post('/:sessionId/end', verifyAdminToken, async (req, res) => {
    try {
      const { sessionId } = req.params
      const adminId = req.admin?.id

      console.log(`🛑 Admin ${adminId} requesting to end session ${sessionId}`)

      const session = await prisma.Session.findUnique({
        where: { id: sessionId }
      })

      if (!session) {
        return res.status(404).json({
          success: false,
          message: 'Session not found'
        })
      }

      if (session.ended_at) {
        return res.status(400).json({
          success: false,
          message: 'Session has already ended'
        })
      }

      const startedAt = new Date(session.started_at)
      const now = new Date()
      const durationSeconds = Math.floor((now - startedAt) / 1000)

      // Update session in database
      const updatedSession = await prisma.Session.update({
        where: { id: sessionId },
        data: {
          ended_at: now,
          duration_seconds: durationSeconds
        }
      })

      // Also remove from Redis active_sessions
      const redis = getRedisClient()
      if (redis && redis.isOpen) {
        try {
          await redis.sRem('active_sessions', sessionId)
          await redis.del(`session:${sessionId}`)
          console.log(`🧹 Session ${sessionId} removed from Redis`)
        } catch (redisErr) {
          console.error('⚠️ Redis cleanup error:', redisErr.message)
        }
      }

      console.log(`✅ Session ${sessionId} ended by admin ${adminId}`)

      // Notify all connected clients about session end
      io.emit('session:ended', {
        sessionId: sessionId,
        endedBy: 'admin',
        endedAt: now.toISOString()
      })

      io.emit('session:removed', {
        sessionId: sessionId,
        endedBy: 'admin',
        endedAt: now.toISOString()
      })

      // Notify the two users in the session to disconnect
      io.to(`session:${sessionId}`).emit('session:admin_ended', {
        reason: 'Session ended by administrator',
        sessionId: sessionId
      })

      res.json({
        success: true,
        message: 'Session ended successfully',
        session: {
          id: updatedSession.id,
          duration: durationSeconds,
          endedAt: updatedSession.ended_at
        }
      })
    } catch (error) {
      console.error('❌ Error ending session:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to end session',
        error: error.message
      })
    }
  })

  // ===== CLEANUP STALE SESSIONS =====
  // Called periodically to clean up sessions that were never properly ended
  router.post('/cleanup', verifyAdminToken, async (req, res) => {
    try {
      console.log('🧹 Running stale session cleanup...')

      const redis = getRedisClient()
      let cleanedCount = 0

      // Get all sessions with ended_at = null and started more than 2 hours ago
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000)
      const staleSessions = await prisma.Session.findMany({
        where: {
          ended_at: null,
          started_at: { lt: twoHoursAgo }
        }
      })

      for (const session of staleSessions) {
        const durationSeconds = Math.floor((Date.now() - new Date(session.started_at).getTime()) / 1000)

        await prisma.Session.update({
          where: { id: session.id },
          data: {
            ended_at: new Date(),
            duration_seconds: durationSeconds
          }
        })

        // Also clean Redis
        if (redis && redis.isOpen) {
          await redis.sRem('active_sessions', session.id)
          await redis.del(`session:${session.id}`)
        }

        cleanedCount++
      }

      console.log(`✅ Cleaned up ${cleanedCount} stale sessions`)

      res.json({
        success: true,
        cleaned: cleanedCount,
        message: `Cleaned up ${cleanedCount} stale sessions`
      })
    } catch (error) {
      console.error('❌ Cleanup error:', error)
      res.status(500).json({
        success: false,
        message: 'Cleanup failed',
        error: error.message
      })
    }
  })

  // ===== START PERIODIC SESSION SYNC =====
  // Every 30 seconds, broadcast updated session list to admins
  setInterval(async () => {
    try {
      const redis = getRedisClient()
      if (!redis || !redis.isOpen) return

      const activeSessionIds = await redis.sMembers('active_sessions')

      // Broadcast session count update to all admin clients
      io.emit('sessions:count_update', {
        count: activeSessionIds.length,
        timestamp: new Date().toISOString()
      })
    } catch (err) {
      // Silent fail for periodic sync
    }
  }, 30000) // Every 30 seconds

  return router
}

// Helper function to format duration
function formatDuration(seconds) {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60

  if (hours > 0) {
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  } else {
    return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }
}

export default createSessionsRouter
