import { Sliders } from 'lucide-react'

export default function MatchmakingControls() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-dark-100">Matchmaking Controls</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-dark-800 border border-dark-700 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-dark-100 mb-4">Geographic Matching</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-dark-200 mb-2">Country Priority</label>
              <select className="w-full bg-dark-700 border border-dark-600 rounded-lg px-4 py-2 text-dark-100 focus:outline-none focus:border-purple-500">
                <option>Same Country</option>
                <option>Regional</option>
                <option>Global</option>
              </select>
            </div>
          </div>
        </div>

        <div className="bg-dark-800 border border-dark-700 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-dark-100 mb-4">Age Filtering</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-dark-200 mb-2">Age Range</label>
              <div className="flex gap-2">
                <input type="number" min="18" max="100" defaultValue="18" className="flex-1 bg-dark-700 border border-dark-600 rounded-lg px-4 py-2 text-dark-100" />
                <span className="text-dark-400">to</span>
                <input type="number" min="18" max="100" defaultValue="65" className="flex-1 bg-dark-700 border border-dark-600 rounded-lg px-4 py-2 text-dark-100" />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-dark-800 border border-dark-700 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-dark-100 mb-4">Gender Preference</h2>
          <div className="space-y-3">
            <label className="flex items-center gap-3">
              <input type="checkbox" defaultChecked className="w-4 h-4" />
              <span className="text-dark-300">Allow Gender Filter</span>
            </label>
            <label className="flex items-center gap-3">
              <input type="checkbox" defaultChecked className="w-4 h-4" />
              <span className="text-dark-300">Enforce Gender Selection</span>
            </label>
          </div>
        </div>

        <div className="bg-dark-800 border border-dark-700 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-dark-100 mb-4">Queue Settings</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-dark-200 mb-2">Queue Wait Time (seconds)</label>
              <input type="number" defaultValue="30" className="w-full bg-dark-700 border border-dark-600 rounded-lg px-4 py-2 text-dark-100" />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-200 mb-2">Session Duration (minutes)</label>
              <input type="number" defaultValue="10" className="w-full bg-dark-700 border border-dark-600 rounded-lg px-4 py-2 text-dark-100" />
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
