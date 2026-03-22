// Test Socket.io realtime active users updates
// Run: node test-socket-updates.js

import { io } from 'socket.io-client'
import jwt from 'jsonwebtoken'

const socketURL = 'http://localhost:3001'

// Create a valid JWT token for testing
const testToken = jwt.sign(
  { id: 'admin-test', email: 'admin@test.com', role: 'ADMIN' },
  process.env.JWT_SECRET || 'secret-key',
  { expiresIn: '24h' }
)

console.log('🧪 Socket.io Realtime Update Test')
console.log('📍 Connecting to:', socketURL)

// Connect to Socket.io with admin token
const socket = io(socketURL, {
  auth: {
    token: testToken
  }
})

socket.on('connect', () => {
  console.log('✅ Connected to Socket.io server')
})

// Listen for active users updates
socket.on('admin:activeUsersUpdate', (data) => {
  console.log('📡 Received activeUsersUpdate:')
  console.log(`   Active Users: ${data.activeUsers}`)
  console.log(`   Active Male Users: ${data.activeMaleUsers}`)
  console.log(`   Active Female Users: ${data.activeFemaleUsers}`)
  console.log(`   Updated At: ${data.updatedAt}`)
  
  // Verify math
  const total = data.activeMaleUsers + data.activeFemaleUsers
  if (data.activeUsers === total) {
    console.log(`   ✅ Math check passed: ${data.activeUsers} = ${data.activeMaleUsers} + ${data.activeFemaleUsers}`)
  } else {
    console.log(`   ❌ Math check failed: ${data.activeUsers} != ${data.activeMaleUsers} + ${data.activeFemaleUsers}`)
  }
})

socket.on('error', (error) => {
  console.error('❌ Socket error:', error)
})

socket.on('disconnect', () => {
  console.log('🔌 Disconnected from Socket.io server')
})

// Keep listening for 30 seconds
setTimeout(() => {
  console.log('⏱️  Test timeout reached, disconnecting...')
  socket.disconnect()
  process.exit(0)
}, 30000)
