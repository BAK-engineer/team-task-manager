import React from 'react';
import { Calendar, AlertCircle, Edit, Trash2, ShieldAlert } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const KanbanBoard = ({ tasks, onUpdateTaskStatus, onEditTask, onDeleteTask }) => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'Admin';

  const columns = [
    { id: 'Pending', name: 'Pending', color: 'border-t-amber-500 bg-amber-500/5' },
    { id: 'In Progress', name: 'In Progress', color: 'border-t-blue-500 bg-blue-500/5' },
    { id: 'Completed', name: 'Completed', color: 'border-t-emerald-500 bg-emerald-500/5' },
  ];

  const handleDragStart = (e, taskId) => {
    e.dataTransfer.setData('text/plain', taskId);
    e.currentTarget.classList.add('opacity-40');
  };

  const handleDragEnd = (e) => {
    e.currentTarget.classList.remove('opacity-40');
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, targetStatus) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain');
    if (taskId) {
      onUpdateTaskStatus(taskId, targetStatus);
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'High': return 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/20 dark:text-rose-455 dark:border-rose-900/30';
      case 'Medium': return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30';
      default: return 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/20 dark:text-sky-400 dark:border-sky-900/30';
    }
  };

  const isOverdue = (dueDate, status) => {
    if (status === 'Completed') return false;
    return new Date(dueDate) < new Date();
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full items-start">
      {columns.map((column) => {
        const columnTasks = tasks.filter((t) => t.status === column.id);

        return (
          <div
            key={column.id}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, column.id)}
            className={`flex flex-col h-full min-h-[500px] max-h-[750px] p-4 rounded-2xl border border-slate-205 dark:border-slate-800 bg-white/70 dark:bg-slate-950/40 backdrop-blur-md border-t-4 ${column.color}`}
          >
            {/* Column Header */}
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100 dark:border-slate-850">
              <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
                {column.name}
                <span className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-900 text-slate-500 text-[10px] font-black">
                  {columnTasks.length}
                </span>
              </h3>
            </div>

            {/* Column Tasks Box */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1.5 scroll-smooth">
              {columnTasks.map((task) => {
                const taskOverdue = isOverdue(task.dueDate, task.status);

                return (
                  <div
                    key={task._id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, task._id)}
                    onDragEnd={handleDragEnd}
                    className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-150 dark:border-slate-800/80 shadow-sm hover:shadow-md cursor-grab active:cursor-grabbing hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-150"
                  >
                    {/* Priority and Action buttons */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border uppercase tracking-wider ${getPriorityBadge(task.priority)}`}>
                        {task.priority} Priority
                      </span>

                      {/* Admin Task Actions */}
                      {isAdmin && (
                        <div className="flex items-center gap-0.5">
                          <button
                            onClick={() => onEditTask(task)}
                            className="p-1 rounded text-slate-400 hover:text-primary-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                            title="Edit Task"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDeleteTask(task._id)}
                            className="p-1 rounded text-slate-400 hover:text-rose-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                            title="Delete Task"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Title & Description */}
                    <h4 className="font-extrabold text-sm text-slate-800 dark:text-white leading-snug mb-1.5">
                      {task.title}
                    </h4>
                    {task.description && (
                      <p className="text-slate-400 dark:text-slate-500 text-xs leading-relaxed line-clamp-2 mb-4">
                        {task.description}
                      </p>
                    )}

                    {/* Footer: Due date / Overdue + Avatar */}
                    <div className="flex items-center justify-between border-t border-slate-50 dark:border-slate-850 pt-3">
                      {/* Due Date Details */}
                      <div className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider ${
                        taskOverdue 
                          ? 'text-rose-600 dark:text-rose-400 animate-pulse-subtle' 
                          : 'text-slate-400 dark:text-slate-500'
                      }`}>
                        {taskOverdue ? (
                          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                        ) : (
                          <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                        )}
                        <span>
                          {taskOverdue ? 'Overdue: ' : 'Due: '}
                          {new Date(task.dueDate).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                        </span>
                      </div>

                      {/* Assigned Member Profile */}
                      <div className="flex items-center">
                        {task.assignedTo ? (
                          <div
                            title={`Assigned to ${task.assignedTo.name}`}
                            className="w-6 h-6 rounded-full bg-primary-100 dark:bg-primary-950 text-[10px] font-black text-primary-600 flex items-center justify-center overflow-hidden border border-primary-200/20"
                          >
                            {task.assignedTo.avatar ? (
                              <img src={task.assignedTo.avatar} alt={task.assignedTo.name} className="w-full h-full object-cover" />
                            ) : (
                              task.assignedTo.name.charAt(0).toUpperCase()
                            )}
                          </div>
                        ) : (
                          <span
                            title="Unassigned Task"
                            className="w-6 h-6 rounded-full border border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center"
                          >
                            <ShieldAlert className="w-3.5 h-3.5 text-slate-350 dark:text-slate-600" />
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              {columnTasks.length === 0 && (
                <div className="text-center py-10 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                  <p className="text-xs font-semibold text-slate-400 dark:text-slate-655">
                    Drag tasks here
                  </p>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default KanbanBoard;
