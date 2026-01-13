import express from 'express'

const router = express.Router()

router.get('/', async (req, res) => {
  try {
    console.log('📊 Dashboard API called')
    
    // Return completely hardcoded mock data
    const responseData = {
      stats: {
        activeUsers: 42,
        ongoingSessions: 12,
        newSignups: 8,
        revenue: 1200,
        reportsLastDay: 5,
        totalUsers: 156
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
        { name: 'Active', value: 42 },
        { name: 'Inactive', value: 114 },
        { name: 'Suspended', value: 0 },
        { name: 'Banned', value: 0 }
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

