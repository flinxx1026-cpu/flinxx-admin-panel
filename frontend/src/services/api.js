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
  const token = localStorage.getItem('adminToken')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
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

// Check ban status on app load
export const checkBanStatus = async () => {
  try {
    const token = localStorage.getItem('adminToken')
    if (!token) {
      return { is_banned: false }
    }

    const response = await api.post('/auth/check-ban')
    console.log('✅ Ban status check:', response.data)
    
    if (response.data.is_banned) {
      console.error('🚫 USER IS BANNED')
      localStorage.removeItem('adminToken')
      localStorage.removeItem('admin')
      alert(`⛔ Your account has been banned\n\nReason: ${response.data.reason || 'No reason provided'}`)
      window.location.href = '/login'
    }
    
    return response.data
  } catch (error) {
    if (error.response?.status === 403 && error.response?.data?.error_code === 'USER_BANNED') {
      console.error('🚫 USER IS BANNED')
      localStorage.removeItem('adminToken')
      localStorage.removeItem('admin')
      alert(`⛔ Your account has been banned\n\nReason: ${error.response.data.reason || 'No reason provided'}`)
      window.location.href = '/login'
    }
    return { is_banned: false }
  }
}

export default api
