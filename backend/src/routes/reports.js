import express from 'express'

const router = express.Router()

router.get('/', (req, res) => {
  res.json({ reports: [] })
})

router.post('/:reportId/close', (req, res) => {
  res.json({ message: 'Report closed' })
})

router.post('/:reportId/ban', (req, res) => {
  res.json({ message: 'User banned' })
})

router.post('/:reportId/warn', (req, res) => {
  res.json({ message: 'Warning sent' })
})

export default router
