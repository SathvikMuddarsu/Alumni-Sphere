const { io: ioClient } = require('../frontend/node_modules/socket.io-client');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
require('dotenv').config({ path: __dirname + '/.env' });

const User = require('./models/User');
const Message = require('./models/Message');

const BACKEND_URL = 'http://localhost:5000';
const JWT_SECRET = process.env.JWT_SECRET || 'alumnisphere_jwt_secret_dev_key_2024';
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/alumnisphere';

async function runTwoAccountTest() {
  console.log('🧪 Starting Two-Account Live Socket.IO & Database Verification...\n');

  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected to MongoDB');

  // Find or create Student A and Alumni B
  let studentA = await User.findOne({ email: 'arjun@student.com' });
  let alumniB = await User.findOne({ email: 'priya@alumni.com' });

  if (!studentA) {
    studentA = await User.create({
      name: 'Arjun Verma',
      email: 'arjun@student.com',
      password: 'Password123!',
      role: 'student',
      course: 'B.Tech CSE',
    });
  }

  if (!alumniB) {
    alumniB = await User.create({
      name: 'Priya Sharma',
      email: 'priya@alumni.com',
      password: 'Password123!',
      role: 'alumni',
      company: 'Google',
      headline: 'Software Engineer III',
    });
  }

  const tokenStudentA = jwt.sign({ id: studentA._id.toString(), role: studentA.role }, JWT_SECRET, { expiresIn: '1d' });
  const tokenAlumniB = jwt.sign({ id: alumniB._id.toString(), role: alumniB.role }, JWT_SECRET, { expiresIn: '1d' });

  console.log(`👨‍🎓 Student A: ${studentA.name} (${studentA._id})`);
  console.log(`👩‍💼 Alumni B: ${alumniB.name} (${alumniB._id})`);

  // Connect Student A Socket
  const socketA = ioClient(BACKEND_URL, {
    auth: { token: tokenStudentA },
    transports: ['websocket'],
  });

  // Connect Alumni B Socket
  const socketB = ioClient(BACKEND_URL, {
    auth: { token: tokenAlumniB },
    transports: ['websocket'],
  });

  await new Promise((resolve) => {
    let connected = 0;
    socketA.on('connect', () => {
      console.log('🔌 Student A connected to Socket server');
      if (++connected === 2) resolve();
    });
    socketB.on('connect', () => {
      console.log('🔌 Alumni B connected to Socket server');
      if (++connected === 2) resolve();
    });
  });

  const conversationId = [studentA._id.toString(), alumniB._id.toString()].sort().join('_');
  console.log(`💬 Conversation ID: ${conversationId}\n`);

  // Step 1: Alumni B sends message to Student A
  const msgFromAlumniText = `Hello Arjun! Welcome to AlumniSphere. How is your CSE semester going? [${Date.now()}]`;
  console.log(`📤 Step 1: Alumni B sending message -> Student A: "${msgFromAlumniText}"`);

  const studentReceivedMsgPromise = new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Timeout: Student A did not receive message from Alumni B')), 7000);
    socketA.on('newMessage', (msg) => {
      if (msg.content === msgFromAlumniText) {
        clearTimeout(timeout);
        console.log(`📥 Step 2: Student A successfully received message in real-time from: ${msg.sender.name}`);
        resolve(msg);
      }
    });
  });

  socketB.emit('sendMessage', {
    receiver: studentA._id.toString(),
    content: msgFromAlumniText,
  });

  const receivedByA = await studentReceivedMsgPromise;

  // Step 2: Student A replies to Alumni B
  const replyFromStudentText = `Hi Priya! It's going great! Could you advise on Cloud System Architecture? [${Date.now()}]`;
  console.log(`\n📤 Step 3: Student A replying -> Alumni B: "${replyFromStudentText}"`);

  const alumniReceivedReplyPromise = new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Timeout: Alumni B did not receive reply from Student A')), 7000);
    socketB.on('newMessage', (msg) => {
      if (msg.content === replyFromStudentText) {
        clearTimeout(timeout);
        console.log(`📥 Step 4: Alumni B successfully received reply in real-time from: ${msg.sender.name}`);
        resolve(msg);
      }
    });
  });

  socketA.emit('sendMessage', {
    receiver: alumniB._id.toString(),
    content: replyFromStudentText,
  });

  const receivedByB = await alumniReceivedReplyPromise;

  // Step 3: Refresh simulation - query MongoDB directly
  console.log('\n🔄 Step 5: Simulating browser refresh & inspecting MongoDB persistence...');
  const persistedMessages = await Message.find({ conversationId })
    .sort({ createdAt: 1 })
    .populate('sender', 'name email role')
    .populate('receiver', 'name email role');

  console.log(`✅ Retrieved ${persistedMessages.length} total messages from MongoDB for conversation: ${conversationId}`);

  const hasAlumniMsg = persistedMessages.some((m) => m.content === msgFromAlumniText);
  const hasStudentReply = persistedMessages.some((m) => m.content === replyFromStudentText);

  if (!hasAlumniMsg || !hasStudentReply) {
    throw new Error('Messages were not persisted in MongoDB!');
  }

  console.log('✅ Both messages verified in MongoDB database!');
  console.log(`   - "${msgFromAlumniText}" (Saved at: ${receivedByA.createdAt})`);
  console.log(`   - "${replyFromStudentText}" (Saved at: ${receivedByB.createdAt})`);

  // Cleanup sockets and DB connection
  socketA.disconnect();
  socketB.disconnect();
  await mongoose.disconnect();

  console.log('\n🎉 TWO-ACCOUNT REAL-TIME MESSAGING VERIFICATION PASSED 100%!');
  process.exit(0);
}

runTwoAccountTest().catch((err) => {
  console.error('❌ Test failed with error:', err);
  process.exit(1);
});
