import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Calendar, 
  Flag, 
  Users, 
  Plus, 
  Search,
  Filter,
  CheckCircle,
  FileText
} from 'lucide-react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import Spinner from '../components/Spinner';
import Toast from '../components/Toast';
import KanbanBoard from '../components/KanbanBoard';
import TaskModal from '../components/TaskModal';
import { io } from 'socket.io-client';

const ProjectDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === 'Admin';

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [savingTask, setSavingTask] = useState(false);

  // Search & Filter state for tasks
  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('All');

  // Modals & Toasts
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  const fetchProjectDetails = async () => {
    try {
      setLoading(true);
      const [projRes, tasksRes] = await Promise.all([
        api.get(`/projects/${id}`),
        api.get(`/tasks?projectId=${id}`),
      ]);
      setProject(projRes.data);
      setTasks(tasksRes.data);
    } catch (err) {
      console.error(err);
      showToast('Failed to load project details', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjectDetails();

    // Connect to Socket.io and Join Project Room
    const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
    const socket = io(socketUrl);

    socket.emit('join_project', id);

    socket.on('task_created', (newTask) => {
      // Add task if it belongs to this project
      if (newTask.projectId === id || newTask.projectId._id === id) {
        setTasks((prev) => [newTask, ...prev]);
        showToast(`Task "${newTask.title}" created in project`, 'info');
      }
    });

    socket.on('task_updated', (updatedTask) => {
      if (updatedTask.projectId === id || updatedTask.projectId._id === id) {
        setTasks((prev) => prev.map((t) => (t._id === updatedTask._id ? updatedTask : t)));
      }
    });

    socket.on('task_deleted', (deletedId) => {
      setTasks((prev) => prev.filter((t) => t._id !== deletedId));
    });

    // Handle project deletion by admin
    socket.on('project_deleted', (deletedId) => {
      if (deletedId === id) {
        alert('This project has been deleted by an administrator.');
        navigate('/projects');
      }
    });

    // Handle project metadata updates
    socket.on('project_updated', (updatedProj) => {
      if (updatedProj._id === id) {
        setProject(updatedProj);
      }
    });

    return () => {
      socket.emit('leave_project', id);
      socket.disconnect();
    };
  }, [id]);

  // Update Task Status (Drag and drop or button drop)
  const handleUpdateTaskStatus = async (taskId, newStatus) => {
    try {
      // Find local task
      const task = tasks.find((t) => t._id === taskId);
      if (!task) return;
      if (task.status === newStatus) return;

      // Make API PUT request
      await api.put(`/tasks/${taskId}`, { status: newStatus });
      // Socket.io will broadcast the update, which handles updating state
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.message || 'Failed to update task status', 'error');
    }
  };

  // Open task modal to create a task
  const handleCreateTask = () => {
    setSelectedTask(null);
    setTaskModalOpen(true);
  };

  // Open task modal to edit a task
  const handleEditTask = (task) => {
    setSelectedTask(task);
    setTaskModalOpen(true);
  };

  // Delete task
  const handleDeleteTask = async (taskId) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await api.delete(`/tasks/${taskId}`);
        showToast('Task deleted successfully');
      } catch (err) {
        console.error(err);
        showToast('Failed to delete task', 'error');
      }
    }
  };

  // Handle task modal submit (create or update)
  const handleTaskModalSubmit = async (taskData) => {
    try {
      setSavingTask(true);
      if (selectedTask) {
        // Edit
        await api.put(`/tasks/${selectedTask._id}`, taskData);
        showToast('Task updated successfully');
      } else {
        // Create
        await api.post('/tasks', taskData);
        showToast('Task created successfully');
      }
      setTaskModalOpen(false);
      // Wait for socket or manual fetch
      const tasksRes = await api.get(`/tasks?projectId=${id}`);
      setTasks(tasksRes.data);
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.message || 'Failed to save task', 'error');
    } finally {
      setSavingTask(false);
    }
  };

  // Filters
  const filteredTasks = tasks.filter((task) => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          task.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPriority = priorityFilter === 'All' || task.priority === priorityFilter;

    return matchesSearch && matchesPriority;
  });

  // Calculate Progress Percentage
  const progressPercent = tasks.length > 0 
    ? Math.round((tasks.filter((t) => t.status === 'Completed').length / tasks.length) * 100)
    : 0;

  if (loading) {
    return (
      <div className="flex h-screen bg-slate-50 dark:bg-slate-900">
        <Sidebar isOpen={sidebarOpen} toggleSidebar={setSidebarOpen} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Navbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} title="Project details" />
          <main className="flex-1 flex items-center justify-center">
            <Spinner size="lg" />
          </main>
        </div>
      </div>
    );
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'High': return 'bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-455';
      case 'Medium': return 'bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400';
      default: return 'bg-sky-50 text-sky-700 dark:bg-sky-950/20 dark:text-sky-400';
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900 overflow-hidden">
      <Sidebar isOpen={sidebarOpen} toggleSidebar={setSidebarOpen} />

      <div className="flex-1 flex flex-col overflow-hidden lg:pl-64">
        <Navbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} title="Project Details" />

        <main className="flex-1 overflow-y-auto px-6 py-8">
          {/* Back button */}
          <button
            onClick={() => navigate('/projects')}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-slate-605 dark:hover:text-slate-200 transition-colors mb-6 uppercase tracking-wider"
          >
            <ArrowLeft className="w-4 h-4" /> Back to projects
          </button>

          {/* Project Details Glass Panel */}
          {project && (
            <div className="glass-card rounded-2xl p-6 mb-8 border border-slate-100 dark:border-slate-800">
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                
                {/* Text and Metadata */}
                <div className="flex-1 space-y-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold border uppercase tracking-wider ${getPriorityColor(project.priority)}`}>
                      {project.priority} Priority
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-purple-50 text-purple-700 dark:bg-purple-950/20 dark:text-purple-400 border border-purple-100 dark:border-purple-900/10 uppercase tracking-wider">
                      {project.status}
                    </span>
                  </div>
                  <h1 className="text-xl lg:text-2xl font-black text-slate-850 dark:text-white leading-tight">
                    {project.title}
                  </h1>
                  <div className="text-slate-400 dark:text-slate-400 text-xs font-semibold max-w-3xl flex items-start gap-1.5 leading-relaxed">
                    <FileText className="w-4 h-4 mt-0.5 flex-shrink-0 text-slate-350 dark:text-slate-600" />
                    <span>{project.description}</span>
                  </div>

                  {/* Info widgets row */}
                  <div className="flex flex-wrap items-center gap-6 text-xs text-slate-400 font-bold pt-2">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-slate-350 dark:text-slate-655" />
                      <span>Deadline: {new Date(project.deadline).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <CheckCircle className="w-4 h-4 text-slate-350 dark:text-slate-655" />
                      <span>{tasks.filter((t) => t.status === 'Completed').length} / {tasks.length} Tasks Done</span>
                    </div>
                  </div>
                </div>

                {/* Team members panel */}
                <div className="w-full lg:w-72 bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/50 p-4 rounded-xl flex flex-col">
                  <div className="flex items-center gap-2 mb-3">
                    <Users className="w-4.5 h-4.5 text-primary-500" />
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Team Engaged</span>
                  </div>
                  <div className="flex flex-wrap gap-2.5">
                    {/* Project Creator */}
                    <div
                      title={`Project Manager: ${project.createdBy.name}`}
                      className="w-8 h-8 rounded-full ring-2 ring-primary-500/50 bg-primary-100 dark:bg-primary-950 font-black text-primary-655 text-xs flex items-center justify-center overflow-hidden"
                    >
                      {project.createdBy.avatar ? (
                        <img src={project.createdBy.avatar} alt={project.createdBy.name} className="w-full h-full object-cover" />
                      ) : (
                        project.createdBy.name.charAt(0).toUpperCase()
                      )}
                    </div>
                    {/* Team Members */}
                    {project.teamMembers.map((member) => (
                      <div
                        key={member._id}
                        title={`Team Member: ${member.name}`}
                        className="w-8 h-8 rounded-full ring-1 ring-slate-200 dark:ring-slate-800 bg-slate-100 dark:bg-slate-850 font-bold text-slate-600 dark:text-slate-300 text-xs flex items-center justify-center overflow-hidden"
                      >
                        {member.avatar ? (
                          <img src={member.avatar} alt={member.name} className="w-full h-full object-cover" />
                        ) : (
                          member.name.charAt(0).toUpperCase()
                        )}
                      </div>
                    ))}
                    {project.teamMembers.length === 0 && (
                      <span className="text-xs text-slate-400 font-semibold italic">No members assigned.</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Progress Bar Widget */}
              <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-850/50">
                <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  <span>Project Completion Progress</span>
                  <span>{progressPercent}%</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-primary-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Task Action Bar */}
          <div className="glass-card p-4 rounded-2xl mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Search */}
            <div className="relative flex-1 max-w-sm">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-405">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search tasks..."
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white placeholder-slate-400 text-sm font-semibold focus:outline-none focus:border-primary-500 transition-all duration-200"
              />
            </div>

            {/* Actions: Priority Filter & Create Button */}
            <div className="flex items-center justify-between md:justify-end gap-4">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-slate-400" />
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold focus:outline-none focus:border-primary-500 transition-all duration-200"
                >
                  <option value="All">Priority: All</option>
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>

              {isAdmin && (
                <button
                  onClick={handleCreateTask}
                  className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-primary-500 hover:bg-primary-600 active:scale-[0.98] text-white text-xs font-extrabold shadow-md shadow-primary-500/10 hover:shadow-primary-500/25 transition-all duration-200"
                >
                  <Plus className="w-4.5 h-4.5" /> Add Task
                </button>
              )}
            </div>
          </div>

          {/* Kanban Board Container */}
          <div className="h-full overflow-visible">
            <KanbanBoard
              tasks={filteredTasks}
              onUpdateTaskStatus={handleUpdateTaskStatus}
              onEditTask={handleEditTask}
              onDeleteTask={handleDeleteTask}
            />
          </div>
        </main>
      </div>

      {/* Task Modal */}
      {taskModalOpen && (
        <TaskModal
          task={selectedTask}
          project={project}
          onClose={() => setTaskModalOpen(false)}
          onSuccess={handleTaskModalSubmit}
          saving={savingTask}
        />
      )}

      {/* Toasts alerts */}
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

export default ProjectDetails;
