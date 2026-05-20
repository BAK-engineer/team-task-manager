import React, { useState, useEffect } from 'react';
import { Menu, Bell, X, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from './ThemeToggle';
import { io } from 'socket.io-client';

const Navbar = ({ toggleSidebar, title = 'Dashboard' }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);

  useEffect(() => {
    // Connect to Socket.io to receive real-time alerts
    const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
    const socket = io(socketUrl);

    socket.on('connect', () => {
      console.log('Navbar socket connected for notifications');
    });

    const addNotification = (message) => {
      setNotifications((prev) => [
        {
          id: Date.now() + Math.random(),
          message,
          read: false,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
        ...prev,
      ]);
    };

    socket.on('task_created', (task) => {
      addNotification(`New Task: "${task.title}" has been created.`);
    });

    socket.on('task_updated', (task) => {
      addNotification(`Task Updated: "${task.title}" is now "${task.status}".`);
    });

    socket.on('project_created', (project) => {
      addNotification(`New Project: "${project.title}" has been launched.`);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-6 border-b border-slate-200 dark:border-slate-800/50 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md">
      {/* Left side: toggle button and title */}
      <div className="flex items-center gap-4">
        <button
          onClick={toggleSidebar}
          className="p-2 -ml-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-900 lg:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>
        <h2 className="text-lg font-bold text-slate-800 dark:text-white capitalize">
          {title}
        </h2>
      </div>

      {/* Right side: theme toggle, notifications, and profile */}
      <div className="flex items-center gap-3">
        <ThemeToggle />

        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowNotifDropdown(!showNotifDropdown)}
            className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-200 relative"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 flex w-2.5 h-2.5 bg-rose-500 rounded-full ring-2 ring-white dark:ring-slate-950" />
            )}
          </button>

          {showNotifDropdown && (
            <>
              {/* Dropdown background click handle */}
              <div
                onClick={() => setShowNotifDropdown(false)}
                className="fixed inset-0 z-40 bg-transparent"
              />
              <div className="absolute right-0 mt-2.5 w-80 rounded-2xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-950 shadow-xl z-50 overflow-hidden animate-slide-down">
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-900/30">
                  <span className="font-bold text-sm text-slate-700 dark:text-slate-200">
                    Notifications ({unreadCount})
                  </span>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllRead}
                      className="text-xs text-primary-500 dark:text-primary-400 hover:underline font-semibold flex items-center gap-1"
                    >
                      <Check className="w-3.5 h-3.5" /> Mark all read
                    </button>
                  )}
                </div>

                <div className="max-h-60 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <Bell className="w-8 h-8 text-slate-300 dark:text-slate-700 mb-2" />
                      <p className="text-xs font-semibold text-slate-400">
                        All caught up!
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100 dark:divide-slate-800/40">
                      {notifications.map((notif) => (
                        <div
                          key={notif.id}
                          className={`p-3 text-xs transition-colors duration-150 ${
                            notif.read ? 'opacity-70' : 'bg-primary-50/20 dark:bg-primary-950/10'
                          }`}
                        >
                          <p className="font-medium text-slate-600 dark:text-slate-300 leading-snug">
                            {notif.message}
                          </p>
                          <span className="text-[10px] text-slate-400 font-bold block mt-1">
                            {notif.time}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {notifications.length > 0 && (
                  <div className="px-4 py-2 bg-slate-50 dark:bg-slate-900/30 border-t border-slate-100 dark:border-slate-800/50 text-center">
                    <button
                      onClick={clearNotifications}
                      className="text-xs text-rose-500 font-bold hover:underline"
                    >
                      Clear all
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Divider */}
        <span className="w-[1px] h-5 bg-slate-200 dark:bg-slate-800" />

        {/* User profile bubble */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary-100 dark:bg-primary-950 text-primary-600 dark:text-primary-400 flex items-center justify-center font-bold text-sm overflow-hidden border border-primary-200/50 dark:border-primary-900/20">
            {user?.avatar ? (
              <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
            ) : (
              user?.name ? user.name.charAt(0).toUpperCase() : 'U'
            )}
          </div>
          <span className="hidden sm:inline font-semibold text-sm text-slate-700 dark:text-slate-200">
            {user?.name}
          </span>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
