import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, Briefcase } from 'lucide-react';
import { getOpportunities, createOpportunity } from '../services/opportunityService';
import { useAuth } from '../context/AuthContext';
import OpportunityCard from '../components/OpportunityCard';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { SkeletonCard } from '../components/ui/Skeleton';
import toast from 'react-hot-toast';

export default function OpportunitiesPage() {
  const { user } = useAuth();
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    title: '', company: '', description: '', type: 'job', skills: '', location: '', salary: '', deadline: ''
  });

  useEffect(() => {
    const timer = setTimeout(fetchOpportunities, 300);
    return () => clearTimeout(timer);
  }, [search, typeFilter]);

  const fetchOpportunities = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (typeFilter) params.type = typeFilter;
      const { data } = await getOpportunities(params);
      setOpportunities(data.opportunities || []);
    } catch {
      toast.error('Failed to load opportunities');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.company.trim() || !form.description.trim()) {
      toast.error('Please fill required fields (Title, Company, Description)');
      return;
    }
    setCreating(true);
    try {
      const skillsArray = form.skills
        ? form.skills.split(',').map(s => s.trim()).filter(Boolean)
        : [];

      await createOpportunity({
        ...form,
        skills: skillsArray,
        deadline: form.deadline ? new Date(form.deadline) : undefined,
      });

      toast.success('Opportunity posted successfully!');
      setShowCreate(false);
      setForm({ title: '', company: '', description: '', type: 'job', skills: '', location: '', salary: '', deadline: '' });
      fetchOpportunities();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to post opportunity');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-dark-900 dark:text-white flex items-center gap-2">
            <Briefcase size={26} className="text-primary-500" /> Career Opportunities
          </h1>
          <p className="text-gray-500 dark:text-dark-400 mt-1">Explore job openings, internships, and freelance projects posted by verified alumni</p>
        </div>
        {(user?.role === 'alumni' || user?.role === 'admin') && (
          <Button onClick={() => setShowCreate(true)} size="md" className="shrink-0">
            <Plus size={18} /> Post Opportunity
          </Button>
        )}
      </motion.div>

      <div className="glass rounded-2xl p-5 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search by role title, company, or keywords..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-10"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {['', 'job', 'internship', 'freelance'].map(t => (
            <Badge
              key={t || 'all'}
              color={typeFilter === t ? 'primary' : 'gray'}
              size="md"
              className="cursor-pointer"
              onClick={() => setTypeFilter(t)}
            >
              {t ? t.charAt(0).toUpperCase() + t.slice(1) : 'All Opportunities'}
            </Badge>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 gap-4">{[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}</div>
      ) : opportunities.length === 0 ? (
        <div className="text-center py-16 glass rounded-2xl">
          <Briefcase className="mx-auto mb-3 text-gray-300" size={48} />
          <p className="text-gray-500 text-lg">No opportunities found</p>
          <p className="text-gray-400 text-sm mt-1">Try adjusting your filters or post a new opportunity</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {opportunities.map(opp => (
            <OpportunityCard key={opp._id} opportunity={opp} onUpdate={fetchOpportunities} />
          ))}
        </div>
      )}

      {/* Post Opportunity Modal */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Post Opportunity" maxWidth="max-w-xl">
        <form onSubmit={handleCreate} className="space-y-4">
          <Input label="Role / Job Title *" placeholder="e.g. Senior Frontend Engineer" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          <Input label="Company Name *" placeholder="e.g. Google, Microsoft, Startup" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} required />
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-dark-700 dark:text-dark-300">Job Description *</label>
            <textarea
              className="input-field min-h-[100px] resize-none text-sm"
              placeholder="Outline role responsibilities, team, and requirements..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-dark-700 dark:text-dark-300">Opportunity Type</label>
              <select className="input-field text-sm" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                <option value="job">Full-time Job</option>
                <option value="internship">Internship</option>
                <option value="freelance">Freelance Contract</option>
              </select>
            </div>
            <Input label="Location" placeholder="e.g. Remote, Bangalore, San Francisco" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Compensation / Salary" placeholder="e.g., ₹18-25 LPA or $90,000/yr" value={form.salary} onChange={(e) => setForm({ ...form, salary: e.target.value })} />
            <Input label="Deadline" type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} />
          </div>
          <Input label="Skills Required (comma separated)" placeholder="React, Node.js, TypeScript" value={form.skills} onChange={(e) => setForm({ ...form, skills: e.target.value })} />
          <Button type="submit" loading={creating} className="w-full mt-2" size="lg">Publish Opportunity 🚀</Button>
        </form>
      </Modal>
    </div>
  );
}
