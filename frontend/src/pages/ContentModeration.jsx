export default function ContentModeration() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-dark-100">Content Moderation</h1>

      <div className="bg-dark-800 border border-dark-700 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-dark-100 mb-4">Auto-Moderation Settings</h2>
        <div className="space-y-4">
          <label className="flex items-center gap-3">
            <input type="checkbox" defaultChecked className="w-4 h-4" />
            <span className="text-dark-300">Enable AI Nudity Detection</span>
          </label>
          <label className="flex items-center gap-3">
            <input type="checkbox" defaultChecked className="w-4 h-4" />
            <span className="text-dark-300">Auto-Ban on Nudity Detected</span>
          </label>
          <label className="flex items-center gap-3">
            <input type="checkbox" className="w-4 h-4" />
            <span className="text-dark-300">Enable Screenshot Capture</span>
          </label>
        </div>
      </div>

      <div className="bg-dark-800 border border-dark-700 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-dark-100 mb-4">Captured Content</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="bg-dark-700 rounded-lg overflow-hidden group cursor-pointer">
              <div className="aspect-square bg-gradient-to-br from-purple-600 to-dark-900 flex items-center justify-center">
                <span className="text-dark-400">Screenshot {i}</span>
              </div>
              <div className="p-2 bg-dark-600">
                <p className="text-xs text-dark-300 mb-1">Session: SEE{String(i).padStart(5, '0')}</p>
                <div className="flex gap-1">
                  <span className="px-2 py-1 bg-green-900/30 text-green-300 text-xs rounded">✓ Safe</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
