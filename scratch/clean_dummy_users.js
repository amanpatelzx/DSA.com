import mongoose from 'mongoose';

async function cleanup() {
  await mongoose.connect('mongodb://127.0.0.1:27017/dsa-battle');
  
  const testQuery = {
    $or: [
      { email: { $regex: /@example\.com|@test\.com|@dummy\.com/i } },
      { username: { $regex: /^(test_|tester_|testuser|dp_tester|social_tester|resign_user|tourney|tourneyhero|coder_alice|coder_bob|coder_\d+|u_\d+)/i } }
    ]
  };

  const delRes = await mongoose.connection.db.collection('users').deleteMany(testQuery);
  console.log('Deleted test accounts count:', delRes.deletedCount);

  const remaining = await mongoose.connection.db.collection('users').find({}).toArray();
  console.log('Remaining accounts:');
  remaining.forEach(u => console.log(u.username, '|', u.email, '|', u.role, '| isBot:', u.isBot));

  await mongoose.disconnect();
  process.exit(0);
}

cleanup();
