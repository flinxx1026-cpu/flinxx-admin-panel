import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import Layout from './layouts/Layout'
import Dashboard from './pages/Dashboard'
import UserManagement from './pages/UserManagement'
import ReportsHandling from './pages/ReportsHandling'
import LiveSessions from './pages/LiveSessions'
import MatchmakingControls from './pages/MatchmakingControls'
import PaymentsSubscriptions from './pages/PaymentsSubscriptions'
import ContentModeration from './pages/ContentModeration'
import ChatLogs from './pages/ChatLogs'
import Settings from './pages/Settings'
import AdminRoles from './pages/AdminRoles'
import SecurityLogs from './pages/SecurityLogs'
import Login from './pages/Login'
import { checkBanStatus } from './services/api'
import axios from 'axios'

function App() {
  useEffect(() => {
    // Check if user is banned on app load
    const token = localStorage.getItem('adminToken')
    if (token) {
      console.log('🔍 Checking ban status on app load...')
      checkBanStatus()
    }
  }, [])

  // Update last_seen by calling user profile endpoint
  useEffect(() => {
    const updateUserActivity = async () => {
      try {
        const userToken = localStorage.getItem('userToken')
        
        if (userToken) {
          console.log('📍 Updating user activity (last_seen)...')
          await axios.get(`${(import.meta.env.VITE_API_URL || 'http://localhost:3001')}/api/user/profile`, {
            headers: {
              Authorization: `Bearer ${userToken}`,
            },
          })
          console.log('✅ User activity updated')
        }
      } catch (error) {
        console.error('⚠️ Failed to update user activity:', error.message)
        // Silent fail - this is optional activity tracking
      }
    }

    // Call on app load
    updateUserActivity()

    // Set up periodic update every 5 minutes
    const interval = setInterval(updateUserActivity, 5 * 60 * 1000)

    return () => clearInterval(interval)
  }, [])

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/users" element={<UserManagement />} />
          <Route path="/reports" element={<ReportsHandling />} />
          <Route path="/live-sessions" element={<LiveSessions />} />
          <Route path="/matchmaking" element={<MatchmakingControls />} />
          <Route path="/payments" element={<PaymentsSubscriptions />} />
          <Route path="/content-moderation" element={<ContentModeration />} />
          <Route path="/chat-logs" element={<ChatLogs />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/admin-roles" element={<AdminRoles />} />
          <Route path="/security-logs" element={<SecurityLogs />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
