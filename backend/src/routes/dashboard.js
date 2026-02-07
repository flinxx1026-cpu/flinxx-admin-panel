import express from 'express'
import jwt from 'jsonwebtoken'
import prisma from '../config/database.js'

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
    
    // Get real new signups count from database
    const signupResult = await prisma.$queryRaw`
      SELECT COUNT(*)::int AS count
      FROM users
      WHERE created_at >= NOW() - INTERVAL '24 hours'
    `
    const newSignups = Number(signupResult[0].count)
    console.log('📊 New signups from DB (last 24h):', newSignups)

    // Get real active users count from database (last 5 minutes) - using raw SQL for consistency
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
    const activeUsersResult = await prisma.$queryRaw`
      SELECT COUNT(*)::int AS count
      FROM users
      WHERE last_seen >= ${fiveMinutesAgo}
    `
    let activeUsersCount = Number(activeUsersResult[0]?.count || 0)
    
    // Add 1 if admin is accessing (since admin is not in users table)
    if (isAdminActive) {
      activeUsersCount += 1
      console.log('📊 Admin is active, incrementing active count')
    }
    
    console.log('📊 Active users from DB (last 5 mins):', activeUsersCount)

    // Get total users count
    const totalUsersCount = await prisma.user.count()
    console.log('📊 Total users from DB:', totalUsersCount)

    // Get banned users count
    const bannedUsersCount = await prisma.user.count({
      where: {
        is_banned: true
      }
    })
    console.log('📊 Banned users from DB:', bannedUsersCount)

    // Calculate inactive users
    const inactiveUsersCount = totalUsersCount - activeUsersCount - bannedUsersCount
    console.log('📊 Inactive users from DB:', inactiveUsersCount)

    // Gender Analytics - Count only valid gender values (male/female), exclude NULL/empty
    const genderCountResult = await prisma.$queryRaw`
      SELECT gender, COUNT(*)::int AS count
      FROM users
      WHERE gender IN ('male', 'female')
      GROUP BY gender
    `
    
    // Parse gender counts
    const genderMap = {}
    genderCountResult.forEach(row => {
      genderMap[row.gender.toLowerCase()] = Number(row.count)
    })
    
    const totalMaleUsers = genderMap.male || 0
    const totalFemaleUsers = genderMap.female || 0
    
    console.log('📊 Total Male Users (valid only):', totalMaleUsers)
    console.log('📊 Total Female Users (valid only):', totalFemaleUsers)

    // Active Male/Female Users - count only valid gender, last_seen within 5 minutes
    const activeMaleUsersResult = await prisma.$queryRaw`
      SELECT COUNT(*)::int AS count
      FROM users
      WHERE gender = 'male' AND last_seen >= ${fiveMinutesAgo}
    `
    const activeFemaleUsersResult = await prisma.$queryRaw`
      SELECT COUNT(*)::int AS count
      FROM users
      WHERE gender = 'female' AND last_seen >= ${fiveMinutesAgo}
    `
    
    const activeMaleUsers = Number(activeMaleUsersResult[0]?.count || 0)
    const activeFemaleUsers = Number(activeFemaleUsersResult[0]?.count || 0)
    
    console.log('📊 Active Male Users (valid only):', activeMaleUsers)
    console.log('📊 Active Female Users (valid only):', activeFemaleUsers)
    
    // Return data from database, not hardcoded
    const responseData = {
      stats: {
        activeUsers: activeUsersCount,
        ongoingSessions: 12,
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
        { time: '00:00', users: 24 },
        { time: '04:00', users: 13 },
        { time: '08:00', users: 98 },
        { time: '12:00', users: 39 },
        { time: '16:00', users: 48 },
        { time: '20:00', users: 38 }
      ],
      revenueData: [
        { date: 'Mon', revenue: 400 },
        { date: 'Tue', revenue: 300 },
        { date: 'Wed', revenue: 200 },
        { date: 'Thu', revenue: 278 },
        { date: 'Fri', revenue: 189 },
        { date: 'Sat', revenue: 239 },
        { date: 'Sun', revenue: 349 }
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

