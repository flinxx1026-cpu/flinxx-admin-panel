import axios from 'axios'

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:3001') + '/api'

const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('adminToken') || localStorage.getItem('userToken') || localStorage.getItem('token') || localStorage.getItem('authToken');
  
  console.log("TOKEN:", token);
  
  if (token && token !== 'null' && token !== 'undefined') {
    config.headers.Authorization = `Bearer ${token}`
  } else {
    // Make sure we never send 'Bearer null'
    delete config.headers.Authorization
  }
  return config
})

// Handle responses - check for ban status
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Check if user is banned
    if (error.response?.status === 403 && error.response?.data?.error_code === 'USER_BANNED') {
      console.error('🚫 USER BANNED:', error.response.data.reason)
      
      // Clear authentication
      localStorage.removeItem('adminToken')
      localStorage.removeItem('admin')
      
      // Show ban alert
      alert(`⛔ Your account has been banned\n\nReason: ${error.response.data.reason || 'No reason provided'}`)
      
      // Redirect to login
      window.location.href = '/login'
      
      return Promise.reject(error)
    }

    // Handle 401 - token expired or invalid
    if (error.response?.status === 401) {
      console.log('🔐 Unauthorized - clearing token')
      localStorage.removeItem('adminToken')
      localStorage.removeItem('admin')
      window.location.href = '/login'
    }
    
    return Promise.reject(error)
  }
)



export default api
