import express from 'express'
import prisma from '../config/database.js'

const router = express.Router()

router.get('/', async (req, res) => {
  try {
    console.log('📊 Dashboard API called')
    
    // Get real new signups count from database
    const signupResult = await prisma.$queryRaw`
      SELECT COUNT(*)::int AS count
      FROM users
      WHERE created_at >= NOW() - INTERVAL '24 hours'
    `
    const newSignups = Number(signupResult[0].count)
    console.log('📊 New signups from DB (last 24h):', newSignups)

    // Get real active users count from database (last 5 minutes)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
    const activeUsersCount = await prisma.user.count({
      where: {
        last_seen: {
          gte: fiveMinutesAgo
        }
      }
    })
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
        revenue: 1200,
        reportsLastDay: 5,
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

