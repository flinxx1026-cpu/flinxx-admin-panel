import express from 'express'

const router = express.Router()

router.get('/', (req, res) => {
  res.json({
    settings: {
      siteName: 'Flinxx',
      supportEmail: 'support@flinxx.com',
      matchDuration: 10,
      maxReports: 5
    }
  })
})

router.post('/update', (req, res) => {
  res.json({ message: 'Settings updated' })
})

export default router
