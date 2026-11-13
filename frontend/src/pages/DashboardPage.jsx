import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, UserCheck, Briefcase, Eye, TrendingUp, Zap, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getStats, getRecommendations, getTrendingSkills, getLeaderboard } from '../services/userService';
import { getOpportunities } from '../services/opportunityService';
import StatsCard from '../components/StatsCard';
import AlumniCard from '../components/AlumniCard';
import Badge from '../components/ui/Badge';
import Avatar from '../components/ui/Avatar';
import { SkeletonCard } from '../components/ui/Skeleton';

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [trending, setTrending] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const results = await Promise.allSettled([
        getStats(),
        getRecommendations(),
        getTrendingSkills(),
        getLeaderboard(),
        getOpportunities({ limit: 4 }),
      ]);

      if (results[0].status === 'fulfilled') setStats(results[0].value.data.stats);
      if (results[1].status === 'fulfilled') setRecommendations(results[1].value.data.recommendations || []);
      if (results[2].status === 'fulfilled') setTrending(results[2].value.data.skills || []);
      if (results[3].status === 'fulfilled') setLeaderboard(results[3].value.data.leaderboard || []);
      if (results[4].status === 'fulfilled') setOpportunities(results[4].value.data.opportunities || []);
    } catch (err) {
      console.error('Dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-2xl p-6 bg-gradient-card border border-white/40 dark:border-dark-700 shadow-glass"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-display font-bold text-dark-900 dark:text-white flex items-center gap-2">
              Welcome back, {user?.name?.split(' ')[0]}! 👋
            </h1>
            <p className="text-gray-500 dark:text-dark-400 mt-1 text-sm">
              Explore your network, mentor matches, and the latest opportunities in your field.
            </p>
          </div>
          <Link
            to="/discover"
            className="gradient-btn px-4 py-2 rounded-xl text-xs font-semibold shrink-0 shadow-md flex items-center gap-1.5"
          >
            <Sparkles size={14} /> Explore Network
          </Link>
        </div>
      </motion.div>

      {/* Analytics Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link to="/connections">
          <StatsCard icon={Users} label="Connections" value={stats?.connections || 0} color="primary" />
        </Link>
        <Link to="/mentorship">
          <StatsCard icon={UserCheck} label="Active Mentorships" value={stats?.activeMentorships || 0} color="purple" />
        </Link>
        <Link to="/connections">
          <StatsCard icon={Briefcase} label="Pending Requests" value={stats?.pendingRequests || 0} color="pink" />
        </Link>
        <StatsCard icon={Eye} label="Profile Views" value={stats?.profileViews || 0} color="emerald" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column: Recommendations & Opportunities */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recommended Mentors */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-dark-900 dark:text-white flex items-center gap-2">
                <Zap size={20} className="text-amber-500" /> Recommended Mentors
              </h2>
              <Link to="/discover" className="text-xs text-primary-500 hover:text-primary-600 font-semibold">
                View All →
              </Link>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              {recommendations.length > 0 ? (
                recommendations.slice(0, 4).map((rec) => (
                  <AlumniCard key={rec._id} user={rec} onConnect={loadDashboard} />
                ))
              ) : (
                <div className="col-span-2 text-center text-gray-500 py-8 glass rounded-2xl p-4">
                  <p className="text-sm font-medium">Add skills and your department to your profile</p>
                  <p className="text-xs text-gray-400 mt-1">We'll match you with alumni mentors tailored to your career goals!</p>
                  <Link to="/profile" className="mt-3 inline-block text-xs font-bold text-primary-500">
                    Update Profile Skills →
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Latest Opportunities */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-dark-900 dark:text-white flex items-center gap-2">
                <Briefcase size={20} className="text-primary-500" /> Latest Opportunities
              </h2>
              <Link to="/opportunities" className="text-xs text-primary-500 hover:text-primary-600 font-semibold">
                View All →
              </Link>
            </div>
            <div className="space-y-3">
              {opportunities.length === 0 ? (
                <p className="text-center text-sm text-gray-400 py-6 glass rounded-2xl">
                  No opportunities posted yet.
                </p>
              ) : (
                opportunities.map((opp) => (
                  <Link key={opp._id} to="/opportunities" className="block">
                    <div className="glass rounded-xl p-4 card-hover transform-gpu will-change-transform">
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="font-semibold text-dark-900 dark:text-white truncate">{opp.title}</h3>
                          <p className="text-xs text-primary-500 font-medium truncate">
                            {opp.company} • {opp.location}
                          </p>
                        </div>
                        <Badge color={opp.type === 'internship' ? 'purple' : 'primary'} size="sm" className="shrink-0">
                          {opp.type?.toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Sidebar: Trending Skills & Top Alumni */}
        <div className="space-y-6">
          {/* Trending Skills */}
          <div className="glass rounded-2xl p-5 shadow-glass">
            <h3 className="font-bold text-dark-900 dark:text-white flex items-center gap-2 mb-4 text-sm">
              <TrendingUp size={18} className="text-emerald-500" /> Trending In Demand Skills
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {trending.slice(0, 12).map((s, i) => (
                <Badge key={s.name} color={['primary', 'purple', 'pink', 'green', 'amber'][i % 5]} size="sm">
                  {s.name} ({s.count})
                </Badge>
              ))}
            </div>
          </div>

          {/* Leaderboard */}
          <div className="glass rounded-2xl p-5 shadow-glass">
            <h3 className="font-bold text-dark-900 dark:text-white flex items-center gap-2 mb-4 text-sm">
              🏆 Top Alumni Mentors
            </h3>
            <div className="space-y-2.5">
              {leaderboard.slice(0, 5).map((u, i) => (
                <Link
                  key={u._id}
                  to={`/profile/${u._id}`}
                  className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50/80 dark:hover:bg-dark-700/50 transition-colors"
                >
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                      i === 0
                        ? 'bg-amber-100 text-amber-700'
                        : i === 1
                        ? 'bg-gray-200 text-gray-700'
                        : i === 2
                        ? 'bg-orange-100 text-orange-700'
                        : 'bg-gray-100 text-gray-500 dark:bg-dark-700 dark:text-gray-400'
                    }`}
                  >
                    {i + 1}
                  </span>
                  <Avatar src={u.avatar} name={u.name} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-dark-900 dark:text-white truncate">{u.name}</p>
                    <p className="text-[11px] text-gray-400 truncate">{u.company || u.headline}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
