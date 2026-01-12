import { useState, useEffect } from 'react'
import { Search, Ban, AlertCircle, Trash2, RotateCcw, Eye } from 'lucide-react'
import api from '../services/api'
import Modal from '../components/Modal'

export default function UserManagement() {
  const [users, setUsers] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [modalType, setModalType] = useState('')

  useEffect(() => {
    fetchUsers()
  }, [search])

  const fetchUsers = async () => {
    try {
      const response = await api.get(`/admin/users?search=${search}`)
      setUsers(response.data.users)
    } catch (error) {
      console.error('Failed to fetch users:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAction = (user, type) => {
    setSelectedUser(user)
    setModalType(type)
    setShowModal(true)
  }

  const performAction = async () => {
    try {
      if (modalType === 'ban') {
        await api.post(`/admin/users/${selectedUser.id}/ban`)
      } else if (modalType === 'warn') {
        await api.post(`/admin/users/${selectedUser.id}/warn`)
      } else if (modalType === 'unban') {
        await api.post(`/admin/users/${selectedUser.id}/unban`)
      } else if (modalType === 'reset-coins') {
        await api.post(`/admin/users/${selectedUser.id}/reset-coins`)
      }
      setShowModal(false)
      fetchUsers()
    } catch (error) {
      console.error('Action failed:', error)
    }
  }

  if (loading) return <div>Loading users...</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-dark-100">User Management</h1>
      </div>

      {/* Search Bar */}
      <div className="bg-dark-800 border border-dark-700 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <Search size={20} className="text-dark-400" />
          <input
            type="text"
            placeholder="Search by ID, email, or username..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-dark-700 border border-dark-600 rounded-lg px-4 py-2 text-dark-100 placeholder-dark-400 focus:outline-none focus:border-purple-500"
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-dark-800 border border-dark-700 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-dark-700 border-b border-dark-600">
                <th className="px-6 py-4 text-left text-sm font-semibold text-dark-200">User</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-dark-200">Email</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-dark-200">Status</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-dark-200">Join Date</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-dark-200">Coins</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-dark-200">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.length > 0 ? (
                users.map((user) => (
                  <tr key={user.id} className="border-b border-dark-700 hover:bg-dark-700/30 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-dark-100">{user.username}</p>
                        <p className="text-xs text-dark-400">ID: {user.id}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-dark-300">{user.email}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        user.banned ? 'bg-red-900/30 text-red-300' :
                        user.verified ? 'bg-green-900/30 text-green-300' :
                        'bg-yellow-900/30 text-yellow-300'
                      }`}>
                        {user.banned ? 'Banned' : user.verified ? 'Verified' : 'Unverified'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-dark-300">{new Date(user.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-dark-300">{user.coins}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleAction(user, 'view')}
                          className="p-2 hover:bg-dark-600 rounded transition-colors text-blue-400"
                          title="View Profile"
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          onClick={() => handleAction(user, 'warn')}
                          className="p-2 hover:bg-dark-600 rounded transition-colors text-yellow-400"
                          title="Send Warning"
                        >
                          <AlertCircle size={18} />
                        </button>
                        <button
                          onClick={() => handleAction(user, 'ban')}
                          className="p-2 hover:bg-dark-600 rounded transition-colors text-red-400"
                          title="Ban User"
                        >
                          <Ban size={18} />
                        </button>
                        <button
                          onClick={() => handleAction(user, 'reset-coins')}
                          className="p-2 hover:bg-dark-600 rounded transition-colors text-purple-400"
                          title="Reset Coins"
                        >
                          <RotateCcw size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <AlertCircle className="text-dark-400" size={32} />
                      <p className="text-dark-400">No users found</p>
                      {search && <p className="text-sm text-dark-500">Try adjusting your search filters</p>}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Action Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={`${modalType.toUpperCase()}`}>
        <div className="space-y-4">
          <p className="text-dark-300">Are you sure you want to {modalType} this user?</p>
          <p className="text-sm text-dark-400">
            User: <span className="text-dark-200 font-medium">{selectedUser?.username}</span>
          </p>
          <div className="flex gap-3 justify-end">
            <button
              onClick={() => setShowModal(false)}
              className="px-4 py-2 bg-dark-700 hover:bg-dark-600 text-dark-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={performAction}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
            >
              Confirm
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
