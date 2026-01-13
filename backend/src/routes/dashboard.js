import express from 'express'
import prisma from '../config/database.js'

const router = express.Router()

// Helper function to get recent activity
async function getRecentActivity() {
  // Get recent reports
  const recentReports = await prisma.report.findMany({
    take: 3,
    orderBy: { createdAt: 'desc' },
    select: { id: true, reason: true, createdAt: true }
  })

  // Get recent signups
  const recentSignups = await prisma.user.findMany({
    take: 3,
    orderBy: { created_at: 'desc' },
    select: { id: true, display_name: true, created_at: true }
  })

  const activities = [
    ...recentReports.map(r => ({
      id: `report-${r.id}`,
      type: 'Report',
      description: `Report: ${r.reason}`,
      timestamp: r.createdAt
    })),
    ...recentSignups.map(u => ({
      id: `signup-${u.id}`,
      type: 'Signup',
      description: `New user: ${u.display_name || 'Unknown'}`,
      timestamp: u.created_at
    }))
  ]

  return activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 5)
}

router.get('/', async (req, res) => {
  try {
    console.log('📊 Dashboard API called - Fetching data from database...')
    
    // Get real stats from database
    const totalUsers = await prisma.user.count()

    const activeUsers = await prisma.user.count({
      where: { profileCompleted: true }
    })

    const newSignups = await prisma.user.count({
      where: {
        created_at: {
          gte: new Date(new Date().setDate(new Date().getDate() - 1))
        }
      }
    })

    const pendingReports = await prisma.report.count({
      where: { status: 'pending' }
    })

    // Mock data for charts (session/payment tables don't exist)
    const userActivity = [
      { time: '00:00', users: 24 },
      { time: '04:00', users: 13 },
      { time: '08:00', users: 98 },
      { time: '12:00', users: 39 },
      { time: '16:00', users: 48 },
      { time: '20:00', users: 38 }
    ]

    const revenueData = [
      { date: 'Mon', revenue: 400 },
      { date: 'Tue', revenue: 300 },
      { date: 'Wed', revenue: 200 },
      { date: 'Thu', revenue: 278 },
      { date: 'Fri', revenue: 189 },
      { date: 'Sat', revenue: 239 },
      { date: 'Sun', revenue: 349 }
    ]

    const userDistribution = [
      { name: 'Active', value: activeUsers },
      { name: 'Inactive', value: totalUsers - activeUsers },
      { name: 'Suspended', value: 0 },
      { name: 'Banned', value: 0 }
    ]

    // Get recent activity from database
    const recentActivity = await getRecentActivity()

    const responseData = {
      stats: {
        activeUsers,
        ongoingSessions: 12, // Mock data
        newSignups,
        revenue: 1200, // Mock data
        reportsLastDay: pendingReports,
        totalUsers
      },
      userActivity,
      revenueData,
      userDistribution,
      recentActivity
    }

    console.log('✅ Dashboard data fetched successfully')
    console.log('  - Total Users:', totalUsers)
    console.log('  - Active Users:', activeUsers)
    console.log('  - New Signups (24h):', newSignups)
    console.log('  - Pending Reports:', pendingReports)

    res.json(responseData)
  } catch (error) {
    console.error('❌ Error fetching dashboard:', error.message)
    res.status(500).json({ 
      message: 'Error fetching dashboard data',
      error: error.message
    })
  }
})

export default router

