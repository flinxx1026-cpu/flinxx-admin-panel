import express from 'express'
import prisma from '../config/database.js'
import { verifyAdminToken } from '../middleware/authMiddleware.js'

const router = express.Router()

// Apply admin token verification to all report routes
router.use(verifyAdminToken)

// GET /api/admin/reports
router.get('/', async (req, res) => {
  try {
    const reports = await prisma.report.findMany({
      orderBy: { created_at: 'desc' },
      include: {
        reportedUser: {
          select: { email: true, display_name: true }
        },
        reporter: {
          select: { email: true }
        }
      }
    })
    
    // Map to frontend expected format safely
    const formattedReports = reports.map(r => ({
      id: r.id,
      reportedUserId: r.reportedUserId,
      reportedUserEmail: r.reportedUser?.email || 'Unknown',
      reason: r.reason,
      status: r.status,
      date: r.created_at
    }))
    
    res.json({ success: true, reports: formattedReports })
  } catch (error) {
    console.error('❌ Error fetching reports:', error)
    res.status(500).json({ success: false, message: 'Error fetching reports', error: error.message })
  }
})

// POST /api/admin/reports/:reportId/action
router.post('/:reportId/action', async (req, res) => {
  try {
    const { reportId } = req.params
    const { action } = req.body // 'warn' or 'ban'
    
    // Find the report
    const report = await prisma.report.findUnique({
      where: { id: reportId }
    })
    
    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' })
    }
    
    if (action === 'ban') {
      // 1. Ban the user
      await prisma.user.update({
        where: { id: report.reportedUserId },
        data: { is_banned: true }
      })
      // 2. Update report status
      const updatedReport = await prisma.report.update({
        where: { id: reportId },
        data: { status: 'banned' }
      })
      
      // 3. Kick user from Flinxx Backend in real-time
      try {
        await fetch('http://localhost:5000/api/internal/kick-user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: report.reportedUserId })
        });
      } catch (err) {
        console.error('⚠️ Could not notify Flinxx backend to kick user', err);
      }
      
      return res.status(200).json({ success: true, message: 'User banned and report updated', report: updatedReport })
    } else if (action === 'warn') {
      // 1. Optional: bump warning count on user
      await prisma.user.update({
        where: { id: report.reportedUserId },
        data: { updated_at: new Date() } // placeholder for actual warning logic if needed
      })
      // 2. Update report status
      const updatedReport = await prisma.report.update({
        where: { id: reportId },
        data: { status: 'warned' }
      })
      return res.json({ success: true, message: 'User warned and report updated', report: updatedReport })
    }
    
    return res.status(400).json({ success: false, message: 'Invalid action' })
  } catch (error) {
    console.error(`❌ Error performing action on report ${req.params.reportId}:`, error)
    return res.status(500).json({ success: false, message: 'Error performing action', error: error.message || 'Internal server error' })
  }
})

export default router
