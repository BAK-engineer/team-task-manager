import User from '../models/User.js';

// @desc    Get all users (for assigning tasks/projects)
// @route   GET /api/users
// @access  Private
export const getUsers = async (req, res) => {
  try {
    const users = await User.find({}).select('name email role avatar');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
