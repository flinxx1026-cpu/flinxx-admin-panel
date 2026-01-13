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

function App() {
  useEffect(() => {
    // Check if user is banned on app load
    const token = localStorage.getItem('adminToken')
    if (token) {
      console.log('🔍 Checking ban status on app load...')
      checkBanStatus()
    }
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
