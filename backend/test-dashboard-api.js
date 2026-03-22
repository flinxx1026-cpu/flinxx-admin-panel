import axios from 'axios'
import jwt from 'jsonwebtoken'

// Create a valid JWT token for testing
const testToken = jwt.sign(
  { id: 'test-admin', email: 'test@admin.com', role: 'ADMIN' },
  process.env.JWT_SECRET || 'secret-key',
  { expiresIn: '24h' }
)

console.log('🔐 Test Token:', testToken)
console.log('📍 Testing API endpoint: http://localhost:3001/api/admin/dashboard')

// Call the dashboard API with the test token
axios
  .get('http://localhost:3001/api/admin/dashboard', {
    headers: {
      Authorization: `Bearer ${testToken}`
    }
  })
  .then(res => {
    console.log('✅ API Response Status:', res.status)
    console.log('📦 Full Response Data:')
    console.log(JSON.stringify(res.data, null, 2))
  })
  .catch(err => {
    console.error('❌ API Error:', err.response?.status, err.response?.data || err.message)
  })
