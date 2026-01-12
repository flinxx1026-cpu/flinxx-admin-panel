import { useState, useEffect } from 'react'
import { Users, Video, UserPlus, TrendingUp, AlertCircle, ArrowUp, ArrowDown } from 'lucide-react'
import StatCard from '../components/StatCard'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import api from '../services/api'

export default function Dashboard() {
  const [stats, setStats] = useState({
    activeUsers: 0,
    ongoingSessions: 0,
    newSignups: 0,
    revenue: 0,
    reportsLastDay: 0
  })
  const [chartData, setChartData] = useState([])
  const [revenueData, setRevenueData] = useState([])
  const [userDistribution, setUserDistribution] = useState([])
  const [recentActivity, setRecentActivity] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const response = await api.get('/admin/dashboard')
      setStats(response.data.stats)
      setChartData(response.data.userActivity)
      setRevenueData(response.data.revenueData)
      setUserDistribution(response.data.userDistribution)
      setRecentActivity(response.data.recentActivity)
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const COLORS = ['#9333ea', '#7c3aed', '#6d28d9', '#5b21b6']

  const getTimeAgo = (timestamp) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'just now'
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
  }

  if (loading) {
    return <div className="text-center py-8">Loading dashboard...</div>
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-dark-100">Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          icon={Users}
          title="Active Users"
          value={stats.activeUsers}
          change="+12%"
          trend="up"
          color="bg-blue-900/30"
        />
        <StatCard
          icon={Video}
          title="Live Sessions"
          value={stats.ongoingSessions}
          change="+8%"
          trend="up"
          color="bg-green-900/30"
        />
        <StatCard
          icon={UserPlus}
          title="New Signups"
          value={stats.newSignups}
          change="+23%"
          trend="up"
          color="bg-purple-900/30"
        />
        <StatCard
          icon={TrendingUp}
          title="Revenue"
          value={`$${stats.revenue.toFixed(2)}`}
          change="+15%"
          trend="up"
          color="bg-yellow-900/30"
        />
        <StatCard
          icon={AlertCircle}
          title="Reports (24h)"
          value={stats.reportsLastDay}
          change="+3%"
          trend="up"
          color="bg-red-900/30"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Activity Chart */}
        <div className="bg-dark-800 border border-dark-700 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-dark-100 mb-4">User Activity</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}
                labelStyle={{ color: '#e2e8f0' }}
              />
              <Line
                type="monotone"
                dataKey="users"
                stroke="#9333ea"
                strokeWidth={2}
                dot={{ fill: '#9333ea', r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Revenue Chart */}
        <div className="bg-dark-800 border border-dark-700 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-dark-100 mb-4">Revenue</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}
                labelStyle={{ color: '#e2e8f0' }}
              />
              <Bar dataKey="revenue" fill="#9333ea" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-dark-800 border border-dark-700 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-dark-100 mb-4">Recent Activity</h2>
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {recentActivity.length > 0 ? (
              recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center justify-between p-3 bg-dark-700/30 rounded-lg hover:bg-dark-700/50 transition-colors">
                  <div>
                    <p className="text-sm font-medium text-dark-200">{activity.description}</p>
                    <p className="text-xs text-dark-400">{getTimeAgo(activity.timestamp)}</p>
                  </div>
                  <span className={`px-3 py-1 text-xs rounded-full ${
                    activity.type === 'Session' ? 'bg-blue-900/30 text-blue-300' :
                    activity.type === 'Report' ? 'bg-red-900/30 text-red-300' :
                    'bg-green-900/30 text-green-300'
                  }`}>
                    {activity.type}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-dark-400">No recent activity</div>
            )}
          </div>
        </div>

        <div className="bg-dark-800 border border-dark-700 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-dark-100 mb-4">User Distribution</h2>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={userDistribution}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                dataKey="value"
              >
                {COLORS.map((color, index) => (
                  <Cell key={`cell-${index}`} fill={color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}
                labelStyle={{ color: '#e2e8f0' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
