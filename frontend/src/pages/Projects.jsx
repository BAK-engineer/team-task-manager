import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Calendar, 
  Flag, 
  Clock, 
  Users, 
  Search, 
  Filter,
  Edit2,
  Trash2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import Spinner from '../components/Spinner';
import Toast from '../components/Toast';
import ProjectModal from '../components/ProjectModal';
import { io } from 'socket.io-client';

const Projects = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  
  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  // Modals & Notifications
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [toast, setToast] = useState(null);

  const fetchProjectsAndTasks = async () => {
    try {
      setLoading(true);
      const [projRes, taskRes] = await Promise.all([
        api.get('/projects'),
        api.get('/tasks')
      ]);
      setProjects(projRes.data);
      setTasks(taskRes.data);
    } catch (err) {
      console.error(err);
      showToast('Failed to load projects details', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjectsAndTasks();

    // Setup Socket.io for real-time project updates
    const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
    const socket = io(socketUrl);

    socket.on('project_created', (newProj) => {
      setProjects((prev) => [newProj, ...prev]);
    });

    socket.on('project_updated', (updatedProj) => {
      setProjects((prev) => prev.map((p) => (p._id === updatedProj._id ? updatedProj : p)));
    });

    socket.on('project_deleted', (deletedId) => {
      setProjects((prev) => prev.filter((p) => p._id !== deletedId));
    });

    // Also update tasks in case status changes
    socket.on('task_created', (task) => {
      setTasks((prev) => [task, ...prev]);
    });
    socket.on('task_updated', (task) => {
      setTasks((prev) => prev.map((t) => (t._id === task._id ? task : t)));
    });
    socket.on('task_deleted', (taskId) => {
      setTasks((prev) => prev.filter((t) => t._id !== taskId));
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  const handleCreateNew = () => {
    setSelectedProject(null);
    setModalOpen(true);
  };

  const handleEdit = (project, e) => {
    e.stopPropagation(); // Avoid triggering card navigate
    setSelectedProject(project);
    setModalOpen(true);
  };

  const handleDelete = async (projectId, title, e) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete project "${title}" and all its tasks?`)) {
      try {
        await api.delete(`/projects/${projectId}`);
        showToast('Project deleted successfully', 'success');
        // socket will trigger deletion in list
      } catch (err) {
        console.error(err);
        showToast('Failed to delete project', 'error');
      }
    }
  };

  // Calculate project task progress
  const getProjectProgress = (projectId) => {
    const projTasks = tasks.filter((t) => t.projectId._id === projectId || t.projectId === projectId);
    if (projTasks.length === 0) return 0;
    const completed = projTasks.filter((t) => t.status === 'Completed').length;
    return Math.round((completed / projTasks.length) * 100);
  };

  const getProjectTasksCount = (projectId) => {
    const projTasks = tasks.filter((t) => t.projectId._id === projectId || t.projectId === projectId);
    return {
      total: projTasks.length,
      completed: projTasks.filter((t) => t.status === 'Completed').length,
    };
  };

  // Filter projects based on search & filters
  const filteredProjects = projects.filter((project) => {
    const matchesSearch = project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          project.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPriority = priorityFilter === 'All' || project.priority === priorityFilter;
    const matchesStatus = statusFilter === 'All' || project.status === statusFilter;

    return matchesSearch && matchesPriority && matchesStatus;
  });

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'High': return 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-900/30';
      case 'Medium': return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900/30';
      default: return 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/30 dark:text-sky-400 dark:border-sky-900/30';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed': return 'bg-emerald-50 text-emerald-700 border-emerald-250 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/30';
      case 'Active': return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900/30';
      case 'On Hold': return 'bg-slate-100 text-slate-700 border-slate-350 dark:bg-slate-900/60 dark:text-slate-400 dark:border-slate-800';
      default: return 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/30 dark:text-purple-400 dark:border-purple-900/30'; // Planning
    }
  };

  const isAdmin = user?.role === 'Admin';

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900 overflow-hidden">
      <Sidebar isOpen={sidebarOpen} toggleSidebar={setSidebarOpen} />

      <div className="flex-1 flex flex-col overflow-hidden lg:pl-64">
        <Navbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} title="Projects" />

        <main className="flex-1 overflow-y-auto px-6 py-8">
          {/* Header Action Row */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <p className="text-sm font-semibold text-slate-400">
                Manage team projects, track progress, and assign members
              </p>
            </div>
            {isAdmin && (
              <button
                onClick={handleCreateNew}
                className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-primary-500 hover:bg-primary-600 active:scale-[0.98] text-white text-sm font-bold shadow-md shadow-primary-500/10 hover:shadow-primary-500/25 transition-all duration-200"
              >
                <Plus className="w-5 h-5" /> New Project
              </button>
            )}
          </div>

          {/* Search and Filters Bar */}
          <div className="glass-card p-4 rounded-2xl mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Search className="w-4.5 h-4.5" />
              </span>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search projects..."
                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white placeholder-slate-400 text-sm font-semibold focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all duration-200"
              />
            </div>

            {/* Filters */}
            <div className="flex items-center gap-3 self-end md:self-auto">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-slate-400" />
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider hidden sm:inline">Filters:</span>
              </div>
              
              {/* Priority Filter */}
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold focus:outline-none focus:border-primary-500 transition-all duration-200"
              >
                <option value="All">Priority: All</option>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold focus:outline-none focus:border-primary-500 transition-all duration-200"
              >
                <option value="All">Status: All</option>
                <option value="Planning">Planning</option>
                <option value="Active">Active</option>
                <option value="On Hold">On Hold</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
          </div>

          {/* Loading state */}
          {loading ? (
            <div className="py-20 flex justify-center">
              <Spinner size="lg" />
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="text-center py-20 bg-white dark:bg-slate-950/40 rounded-3xl border border-slate-200 dark:border-slate-800/50">
              <FolderKanban className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
              <h3 className="text-base font-bold text-slate-800 dark:text-white">No Projects Found</h3>
              <p className="text-sm font-semibold text-slate-400 mt-1">Try updating your filters or search keywords.</p>
            </div>
          ) : (
            /* Projects Grid */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
              {filteredProjects.map((project) => {
                const progress = getProjectProgress(project._id);
                const taskStats = getProjectTasksCount(project._id);

                return (
                  <div
                    key={project._id}
                    onClick={() => navigate(`/projects/${project._id}`)}
                    className="glass-card rounded-2xl p-6 flex flex-col h-full border border-slate-100 dark:border-slate-800/80 hover:shadow-xl dark:hover:border-slate-700 hover:scale-[1.01] hover:cursor-pointer transition-all duration-200"
                  >
                    {/* Top Row: Tags & Actions */}
                    <div className="flex items-center justify-between gap-3 mb-4">
                      <div className="flex flex-wrap gap-2">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${getPriorityColor(project.priority)}`}>
                          {project.priority}
                        </span>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${getStatusColor(project.status)}`}>
                          {project.status}
                        </span>
                      </div>
                      
                      {isAdmin && (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={(e) => handleEdit(project, e)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-primary-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => handleDelete(project._id, project.title, e)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Project Title & Description */}
                    <h3 className="font-extrabold text-slate-800 dark:text-white text-base mb-2 truncate">
                      {project.title}
                    </h3>
                    <p className="text-slate-400 dark:text-slate-400 text-xs leading-relaxed line-clamp-3 mb-5 flex-1">
                      {project.description}
                    </p>

                    {/* Progress Tracker */}
                    <div className="mb-5">
                      <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                        <span>Progress</span>
                        <span>{progress}%</span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-primary-500 h-1.5 rounded-full transition-all duration-300"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-slate-400 font-bold block mt-2">
                        {taskStats.completed} / {taskStats.total} Tasks Completed
                      </span>
                    </div>

                    {/* Footer Row: Deadline and Team */}
                    <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-850 pt-4 mt-auto">
                      {/* Deadline */}
                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        <span className="font-semibold">
                          {new Date(project.deadline).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                        </span>
                      </div>

                      {/* Team Avatars */}
                      <div className="flex items-center">
                        <div className="flex -space-x-1.5 overflow-hidden">
                          {project.teamMembers.slice(0, 4).map((member) => (
                            <div
                              key={member._id}
                              title={member.name}
                              className="inline-block h-6.5 w-6.5 rounded-full ring-2 ring-white dark:ring-slate-900 bg-primary-100 dark:bg-primary-950 text-[10px] font-black text-primary-650 dark:text-primary-400 flex items-center justify-center overflow-hidden border border-primary-200/20"
                            >
                              {member.avatar ? (
                                <img src={member.avatar} alt={member.name} className="w-full h-full object-cover" />
                              ) : (
                                member.name.charAt(0).toUpperCase()
                              )}
                            </div>
                          ))}
                        </div>
                        {project.teamMembers.length > 4 && (
                          <span className="text-[10px] font-bold text-slate-400 ml-2">
                            +{project.teamMembers.length - 4}
                          </span>
                        )}
                        {project.teamMembers.length === 0 && (
                          <div className="flex items-center gap-1 text-[10px] text-slate-405 font-bold">
                            <Users className="w-3.5 h-3.5" /> No team
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>

      {/* Create / Edit Project Modal */}
      {modalOpen && (
        <ProjectModal
          project={selectedProject}
          onClose={() => setModalOpen(false)}
          onSuccess={() => {
            setModalOpen(false);
            showToast(selectedProject ? 'Project updated successfully' : 'Project created successfully');
            fetchProjectsAndTasks();
          }}
        />
      )}

      {/* Toast message alert */}
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

export default Projects;
