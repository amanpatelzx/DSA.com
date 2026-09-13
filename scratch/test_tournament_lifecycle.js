import axios from 'axios';
import jwt from 'jsonwebtoken';
import { connectDB } from '../apps/api/src/config/db.js';
import User from '../apps/api/src/models/User.js';
import Tournament from '../apps/api/src/models/Tournament.js';
import mongoose from 'mongoose';

const JWT_SECRET = 'super_secret_jwt_key_123';
const API_URL = 'http://localhost:5000/api';

async function runLifecycleTest() {
  await connectDB();
  console.log('--- Starting Tournament Scheduled Lifecycle & Access Control Test ---');

  // 1. Get or setup users
  const adminUser = await User.findOne({ role: 'ADMIN' });
  let user1 = await User.findOne({ username: 'aman_coder_7337' });
  let user2 = await User.findOne({ username: 'rohit_hitman' });

  if (!user1) {
    user1 = await User.create({ username: 'test_user1', email: 'test_user1@test.com', role: 'USER' });
  }
  if (!user2) {
    user2 = await User.create({ username: 'test_user2', email: 'test_user2@test.com', role: 'USER' });
  }

  const adminToken = jwt.sign({ id: adminUser._id.toString() }, JWT_SECRET, { expiresIn: '1h' });
  const user1Token = jwt.sign({ id: user1._id.toString() }, JWT_SECRET, { expiresIn: '1h' });
  const user2Token = jwt.sign({ id: user2._id.toString() }, JWT_SECRET, { expiresIn: '1h' });

  // 2. Admin creates a tournament scheduled to start in 3 seconds with duration 0.05 minutes (3 seconds)
  const startTime = new Date(Date.now() + 3000); // 3 seconds in future
  const durationMinutes = 0.05; // 3 seconds

  console.log(`\nStep 1: Admin creating tournament scheduled for ${startTime.toISOString()}...`);
  const createRes = await axios.post(`${API_URL}/tournaments`, {
    title: 'Automated Lifecycle Test Tournament',
    description: 'Testing scheduled start time, auto live, and auto complete.',
    mode: 'Blitz',
    timeControl: '3 + 0',
    durationMinutes: 1, // Store 1 min in DB or short duration
    startTime: startTime.toISOString(),
    status: 'UPCOMING',
    problemSlugs: ['two-sum']
  }, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });

  const tourneyId = createRes.data.tournament._id;
  console.log(`✓ Tournament created with ID: ${tourneyId}, initial status: ${createRes.data.tournament.status}`);

  // 3. User 1 registers while tournament is UPCOMING
  console.log('\nStep 2: User 1 registering while UPCOMING...');
  const reg1Res = await axios.post(`${API_URL}/tournaments/${tourneyId}/register`, {}, {
    headers: { Authorization: `Bearer ${user1Token}` }
  });
  console.log(`✓ User 1 registration successful: "${reg1Res.data.message}"`);

  // 4. Set tourney endTime to start + 3 seconds for fast testing
  const targetEnd = new Date(startTime.getTime() + 3000);
  await Tournament.findByIdAndUpdate(tourneyId, {
    startTime: startTime,
    endTime: targetEnd
  });

  // 5. Wait 3.5 seconds until start time is hit
  console.log('\nStep 3: Waiting 3.5 seconds for scheduled start time to arrive...');
  await new Promise(r => setTimeout(r, 3500));

  // Query tournament to trigger sync
  const liveCheck = await axios.get(`${API_URL}/tournaments/${tourneyId}`);
  console.log(`✓ Current tournament status at start time: ${liveCheck.data.status} (Expected: ACTIVE)`);

  if (liveCheck.data.status !== 'ACTIVE') {
    throw new Error(`Expected ACTIVE but got ${liveCheck.data.status}`);
  }

  // 6. User 2 attempts to register while ACTIVE (should be blocked)
  console.log('\nStep 4: User 2 attempting to register while tournament is LIVE...');
  try {
    await axios.post(`${API_URL}/tournaments/${tourneyId}/register`, {}, {
      headers: { Authorization: `Bearer ${user2Token}` }
    });
    console.error('❌ FAILURE: User 2 was allowed to register while tournament was live!');
  } catch (err) {
    console.log(`✓ Correctly rejected late registration: "${err.response?.data?.message}" (HTTP ${err.response?.status})`);
  }

  // 7. User 1 (registered) submits score while ACTIVE
  console.log('\nStep 5: User 1 (registered) submitting score while ACTIVE...');
  const submitRes = await axios.post(`${API_URL}/tournaments/${tourneyId}/submit-score`, {
    problemsSolved: 1,
    score: 100,
    timeTakenSeconds: 45
  }, {
    headers: { Authorization: `Bearer ${user1Token}` }
  });
  console.log(`✓ Score recorded successfully! User 1 rank: #${submitRes.data.participant.rank}`);

  // 8. User 2 (unregistered) attempts to submit score while ACTIVE
  console.log('\nStep 6: User 2 (unregistered) attempting to submit score while ACTIVE...');
  try {
    await axios.post(`${API_URL}/tournaments/${tourneyId}/submit-score`, {
      problemsSolved: 1,
      score: 100,
      timeTakenSeconds: 50
    }, {
      headers: { Authorization: `Bearer ${user2Token}` }
    });
    console.error('❌ FAILURE: User 2 (unregistered) was allowed to submit score!');
  } catch (err) {
    console.log(`✓ Correctly rejected unregistered score submission: "${err.response?.data?.message}" (HTTP ${err.response?.status})`);
  }

  // 9. Wait another 3 seconds for tournament duration to end
  console.log('\nStep 7: Waiting 3 seconds for tournament duration to expire...');
  await new Promise(r => setTimeout(r, 3000));

  // Query tournament to check completion
  const endCheck = await axios.get(`${API_URL}/tournaments/${tourneyId}`);
  console.log(`✓ Current tournament status after time expired: ${endCheck.data.status} (Expected: COMPLETED)`);

  if (endCheck.data.status !== 'COMPLETED') {
    throw new Error(`Expected COMPLETED but got ${endCheck.data.status}`);
  }

  // 10. Attempt to submit score after tournament is COMPLETED
  console.log('\nStep 8: User 1 attempting to submit score after tournament is COMPLETED...');
  try {
    await axios.post(`${API_URL}/tournaments/${tourneyId}/submit-score`, {
      problemsSolved: 2,
      score: 200,
      timeTakenSeconds: 60
    }, {
      headers: { Authorization: `Bearer ${user1Token}` }
    });
    console.error('❌ FAILURE: Score submitted after tournament completed!');
  } catch (err) {
    console.log(`✓ Correctly rejected score submission after time expired: "${err.response?.data?.message}" (HTTP ${err.response?.status})`);
  }

  // 11. Cleanup test tournament
  console.log('\nStep 9: Cleaning up test tournament...');
  await axios.delete(`${API_URL}/tournaments/${tourneyId}`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  console.log('✓ Test tournament cleaned up successfully.');

  console.log('\n======================================================');
  console.log('✓ ALL SCHEDULED LIFECYCLE & ACCESS CONTROL TESTS PASSED!');
  console.log('======================================================\n');

  await mongoose.disconnect();
}

runLifecycleTest().catch(err => {
  console.error('Lifecycle test failure:', err);
  process.exit(1);
});
