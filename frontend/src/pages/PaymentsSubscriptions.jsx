export default function PaymentsSubscriptions() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-dark-100">Payments & Subscriptions</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-dark-800 border border-dark-700 rounded-lg p-6">
          <h3 className="text-dark-400 text-sm mb-2">Total Revenue</h3>
          <p className="text-3xl font-bold text-dark-100">$12,450</p>
          <p className="text-xs text-green-400 mt-2">+15% from last month</p>
        </div>
        <div className="bg-dark-800 border border-dark-700 rounded-lg p-6">
          <h3 className="text-dark-400 text-sm mb-2">Active Subscriptions</h3>
          <p className="text-3xl font-bold text-dark-100">2,340</p>
          <p className="text-xs text-green-400 mt-2">+8% from last week</p>
        </div>
        <div className="bg-dark-800 border border-dark-700 rounded-lg p-6">
          <h3 className="text-dark-400 text-sm mb-2">Pending Refunds</h3>
          <p className="text-3xl font-bold text-dark-100">5</p>
          <p className="text-xs text-yellow-400 mt-2">Worth $250</p>
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
            {[1, 2, 3, 4, 5].map((i) => (
              <tr key={i} className="border-b border-dark-700 hover:bg-dark-700/30">
                <td className="px-6 py-4 text-dark-300">user_{i}</td>
                <td className="px-6 py-4 text-dark-300">Premium</td>
                <td className="px-6 py-4 text-dark-300">$9.99</td>
                <td className="px-6 py-4"><span className="px-2 py-1 bg-green-900/30 text-green-300 text-xs rounded">Completed</span></td>
                <td className="px-6 py-4 text-sm text-dark-400">Dec 4, 2025</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
