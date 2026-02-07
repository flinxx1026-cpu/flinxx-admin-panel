import { useState, useEffect } from 'react'
import { AlertCircle, RefreshCw } from 'lucide-react'
import api from '../services/api'

export default function OnlineUsers() {
  const [onlineUsers, setOnlineUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    fetchOnlineUsers()
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchOnlineUsers, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchOnlineUsers = async () => {
    try {
      setRefreshing(true)
      const response = await api.get('/admin/users/online')
      setOnlineUsers(response.data.users || [])
      setLoading(false)
    } catch (error) {
      console.error('Failed to fetch online users:', error)
      setLoading(false)
    } finally {
      setRefreshing(false)
    }
  }

  const handleRefresh = () => {
    fetchOnlineUsers()
  }

  if (loading) return <div className="text-center py-8 text-dark-300">Loading online users...</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-dark-100">🟢 Online Users</h1>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors disabled:opacity-50"
        >
          <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Online Users Table */}
      <div className="bg-dark-800 border border-dark-700 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-dark-700 border-b border-dark-600">
                <th className="px-6 py-4 text-left text-sm font-semibold text-dark-200">Name</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-dark-200">Email</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-dark-200">Gender</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-dark-200">Status</th>
              </tr>
            </thead>
            <tbody>
              {onlineUsers.length > 0 ? (
                onlineUsers.map((user) => (
                  <tr key={user.id} className="border-b border-dark-700 hover:bg-dark-700/30 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-medium text-dark-100">{user.display_name || 'N/A'}</p>
                    </td>
                    <td className="px-6 py-4 text-dark-300">{user.email}</td>
                    <td className="px-6 py-4 text-sm text-dark-300">
                      {user.gender 
                        ? (user.gender.charAt(0).toUpperCase() + user.gender.slice(1))
                        : 'N/A'}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-2 px-3 py-1 bg-green-900/30 border border-green-700 rounded-full">
                        <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                        <span className="text-xs font-medium text-green-400">Online</span>
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="px-6 py-8 text-center">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <AlertCircle className="text-dark-400" size={32} />
                      <p className="text-dark-400">No users currently online</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center justify-between text-sm text-dark-400">
        <p>Total Online Users: <span className="text-dark-200 font-semibold">{onlineUsers.length}</span></p>
        <p>Last updated: <span className="text-dark-200 font-semibold">{new Date().toLocaleTimeString()}</span></p>
      </div>
    </div>
  )
}
