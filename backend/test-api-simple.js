// Simple test to verify the backend API is responding
// Run: node test-api-simple.js

async function testAPI() {
  try {
    console.log('🧪 Testing backend API...')
    console.log('📍 URL: http://localhost:3001/api/admin/dashboard')
    
    // Try calling without auth first to see if endpoint exists
    const response = await fetch('http://localhost:3001/api/admin/dashboard')
    
    console.log('📡 Response Status:', response.status)
    console.log('📡 Response Headers:', {
      'content-type': response.headers.get('content-type'),
      'access-control-allow-origin': response.headers.get('access-control-allow-origin')
    })
    
    const data = await response.json()
    console.log('📦 Response Data:')
    console.log(JSON.stringify(data, null, 2))
    
  } catch (err) {
    console.error('❌ Error testing API:', err.message)
  }
}

testAPI()
