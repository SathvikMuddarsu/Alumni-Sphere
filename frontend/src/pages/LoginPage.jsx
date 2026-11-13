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

          {/* Quick Demo Logins */}
          <div className="mt-6 p-4 rounded-2xl bg-primary-50/60 dark:bg-primary-950/40 border border-primary-100 dark:border-primary-900/30 text-xs">
            <p className="font-semibold text-primary-800 dark:text-primary-300 mb-2 flex items-center gap-1">
              <Info size={14} /> One-Click Demo Accounts:
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => fillDemo('admin@alumnisphere.com')}
                className="py-1.5 px-2 rounded-lg bg-white dark:bg-dark-800 font-medium text-dark-800 dark:text-dark-200 hover:border-primary-500 border border-gray-200 dark:border-dark-700 transition-all text-center"
              >
                Admin
              </button>
              <button
                type="button"
                onClick={() => fillDemo('priya@alumni.com')}
                className="py-1.5 px-2 rounded-lg bg-white dark:bg-dark-800 font-medium text-dark-800 dark:text-dark-200 hover:border-primary-500 border border-gray-200 dark:border-dark-700 transition-all text-center"
              >
                Alumni (Google)
              </button>
              <button
                type="button"
                onClick={() => fillDemo('arjun@student.com')}
                className="py-1.5 px-2 rounded-lg bg-white dark:bg-dark-800 font-medium text-dark-800 dark:text-dark-200 hover:border-primary-500 border border-gray-200 dark:border-dark-700 transition-all text-center"
              >
                Student (IIT)
              </button>
            </div>
            <p className="mt-2 text-center text-gray-400">Password for all demo accounts: <code>password123</code></p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
