import express from 'express'
import prisma from '../config/database.js'

const router = express.Router()

router.get('/', async (req, res) => {
  try {
    const reports = await prisma.report.findMany()
    res.json({ reports })
  } catch (error) {
    console.error('Error fetching reports:', error)
    res.status(500).json({ message: 'Error fetching reports' })
  }
})

router.post('/:reportId/close', async (req, res) => {
  try {
    const { reportId } = req.params
    const report = await prisma.report.update({
      where: { id: parseInt(reportId) },
      data: { status: 'closed' }
    })
    res.json({ message: 'Report closed', report })
  } catch (error) {
    console.error('Error closing report:', error)
    res.status(500).json({ message: 'Error closing report' })
  }
})

router.post('/:reportId/ban', async (req, res) => {
  try {
    const { reportId } = req.params
    const report = await prisma.report.findUnique({
      where: { id: parseInt(reportId) }
    })
    
    await prisma.user.update({
      where: { id: report.reportedUserId },
      data: { banned: true }
    })
    
    res.json({ message: 'User banned' })
  } catch (error) {
    console.error('Error banning user:', error)
    res.status(500).json({ message: 'Error banning user' })
  }
})

router.post('/:reportId/warn', async (req, res) => {
  try {
    const { reportId } = req.params
    res.json({ message: 'Warning sent' })
  } catch (error) {
    console.error('Error sending warning:', error)
    res.status(500).json({ message: 'Error sending warning' })
  }
})

export default router
