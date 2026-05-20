import React, { useState, useEffect } from 'react';
import { User, Mail, Shield, Lock, Save, Camera } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import Spinner from '../components/Spinner';
import Toast from '../components/Toast';

const Profile = () => {
  const { user, updateProfile } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [avatar, setAvatar] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Preset Avatars
  const avatarPresets = [
    'https://api.dicebear.com/7.x/adventurer/svg?seed=Felix',
    'https://api.dicebear.com/7.x/adventurer/svg?seed=Aria',
    'https://api.dicebear.com/7.x/adventurer/svg?seed=Jack',
    'https://api.dicebear.com/7.x/adventurer/svg?seed=Milo',
    'https://api.dicebear.com/7.x/adventurer/svg?seed=Zoey',
    'https://api.dicebear.com/7.x/adventurer/svg?seed=Buster',
  ];

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
      setAvatar(user.avatar || '');
    }
  }, [user]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (password && password.length < 6) {
      showToast('New password must be at least 6 characters', 'error');
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      showToast('Passwords do not match', 'error');
      setLoading(false);
      return;
    }

    try {
      const updateData = { name, email, avatar };
      if (password) {
        updateData.password = password;
      }
      await updateProfile(updateData);
      showToast('Profile updated successfully');
      setPassword('');
      setConfirmPassword('');
    } catch (err) {
      console.error(err);
      showToast(err || 'Failed to update profile', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900 overflow-hidden">
      <Sidebar isOpen={sidebarOpen} toggleSidebar={setSidebarOpen} />

      <div className="flex-1 flex flex-col overflow-hidden lg:pl-64">
        <Navbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} title="Profile" />

        <main className="flex-1 overflow-y-auto px-6 py-8">
          <div className="max-w-3xl mx-auto">
            {/* Header description */}
            <div className="mb-8">
              <p className="text-sm font-semibold text-slate-400">
                Update your personal information, choose an avatar, and secure your account credentials
              </p>
            </div>

            {/* Profile Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column: Avatar selector */}
              <div className="lg:col-span-1 flex flex-col items-center">
                <div className="glass-card p-6 rounded-2xl w-full flex flex-col items-center text-center">
                  
                  {/* Current Avatar Bubble */}
                  <div className="relative group mb-5">
                    <div className="w-28 h-28 rounded-3xl bg-primary-100 dark:bg-primary-950/50 text-primary-650 text-3xl font-black flex items-center justify-center border-2 border-primary-200 dark:border-primary-900/30 overflow-hidden shadow-md">
                      {avatar ? (
                        <img src={avatar} alt={name} className="w-full h-full object-cover" />
                      ) : (
                        name.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 rounded-3xl flex items-center justify-center text-white transition-opacity duration-200 pointer-events-none">
                      <Camera className="w-6 h-6" />
                    </div>
                  </div>

                  <h3 className="font-extrabold text-slate-805 dark:text-white text-base">
                    {name}
                  </h3>
                  <span className="px-3 py-1 bg-primary-50 dark:bg-primary-950/40 text-primary-600 dark:text-primary-400 text-[10px] font-bold border border-primary-105/20 rounded-full mt-2 capitalize tracking-wide">
                    {user?.role} Role
                  </span>

                  {/* Preset Avatars Checklist */}
                  <div className="w-full border-t border-slate-100 dark:border-slate-800/60 pt-5 mt-5">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-3.5">
                      Choose Avatar Preset
                    </span>
                    <div className="grid grid-cols-3 gap-3">
                      {avatarPresets.map((preset, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setAvatar(preset)}
                          className={`w-12 h-12 rounded-xl bg-slate-50 dark:bg-slate-900 hover:scale-105 border transition-all overflow-hidden p-1 ${
                            avatar === preset 
                              ? 'border-primary-500 ring-2 ring-primary-500/20' 
                              : 'border-slate-200 dark:border-slate-800 hover:border-slate-350 dark:hover:border-slate-700'
                          }`}
                        >
                          <img src={preset} alt={`avatar-${idx}`} className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                    
                    {/* Custom Avatar Input */}
                    <div className="mt-4">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block text-left mb-1.5">
                        Or Paste Image URL
                      </label>
                      <input
                        type="url"
                        value={avatar}
                        onChange={(e) => setAvatar(e.target.value)}
                        placeholder="https://example.com/avatar.png"
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white text-xs font-semibold focus:outline-none focus:border-primary-500 transition-all"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Account Forms */}
              <div className="lg:col-span-2">
                <form onSubmit={handleSubmit} className="glass-card p-6 rounded-2xl space-y-6">
                  <h3 className="font-extrabold text-base text-slate-800 dark:text-white pb-3 border-b border-slate-100 dark:border-slate-850">
                    Account Details
                  </h3>

                  {/* Personal info fields */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Full Name */}
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <User className="w-4 h-4 text-slate-350 dark:text-slate-655" /> Full Name
                      </label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white text-sm font-semibold focus:outline-none focus:border-primary-500 transition-all"
                      />
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <Mail className="w-4 h-4 text-slate-350 dark:text-slate-655" /> Email Address
                      </label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white text-sm font-semibold focus:outline-none focus:border-primary-500 transition-all"
                      />
                    </div>
                  </div>

                  <h3 className="font-extrabold text-base text-slate-800 dark:text-white pt-4 pb-3 border-b border-slate-100 dark:border-slate-850">
                    Security Credentials
                  </h3>

                  {/* Password fields */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* New Password */}
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <Lock className="w-4 h-4 text-slate-350 dark:text-slate-655" /> New Password
                      </label>
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Leave blank to keep current"
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white text-sm font-semibold focus:outline-none focus:border-primary-500 transition-all"
                      />
                    </div>

                    {/* Confirm Password */}
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <Lock className="w-4 h-4 text-slate-350 dark:text-slate-655" /> Confirm Password
                      </label>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Leave blank to keep current"
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white text-sm font-semibold focus:outline-none focus:border-primary-500 transition-all"
                      />
                    </div>
                  </div>

                  {/* Save button */}
                  <div className="pt-4 flex justify-end">
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-5 py-3.5 rounded-xl bg-primary-500 hover:bg-primary-600 text-white text-sm font-bold shadow-md shadow-primary-500/10 hover:shadow-primary-500/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <Spinner size="sm" color="white" />
                      ) : (
                        <>
                          <Save className="w-4.5 h-4.5" /> Save Profile
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </main>
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};

export default Profile;
