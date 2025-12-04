import { Lock } from 'lucide-react'

export default function SecurityLogs() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-dark-100">Security Logs</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-dark-800 border border-dark-700 rounded-lg p-6">
          <h3 className="text-dark-400 text-sm mb-2">Failed Logins (24h)</h3>
          <p className="text-3xl font-bold text-dark-100">12</p>
          <p className="text-xs text-red-400 mt-2">3 IPs blocked</p>
        </div>
        <div className="bg-dark-800 border border-dark-700 rounded-lg p-6">
          <h3 className="text-dark-400 text-sm mb-2">Banned Devices</h3>
          <p className="text-3xl font-bold text-dark-100">45</p>
          <p className="text-xs text-yellow-400 mt-2">2 added today</p>
        </div>
        <div className="bg-dark-800 border border-dark-700 rounded-lg p-6">
          <h3 className="text-dark-400 text-sm mb-2">Suspicious Activities</h3>
          <p className="text-3xl font-bold text-dark-100">8</p>
          <p className="text-xs text-orange-400 mt-2">5 investigated</p>
        </div>
      </div>

      <div className="bg-dark-800 border border-dark-700 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-dark-100 mb-4 flex items-center gap-2">
          <Lock size={20} />
          Admin Activity Logs
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-dark-700 border-b border-dark-600">
                <th className="px-6 py-4 text-left text-sm font-semibold text-dark-200">Admin</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-dark-200">Action</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-dark-200">Details</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-dark-200">IP Address</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-dark-200">Time</th>
              </tr>
            </thead>
            <tbody>
              {[1, 2, 3, 4, 5].map((i) => (
                <tr key={i} className="border-b border-dark-700 hover:bg-dark-700/30">
                  <td className="px-6 py-4 text-dark-300">admin_{i}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs rounded ${
                      i % 2 === 0 ? 'bg-red-900/30 text-red-300' : 'bg-blue-900/30 text-blue-300'
                    }`}>
                      {i % 2 === 0 ? 'User Banned' : 'Report Closed'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-dark-400">user_{i} - Violation</td>
                  <td className="px-6 py-4 font-mono text-sm text-dark-400">192.168.1.{100 + i}</td>
                  <td className="px-6 py-4 text-sm text-dark-400">{i} hours ago</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
