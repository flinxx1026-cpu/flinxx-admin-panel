import express from 'express'

const router = express.Router()

// Mock users data
const mockUsers = [
  {
    _id: '001',
    username: 'user1',
    email: 'user1@example.com',
    status: 'active',
    createdAt: new Date('2024-11-01'),
    coins: 500
  },
  {
    _id: '002',
    username: 'user2',
    email: 'user2@example.com',
    status: 'active',
    createdAt: new Date('2024-11-05'),
    coins: 1200
  }
]

router.get('/', (req, res) => {
  const { search } = req.query
  let results = mockUsers

  if (search) {
    results = mockUsers.filter(u =>
      u._id.includes(search) ||
      u.email.includes(search) ||
      u.username.includes(search)
    )
  }

  res.json({ users: results })
})

router.post('/:userId/ban', (req, res) => {
  res.json({ message: 'User banned successfully' })
})

router.post('/:userId/unban', (req, res) => {
  res.json({ message: 'User unbanned successfully' })
})

router.post('/:userId/warn', (req, res) => {
  res.json({ message: 'Warning sent to user' })
})

router.post('/:userId/reset-coins', (req, res) => {
  res.json({ message: 'Coins reset successfully' })
})

export default router
