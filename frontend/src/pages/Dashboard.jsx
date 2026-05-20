import React, { useState, useEffect } from 'react';
import { 
  FolderKanban, 
  CheckSquare, 
  Clock, 
  AlertTriangle,
  History,
  TrendingUp,
  UserCheck
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  CartesianGrid 
} from 'recharts';
import api from '../utils/api';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import Spinner from '../components/Spinner';

const Dashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');

  const fetchStats = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/dashboard/stats');
      setStats(data);
    } catch (err) {
      console.error(err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen bg-slate-50 dark:bg-slate-900">
        <Sidebar isOpen={sidebarOpen} toggleSidebar={setSidebarOpen} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Navbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} title="Dashboard" />
          <main className="flex-1 flex items-center justify-center">
            <Spinner size="lg" />
          </main>
        </div>
      </div>
    );
  }

  // Pre-configured colors for charts
  const COLORS = ['#f59e0b', '#3b82f6', '#10b981']; // Pending, In Progress, Completed
  
  const pieData = stats ? [
    { name: 'Pending', value: stats.taskBreakdown.pending },
    { name: 'In Progress', value: stats.taskBreakdown.inProgress },
    { name: 'Completed', value: stats.taskBreakdown.completed },
  ].filter(item => item.value > 0) : [];

  // If pieData is empty, provide a default placeholder so chart doesn't look blank
  const isPieDataEmpty = pieData.length === 0;
  const displayPieData = isPieDataEmpty 
    ? [{ name: 'No Tasks', value: 1 }] 
    : pieData;
  const PIE_COLORS = isPieDataEmpty ? ['#e2e8f0'] : COLORS;

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900 overflow-hidden">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} toggleSidebar={setSidebarOpen} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden lg:pl-64">
        <Navbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} title="Dashboard" />

        <main className="flex-1 overflow-y-auto px-6 py-8">
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-455 text-sm font-semibold border border-rose-100 dark:border-rose-900/30">
              {error}
            </div>
          )}

          {/* Stats Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Total Projects Card */}
            <div className="glass-card p-6 rounded-2xl flex items-center gap-5 hover:scale-[1.01] transition-transform duration-200">
              <div className="p-4 rounded-xl bg-violet-500/10 text-violet-650 dark:text-violet-400">
                <FolderKanban className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                  Total Projects
                </span>
                <span className="text-2xl font-extrabold text-slate-800 dark:text-white mt-1 block">
                  {stats?.totalProjects}
                </span>
              </div>
            </div>

            {/* Completed Tasks Card */}
            <div className="glass-card p-6 rounded-2xl flex items-center gap-5 hover:scale-[1.01] transition-transform duration-200">
              <div className="p-4 rounded-xl bg-emerald-500/10 text-emerald-650 dark:text-emerald-400">
                <CheckSquare className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                  Completed Tasks
                </span>
                <span className="text-2xl font-extrabold text-slate-800 dark:text-white mt-1 block">
                  {stats?.completedTasks}
                </span>
              </div>
            </div>

            {/* Pending Tasks Card */}
            <div className="glass-card p-6 rounded-2xl flex items-center gap-5 hover:scale-[1.01] transition-transform duration-200">
              <div className="p-4 rounded-xl bg-amber-500/10 text-amber-650 dark:text-amber-400">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                  Pending Tasks
                </span>
                <span className="text-2xl font-extrabold text-slate-800 dark:text-white mt-1 block">
                  {stats?.pendingTasks}
                </span>
              </div>
            </div>

            {/* Overdue Tasks Card */}
            <div className={`glass-card p-6 rounded-2xl flex items-center gap-5 hover:scale-[1.01] transition-transform duration-200 border-l-4 ${
              stats?.overdueTasks > 0 ? 'border-l-rose-500 bg-rose-50/20 dark:bg-rose-950/5' : 'border-l-transparent'
            }`}>
              <div className={`p-4 rounded-xl ${
                stats?.overdueTasks > 0 
                  ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400' 
                  : 'bg-slate-500/10 text-slate-650 dark:text-slate-400'
              }`}>
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                  Overdue Tasks
                </span>
                <span className={`text-2xl font-extrabold mt-1 block ${
                  stats?.overdueTasks > 0 ? 'text-rose-600 dark:text-rose-455' : 'text-slate-800 dark:text-white'
                }`}>
                  {stats?.overdueTasks}
                </span>
              </div>
            </div>
          </div>

          {/* Member Specific Assigned Tasks Box */}
          {stats?.memberStats && (
            <div className="glass-card p-6 rounded-2xl mb-8 border border-primary-500/10 bg-primary-500/[0.02]">
              <div className="flex items-center gap-2.5 mb-4">
                <UserCheck className="w-5 h-5 text-primary-500" />
                <h3 className="font-bold text-base text-slate-800 dark:text-white">
                  My Assigned Tasks Summary
                </h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div className="p-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/60 rounded-xl">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-1">Assigned Total</span>
                  <span className="text-xl font-black text-slate-800 dark:text-white">{stats.memberStats.assignedTotal}</span>
                </div>
                <div className="p-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/60 rounded-xl">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-1">Completed</span>
                  <span className="text-xl font-black text-emerald-500">{stats.memberStats.assignedCompleted}</span>
                </div>
                <div className="p-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/60 rounded-xl">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-1">In Progress</span>
                  <span className="text-xl font-black text-blue-500">{stats.memberStats.assignedInProgress}</span>
                </div>
                <div className="p-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/60 rounded-xl">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-1">Overdue</span>
                  <span className={`text-xl font-black ${stats.memberStats.assignedOverdue > 0 ? 'text-rose-500' : 'text-slate-800 dark:text-white'}`}>
                    {stats.memberStats.assignedOverdue}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
            {/* Task Status Breakdown Chart */}
            <div className="glass-card p-6 rounded-2xl lg:col-span-1 flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-base text-slate-800 dark:text-white">
                  Task Status
                </h3>
                <span className="text-xs font-semibold text-slate-400">
                  Total breakdown
                </span>
              </div>
              <div className="h-64 flex-1 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={displayPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={85}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {displayPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
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
              </div>
              <div className="flex justify-center gap-6 mt-4 text-xs font-bold text-slate-500">
                {!isPieDataEmpty ? (
                  <>
                    <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-amber-500" /> Pending</span>
                    <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-blue-500" /> In Progress</span>
                    <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-emerald-500" /> Completed</span>
                  </>
                ) : (
                  <span className="text-slate-400">No active tasks created</span>
                )}
              </div>
            </div>

            {/* Project Progress Chart */}
            <div className="glass-card p-6 rounded-2xl lg:col-span-2 flex flex-col">
              <div className="flex items-center gap-2 mb-6">
                <TrendingUp className="w-5 h-5 text-primary-500" />
                <h3 className="font-bold text-base text-slate-800 dark:text-white">
                  Project Tasks Completion
                </h3>
              </div>
              <div className="h-64 flex-1">
                {stats?.projectProgression.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-slate-400 text-sm font-semibold">
                    No projects available for chart metrics.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats?.projectProgression} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
                      <Bar name="Total Tasks" dataKey="total" fill="#a78bfa" radius={[4, 4, 0, 0]} />
                      <Bar name="Completed Tasks" dataKey="completed" fill="#10b981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>

          {/* Recent Activity Logs */}
          <div className="glass-card p-6 rounded-2xl">
            <div className="flex items-center gap-2.5 mb-6">
              <History className="w-5 h-5 text-primary-500" />
              <h3 className="font-bold text-base text-slate-800 dark:text-white">
                Recent Team Activity
              </h3>
            </div>
            
            {stats?.recentActivities.length === 0 ? (
              <div className="text-center py-8 text-slate-400 font-semibold text-sm">
                No activity logged yet. Action logs will appear here.
              </div>
            ) : (
              <div className="flow-root">
                <ul className="-mb-8">
                  {stats?.recentActivities.map((log, logIdx) => (
                    <li key={log._id}>
                      <div className="relative pb-8">
                        {logIdx !== stats.recentActivities.length - 1 ? (
                          <span
                            className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-slate-200 dark:bg-slate-800"
                            aria-hidden="true"
                          />
                        ) : null}
                        <div className="relative flex space-x-3">
                          <div>
                            <span className="h-8 w-8 rounded-full bg-primary-100 dark:bg-primary-950/75 border border-primary-200/50 dark:border-primary-900/30 text-primary-650 dark:text-primary-400 flex items-center justify-center font-bold text-xs overflow-hidden">
                              {log.user.avatar ? (
                                <img src={log.user.avatar} alt={log.user.name} className="w-full h-full object-cover" />
                              ) : (
                                log.user.name.charAt(0).toUpperCase()
                              )}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0 pt-1.5 flex justify-between space-x-4">
                            <div>
                              <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                                <span className="font-extrabold text-slate-900 dark:text-white">{log.user.name}</span>
                                {' '}{log.action.toLowerCase()}{' - '}
                                <span className="text-slate-500 dark:text-slate-400 font-medium">{log.details}</span>
                              </p>
                            </div>
                            <div className="text-right text-[10px] font-bold text-slate-400 whitespace-nowrap">
                              {new Date(log.createdAt).toLocaleDateString()}{' '}
                              {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
