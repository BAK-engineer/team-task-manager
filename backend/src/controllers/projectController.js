import Project from '../models/Project.js';
import Task from '../models/Task.js';
import ActivityLog from '../models/ActivityLog.js';

// @desc    Create a new project
// @route   POST /api/projects
// @access  Private/Admin
export const createProject = async (req, res) => {
  const { title, description, teamMembers, deadline, priority, status } = req.body;

  try {
    if (!title || !description || !deadline) {
      return res.status(400).json({ message: 'Please include title, description, and deadline' });
    }

    const project = await Project.create({
      title,
      description,
      createdBy: req.user._id,
      teamMembers: teamMembers || [],
      deadline,
      priority: priority || 'Medium',
      status: status || 'Planning',
    });

    // Populate creator and team members info
    const populatedProject = await Project.findById(project._id)
      .populate('createdBy', 'name email avatar')
      .populate('teamMembers', 'name email avatar');

    // Log Activity
    await ActivityLog.create({
      user: req.user._id,
      action: 'Project Created',
      details: `Created project "${title}"`,
      projectId: project._id,
    });

    // Notify via Socket.io (handled in routes/server context)
    if (req.io) {
      req.io.emit('project_created', populatedProject);
    }

    res.status(201).json(populatedProject);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all projects
// @route   GET /api/projects
// @access  Private
export const getProjects = async (req, res) => {
  try {
    let query = {};

    // Non-Admin (Member) users only see projects they are members of or created
    if (req.user.role !== 'Admin') {
      query = {
        $or: [
          { createdBy: req.user._id },
          { teamMembers: req.user._id }
        ]
      };
    }

    const projects = await Project.find(query)
      .populate('createdBy', 'name email avatar')
      .populate('teamMembers', 'name email avatar')
      .sort({ createdAt: -1 });

    res.json(projects);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single project details
// @route   GET /api/projects/:id
// @access  Private
export const getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('createdBy', 'name email avatar')
      .populate('teamMembers', 'name email avatar');

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Access check: Only creator, team members or admin can see it
    if (
      req.user.role !== 'Admin' &&
      project.createdBy._id.toString() !== req.user._id.toString() &&
      !project.teamMembers.some((m) => m._id.toString() === req.user._id.toString())
    ) {
      return res.status(403).json({ message: 'Not authorized to view this project' });
    }

    res.json(project);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a project
// @route   PUT /api/projects/:id
// @access  Private/Admin
export const updateProject = async (req, res) => {
  const { title, description, teamMembers, deadline, priority, status } = req.body;

  try {
    let project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    project.title = title || project.title;
    project.description = description || project.description;
    project.teamMembers = teamMembers !== undefined ? teamMembers : project.teamMembers;
    project.deadline = deadline || project.deadline;
    project.priority = priority || project.priority;
    project.status = status || project.status;

    const updatedProject = await project.save();
    
    const populatedProject = await Project.findById(updatedProject._id)
      .populate('createdBy', 'name email avatar')
      .populate('teamMembers', 'name email avatar');

    // Log Activity
    await ActivityLog.create({
      user: req.user._id,
      action: 'Project Updated',
      details: `Updated project "${project.title}" details`,
      projectId: project._id,
    });

    if (req.io) {
      req.io.emit('project_updated', populatedProject);
    }

    res.json(populatedProject);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a project
// @route   DELETE /api/projects/:id
// @access  Private/Admin
export const deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Delete all tasks associated with this project
    await Task.deleteMany({ projectId: req.params.id });

    const title = project.title;
    await Project.findByIdAndDelete(req.params.id);

    // Log Activity
    await ActivityLog.create({
      user: req.user._id,
      action: 'Project Deleted',
      details: `Deleted project "${title}" and all its tasks`,
    });

    if (req.io) {
      req.io.emit('project_deleted', req.params.id);
    }

    res.json({ message: 'Project and all associated tasks deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
