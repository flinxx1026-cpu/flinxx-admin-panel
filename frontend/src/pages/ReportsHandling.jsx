import { useState } from 'react'
import { AlertCircle, Search } from 'lucide-react'
import api from '../services/api'

export default function ReportsHandling() {
  const [reports, setReports] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [selectedReport, setSelectedReport] = useState(null)

  const handleAction = async (reportId, action) => {
    try {
      await api.post(`/admin/reports/${reportId}/${action}`)
      // Refresh reports
    } catch (error) {
      console.error('Action failed:', error)
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-dark-100">Reports Handling</h1>

      <div className="bg-dark-800 border border-dark-700 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <Search size={20} className="text-dark-400" />
          <input
            type="text"
            placeholder="Search reports..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-dark-700 border border-dark-600 rounded-lg px-4 py-2 text-dark-100 placeholder-dark-400 focus:outline-none focus:border-purple-500"
          />
        </div>
      </div>

      <div className="bg-dark-800 border border-dark-700 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-dark-700 border-b border-dark-600">
                <th className="px-6 py-4 text-left text-sm font-semibold text-dark-200">Report ID</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-dark-200">Reported User</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-dark-200">Reason</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-dark-200">Status</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-dark-200">Date</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-dark-200">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-dark-700 hover:bg-dark-700/30 transition-colors">
                <td className="px-6 py-4 text-dark-300 font-mono text-sm">REP001</td>
                <td className="px-6 py-4 text-dark-300">user123</td>
                <td className="px-6 py-4">
                  <span className="px-2 py-1 bg-red-900/30 text-red-300 text-xs rounded">Inappropriate Content</span>
                </td>
                <td className="px-6 py-4">
                  <span className="px-2 py-1 bg-yellow-900/30 text-yellow-300 text-xs rounded">Pending</span>
                </td>
                <td className="px-6 py-4 text-sm text-dark-400">2 hours ago</td>
                <td className="px-6 py-4 flex gap-2">
                  <button className="px-3 py-1 bg-blue-900/30 text-blue-300 text-xs rounded hover:bg-blue-900/50 transition-colors">
                    View Evidence
                  </button>
                  <button className="px-3 py-1 bg-green-900/30 text-green-300 text-xs rounded hover:bg-green-900/50 transition-colors">
                    Ban
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
