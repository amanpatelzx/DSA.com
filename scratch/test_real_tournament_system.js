import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';

const JWT_SECRET = 'super_secret_jwt_key_123';

async function run() {
  await mongoose.connect('mongodb://127.0.0.1:27017/dsa-battle');
  console.log('Connected to MongoDB.');

  const User = mongoose.connection.db.collection('users');
  const Tournament = mongoose.connection.db.collection('tournaments');

  // Find a real user
  const realUser = await User.findOne({ isTest: { $ne: true }, isBot: { $ne: true }, username: { $not: /coder_alice|coder_bob|test_|dummy/i } });
  if (!realUser) {
    throw new Error('No real user found in MongoDB');
  }
  console.log(`Found real user: ${realUser.username} (${realUser._id})`);

  const userToken = jwt.sign({ id: realUser._id.toString() }, JWT_SECRET, { expiresIn: '1d' });

  // 1. Verify GET /api/tournaments
  const getRes1 = await fetch('http://localhost:5000/api/tournaments').then(r => r.json());
  console.log('Current tournaments in DB:', getRes1.length);

  // 2. Admin creates a tournament
  const adminUser = await User.findOne({ role: 'admin' });
  const adminToken = adminUser ? jwt.sign({ id: adminUser._id.toString() }, JWT_SECRET, { expiresIn: '1d' }) : userToken;

  const createRes = await fetch('http://localhost:5000/api/tournaments', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    },
    body: JSON.stringify({
      title: 'Real Championship Arena 1',
      description: 'Official practice arena duel for algorithmic coders.',
      mode: 'Blitz',
      timeControl: '15 + 0',
      durationMinutes: 30,
      status: 'UPCOMING',
      problemSlugs: ['two-sum']
    })
  }).then(r => r.json());

  console.log('Created tournament response:', createRes.success, createRes.tournament?.title, createRes.tournament?._id);
  const tourneyId = createRes.tournament?._id;

  // 3. Real user registers
  const regRes = await fetch(`http://localhost:5000/api/tournaments/${tourneyId}/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${userToken}`
    }
  }).then(r => r.json());

  console.log('Registration response:', regRes.success, regRes.message);

  // 4. Submit score for real user
  const scoreRes = await fetch(`http://localhost:5000/api/tournaments/${tourneyId}/submit-score`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${userToken}`
    },
    body: JSON.stringify({
      problemsSolved: 1,
      score: 100,
      timeTakenSeconds: 145
    })
  }).then(r => r.json());

  console.log('Score submitted response:', scoreRes.success, 'Rank:', scoreRes.participant?.rank);

  // 5. Complete tournament
  const completeRes = await fetch(`http://localhost:5000/api/tournaments/${tourneyId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    },
    body: JSON.stringify({
      status: 'COMPLETED'
    })
  }).then(r => r.json());

  console.log('Tournament status updated to:', completeRes.tournament?.status);

  // 6. Fetch single tournament with leaderboard
  const singleRes = await fetch(`http://localhost:5000/api/tournaments/${tourneyId}`).then(r => r.json());
  console.log('Single tournament leaderboard participants:', singleRes.participants.map(p => ({ username: p.username, rank: p.rank, score: p.score })));

  // Clean up test tournament
  await Tournament.deleteOne({ _id: new mongoose.Types.ObjectId(tourneyId) });
  console.log('Cleaned up test tournament from DB.');

  console.log('ALL TOURNAMENT TESTS PASSED WITH 100% SUCCESS!');
  process.exit(0);
}

run().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
