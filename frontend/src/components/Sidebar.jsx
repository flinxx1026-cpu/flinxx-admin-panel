import { Link, useLocation } from 'react-router-dom'
import {
  BarChart3,
  Users,
  AlertCircle,
  Video,
  Settings,
  DollarSign,
  Image,
  MessageSquare,
  Lock,
  Shield,
  Sliders,
  LogOut
} from 'lucide-react'
import { useState } from 'react'

const menuItems = [
  { icon: BarChart3, label: 'Dashboard', path: '/', section: 'main' },
  { icon: Users, label: 'User Management', path: '/users', section: 'users' },
  { icon: AlertCircle, label: 'Reports', path: '/reports', section: 'moderation' },
  { icon: Video, label: 'Live Sessions', path: '/live-sessions', section: 'sessions' },
  { icon: Sliders, label: 'Matchmaking', path: '/matchmaking', section: 'matchmaking' },
  { icon: DollarSign, label: 'Payments', path: '/payments', section: 'finance' },
  { icon: Image, label: 'Content Mod', path: '/content-moderation', section: 'moderation' },
  { icon: MessageSquare, label: 'Chat Logs', path: '/chat-logs', section: 'content' },
  { icon: Shield, label: 'Admin Roles', path: '/admin-roles', section: 'admin' },
  { icon: Lock, label: 'Security', path: '/security-logs', section: 'security' },
  { icon: Settings, label: 'Settings', path: '/settings', section: 'settings' },
]

export default function Sidebar() {
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(false)

  const handleLogout = () => {
    localStorage.removeItem('adminToken')
    window.location.href = '/login'
  }

  return (
    <div className={`${collapsed ? 'w-20' : 'w-64'} bg-dark-800 border-r border-dark-700 transition-all duration-300 flex flex-col`}>
      <div className="p-6 border-b border-dark-700">
        <h1 className={`font-bold text-xl text-purple-400 ${collapsed ? 'text-center' : ''}`}>
          {collapsed ? 'FX' : 'Flinxx Admin'}
        </h1>
      </div>

      <nav className="flex-1 overflow-y-auto p-4 space-y-2">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path
          const Icon = item.icon
          return (
            <Link
              key={item.path}
              to={item.path}
              title={collapsed ? item.label : ''}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-purple-600 text-white'
                  : 'text-dark-300 hover:bg-dark-700 hover:text-dark-100'
              }`}
            >
              <Icon size={20} />
              {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-dark-700 p-4 space-y-2">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 text-dark-300 hover:bg-dark-700 rounded-lg transition-colors"
        >
          {collapsed ? '→' : '←'}
          {!collapsed && <span className="text-sm">Collapse</span>}
        </button>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-900/20 rounded-lg transition-colors"
        >
          <LogOut size={20} />
          {!collapsed && <span className="text-sm font-medium">Logout</span>}
        </button>
      </div>
    </div>
  )
}
