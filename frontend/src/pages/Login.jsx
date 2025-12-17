import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogIn } from 'lucide-react'
import api from '../services/api'

export default function Login() {
  const navigate = useNavigate()
  const [credentials, setCredentials] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    
    // Validate credentials before submitting
    if (!credentials.email || !credentials.password) {
      setError('Please enter both email and password')
      return
    }
    
    setLoading(true)
    setError('')

    try {
      console.log('📤 Sending login request...', credentials)
      const response = await api.post('/admin/login', credentials)
      console.log('📥 Login response:', response.status)
      console.log('📦 Full response.data:', response.data)
      console.log('🔑 Token at response.data.token:', response.data.token)
      console.log('👤 Admin at response.data.admin:', response.data.admin)
      
      if (!response.data.token) {
        console.error('❌ Token missing from response:', response.data)
        setError('Login failed: No token received')
        setLoading(false)
        return
      }
      
      console.log('💾 Storing token in localStorage...')
      localStorage.setItem('adminToken', response.data.token)
      localStorage.setItem('adminInfo', JSON.stringify(response.data.admin))
      console.log('✅ Token stored successfully')
      console.log('📍 Redirecting to dashboard...')
      
      navigate('/dashboard', { replace: true })
    } catch (err) {
      console.error('❌ Login error:', err)
      const message = err.response?.data?.message || err.message || 'Login failed'
      console.log('Error message:', message)
      setError(message)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-900 via-purple-900 to-dark-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-dark-800 border border-dark-700 rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-4">
              <LogIn size={32} className="text-purple-400" />
              <h1 className="text-2xl font-bold text-dark-100">Flinxx Admin</h1>
            </div>
            <p className="text-dark-400">Sign in to access the admin panel</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-900/20 border border-red-700 text-red-300 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-dark-200 mb-2">Email</label>
              <input
                type="email"
                value={credentials.email}
                onChange={(e) => setCredentials({ ...credentials, email: e.target.value })}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && credentials.password) {
                    handleSubmit(e)
                  }
                }}
                className="w-full bg-dark-700 border border-dark-600 rounded-lg px-4 py-2 text-dark-100 placeholder-dark-400 focus:outline-none focus:border-purple-500"
                placeholder="admin@flinxx.com"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-200 mb-2">Password</label>
              <input
                type="password"
                value={credentials.password}
                onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && credentials.email) {
                    handleSubmit(e)
                  }
                }}
                className="w-full bg-dark-700 border border-dark-600 rounded-lg px-4 py-2 text-dark-100 placeholder-dark-400 focus:outline-none focus:border-purple-500"
                placeholder="••••••••"
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 disabled:from-dark-600 disabled:to-dark-600 text-white font-semibold py-2 rounded-lg transition-all duration-200 transform hover:scale-105"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-dark-400 text-sm mt-6">
            Demo credentials: admin@flinxx.com / password
          </p>
        </div>
      </div>
    </div>
  )
}
