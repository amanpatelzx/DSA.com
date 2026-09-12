import { connectDB } from '../apps/api/src/config/db.js';
import User from '../apps/api/src/models/User.js';
import Submission from '../apps/api/src/models/Submission.js';

async function testLeaderboard() {
  await connectDB();

  const users = await User.find({})
    .select('username displayName avatar bio ratings role country countryFlag location organization createdAt')
    .lean();

  const solvedAgg = await Submission.aggregate([
    { $match: { status: 'ACCEPTED' } },
    { $group: { _id: { userId: '$userId', problemId: '$problemId' } } },
    { $group: { _id: '$_id.userId', count: { $sum: 1 } } }
  ]);

  const solvedMap = new Map();
  solvedAgg.forEach(item => {
    if (item._id) solvedMap.set(item._id.toString(), item.count);
  });

  const userList = users.map(u => ({
    ...u,
    ratings: {
      blitz: u.ratings?.blitz ?? 1500,
      rapid: u.ratings?.rapid ?? 1500,
      bullet: u.ratings?.bullet ?? 1500,
      classical: u.ratings?.classical ?? 1500
    },
    solvedCount: solvedMap.get(u._id.toString()) || 0
  }));

  console.log('Total users mapped:', userList.length);
  console.log('Sample user:', userList[0]);

  // Test sort by solved
  userList.sort((a, b) => b.solvedCount - a.solvedCount);
  console.log('Top solved:', userList.slice(0, 3).map(u => ({ username: u.username, solved: u.solvedCount })));

  // Test sort by blitz
  userList.sort((a, b) => b.ratings.blitz - a.ratings.blitz);
  console.log('Top blitz:', userList.slice(0, 3).map(u => ({ username: u.username, blitz: u.ratings.blitz })));

  process.exit(0);
}

testLeaderboard();
