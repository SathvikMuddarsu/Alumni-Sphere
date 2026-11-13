import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, GraduationCap, Briefcase, ArrowRight, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import toast from 'react-hot-toast';

const SKILLS_OPTIONS = [
  'React', 'Node.js', 'Python', 'JavaScript', 'TypeScript', 'Java', 'Machine Learning', 'UI/UX', 'Figma',
  'Data Analytics', 'SQL', 'MongoDB', 'AWS', 'Product Management', 'Agile', 'System Design', 'TensorFlow', 'Deep Learning',
  'AutoCAD', 'SolidWorks', 'Thermodynamics', 'VLSI Design', 'Embedded Systems', 'IoT', 'C++'
];

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'student',
    headline: '',
    course: '',
    skills: [],
    industry: '',
    graduationYear: '',
  });

  const handleSkillToggle = (skill) => {
    setForm(prev => ({
      ...prev,
      skills: prev.skills.includes(skill) ? prev.skills.filter(s => s !== skill) : [...prev.skills, skill],
    }));
  };

  const validateStep1 = () => {
    if (!form.name.trim() || !form.email.trim() || !form.password) {
      toast.error('Please fill all required fields');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email.trim())) {
      toast.error('Please enter a valid email address');
      return false;
    }
    if (form.password.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return false;
    }
    if (form.confirmPassword && form.password !== form.confirmPassword) {
      toast.error('Passwords do not match');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateStep1()) {
      setStep(1);
      return;
    }
    setLoading(true);
    try {
      await register({
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        role: form.role,
        headline: form.headline || `${form.role === 'alumni' ? 'Alumni' : 'Student'} at AlumniSphere`,
        course: form.course,
        skills: form.skills,
        industry: form.industry,
        graduationYear: form.graduationYear ? parseInt(form.graduationYear) : undefined,
      });
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-primary relative overflow-hidden items-center justify-center p-12">
        <div className="absolute inset-0 opacity-10">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="absolute rounded-full bg-white/20" style={{
              width: `${100 + i * 80}px`, height: `${100 + i * 80}px`,
              top: `${10 + i * 15}%`, left: `${5 + i * 12}%`,
              animation: `float ${4 + i}s ease-in-out infinite ${i * 0.5}s`
            }} />
          ))}
        </div>
        <div className="relative text-white text-center z-10">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-lg flex items-center justify-center mx-auto mb-6 shadow-2xl">
              <span className="text-4xl font-bold">A</span>
            </div>
            <h1 className="text-4xl font-display font-bold mb-4">Join AlumniSphere</h1>
            <p className="text-lg text-white/80 max-w-md">Connect with your university network, find experienced mentors, and accelerate your career.</p>
          </motion.div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 bg-gray-50 dark:bg-dark-950">
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="w-full max-w-md">
          <h2 className="text-3xl font-display font-bold text-dark-900 dark:text-white mb-2">Create Account</h2>
          <p className="text-gray-500 dark:text-dark-400 mb-6">Step {step} of 3</p>

          {/* Progress bar */}
          <div className="flex gap-2 mb-8">
            {[1, 2, 3].map(s => (
              <div key={s} className={`h-1.5 flex-1 rounded-full transition-all ${s <= step ? 'bg-gradient-primary' : 'bg-gray-200 dark:bg-dark-700'}`} />
            ))}
          </div>

          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                <Input
                  label="Full Name *"
                  icon={User}
                  placeholder="e.g. Alex Morgan"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
                <Input
                  label="Email Address *"
                  type="email"
                  icon={Mail}
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                />
                <Input
                  label="Password *"
                  type="password"
                  icon={Lock}
                  placeholder="Minimum 6 characters"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                />
                <Input
                  label="Confirm Password"
                  type="password"
                  icon={Lock}
                  placeholder="Re-enter password"
                  value={form.confirmPassword}
                  onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                />
                <Button onClick={() => { if (validateStep1()) setStep(2); }} className="w-full" size="lg">
                  Continue <ArrowRight size={18} />
                </Button>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
                <p className="text-sm font-medium text-dark-700 dark:text-dark-300">Select your role:</p>
                <div className="grid grid-cols-2 gap-4">
                  {[{ role: 'student', icon: GraduationCap, label: 'Student', desc: 'Seeking guidance & jobs' },
                    { role: 'alumni', icon: Briefcase, label: 'Alumni', desc: 'Working professional / mentor' }].map(({ role, icon: Icon, label, desc }) => (
                    <button key={role} type="button" onClick={() => setForm({ ...form, role })}
                      className={`p-5 rounded-2xl border-2 text-left transition-all ${form.role === role
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 shadow-glow'
                        : 'border-gray-200 dark:border-dark-700 hover:border-primary-300'}`}>
                      <Icon size={28} className={form.role === role ? 'text-primary-500' : 'text-gray-400'} />
                      <p className="mt-2 font-bold text-dark-900 dark:text-white">{label}</p>
                      <p className="text-xs text-gray-500">{desc}</p>
                    </button>
                  ))}
                </div>
                <Input label="Headline / Current Position" placeholder="e.g. Software Engineer at Google or CSE Undergrad" value={form.headline} onChange={(e) => setForm({ ...form, headline: e.target.value })} />
                <Input label="Course / Major" placeholder="e.g. B.Tech Computer Science" value={form.course} onChange={(e) => setForm({ ...form, course: e.target.value })} />
                <Input label="Graduation Year" type="number" placeholder="e.g. 2025" value={form.graduationYear} onChange={(e) => setForm({ ...form, graduationYear: e.target.value })} />
                <div className="flex gap-3">
                  <Button onClick={() => setStep(1)} variant="secondary" size="lg"><ArrowLeft size={18} /> Back</Button>
                  <Button onClick={() => setStep(3)} className="flex-1" size="lg">Continue <ArrowRight size={18} /></Button>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
                <p className="text-sm font-medium text-dark-700 dark:text-dark-300">Select skills (click to select/unselect)</p>
                <div className="flex flex-wrap gap-2 max-h-56 overflow-y-auto p-1">
                  {SKILLS_OPTIONS.map(skill => (
                    <button key={skill} type="button" onClick={() => handleSkillToggle(skill)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                        form.skills.includes(skill)
                          ? 'bg-gradient-primary text-white shadow-md'
                          : 'bg-gray-100 dark:bg-dark-700 text-dark-600 dark:text-dark-300 hover:bg-gray-200 dark:hover:bg-dark-600'}`}>
                      {skill}
                    </button>
                  ))}
                </div>
                <Input label="Industry" placeholder="e.g., Technology, Automotive, Construction" value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })} />
                <div className="flex gap-3">
                  <Button onClick={() => setStep(2)} variant="secondary" size="lg"><ArrowLeft size={18} /> Back</Button>
                  <Button onClick={handleSubmit} loading={loading} className="flex-1" size="lg">Complete Registration 🚀</Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <p className="mt-6 text-center text-sm text-gray-500 dark:text-dark-400">
            Already have an account? <Link to="/login" className="text-primary-500 hover:text-primary-600 font-semibold">Sign In</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
