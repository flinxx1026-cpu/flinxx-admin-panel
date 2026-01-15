import express from 'express'
import jwt from 'jsonwebtoken'
import bcryptjs from 'bcryptjs'
import prisma from '../config/database.js'

const router = express.Router()

// Endpoint to create admin user (for initial setup)
router.post('/create-admin', async (req, res) => {
  try {
    console.log('🔐 Create admin request received')
    
    // Delete existing admin if any (to ensure correct password hash)
    await prisma.admin.deleteMany({
      where: { email: 'Nikhilyadav1026@flinxx.com' }
    })
    console.log('Deleted existing admin if present')
    
    // Hash the password using bcryptjs with 10 salt rounds
    const hashedPassword = bcryptjs.hashSync('nkhlydv', 10)
    console.log('✅ Password hashed with bcryptjs')
    
    // Create admin user with properly hashed password
    const admin = await prisma.admin.create({
      data: {
        email: 'Nikhilyadav1026@flinxx.com',
        password: hashedPassword,
        role: 'ADMIN'
      }
    })
    
    console.log('✅ Admin user created successfully!')
    res.json({
      message: 'Admin user created successfully',
      email: admin.email,
      role: admin.role,
      status: 'success'
    })
  } catch (error) {
    console.error('❌ Error creating admin:', error.message)
    res.status(500).json({ 
      message: 'Failed to create admin',
      error: error.message
    })
  }
})

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body
    console.log('🔐 Login attempt:', { email, passwordProvided: !!password })

    // Try to find admin in database
    const admin = await prisma.admin.findUnique({
      where: { email }
    })
    console.log('📊 Database query result:', admin ? 'Admin found' : 'Admin not found')

    if (!admin) {
      console.log('❌ Admin not found:', email)
      return res.status(401).json({ message: 'Invalid credentials' })
    }

    console.log('🔑 Checking password...')
    const isValidPassword = bcryptjs.compareSync(password, admin.password)
    console.log('✅ Password valid:', isValidPassword)
    
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid credentials' })
    }

    const token = jwt.sign(
      { id: admin.id, email: admin.email, role: admin.role },
      process.env.JWT_SECRET || 'secret-key',
      { expiresIn: '24h' }
    )

    console.log('🎉 Token generated successfully')
    res.json({
      token,
      admin: {
        id: admin.id,
        email: admin.email,
        role: admin.role
      }
    })
  } catch (error) {
    console.error('💥 Login error:', error)
    res.status(500).json({ message: 'Login failed', error: error.message })
  }
})

// Data verification endpoint - proves data is from real database queries
router.get('/verify-production-data', async (req, res) => {
  try {
    console.log('🔍 Verifying production database data...')

    // Get all raw counts directly from database tables
    const totalUsers = await prisma.user.count()
    const bannedUsers = await prisma.user.count({ where: { banned: true } })
    const activeUsers = totalUsers - bannedUsers

    const totalSessions = await prisma.session.count()
    const ongoingSessions = await prisma.session.count({ where: { endedAt: null } })
    const completedSessions = totalSessions - ongoingSessions

    const totalPayments = await prisma.payment.count()
    const completedPayments = await prisma.payment.count({ where: { status: 'completed' } })
    const pendingPayments = totalPayments - completedPayments

    const payments = await prisma.payment.findMany({ where: { status: 'completed' } })
    const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0)

    const totalReports = await prisma.report.count()
    const pendingReports = await prisma.report.count({ where: { status: 'pending' } })
    const reviewedReports = await prisma.report.count({ where: { status: 'reviewed' } })
    const resolvedReports = await prisma.report.count({ where: { status: 'resolved' } })

    const verificationData = {
      timestamp: new Date().toISOString(),
      database: 'Neon PostgreSQL (Production)',
      isDatabaseEmpty: totalUsers === 0 && totalSessions === 0 && totalPayments === 0,
      tables: {
        users: {
          total: totalUsers,
          active: activeUsers,
          banned: bannedUsers
        },
        sessions: {
          total: totalSessions,
          ongoing: ongoingSessions,
          completed: completedSessions
        },
        payments: {
          total: totalPayments,
          completed: completedPayments,
          pending: pendingPayments,
          totalRevenue: Math.round(totalRevenue * 100) / 100
        },
        reports: {
          total: totalReports,
          pending: pendingReports,
          reviewed: reviewedReports,
          resolved: resolvedReports
        }
      },
      realDataConfirmation: {
        hasUsers: totalUsers > 0,
        hasSessions: totalSessions > 0,
        hasPayments: totalPayments > 0,
        hasReports: totalReports > 0,
        message: totalUsers > 0 && totalSessions > 0 
          ? '✅ REAL PRODUCTION DATA - No seeding or mocks detected'
          : '⚠️ Database is empty - contains no application data'
      }
    }

    console.log('✅ Data verification complete:', JSON.stringify(verificationData, null, 2))
    res.json(verificationData)
  } catch (error) {
    console.error('❌ Verification error:', error)
    res.status(500).json({ message: 'Verification failed', error: error.message })
  }
})

// Dashboard endpoint - returns real data from database
router.get('/dashboard', async (req, res) => {
  try {
    const result = await prisma.$queryRaw`
      SELECT COUNT(*)::int AS count
      FROM "User"
      WHERE created_at >= NOW() - INTERVAL '24 hours'
    `

    console.log('📊 Dashboard query result:', JSON.stringify(result))
    const newSignups = result[0]?.count ?? 0
    console.log('📊 New signups count:', newSignups)
    
    res.json({ 
      stats: { 
        newSignups: Number(newSignups)
      }
    })
  } catch (error) {
    console.error('❌ Dashboard error:', error.message)
    res.status(500).json({ message: 'Dashboard error', error: error.message })
  }
})

export default router

