import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Users, UserPlus, Target, MessageCircle, Briefcase, Bell, UserCircle, Shield
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const links = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/discover', icon: Users, label: 'Discover' },
  { to: '/connections', icon: UserPlus, label: 'Connections' },
  { to: '/mentorship', icon: Target, label: 'Mentorship' },
  { to: '/messages', icon: MessageCircle, label: 'Messages' },
  { to: '/opportunities', icon: Briefcase, label: 'Opportunities' },
  { to: '/notifications', icon: Bell, label: 'Notifications' },
  { to: '/profile', icon: UserCircle, label: 'Profile' },
];

export default function Sidebar() {
  const { user } = useAuth();

  return (
    <aside className="hidden lg:flex flex-col w-64 shrink-0 sticky top-20 h-[calc(100vh-6rem)]">
      <nav className="glass rounded-2xl p-3 space-y-1 shadow-glass">
        {links.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-primary-500/10 text-primary-600 dark:text-primary-400 border-l-4 border-primary-500 shadow-sm font-semibold'
                  : 'text-dark-600 dark:text-dark-300 hover:bg-gray-100 dark:hover:bg-dark-700/60 border-l-4 border-transparent'
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}

        {user?.role === 'admin' && (
          <NavLink
            to="/admin"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-primary-500/10 text-primary-600 dark:text-primary-400 border-l-4 border-primary-500 shadow-sm font-semibold'
                  : 'text-dark-600 dark:text-dark-300 hover:bg-gray-100 dark:hover:bg-dark-700/60 border-l-4 border-transparent'
              }`
            }
          >
            <Shield size={18} /> Admin Panel
          </NavLink>
        )}
      </nav>
    </aside>
  );
}
