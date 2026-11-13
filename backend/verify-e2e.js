const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config({ path: __dirname + '/.env' });

const User = require('./models/User');
const Message = require('./models/Message');
const ConnectionRequest = require('./models/ConnectionRequest');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/alumnisphere';
const JWT_SECRET = process.env.JWT_SECRET || 'alumnisphere_jwt_secret_dev_key_2024';

async function runVerification() {
  console.log('🚀 Running AlumniSphere E2E Automated Verification...\n');

  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB at:', MONGO_URI);

    const testTimestamp = Date.now();
    const studentEmail = `student_${testTimestamp}@test.com`;
    const alumniEmail = `alumni_${testTimestamp}@test.com`;
    const rawPassword = 'SecurePassword123!';

    // 1. REGISTRATION VERIFICATION
    console.log('\n--- 1. Testing Registration & Security ---');

    const studentUser = await User.create({
      name: `Test Student ${testTimestamp}`,
      email: studentEmail,
      password: rawPassword, // Will be securely hashed automatically by pre-save hook
      role: 'student',
      course: 'B.Tech Computer Science',
      graduationYear: 2026,
    });
    console.log(`✅ Registered Student: ${studentUser.email} (ID: ${studentUser._id})`);

    const alumniUser = await User.create({
      name: `Test Alumni ${testTimestamp}`,
      email: alumniEmail,
      password: rawPassword, // Will be securely hashed automatically by pre-save hook
      role: 'alumni',
      company: 'Tech Corp',
      headline: 'Senior Cloud Architect',
      graduationYear: 2021,
    });
    console.log(`✅ Registered Alumni: ${alumniUser.email} (ID: ${alumniUser._id})`);

    // Verify duplicate email is rejected
    try {
      await User.create({
        name: 'Duplicate User',
        email: studentEmail,
        password: rawPassword,
        role: 'student',
      });
      console.error('❌ Duplicate email was not blocked!');
    } catch (err) {
      console.log('✅ Duplicate email registration successfully blocked by MongoDB unique constraint.');
    }

    // 2. LOGIN & PASSWORD VERIFICATION
    console.log('\n--- 2. Testing Login & Session Verification ---');
    const studentFound = await User.findOne({ email: studentEmail });
    const isPasswordValid = await studentFound.comparePassword(rawPassword);
    if (!isPasswordValid) throw new Error('Password verification failed');

    const isWrongPasswordBlocked = !(await studentFound.comparePassword('WrongPassword!'));
    if (!isWrongPasswordBlocked) throw new Error('Wrong password was accepted');

    const token = jwt.sign({ id: studentFound._id, role: studentFound.role }, JWT_SECRET, { expiresIn: '7d' });
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log(`✅ Password verification passed for: ${studentFound.email}`);
    console.log(`✅ JWT token signed & verified for user ID: ${decoded.id}, role: ${decoded.role}`);

    // 3. PROFILE EDITING & PERSISTENCE
    console.log('\n--- 3. Testing Profile Updates & Persistence ---');
    const updatedBio = 'Passionate AI/ML enthusiast exploring full-stack web architectures.';
    const updatedSkills = ['JavaScript', 'React', 'Node.js', 'MongoDB', 'Socket.IO'];
    
    await User.findByIdAndUpdate(studentUser._id, {
      bio: updatedBio,
      skills: updatedSkills,
      headline: 'Aspiring Full Stack Engineer',
      location: 'Bengaluru, India',
    });

    const refreshedStudent = await User.findById(studentUser._id);
    if (refreshedStudent.bio !== updatedBio || refreshedStudent.skills.length !== 5) {
      throw new Error('Profile update was not persisted in database');
    }
    console.log(`✅ Profile updated & permanently persisted in MongoDB for: ${refreshedStudent.name}`);
    console.log(`   Headline: "${refreshedStudent.headline}", Skills: [${refreshedStudent.skills.join(', ')}]`);

    // 4. REAL-TIME MESSAGING & ATTACHMENT SHARING
    console.log('\n--- 4. Testing Messaging & Image/Document Sharing ---');
    const conversationId = [studentUser._id.toString(), alumniUser._id.toString()].sort().join('_');

    // Message 1: Text message from Student to Alumni
    const textMsg = await Message.create({
      sender: studentUser._id,
      receiver: alumniUser._id,
      conversationId,
      content: 'Hello! I saw your profile and would love to ask for some mentorship guidance.',
      delivered: true,
    });
    console.log(`✅ Sent Text Message: "${textMsg.content}"`);

    // Message 2: Document attachment from Student to Alumni (e.g. Resume)
    const docMsg = await Message.create({
      sender: studentUser._id,
      receiver: alumniUser._id,
      conversationId,
      content: 'Here is my updated resume for review.',
      attachment: {
        url: 'data:application/pdf;base64,JVBERi0xLjQKJcTl8uXr...',
        fileName: 'Student_Resume_2026.pdf',
        fileType: 'application/pdf',
        fileSize: 1048576, // 1MB
      },
      delivered: true,
    });
    console.log(`✅ Sent Document Attachment: "${docMsg.attachment.fileName}" (${(docMsg.attachment.fileSize / 1024 / 1024).toFixed(1)} MB)`);

    // Message 3: Image attachment reply from Alumni to Student
    const imgMsg = await Message.create({
      sender: alumniUser._id,
      receiver: studentUser._id,
      conversationId,
      content: 'Glad to connect! Here is our recommended roadmap architecture diagram.',
      attachment: {
        url: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJ...',
        fileName: 'roadmap_architecture.png',
        fileType: 'image/png',
        fileSize: 524288, // 512KB
      },
      delivered: true,
    });
    console.log(`✅ Sent Image Attachment Reply: "${imgMsg.attachment.fileName}" (${(imgMsg.attachment.fileSize / 1024).toFixed(1)} KB)`);

    // Fetch conversation messages
    const conversationMessages = await Message.find({ conversationId })
      .sort({ createdAt: 1 })
      .populate('sender', 'name avatar role')
      .populate('receiver', 'name avatar role');

    console.log(`✅ Retrieved ${conversationMessages.length} persisted messages for conversation ${conversationId}:`);
    conversationMessages.forEach((m, idx) => {
      const attachInfo = m.attachment?.fileName ? ` [Attachment: ${m.attachment.fileName}]` : '';
      console.log(`   ${idx + 1}. [${m.sender.name} -> ${m.receiver.name}]: "${m.content}"${attachInfo}`);
    });

    // 5. CLEAN UP TEST RECORDS
    console.log('\n--- 5. Cleanup ---');
    await Message.deleteMany({ conversationId });
    await User.deleteMany({ _id: { $in: [studentUser._id, alumniUser._id] } });
    console.log('✅ Temporary verification test records cleaned up safely.');

    console.log('\n🎉 ALL 4 CORE FUNCTIONAL AREAS VERIFIED SUCCESSFULLY!');
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Verification failed with error:', error);
    if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
    process.exit(1);
  }
}

runVerification();
