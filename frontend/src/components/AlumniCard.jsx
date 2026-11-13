import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, GraduationCap, UserPlus, Check, Target, ExternalLink } from 'lucide-react';
import Avatar from './ui/Avatar';
import { sendMentorshipRequest } from '../services/mentorshipService';
import { sendConnectionRequest } from '../services/connectionService';
import toast from 'react-hot-toast';

const getDomainTheme = (course = '') => {
  const c = course.toLowerCase();
  if (c.includes('cse') || c.includes('computer') || c.includes('information technology') || c.includes('data science'))
    return { gradient: 'from-blue-500 to-cyan-400', bg: 'bg-blue-500/8 dark:bg-blue-500/10', border: 'border-blue-500/20', text: 'text-blue-600 dark:text-blue-400', icon: '💻' };
  if (c.includes('mechanical') || c.includes('automobile') || c.includes('manufacturing'))
    return { gradient: 'from-orange-500 to-amber-400', bg: 'bg-orange-500/8 dark:bg-orange-500/10', border: 'border-orange-500/20', text: 'text-orange-600 dark:text-orange-400', icon: '⚙️' };
  if (c.includes('ece') || c.includes('electronics') || c.includes('electrical'))
    return { gradient: 'from-purple-500 to-violet-400', bg: 'bg-purple-500/8 dark:bg-purple-500/10', border: 'border-purple-500/20', text: 'text-purple-600 dark:text-purple-400', icon: '🔌' };
  if (c.includes('civil') || c.includes('structural') || c.includes('construction'))
    return { gradient: 'from-emerald-500 to-green-400', bg: 'bg-emerald-500/8 dark:bg-emerald-500/10', border: 'border-emerald-500/20', text: 'text-emerald-600 dark:text-emerald-400', icon: '🏗️' };
  if (c.includes('design') || c.includes('ux') || c.includes('des'))
    return { gradient: 'from-pink-500 to-rose-400', bg: 'bg-pink-500/8 dark:bg-pink-500/10', border: 'border-pink-500/20', text: 'text-pink-600 dark:text-pink-400', icon: '🎨' };
  if (c.includes('mba') || c.includes('business') || c.includes('finance') || c.includes('marketing') || c.includes('hr'))
    return { gradient: 'from-indigo-500 to-blue-400', bg: 'bg-indigo-500/8 dark:bg-indigo-500/10', border: 'border-indigo-500/20', text: 'text-indigo-600 dark:text-indigo-400', icon: '📊' };
  return { gradient: 'from-gray-500 to-slate-400', bg: 'bg-gray-500/8 dark:bg-gray-500/10', border: 'border-gray-500/20', text: 'text-gray-600 dark:text-gray-400', icon: '🎓' };
};

export default function AlumniCard({ user, onConnect }) {
  const [loadingConnect, setLoadingConnect] = useState(false);
  const [loadingMentor, setLoadingMentor] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState(
    user.isConnected ? 'connected' : user.connectionStatus || 'none'
  );
  const [mentorshipStatus, setMentorshipStatus] = useState(user.mentorshipStatus || null);

  const theme = getDomainTheme(user.course);

  const handleConnection = async () => {
    setLoadingConnect(true);
    try {
      await sendConnectionRequest({
        to: user._id,
        message: 'I would love to connect and expand our professional network!',
      });
      setConnectionStatus('pending_sent');
      toast.success('Connection request sent!');
      onConnect?.();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send connection request');
    } finally {
      setLoadingConnect(false);
    }
  };

  const handleMentorship = async () => {
    setLoadingMentor(true);
    try {
      await sendMentorshipRequest({
        to: user._id,
        message: 'Hello, I would value your guidance and mentorship for my career growth.',
      });
      setMentorshipStatus('pending');
      toast.success('Mentorship request sent!');
      onConnect?.();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send mentorship request');
    } finally {
      setLoadingMentor(false);
    }
  };

  return (
    <div
      className={`relative rounded-2xl overflow-hidden border ${theme.border} ${theme.bg} shadow-sm hover:shadow-xl card-hover flex flex-col justify-between transform-gpu will-change-transform`}
    >
      {/* Top gradient bar */}
      <div className={`h-1.5 bg-gradient-to-r ${theme.gradient}`} />

      <div className="p-5 flex-1">
        <div className="flex items-start gap-3">
          <div className="relative">
            <Avatar src={user.avatar} name={user.name} size="lg" />
            <span className="absolute -bottom-1 -right-1 text-sm">{theme.icon}</span>
          </div>
          <div className="flex-1 min-w-0">
            <Link to={`/profile/${user._id}`} className="hover:underline">
              <h3 className="font-bold text-dark-900 dark:text-white truncate">{user.name}</h3>
            </Link>
            <p className="text-sm text-gray-500 dark:text-dark-400 truncate">
              {user.headline || user.company || 'AlumniSphere Member'}
            </p>
            {user.course && (
              <p className={`text-xs font-semibold flex items-center gap-1 mt-1 ${theme.text}`}>
                <GraduationCap size={12} /> {user.course}
              </p>
            )}
            {user.location && (
              <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                <MapPin size={12} /> {user.location}
              </p>
            )}
          </div>
          {user.matchPercentage > 0 && (
            <div
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-gradient-to-r ${theme.gradient} text-white shadow-sm shrink-0`}
            >
              {user.matchPercentage}%
            </div>
          )}
        </div>

        {user.skills && user.skills.length > 0 && (
          <div className="mt-3.5 flex flex-wrap gap-1.5">
            {user.skills.slice(0, 4).map((skill) => (
              <span
                key={skill}
                className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-white/80 dark:bg-white/10 text-dark-700 dark:text-dark-200 border border-white/50 dark:border-white/5"
              >
                {skill}
              </span>
            ))}
            {user.skills.length > 4 && (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-white/50 dark:bg-white/5 text-gray-500">
                +{user.skills.length - 4}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="p-4 pt-0 grid grid-cols-2 gap-2 mt-2">
        {/* Connect Button */}
        <button
          onClick={handleConnection}
          disabled={loadingConnect || connectionStatus === 'connected' || connectionStatus === 'pending_sent'}
          className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold transition-colors duration-150 ${
            connectionStatus === 'connected'
              ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 cursor-default'
              : connectionStatus === 'pending_sent'
              ? 'bg-gray-100 dark:bg-dark-700 text-gray-500 cursor-default'
              : 'border border-primary-500 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 active:scale-95'
          } disabled:opacity-75`}
        >
          {loadingConnect ? (
            <div className="w-3.5 h-3.5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
          ) : connectionStatus === 'connected' ? (
            <><Check size={14} /> Connected</>
          ) : connectionStatus === 'pending_sent' ? (
            'Request Sent'
          ) : (
            <><UserPlus size={14} /> Connect</>
          )}
        </button>

        {/* Mentorship Button */}
        {user.role === 'alumni' ? (
          <button
            onClick={handleMentorship}
            disabled={loadingMentor || mentorshipStatus === 'accepted' || mentorshipStatus === 'pending'}
            className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold transition-colors duration-150 ${
              mentorshipStatus === 'accepted'
                ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 cursor-default'
                : mentorshipStatus === 'pending'
                ? 'bg-gray-100 dark:bg-dark-700 text-gray-500 cursor-default'
                : `bg-gradient-to-r ${theme.gradient} text-white shadow-sm hover:opacity-95 active:scale-95`
            } disabled:opacity-75`}
          >
            {loadingMentor ? (
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : mentorshipStatus === 'accepted' ? (
              <><Check size={14} /> Mentoring</>
            ) : mentorshipStatus === 'pending' ? (
              'Mentor Req Sent'
            ) : (
              <><Target size={14} /> Mentor</>
            )}
          </button>
        ) : (
          <Link
            to={`/profile/${user._id}`}
            className="flex items-center justify-center gap-1 py-2 px-3 rounded-xl text-xs font-semibold glass text-dark-700 dark:text-dark-200 hover:bg-gray-100 dark:hover:bg-dark-700"
          >
            <ExternalLink size={14} /> Profile
          </Link>
        )}
      </div>
    </div>
  );
}
