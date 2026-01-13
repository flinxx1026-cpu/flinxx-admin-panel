import { useState, useEffect } from 'react'
import { AlertCircle, Search } from 'lucide-react'
import api from '../services/api'
import Modal from '../components/Modal'

export default function ReportsHandling() {
  const [reports, setReports] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [selectedReport, setSelectedReport] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [modalAction, setModalAction] = useState('')

  useEffect(() => {
    fetchReports()
  }, [search])

  const fetchReports = async () => {
    try {
      const response = await api.get(`/api/admin/reports?search=${search}`)
      setReports(response.data.reports || [])
    } catch (error) {
      console.error('Failed to fetch reports:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAction = (report, action) => {
    setSelectedReport(report)
    setModalAction(action)
    setShowModal(true)
  }

  const executeAction = async () => {
    try {
      await api.post(`/api/admin/reports/${selectedReport.id}/${modalAction}`)
      setShowModal(false)
      fetchReports()
    } catch (error) {
      console.error('Action failed:', error)
    }
  }

  if (loading) {
    return <div className="text-center py-8">Loading reports...</div>
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
              {reports.length > 0 ? (
                reports.map((report) => (
                  <tr key={report.id} className="border-b border-dark-700 hover:bg-dark-700/30 transition-colors">
                    <td className="px-6 py-4 text-dark-300 font-mono text-sm">REP{String(report.id).padStart(5, '0')}</td>
                    <td className="px-6 py-4 text-dark-300">{report.reportedUser?.username || 'Unknown'}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-red-900/30 text-red-300 text-xs rounded">{report.reason}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs rounded ${
                        report.status === 'resolved' ? 'bg-green-900/30 text-green-300' :
                        report.status === 'reviewed' ? 'bg-blue-900/30 text-blue-300' :
                        'bg-yellow-900/30 text-yellow-300'
                      }`}>
                        {report.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-dark-400">{new Date(report.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4 flex gap-2">
                      <button
                        onClick={() => handleAction(report, 'review')}
                        className="px-3 py-1 bg-blue-900/30 text-blue-300 text-xs rounded hover:bg-blue-900/50 transition-colors"
                      >
                        Review
                      </button>
                      <button
                        onClick={() => handleAction(report, 'ban')}
                        className="px-3 py-1 bg-red-900/30 text-red-300 text-xs rounded hover:bg-red-900/50 transition-colors"
                      >
                        Ban
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <AlertCircle className="text-dark-400" size={32} />
                      <p className="text-dark-400">No reports found</p>
                      <p className="text-sm text-dark-500">User reports will appear here when they are submitted</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={`Confirm ${modalAction.toUpperCase()}`}>
        <div className="space-y-4">
          <p className="text-dark-300">Are you sure you want to {modalAction} this report?</p>
          <p className="text-sm text-dark-400">
            Report: <span className="text-dark-200 font-medium">REP{String(selectedReport?.id).padStart(5, '0')}</span>
          </p>
          <div className="flex gap-3 justify-end">
            <button
              onClick={() => setShowModal(false)}
              className="px-4 py-2 bg-dark-700 hover:bg-dark-600 text-dark-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={executeAction}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
            >
              Confirm
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
