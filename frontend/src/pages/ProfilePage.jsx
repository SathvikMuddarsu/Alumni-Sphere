import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  MapPin, Briefcase, Calendar, Edit3, Save, X, GraduationCap,
  Key, UserPlus, Check, Target, MessageCircle, Building, CheckCircle2,
  Sparkles, Award, Globe
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getUserById, updateProfile } from '../services/userService';
import { getMentorshipRequests, sendMentorshipRequest } from '../services/mentorshipService';
import { sendConnectionRequest } from '../services/connectionService';
import Avatar from '../components/ui/Avatar';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import ProgressBar from '../components/ui/ProgressBar';
import Input from '../components/ui/Input';
import Card from '../components/ui/Card';
import Modal from '../components/ui/Modal';
import { SkeletonCard } from '../components/ui/Skeleton';
import toast from 'react-hot-toast';

const SKILLS_OPTIONS = [
  'React', 'Node.js', 'Python', 'JavaScript', 'TypeScript', 'Java', 'Machine Learning', 'UI/UX', 'Figma',
  'Data Analytics', 'SQL', 'MongoDB', 'AWS', 'Product Management', 'Agile', 'System Design', 'TensorFlow',
  'AutoCAD', 'SolidWorks', 'VLSI Design', 'Embedded Systems', 'IoT', 'C++', 'System Architecture'
];

export default function ProfilePage() {
  const { id } = useParams();
  const { user: currentUser, updateUser, changePassword } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [mentorships, setMentorships] = useState([]);

  // Modals state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Connection / Mentorship actions
  const [connectLoading, setConnectLoading] = useState(false);
  const [mentorLoading, setMentorLoading] = useState(false);

  const currentId = (currentUser?.id || currentUser?._id)?.toString();
  const isOwnProfile = !id || id === currentId;

  useEffect(() => {
    loadProfile();
  }, [id, currentUser]);

  const loadProfile = async () => {
    setLoading(true);
    try {
      if (isOwnProfile) {
        // Fetch freshest user document from database
        const targetId = currentUser?.id || currentUser?._id;
        if (targetId) {
          const { data: userData } = await getUserById(targetId);
          const current = userData.user || currentUser;
          setProfile(current);
          setEditForm({
            name: current?.name || '',
            headline: current?.headline || '',
            bio: current?.bio || '',
            skills: current?.skills || [],
            industry: current?.industry || '',
            course: current?.course || '',
            experience: current?.experience || 0,
            location: current?.location || '',
            company: current?.company || '',
            graduationYear: current?.graduationYear || '',
            avatar: current?.avatar || '',
          });
        } else {
          setProfile(currentUser);
        }
        const { data } = await getMentorshipRequests('all');
        setMentorships(data.requests?.filter((r) => r.status === 'accepted') || []);
      } else {
        const { data } = await getUserById(id);
        setProfile(data.user);
      }
    } catch {
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEdit = () => {
    setEditForm({
      name: profile?.name || '',
      headline: profile?.headline || '',
      bio: profile?.bio || '',
      skills: Array.isArray(profile?.skills) ? [...profile.skills] : [],
      industry: profile?.industry || '',
      course: profile?.course || '',
      experience: profile?.experience || 0,
      location: profile?.location || '',
      company: profile?.company || '',
      graduationYear: profile?.graduationYear || '',
      avatar: profile?.avatar || '',
    });
    setShowEditModal(true);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!editForm.name.trim()) {
      toast.error('Full Name is required');
      return;
    }

    setSaving(true);
    try {
      const { data } = await updateProfile({
        name: editForm.name.trim(),
        headline: editForm.headline.trim(),
        bio: editForm.bio.trim(),
        skills: editForm.skills,
        industry: editForm.industry.trim(),
        course: editForm.course.trim(),
        experience: Number(editForm.experience) || 0,
        location: editForm.location.trim(),
        company: editForm.company.trim(),
        graduationYear: editForm.graduationYear ? Number(editForm.graduationYear) : undefined,
        avatar: editForm.avatar.trim(),
      });

      setProfile(data.user);
      updateUser(data.user);
      setShowEditModal(false);
      toast.success('Profile updated successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!passwordForm.currentPassword || !passwordForm.newPassword) {
      toast.error('Please fill all password fields');
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setPasswordLoading(true);
    try {
      await changePassword(passwordForm.currentPassword, passwordForm.newPassword);
      setShowPasswordModal(false);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update password');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleConnectOther = async () => {
    setConnectLoading(true);
    try {
      await sendConnectionRequest({ to: profile._id, message: 'I would like to connect with you!' });
      setProfile((prev) => ({ ...prev, connectionStatus: 'pending_sent' }));
      toast.success('Connection request sent!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send connection request');
    } finally {
      setConnectLoading(false);
    }
  };

  const handleMentorOther = async () => {
    setMentorLoading(true);
    try {
      await sendMentorshipRequest({ to: profile._id, message: 'I would appreciate your mentorship!' });
      setProfile((prev) => ({ ...prev, mentorshipStatus: 'pending' }));
      toast.success('Mentorship request sent!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send mentorship request');
    } finally {
      setMentorLoading(false);
    }
  };

  const toggleSkill = (skill) => {
    setEditForm((prev) => ({
      ...prev,
      skills: prev.skills?.includes(skill)
        ? prev.skills.filter((s) => s !== skill)
        : [...(prev.skills || []), skill],
    }));
  };

  if (loading) {
    return (
      <div className="space-y-4 max-w-5xl mx-auto">
        {[...Array(3)].map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-16 glass rounded-2xl max-w-5xl mx-auto">
        <p className="text-gray-500 font-medium">Profile not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Profile Header Hero Card */}
      <div className="glass rounded-3xl overflow-hidden shadow-glass border border-white/30 dark:border-dark-700/60">
        {/* Cover Banner - Compact, clean */}
        <div className="h-28 sm:h-36 bg-gradient-primary relative">
          <div
            className="absolute inset-0 bg-white/10 opacity-25"
            style={{
              backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
              backgroundSize: '24px 24px',
            }}
          />
        </div>

        {/* Profile Content Details - always BELOW cover, never overlapping */}
        <div className="px-6 sm:px-8 pb-6 pt-0 relative">
          {/* Avatar row: avatar overlaps upward into banner, everything else stays below */}
          <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-10 sm:-mt-12 relative z-10">
            {/* Round Avatar Container */}
            <div className="p-1.5 rounded-full bg-white dark:bg-dark-900 shadow-xl inline-block shrink-0 self-start">
              <Avatar src={profile.avatar} name={profile.name} size="2xl" />
            </div>

            {/* Name + Role + Buttons: all below the banner line */}
            <div className="flex-1 min-w-0 pt-1 sm:pt-3">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                {/* Identity block */}
                <div className="min-w-0">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h1 className="text-2xl sm:text-3xl font-display font-bold text-dark-900 dark:text-white tracking-tight leading-tight">
                      {profile.name}
                    </h1>
                    <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300">
                      {profile.role}
                    </span>
                  </div>

                  <p className="text-gray-600 dark:text-dark-300 text-sm sm:text-base font-normal max-w-2xl mt-1">
                    {profile.headline || `${profile.role === 'alumni' ? 'Alumni Mentor' : 'Student'} at AlumniSphere`}
                  </p>
                </div>

                {/* Profile Action Buttons */}
                <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                  {isOwnProfile ? (
                    <>
                      <Button size="md" variant="primary" onClick={handleOpenEdit} className="shadow-md">
                        <Edit3 size={15} /> Edit Profile
                      </Button>
                      <Button size="md" variant="secondary" onClick={() => setShowPasswordModal(true)}>
                        <Key size={15} /> Password
                      </Button>
                    </>
                  ) : (
                    <>
                      <Link
                        to={`/messages?userId=${profile._id}`}
                        state={{ recipient: profile }}
                      >
                        <Button size="md" variant="primary" className="shadow-md">
                          <MessageCircle size={15} /> Message
                        </Button>
                      </Link>

                      {profile.isConnected ? (
                        <span className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 shadow-sm">
                          <Check size={14} /> Connected
                        </span>
                      ) : profile.connectionStatus === 'pending_sent' ? (
                        <span className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-gray-100 dark:bg-dark-700 text-gray-500">
                          Request Sent
                        </span>
                      ) : (
                        <Button size="md" variant="secondary" onClick={handleConnectOther} loading={connectLoading}>
                          <UserPlus size={15} /> Connect
                        </Button>
                      )}

                      {profile.role === 'alumni' && (
                        profile.mentorshipStatus === 'accepted' ? (
                          <span className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center gap-1.5">
                            <Check size={14} /> Active Mentor
                          </span>
                        ) : profile.mentorshipStatus === 'pending' ? (
                          <span className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-gray-100 dark:bg-dark-700 text-gray-500">
                            Mentorship Pending
                          </span>
                        ) : (
                          <Button size="md" variant="ghost" onClick={handleMentorOther} loading={mentorLoading}>
                            <Target size={15} /> Request Mentorship
                          </Button>
                        )
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Subtitle Tags: Location, Company, Course, Graduation Year */}
          <div className="flex flex-wrap items-center gap-y-1.5 gap-x-5 mt-4 text-xs text-gray-500 dark:text-dark-400">
            {profile.course && (
              <span className="flex items-center gap-1.5 font-medium text-primary-600 dark:text-primary-400">
                <GraduationCap size={15} /> {profile.course}
              </span>
            )}
            {profile.company && (
              <span className="flex items-center gap-1.5">
                <Building size={14} /> {profile.company}
              </span>
            )}
            {profile.location && (
              <span className="flex items-center gap-1.5">
                <MapPin size={14} /> {profile.location}
              </span>
            )}
            {profile.graduationYear && (
              <span className="flex items-center gap-1.5">
                <Calendar size={14} /> Class of {profile.graduationYear}
              </span>
            )}
          </div>

          {/* Quick Metrics Bar */}
          <div className="mt-4 pt-4 border-t border-gray-100 dark:border-dark-700/70 flex flex-wrap items-center gap-6 text-xs text-gray-500 dark:text-dark-400">
            <span className="font-medium text-dark-900 dark:text-white">
              <strong className="text-primary-600 dark:text-primary-400 text-sm mr-1">
                {profile.connections?.length || 0}
              </strong>{' '}
              Connections
            </span>
            <span>•</span>
            <span>
              <strong className="text-dark-900 dark:text-white font-semibold mr-1">
                {profile.experience || 0}
              </strong>{' '}
              Years Experience
            </span>
            <span>•</span>
            <span>
              <strong className="text-dark-900 dark:text-white font-semibold mr-1">
                {profile.profileViews || 0}
              </strong>{' '}
              Profile Views
            </span>
          </div>
        </div>
      </div>

      {/* Main Profile Grid: Left 2 Cols + Right 1 Col */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* About / Bio */}
          <Card>
            <h2 className="text-base font-bold text-dark-900 dark:text-white mb-2.5 flex items-center gap-2">
              <Sparkles size={18} className="text-primary-500" /> About
            </h2>
            <p className="text-gray-600 dark:text-dark-300 text-sm leading-relaxed whitespace-pre-line">
              {profile.bio || 'No bio added yet. Click Edit Profile to introduce yourself to alumni and students!'}
            </p>
          </Card>

          {/* Skills & Expertise */}
          <Card>
            <h2 className="text-base font-bold text-dark-900 dark:text-white mb-3 flex items-center gap-2">
              <Award size={18} className="text-amber-500" /> Skills & Domain Expertise
            </h2>
            <div className="flex flex-wrap gap-2">
              {profile.skills && profile.skills.length > 0 ? (
                profile.skills.map((s, i) => (
                  <Badge key={s} color={['primary', 'purple', 'pink', 'green', 'amber'][i % 5]}>
                    {s}
                  </Badge>
                ))
              ) : (
                <p className="text-gray-400 text-xs">No skills listed yet.</p>
              )}
            </div>
          </Card>

          {/* Background Information */}
          <Card>
            <h2 className="text-base font-bold text-dark-900 dark:text-white mb-3 flex items-center gap-2">
              <Briefcase size={18} className="text-purple-500" /> Background & Career Details
            </h2>
            <div className="grid sm:grid-cols-2 gap-4 text-sm">
              <div className="p-3.5 rounded-xl bg-gray-50/70 dark:bg-dark-800/40 border border-gray-100 dark:border-dark-700/60">
                <p className="text-xs text-gray-400 mb-0.5">Current Organization / Employer</p>
                <p className="font-semibold text-dark-900 dark:text-white">{profile.company || 'Not specified'}</p>
              </div>

              <div className="p-3.5 rounded-xl bg-gray-50/70 dark:bg-dark-800/40 border border-gray-100 dark:border-dark-700/60">
                <p className="text-xs text-gray-400 mb-0.5">Industry Domain</p>
                <p className="font-semibold text-dark-900 dark:text-white">{profile.industry || 'Technology'}</p>
              </div>

              <div className="p-3.5 rounded-xl bg-gray-50/70 dark:bg-dark-800/40 border border-gray-100 dark:border-dark-700/60">
                <p className="text-xs text-gray-400 mb-0.5">Academic Degree / Major</p>
                <p className="font-semibold text-dark-900 dark:text-white">{profile.course || 'Not specified'}</p>
              </div>

              <div className="p-3.5 rounded-xl bg-gray-50/70 dark:bg-dark-800/40 border border-gray-100 dark:border-dark-700/60">
                <p className="text-xs text-gray-400 mb-0.5">Location / Base</p>
                <p className="font-semibold text-dark-900 dark:text-white">{profile.location || 'Global / Remote'}</p>
              </div>
            </div>
          </Card>

          {/* Active Mentorships (If Own Profile) */}
          {isOwnProfile && mentorships.length > 0 && (
            <Card>
              <h2 className="text-base font-bold text-dark-900 dark:text-white mb-3 flex items-center gap-2">
                <CheckCircle2 size={18} className="text-emerald-500" /> Active Mentorship Connections
              </h2>
              <div className="space-y-3">
                {mentorships.map((m) => {
                  const other = (m.from?._id || m.from) === currentId ? m.to : m.from;
                  return (
                    <div
                      key={m._id}
                      className="flex items-center gap-3 p-3 rounded-xl bg-gray-50/70 dark:bg-dark-800/40 border border-gray-100 dark:border-dark-700"
                    >
                      <Avatar src={other?.avatar} name={other?.name} size="md" />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-dark-900 dark:text-white truncate">{other?.name}</p>
                        <p className="text-xs text-gray-400 truncate">{other?.headline}</p>
                      </div>
                      <Badge color="green" size="sm">
                        Active
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}
        </div>

        {/* Right Column: Profile Strength & Quick Stats */}
        <div className="space-y-6">
          <Card>
            <h3 className="font-bold text-dark-900 dark:text-white text-sm mb-3">Profile Completeness</h3>
            <ProgressBar value={profile.profileStrength || 65} />
            <p className="text-xs text-gray-500 dark:text-dark-400 mt-2.5 leading-relaxed">
              Complete your bio, company, headline, and add key skills to boost your visibility to recruiters and mentors.
            </p>
          </Card>

          <Card>
            <h3 className="font-bold text-dark-900 dark:text-white text-sm mb-3">Account Overview</h3>
            <div className="space-y-3 divide-y divide-gray-100 dark:divide-dark-800 text-sm">
              <div className="flex justify-between pt-1">
                <span className="text-gray-500">Email Address</span>
                <span className="font-medium text-dark-900 dark:text-white text-xs truncate max-w-[170px]">
                  {profile.email}
                </span>
              </div>
              <div className="flex justify-between pt-2.5">
                <span className="text-gray-500">Account Role</span>
                <span className="font-semibold text-primary-500 capitalize">{profile.role}</span>
              </div>
              <div className="flex justify-between pt-2.5">
                <span className="text-gray-500">Network Connections</span>
                <span className="font-semibold text-dark-900 dark:text-white">{profile.connections?.length || 0}</span>
              </div>
              <div className="flex justify-between pt-2.5">
                <span className="text-gray-500">Total Views</span>
                <span className="font-semibold text-dark-900 dark:text-white">{profile.profileViews || 0}</span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Edit Profile Modal */}
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Edit Profile Details" maxWidth="max-w-2xl">
        <form onSubmit={handleSaveProfile} className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
          <div className="grid sm:grid-cols-2 gap-4">
            <Input
              label="Full Name *"
              value={editForm.name || ''}
              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              required
            />
            <Input
              label="Headline / Professional Title"
              placeholder="e.g. Senior Software Engineer at Google"
              value={editForm.headline || ''}
              onChange={(e) => setEditForm({ ...editForm, headline: e.target.value })}
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-dark-700 dark:text-dark-300">Bio / Summary</label>
            <textarea
              className="input-field min-h-[90px] resize-none text-sm"
              placeholder="Tell others about your background, career focus, and interests..."
              value={editForm.bio || ''}
              onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <Input
              label="Current Company / University"
              placeholder="e.g. Tesla, Google, IIT Madras"
              value={editForm.company || ''}
              onChange={(e) => setEditForm({ ...editForm, company: e.target.value })}
            />
            <Input
              label="Location"
              placeholder="e.g. San Francisco, USA or Bangalore, India"
              value={editForm.location || ''}
              onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <Input
              label="Degree / Major"
              placeholder="e.g. B.Tech Computer Science"
              value={editForm.course || ''}
              onChange={(e) => setEditForm({ ...editForm, course: e.target.value })}
            />
            <Input
              label="Industry"
              placeholder="e.g. Technology, Automotive, Construction"
              value={editForm.industry || ''}
              onChange={(e) => setEditForm({ ...editForm, industry: e.target.value })}
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <Input
              label="Years of Experience"
              type="number"
              min="0"
              value={editForm.experience || 0}
              onChange={(e) => setEditForm({ ...editForm, experience: parseInt(e.target.value) || 0 })}
            />
            <Input
              label="Graduation Year"
              type="number"
              placeholder="e.g. 2024"
              value={editForm.graduationYear || ''}
              onChange={(e) => setEditForm({ ...editForm, graduationYear: parseInt(e.target.value) || '' })}
            />
          </div>

          <Input
            label="Avatar Image URL (Optional)"
            placeholder="https://example.com/your-photo.jpg"
            value={editForm.avatar || ''}
            onChange={(e) => setEditForm({ ...editForm, avatar: e.target.value })}
          />

          {/* Skill Selector */}
          <div className="space-y-2 pt-2">
            <label className="block text-sm font-medium text-dark-700 dark:text-dark-300">
              Select Skills (Click to toggle)
            </label>
            <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-1.5 rounded-xl border border-gray-100 dark:border-dark-700">
              {SKILLS_OPTIONS.map((skill) => (
                <button
                  key={skill}
                  type="button"
                  onClick={() => toggleSkill(skill)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                    editForm.skills?.includes(skill)
                      ? 'bg-gradient-primary text-white shadow-sm'
                      : 'bg-gray-100 dark:bg-dark-700 text-gray-700 dark:text-dark-300 hover:bg-gray-200'
                  }`}
                >
                  {skill}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-gray-100 dark:border-dark-700">
            <Button variant="secondary" onClick={() => setShowEditModal(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={saving} variant="primary">
              <Save size={16} /> Save Changes
            </Button>
          </div>
        </form>
      </Modal>

      {/* Password Change Modal */}
      <Modal isOpen={showPasswordModal} onClose={() => setShowPasswordModal(false)} title="Change Password" maxWidth="max-w-md">
        <form onSubmit={handleChangePassword} className="space-y-4">
          <Input
            label="Current Password *"
            type="password"
            value={passwordForm.currentPassword}
            onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
            placeholder="••••••••"
            required
          />
          <Input
            label="New Password *"
            type="password"
            value={passwordForm.newPassword}
            onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
            placeholder="Minimum 6 characters"
            required
          />
          <Input
            label="Confirm New Password *"
            type="password"
            value={passwordForm.confirmPassword}
            onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
            placeholder="Re-enter new password"
            required
          />
          <Button type="submit" loading={passwordLoading} className="w-full" size="lg">
            Update Password
          </Button>
        </form>
      </Modal>
    </div>
  );
}
