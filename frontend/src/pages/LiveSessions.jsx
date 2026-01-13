import { useState, useEffect } from 'react'
import { Video, Trash2, AlertCircle } from 'lucide-react'
import api from '../services/api'

export default function LiveSessions() {
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSessions()
  }, [])

  const fetchSessions = async () => {
    try {
      const response = await api.get('/admin/sessions')
      setSessions(response.data.sessions || [])
    } catch (error) {
      console.error('Failed to fetch sessions:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDisconnect = async (sessionId) => {
    try {
      await api.post(`/admin/sessions/${sessionId}/disconnect`)
      fetchSessions()
    } catch (error) {
      console.error('Failed to disconnect session:', error)
    }
  }

  if (loading) {
    return <div className="text-center py-8">Loading sessions...</div>
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-dark-100">Live Sessions</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-3 bg-dark-800 border border-dark-700 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-dark-100 mb-4 flex items-center gap-2">
            <Video size={20} />
            Active Video Chats
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-dark-700 border-b border-dark-600">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-dark-200">Session ID</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-dark-200">User 1</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-dark-200">User 2</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-dark-200">Duration</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-dark-200">Started</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-dark-200">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sessions.length > 0 ? (
                  sessions.map((session) => (
                    <tr key={session.id} className="border-b border-dark-700 hover:bg-dark-700/30 transition-colors">
                      <td className="px-6 py-4 font-mono text-sm text-dark-300">SESSION{String(session.id).padStart(5, '0')}</td>
                      <td className="px-6 py-4 text-dark-300">{session.user1?.username || 'Unknown'}</td>
                      <td className="px-6 py-4 text-dark-300">{session.user2?.username || 'Unknown'}</td>
                      <td className="px-6 py-4 text-dark-300">{session.duration} sec</td>
                      <td className="px-6 py-4 text-sm text-dark-400">{new Date(session.createdAt).toLocaleString()}</td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleDisconnect(session.id)}
                          className="p-2 text-red-400 hover:bg-red-900/20 rounded transition-colors"
                          title="Disconnect"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="px-6 py-8 text-center">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <AlertCircle className="text-dark-400" size={32} />
                        <p className="text-dark-400">No active sessions</p>
                        <p className="text-sm text-dark-500">Live sessions will appear here when users are connected</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
