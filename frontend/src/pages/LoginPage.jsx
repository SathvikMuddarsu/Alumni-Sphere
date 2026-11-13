import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, ArrowRight, CheckSquare, Square, Info } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.email.trim()) e.email = 'Email is required';
    if (!form.password) e.password = 'Password is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await login(form.email.trim(), form.password, rememberMe);
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const [demoLoadingRole, setDemoLoadingRole] = useState(null);

  const DEMO_ACCOUNTS = [
    { label: 'Student Demo', email: 'arjun@student.com', role: 'Student (CSE)', inst: 'IIT Madras' },
    { label: 'Alumni Demo', email: 'priya@alumni.com', role: 'Staff Eng (Google)', inst: 'Alumni 2016' },
    { label: 'IIT Student', email: 'aarav.sharma@student.edu', role: 'B.Tech AI', inst: 'IIT Bombay' },
    { label: 'IIT Alumni', email: 'gaurav.kapoor@alumni.com', role: 'Principal (NVIDIA)', inst: 'IIT Delhi' },
    { label: 'Executive Mentor', email: 'divya@alumni.com', role: 'Director (Meta)', inst: '12+ Yrs Exp' },
    { label: 'Admin Demo', email: 'admin@alumnisphere.com', role: 'Platform Admin', inst: 'Superuser' },
  ];

  const handleQuickDemoLogin = async (email, label) => {
    setDemoLoadingRole(label);
    try {
      await login(email, 'password123', true);
      toast.success(`Logged in as ${label}`);
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Demo login failed');
    } finally {
      setDemoLoadingRole(null);
    }
  };

  const fillDemo = (email) => {
    setForm({ email, password: 'password123' });
    setErrors({});
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-primary relative overflow-hidden items-center justify-center p-12">
        <div className="absolute inset-0 opacity-10">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-white/20"
              style={{
                width: `${100 + i * 80}px`,
                height: `${100 + i * 80}px`,
                top: `${10 + i * 15}%`,
                left: `${5 + i * 12}%`,
                animation: `float ${4 + i}s ease-in-out infinite ${i * 0.5}s`,
              }}
            />
          ))}
        </div>
        <div className="relative text-white text-center z-10">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-lg flex items-center justify-center mx-auto mb-6 shadow-2xl">
              <span className="text-4xl font-bold">A</span>
            </div>
            <h1 className="text-4xl font-display font-bold mb-4">Welcome to AlumniSphere</h1>
            <p className="text-lg text-white/80 max-w-md">
              Connect with fellow alumni, find industry mentors, and discover career opportunities across engineering departments.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Right panel - form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 bg-gray-50 dark:bg-dark-950">
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="w-full max-w-md">
          <div className="lg:hidden mb-8 text-center">
            <div className="w-14 h-14 rounded-xl bg-gradient-primary flex items-center justify-center mx-auto mb-3">
              <span className="text-white font-bold text-2xl">A</span>
            </div>
            <h2 className="font-display font-bold text-2xl gradient-text">AlumniSphere</h2>
          </div>

          <h2 className="text-3xl font-display font-bold text-dark-900 dark:text-white mb-2">Sign In</h2>
          <p className="text-gray-500 dark:text-dark-400 mb-8">Enter your credentials to access your account</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email Address"
              type="email"
              icon={Mail}
              placeholder="you@example.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              error={errors.email}
              autoComplete="username"
            />
            <Input
              label="Password"
              type="password"
              icon={Lock}
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              error={errors.password}
              autoComplete="current-password"
            />

            <div className="flex items-center justify-between text-sm pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none text-dark-700 dark:text-dark-300">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                Remember Me
              </label>

              <button
                type="button"
                onClick={() => toast('To reset password, contact platform administrator or use Profile Settings once logged in.', { icon: 'ℹ️' })}
                className="text-primary-500 hover:text-primary-600 font-medium"
              >
                Forgot Password?
              </button>
            </div>

            <Button type="submit" loading={loading} className="w-full mt-2" size="lg">
              Sign In <ArrowRight size={18} />
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500 dark:text-dark-400">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary-500 hover:text-primary-600 font-semibold">
              Create Account
            </Link>
          </p>

          {/* Quick One-Click Demo Logins */}
          <div className="mt-6 p-4 rounded-2xl bg-primary-50/70 dark:bg-primary-950/40 border border-primary-100 dark:border-primary-900/40 text-xs shadow-sm">
            <div className="flex items-center justify-between mb-2.5">
              <p className="font-semibold text-primary-800 dark:text-primary-300 flex items-center gap-1.5 text-xs">
                <Info size={14} className="text-primary-600" /> One-Click Interactive Demo Logins:
              </p>
              <span className="text-[10px] text-gray-400 font-mono">pwd: password123</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {DEMO_ACCOUNTS.map((acc) => (
                <button
                  key={acc.email}
                  type="button"
                  disabled={loading || !!demoLoadingRole}
                  onClick={() => handleQuickDemoLogin(acc.email, acc.label)}
                  className={`p-2 rounded-xl bg-white dark:bg-dark-800 border text-left transition-all relative overflow-hidden group shadow-xs hover:border-primary-500 hover:shadow-md ${
                    demoLoadingRole === acc.label
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-gray-200 dark:border-dark-700'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <p className="font-bold text-dark-900 dark:text-white text-[11px] truncate">{acc.label}</p>
                    {demoLoadingRole === acc.label && (
                      <span className="w-2.5 h-2.5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin shrink-0" />
                    )}
                  </div>
                  <p className="text-[10px] text-primary-600 dark:text-primary-400 font-medium truncate">{acc.role}</p>
                  <p className="text-[9px] text-gray-400 truncate">{acc.inst}</p>
                </button>
              ))}
            </div>
            <p className="mt-2 text-center text-gray-400 text-[10px]">
              Click any profile above to instantly authenticate with full platform privileges
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
