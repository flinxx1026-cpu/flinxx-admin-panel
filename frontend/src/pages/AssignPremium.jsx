import { useState, useEffect } from 'react'
import { Zap, Trash2, RefreshCw } from 'lucide-react'
import api from '../services/api'

export default function AssignPremium() {
  const [loading, setLoading] = useState(false)
  const [fetchingUsers, setFetchingUsers] = useState(false)
  const [userIdOrEmail, setUserIdOrEmail] = useState('')
  const [plan, setPlan] = useState('blue_tick')
  const [duration, setDuration] = useState('15')
  
  const [premiumUsers, setPremiumUsers] = useState([]);

  // Fetch all active premium users from database on page load
  const fetchPremiumUsers = async () => {
    try {
      setFetchingUsers(true);
      const response = await api.get('/admin/users/all-premium-users', {
        headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }
      });
      if (response.data.success) {
        setPremiumUsers(response.data.users || []);
        console.log(`✅ Fetched ${response.data.users?.length || 0} premium users`);
      }
    } catch (err) {
      console.error('❌ Error fetching premium users:', err);
    } finally {
      setFetchingUsers(false);
    }
  };

  useEffect(() => {
    fetchPremiumUsers();
  }, []);

  const handleStopPremium = async (email, plan, userId) => {
    const formattedPlanName = plan?.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    
    const isConfirmed = window.confirm(`Are you sure you want to stop ${formattedPlanName} for ${email}?`);
    if (!isConfirmed) return;

    try {
      const response = await api.post('/admin/users/remove-premium',
        { userIdOrEmail: email, plan },
        { headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }}
      );
      if (response.data.success) {
        alert('Premium stopped successfully');
        // Only remove THIS specific user+plan from the list (not clear all)
        setPremiumUsers(prev => prev.filter(u => !(u.id === userId && u.plan === plan)));
      }
    } catch (err) {
      console.error('❌ Error stopping premium:', err);
      alert('Failed to stop premium: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleAssignPremium = async () => {
    if (!userIdOrEmail) {
      return alert('Please enter User ID or Email');
    }

    try {
      const isConfirmed = window.confirm(`Are you sure you want to assign ${plan.replace('_', ' ')} for ${duration === 'lifetime' ? 'lifetime' : duration + ' days'} to ${userIdOrEmail}?`);
      if (!isConfirmed) return;

      setLoading(true);
      const response = await api.post('/admin/users/assign-premium',
        { userIdOrEmail, plan, duration },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('adminToken')}`
          }
        }
      );

      console.log('✅ Premium assigned:', response.data);
      alert('Premium assigned successfully to ' + response.data.user.email);
      setUserIdOrEmail('');
      
      const u = response.data.user;
      const planLabel = plan.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      
      // Add to existing list (not replace)
      // Remove any duplicate first, then add
      setPremiumUsers(prev => {
        const filtered = prev.filter(existing => !(existing.id === u.id && existing.plan === plan));
        return [...filtered, {
          id: u.id,
          email: u.email,
          plan: plan,
          planLabel: planLabel,
          expiry: u.premium_expiry,
          status: "Active"
        }];
      });
    } catch (err) {
      console.error('❌ Error assigning premium:', err);
      alert('Failed to assign premium: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-dark-100 flex items-center gap-3">
          <Zap size={28} className="text-purple-500" />
          Assign Premium
        </h1>
      </div>

      <div className="bg-dark-800 border border-dark-700 rounded-lg p-6">
        <p className="text-dark-400 mb-6 font-medium">
          Directly assign premium plans to users by their Email or UUID.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
          <div className="flex-1">
            <label className="block text-sm text-dark-300 mb-2">User ID / Email</label>
            <input
              type="text"
              value={userIdOrEmail}
              onChange={(e) => setUserIdOrEmail(e.target.value)}
              className="w-full px-4 py-2 bg-dark-700 border border-dark-600 rounded-lg text-dark-100 placeholder-dark-500 focus:outline-none focus:border-purple-500 transition-colors"
              placeholder="Enter User ID or Email"
            />
          </div>
          
          <div className="flex-1">
            <label className="block text-sm text-dark-300 mb-2">Plan</label>
            <select
              value={plan}
              onChange={(e) => setPlan(e.target.value)}
              className="w-full px-4 py-2 bg-dark-700 border border-dark-600 rounded-lg text-dark-100 focus:outline-none focus:border-purple-500 transition-colors appearance-none"
            >
              <option value="blue_tick">Blue Tick</option>
              <option value="match_boost">Match Boost</option>
              <option value="unlimited_skip">Unlimited Skip</option>
            </select>
          </div>
          
          <div className="flex-1">
            <label className="block text-sm text-dark-300 mb-2">Duration</label>
            <select
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="w-full px-4 py-2 bg-dark-700 border border-dark-600 rounded-lg text-dark-100 focus:outline-none focus:border-purple-500 transition-colors appearance-none"
            >
              <option value="15">15 Days</option>
              <option value="30">30 Days</option>
              <option value="lifetime">Lifetime</option>
            </select>
          </div>
          
          <div className="flex-1">
            <button
              onClick={handleAssignPremium}
              disabled={loading}
              className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Zap size={18} />
              {loading ? 'Assigning...' : 'Assign Premium'}
            </button>
          </div>
        </div>
      </div>

      <div className="bg-dark-800 border border-dark-700 rounded-lg p-6 mt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-dark-100 flex items-center gap-2">
            <Zap size={20} className="text-purple-500" />
            Active Premium Users
          </h2>
          <button
            onClick={fetchPremiumUsers}
            disabled={fetchingUsers}
            className="p-2 text-dark-400 hover:text-purple-400 hover:bg-dark-700 rounded-lg transition-colors"
            title="Refresh Premium Users"
          >
            <RefreshCw size={18} className={fetchingUsers ? 'animate-spin' : ''} />
          </button>
        </div>
        
        {fetchingUsers ? (
          <p className="text-dark-400">Loading premium users...</p>
        ) : premiumUsers.length === 0 ? (
          <p className="text-dark-400">No premium users found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-dark-600 text-dark-300 text-sm">
                  <th className="py-3 px-4 font-medium">User Email / ID</th>
                  <th className="py-3 px-4 font-medium">Plan</th>
                  <th className="py-3 px-4 font-medium">Expiry Date</th>
                  <th className="py-3 px-4 font-medium">Status</th>
                  <th className="py-3 px-4 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {premiumUsers.map((user, index) => (
                  <tr key={`${user.id}-${user.plan}-${index}`} className="border-b border-dark-700/50 hover:bg-dark-700/30 transition-colors">
                    <td className="py-3 px-4 text-dark-100">{user.email || user.id}</td>
                    <td className="py-3 px-4 text-purple-400 capitalize">{user.planLabel || user.plan}</td>
                    <td className="py-3 px-4 text-dark-300">
                      {user.expiry ? new Date(user.expiry).toLocaleDateString() : 'Lifetime'}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        user.status === 'Active' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
                      }`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => handleStopPremium(user.email || user.id, user.plan, user.id)}
                        className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded transition-colors"
                        title="Stop Premium"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
