import express from 'express'
import jwt from 'jsonwebtoken'
import prisma from '../config/database.js'
import { getRedisClient } from '../config/redis.js'

const router = express.Router()

router.get('/', async (req, res) => {
  try {
    console.log('📊 Dashboard API called')

    let isAdminActive = false

    // Check if logged-in user is admin and update their activity
    const token = req.headers.authorization?.split(' ')[1]
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret-key')
        console.log('🔐 Token decoded:', { id: decoded.id, role: decoded.role })
        
        // If Admin, mark as active
        if (decoded.role === 'ADMIN') {
          isAdminActive = true
          console.log('✅ Admin is accessing dashboard - marking as active')
        }
        // If regular user, update last_seen
        else if (decoded.id) {
          await prisma.user.update({
            where: { id: decoded.id },
            data: { last_seen: new Date() }
          }).catch(err => {
            console.log('⚠️ Could not update user last_seen:', err.message)
          })
          console.log('✅ Updated last_seen for user:', decoded.id)
        }
      } catch (err) {
        console.log('⚠️ Token verification failed:', err.message)
      }
    }
    
    // Get real new signups count from database (last 24 hours)
    const newSignups = await prisma.user.count({
      where: {
        created_at: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
        }
      }
    })
    console.log('📊 New signups from DB (last 24h):', newSignups)

    // ===== GET ACTIVE USERS FROM REDIS =====
    const redis = getRedisClient()
    let activeUsersCount = 0
    let activeMaleUsers = 0
    let activeFemaleUsers = 0
    
    if (redis && redis.isOpen) {
      try {
        // Get active user counts from Redis sets
        activeUsersCount = await redis.sCard('active_users')
        activeMaleUsers = await redis.sCard('online_males')
        activeFemaleUsers = await redis.sCard('online_females')
        
        console.log(`📊 Active Users from Redis: ${activeUsersCount}`)
        console.log(`📊 Active Male Users from Redis: ${activeMaleUsers}`)
        console.log(`📊 Active Female Users from Redis: ${activeFemaleUsers}`)
      } catch (err) {
        console.error('⚠️ Redis error, falling back to DB:', err.message)
        // Fallback to database query
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
        activeUsersCount = await prisma.user.count({
          where: {
            last_seen: {
              gte: fiveMinutesAgo
            }
          }
        })
        
        activeMaleUsers = await prisma.user.count({
          where: {
            gender: 'male',
            last_seen: {
              gte: fiveMinutesAgo
            }
          }
        })
        
        activeFemaleUsers = await prisma.user.count({
          where: {
            gender: 'female',
            last_seen: {
              gte: fiveMinutesAgo
            }
          }
        })
      }
    } else {
      console.log('⚠️ Redis not available, using database fallback')
      // Fallback to database query
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
      activeUsersCount = await prisma.user.count({
        where: {
          last_seen: {
            gte: fiveMinutesAgo
          }
        }
      })
      
      activeMaleUsers = await prisma.user.count({
        where: {
          gender: 'male',
          last_seen: {
            gte: fiveMinutesAgo
          }
        }
      })
      
      activeFemaleUsers = await prisma.user.count({
        where: {
          gender: 'female',
          last_seen: {
            gte: fiveMinutesAgo
          }
        }
      })
    }
    
    // Add 1 if admin is accessing (since admin is typically not in users table)
    if (isAdminActive) {
      activeUsersCount += 1
      console.log('📊 Admin is active, incrementing active count')
    }

    // Get total users count
    const totalUsersCount = await prisma.user.count()
    console.log('📊 Total users from DB:', totalUsersCount)

    // Get banned users count (is_banned was removed from new schema, so count where ban_reason is not null)
    const bannedUsersCount = await prisma.user.count({
      where: {
        ban_reason: {
          not: null
        }
      }
    })
    console.log('📊 Banned users from DB:', bannedUsersCount)

    // Calculate inactive users
    const inactiveUsersCount = Math.max(0, totalUsersCount - activeUsersCount - bannedUsersCount)
    console.log('📊 Inactive users from DB:', inactiveUsersCount)

    // Get live sessions count
    const liveSessionsCount = await prisma.session.count({
      where: {
        ended_at: null
      }
    })
    console.log('📊 Live sessions from DB:', liveSessionsCount)

    // Gender Analytics - Count only valid gender values (male/female), exclude NULL/empty
    const totalMaleUsers = await prisma.user.count({
      where: {
        gender: 'male'
      }
    })
    
    const totalFemaleUsers = await prisma.user.count({
      where: {
        gender: 'female'
      }
    })
    
    console.log('📊 Total Male Users:', totalMaleUsers)
    console.log('📊 Total Female Users:', totalFemaleUsers)
    console.log('📊 Active Male Users (from Redis):', activeMaleUsers)
    console.log('📊 Active Female Users (from Redis):', activeFemaleUsers)
    
    // Return data from database
    const responseData = {
      stats: {
        activeUsers: activeUsersCount,
        liveSessions: liveSessionsCount,
        newSignups: newSignups,
        revenue: 0,
        reportsLastDay: 0,
        totalUsers: totalUsersCount
      },
      genderAnalytics: {
        totalMaleUsers: totalMaleUsers,
        totalFemaleUsers: totalFemaleUsers,
        activeMaleUsers: activeMaleUsers,
        activeFemaleUsers: activeFemaleUsers
      },
      userActivity: [
        { time: '00:00', users: 0 },
        { time: '04:00', users: 0 },
        { time: '08:00', users: 0 },
        { time: '12:00', users: 0 },
        { time: '16:00', users: 0 },
        { time: '20:00', users: 0 }
      ],
      revenueData: [
        { date: 'Mon', revenue: 0 },
        { date: 'Tue', revenue: 0 },
        { date: 'Wed', revenue: 0 },
        { date: 'Thu', revenue: 0 },
        { date: 'Fri', revenue: 0 },
        { date: 'Sat', revenue: 0 },
        { date: 'Sun', revenue: 0 }
      ],
      userDistribution: [
        { name: 'Active', value: activeUsersCount },
        { name: 'Inactive', value: inactiveUsersCount },
        { name: 'Suspended', value: 0 },
        { name: 'Banned', value: bannedUsersCount }
      ],
      recentActivity: [
        {
          id: 'activity-1',
          type: 'Signup',
          description: 'New user registered',
          timestamp: new Date()
        },
        {
          id: 'activity-2',
          type: 'Report',
          description: 'New report submitted',
          timestamp: new Date()
        }
      ]
    }

    console.log('✅ Dashboard data sent successfully')
    res.json(responseData)
  } catch (error) {
    console.error('❌ Dashboard error:', error.message)
    res.status(500).json({ 
      message: 'Error fetching dashboard data',
      error: error.message
    })
  }
})

export default router

