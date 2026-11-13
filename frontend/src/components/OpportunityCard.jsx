import { useState } from 'react';
import { MapPin, Bookmark, BookmarkCheck, Trash2 } from 'lucide-react';
import Badge from './ui/Badge';
import Button from './ui/Button';
import { saveOpportunity, applyOpportunity, deleteOpportunity } from '../services/opportunityService';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const typeColors = { job: 'primary', internship: 'purple', freelance: 'green', volunteer: 'amber' };

export default function OpportunityCard({ opportunity, onUpdate }) {
  const { user } = useAuth();
  const currentUserId = (user?.id || user?._id)?.toString();
  const posterId = (opportunity.postedBy?._id || opportunity.postedBy)?.toString();

  const isOwner = currentUserId && posterId && currentUserId === posterId;
  const isAdmin = user?.role === 'admin';

  const [saved, setSaved] = useState(
    opportunity.savedBy?.some((id) => (id._id || id).toString() === currentUserId)
  );
  const [applied, setApplied] = useState(
    opportunity.applicants?.some((id) => (id._id || id).toString() === currentUserId)
  );
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleSave = async () => {
    try {
      const { data } = await saveOpportunity(opportunity._id);
      setSaved(data.saved);
      toast.success(data.saved ? 'Opportunity saved!' : 'Removed from bookmarks');
    } catch {
      toast.error('Failed to update bookmark');
    }
  };

  const handleApply = async () => {
    setLoading(true);
    try {
      await applyOpportunity(opportunity._id);
      setApplied(true);
      toast.success('Application submitted successfully!');
      onUpdate?.();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit application');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete "${opportunity.title}"?`)) return;
    setDeleting(true);
    try {
      await deleteOpportunity(opportunity._id);
      toast.success('Opportunity deleted');
      onUpdate?.();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete opportunity');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="glass rounded-2xl p-5 card-hover flex flex-col justify-between transform-gpu will-change-transform">
      <div>
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge color={typeColors[opportunity.type] || 'primary'} size="sm">
                {opportunity.type?.charAt(0).toUpperCase() + opportunity.type?.slice(1)}
              </Badge>
              {opportunity.deadline && (
                <span className="text-[11px] text-gray-400">
                  Due {new Date(opportunity.deadline).toLocaleDateString()}
                </span>
              )}
            </div>
            <h3 className="font-bold text-dark-900 dark:text-white text-lg">{opportunity.title}</h3>
            <p className="text-sm text-primary-600 dark:text-primary-400 font-medium">{opportunity.company}</p>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={handleSave}
              className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-dark-700 transition-colors"
              title={saved ? 'Remove bookmark' : 'Bookmark opportunity'}
            >
              {saved ? (
                <BookmarkCheck size={20} className="text-primary-500" />
              ) : (
                <Bookmark size={20} className="text-gray-400 hover:text-dark-900 dark:hover:text-white" />
              )}
            </button>
            {(isOwner || isAdmin) && (
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="p-2 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
                title="Delete opportunity"
              >
                <Trash2 size={18} />
              </button>
            )}
          </div>
        </div>

        <p className="mt-2.5 text-sm text-gray-600 dark:text-dark-300 line-clamp-3 leading-relaxed">
          {opportunity.description}
        </p>

        <div className="mt-3.5 flex flex-wrap items-center gap-2 text-xs text-gray-500">
          {opportunity.location && (
            <span className="flex items-center gap-1">
              <MapPin size={12} />
              {opportunity.location}
            </span>
          )}
          {opportunity.salary && (
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
              💰 {opportunity.salary}
            </span>
          )}
        </div>

        {opportunity.skills?.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {opportunity.skills.map((s) => (
              <Badge key={s} color="gray" size="sm">
                {s}
              </Badge>
            ))}
          </div>
        )}
      </div>

      <div className="mt-5 flex gap-2">
        <Button
          onClick={handleApply}
          loading={loading}
          disabled={applied}
          size="sm"
          className="flex-1"
          variant={applied ? 'secondary' : 'primary'}
        >
          {applied ? '✓ Already Applied' : 'Apply Now'}
        </Button>
      </div>
    </div>
  );
}
