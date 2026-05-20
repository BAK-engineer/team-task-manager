import React, { useState, useEffect } from 'react';
import { X, Calendar, Flag, Settings, Info, Users } from 'lucide-react';
import api from '../utils/api';
import Spinner from './Spinner';

const ProjectModal = ({ project = null, onClose, onSuccess }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [status, setStatus] = useState('Planning');
  const [selectedMembers, setSelectedMembers] = useState([]);
  
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Populate form if editing
    if (project) {
      setTitle(project.title);
      setDescription(project.description);
      // Format deadline date to YYYY-MM-DD
      const formattedDate = project.deadline ? new Date(project.deadline).toISOString().split('T')[0] : '';
      setDeadline(formattedDate);
      setPriority(project.priority);
      setStatus(project.status);
      setSelectedMembers(project.teamMembers.map(m => m._id));
    }

    // Fetch users for assignment checklist
    const fetchUsers = async () => {
      try {
        setLoadingUsers(true);
        const { data } = await api.get('/users');
        setUsers(data);
      } catch (err) {
        console.error(err);
        setError('Failed to fetch user list');
      } finally {
        setLoadingUsers(false);
      }
    };

    fetchUsers();
  }, [project]);

  const handleMemberToggle = (userId) => {
    setSelectedMembers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!title || !description || !deadline) {
      setError('Please fill in title, description and deadline');
      return;
    }

    setSaving(true);
    const projectData = {
      title,
      description,
      deadline,
      priority,
      status,
      teamMembers: selectedMembers,
    };

    try {
      if (project) {
        // Edit existing project
        await api.put(`/projects/${project._id}`, projectData);
      } else {
        // Create new project
        await api.post('/projects', projectData);
      }
      onSuccess();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to save project');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      {/* Modal Card */}
      <div className="bg-white dark:bg-slate-950 w-full max-w-xl rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-zoom-in my-8 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800/60">
          <h3 className="font-extrabold text-lg text-slate-850 dark:text-white">
            {project ? 'Edit Project Details' : 'Create New Project'}
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {error && (
            <div className="p-3.5 rounded-xl border border-rose-250/20 bg-rose-50/20 dark:bg-rose-950/20 text-rose-500 text-xs font-semibold leading-relaxed">
              {error}
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Project Title
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Redesign Mobile App UI"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white text-sm font-semibold focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Description
            </label>
            <textarea
              required
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide context, goals, and project scope..."
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white text-sm font-semibold focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all"
            />
          </div>

          {/* Grid Rows for Dates, Priority, Status */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Deadline */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" /> Deadline
              </label>
              <input
                type="date"
                required
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white text-sm font-semibold focus:outline-none focus:border-primary-500 transition-all"
              />
            </div>

            {/* Priority */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Flag className="w-3.5 h-3.5" /> Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white text-sm font-semibold focus:outline-none focus:border-primary-500 transition-all"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Settings className="w-3.5 h-3.5" /> Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white text-sm font-semibold focus:outline-none focus:border-primary-500 transition-all"
              >
                <option value="Planning">Planning</option>
                <option value="Active">Active</option>
                <option value="On Hold">On Hold</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
          </div>

          {/* Team Members List Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" /> Team Members Assignment
            </label>
            {loadingUsers ? (
              <div className="py-4">
                <Spinner size="sm" />
              </div>
            ) : (
              <div className="border border-slate-200 dark:border-slate-800/80 rounded-xl max-h-40 overflow-y-auto divide-y divide-slate-105 dark:divide-slate-850 p-2 space-y-1">
                {users.map((userObj) => (
                  <label
                    key={userObj._id}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900 cursor-pointer text-sm"
                  >
                    <input
                      type="checkbox"
                      checked={selectedMembers.includes(userObj._id)}
                      onChange={() => handleMemberToggle(userObj._id)}
                      className="rounded border-slate-350 dark:border-slate-700 text-primary-500 focus:ring-primary-500 h-4 w-4"
                    />
                    <div className="w-6.5 h-6.5 rounded-full bg-primary-100 dark:bg-primary-950 text-[10px] font-black text-primary-600 flex items-center justify-center overflow-hidden">
                      {userObj.avatar ? (
                        <img src={userObj.avatar} alt={userObj.name} className="w-full h-full object-cover" />
                      ) : (
                        userObj.name.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="font-semibold text-slate-805 dark:text-slate-200 block truncate leading-tight">
                        {userObj.name}
                      </span>
                      <span className="text-[10px] text-slate-400 block tracking-wide capitalize font-medium">
                        {userObj.email} - {userObj.role}
                      </span>
                    </div>
                  </label>
                ))}
                {users.length === 0 && (
                  <p className="text-center py-4 text-xs font-semibold text-slate-400">
                    No users available to assign.
                  </p>
                )}
              </div>
            )}
          </div>
        </form>

        {/* Actions Footer */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/30 flex items-center justify-end gap-3.5">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-850 hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-600 dark:text-slate-300 text-sm font-semibold transition-all disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="px-5 py-2.5 rounded-xl bg-primary-500 hover:bg-primary-600 text-white text-sm font-bold shadow-md shadow-primary-500/10 hover:shadow-primary-500/25 active:scale-[0.98] transition-all flex items-center gap-2"
          >
            {saving ? <Spinner size="sm" color="white" /> : project ? 'Save Changes' : 'Create Project'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProjectModal;
