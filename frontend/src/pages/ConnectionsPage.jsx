import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, UserPlus, Inbox, Send, Check, X, MessageCircle, ExternalLink, UserMinus } from 'lucide-react';
import {
  getConnections,
  getConnectionRequests,
  respondConnectionRequest,
  cancelConnectionRequest,
  removeConnection,
} from '../services/connectionService';
import Avatar from '../components/ui/Avatar';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import { SkeletonCard } from '../components/ui/Skeleton';
import toast from 'react-hot-toast';

export default function ConnectionsPage() {
  const [tab, setTab] = useState('connections'); // 'connections' | 'received' | 'sent'
  const [connections, setConnections] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [tab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (tab === 'connections') {
        const { data } = await getConnections();
        setConnections(data.connections || []);
      } else {
        const { data } = await getConnectionRequests(tab);
        setRequests(data.requests || []);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load connections data');
    } finally {
      setLoading(false);
    }
  };

  const handleRespond = async (id, status) => {
    try {
      await respondConnectionRequest(id, status);
      toast.success(`Request ${status}!`);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update request');
    }
  };

  const handleCancel = async (id) => {
    try {
      await cancelConnectionRequest(id);
      toast.success('Connection request cancelled');
      fetchData();
    } catch (err) {
      toast.error('Failed to cancel request');
    }
  };

  const handleDisconnect = async (userId, name) => {
    if (!window.confirm(`Are you sure you want to remove ${name} from your connections?`)) return;
    try {
      await removeConnection(userId);
      toast.success('Connection removed');
      fetchData();
    } catch (err) {
      toast.error('Failed to remove connection');
    }
  };

  const tabs = [
    { key: 'connections', label: 'My Connections', icon: Users },
    { key: 'received', label: 'Received Requests', icon: Inbox },
    { key: 'sent', label: 'Sent Requests', icon: Send },
  ];

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-display font-bold text-dark-900 dark:text-white flex items-center gap-2">
          <Users size={26} className="text-primary-500" /> Connections
        </h1>
        <p className="text-gray-500 dark:text-dark-400 mt-1">
          Build and manage your professional network across alumni and students
        </p>
      </motion.div>

      {/* Navigation Tabs */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-dark-700 pb-3">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              tab === key
                ? 'bg-gradient-primary text-white shadow-glow'
                : 'glass text-dark-600 dark:text-dark-300 hover:bg-gray-100 dark:hover:bg-dark-700'
            }`}
          >
            <Icon size={16} /> {label}
          </button>
        ))}
      </div>

      {/* Content Rendering */}
      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : tab === 'connections' ? (
        connections.length === 0 ? (
          <div className="text-center py-16 glass rounded-2xl">
            <UserPlus className="mx-auto mb-3 text-gray-300" size={48} />
            <p className="text-gray-500 text-lg">No connections yet</p>
            <p className="text-gray-400 text-sm mt-1">Explore the Discover page to connect with alumni and peers!</p>
            <Link to="/discover" className="mt-4 inline-block">
              <Button size="sm">Discover Alumni</Button>
            </Link>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {connections.map((c) => (
              <div
                key={c._id}
                className="glass rounded-2xl p-5 card-hover flex flex-col justify-between transform-gpu will-change-transform"
              >
                <div>
                  <div className="flex items-start gap-3">
                    <Avatar src={c.avatar} name={c.name} size="lg" />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-dark-900 dark:text-white truncate">{c.name}</h3>
                      <p className="text-xs text-gray-500 truncate">{c.headline || c.company || 'Professional'}</p>
                      <Badge color={c.role === 'alumni' ? 'purple' : 'primary'} size="sm" className="mt-1">
                        {c.role?.toUpperCase()}
                      </Badge>
                    </div>
                  </div>

                  {c.skills && c.skills.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {c.skills.slice(0, 3).map((skill) => (
                        <span
                          key={skill}
                          className="px-2 py-0.5 rounded-full text-[10px] bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-300"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-gray-100 dark:border-dark-700/60 flex items-center justify-between gap-2">
                  <Link
                    to={`/profile/${c._id}`}
                    className="text-xs font-semibold text-primary-500 hover:text-primary-600 flex items-center gap-1"
                  >
                    View Profile <ExternalLink size={12} />
                  </Link>
                  <div className="flex items-center gap-1">
                    <Link to="/messages">
                      <Button size="sm" variant="outline" className="px-2.5 py-1 text-xs">
                        <MessageCircle size={14} /> Message
                      </Button>
                    </Link>
                    <button
                      onClick={() => handleDisconnect(c._id, c.name)}
                      title="Remove Connection"
                      className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                      <UserMinus size={15} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      ) : requests.length === 0 ? (
        <div className="text-center py-16 glass rounded-2xl">
          <Inbox className="mx-auto mb-3 text-gray-300" size={48} />
          <p className="text-gray-500 text-lg">No pending requests</p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((req) => {
            const isReceived = tab === 'received';
            const otherUser = isReceived ? req.from : req.to;
            return (
              <motion.div
                key={req._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass rounded-2xl p-5 card-hover flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <Avatar src={otherUser?.avatar} name={otherUser?.name} size="lg" />
                  <div className="min-w-0">
                    <h3 className="font-bold text-dark-900 dark:text-white truncate">{otherUser?.name}</h3>
                    <p className="text-sm text-gray-500 truncate">{otherUser?.headline || otherUser?.company}</p>
                    {req.message && <p className="text-xs text-gray-400 mt-1 italic">"{req.message}"</p>}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {isReceived ? (
                    <>
                      <Button size="sm" variant="primary" onClick={() => handleRespond(req._id, 'accepted')}>
                        <Check size={16} /> Accept
                      </Button>
                      <Button size="sm" variant="danger" onClick={() => handleRespond(req._id, 'rejected')}>
                        <X size={16} /> Reject
                      </Button>
                    </>
                  ) : (
                    <Button size="sm" variant="secondary" onClick={() => handleCancel(req._id)}>
                      Cancel Request
                    </Button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
