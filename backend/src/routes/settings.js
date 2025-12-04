import express from 'express'
import prisma from '../config/database.js'

const router = express.Router()

router.get('/', async (req, res) => {
  try {
    const settings = await prisma.setting.findMany()
    const settingsObj = {}
    settings.forEach(s => {
      settingsObj[s.key] = s.value
    })
    res.json({ settings: settingsObj })
  } catch (error) {
    console.error('Error fetching settings:', error)
    res.status(500).json({ message: 'Error fetching settings' })
  }
})

router.post('/update', async (req, res) => {
  try {
    const { key, value } = req.body
    
    const setting = await prisma.setting.upsert({
      where: { key },
      update: { value },
      create: { key, value }
    })
    
    res.json({ message: 'Settings updated', setting })
  } catch (error) {
    console.error('Error updating settings:', error)
    res.status(500).json({ message: 'Error updating settings' })
  }
})

export default router
