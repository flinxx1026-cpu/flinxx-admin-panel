import { useState, useEffect, useRef, useCallback } from 'react'
import { Video, Eye, AlertCircle, RefreshCw, Ban, X, Wifi, WifiOff, Clock, Users, Zap } from 'lucide-react'
import api from '../services/api'
import SessionMonitoring from '../components/SessionMonitoring'
import io from 'socket.io-client'

export default function LiveSessions() {
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedSession, setSelectedSession] = useState(null)
  const [showMonitoringModal, setShowMonitoringModal] = useState(false)
  const [socket, setSocket] = useState(null)
  const [isConnected, setIsConnected] = useState(false)
  const [lastRefresh, setLastRefresh] = useState(null)
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true)
  const [banModal, setBanModal] = useState(null)
  const [selectedUserToBan, setSelectedUserToBan] = useState(null)
  const [banReason, setBanReason] = useState('Violation')
  const [banning, setBanning] = useState(false)
  const [tick, setTick] = useState(0) // For live duration updates
  const autoRefreshTimerRef = useRef(null)

  // ===== FETCH SESSIONS =====
  const fetchSessions = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true)
      const response = await api.get('/admin/sessions', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('adminToken')}`
        }
      })
      const newSessions = response.data.sessions || []
      setSessions(newSessions)
      setLastRefresh(new Date())
      if (!silent) setLoading(false)
    } catch (error) {
      console.error('Failed to fetch sessions:', error)
      if (!silent) setLoading(false)
    }
  }, [])

  // ===== SOCKET.IO CONNECTION =====
  useEffect(() => {
    fetchSessions()

    // ===== 1. Admin backend socket (port 3001) — admin-specific events =====
    const socketInstance = io(import.meta.env.VITE_API_URL || 'http://localhost:3001', {
      auth: {
        token: localStorage.getItem('adminToken')
      },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: Infinity
    })

    socketInstance.on('connect', () => {
      console.log('✅ Connected to admin backend')
      setIsConnected(true)
    })

    socketInstance.on('sessions:count_update', (data) => {
      if (data.count !== sessions.length) {
        fetchSessions(true)
      }
    })

    socketInstance.on('disconnect', () => {
      console.log('❌ Disconnected from admin backend')
      setIsConnected(false)
    })

    socketInstance.on('error', (error) => {
      console.error('Admin socket error:', error)
    })

    setSocket(socketInstance)

    // ===== 2. Main flinxx backend socket (port 5000) — REAL-TIME session events =====
    // session:removed / session:live events are emitted by the flinxx backend, NOT admin backend
    const mainBackendUrl = import.meta.env.VITE_MAIN_BACKEND_URL || 'https://api.flinxx.in'
    const mainSocket = io(mainBackendUrl, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10,
      transports: ['websocket', 'polling']
    })

    mainSocket.on('connect', () => {
      console.log('✅ Connected to flinxx backend for real-time session events')
    })

    // Real-time: new session started
    mainSocket.on('session:live', (data) => {
      console.log('🎬 [REALTIME] New session started:', data)
      fetchSessions(true)
    })

    // Real-time: session ended (skip, disconnect, rematch)
    mainSocket.on('session:removed', (data) => {
      console.log('🛑 [REALTIME] Session removed:', data)
      if (data.sessionId === 'all') {
        // Server restarted — clear all sessions
        setSessions([])
        return
      }
      setSessions(prev => prev.filter(s => s.id !== data.sessionId))
      if (selectedSession?.id === data.sessionId) {
        setSelectedSession(null)
        setShowMonitoringModal(false)
      }
      // Also do a silent refresh to sync counts
      fetchSessions(true)
    })

    mainSocket.on('session:ended', (data) => {
      console.log('⚠️ [REALTIME] Session ended:', data)
      setSessions(prev => prev.filter(s => s.id !== data.sessionId))
    })

    mainSocket.on('disconnect', () => {
      console.log('❌ Disconnected from flinxx backend')
    })

    return () => {
      socketInstance.disconnect()
      mainSocket.disconnect()
    }
  }, [])

  // ===== AUTO-REFRESH TIMER (every 10 seconds) =====
  useEffect(() => {
    if (autoRefreshEnabled) {
      autoRefreshTimerRef.current = setInterval(() => {
        fetchSessions(true) // Silent refresh
      }, 5000)
    }

    return () => {
      if (autoRefreshTimerRef.current) {
        clearInterval(autoRefreshTimerRef.current)
      }
    }
  }, [autoRefreshEnabled, fetchSessions])

  // ===== LIVE DURATION TICKER (every 1 second) =====
  useEffect(() => {
    const ticker = setInterval(() => {
      setTick(t => t + 1)
    }, 1000)
    return () => clearInterval(ticker)
  }, [])

  // ===== HANDLERS =====
  const handleViewSession = (session) => {
    console.log('👁️ Viewing session:', session.id)
    setSelectedSession(session)
    setShowMonitoringModal(true)
  }

  const handleDisconnect = async (sessionId) => {
    if (window.confirm('Are you sure you want to end this session?')) {
      try {
        await api.post(`/admin/sessions/${sessionId}/end`, {}, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('adminToken')}`
          }
        })
        console.log('✅ Session ended successfully')
        setSessions(prev => prev.filter(s => s.id !== sessionId))
      } catch (error) {
        console.error('Failed to disconnect session:', error)
        alert('Failed to end session: ' + error.message)
      }
    }
  }

  const handleCloseMonitoring = () => {
    setShowMonitoringModal(false)
    setSelectedSession(null)
  }

  // ===== LIVE DURATION CALCULATION =====
  const getLiveDuration = (startedAtISO) => {
    try {
      const started = new Date(startedAtISO)
      const now = new Date()
      const seconds = Math.floor((now - started) / 1000)
      return seconds
    } catch {
      return 0
    }
  }

  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  const formatStartTime = (isoTime) => {
    try {
      const date = new Date(isoTime)
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      })
    } catch {
      return 'N/A'
    }
  }

  const getLastEightDigits = (id) => {
    const idStr = String(id)
    return idStr.slice(-8)
  }

  // ===== BAN HANDLERS =====
  const handleBanClick = (session) => {
    setBanModal(session)
    setSelectedUserToBan('user1')
    setBanReason('Violation')
  }

  const closeBanModal = () => {
    setBanModal(null)
    setSelectedUserToBan(null)
    setBanReason('Violation')
    setBanning(false)
  }

  const banUser = async () => {
    if (!banModal || !selectedUserToBan) return

    const selectedUser = selectedUserToBan === 'user1' ? banModal.user1 : banModal.user2
    setBanning(true)

    try {
      const response = await api.post(`/admin/users/${selectedUser.id}/ban`,
        { reason: banReason },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('adminToken')}`
          }
        }
      )

      console.log('✅ User banned successfully:', response.data)
      closeBanModal()
      await fetchSessions(true)
    } catch (err) {
      console.error('❌ Error banning user:', err)
      alert('Failed to ban user: ' + (err.response?.data?.message || err.message))
    } finally {
      setBanning(false)
    }
  }

  // ===== TIME AGO =====
  const timeAgo = (date) => {
    if (!date) return ''
    const seconds = Math.floor((new Date() - date) / 1000)
    if (seconds < 5) return 'just now'
    if (seconds < 60) return `${seconds}s ago`
    const minutes = Math.floor(seconds / 60)
    return `${minutes}m ago`
  }

  // ===== RENDER =====
  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="flex items-center justify-center gap-2">
          <RefreshCw className="animate-spin" size={24} />
          <p>Loading sessions...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold text-dark-100">Live Sessions</h1>
          {/* Connection Status Indicator */}
          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
            isConnected
              ? 'bg-green-900/30 text-green-400 border border-green-700/30'
              : 'bg-red-900/30 text-red-400 border border-red-700/30'
          }`}>
            {isConnected ? <Wifi size={12} /> : <WifiOff size={12} />}
            {isConnected ? 'Live' : 'Disconnected'}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Auto-refresh toggle */}
          <button
            onClick={() => setAutoRefreshEnabled(!autoRefreshEnabled)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
              autoRefreshEnabled
                ? 'bg-green-900/20 text-green-400 border border-green-700/30 hover:bg-green-900/30'
                : 'bg-dark-700 text-dark-400 hover:bg-dark-600'
            }`}
            title={autoRefreshEnabled ? 'Auto-refresh ON (every 10s)' : 'Auto-refresh OFF'}
          >
            <Zap size={14} />
            Auto
          </button>
          {/* Manual refresh */}
          <button
            onClick={() => fetchSessions()}
            className="flex items-center gap-2 px-4 py-2 bg-dark-700 hover:bg-dark-600 rounded-lg text-dark-100 transition-colors"
            title="Refresh sessions"
          >
            <RefreshCw size={18} />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-dark-800 border border-dark-700 rounded-lg p-4 flex items-center gap-3">
          <div className="p-2 bg-blue-900/30 rounded-lg">
            <Video size={20} className="text-blue-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-dark-100">{sessions.length}</p>
            <p className="text-xs text-dark-400">Active Sessions</p>
          </div>
        </div>
        <div className="bg-dark-800 border border-dark-700 rounded-lg p-4 flex items-center gap-3">
          <div className="p-2 bg-purple-900/30 rounded-lg">
            <Users size={20} className="text-purple-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-dark-100">{sessions.length * 2}</p>
            <p className="text-xs text-dark-400">Users in Calls</p>
          </div>
        </div>
        <div className="bg-dark-800 border border-dark-700 rounded-lg p-4 flex items-center gap-3">
          <div className="p-2 bg-green-900/30 rounded-lg">
            <Clock size={20} className="text-green-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-dark-200">Last Updated</p>
            <p className="text-xs text-dark-400">{lastRefresh ? timeAgo(lastRefresh) : 'Never'}</p>
          </div>
        </div>
      </div>

      {/* Sessions Table */}
      <div className="bg-dark-800 border border-dark-700 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-dark-100 mb-4 flex items-center gap-2">
          <Video size={20} />
          Active Video Chats
          {sessions.length > 0 && (
            <span className="ml-2 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
              <span className="text-xs font-normal text-red-400">LIVE</span>
            </span>
          )}
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-dark-700 border-b border-dark-600">
                <th className="px-6 py-4 text-left text-sm font-semibold text-dark-200">#</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-dark-200">User 1</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-dark-200">User 2</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-dark-200">Duration</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-dark-200">Started</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-dark-200">Status</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-dark-200">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sessions.length > 0 ? (
                sessions.map((session, index) => {
                  const liveDuration = getLiveDuration(session.startedAtISO)
                  return (
                    <tr key={session.id} className="border-b border-dark-700 hover:bg-dark-700/30 transition-colors">
                      <td className="px-6 py-4 font-mono text-sm font-semibold text-dark-300">#{index + 1}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse flex-shrink-0"></div>
                          <div>
                            <div className="text-dark-200 font-medium">{session.user1.username}</div>
                            <small className="text-dark-500">ID: {getLastEightDigits(session.user1.id)}</small>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse flex-shrink-0"></div>
                          <div>
                            <div className="text-dark-200 font-medium">{session.user2.username}</div>
                            <small className="text-dark-500">ID: {getLastEightDigits(session.user2.id)}</small>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-dark-200 font-mono text-lg font-bold">
                          {formatDuration(liveDuration)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-dark-400">{formatStartTime(session.startedAtISO)}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-900/30 text-green-400 border border-green-700/30">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                          Live
                        </span>
                      </td>
                      <td className="px-6 py-4 flex gap-2">
                        <button
                          onClick={() => handleViewSession(session)}
                          className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-900/30 text-blue-300 hover:bg-blue-900/50 rounded-lg transition-colors border border-blue-700/20"
                          title="Monitor this session (hidden spectator mode)"
                        >
                          <Eye size={16} />
                          View
                        </button>
                        <button
                          onClick={() => handleBanClick(session)}
                          className="flex items-center gap-1 px-3 py-1.5 text-sm bg-red-900/30 text-red-300 hover:bg-red-900/50 rounded-lg transition-colors border border-red-700/20"
                          title="Ban a user from this session"
                        >
                          <Ban size={16} />
                          Ban
                        </button>
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="p-4 bg-dark-700/50 rounded-full">
                        <Video className="text-dark-500" size={40} />
                      </div>
                      <p className="text-dark-400 font-medium">No active sessions</p>
                      <p className="text-sm text-dark-500 max-w-sm">
                        Live video chat sessions will appear here automatically when users connect.
                        {autoRefreshEnabled && ' Auto-refreshing every 10 seconds.'}
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>



      {/* Session Monitoring Modal */}
      {showMonitoringModal && selectedSession && (
        <SessionMonitoring
          session={selectedSession}
          onClose={handleCloseMonitoring}
        />
      )}

      {/* Ban User Modal */}
      {banModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={closeBanModal}>
          <div className="bg-dark-800 border border-dark-700 rounded-lg p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="text-red-400" size={24} />
                <h3 className="text-lg font-semibold text-dark-100">Ban User</h3>
              </div>
              <button
                onClick={closeBanModal}
                className="p-1 hover:bg-dark-700 rounded transition-colors"
              >
                <X size={20} className="text-dark-400" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="space-y-4">
              <p className="text-dark-300">Select user to ban from this session:</p>

              {/* User Selection */}
              <div className="space-y-2">
                <label className="flex items-center p-3 border border-dark-600 rounded hover:bg-dark-700/30 cursor-pointer transition-colors">
                  <input
                    type="radio"
                    name="userToBan"
                    value="user1"
                    checked={selectedUserToBan === 'user1'}
                    onChange={() => setSelectedUserToBan('user1')}
                    className="mr-3"
                  />
                  <div className="flex-1">
                    <div className="text-dark-200 font-medium">{banModal.user1.username}</div>
                    <small className="text-dark-500">ID: {getLastEightDigits(banModal.user1.id)}</small>
                  </div>
                </label>

                <label className="flex items-center p-3 border border-dark-600 rounded hover:bg-dark-700/30 cursor-pointer transition-colors">
                  <input
                    type="radio"
                    name="userToBan"
                    value="user2"
                    checked={selectedUserToBan === 'user2'}
                    onChange={() => setSelectedUserToBan('user2')}
                    className="mr-3"
                  />
                  <div className="flex-1">
                    <div className="text-dark-200 font-medium">{banModal.user2.username}</div>
                    <small className="text-dark-500">ID: {getLastEightDigits(banModal.user2.id)}</small>
                  </div>
                </label>
              </div>

              {/* Reason Input */}
              <div>
                <label className="block text-sm text-dark-300 mb-2">Reason (optional)</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded text-dark-200 placeholder-dark-500 focus:outline-none focus:border-blue-500"
                  placeholder="e.g., Violation, Inappropriate behavior"
                  value={banReason}
                  onChange={(e) => setBanReason(e.target.value)}
                  disabled={banning}
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={closeBanModal}
                disabled={banning}
                className="flex-1 px-4 py-2 bg-dark-700 hover:bg-dark-600 text-dark-200 rounded transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={banUser}
                disabled={banning}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Ban size={16} />
                {banning ? 'Banning...' : 'Ban User'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
