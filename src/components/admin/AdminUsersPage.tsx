import { useState } from 'react'
import {
  Search,
  Filter,
  MoreVertical,
  Mail,
  Ban,
  CheckCircle,
  UserPlus,
  Download,
} from 'lucide-react'
import { AdminProtectedRoute } from './AdminProtectedRoute'

const MOCK_USERS = [
  {
    id: '1',
    name: 'Karim Hossain',
    email: 'karim@example.com',
    phone: '01712345678',
    status: 'active',
    orders: 24,
    totalSpent: 125000,
    joinedAt: '2024-01-15',
  },
  {
    id: '2',
    name: 'Fatima Rahman',
    email: 'fatima@example.com',
    phone: '01812345678',
    status: 'active',
    orders: 18,
    totalSpent: 89500,
    joinedAt: '2024-02-20',
  },
  {
    id: '3',
    name: 'Abdul Malik',
    email: 'abdul@example.com',
    phone: '01912345678',
    status: 'suspended',
    orders: 5,
    totalSpent: 12000,
    joinedAt: '2024-03-10',
  },
  {
    id: '4',
    name: 'Nasreen Akhter',
    email: 'nasreen@example.com',
    phone: '01612345678',
    status: 'active',
    orders: 42,
    totalSpent: 245000,
    joinedAt: '2023-11-05',
  },
  {
    id: '5',
    name: 'Rafiq Islam',
    email: 'rafiq@example.com',
    phone: '01512345678',
    status: 'inactive',
    orders: 2,
    totalSpent: 5500,
    joinedAt: '2024-04-01',
  },
]

export function AdminUsersPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const filteredUsers = MOCK_USERS.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <AdminProtectedRoute requiredPermission="canManageUsers">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Users Management</h1>
            <p className="text-slate-600">Manage buyer accounts and permissions</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50">
              <Download size={16} />
              Export
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700">
              <UserPlus size={16} />
              Add User
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search users by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter size={16} className="text-slate-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    User
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Phone
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Orders
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Total Spent
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Joined
                  </th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-semibold">
                          {user.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900">{user.name}</p>
                          <p className="text-sm text-slate-500">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{user.phone}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          user.status === 'active'
                            ? 'bg-green-100 text-green-700'
                            : user.status === 'suspended'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{user.orders}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      ৳{user.totalSpent.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{user.joinedAt}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded">
                          <Mail size={16} />
                        </button>
                        {user.status === 'active' ? (
                          <button className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded">
                            <Ban size={16} />
                          </button>
                        ) : (
                          <button className="p-1.5 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded">
                            <CheckCircle size={16} />
                          </button>
                        )}
                        <button className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded">
                          <MoreVertical size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between">
            <p className="text-sm text-slate-600">
              Showing {filteredUsers.length} of {MOCK_USERS.length} users
            </p>
            <div className="flex items-center gap-2">
              <button className="px-3 py-1.5 border border-slate-200 rounded text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-50">
                Previous
              </button>
              <button className="px-3 py-1.5 bg-orange-600 text-white rounded text-sm">1</button>
              <button className="px-3 py-1.5 border border-slate-200 rounded text-sm text-slate-600 hover:bg-slate-50">
                2
              </button>
              <button className="px-3 py-1.5 border border-slate-200 rounded text-sm text-slate-600 hover:bg-slate-50">
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </AdminProtectedRoute>
  )
}
