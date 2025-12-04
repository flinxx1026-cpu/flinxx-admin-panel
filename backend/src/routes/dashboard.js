import express from 'express'

const router = express.Router()

router.get('/', (req, res) => {
  res.json({
    stats: {
      activeUsers: 1245,
      ongoingSessions: 87,
      newSignups: 142,
      revenue: 12450,
      reportsLastDay: 23
    },
    userActivity: [
      { time: '00:00', users: 450 },
      { time: '04:00', users: 320 },
      { time: '08:00', users: 890 },
      { time: '12:00', users: 1240 },
      { time: '16:00', users: 1100 },
      { time: '20:00', users: 950 }
    ],
    revenueData: [
      { date: 'Mon', revenue: 1200 },
      { date: 'Tue', revenue: 1900 },
      { date: 'Wed', revenue: 1600 },
      { date: 'Thu', revenue: 2100 },
      { date: 'Fri', revenue: 2400 },
      { date: 'Sat', revenue: 2200 },
      { date: 'Sun', revenue: 1400 }
    ]
  })
})

export default router
