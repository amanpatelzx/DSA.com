import { io } from 'socket.io-client';

const API_URL = 'http://localhost:5000';

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function createClient(userId, username, rating = 1500) {
  const socket = io(API_URL, {
    transports: ['websocket'],
    forceNew: true
  });

  return new Promise((resolve) => {
    socket.on('connect', () => {
      socket.emit('presence:online', { userId, username, rating, avatar: '' });
      resolve(socket);
    });
  });
}

async function runTests() {
  console.log('🧪 Starting Global Open Challenges & Matchmaking Lobby Integration Tests...');

  let clientA, clientB, clientC;

  try {
    clientA = await createClient('user_a', 'Alice', 1650);
    clientB = await createClient('user_b', 'Bob', 1520);
    clientC = await createClient('user_c', 'Charlie', 1700);
    console.log('✅ Connected 3 test clients (Alice, Bob, Charlie) to Socket server');

    // Wait a brief moment for registrations
    await wait(200);

    // ==========================================
    // TEST 1: Open Challenge Creation & Listing
    // ==========================================
    console.log('\n--- TEST 1: Open Challenge Creation & Real-Time Broadcast ---');
    let chalUpdateReceivedByB = null;
    clientB.on('open_challenges:update', (list) => {
      chalUpdateReceivedByB = list;
    });

    clientA.emit('open_challenge:create', {
      mode: 'Blitz',
      timeControl: '5 + 0',
      isRated: true,
      problemsCount: 1
    });

    await wait(400);

    if (!chalUpdateReceivedByB || chalUpdateReceivedByB.length === 0) {
      throw new Error('TEST 1 FAILED: Client B did not receive open challenge update');
    }

    const aliceChallenge = chalUpdateReceivedByB.find(c => c.creator.username === 'Alice');
    if (!aliceChallenge || aliceChallenge.mode !== 'Blitz' || aliceChallenge.timeControl !== '5 + 0') {
      throw new Error(`TEST 1 FAILED: Challenge properties mismatch: ${JSON.stringify(aliceChallenge)}`);
    }
    console.log('✅ TEST 1 PASSED: Alice posted Blitz 5+0 challenge, Bob received it in open challenges list.');

    // Clean up Test 1 challenge
    clientA.emit('open_challenge:cancel', { challengeId: aliceChallenge.challengeId });
    await wait(300);

    // ==========================================
    // TEST 2: Manual Accept of Open Challenge
    // ==========================================
    console.log('\n--- TEST 2: Manual Accept of Open Challenge ---');
    let aliceStarted = null;
    let bobStarted = null;

    clientA.on('challenge:started', (data) => { aliceStarted = data; });
    clientB.on('challenge:started', (data) => { bobStarted = data; });

    // Alice creates challenge
    clientA.emit('open_challenge:create', {
      mode: 'Rapid',
      timeControl: '15 + 0',
      isRated: true
    });

    await wait(400);
    const rapidChal = chalUpdateReceivedByB.find(c => c.creator.username === 'Alice');
    if (!rapidChal) throw new Error('TEST 2 FAILED: Rapid challenge not found');

    // Bob accepts Alice's challenge
    clientB.emit('open_challenge:accept', { challengeId: rapidChal.challengeId });
    await wait(500);

    if (!aliceStarted || !bobStarted) {
      throw new Error(`TEST 2 FAILED: Both players did not receive challenge:started. Alice: ${!!aliceStarted}, Bob: ${!!bobStarted}`);
    }

    if (aliceStarted.battleId !== bobStarted.battleId) {
      throw new Error(`TEST 2 FAILED: Battle IDs do not match: ${aliceStarted.battleId} vs ${bobStarted.battleId}`);
    }
    console.log(`✅ TEST 2 PASSED: Bob accepted Alice's challenge. Battle started: ${aliceStarted.battleId}`);

    // Remove listeners
    clientA.off('challenge:started');
    clientB.off('challenge:started');

    // ==========================================
    // TEST 3: Theme Auto-Matching (e.g. Bullet 10 min)
    // ==========================================
    console.log('\n--- TEST 3: Theme Auto-Matching (Bullet 10 min vs Bullet 10 min) ---');
    let autoAliceStarted = null;
    let autoBobStarted = null;

    clientA.on('challenge:started', (data) => { autoAliceStarted = data; });
    clientB.on('challenge:started', (data) => { autoBobStarted = data; });

    // Alice posts Bullet 10 + 0
    console.log('Alice posts Bullet 10 + 0 challenge...');
    clientA.emit('open_challenge:create', {
      mode: 'Bullet',
      timeControl: '10 + 0',
      isRated: true
    });

    await wait(300);

    // Bob posts SAME THEME: Bullet 10 + 0
    console.log('Bob posts identical theme Bullet 10 + 0 challenge...');
    clientB.emit('open_challenge:create', {
      mode: 'Bullet',
      timeControl: '10 + 0',
      isRated: true
    });

    await wait(500);

    if (!autoAliceStarted || !autoBobStarted) {
      throw new Error(`TEST 3 FAILED: Auto-match did not start battle for both players. Alice: ${!!autoAliceStarted}, Bob: ${!!autoBobStarted}`);
    }

    if (autoAliceStarted.battleId !== autoBobStarted.battleId) {
      throw new Error(`TEST 3 FAILED: Battle IDs do not match in auto-match`);
    }

    console.log(`✅ TEST 3 PASSED: Automatic theme match triggered instantly without manual accept! BattleId: ${autoAliceStarted.battleId}`);

    // Clean listeners
    clientA.off('challenge:started');
    clientB.off('challenge:started');

    // ==========================================
    // TEST 4: Self-Challenge Disappears on Accepting Another Challenge
    // "lets take a sitution i send the challenge then that challenge get listed on there , but if i accept any other challenge , then my challange should get disappear from challange list"
    // ==========================================
    console.log('\n--- TEST 4: Self-Challenge Disappearance Upon Accepting Another Challenge ---');

    let chalUpdateForCharlie = null;
    clientC.on('open_challenges:update', (list) => {
      chalUpdateForCharlie = list;
    });

    // 1. Charlie posts a challenge (Blitz 3+0)
    clientC.emit('open_challenge:create', {
      mode: 'Blitz',
      timeControl: '3 + 0',
      isRated: true
    });

    await wait(300);

    // 2. Alice posts a different challenge (Bullet 1+0)
    clientA.emit('open_challenge:create', {
      mode: 'Bullet',
      timeControl: '1 + 0',
      isRated: true
    });

    await wait(400);

    // Verify both challenges exist in lobby
    const hasCharlie = chalUpdateForCharlie.some(c => c.creator.username === 'Charlie');
    const hasAlice = chalUpdateForCharlie.some(c => c.creator.username === 'Alice');
    if (!hasCharlie || !hasAlice) {
      throw new Error(`TEST 4 FAILED: Both challenges were not listed. Charlie: ${hasCharlie}, Alice: ${hasAlice}`);
    }
    console.log(`Initial state verified: Both Charlie (Blitz 3+0) and Alice (Bullet 1+0) are listed in open challenges.`);

    // 3. Now Alice decides to accept Charlie's challenge!
    const charlieChal = chalUpdateForCharlie.find(c => c.creator.username === 'Charlie');
    console.log(`Alice (who had an open challenge) accepts Charlie's challenge...`);
    clientA.emit('open_challenge:accept', { challengeId: charlieChal.challengeId });

    await wait(500);

    // Verify Alice's OWN challenge was cleaned up and removed!
    const stillHasAlice = chalUpdateForCharlie.some(c => c.creator.username === 'Alice');
    const stillHasCharlie = chalUpdateForCharlie.some(c => c.creator.username === 'Charlie');

    if (stillHasAlice) {
      throw new Error('TEST 4 FAILED: Alice\'s open challenge was NOT removed after she accepted Charlie\'s challenge!');
    }
    if (stillHasCharlie) {
      throw new Error('TEST 4 FAILED: Charlie\'s challenge was NOT removed after being accepted!');
    }

    console.log('✅ TEST 4 PASSED: When Alice accepted Charlie\'s challenge, Alice\'s own open challenge disappeared from the list immediately!');

    console.log('\n🎉 ALL 4 TESTS PASSED FLAWLESSLY! Real-time Global Open Challenges & Matchmaking Lobby is 100% verified.');

  } finally {
    if (clientA) clientA.disconnect();
    if (clientB) clientB.disconnect();
    if (clientC) clientC.disconnect();
  }
}

runTests().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
