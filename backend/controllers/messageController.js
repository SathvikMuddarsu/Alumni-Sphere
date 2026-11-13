const Message = require('../models/Message');
const User = require('../models/User');

// Generate a consistent conversation ID from two user IDs
const getConversationId = (userId1, userId2) => {
  return [userId1, userId2].sort().join('_');
};

// @desc    Get conversations list
// @route   GET /api/messages/conversations
exports.getConversations = async (req, res) => {
  try {
    const userId = req.user._id;

    // Get all unique conversation partners
    const messages = await Message.aggregate([
      { $match: { $or: [{ sender: userId }, { receiver: userId }] } },
      { $sort: { createdAt: -1 } },
      { $group: {
        _id: '$conversationId',
        lastMessage: { $first: '$content' },
        lastAttachment: { $first: '$attachment' },
        lastMessageAt: { $first: '$createdAt' },
        sender: { $first: '$sender' },
        receiver: { $first: '$receiver' },
        unreadCount: {
          $sum: { $cond: [{ $and: [{ $eq: ['$receiver', userId] }, { $eq: ['$read', false] }] }, 1, 0] },
        },
      }},
      { $sort: { lastMessageAt: -1 } },
    ]);

    // Get the other user's info for each conversation
    const conversationsRaw = await Promise.all(messages.map(async (msg) => {
      const otherUserId = msg.sender.toString() === userId.toString() ? msg.receiver : msg.sender;
      const otherUser = await User.findById(otherUserId).select('name avatar headline role');
      if (!otherUser) return null;
      
      const lastMessageText = (msg.lastMessage && msg.lastMessage.trim()) 
        ? msg.lastMessage 
        : (msg.lastAttachment?.fileName ? `📎 ${msg.lastAttachment.fileName}` : 'Attachment');

      return {
        conversationId: msg._id,
        user: otherUser,
        lastMessage: lastMessageText,
        lastMessageAt: msg.lastMessageAt,
        unreadCount: msg.unreadCount,
      };
    }));

    const conversations = conversationsRaw.filter(Boolean);

    res.json({ conversations });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get messages with a user
// @route   GET /api/messages/:userId
exports.getMessages = async (req, res) => {
  try {
    const conversationId = getConversationId(req.user._id.toString(), req.params.userId);
    const { page = 1, limit = 50 } = req.query;

    const messages = await Message.find({ conversationId })
      .sort({ createdAt: 1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate('sender', 'name avatar')
      .populate('receiver', 'name avatar');

    // Mark messages as read
    await Message.updateMany(
      { conversationId, receiver: req.user._id, read: false },
      { $set: { read: true } }
    );

    res.json({ messages });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Send a message
// @route   POST /api/messages
exports.sendMessage = async (req, res) => {
  try {
    const { receiver, content, attachment } = req.body;
    const hasContent = content && content.trim().length > 0;
    const hasAttachment = attachment && attachment.url;

    if (!receiver || (!hasContent && !hasAttachment)) {
      return res.status(400).json({ message: 'Receiver and either text content or an attachment are required' });
    }

    // Validate attachment size if present (max 10MB)
    if (hasAttachment && attachment.fileSize && attachment.fileSize > 10 * 1024 * 1024) {
      return res.status(400).json({ message: 'Attachment file size exceeds maximum limit of 10MB' });
    }

    const conversationId = getConversationId(req.user._id.toString(), receiver);

    const message = await Message.create({
      sender: req.user._id,
      receiver,
      conversationId,
      content: hasContent ? content.trim() : '',
      attachment: hasAttachment
        ? {
            url: attachment.url,
            fileName: attachment.fileName || 'file',
            fileType: attachment.fileType || 'application/octet-stream',
            fileSize: attachment.fileSize || 0,
          }
        : undefined,
    });

    const populated = await message.populate([
      { path: 'sender', select: 'name avatar role' },
      { path: 'receiver', select: 'name avatar role' },
    ]);

    res.status(201).json({ message: populated });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
