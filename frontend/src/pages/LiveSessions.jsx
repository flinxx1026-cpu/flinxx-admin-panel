import { Video, Trash2 } from 'lucide-react'

export default function LiveSessions() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-dark-100">Live Sessions</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-3 bg-dark-800 border border-dark-700 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-dark-100 mb-4 flex items-center gap-2">
            <Video size={20} />
            Active Video Chats
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-dark-700 border-b border-dark-600">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-dark-200">Session ID</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-dark-200">User 1</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-dark-200">User 2</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-dark-200">Duration</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-dark-200">Started</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-dark-200">Actions</th>
                </tr>
              </thead>
              <tbody>
                {[1, 2, 3].map((i) => (
                  <tr key={i} className="border-b border-dark-700 hover:bg-dark-700/30 transition-colors">
                    <td className="px-6 py-4 font-mono text-sm text-dark-300">SESSION{String(i).padStart(5, '0')}</td>
                    <td className="px-6 py-4 text-dark-300">user_{i}a</td>
                    <td className="px-6 py-4 text-dark-300">user_{i}b</td>
                    <td className="px-6 py-4 text-dark-300">{i * 5} min {i * 2} sec</td>
                    <td className="px-6 py-4 text-sm text-dark-400">{i * 2} minutes ago</td>
                    <td className="px-6 py-4">
                      <button className="p-2 text-red-400 hover:bg-red-900/20 rounded transition-colors" title="Disconnect">
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
