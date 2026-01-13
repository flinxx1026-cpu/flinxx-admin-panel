import express from 'express'
import prisma from '../config/database.js'

const router = express.Router()

router.get('/', async (req, res) => {
  try {
    const { search } = req.query

    if (search) {
      const users = await prisma.user.findMany({
        where: {
          OR: [
            { email: { contains: search, mode: 'insensitive' } },
            { display_name: { contains: search, mode: 'insensitive' } }
          ]
        },
        orderBy: { created_at: 'desc' }
      })
      console.log(`✅ Found ${users.length} user(s) matching search: "${search}"`)
      return res.json({ users })
    }

    // Fetch all users, sorted by most recent first
    const users = await prisma.user.findMany({
      orderBy: { created_at: 'desc' }
    })
    
    console.log(`✅ Fetched all ${users.length} users from database`)
    res.json({ users })
  } catch (error) {
    console.error('Error fetching users:', error)
    res.status(500).json({ message: 'Error fetching users', error: error.message })
  }
})

router.post('/:userId/ban', async (req, res) => {
  try {
    const { userId } = req.params
    res.json({ message: 'User ban feature not yet implemented', userId })
  } catch (error) {
    console.error('Error banning user:', error)
    res.status(500).json({ message: 'Error banning user' })
  }
})

router.post('/:userId/unban', async (req, res) => {
  try {
    const { userId } = req.params
    res.json({ message: 'User unban feature not yet implemented', userId })
  } catch (error) {
    console.error('Error unbanning user:', error)
    res.status(500).json({ message: 'Error unbanning user' })
  }
})

router.post('/:userId/warn', async (req, res) => {
  try {
    const { userId } = req.params
    // This would typically store a warning record - for now just return success
    res.json({ message: 'Warning sent to user' })
  } catch (error) {
    console.error('Error warning user:', error)
    res.status(500).json({ message: 'Error warning user' })
  }
})

router.post('/:userId/reset-coins', async (req, res) => {
  try {
    const { userId } = req.params
    res.json({ message: 'Coins reset feature not yet implemented', userId })
  } catch (error) {
    console.error('Error resetting coins:', error)
    res.status(500).json({ message: 'Error resetting coins' })
  }
})

export default router

