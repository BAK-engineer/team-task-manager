import Task from '../models/Task.js';
import Project from '../models/Project.js';
import ActivityLog from '../models/ActivityLog.js';

// @desc    Create a new task under a project
// @route   POST /api/tasks
// @access  Private/Admin
export const createTask = async (req, res) => {
  const { title, description, assignedTo, projectId, priority, dueDate, status } = req.body;

  try {
    if (!title || !projectId || !dueDate) {
      return res.status(400).json({ message: 'Please include title, projectId, and dueDate' });
    }

    // Verify project exists
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const task = await Task.create({
      title,
      description: description || '',
      assignedTo: assignedTo || null,
      projectId,
      priority: priority || 'Medium',
      dueDate,
      status: status || 'Pending',
    });

    const populatedTask = await Task.findById(task._id)
      .populate('assignedTo', 'name email avatar')
      .populate('projectId', 'title');

    // Log Activity
    await ActivityLog.create({
      user: req.user._id,
      action: 'Task Created',
      details: `Created task "${title}" in project "${project.title}"`,
      projectId,
    });

    if (req.io) {
      req.io.emit('task_created', populatedTask);
    }

    res.status(201).json(populatedTask);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get tasks
// @route   GET /api/tasks
// @access  Private
// @query   projectId, assignedTo, status
export const getTasks = async (req, res) => {
  const { projectId, assignedTo, status } = req.query;

  try {
    let query = {};

    if (projectId) {
      query.projectId = projectId;
    }

    if (assignedTo) {
      query.assignedTo = assignedTo;
    }

    if (status) {
      query.status = status;
    }

    // If Member, they can only view tasks of projects they are part of
    if (req.user.role !== 'Admin') {
      const userProjects = await Project.find({
        $or: [
          { createdBy: req.user._id },
          { teamMembers: req.user._id }
        ]
      }).select('_id');
      
      const projectIds = userProjects.map((p) => p._id);
      
      query.projectId = { $in: projectIds };

      // If a member queries without assigning filters, they should be able to see all tasks in their projects, 
      // but if they want to filter specifically, we respect that.
    }

    const tasks = await Task.find(query)
      .populate('assignedTo', 'name email avatar')
      .populate('projectId', 'title teamMembers createdBy')
      .sort({ createdAt: -1 });

    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single task
// @route   GET /api/tasks/:id
// @access  Private
export const getTaskById = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignedTo', 'name email avatar')
      .populate('projectId', 'title createdBy teamMembers');

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check authorization: Admin or project member/creator
    if (
      req.user.role !== 'Admin' &&
      task.projectId.createdBy.toString() !== req.user._id.toString() &&
      !task.projectId.teamMembers.some((id) => id.toString() === req.user._id.toString())
    ) {
      return res.status(403).json({ message: 'Not authorized to view this task' });
    }

    res.json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a task
// @route   PUT /api/tasks/:id
// @access  Private
export const updateTask = async (req, res) => {
  const { title, description, assignedTo, priority, dueDate, status } = req.body;

  try {
    let task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Role check & Edit permission
    if (req.user.role !== 'Admin') {
      // Member can only update task status
      // Verify if member is assigned to this task or if they are in the project
      const project = await Project.findById(task.projectId);
      const isProjectMember = project.teamMembers.some(
        (id) => id.toString() === req.user._id.toString()
      );

      if (!isProjectMember && task.assignedTo?.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Not authorized to update this task' });
      }

      // Member changes status ONLY
      if (status && status !== task.status) {
        const oldStatus = task.status;
        task.status = status;
        await task.save();

        const populatedTask = await Task.findById(task._id)
          .populate('assignedTo', 'name email avatar')
          .populate('projectId', 'title');

        // Log Activity
        await ActivityLog.create({
          user: req.user._id,
          action: 'Task Status Updated',
          details: `Updated task "${task.title}" status from "${oldStatus}" to "${status}"`,
          projectId: task.projectId,
        });

        if (req.io) {
          req.io.emit('task_updated', populatedTask);
        }

        return res.json(populatedTask);
      } else {
        return res.status(403).json({ message: 'Members can only update task status' });
      }
    }

    // Admin can update all fields
    task.title = title || task.title;
    task.description = description !== undefined ? description : task.description;
    task.assignedTo = assignedTo !== undefined ? assignedTo : task.assignedTo;
    task.priority = priority || task.priority;
    task.dueDate = dueDate || task.dueDate;
    task.status = status || task.status;

    const updatedTask = await task.save();

    const populatedTask = await Task.findById(updatedTask._id)
      .populate('assignedTo', 'name email avatar')
      .populate('projectId', 'title');

    // Log Activity
    await ActivityLog.create({
      user: req.user._id,
      action: 'Task Updated',
      details: `Updated task "${task.title}" details`,
      projectId: task.projectId,
    });

    if (req.io) {
      req.io.emit('task_updated', populatedTask);
    }

    res.json(populatedTask);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a task
// @route   DELETE /api/tasks/:id
// @access  Private/Admin
export const deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const title = task.title;
    const projectId = task.projectId;

    await Task.findByIdAndDelete(req.params.id);

    // Log Activity
    await ActivityLog.create({
      user: req.user._id,
      action: 'Task Deleted',
      details: `Deleted task "${title}"`,
      projectId,
    });

    if (req.io) {
      req.io.emit('task_deleted', req.params.id);
    }

    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
