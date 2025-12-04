export default function AdminRoles() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-dark-100">Admin Roles & Permissions</h1>
        <button className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors">
          Add Admin
        </button>
      </div>

      <div className="space-y-4">
        {[
          { name: 'Super Admin', email: 'super@flinxx.com', role: 'Super Admin', permissions: 'All' },
          { name: 'Moderator', email: 'mod@flinxx.com', role: 'Moderator', permissions: 'Reports, Users, Chat' },
          { name: 'Finance', email: 'finance@flinxx.com', role: 'Finance Admin', permissions: 'Payments, Revenue' },
        ].map((admin, i) => (
          <div key={i} className="bg-dark-800 border border-dark-700 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-dark-100">{admin.name}</h3>
                <p className="text-sm text-dark-400">{admin.email}</p>
              </div>
              <span className="px-3 py-1 bg-purple-900/30 text-purple-300 text-sm rounded-full">{admin.role}</span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              {['View Reports', 'Manage Users', 'View Payments', 'System Settings'].map((perm, j) => (
                <label key={j} className="flex items-center gap-2">
                  <input type="checkbox" defaultChecked className="w-4 h-4" />
                  <span className="text-sm text-dark-300">{perm}</span>
                </label>
              ))}
            </div>

            <div className="flex gap-2">
              <button className="px-4 py-2 bg-blue-900/30 text-blue-300 hover:bg-blue-900/50 rounded-lg transition-colors text-sm">
                Edit
              </button>
              <button className="px-4 py-2 bg-red-900/30 text-red-300 hover:bg-red-900/50 rounded-lg transition-colors text-sm">
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
