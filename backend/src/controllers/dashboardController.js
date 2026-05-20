import Project from '../models/Project.js';
import Task from '../models/Task.js';
import ActivityLog from '../models/ActivityLog.js';

// @desc    Get dashboard metrics and activity
// @route   GET /api/dashboard/stats
// @access  Private
export const getDashboardStats = async (req, res) => {
  try {
    const isAdmin = req.user.role === 'Admin';
    const userId = req.user._id;

    // Filter queries
    let projectQuery = {};
    let taskQuery = {};
    let logQuery = {};

    if (!isAdmin) {
      // Non-Admin: Only see stats from their projects and tasks
      projectQuery = {
        $or: [
          { createdBy: userId },
          { teamMembers: userId }
        ]
      };

      // To find tasks relevant to member, we find projects they are in
      const userProjects = await Project.find(projectQuery).select('_id');
      const projectIds = userProjects.map(p => p._id);
      
      taskQuery = { projectId: { $in: projectIds } };

      // Logs: show activities in projects they are involved in
      logQuery = { projectId: { $in: projectIds } };
    }

    // Projects
    const totalProjects = await Project.countDocuments(projectQuery);
    
    // Tasks counts
    const completedTasks = await Task.countDocuments({ ...taskQuery, status: 'Completed' });
    const pendingTasks = await Task.countDocuments({ ...taskQuery, status: { $in: ['Pending', 'In Progress'] } });
    
    // Overdue tasks: status is not completed and due date has passed
    const now = new Date();
    const overdueTasks = await Task.countDocuments({
      ...taskQuery,
      status: { $ne: 'Completed' },
      dueDate: { $lt: now }
    });

    // Chart Data: Status breakdown
    const taskBreakdown = {
      pending: await Task.countDocuments({ ...taskQuery, status: 'Pending' }),
      inProgress: await Task.countDocuments({ ...taskQuery, status: 'In Progress' }),
      completed: completedTasks
    };

    // Chart Data: Projects progression (name + total tasks + completed tasks)
    const projectsList = await Project.find(projectQuery).select('title');
    const projectProgression = await Promise.all(
      projectsList.map(async (project) => {
        const total = await Task.countDocuments({ projectId: project._id });
        const completed = await Task.countDocuments({ projectId: project._id, status: 'Completed' });
        return {
          name: project.title,
          total,
          completed,
          progress: total > 0 ? Math.round((completed / total) * 100) : 0
        };
      })
    );

    // Recent Activities (limit 8)
    const recentActivities = await ActivityLog.find(logQuery)
      .populate('user', 'name email avatar')
      .sort({ createdAt: -1 })
      .limit(8);

    // Member specific tasks stats
    let memberStats = null;
    if (!isAdmin) {
      memberStats = {
        assignedTotal: await Task.countDocuments({ assignedTo: userId }),
        assignedCompleted: await Task.countDocuments({ assignedTo: userId, status: 'Completed' }),
        assignedPending: await Task.countDocuments({ assignedTo: userId, status: 'Pending' }),
        assignedInProgress: await Task.countDocuments({ assignedTo: userId, status: 'In Progress' }),
        assignedOverdue: await Task.countDocuments({
          assignedTo: userId,
          status: { $ne: 'Completed' },
          dueDate: { $lt: now }
        })
      };
    }

    res.json({
      totalProjects,
      completedTasks,
      pendingTasks,
      overdueTasks,
      taskBreakdown,
      projectProgression,
      recentActivities,
      memberStats
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
