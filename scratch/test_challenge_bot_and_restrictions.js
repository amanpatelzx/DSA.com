import axios from 'axios';

const API_URL = 'http://localhost:5000';

async function runTests() {
  console.log('🧪 Starting Challenge Bot & Bot Restrictions Verification Tests...\n');

  let testsPassed = 0;
  let testsTotal = 0;

  function assert(condition, description) {
    testsTotal++;
    if (condition) {
      console.log(`✅ [PASS] ${description}`);
      testsPassed++;
    } else {
      console.error(`❌ [FAIL] ${description}`);
    }
  }

  try {
    // 1. Check Leaderboards: Bots must never appear in leaderboards
    console.log('--- 1. LEADERBOARD EXCLUSION TESTS ---');
    const formats = ['blitz', 'rapid', 'bullet', 'solved'];
    for (const fmt of formats) {
      const res = await axios.get(`${API_URL}/api/users/leaderboard?sortBy=${fmt}&limit=100`);
      const users = res.data;
      const botFound = users.find(u =>
        u.isBot === true ||
        u.role === 'BOT' ||
        /bot|stockfish|computer|deepcoder/i.test(u.username)
      );
      assert(!botFound, `Leaderboard (${fmt}) contains 0 bots (total entries: ${users.length})`);
    }

    // 2. Check User Search: Bots must not appear in search
    console.log('\n--- 2. USER SEARCH EXCLUSION TESTS ---');
    const searchQueries = ['bot', 'stockfish', 'deepcoder'];
    for (const q of searchQueries) {
      const sRes = await axios.get(`${API_URL}/api/users/search?q=${q}`);
      const results = sRes.data;
      const botFound = results.find(u =>
        u.isBot === true ||
        u.role === 'BOT' ||
        /bot|stockfish|computer|deepcoder/i.test(u.username)
      );
      assert(!botFound, `User search for "${q}" returned 0 bots`);
    }

    // 3. Check Friend Request: No one can friend a bot
    console.log('\n--- 3. UNFRIENDABLE BOT TESTS ---');
    // Register/login test user
    const testUsername = `u_${Date.now().toString().slice(-8)}`;
    const regRes = await axios.post(`${API_URL}/api/auth/register`, {
      username: testUsername,
      email: `${testUsername}@example.com`,
      password: 'Password123!',
      displayName: 'Test User'
    });
    const token = regRes.data.token;
    assert(Boolean(token), 'Registered test user successfully');

    const botTargets = ['stockfishalgo', 'bytebot', 'deepcoder'];
    for (const botName of botTargets) {
      try {
        await axios.post(
          `${API_URL}/api/users/friend-request/${botName}`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
        assert(false, `Expected friend-request to ${botName} to fail, but it succeeded!`);
      } catch (err) {
        const status = err.response?.status;
        const msg = err.response?.data?.message;
        assert(
          status === 400 && msg === 'Bots cannot be added as friends.',
          `Friend request to ${botName} rejected with HTTP 400: "${msg}"`
        );
      }
    }

    // 4. Check Friends List: Bot should never be in friends list
    console.log('\n--- 4. FRIENDS LIST EXCLUSION TEST ---');
    const friendsRes = await axios.get(`${API_URL}/api/users/${testUsername}/friends`);
    const friendsList = friendsRes.data.friends || [];
    const botInFriends = friendsList.find(f =>
      f.isBot === true ||
      /bot|stockfish|deepcoder/i.test(f.username)
    );
    assert(!botInFriends && friendsList.length === 0, 'Friends list contains no bots');

    // 5. Check Bot Profile: Bot exists and has icon 🤖
    console.log('\n--- 5. BOT PROFILE & AVATAR TESTS ---');
    for (const botName of botTargets) {
      const pRes = await axios.get(`${API_URL}/api/users/${botName}`);
      const botProfile = pRes.data?.user;
      assert(
        botProfile && (botProfile.isBot === true || botProfile.role === 'BOT'),
        `Profile for ${botName} exists and has isBot: true or role: 'BOT'`
      );
    }

    console.log(`\n========================================`);
    console.log(`TEST SUMMARY: ${testsPassed} / ${testsTotal} tests passed!`);
    console.log(`========================================\n`);

    if (testsPassed === testsTotal) {
      process.exit(0);
    } else {
      process.exit(1);
    }
  } catch (err) {
    console.error('Test execution error:', err.response?.data || err.message);
    process.exit(1);
  }
}

runTests();
