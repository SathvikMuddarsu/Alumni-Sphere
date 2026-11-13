const ConnectionRequest = require('../models/ConnectionRequest');
const Notification = require('../models/Notification');
const User = require('../models/User');

// @desc    Send connection request
// @route   POST /api/connections/request
exports.sendRequest = async (req, res) => {
  try {
    const { to, message } = req.body;

    if (!to) {
      return res.status(400).json({ message: 'Target user ID is required' });
    }

    if (to === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot connect with yourself' });
    }

    const targetUser = await User.findById(to);
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if already connected
    if (req.user.connections && req.user.connections.some(id => id.toString() === to)) {
      return res.status(400).json({ message: 'Already connected with this user' });
    }

    // Check existing request
    const existing = await ConnectionRequest.findOne({
      $or: [
        { from: req.user._id, to },
        { from: to, to: req.user._id },
      ],
    });

    if (existing) {
      if (existing.status === 'pending') {
        return res.status(400).json({ message: 'A pending connection request already exists' });
      }
      // If previous was rejected or cancelled, reopen it
      existing.from = req.user._id;
      existing.to = to;
      existing.status = 'pending';
      existing.message = message || '';
      await existing.save();

      await Notification.create({
        user: to,
        type: 'connection',
        title: 'New Connection Request',
        message: `${req.user.name} sent you a connection request`,
        fromUser: req.user._id,
        link: '/connections',
      });

      const populated = await existing.populate([
        { path: 'from', select: 'name avatar headline role company' },
        { path: 'to', select: 'name avatar headline role company' },
      ]);
      return res.json({ request: populated });
    }

    const request = await ConnectionRequest.create({
      from: req.user._id,
      to,
      message: message || '',
    });

    await Notification.create({
      user: to,
      type: 'connection',
      title: 'New Connection Request',
      message: `${req.user.name} sent you a connection request`,
      fromUser: req.user._id,
      link: '/connections',
    });

    const populated = await request.populate([
      { path: 'from', select: 'name avatar headline role company' },
      { path: 'to', select: 'name avatar headline role company' },
    ]);

    res.status(201).json({ request: populated });
  } catch (error) {
    console.error('Send connection request error:', error);
    res.status(500).json({ message: 'Server error sending connection request' });
  }
};

// @desc    Get connection requests
// @route   GET /api/connections/requests
exports.getRequests = async (req, res) => {
  try {
    const { type = 'all' } = req.query;
    let query = {};

    if (type === 'sent') {
      query = { from: req.user._id, status: 'pending' };
    } else if (type === 'received') {
      query = { to: req.user._id, status: 'pending' };
    } else {
      query = { $or: [{ from: req.user._id }, { to: req.user._id }] };
    }

    const requests = await ConnectionRequest.find(query)
      .populate('from', 'name avatar headline role company skills')
      .populate('to', 'name avatar headline role company skills')
      .sort({ createdAt: -1 });

    res.json({ requests });
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching requests' });
  }
};

// @desc    Respond to connection request (accept/reject)
// @route   PUT /api/connections/respond/:id
exports.respondRequest = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status. Must be accepted or rejected' });
    }

    const request = await ConnectionRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ message: 'Connection request not found' });
    }

    if (request.to.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to respond to this request' });
    }

    request.status = status;
    await request.save();

    if (status === 'accepted') {
      await User.findByIdAndUpdate(request.from, { $addToSet: { connections: request.to } });
      await User.findByIdAndUpdate(request.to, { $addToSet: { connections: request.from } });

      await Notification.create({
        user: request.from,
        type: 'connection',
        title: 'Connection Accepted',
        message: `${req.user.name} accepted your connection request`,
        fromUser: req.user._id,
        link: `/profile/${req.user._id}`,
      });
    }

    const populated = await request.populate([
      { path: 'from', select: 'name avatar headline role company' },
      { path: 'to', select: 'name avatar headline role company' },
    ]);

    res.json({ request: populated });
  } catch (error) {
    res.status(500).json({ message: 'Server error responding to connection request' });
  }
};

// @desc    Cancel sent connection request
// @route   DELETE /api/connections/request/:id
exports.cancelRequest = async (req, res) => {
  try {
    const request = await ConnectionRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ message: 'Connection request not found' });
    }

    if (request.from.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to cancel this request' });
    }

    await ConnectionRequest.findByIdAndDelete(req.params.id);
    res.json({ message: 'Connection request cancelled successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error cancelling request' });
  }
};

// @desc    Get user's connections
// @route   GET /api/connections
exports.getConnections = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate({
      path: 'connections',
      select: 'name email avatar headline role company skills location course graduationYear',
    });

    res.json({ connections: user.connections || [] });
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching connections' });
  }
};

// @desc    Remove an existing connection
// @route   DELETE /api/connections/:userId
exports.removeConnection = async (req, res) => {
  try {
    const targetUserId = req.params.userId;

    await User.findByIdAndUpdate(req.user._id, { $pull: { connections: targetUserId } });
    await User.findByIdAndUpdate(targetUserId, { $pull: { connections: req.user._id } });

    // Also update any connection request status if exists
    await ConnectionRequest.deleteMany({
      $or: [
        { from: req.user._id, to: targetUserId },
        { from: targetUserId, to: req.user._id },
      ],
    });

    res.json({ message: 'Connection removed successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error removing connection' });
  }
};
