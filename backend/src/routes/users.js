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
            { id: isNaN(parseInt(search)) ? undefined : parseInt(search) },
            { email: { contains: search, mode: 'insensitive' } },
            { username: { contains: search, mode: 'insensitive' } }
          ]
        }
      })
      return res.json({ users })
    }

    const users = await prisma.user.findMany()
    res.json({ users })
  } catch (error) {
    console.error('Error fetching users:', error)
    res.status(500).json({ message: 'Error fetching users' })
  }
})

router.post('/:userId/ban', async (req, res) => {
  try {
    const { userId } = req.params
    const user = await prisma.user.update({
      where: { id: parseInt(userId) },
      data: { banned: true }
    })
    res.json({ message: 'User banned successfully', user })
  } catch (error) {
    console.error('Error banning user:', error)
    res.status(500).json({ message: 'Error banning user' })
  }
})

router.post('/:userId/unban', async (req, res) => {
  try {
    const { userId } = req.params
    const user = await prisma.user.update({
      where: { id: parseInt(userId) },
      data: { banned: false }
    })
    res.json({ message: 'User unbanned successfully', user })
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
    const user = await prisma.user.update({
      where: { id: parseInt(userId) },
      data: { coins: 0 }
    })
    res.json({ message: 'Coins reset successfully', user })
  } catch (error) {
    console.error('Error resetting coins:', error)
    res.status(500).json({ message: 'Error resetting coins' })
  }
})

export default router

