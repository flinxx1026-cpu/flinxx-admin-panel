import { Bell, User, Settings } from 'lucide-react'
import { useState } from 'react'

export default function Header() {
  const [showProfile, setShowProfile] = useState(false)
  const adminInfo = JSON.parse(localStorage.getItem('adminInfo') || '{}')

  return (
    <header className="bg-dark-800 border-b border-dark-700 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
      <div>
        <h2 className="text-xl font-semibold text-dark-100">Admin Dashboard</h2>
        <p className="text-xs text-dark-400 mt-1">Welcome back, {adminInfo.name || 'Admin'}</p>
      </div>

      <div className="flex items-center gap-4">
        <button className="relative p-2 text-dark-300 hover:bg-dark-700 rounded-lg transition-colors">
          <Bell size={20} />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>

        <button className="p-2 text-dark-300 hover:bg-dark-700 rounded-lg transition-colors">
          <Settings size={20} />
        </button>

        <div className="relative">
          <button
            onClick={() => setShowProfile(!showProfile)}
            className="flex items-center gap-2 px-3 py-2 text-dark-300 hover:bg-dark-700 rounded-lg transition-colors"
          >
            <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
              <User size={16} className="text-white" />
            </div>
            <span className="text-sm font-medium">{adminInfo.name || 'Admin'}</span>
          </button>

          {showProfile && (
            <div className="absolute right-0 mt-2 w-48 bg-dark-700 border border-dark-600 rounded-lg shadow-lg py-2 z-20">
              <div className="px-4 py-2 border-b border-dark-600">
                <p className="text-sm font-medium text-dark-100">{adminInfo.name}</p>
                <p className="text-xs text-dark-400">{adminInfo.email}</p>
                <p className="text-xs text-purple-400 mt-1">{adminInfo.role}</p>
              </div>
              <button className="w-full text-left px-4 py-2 text-sm text-dark-300 hover:bg-dark-600 transition-colors">
                Profile Settings
              </button>
              <button className="w-full text-left px-4 py-2 text-sm text-dark-300 hover:bg-dark-600 transition-colors">
                Change Password
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
