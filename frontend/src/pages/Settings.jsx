export default function Settings() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-dark-100">Settings</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-dark-800 border border-dark-700 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-dark-100 mb-4">General Settings</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-dark-200 mb-2">Website Name</label>
              <input type="text" defaultValue="Flinxx" className="w-full bg-dark-700 border border-dark-600 rounded-lg px-4 py-2 text-dark-100" />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-200 mb-2">Support Email</label>
              <input type="email" defaultValue="support@flinxx.com" className="w-full bg-dark-700 border border-dark-600 rounded-lg px-4 py-2 text-dark-100" />
            </div>
            <label className="flex items-center gap-3">
              <input type="checkbox" className="w-4 h-4" />
              <span className="text-dark-300">Maintenance Mode</span>
            </label>
          </div>
        </div>

        <div className="bg-dark-800 border border-dark-700 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-dark-100 mb-4">Session Settings</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-dark-200 mb-2">Match Duration (minutes)</label>
              <input type="number" defaultValue="10" className="w-full bg-dark-700 border border-dark-600 rounded-lg px-4 py-2 text-dark-100" />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-200 mb-2">Max Reports Per User</label>
              <input type="number" defaultValue="5" className="w-full bg-dark-700 border border-dark-600 rounded-lg px-4 py-2 text-dark-100" />
            </div>
          </div>
        </div>

        <div className="bg-dark-800 border border-dark-700 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-dark-100 mb-4">Video Settings</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-dark-200 mb-2">Default Quality</label>
              <select className="w-full bg-dark-700 border border-dark-600 rounded-lg px-4 py-2 text-dark-100">
                <option>HD 720p</option>
                <option>SD 480p</option>
                <option>Low 360p</option>
              </select>
            </div>
          </div>
        </div>

        <div className="bg-dark-800 border border-dark-700 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-dark-100 mb-4">API Keys</h2>
          <div className="space-y-3">
            <div className="text-sm">
              <p className="text-dark-400 mb-1">Razorpay Key</p>
              <input type="password" defaultValue="••••••••••••••••" className="w-full bg-dark-700 border border-dark-600 rounded-lg px-4 py-2 text-dark-100 text-xs" />
            </div>
            <div className="text-sm">
              <p className="text-dark-400 mb-1">TURN Server Key</p>
              <input type="password" defaultValue="••••••••••••••••" className="w-full bg-dark-700 border border-dark-600 rounded-lg px-4 py-2 text-dark-100 text-xs" />
            </div>
          </div>
        </div>
      </div>

      <button className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors">
        Save Settings
      </button>
    </div>
  )
}
