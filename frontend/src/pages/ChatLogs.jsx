export default function ChatLogs() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-dark-100">Chat Logs</h1>

      <div className="bg-dark-800 border border-dark-700 rounded-lg p-6">
        <div className="flex gap-3 mb-6">
          <input type="text" placeholder="Search messages..." className="flex-1 bg-dark-700 border border-dark-600 rounded-lg px-4 py-2 text-dark-100" />
          <input type="date" className="bg-dark-700 border border-dark-600 rounded-lg px-4 py-2 text-dark-100" />
        </div>

        <div className="space-y-4 max-h-96 overflow-y-auto">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="bg-dark-700 rounded-lg p-4 hover:bg-dark-700/70 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-dark-100">user_{i} → user_{i + 1}</span>
                <span className="text-xs text-dark-400">2 hours ago</span>
              </div>
              <p className="text-dark-300 text-sm mb-2">Hey, how are you doing today? Let's chat about...</p>
              <div className="flex gap-2">
                <button className="px-3 py-1 bg-blue-900/30 text-blue-300 text-xs rounded hover:bg-blue-900/50">View Full</button>
                <button className="px-3 py-1 bg-red-900/30 text-red-300 text-xs rounded hover:bg-red-900/50">Delete</button>
                <button className="px-3 py-1 bg-yellow-900/30 text-yellow-300 text-xs rounded hover:bg-yellow-900/50">Ban Chat</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
