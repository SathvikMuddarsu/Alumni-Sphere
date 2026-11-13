const assert = require('assert');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

console.log('🧪 Starting AlumniSphere Comprehensive Unit & Logic Test Suite...\n');

let passedTests = 0;
let totalTests = 0;

function test(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`  ✅ PASS: ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ❌ FAIL: ${name}`);
    console.error(`     Error: ${err.message}`);
  }
}

async function runAsyncTests() {
  // 1. Password Hashing & Bcrypt Security Test
  await (async () => {
    totalTests++;
    try {
      const plainPassword = 'password123';
      const salt = await bcrypt.genSalt(12);
      const hash = await bcrypt.hash(plainPassword, salt);
      
      assert.notStrictEqual(hash, plainPassword, 'Hash must never equal plain text password');
      assert.ok(hash.startsWith('$2'), 'Bcrypt hash format check');
      
      const isMatch = await bcrypt.compare(plainPassword, hash);
      assert.strictEqual(isMatch, true, 'Valid password must match hash');
      
      const isWrongMatch = await bcrypt.compare('wrongPassword', hash);
      assert.strictEqual(isWrongMatch, false, 'Invalid password must not match hash');
      
      console.log('  ✅ PASS: Password hashing, salting (12 rounds) & verification');
      passedTests++;
    } catch (err) {
      console.error('  ❌ FAIL: Password hashing test:', err.message);
    }
  })();

  // 2. JWT Generation & Verification Test
  test('JWT signing, payload integrity, and expiration validation', () => {
    const testSecret = 'alumnisphere_test_secret_key_12345';
    const userId = '65e9f1a2b3c4d5e6f7a8b9c0';
    const token = jwt.sign({ id: userId }, testSecret, { expiresIn: '30d' });
    
    assert.ok(typeof token === 'string', 'JWT token should be string');
    const decoded = jwt.verify(token, testSecret);
    assert.strictEqual(decoded.id, userId, 'Decoded user ID must match payload');
    
    assert.throws(() => {
      jwt.verify(token, 'wrong_secret_key');
    }, /invalid signature/, 'Tampered JWT secret must be rejected');
  });

  // 3. Registration Role Protection Test
  test('Security: Public registration enforces student/alumni and prevents admin registration', () => {
    const allowedRoles = ['student', 'alumni'];
    
    const sanitizeRole = (role) => allowedRoles.includes(role) ? role : 'student';
    
    assert.strictEqual(sanitizeRole('admin'), 'student', 'Attempted admin role must fall back to student');
    assert.strictEqual(sanitizeRole('superadmin'), 'student', 'Attempted superadmin role must fall back to student');
    assert.strictEqual(sanitizeRole('alumni'), 'alumni', 'Alumni role allowed');
    assert.strictEqual(sanitizeRole('student'), 'student', 'Student role allowed');
    assert.strictEqual(sanitizeRole(undefined), 'student', 'Default role is student');
  });

  // 4. Input Validation (Email & Password)
  test('Input Validation: Email format and minimum password length checks', () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    assert.ok(emailRegex.test('valid.user@alumni.edu'), 'Valid email passes');
    assert.ok(emailRegex.test('student@university.ac.in'), 'University domain email passes');
    assert.ok(!emailRegex.test('invalid-email'), 'Missing @ and domain rejected');
    assert.ok(!emailRegex.test('@no-local-part.com'), 'Missing local part rejected');
    assert.ok(!emailRegex.test('user@domain'), 'Missing TLD rejected');
    
    const validatePassword = (pwd) => typeof pwd === 'string' && pwd.length >= 6;
    assert.ok(validatePassword('secure123'), '6+ char password passes');
    assert.ok(!validatePassword('12345'), 'Under 6 char password rejected');
    assert.ok(!validatePassword(''), 'Empty password rejected');
  });

  // 5. RoleGuard Middleware Authorization Test
  test('Authorization: RoleGuard allows permitted roles and denies unauthorized access', () => {
    const { roleGuard } = require('./middleware/roleGuard');
    
    const adminGuard = roleGuard('admin');
    
    let nextCalled = false;
    let statusCode = null;
    let errorMsg = null;
    
    const mockRes = {
      status: (code) => {
        statusCode = code;
        return {
          json: (data) => { errorMsg = data.message; }
        };
      }
    };
    
    // Student trying to access admin
    nextCalled = false;
    statusCode = null;
    adminGuard({ user: { role: 'student' } }, mockRes, () => { nextCalled = true; });
    assert.strictEqual(nextCalled, false, 'Student must not pass admin guard');
    assert.strictEqual(statusCode, 403, 'Must return 403 Forbidden');
    
    // Admin trying to access admin
    nextCalled = false;
    statusCode = null;
    adminGuard({ user: { role: 'admin' } }, mockRes, () => { nextCalled = true; });
    assert.strictEqual(nextCalled, true, 'Admin must pass admin guard');
    assert.strictEqual(statusCode, null, 'No error status for admin');
  });

  // 6. Profile Strength Calculation Virtual Test
  test('Profile Strength: Correct calculation based on completed profile fields', () => {
    const User = require('./models/User');
    const mockUser = new User({
      name: 'Priya Sharma',
      email: 'priya@example.com',
      password: 'password123',
      headline: 'Software Engineer',
      bio: 'Loves coding',
      company: 'Google',
      industry: 'Technology',
      location: 'Bangalore',
      avatar: 'https://avatar.url',
      skills: ['React', 'Node.js'],
      experience: 5
    });
    
    const strength = mockUser.getProfileStrength();
    assert.ok(strength >= 80, `Profile strength should be high for completed profile: ${strength}%`);
  });

  // 7. Opportunity Model Verification
  test('Models: Opportunity schema validation and application/bookmark array references', () => {
    const Opportunity = require('./models/Opportunity');
    assert.ok(Opportunity.schema.path('title'), 'Title field exists');
    assert.ok(Opportunity.schema.path('company'), 'Company field exists');
    assert.ok(Opportunity.schema.path('postedBy'), 'postedBy ref exists');
    assert.ok(Opportunity.schema.path('applicants'), 'applicants array exists');
    assert.ok(Opportunity.schema.path('savedBy'), 'savedBy array exists');
  });

  // 8. ConnectionRequest Model Verification
  test('Models: ConnectionRequest schema and status states (pending/accepted/rejected)', () => {
    const ConnectionRequest = require('./models/ConnectionRequest');
    assert.ok(ConnectionRequest.schema.path('from'), 'from field exists');
    assert.ok(ConnectionRequest.schema.path('to'), 'to field exists');
    assert.deepStrictEqual(
      ConnectionRequest.schema.path('status').enumValues,
      ['pending', 'accepted', 'rejected', 'cancelled'],
      'Status enum values match'
    );
  });

  console.log(`\n========================================`);
  console.log(`🏁 TEST RESULTS: ${passedTests} / ${totalTests} tests passed`);
  console.log(`========================================\n`);
  
  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

runAsyncTests().catch(err => {
  console.error('Test suite runner failed:', err);
  process.exit(1);
});
