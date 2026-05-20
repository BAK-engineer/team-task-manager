import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FolderKanban, Mail, Lock, User, Shield, AlertCircle } from 'lucide-react';
import Spinner from '../components/Spinner';

const Signup = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Member');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name || !email || !password) {
      setError('Please fill in all fields');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      await signup(name, email, password, role);
      navigate('/dashboard');
    } catch (err) {
      setError(err || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-900 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.26),rgba(255,255,255,0))] px-6 py-12">
      <div className="w-full max-w-md glass-panel p-8 rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-primary-500/25 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-indigo-500/25 rounded-full blur-2xl pointer-events-none" />

        {/* Brand Header */}
        <div className="flex flex-col items-center mb-6">
          <div className="p-3 rounded-2xl bg-primary-500 text-white shadow-lg shadow-primary-500/25 mb-4">
            <FolderKanban className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-extrabold text-white text-center leading-tight">
            Create Account
          </h2>
          <p className="text-slate-400 text-sm mt-1 text-center font-medium">
            Get started with Team Task Manager
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-5 flex items-center gap-2.5 p-3.5 rounded-xl border border-rose-900/30 bg-rose-950/20 text-rose-300 text-xs font-semibold leading-relaxed animate-pulse-subtle">
            <AlertCircle className="w-4 h-4 text-rose-450 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Signup Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-350 uppercase tracking-wider mb-1.5">
              Full Name
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <User className="w-4.5 h-4.5" />
              </span>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Doe"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/40 border border-white/10 text-white placeholder-slate-500 text-sm font-semibold focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all duration-200"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-350 uppercase tracking-wider mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <Mail className="w-4.5 h-4.5" />
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jane@example.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/40 border border-white/10 text-white placeholder-slate-500 text-sm font-semibold focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all duration-200"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-350 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <Lock className="w-4.5 h-4.5" />
              </span>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min 6 characters"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/40 border border-white/10 text-white placeholder-slate-500 text-sm font-semibold focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all duration-200"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-350 uppercase tracking-wider mb-1.5">
              Organizational Role
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <Shield className="w-4.5 h-4.5" />
              </span>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white text-sm font-semibold focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all duration-200 appearance-none"
              >
                <option value="Member" className="bg-slate-950 text-white">Member (View & update assigned tasks)</option>
                <option value="Admin" className="bg-slate-950 text-white">Admin (Create projects & tasks)</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-primary-650 hover:bg-primary-600 disabled:bg-primary-800 disabled:cursor-not-allowed text-white text-sm font-bold shadow-lg shadow-primary-500/10 hover:shadow-primary-500/20 active:scale-[0.98] transition-all duration-200 mt-4 flex justify-center items-center gap-2"
          >
            {loading ? <Spinner size="sm" color="white" /> : 'Create Account'}
          </button>
        </form>

        <p className="mt-6 text-center text-xs font-medium text-slate-400">
          Already have an account?{' '}
          <Link
            to="/login"
            className="text-primary-400 hover:text-primary-350 font-bold hover:underline"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;
