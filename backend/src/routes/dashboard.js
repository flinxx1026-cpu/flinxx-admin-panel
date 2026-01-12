import express from 'express'
import prisma from '../config/database.js'

const router = express.Router()

// Helper function to get user activity data grouped by 4-hour intervals
async function getUserActivityData() {
  const sessions = await prisma.session.findMany({
    select: { createdAt: true }
  })

  const activityMap = {}
  const timeSlots = ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00']

  // Initialize time slots
  timeSlots.forEach(time => {
    activityMap[time] = 0
  })

  // Group sessions by 4-hour intervals
  sessions.forEach(session => {
    const hour = session.createdAt.getHours()
    let timeSlot
    if (hour < 4) timeSlot = '00:00'
    else if (hour < 8) timeSlot = '04:00'
    else if (hour < 12) timeSlot = '08:00'
    else if (hour < 16) timeSlot = '12:00'
    else if (hour < 20) timeSlot = '16:00'
    else timeSlot = '20:00'
    
    activityMap[timeSlot]++
  })

  return timeSlots.map(time => ({
    time,
    users: activityMap[time]
  }))
}

// Helper function to get revenue data for the last 7 days
async function getRevenueData() {
  const payments = await prisma.payment.findMany({
    where: { status: 'completed' },
    select: { amount: true, createdAt: true }
  })

  const revenueMap = {}
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const today = new Date()

  // Initialize last 7 days
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    const dayName = days[date.getDay()]
    revenueMap[dayName] = 0
  }

  // Sum payments by day
  payments.forEach(payment => {
    const paymentDate = new Date(payment.createdAt)
    const dayName = days[paymentDate.getDay()]
    revenueMap[dayName] += payment.amount
  })

  return days.map(day => ({
    date: day,
    revenue: Math.round(revenueMap[day] * 100) / 100
  }))
}

// Helper function to get user distribution
async function getUserDistribution() {
  const totalUsers = await prisma.user.count()
  const activeUsers = await prisma.user.count({
    where: { banned: false }
  })
  const bannedUsers = await prisma.user.count({
    where: { banned: true }
  })
  
  const inactiveUsers = Math.max(0, totalUsers - activeUsers - bannedUsers)
  const suspendedUsers = Math.max(0, inactiveUsers - Math.floor(inactiveUsers * 0.5))
  const actualInactive = inactiveUsers - suspendedUsers

  return [
    { name: 'Active', value: activeUsers },
    { name: 'Inactive', value: actualInactive },
    { name: 'Suspended', value: suspendedUsers },
    { name: 'Banned', value: bannedUsers }
  ]
}

// Helper function to get recent activity
async function getRecentActivity() {
  // Get recent sessions
  const recentSessions = await prisma.session.findMany({
    take: 3,
    orderBy: { createdAt: 'desc' },
    select: { id: true, user1Id: true, user2Id: true, createdAt: true }
  })

  // Get recent reports
  const recentReports = await prisma.report.findMany({
    take: 2,
    orderBy: { createdAt: 'desc' },
    select: { id: true, reason: true, createdAt: true }
  })

  // Get recent signups
  const recentSignups = await prisma.user.findMany({
    take: 2,
    orderBy: { createdAt: 'desc' },
    select: { id: true, username: true, createdAt: true }
  })

  const activities = [
    ...recentSessions.map(s => ({
      id: `session-${s.id}`,
      type: 'Session',
      description: `Session between users ${s.user1Id} and ${s.user2Id}`,
      timestamp: s.createdAt
    })),
    ...recentReports.map(r => ({
      id: `report-${r.id}`,
      type: 'Report',
      description: `Report: ${r.reason}`,
      timestamp: r.createdAt
    })),
    ...recentSignups.map(u => ({
      id: `signup-${u.id}`,
      type: 'Signup',
      description: `New user: ${u.username}`,
      timestamp: u.createdAt
    }))
  ]

  return activities.sort((a, b) => b.timestamp - a.timestamp).slice(0, 5)
}

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

    // Get real activity and revenue data
    const userActivity = await getUserActivityData()
    const revenueData = await getRevenueData()
    const userDistribution = await getUserDistribution()
    const recentActivity = await getRecentActivity()

    res.json({
      stats: {
        activeUsers,
        ongoingSessions,
        newSignups,
        revenue: Math.round(revenue * 100) / 100,
        reportsLastDay: reports,
        totalUsers
      },
      userActivity,
      revenueData,
      userDistribution,
      recentActivity
    })
  } catch (error) {
    console.error('Error fetching dashboard:', error)
    res.status(500).json({ message: 'Error fetching dashboard data' })
  }
})

export default router

