import express from 'express'
import prisma from '../config/database.js'

const router = express.Router()

router.post('/', async (req, res) => {
  try {
    const { reportedUserId, reportedBy, reason } = req.body

    if (!reportedUserId || !reportedBy || !reason) {
      return res.status(400).json({ success: false, message: 'Missing required fields' })
    }

    // Attempt to create the report
    let report;
    try {
      report = await prisma.report.create({
        data: {
          reportedUserId,
          reportedBy,
          reason,
          status: 'pending'
        }
      })
    } catch (e) {
      // Prisma error P2002 means unique constraint failed (already reported)
      if (e.code === 'P2002') {
        return res.status(400).json({ success: false, message: 'You have already reported this user.' })
      }
      throw e;
    }

    console.log(`✅ User ${reportedBy} reported user ${reportedUserId} for: ${reason}`)

    // Handle auto-ban logic: if a user reaches 5 unique reports
    // The explicit unique constraint ensures these are 5 distinct users reporting them
    const reportCount = await prisma.report.count({
      where: { reportedUserId }
    })

    if (reportCount >= 5) {
      console.log(`🚨 Auto-Banning User ${reportedUserId} due to 5+ reports.`)
      // Ban the user
      await prisma.user.update({
        where: { id: reportedUserId },
        data: { is_banned: true }
      })
      // Update all their pending reports to banned
      await prisma.report.updateMany({
        where: { reportedUserId, status: 'pending' },
        data: { status: 'banned' }
      })
    }

    res.json({ success: true, message: 'Report submitted successfully', report })
  } catch (error) {
    console.error('❌ Error submitting report:', error)
    res.status(500).json({ success: false, message: 'Error submitting report', error: error.message })
  }
})

export default router
