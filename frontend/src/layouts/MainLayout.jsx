import { Outlet, NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, UserPlus, MessageCircle, User } from 'lucide-react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';

const mobileNavItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Home' },
  { to: '/discover', icon: Users, label: 'Discover' },
  { to: '/connections', icon: UserPlus, label: 'Network' },
  { to: '/messages', icon: MessageCircle, label: 'Chat' },
  { to: '/profile', icon: User, label: 'Profile' },
];

export default function MainLayout() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-950 pb-16 lg:pb-0">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-20 pb-8">
        <div className="flex gap-6">
          <Sidebar />
          <main className="flex-1 min-w-0">
            <Outlet />
          </main>
        </div>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 glass-strong border-t border-gray-200/60 dark:border-dark-700/60 px-2 py-1.5 flex justify-around items-center">
        {mobileNavItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center py-1 px-3 rounded-xl text-[10px] font-medium transition-colors ${
                isActive
                  ? 'text-primary-600 dark:text-primary-400 font-bold'
                  : 'text-gray-500 dark:text-dark-400 hover:text-dark-900 dark:hover:text-white'
              }`
            }
          >
            <Icon size={19} className="mb-0.5" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
