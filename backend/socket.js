const jwt = require('jsonwebtoken');
const Message = require('./models/Message');

const userSockets = new Map(); // userId -> Set of socket.id

const initSocket = (io) => {
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Authentication error: No token provided'));
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id.toString();
      next();
    } catch (err) {
      next(new Error('Authentication error: Invalid or expired token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.userId;
    console.log(`🔌 User connected to socket: ${userId} (Socket: ${socket.id})`);

    // Track active socket sessions for this user
    if (!userSockets.has(userId)) {
      userSockets.set(userId, new Set());
    }
    userSockets.get(userId).add(socket.id);

    // Join room named with user's ID so messages can be delivered to all their tabs
    socket.join(userId);

    // Broadcast current online user IDs
    io.emit('onlineUsers', Array.from(userSockets.keys()));

    // Handle send message
    socket.on('sendMessage', async (data) => {
      try {
        const { receiver, content, attachment } = data;
        const hasContent = content && content.trim().length > 0;
        const hasAttachment = attachment && attachment.url;

        if (!receiver || (!hasContent && !hasAttachment)) return;

        // Attachment size check (10MB)
        if (hasAttachment && attachment.fileSize && attachment.fileSize > 10 * 1024 * 1024) {
          socket.emit('messageError', { error: 'Attachment exceeds 10MB limit' });
          return;
        }

        const receiverId = receiver.toString();
        const conversationId = [userId, receiverId].sort().join('_');
        const isReceiverOnline = userSockets.has(receiverId) && userSockets.get(receiverId).size > 0;

        const message = await Message.create({
          sender: userId,
          receiver: receiverId,
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
          delivered: isReceiverOnline,
        });

        const populated = await message.populate([
          { path: 'sender', select: 'name avatar role' },
          { path: 'receiver', select: 'name avatar role' },
        ]);

        // Emit to sender
        socket.emit('newMessage', populated);

        // Emit to receiver's room (reaches all open windows/tabs of the recipient)
        io.to(receiverId).emit('newMessage', populated);
      } catch (err) {
        console.error('Socket sendMessage error:', err);
        socket.emit('messageError', { error: 'Failed to deliver message' });
      }
    });

    // Handle typing indicators
    socket.on('typing', ({ to }) => {
      if (to) {
        io.to(to.toString()).emit('userTyping', { from: userId });
      }
    });

    socket.on('stopTyping', ({ to }) => {
      if (to) {
        io.to(to.toString()).emit('userStopTyping', { from: userId });
      }
    });

    // Handle mark read
    socket.on('markRead', async ({ conversationId }) => {
      try {
        if (!conversationId) return;
        await Message.updateMany(
          { conversationId, receiver: userId, read: false },
          { read: true }
        );
      } catch (err) {
        console.error('Socket markRead error:', err);
      }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      const sockets = userSockets.get(userId);
      if (sockets) {
        sockets.delete(socket.id);
        if (sockets.size === 0) {
          userSockets.delete(userId);
        }
      }
      io.emit('onlineUsers', Array.from(userSockets.keys()));
      console.log(`🔌 User disconnected from socket: ${userId}`);
    });
  });
};

module.exports = { initSocket, onlineUsers: userSockets };
