const User = require('../models/User');
const MentorshipRequest = require('../models/MentorshipRequest');
const ConnectionRequest = require('../models/ConnectionRequest');
const Opportunity = require('../models/Opportunity');
const Message = require('../models/Message');
const Notification = require('../models/Notification');

// @desc    Get all users with search/filters
// @route   GET /api/users
exports.getUsers = async (req, res) => {
  try {
    const { search, skills, industry, role, page = 1, limit = 12 } = req.query;
    const query = { _id: { $ne: req.user._id } };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { headline: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } },
        { course: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } },
      ];
    }
    if (skills) {
      const skillsArr = skills.split(',').map(s => s.trim()).filter(Boolean);
      if (skillsArr.length > 0) {
        query.skills = { $in: skillsArr };
      }
    }
    if (industry) query.industry = { $regex: industry, $options: 'i' };
    if (role) query.role = role;

    const total = await User.countDocuments(query);
    const users = await User.find(query)
      .select('-password')
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const currentUser = req.user;
    const currentUserSkills = Array.isArray(currentUser.skills) ? currentUser.skills : [];
    const currentUserConnections = Array.isArray(currentUser.connections) ? currentUser.connections.map(c => (c._id || c).toString()) : [];

    const usersWithMatch = users.map(user => {
      const userObj = user.toJSON();
      const userSkills = Array.isArray(user.skills) ? user.skills : [];
      if (currentUserSkills.length > 0 && userSkills.length > 0) {
        const sharedSkills = currentUserSkills.filter(s => userSkills.includes(s));
        userObj.matchPercentage = Math.round((sharedSkills.length / Math.max(currentUserSkills.length, userSkills.length)) * 100);
      } else {
        userObj.matchPercentage = 0;
      }
      userObj.isConnected = currentUserConnections.includes(user._id.toString());
      return userObj;
    });

    res.json({
      users: usersWithMatch,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit) || 1,
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error fetching users' });
  }
};

// @desc    Get user by ID
// @route   GET /api/users/:id
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password')
      .populate('connections', 'name avatar headline role company');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Increment profile views if not viewing self
    if (req.user._id.toString() !== req.params.id) {
      await User.findByIdAndUpdate(req.params.id, { $inc: { profileViews: 1 } });
    }

    // Check mentorship status
    const mentorshipSent = await MentorshipRequest.findOne({ from: req.user._id, to: req.params.id });
    const mentorshipReceived = await MentorshipRequest.findOne({ from: req.params.id, to: req.user._id });

    // Check connection status
    const connectionSent = await ConnectionRequest.findOne({ from: req.user._id, to: req.params.id, status: 'pending' });
    const connectionReceived = await ConnectionRequest.findOne({ from: req.params.id, to: req.user._id, status: 'pending' });

    const userObj = user.toJSON();
    userObj.mentorshipStatus = mentorshipSent ? mentorshipSent.status : mentorshipReceived ? `received_${mentorshipReceived.status}` : null;
    
    const userConnections = req.user.connections || [];
    userObj.isConnected = userConnections.some(c => (c._id || c).toString() === user._id.toString());
    userObj.connectionStatus = userObj.isConnected ? 'connected' : connectionSent ? 'pending_sent' : connectionReceived ? 'pending_received' : 'none';

    res.json({ user: userObj });
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching user profile' });
  }
};

// @desc    Update profile
// @route   PUT /api/users/profile
exports.updateProfile = async (req, res) => {
  try {
    const allowedFields = ['name', 'headline', 'bio', 'skills', 'industry', 'course', 'experience', 'location', 'company', 'avatar', 'graduationYear'];
    const updates = {};
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    if (updates.skills && typeof updates.skills === 'string') {
      updates.skills = updates.skills.split(',').map(s => s.trim()).filter(Boolean);
    }

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true }).select('-password');
    res.json({ user: user.toJSON() });
  } catch (error) {
    res.status(500).json({ message: 'Server error updating profile' });
  }
};

// @desc    Get mentor recommendations (skill-based matching)
// @route   GET /api/users/recommendations
exports.getRecommendations = async (req, res) => {
  try {
    const currentUser = req.user;
    if (!currentUser.skills || currentUser.skills.length === 0) {
      const alumni = await User.find({ role: 'alumni', _id: { $ne: currentUser._id } })
        .select('-password').limit(6);
      return res.json({ recommendations: alumni });
    }

    const alumni = await User.find({
      role: 'alumni',
      _id: { $ne: currentUser._id },
      skills: { $in: currentUser.skills },
    }).select('-password').limit(20);

    const ranked = alumni.map(user => {
      const shared = currentUser.skills.filter(s => user.skills.includes(s));
      return {
        ...user.toJSON(),
        matchPercentage: Math.round((shared.length / Math.max(currentUser.skills.length, user.skills.length)) * 100),
      };
    }).sort((a, b) => b.matchPercentage - a.matchPercentage).slice(0, 6);

    res.json({ recommendations: ranked });
  } catch (error) {
    res.status(500).json({ message: 'Server error getting recommendations' });
  }
};

// @desc    Get leaderboard
// @route   GET /api/users/leaderboard
exports.getLeaderboard = async (req, res) => {
  try {
    const topUsers = await User.aggregate([
      { $match: { role: 'alumni' } },
      { $addFields: { score: { $add: [{ $size: '$connections' }, { $multiply: ['$profileViews', 0.1] }] } } },
      { $sort: { score: -1 } },
      { $limit: 10 },
      { $project: { password: 0 } },
    ]);
    res.json({ leaderboard: topUsers });
  } catch (error) {
    res.status(500).json({ message: 'Server error getting leaderboard' });
  }
};

// @desc    Get dashboard stats
// @route   GET /api/users/stats
exports.getStats = async (req, res) => {
  try {
    const userId = req.user._id;
    const totalConnections = req.user.connections ? req.user.connections.length : 0;
    const mentorshipsActive = await MentorshipRequest.countDocuments({
      $or: [{ from: userId }, { to: userId }],
      status: 'accepted',
    });
    const mentorshipsPending = await MentorshipRequest.countDocuments({
      $or: [{ from: userId }, { to: userId }],
      status: 'pending',
    });
    const totalAlumni = await User.countDocuments({ role: 'alumni' });
    const totalStudents = await User.countDocuments({ role: 'student' });
    const totalOpportunities = await Opportunity.countDocuments({ isActive: true });

    res.json({
      stats: {
        connections: totalConnections,
        activeMentorships: mentorshipsActive,
        pendingRequests: mentorshipsPending,
        profileViews: req.user.profileViews || 0,
        totalAlumni,
        totalStudents,
        totalOpportunities,
        profileStrength: req.user.profileStrength || (typeof req.user.getProfileStrength === 'function' ? req.user.getProfileStrength() : 50),
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error getting stats' });
  }
};

// @desc    Get trending skills
// @route   GET /api/users/trending-skills
exports.getTrendingSkills = async (req, res) => {
  try {
    const result = await User.aggregate([
      { $unwind: '$skills' },
      { $group: { _id: '$skills', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 15 },
    ]);
    res.json({ skills: result.map(r => ({ name: r._id, count: r.count })) });
  } catch (error) {
    res.status(500).json({ message: 'Server error getting trending skills' });
  }
};

// ================= ADMIN ENDPOINTS =================

// @desc    Admin: Get all users with stats
// @route   GET /api/users/admin/users
exports.adminGetUsers = async (req, res) => {
  try {
    const { search, role, page = 1, limit = 50 } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } },
      ];
    }
    if (role) query.role = role;

    const total = await User.countDocuments(query);
    const users = await User.find(query)
      .select('-password')
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const totalAlumni = await User.countDocuments({ role: 'alumni' });
    const totalStudents = await User.countDocuments({ role: 'student' });
    const totalAdmins = await User.countDocuments({ role: 'admin' });

    res.json({
      users,
      total,
      stats: {
        total,
        alumni: totalAlumni,
        students: totalStudents,
        admins: totalAdmins,
      },
      page: parseInt(page),
      pages: Math.ceil(total / limit) || 1,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error in admin users list' });
  }
};

// @desc    Admin: Delete a user
// @route   DELETE /api/users/admin/:id
exports.adminDeleteUser = async (req, res) => {
  try {
    const userId = req.params.id;

    if (userId === req.user._id.toString()) {
      return res.status(400).json({ message: 'Administrators cannot delete their own account from admin panel' });
    }

    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Clean up related data
    await User.findByIdAndDelete(userId);
    await MentorshipRequest.deleteMany({ $or: [{ from: userId }, { to: userId }] });
    await ConnectionRequest.deleteMany({ $or: [{ from: userId }, { to: userId }] });
    await Message.deleteMany({ $or: [{ sender: userId }, { receiver: userId }] });
    await Notification.deleteMany({ $or: [{ user: userId }, { fromUser: userId }] });
    await User.updateMany({ connections: userId }, { $pull: { connections: userId } });

    res.json({ message: 'User and all associated data deleted successfully', id: userId });
  } catch (error) {
    res.status(500).json({ message: 'Server error deleting user' });
  }
};

// @desc    Admin: Update user role
// @route   PUT /api/users/admin/:id/role
exports.adminUpdateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    if (!['student', 'alumni', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: `Role updated to ${role}`, user: updatedUser });
  } catch (error) {
    res.status(500).json({ message: 'Server error updating user role' });
  }
};
