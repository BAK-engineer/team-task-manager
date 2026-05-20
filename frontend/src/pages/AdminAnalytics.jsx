import React, { useState, useEffect } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  BarChart3, 
  Users, 
  FolderKanban, 
  CheckSquare, 
  Flag,
  AlertCircle
} from 'lucide-react';
import api from '../utils/api';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import Spinner from '../components/Spinner';

const AdminAnalytics = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [error, setError] = useState('');

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      const [usersRes, tasksRes, projectsRes] = await Promise.all([
        api.get('/users'),
        api.get('/tasks'),
        api.get('/projects'),
      ]);
      setUsers(usersRes.data);
      setTasks(tasksRes.data);
      setProjects(projectsRes.data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch analytics metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen bg-slate-50 dark:bg-slate-900">
        <Sidebar isOpen={sidebarOpen} toggleSidebar={setSidebarOpen} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Navbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} title="Analytics" />
          <main className="flex-1 flex items-center justify-center">
            <Spinner size="lg" />
          </main>
        </div>
      </div>
    );
  }

  // 1. Calculate Member Task Load (Tasks per member)
  const memberTaskData = users.map((userObj) => {
    const userTasks = tasks.filter((t) => t.assignedTo && t.assignedTo._id === userObj._id);
    const completedTasks = userTasks.filter((t) => t.status === 'Completed').length;
    const remainingTasks = userTasks.length - completedTasks;

    return {
      name: userObj.name,
      role: userObj.role,
      Total: userTasks.length,
      Completed: completedTasks,
      Pending: remainingTasks,
    };
  }).filter((item) => item.Total > 0); // Only show users with assigned tasks

  // 2. Calculate Task Priority Distribution
  const priorityCounts = { High: 0, Medium: 0, Low: 0 };
  tasks.forEach((t) => {
    if (priorityCounts[t.priority] !== undefined) {
      priorityCounts[t.priority]++;
    }
  });

  const priorityPieData = [
    { name: 'High', value: priorityCounts.High },
    { name: 'Medium', value: priorityCounts.Medium },
    { name: 'Low', value: priorityCounts.Low },
  ].filter(item => item.value > 0);

  const PRIORITY_COLORS = ['#ef4444', '#f59e0b', '#0ea5e9']; // High (rose), Medium (amber), Low (sky)

  // 3. Calculate Project-by-Project Task Success Rate
  const projectSuccessData = projects.map((proj) => {
    const projTasks = tasks.filter((t) => t.projectId._id === proj._id || t.projectId === proj._id);
    const completed = projTasks.filter((t) => t.status === 'Completed').length;
    const rate = projTasks.length > 0 ? Math.round((completed / projTasks.length) * 100) : 0;

    return {
      name: proj.title,
      rate,
      Total: projTasks.length,
      Completed: completed,
    };
  });

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900 overflow-hidden">
      <Sidebar isOpen={sidebarOpen} toggleSidebar={setSidebarOpen} />

      <div className="flex-1 flex flex-col overflow-hidden lg:pl-64">
        <Navbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} title="Admin Analytics" />

        <main className="flex-1 overflow-y-auto px-6 py-8">
          {/* Header Action row */}
          <div className="mb-8">
            <p className="text-sm font-semibold text-slate-400">
              System-wide diagnostics, resource allocation summaries, and status tracking
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-rose-50 dark:bg-rose-950/20 text-rose-605 dark:text-rose-455 text-sm font-semibold border border-rose-100 dark:border-rose-900/30">
              {error}
            </div>
          )}

          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="glass-card p-6 rounded-2xl flex items-center gap-5">
              <div className="p-4 rounded-xl bg-violet-500/10 text-violet-650 dark:text-violet-400">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Total Members</span>
                <span className="text-2xl font-extrabold text-slate-805 dark:text-white mt-1 block">{users.length}</span>
              </div>
            </div>

            <div className="glass-card p-6 rounded-2xl flex items-center gap-5">
              <div className="p-4 rounded-xl bg-primary-500/10 text-primary-600 dark:text-primary-400">
                <FolderKanban className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Total Projects</span>
                <span className="text-2xl font-extrabold text-slate-800 dark:text-white mt-1 block">{projects.length}</span>
              </div>
            </div>

            <div className="glass-card p-6 rounded-2xl flex items-center gap-5">
              <div className="p-4 rounded-xl bg-emerald-500/10 text-emerald-650 dark:text-emerald-400">
                <CheckSquare className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Total Tasks Created</span>
                <span className="text-2xl font-extrabold text-slate-800 dark:text-white mt-1 block">{tasks.length}</span>
              </div>
            </div>
          </div>

          {/* Charts Row 1: Member Task Load Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
            {/* Member Task Load Chart */}
            <div className="glass-card p-6 rounded-2xl lg:col-span-2 flex flex-col">
              <div className="flex items-center gap-2 mb-6">
                <BarChart3 className="w-5 h-5 text-primary-500" />
                <h3 className="font-bold text-base text-slate-850 dark:text-white">
                  Team Task Allocation Load
                </h3>
              </div>
              <div className="h-72 flex-1">
                {memberTaskData.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-slate-400 text-sm font-semibold">
                    No task assignments mapped to team members.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={memberTaskData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.15)" />
                      <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} fontWeight={600} tickLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={11} fontWeight={600} tickLine={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'rgba(15, 23, 42, 0.95)',
                          border: 'none',
                          borderRadius: '12px',
                          color: '#fff',
                        }}
                      />
                      <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: 'bold' }} />
                      <Bar name="Tasks Completed" dataKey="Completed" fill="#10b981" stackId="a" radius={[0, 0, 0, 0]} />
                      <Bar name="Tasks Remaining" dataKey="Pending" fill="#a78bfa" stackId="a" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Task Priority Distribution Chart */}
            <div className="glass-card p-6 rounded-2xl lg:col-span-1 flex flex-col">
              <div className="flex items-center gap-2 mb-6">
                <Flag className="w-5 h-5 text-primary-500" />
                <h3 className="font-bold text-base text-slate-850 dark:text-white">
                  Task Priority Breakdown
                </h3>
              </div>
              <div className="h-72 flex-1 relative flex items-center justify-center">
                {priorityPieData.length === 0 ? (
                  <div className="text-slate-400 text-sm font-semibold">
                    No priorities mapped. Create tasks to view.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={priorityPieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {priorityPieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={PRIORITY_COLORS[index % PRIORITY_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'rgba(15, 23, 42, 0.9)', 
                          borderColor: 'transparent',
                          borderRadius: '12px',
                          color: '#fff' 
                        }} 
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
              <div className="flex justify-center gap-4 text-xs font-bold text-slate-500 mt-2">
                {priorityPieData.map((item, idx) => (
                  <span key={item.name} className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PRIORITY_COLORS[idx] }} />
                    {item.name}: {item.value}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Table / List: Project Diagnostics */}
          <div className="glass-card p-6 rounded-2xl">
            <h3 className="font-extrabold text-slate-850 dark:text-white text-base mb-6 pb-3 border-b border-slate-100 dark:border-slate-850">
              Project Diagnostic Health Breakdown
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-850 text-slate-400 font-bold text-xs uppercase tracking-wider">
                    <th className="pb-3.5 pl-2">Project Title</th>
                    <th className="pb-3.5">Assigned Tasks</th>
                    <th className="pb-3.5">Completed Tasks</th>
                    <th className="pb-3.5">Task Success Rate</th>
                    <th className="pb-3.5 pr-2">Status Rating</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                  {projectSuccessData.map((proj, idx) => {
                    const healthRating = proj.rate >= 80 
                      ? { label: 'Optimal', style: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400' }
                      : proj.rate >= 40
                      ? { label: 'Active', style: 'bg-sky-50 text-sky-700 dark:bg-sky-950/20 dark:text-sky-400' }
                      : proj.Total === 0
                      ? { label: 'Inactive', style: 'bg-slate-100 text-slate-600 dark:bg-slate-900/60 dark:text-slate-400' }
                      : { label: 'At Risk', style: 'bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-455 animate-pulse-subtle' };

                    return (
                      <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/10 transition-colors">
                        <td className="py-4 pl-2 font-bold text-slate-800 dark:text-slate-200">{proj.name}</td>
                        <td className="py-4 font-semibold text-slate-500">{proj.Total}</td>
                        <td className="py-4 font-semibold text-slate-500">{proj.Completed}</td>
                        <td className="py-4">
                          <div className="flex items-center gap-3">
                            <span className="font-bold text-slate-700 dark:text-slate-200 w-8">{proj.rate}%</span>
                            <div className="w-24 bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                              <div 
                                className="bg-primary-500 h-1.5 rounded-full" 
                                style={{ width: `${proj.rate}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="py-4 pr-2">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${healthRating.style}`}>
                            {healthRating.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                  {projectSuccessData.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400 font-semibold">
                        No projects launched in the database yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminAnalytics;
