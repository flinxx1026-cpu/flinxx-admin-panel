import { useState, useEffect } from 'react'
import { AlertCircle } from 'lucide-react'
import api from '../services/api'

export default function PaymentsSubscriptions() {
  const [stats, setStats] = useState({
    totalRevenue: 0,
    activeSubscriptions: 0,
    pendingRefunds: 0,
  })
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPaymentData()
  }, [])

  const fetchPaymentData = async () => {
    try {
      const response = await api.get('/admin/payments')
      setStats(response.data.stats || {})
      setTransactions(response.data.transactions || [])
    } catch (error) {
      console.error('Failed to fetch payment data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="text-center py-8">Loading payment data...</div>
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-dark-100">Payments & Subscriptions</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-dark-800 border border-dark-700 rounded-lg p-6">
          <h3 className="text-dark-400 text-sm mb-2">Total Revenue</h3>
          <p className="text-3xl font-bold text-dark-100">${stats.totalRevenue?.toFixed(2) || '0.00'}</p>
          <p className="text-xs text-green-400 mt-2">From all transactions</p>
        </div>
        <div className="bg-dark-800 border border-dark-700 rounded-lg p-6">
          <h3 className="text-dark-400 text-sm mb-2">Active Subscriptions</h3>
          <p className="text-3xl font-bold text-dark-100">{stats.activeSubscriptions || 0}</p>
          <p className="text-xs text-green-400 mt-2">Currently active</p>
        </div>
        <div className="bg-dark-800 border border-dark-700 rounded-lg p-6">
          <h3 className="text-dark-400 text-sm mb-2">Pending Refunds</h3>
          <p className="text-3xl font-bold text-dark-100">{stats.pendingRefunds || 0}</p>
          <p className="text-xs text-yellow-400 mt-2">Awaiting processing</p>
        </div>
      </div>

      <div className="bg-dark-800 border border-dark-700 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-dark-100 mb-4">Recent Transactions</h2>
        <table className="w-full">
          <thead>
            <tr className="bg-dark-700 border-b border-dark-600">
              <th className="px-6 py-4 text-left text-sm font-semibold text-dark-200">User</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-dark-200">Plan</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-dark-200">Amount</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-dark-200">Status</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-dark-200">Date</th>
            </tr>
          </thead>
          <tbody>
            {transactions.length > 0 ? (
              transactions.map((tx) => (
                <tr key={tx.id} className="border-b border-dark-700 hover:bg-dark-700/30">
                  <td className="px-6 py-4 text-dark-300">{tx.user?.username || 'Unknown'}</td>
                  <td className="px-6 py-4 text-dark-300">{tx.plan || 'Standard'}</td>
                  <td className="px-6 py-4 text-dark-300">${tx.amount?.toFixed(2)}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs rounded ${
                      tx.status === 'completed' ? 'bg-green-900/30 text-green-300' :
                      tx.status === 'pending' ? 'bg-yellow-900/30 text-yellow-300' :
                      'bg-red-900/30 text-red-300'
                    }`}>
                      {tx.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-dark-400">{new Date(tx.createdAt).toLocaleDateString()}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="px-6 py-8 text-center">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <AlertCircle className="text-dark-400" size={32} />
                    <p className="text-dark-400">No transactions found</p>
                    <p className="text-sm text-dark-500">Payment transactions will appear here when users make purchases</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
