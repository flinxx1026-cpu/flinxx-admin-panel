import { Outlet, useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'
import { useEffect, useState } from 'react'

export default function Layout() {
  const navigate = useNavigate()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('adminToken')
    if (!token) {
      navigate('/login', { replace: true })
    } else {
      setIsAuthenticated(true)
    }
    setLoading(false)
  }, [navigate])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-dark-900">
        <div className="text-xl text-dark-200">Loading...</div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="flex h-screen bg-dark-900 text-dark-200">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto">
          <div className="p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
