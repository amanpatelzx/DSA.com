import axios from 'axios';
import fs from 'fs';

const API_URL = 'http://localhost:5000';

async function runTests() {
  console.log('🧪 Starting Real Users Leaderboard & Community Link Tests...\n');

  let passed = 0;
  let total = 0;

  function assert(condition, desc) {
    total++;
    if (condition) {
      console.log(`✅ [PASS] ${desc}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${desc}`);
    }
  }

  // 1. Check App.jsx Leaderboard link
  const appContent = fs.readFileSync('apps/web/src/App.jsx', 'utf-8');
  assert(
    appContent.includes('to="/community?tab=leaderboard"'),
    'Homepage Leaderboard link correctly points to "/community?tab=leaderboard"'
  );

  // 2. Fetch Leaderboard from API
  const res = await axios.get(`${API_URL}/api/users/leaderboard?sortBy=blitz`);
  const users = res.data;

  console.log(`\nFetched ${users.length} leaderboard users:`);
  users.forEach(u => {
    console.log(`  #${u.rank} ${u.username} (${u.displayName || 'No Name'}) - Email: ${u.email || 'N/A'}`);
  });

  // 3. Verify that all returned users are real registered users
  const invalidUsers = users.filter(u =>
    u.isBot === true ||
    u.role === 'BOT' ||
    /bot|stockfish|computer|deepcoder/i.test(u.username) ||
    /^(test_|tester_|testuser|dp_tester|social_tester|resign_user|tourney|tourneyhero|coder_alice|coder_bob|coder_\d+|u_\d+)/i.test(u.username) ||
    /@(example\.com|test\.com|bot\.local|dummy\.com)$/i.test(u.email || '')
  );

  assert(invalidUsers.length === 0, `Leaderboard contains 0 bots and 0 dummy/test accounts (found: ${invalidUsers.length})`);

  // 4. Verify ranking sequence is 1, 2, 3...
  const ranks = users.map(u => u.rank);
  const expectedRanks = users.map((_, i) => i + 1);
  assert(
    JSON.stringify(ranks) === JSON.stringify(expectedRanks),
    `Ranks are sequential starting at 1: [${ranks.join(', ')}]`
  );

  // 5. Test search exclusion
  const searchRes = await axios.get(`${API_URL}/api/users/search?q=test`);
  const testSearchResults = searchRes.data.filter(u =>
    /^(test_|tester_|testuser|dp_tester|social_tester|resign_user|tourney|tourneyhero|coder_alice|coder_bob|coder_\d+|u_\d+)/i.test(u.username)
  );
  assert(testSearchResults.length === 0, 'Search results also exclude test/dummy accounts');

  console.log(`\n========================================`);
  console.log(`TEST SUMMARY: ${passed} / ${total} tests passed!`);
  console.log(`========================================\n`);

  if (passed === total) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
