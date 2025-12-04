import express from 'express'
import prisma from '../config/database.js'

const router = express.Router()

router.get('/', async (req, res) => {
  try {
    // Get real stats from database
    const activeUsers = await prisma.user.count({
      where: { banned: false }
    })

    const totalUsers = await prisma.user.count()

    const ongoingSessions = await prisma.session.count({
      where: { endedAt: null }
    })

    const newSignups = await prisma.user.count({
      where: {
        createdAt: {
          gte: new Date(new Date().setDate(new Date().getDate() - 1))
        }
      }
    })

    const payments = await prisma.payment.findMany({
      where: { status: 'completed' }
    })

    const revenue = payments.reduce((sum, p) => sum + p.amount, 0)

    const reports = await prisma.report.count({
      where: { status: 'pending' }
    })

    res.json({
      stats: {
        activeUsers,
        ongoingSessions,
        newSignups,
        revenue,
        reportsLastDay: reports,
        totalUsers
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
  } catch (error) {
    console.error('Error fetching dashboard:', error)
    res.status(500).json({ message: 'Error fetching dashboard data' })
  }
})

export default router

