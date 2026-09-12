import mongoose from 'mongoose';
import { connectDB } from '../apps/api/src/config/db.js';
import User from '../apps/api/src/models/User.js';
import Submission from '../apps/api/src/models/Submission.js';

async function test() {
  await connectDB();
  const users = await User.find({}).select('username displayName ratings avatar countryFlag');
  console.log('Total users:', users.length);
  console.log('Users sample:', users.slice(0, 5).map(u => ({ username: u.username, ratings: u.ratings })));

  const solved = await Submission.aggregate([
    { $match: { status: 'ACCEPTED' } },
    { $group: { _id: { userId: '$userId', problemId: '$problemId' } } },
    { $group: { _id: '$_id.userId', count: { $sum: 1 } } }
  ]);
  console.log('Solved counts:', solved);
  process.exit(0);
}

test();
