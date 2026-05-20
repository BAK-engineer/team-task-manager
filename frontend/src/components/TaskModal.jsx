import React, { useState, useEffect } from 'react';
import { X, Calendar, Flag, User, Info, Settings } from 'lucide-react';
import Spinner from './Spinner';

const TaskModal = ({ task = null, project, onClose, onSuccess, saving }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [status, setStatus] = useState('Pending');
  const [assignedTo, setAssignedTo] = useState('');

  const [error, setError] = useState('');

  // Assemble list of eligible assignees (project creator + project team members)
  const assignees = project 
    ? [project.createdBy, ...project.teamMembers].filter(
        (val, idx, self) => self.findIndex(t => t._id === val._id) === idx
      )
    : [];

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || '');
      const formattedDate = task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '';
      setDueDate(formattedDate);
      setPriority(task.priority);
      setStatus(task.status);
      setAssignedTo(task.assignedTo ? task.assignedTo._id : '');
    }
  }, [task]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!title || !dueDate) {
      setError('Please include task title and due date');
      return;
    }

    const taskData = {
      title,
      description,
      dueDate,
      priority,
      status,
      assignedTo: assignedTo || null,
      projectId: project._id,
    };

    onSuccess(taskData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-950 w-full max-w-lg rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-zoom-in my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800/60">
          <h3 className="font-extrabold text-base text-slate-850 dark:text-white">
            {task ? 'Edit Task Details' : 'Create New Task'}
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3.5 rounded-xl border border-rose-250/20 bg-rose-50/20 dark:bg-rose-950/20 text-rose-500 text-xs font-semibold leading-relaxed">
              {error}
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Task Name
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Write API endpoints for Tasks"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white text-sm font-semibold focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Description
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide clear directions or checklist..."
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white text-sm font-semibold focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all"
            />
          </div>

          {/* Grid for Date, Priority, Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Due Date */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" /> Due Date
              </label>
              <input
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
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
          </div>

          {/* Grid for Assignee & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Assignee Selection */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" /> Assign To
              </label>
              <select
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white text-sm font-semibold focus:outline-none focus:border-primary-500 transition-all"
              >
                <option value="">Unassigned</option>
                {assignees.map((assignee) => (
                  <option key={assignee._id} value={assignee._id}>
                    {assignee.name} ({assignee.role})
                  </option>
                ))}
              </select>
            </div>

            {/* Status Selection */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Settings className="w-3.5 h-3.5" /> Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white text-sm font-semibold focus:outline-none focus:border-primary-500 transition-all"
              >
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/30 flex items-center justify-end gap-3 -mx-6 -mb-6 px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-850 hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-600 dark:text-slate-300 text-sm font-semibold transition-all disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 rounded-xl bg-primary-500 hover:bg-primary-600 text-white text-sm font-bold shadow-md shadow-primary-500/10 hover:shadow-primary-500/25 active:scale-[0.98] transition-all flex items-center gap-2"
            >
              {saving ? <Spinner size="sm" color="white" /> : task ? 'Save Changes' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskModal;
