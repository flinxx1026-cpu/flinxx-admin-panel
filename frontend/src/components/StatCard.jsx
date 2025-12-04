import { TrendingUp, TrendingDown } from 'lucide-react'

export default function StatCard({ icon: Icon, title, value, change, trend, color }) {
  return (
    <div className={`${color} border border-dark-700 rounded-lg p-6 backdrop-blur-sm hover:border-dark-600 transition-all`}>
      <div className="flex items-center justify-between mb-4">
        <Icon size={24} className="text-purple-400" />
        {trend === 'up' ? (
          <TrendingUp size={20} className="text-green-400" />
        ) : (
          <TrendingDown size={20} className="text-red-400" />
        )}
      </div>
      <h3 className="text-dark-400 text-sm font-medium mb-1">{title}</h3>
      <div className="flex items-end justify-between">
        <p className="text-2xl font-bold text-dark-100">{value}</p>
        <span className={`text-xs font-medium ${trend === 'up' ? 'text-green-400' : 'text-red-400'}`}>
          {change}
        </span>
      </div>
    </div>
  )
}
