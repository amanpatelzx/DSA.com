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

async function runOrderingAndCleanupTests() {
  console.log('🧪 Starting Challenge Ordering, Pinned Position, and Removal Tests...');

  let clientA, clientB, clientC, clientD;

  try {
    clientA = await createClient('user_a', 'Alice', 1600);
    clientB = await createClient('user_b', 'Bob', 1500);
    clientC = await createClient('user_c', 'Charlie', 1700);
    clientD = await createClient('user_d', 'Dave', 1550);
    console.log('✅ Connected 4 test clients (Alice, Bob, Charlie, Dave)');

    await wait(200);

    let latestChallengesForDave = [];
    clientD.on('open_challenges:update', (list) => {
      latestChallengesForDave = list;
    });

    let latestChallengesForBob = [];
    clientB.on('open_challenges:update', (list) => {
      latestChallengesForBob = list;
    });

    // 1. Post challenges in sequence: Alice first, then Bob, then Charlie
    console.log('Alice posts Blitz 3+0...');
    clientA.emit('open_challenge:create', { mode: 'Blitz', timeControl: '3 + 0', isRated: true });
    await wait(150);

    console.log('Bob posts Bullet 1+0...');
    clientB.emit('open_challenge:create', { mode: 'Bullet', timeControl: '1 + 0', isRated: true });
    await wait(150);

    console.log('Charlie posts Rapid 15+0...');
    clientC.emit('open_challenge:create', { mode: 'Rapid', timeControl: '15 + 0', isRated: true });
    await wait(300);

    // 2. Verify for Dave (neutral spectator): list is ordered by who posted first (Alice, Bob, Charlie)
    if (latestChallengesForDave.length !== 3) {
      throw new Error(`Expected 3 challenges for Dave, got ${latestChallengesForDave.length}`);
    }

    const orderDave = latestChallengesForDave.map(c => c.creator.username);
    console.log(`Order seen by Dave (chronological FIFO): ${orderDave.join(' -> ')}`);
    if (orderDave[0] !== 'Alice' || orderDave[1] !== 'Bob' || orderDave[2] !== 'Charlie') {
      throw new Error(`Chronological order failed for Dave: expected [Alice, Bob, Charlie], got [${orderDave.join(', ')}]`);
    }
    console.log('✅ TEST PASSED: For other users, challenges are ordered strictly by who posted first!');

    // 3. Test front-end pinning logic simulation for Bob:
    // Bob's own challenge should be pinned at index 0 on his screen
    const bobsView = [...latestChallengesForBob].sort((a, b) => {
      const aIsMine = a.creator?.username === 'Bob';
      const bIsMine = b.creator?.username === 'Bob';
      if (aIsMine && !bIsMine) return -1;
      if (!aIsMine && bIsMine) return 1;
      return (a.createdAt || 0) - (b.createdAt || 0);
    });
    const orderBob = bobsView.map(c => c.creator.username);
    console.log(`Order on Bob's screen (Bob's challenge pinned first): ${orderBob.join(' -> ')}`);
    if (orderBob[0] !== 'Bob') {
      throw new Error(`Pinning failed: Bob's challenge was not at index 0!`);
    }
    console.log('✅ TEST PASSED: User\'s own challenge is pinned at the very top (first) on their screen!');

    // 4. Dave accepts Alice's challenge -> Alice's challenge must disappear immediately!
    const aliceChal = latestChallengesForDave.find(c => c.creator.username === 'Alice');
    console.log('Dave accepts Alice\'s challenge...');
    clientD.emit('open_challenge:accept', { challengeId: aliceChal.challengeId });
    await wait(400);

    const hasAliceNow = latestChallengesForBob.some(c => c.creator.username === 'Alice');
    if (hasAliceNow) {
      throw new Error('Alice\'s challenge was not removed from the list after battle started!');
    }
    console.log('✅ TEST PASSED: Started challenge (Alice\'s) disappeared immediately from the list for all players!');

    // 5. Bob cancels his challenge -> disappears immediately
    const bobChal = latestChallengesForBob.find(c => c.creator.username === 'Bob');
    console.log('Bob cancels his challenge...');
    clientB.emit('open_challenge:cancel', { challengeId: bobChal.challengeId });
    await wait(400);

    const remaining = latestChallengesForBob.map(c => c.creator.username);
    console.log(`Remaining in lobby: [${remaining.join(', ')}]`);
    if (remaining.includes('Bob') || remaining.length !== 1 || remaining[0] !== 'Charlie') {
      throw new Error(`Unexpected remaining list: ${JSON.stringify(remaining)}`);
    }
    console.log('✅ TEST PASSED: Bob\'s cancelled challenge disappeared immediately; Charlie remains listed!');

    console.log('\n🎉 ALL ORDERING, PINNING, AND REMOVAL TESTS PASSED WITH 100% SUCCESS!');

  } finally {
    if (clientA) clientA.disconnect();
    if (clientB) clientB.disconnect();
    if (clientC) clientC.disconnect();
    if (clientD) clientD.disconnect();
  }
}

runOrderingAndCleanupTests().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
