import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams, useLocation } from 'react-router-dom';
import {
  Send,
  Search,
  MessageCircle,
  ArrowLeft,
  Check,
  CheckCheck,
  Paperclip,
  FileText,
  X,
  Download,
  ExternalLink,
  UserPlus,
  Users,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { getConversations, getMessages, sendMessage } from '../services/messageService';
import { getUsers, getUserById } from '../services/userService';
import Avatar from '../components/ui/Avatar';
import { SkeletonCard } from '../components/ui/Skeleton';

export default function MessagesPage() {
  const { user } = useAuth();
  const { socket, onlineUsers } = useSocket();
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();

  const [conversations, setConversations] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [typing, setTyping] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [attachment, setAttachment] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);

  // New Chat Modal state
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userSearchResults, setUserSearchResults] = useState([]);
  const [searchingUsers, setSearchingUsers] = useState(false);

  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const currentUserId = user?.id || user?._id;
  const targetUserId = searchParams.get('userId');

  // Load conversations and handle targetUserId from query
  useEffect(() => {
    initConversationsAndTarget();
  }, [targetUserId]);

  const initConversationsAndTarget = async () => {
    setLoading(true);
    try {
      const { data } = await getConversations();
      const loadedConversations = data.conversations || [];
      setConversations(loadedConversations);

      if (targetUserId) {
        // Check if user is already in conversations list
        const existingConv = loadedConversations.find(
          (c) => c.user?._id?.toString() === targetUserId.toString()
        );

        if (existingConv && existingConv.user) {
          selectChat(existingConv.user);
        } else {
          // New conversation! Get recipient details
          let recipient = location.state?.recipient;
          if (!recipient || recipient._id?.toString() !== targetUserId.toString()) {
            try {
              const userRes = await getUserById(targetUserId);
              recipient = userRes.data.user;
            } catch (e) {
              console.error('Error fetching recipient user:', e);
            }
          }

          if (recipient) {
            // Prepend new empty conversation placeholder
            const newConvPlaceholder = {
              conversationId: [currentUserId, recipient._id].sort().join('_'),
              user: recipient,
              lastMessage: 'Start a conversation',
              lastMessageAt: new Date().toISOString(),
              unreadCount: 0,
              isNew: true,
            };

            setConversations([
              newConvPlaceholder,
              ...loadedConversations.filter((c) => c.user?._id?.toString() !== recipient._id?.toString()),
            ]);
            selectChat(recipient);
          }
        }
      } else if (loadedConversations.length > 0 && !activeChat && window.innerWidth >= 768) {
        // Auto-select first conversation on desktop if no active chat
        selectChat(loadedConversations[0].user);
      }
    } catch (err) {
      console.error('Failed to load conversations:', err);
    } finally {
      setLoading(false);
    }
  };

  // Socket event listeners
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (msg) => {
      const senderId = (msg.sender?._id || msg.sender)?.toString();
      const receiverId = (msg.receiver?._id || msg.receiver)?.toString();
      const activeId = activeChat?._id?.toString();

      // Check if this message belongs to the currently active conversation
      if (activeId && (senderId === activeId || receiverId === activeId)) {
        setMessages((prev) => {
          // Prevent duplicates by checking _id
          if (msg._id && prev.some((m) => m._id === msg._id)) return prev;
          return [...prev, msg];
        });
      }
      loadConversations();
    };

    socket.on('newMessage', handleNewMessage);

    socket.on('userTyping', ({ from }) => {
      if (activeChat && from?.toString() === activeChat._id?.toString()) setTyping(true);
    });

    socket.on('userStopTyping', ({ from }) => {
      if (activeChat && from?.toString() === activeChat._id?.toString()) setTyping(false);
    });

    return () => {
      socket.off('newMessage', handleNewMessage);
      socket.off('userTyping');
      socket.off('userStopTyping');
    };
  }, [socket, activeChat]);

  // Scroll to bottom on new messages or typing
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing]);

  // Search registered users for "New Chat" modal
  useEffect(() => {
    if (!showNewChatModal) return;
    const delayDebounce = setTimeout(async () => {
      setSearchingUsers(true);
      try {
        const { data } = await getUsers({ search: userSearchQuery.trim(), limit: 12 });
        setUserSearchResults(data.users || []);
      } catch (err) {
        console.error('Failed to search users:', err);
      } finally {
        setSearchingUsers(false);
      }
    }, 200);

    return () => clearTimeout(delayDebounce);
  }, [userSearchQuery, showNewChatModal]);

  const loadConversations = async () => {
    try {
      const { data } = await getConversations();
      setConversations(data.conversations || []);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const selectChat = async (chatUser) => {
    if (!chatUser || !chatUser._id) return;
    setActiveChat(chatUser);
    setTyping(false);
    setAttachment(null);
    try {
      const { data } = await getMessages(chatUser._id);
      setMessages(data.messages || []);
      // Mark as read locally and on socket
      if (socket) {
        const conversationId = [currentUserId, chatUser._id].sort().join('_');
        socket.emit('markRead', { conversationId });
      }
      loadConversations();
    } catch (err) {
      console.error('Failed to load messages', err);
    }
  };

  const handleStartChatWithUser = (targetUser) => {
    setShowNewChatModal(false);
    setUserSearchQuery('');

    // Prepend user to conversations if not present
    const existing = conversations.find(
      (c) => c.user?._id?.toString() === targetUser._id?.toString()
    );
    if (!existing) {
      const placeholder = {
        conversationId: [currentUserId, targetUser._id].sort().join('_'),
        user: targetUser,
        lastMessage: 'Start a conversation',
        lastMessageAt: new Date().toISOString(),
        unreadCount: 0,
        isNew: true,
      };
      setConversations([placeholder, ...conversations]);
    }

    setSearchParams({ userId: targetUser._id });
    selectChat(targetUser);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Max file size 10MB
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size cannot exceed 10MB');
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setAttachment({
        url: reader.result,
        fileName: file.name,
        fileType: file.type || 'application/octet-stream',
        fileSize: file.size,
        isImage: file.type.startsWith('image/'),
      });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSend = async (e) => {
    e.preventDefault();
    const content = newMessage.trim();
    if ((!content && !attachment) || !activeChat) return;

    const payload = {
      receiver: activeChat._id,
      content,
      attachment: attachment
        ? {
            url: attachment.url,
            fileName: attachment.fileName,
            fileType: attachment.fileType,
            fileSize: attachment.fileSize,
          }
        : undefined,
    };

    setNewMessage('');
    setAttachment(null);

    if (socket && socket.connected) {
      socket.emit('stopTyping', { to: activeChat._id });
      socket.emit('sendMessage', payload);
    } else {
      // Fallback to REST API
      try {
        const { data } = await sendMessage(payload);
        setMessages((prev) => [...prev, data.message]);
        loadConversations();
      } catch (err) {
        console.error('Failed to send message via REST', err);
        toast.error('Failed to send message');
      }
    }
  };

  const handleTyping = (e) => {
    setNewMessage(e.target.value);
    if (socket && socket.connected && activeChat) {
      socket.emit('typing', { to: activeChat._id });
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('stopTyping', { to: activeChat._id });
      }, 1500);
    }
  };

  const formatTime = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const filteredConversations = conversations.filter((c) =>
    c.user?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="hidden sm:block">
        <h1 className="text-2xl font-display font-bold text-dark-900 dark:text-white">Messages</h1>
        <p className="text-sm text-gray-500 dark:text-dark-400">
          Direct real-time conversations & file sharing with alumni & mentors
        </p>
      </motion.div>

      {/* Main Messaging Container */}
      <div
        className="glass rounded-2xl overflow-hidden flex flex-col md:flex-row shadow-glass"
        style={{ height: 'calc(100vh - 11rem)' }}
      >
        {/* Left Sidebar: Conversations & Search */}
        <div
          className={`w-full md:w-80 border-r border-gray-200 dark:border-dark-700 flex flex-col shrink-0 ${
            activeChat ? 'hidden md:flex' : 'flex'
          }`}
        >
          {/* Search bar + New Chat Button */}
          <div className="p-3 border-b border-gray-200 dark:border-dark-700 flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-field pl-9 py-2 text-sm w-full"
              />
            </div>
            <button
              type="button"
              onClick={() => {
                setUserSearchQuery('');
                setShowNewChatModal(true);
              }}
              className="gradient-btn p-2 sm:px-3 sm:py-2 text-xs font-semibold rounded-xl flex items-center gap-1.5 shrink-0 shadow-sm"
              title="Start a new conversation"
            >
              <UserPlus size={16} />
              <span className="hidden sm:inline">New</span>
            </button>
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-3 space-y-3">
                {[...Array(5)].map((_, i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-6 text-center text-gray-500 text-sm">
                <MessageCircle className="mx-auto mb-2 text-gray-300 dark:text-dark-600" size={34} />
                <p className="font-medium text-dark-900 dark:text-white">
                  {searchQuery ? 'No matching conversations' : 'No conversations yet'}
                </p>
                <p className="text-xs text-gray-400 mt-1 mb-4">
                  {searchQuery
                    ? 'Try searching all registered students & alumni'
                    : 'Connect with mentors or students to start chatting'}
                </p>
                <button
                  onClick={() => {
                    setUserSearchQuery(searchQuery);
                    setShowNewChatModal(true);
                  }}
                  className="gradient-btn px-4 py-2 text-xs font-semibold rounded-xl inline-flex items-center gap-1.5 shadow-sm"
                >
                  <UserPlus size={14} /> Start New Conversation
                </button>
              </div>
            ) : (
              filteredConversations.map((conv) => (
                <button
                  key={conv.conversationId}
                  onClick={() => selectChat(conv.user)}
                  className={`w-full p-3.5 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-dark-700/50 transition-colors text-left border-b border-gray-100 dark:border-dark-800 ${
                    activeChat?._id === conv.user?._id ? 'bg-primary-50/70 dark:bg-primary-900/30' : ''
                  }`}
                >
                  <Avatar
                    src={conv.user?.avatar}
                    name={conv.user?.name}
                    size="md"
                    online={onlineUsers?.includes(conv.user?._id)}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-sm text-dark-900 dark:text-white truncate">{conv.user?.name}</p>
                      <span className="text-[10px] text-gray-400 shrink-0">{formatTime(conv.lastMessageAt)}</span>
                    </div>
                    <p className="text-xs text-gray-500 truncate mt-0.5">{conv.lastMessage || 'Sent an attachment'}</p>
                  </div>
                  {conv.unreadCount > 0 && (
                    <span className="w-5 h-5 bg-primary-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shrink-0">
                      {conv.unreadCount}
                    </span>
                  )}
                </button>
              ))
            )}
          </div>
        </div>

        {/* Right Pane: Active Chat Window */}
        <div className={`flex-1 flex flex-col ${!activeChat ? 'hidden md:flex' : 'flex'}`}>
          {!activeChat ? (
            <div className="flex-1 flex items-center justify-center text-gray-400 p-8">
              <div className="text-center max-w-sm">
                <MessageCircle size={56} className="mx-auto mb-3 text-primary-400/60 dark:text-primary-500/40" />
                <h3 className="text-lg font-bold text-dark-900 dark:text-white">Select a conversation</h3>
                <p className="text-sm text-gray-500 dark:text-dark-400 mt-1 mb-5">
                  Choose someone from your existing chats or start a new conversation with any alumni or student
                </p>
                <button
                  onClick={() => {
                    setUserSearchQuery('');
                    setShowNewChatModal(true);
                  }}
                  className="gradient-btn px-5 py-2.5 text-xs font-semibold rounded-xl inline-flex items-center gap-2 shadow-md"
                >
                  <UserPlus size={15} /> Start a Conversation
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Chat Header */}
              <div className="p-3.5 sm:p-4 border-b border-gray-200 dark:border-dark-700 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setActiveChat(null)}
                    className="md:hidden p-1.5 -ml-1 text-gray-500 hover:text-dark-900 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-dark-700"
                  >
                    <ArrowLeft size={18} />
                  </button>
                  <Avatar
                    src={activeChat.avatar}
                    name={activeChat.name}
                    size="md"
                    online={onlineUsers?.includes(activeChat._id)}
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-sm text-dark-900 dark:text-white">{activeChat.name}</p>
                      {activeChat.role && (
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300">
                          {activeChat.role}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">
                      {typing ? (
                        <span className="text-primary-500 font-medium">typing...</span>
                      ) : onlineUsers?.includes(activeChat._id) ? (
                        <span className="text-emerald-500 font-medium">Online</span>
                      ) : (
                        activeChat.headline || 'Offline'
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/30 dark:bg-dark-900/30">
                {messages.length === 0 ? (
                  <div className="text-center py-16 text-gray-400 text-xs">
                    <p className="text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">
                      Start of conversation with {activeChat.name}
                    </p>
                    <p>Send a message or share a document/image to begin connecting!</p>
                  </div>
                ) : (
                  messages.map((msg, i) => {
                    const senderId = (msg.sender?._id || msg.sender)?.toString();
                    const isMine = senderId === currentUserId?.toString();
                    return (
                      <div key={msg._id || i} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                        <div
                          className={`max-w-[85%] sm:max-w-[70%] px-4 py-2.5 rounded-2xl shadow-sm ${
                            isMine
                              ? 'bg-gradient-primary text-white rounded-br-sm'
                              : 'bg-white dark:bg-dark-800 text-dark-900 dark:text-white rounded-bl-sm border border-gray-100 dark:border-dark-700'
                          }`}
                        >
                          {/* Attachment Display */}
                          {msg.attachment?.url && (
                            <div className="mb-2">
                              {msg.attachment.fileType?.startsWith('image/') ||
                              msg.attachment.url.startsWith('data:image/') ? (
                                <div className="rounded-xl overflow-hidden max-w-xs cursor-pointer group relative">
                                  <img
                                    src={msg.attachment.url}
                                    alt={msg.attachment.fileName || 'Attachment'}
                                    className="max-h-60 w-auto rounded-xl object-cover hover:opacity-95 transition-opacity"
                                    onClick={() => setPreviewImage(msg.attachment.url)}
                                  />
                                  <div className="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-xs font-medium gap-1 pointer-events-none">
                                    <ExternalLink size={14} /> Full View
                                  </div>
                                </div>
                              ) : (
                                <div
                                  className={`flex items-center gap-2.5 p-2.5 rounded-xl border ${
                                    isMine
                                      ? 'bg-white/15 border-white/20 text-white'
                                      : 'bg-gray-100 dark:bg-dark-700 border-gray-200 dark:border-dark-600 text-dark-900 dark:text-white'
                                  }`}
                                >
                                  <FileText size={22} className={isMine ? 'text-white shrink-0' : 'text-primary-500 shrink-0'} />
                                  <div className="min-w-0 flex-1">
                                    <p className="text-xs font-semibold truncate max-w-[170px] sm:max-w-[210px]">
                                      {msg.attachment.fileName || 'Document'}
                                    </p>
                                    <p className={`text-[10px] ${isMine ? 'text-white/75' : 'text-gray-500'}`}>
                                      {formatFileSize(msg.attachment.fileSize)}
                                    </p>
                                  </div>
                                  <a
                                    href={msg.attachment.url}
                                    download={msg.attachment.fileName || 'document'}
                                    className={`p-1.5 rounded-lg transition-colors shrink-0 ${
                                      isMine
                                        ? 'hover:bg-white/20 text-white'
                                        : 'hover:bg-gray-200 dark:hover:bg-dark-600 text-primary-600 dark:text-primary-400'
                                    }`}
                                    title="Download file"
                                  >
                                    <Download size={15} />
                                  </a>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Text Content */}
                          {msg.content && <p className="text-sm leading-relaxed break-words">{msg.content}</p>}

                          {/* Time & Read receipts */}
                          <div
                            className={`flex items-center justify-end gap-1 text-[10px] mt-1 ${
                              isMine ? 'text-white/70' : 'text-gray-400'
                            }`}
                          >
                            <span>{formatTime(msg.createdAt || Date.now())}</span>
                            {isMine && (msg.read ? <CheckCheck size={12} /> : <Check size={12} />)}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                {typing && (
                  <div className="flex justify-start">
                    <div className="bg-white dark:bg-dark-800 border border-gray-100 dark:border-dark-700 px-3 py-1.5 rounded-2xl rounded-bl-sm text-xs text-gray-400">
                      {activeChat.name} is typing...
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Pending Attachment Preview Bar */}
              {attachment && (
                <div className="px-4 py-2 border-t border-gray-200 dark:border-dark-700 bg-gray-50 dark:bg-dark-800/80 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    {attachment.isImage ? (
                      <img
                        src={attachment.url}
                        alt="Preview"
                        className="w-10 h-10 object-cover rounded-lg border border-gray-200 dark:border-dark-600 shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900/40 text-primary-600 dark:text-primary-400 flex items-center justify-center shrink-0">
                        <FileText size={20} />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-dark-900 dark:text-white truncate max-w-[220px] sm:max-w-md">
                        {attachment.fileName}
                      </p>
                      <p className="text-[10px] text-gray-500">{formatFileSize(attachment.fileSize)}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAttachment(null)}
                    className="p-1 rounded-full text-gray-400 hover:text-red-500 hover:bg-gray-200 dark:hover:bg-dark-700 transition-colors shrink-0"
                    title="Remove attachment"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}

              {/* Hidden File Input */}
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept="image/*,.pdf,.doc,.docx,.txt,.xlsx,.ppt,.pptx"
                onChange={handleFileSelect}
              />

              {/* Input Form */}
              <form onSubmit={handleSend} className="p-3 sm:p-4 border-t border-gray-200 dark:border-dark-700 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2.5 rounded-xl text-gray-500 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400 hover:bg-gray-100 dark:hover:bg-dark-700 transition-colors shrink-0"
                  title="Attach image or document (max 10MB)"
                >
                  <Paperclip size={18} />
                </button>

                <input
                  type="text"
                  placeholder={attachment ? 'Add a caption...' : 'Type a message...'}
                  value={newMessage}
                  onChange={handleTyping}
                  className="input-field flex-1 py-2.5 text-sm"
                />

                <button
                  type="submit"
                  disabled={!newMessage.trim() && !attachment}
                  className="gradient-btn px-5 py-2.5 rounded-xl disabled:opacity-40 flex items-center justify-center shrink-0"
                >
                  <Send size={16} />
                </button>
              </form>
            </>
          )}
        </div>
      </div>

      {/* Lightbox / Image Preview Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setPreviewImage(null)}
        >
          <button
            onClick={() => setPreviewImage(null)}
            className="absolute top-5 right-5 text-white/80 hover:text-white p-2 rounded-full bg-black/40 hover:bg-black/60 transition-colors"
          >
            <X size={24} />
          </button>
          <img
            src={previewImage}
            alt="Full view"
            className="max-h-[90vh] max-w-[90vw] object-contain rounded-xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* Start New Conversation Modal */}
      <AnimatePresence>
        {showNewChatModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="glass rounded-3xl p-6 w-full max-w-lg shadow-2xl border border-white/20 dark:border-dark-700 relative flex flex-col max-h-[85vh]"
            >
              <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-dark-700">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-primary-100 dark:bg-primary-900/40 text-primary-600 dark:text-primary-400">
                    <UserPlus size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-dark-900 dark:text-white">Start a Conversation</h3>
                    <p className="text-xs text-gray-500">Search registered students & alumni</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowNewChatModal(false)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-dark-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-dark-700"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Search input in modal */}
              <div className="py-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="text"
                    autoFocus
                    placeholder="Search by name, company, course, or skills..."
                    value={userSearchQuery}
                    onChange={(e) => setUserSearchQuery(e.target.value)}
                    className="input-field pl-9 py-2.5 text-sm w-full"
                  />
                </div>
              </div>

              {/* Results List */}
              <div className="flex-1 overflow-y-auto space-y-2 py-2 pr-1">
                {searchingUsers ? (
                  <div className="py-8 text-center text-gray-400 text-xs">Searching users...</div>
                ) : userSearchResults.length === 0 ? (
                  <div className="py-8 text-center text-gray-400 text-xs">
                    <Users size={32} className="mx-auto mb-2 text-gray-300 dark:text-dark-600" />
                    No users found matching "{userSearchQuery}"
                  </div>
                ) : (
                  userSearchResults.map((u) => (
                    <button
                      key={u._id}
                      onClick={() => handleStartChatWithUser(u)}
                      className="w-full p-3 rounded-2xl flex items-center justify-between gap-3 text-left hover:bg-primary-50/60 dark:hover:bg-dark-700/60 transition-colors border border-transparent hover:border-primary-100 dark:hover:border-dark-600"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar src={u.avatar} name={u.name} size="md" />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-sm text-dark-900 dark:text-white truncate">{u.name}</p>
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300">
                              {u.role}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 truncate mt-0.5">
                            {u.headline || u.company || u.course || 'AlumniSphere Member'}
                          </p>
                        </div>
                      </div>

                      <span className="px-3 py-1.5 rounded-xl text-xs font-semibold gradient-btn shrink-0 flex items-center gap-1 shadow-sm">
                        <MessageCircle size={13} /> Chat
                      </span>
                    </button>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
