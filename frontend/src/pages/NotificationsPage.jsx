import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Bell, CheckCheck, MessageCircle, UserPlus, Briefcase, Sparkles } from 'lucide-react';
import { getNotifications, markAsRead, markAllRead } from '../services/notificationService';
import Avatar from '../components/ui/Avatar';
import Button from '../components/ui/Button';
import { SkeletonCard } from '../components/ui/Skeleton';
import toast from 'react-hot-toast';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const { data } = await getNotifications();
      setNotifications(data.notifications || []);
    } catch {
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAll = async () => {
    try {
      await markAllRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      toast.success('All notifications marked as read');
    } catch {
      toast.error('Failed to mark notifications read');
    }
  };

  const handleMarkSingle = async (id) => {
    try {
      await markAsRead(id);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
    } catch {}
  };

  const getIcon = (type) => {
    switch (type) {
      case 'message': return <MessageCircle size={18} className="text-blue-500" />;
      case 'connection': return <UserPlus size={18} className="text-purple-500" />;
      case 'opportunity': return <Briefcase size={18} className="text-amber-500" />;
      default: return <Sparkles size={18} className="text-primary-500" />;
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-dark-900 dark:text-white flex items-center gap-2">
            <Bell size={26} className="text-primary-500" /> Notifications
          </h1>
          <p className="text-gray-500 dark:text-dark-400 mt-1">Stay updated with your connections, messages, and mentorship</p>
        </div>
        {notifications.some(n => !n.read) && (
          <Button onClick={handleMarkAll} size="sm" variant="secondary" className="flex items-center gap-1.5">
            <CheckCheck size={16} /> Mark all read
          </Button>
        )}
      </motion.div>

      {loading ? (
        <div className="space-y-3">{[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}</div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-16 glass rounded-2xl">
          <Bell className="mx-auto mb-3 text-gray-300" size={48} />
          <p className="text-gray-500 text-lg">No notifications yet</p>
          <p className="text-gray-400 text-sm mt-1">When someone sends you a message, connection request, or opportunity, you'll see it here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => (
            <motion.div
              key={n._id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => handleMarkSingle(n._id)}
              className={`p-4 rounded-2xl glass transition-all duration-200 card-hover flex items-start justify-between gap-4 ${
                !n.read ? 'border-l-4 border-l-primary-500 bg-primary-50/20 dark:bg-primary-900/10' : ''
              }`}
            >
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <div className="p-2.5 rounded-xl bg-gray-100 dark:bg-dark-700 shrink-0">
                  {getIcon(n.type)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-dark-900 dark:text-white text-sm">{n.title}</p>
                    <span className="text-[11px] text-gray-400">
                      {n.createdAt ? new Date(n.createdAt).toLocaleDateString() : 'Recent'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-dark-300 mt-0.5">{n.message}</p>
                  {n.link && (
                    <Link
                      to={n.link}
                      className="inline-block mt-2 text-xs font-semibold text-primary-500 hover:text-primary-600"
                    >
                      View details →
                    </Link>
                  )}
                </div>
              </div>
              {!n.read && (
                <span className="w-2.5 h-2.5 rounded-full bg-primary-500 shrink-0 mt-2" title="Unread" />
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
