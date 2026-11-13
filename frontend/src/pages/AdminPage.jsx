import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Shield, Trash2, Search, GraduationCap, Briefcase, UserCheck } from 'lucide-react';
import { adminGetUsers, adminDeleteUser, adminUpdateUserRole } from '../services/userService';
import StatsCard from '../components/StatsCard';
import Avatar from '../components/ui/Avatar';
import Badge from '../components/ui/Badge';
import { SkeletonCard } from '../components/ui/Skeleton';
import toast from 'react-hot-toast';

export default function AdminPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, alumni: 0, students: 0, admins: 0 });
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  useEffect(() => {
    loadData();
  }, [roleFilter]);

  const loadData = async () => {
    setLoading(true);
    try {
      const params = { limit: 100 };
      if (search) params.search = search;
      if (roleFilter) params.role = roleFilter;

      const { data } = await adminGetUsers(params);
      setUsers(data.users || []);
      setStats(data.stats || { total: 0, alumni: 0, students: 0, admins: 0 });
    } catch {
      toast.error('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    loadData();
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Permanently delete account for "${name}"? This cannot be undone.`)) return;
    try {
      await adminDeleteUser(id);
      toast.success('User deleted successfully');
      setUsers(prev => prev.filter(u => u._id !== id));
      setStats(prev => ({ ...prev, total: prev.total - 1 }));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete user');
    }
  };

  const handleRoleChange = async (id, newRole) => {
    try {
      await adminUpdateUserRole(id, newRole);
      toast.success(`Role updated to ${newRole}`);
      setUsers(prev => prev.map(u => u._id === id ? { ...u, role: newRole } : u));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update role');
    }
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-display font-bold text-dark-900 dark:text-white flex items-center gap-2">
          <Shield size={26} className="text-primary-500" /> Platform Administration
        </h1>
        <p className="text-gray-500 dark:text-dark-400 mt-1">
          Full oversight of registered students, alumni, role permissions, and platform metrics
        </p>
      </motion.div>

      {/* Analytics Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatsCard icon={Users} label="Total Registered" value={stats.total} color="primary" />
        <StatsCard icon={Briefcase} label="Alumni" value={stats.alumni} color="purple" />
        <StatsCard icon={GraduationCap} label="Students" value={stats.students} color="pink" />
        <StatsCard icon={Shield} label="Administrators" value={stats.admins || 1} color="emerald" />
      </div>

      {/* User Management Section */}
      <div className="glass rounded-2xl overflow-hidden shadow-glass">
        <div className="p-5 border-b border-gray-200 dark:border-dark-700 flex flex-col sm:flex-row items-center justify-between gap-4">
          <h2 className="font-bold text-lg text-dark-900 dark:text-white">Registered Accounts ({users.length})</h2>

          <form onSubmit={handleSearch} className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Search by name, email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input-field pl-9 py-1.5 text-xs"
              />
            </div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="input-field py-1.5 px-3 text-xs w-28"
            >
              <option value="">All Roles</option>
              <option value="student">Student</option>
              <option value="alumni">Alumni</option>
              <option value="admin">Admin</option>
            </select>
          </form>
        </div>

        {loading ? (
          <div className="p-4 space-y-3">{[...Array(5)].map((_, i) => <SkeletonCard key={i} />)}</div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center text-gray-500">No users found matching your filters.</div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-dark-800">
            {users.map((u) => (
              <div
                key={u._id}
                className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:bg-gray-50/50 dark:hover:bg-dark-800/40 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar src={u.avatar} name={u.name} size="md" />
                  <div className="min-w-0">
                    <p className="font-semibold text-dark-900 dark:text-white text-sm truncate">{u.name}</p>
                    <p className="text-xs text-gray-400 truncate">{u.email}</p>
                    <p className="text-[11px] text-gray-500 truncate">{u.headline || u.course || 'No headline'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                  <select
                    value={u.role}
                    onChange={(e) => handleRoleChange(u._id, e.target.value)}
                    className="text-xs px-2.5 py-1 rounded-lg border border-gray-200 dark:border-dark-600 bg-white dark:bg-dark-800 font-medium"
                  >
                    <option value="student">Student</option>
                    <option value="alumni">Alumni</option>
                    <option value="admin">Admin</option>
                  </select>

                  <button
                    onClick={() => handleDelete(u._id, u.name)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    title="Delete User"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
