import { useState, useEffect } from 'react'

export default function ChatLogs() {
  const [activeTab, setActiveTab] = useState('appeals') // 'appeals' | 'banned'
  const [appeals, setAppeals] = useState([])
  const [bannedUsers, setBannedUsers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [activeTab])

  const fetchData = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('adminToken')
      const headers = {
        'Authorization': `Bearer ${token}`
      }

      const endpoint = activeTab === 'appeals' 
        ? 'http://localhost:3001/api/admin/appeals' 
        : 'http://localhost:3001/api/admin/users/banned';
        
      const res = await fetch(endpoint, { headers })
      
      if (res.status === 401) {
        localStorage.removeItem('adminToken')
        localStorage.removeItem('adminInfo')
        window.location.href = '/login'
        return
      }
      
      const data = await res.json()
      if (data.success) {
        if (activeTab === 'appeals') {
          setAppeals(data.appeals || [])
        } else {
          setBannedUsers(data.users || [])
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleApproveAppeal = async (id) => {
    try {
      const token = localStorage.getItem('adminToken')
      const res = await fetch(`http://localhost:3001/api/admin/appeals/${id}/approve`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await res.json()
      if (data.success) {
        fetchData()
      } else {
        alert(data.message)
      }
    } catch (error) {
      console.error('Error approving appeal:', error)
    }
  }

  const handleRejectAppeal = async (id) => {
    try {
      const token = localStorage.getItem('adminToken')
      const res = await fetch(`http://localhost:3001/api/admin/appeals/${id}/reject`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await res.json()
      if (data.success) {
        fetchData()
      } else {
        alert(data.message)
      }
    } catch (error) {
      console.error('Error rejecting appeal:', error)
    }
  }

  const handleUnban = async (userId) => {
    try {
      const token = localStorage.getItem('adminToken')
      const res = await fetch(`http://localhost:3001/api/admin/users/${userId}/unban`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await res.json()
      if (data.success) {
        fetchData()
      } else {
        alert(data.message)
      }
    } catch (error) {
      console.error('Error unbanning user:', error)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-dark-100">Appeals & Bans</h1>
      </div>

      <div className="bg-dark-800 border border-dark-700 rounded-lg overflow-hidden">
        {/* Tabs Headers */}
        <div className="flex border-b border-dark-700">
          <button
            onClick={() => setActiveTab('appeals')}
            className={`flex-1 py-4 text-sm font-medium transition-colors ${
              activeTab === 'appeals'
                ? 'text-purple-400 border-b-2 border-purple-500 bg-dark-700/50'
                : 'text-dark-300 hover:text-dark-100 hover:bg-dark-700/30'
            }`}
          >
            Appeals
          </button>
          <button
            onClick={() => setActiveTab('banned')}
            className={`flex-1 py-4 text-sm font-medium transition-colors ${
              activeTab === 'banned'
                ? 'text-purple-400 border-b-2 border-purple-500 bg-dark-700/50'
                : 'text-dark-300 hover:text-dark-100 hover:bg-dark-700/30'
            }`}
          >
            Banned Users
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : activeTab === 'appeals' ? (
            // Appeals Tab Content
            <div className="space-y-4">
              {appeals.length === 0 ? (
                <div className="text-center py-12 text-dark-400">
                  <p>No pending appeals</p>
                </div>
              ) : (
                appeals.map((appeal) => (
                  <div key={appeal.id} className="bg-dark-700 rounded-lg p-5 border border-dark-600 transition-all hover:border-purple-500/50">
                    <div className="flex flex-col md:flex-row justify-between md:items-start gap-4 mb-4">
                      <div>
                        <h3 className="text-lg font-medium text-dark-100">{appeal.name}</h3>
                        <p className="text-xs text-dark-400 mb-3">User ID: {appeal.userId}</p>
                        <div className="bg-dark-800/80 p-3 rounded text-sm text-dark-200 border border-dark-600">
                          {appeal.message}
                        </div>
                      </div>
                      <div className="text-sm text-dark-400 whitespace-nowrap">
                        {new Date(appeal.date).toLocaleString()}
                      </div>
                    </div>
                    
                    <div className="flex gap-3 pt-3 border-t border-dark-600">
                      <button 
                        onClick={() => handleApproveAppeal(appeal.id)}
                        className="px-4 py-2 bg-green-500/20 text-green-400 text-sm rounded hover:bg-green-500/30 transition-colors"
                      >
                        Approve (Unban)
                      </button>
                      <button 
                        onClick={() => handleRejectAppeal(appeal.id)}
                        className="px-4 py-2 bg-red-500/20 text-red-400 text-sm rounded hover:bg-red-500/30 transition-colors"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            // Banned Users Tab Content
            <div className="overflow-x-auto">
              {bannedUsers.length === 0 ? (
                <div className="text-center py-12 text-dark-400">
                  <p>No banned users found</p>
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-dark-600 text-dark-400 text-sm">
                      <th className="pb-3 px-4 font-medium">User Details</th>
                      <th className="pb-3 px-4 font-medium">Ban Reason</th>
                      <th className="pb-3 px-4 font-medium">Banned At</th>
                      <th className="pb-3 px-4 font-medium">Banned By</th>
                      <th className="pb-3 px-4 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-dark-700">
                    {bannedUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-dark-700/30 transition-colors">
                        <td className="py-4 px-4 align-top">
                          <div className="font-medium text-dark-100">{user.name}</div>
                          <div className="text-xs text-dark-400 mt-1">{user.id}</div>
                        </td>
                        <td className="py-4 px-4 align-top text-sm text-dark-300 max-w-xs truncate">
                          <span title={user.reason}>{user.reason}</span>
                        </td>
                        <td className="py-4 px-4 align-top text-sm text-dark-400">
                          {user.date ? new Date(user.date).toLocaleString() : 'N/A'}
                        </td>
                        <td className="py-4 px-4 align-top text-sm text-dark-400">
                          {user.bannedBy}
                        </td>
                        <td className="py-4 px-4 align-top text-right">
                          <button 
                            onClick={() => handleUnban(user.id)}
                            className="px-3 py-1.5 bg-green-500/20 text-green-400 text-xs rounded hover:bg-green-500/30 transition-colors mr-2"
                          >
                            Unban
                          </button>
                          <button className="px-3 py-1.5 bg-blue-500/20 text-blue-400 text-xs rounded hover:bg-blue-500/30 transition-colors">
                            View Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
