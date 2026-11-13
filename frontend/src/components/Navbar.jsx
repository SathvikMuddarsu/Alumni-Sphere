import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Bell, Moon, Sun, Menu, X, LogOut, User, LayoutDashboard,
  Users, UserPlus, Target, MessageCircle, Briefcase, Shield
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { getNotifications, markAllRead } from '../services/notificationService';
import Avatar from './ui/Avatar';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { darkMode, toggleDarkMode } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [showProfile, setShowProfile] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenu, setMobileMenu] = useState(false);
  const profileRef = useRef(null);
  const notifRef = useRef(null);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 25000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setMobileMenu(false);
    setShowProfile(false);
    setShowNotifications(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleClick = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) setShowProfile(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifications(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const fetchNotifications = async () => {
    try {
      const { data } = await getNotifications();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch {}
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/discover?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllRead();
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch {}
  };

  const navLinks = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/discover', icon: Users, label: 'Discover' },
    { to: '/connections', icon: UserPlus, label: 'Connections' },
    { to: '/mentorship', icon: Target, label: 'Mentorship' },
    { to: '/messages', icon: MessageCircle, label: 'Messages' },
    { to: '/opportunities', icon: Briefcase, label: 'Opportunities' },
    { to: '/notifications', icon: Bell, label: 'Notifications' },
    { to: '/profile', icon: User, label: 'Profile' },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-strong border-b border-white/10 dark:border-dark-700/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/dashboard" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-primary flex items-center justify-center shadow-md">
              <span className="text-white font-bold text-lg">A</span>
            </div>
            <span className="font-display font-bold text-xl gradient-text hidden sm:block">AlumniSphere</span>
          </Link>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={17} />
              <input
                type="text"
                placeholder="Search alumni, skills, companies..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-field pl-10 py-1.5 text-sm"
              />
            </div>
          </form>

          {/* Right Action Icons */}
          <div className="flex items-center gap-2">
            {/* Dark Mode Toggle */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={toggleDarkMode}
              className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-dark-700 transition-colors"
              title="Toggle theme"
            >
              {darkMode ? <Sun size={20} className="text-amber-400" /> : <Moon size={20} className="text-dark-600" />}
            </motion.button>

            {/* Notifications Dropdown */}
            <div className="relative" ref={notifRef}>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-dark-700 transition-colors relative"
                title="Notifications"
              >
                <Bell size={20} className="text-dark-600 dark:text-dark-300" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </motion.button>

              <AnimatePresence>
                {showNotifications && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute right-0 mt-2 w-80 sm:w-96 glass-strong rounded-2xl shadow-glass-lg overflow-hidden border border-white/20 dark:border-dark-700 z-50"
                  >
                    <div className="p-4 border-b border-gray-200 dark:border-dark-700 flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-dark-900 dark:text-white">Notifications</h3>
                        {unreadCount > 0 && (
                          <span className="px-2 py-0.5 rounded-full text-xs bg-red-100 text-red-600 font-bold dark:bg-red-900/30">
                            {unreadCount} new
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {unreadCount > 0 && (
                          <button
                            onClick={handleMarkAllRead}
                            className="text-xs text-primary-500 hover:text-primary-600 font-medium"
                          >
                            Mark all read
                          </button>
                        )}
                        <Link
                          to="/notifications"
                          onClick={() => setShowNotifications(false)}
                          className="text-xs text-gray-500 hover:text-dark-900 dark:hover:text-white"
                        >
                          View all
                        </Link>
                      </div>
                    </div>

                    <div className="max-h-80 overflow-y-auto divide-y divide-gray-100 dark:divide-dark-800">
                      {notifications.length === 0 ? (
                        <p className="p-6 text-center text-sm text-gray-400">No notifications yet</p>
                      ) : (
                        notifications.slice(0, 6).map((n) => (
                          <Link
                            key={n._id}
                            to={n.link || '/notifications'}
                            onClick={() => setShowNotifications(false)}
                            className={`block p-3.5 hover:bg-gray-50/80 dark:hover:bg-dark-700/60 transition-colors ${
                              !n.read ? 'bg-primary-50/40 dark:bg-primary-950/20' : ''
                            }`}
                          >
                            <p className="text-sm font-medium text-dark-900 dark:text-white">{n.title}</p>
                            <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>
                          </Link>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Profile Dropdown */}
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setShowProfile(!showProfile)}
                className="flex items-center gap-2 p-1 rounded-xl hover:bg-gray-100 dark:hover:bg-dark-700 transition-colors"
              >
                <Avatar src={user?.avatar} name={user?.name || ''} size="sm" />
                <span className="hidden sm:block text-sm font-medium text-dark-700 dark:text-dark-300 max-w-[110px] truncate">
                  {user?.name}
                </span>
              </button>

              <AnimatePresence>
                {showProfile && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute right-0 mt-2 w-56 glass-strong rounded-2xl shadow-glass-lg overflow-hidden border border-white/20 dark:border-dark-700 z-50"
                  >
                    <div className="p-3.5 border-b border-gray-200 dark:border-dark-700">
                      <p className="font-semibold text-dark-900 dark:text-white text-sm truncate">{user?.name}</p>
                      <p className="text-xs text-gray-400 truncate">{user?.email}</p>
                      <span className="inline-block mt-1 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-300">
                        {user?.role}
                      </span>
                    </div>

                    <div className="p-1.5 space-y-0.5">
                      <Link
                        to="/profile"
                        onClick={() => setShowProfile(false)}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-dark-700 dark:text-dark-300 hover:bg-gray-100 dark:hover:bg-dark-700 transition-colors"
                      >
                        <User size={16} /> My Profile
                      </Link>
                      {user?.role === 'admin' && (
                        <Link
                          to="/admin"
                          onClick={() => setShowProfile(false)}
                          className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors font-medium"
                        >
                          <Shield size={16} /> Admin Panel
                        </Link>
                      )}
                      <button
                        onClick={() => { logout(); navigate('/login'); setShowProfile(false); }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      >
                        <LogOut size={16} /> Sign Out
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Mobile Hamburger Menu Toggle */}
            <button
              onClick={() => setMobileMenu(!mobileMenu)}
              className="lg:hidden p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-dark-700 text-dark-600 dark:text-dark-300"
              title="Menu"
            >
              {mobileMenu ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        <AnimatePresence>
          {mobileMenu && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="lg:hidden overflow-hidden border-t border-gray-200 dark:border-dark-700 py-3 space-y-1"
            >
              {navLinks.map(({ to, icon: Icon, label }) => (
                <Link
                  key={to}
                  to={to}
                  onClick={() => setMobileMenu(false)}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    location.pathname === to
                      ? 'bg-primary-500/10 text-primary-600 dark:text-primary-400 font-semibold'
                      : 'text-dark-700 dark:text-dark-300 hover:bg-gray-100 dark:hover:bg-dark-700'
                  }`}
                >
                  <Icon size={18} /> {label}
                </Link>
              ))}
              {user?.role === 'admin' && (
                <Link
                  to="/admin"
                  onClick={() => setMobileMenu(false)}
                  className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-purple-600 dark:text-purple-400"
                >
                  <Shield size={18} /> Admin Panel
                </Link>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  );
}
