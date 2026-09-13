import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../apps/api/src/models/User.js';
import Battle from '../apps/api/src/models/Battle.js';
import BattleReport from '../apps/api/src/models/BattleReport.js';
import RatingHistory from '../apps/api/src/models/RatingHistory.js';

dotenv.config({ path: './apps/api/.env' });

async function runTest() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/dsa-battle');
  console.log('Connected to MongoDB');

  // Clean up any test users from prior runs
  await User.deleteMany({ username: { $in: ['test_victim_coder', 'test_cheater_coder', 'test_eval_admin'] } });
  await BattleReport.deleteMany({ battleId: 'test_battle_report_123' });

  // 1. Create test victim and cheater
  const victim = await User.create({
    username: 'test_victim_coder',
    email: 'victim@test.com',
    password: 'password123',
    role: 'USER',
    ratings: { blitz: 1500 }
  });

  const cheater = await User.create({
    username: 'test_cheater_coder',
    email: 'cheater@test.com',
    password: 'password123',
    role: 'USER',
    ratings: { blitz: 1500 }
  });

  const adminUser = await User.create({
    username: 'test_eval_admin',
    email: 'admin@test.com',
    password: 'password123',
    role: 'ADMIN',
    ratings: { blitz: 1500 }
  });

  console.log('Initial Ratings:');
  console.log(`Victim: ${victim.ratings.blitz}, Cheater: ${cheater.ratings.blitz}`);

  // 2. Simulate match where cheater won (+16) and victim lost (-12)
  victim.ratings.blitz = 1488; // -12
  await victim.save();
  cheater.ratings.blitz = 1516; // +16
  await cheater.save();

  const battle = await Battle.create({
    battleId: 'test_battle_report_123',
    mode: 'Blitz',
    status: 'COMPLETED',
    opponentName: 'test_cheater_coder',
    players: [
      {
        userId: victim._id,
        ratingBefore: 1500,
        ratingChange: -12,
        code: 'int twoSum() { /* victim code */ }',
        language: 'cpp'
      },
      {
        userId: cheater._id,
        ratingBefore: 1500,
        ratingChange: 16,
        code: 'vector<int> twoSum() { /* suspicious instant code */ }',
        language: 'cpp'
      }
    ],
    winnerId: cheater._id
  });

  console.log('Post-Battle Ratings:');
  console.log(`Victim: ${victim.ratings.blitz}, Cheater: ${cheater.ratings.blitz}`);

  // 3. Create a cheating report from victim against cheater
  const report = await BattleReport.create({
    battleId: 'test_battle_report_123',
    reporterId: victim._id,
    reportedUserId: cheater._id,
    problemSlug: 'two-sum',
    problemTitle: 'Two Sum',
    mode: 'Blitz',
    reason: 'AI_GENERATED',
    description: 'Opponent submitted a perfect solution in 4 seconds with AI docstrings.',
    reporterCode: 'int twoSum() { /* victim code */ }',
    reporterLanguage: 'cpp',
    reportedCode: 'vector<int> twoSum() { /* suspicious instant code */ }',
    reportedLanguage: 'cpp',
    ratingDetails: {
      mode: 'blitz',
      reporterRatingBefore: 1500,
      reporterRatingChange: -12,
      reportedRatingBefore: 1500,
      reportedRatingChange: 16
    },
    status: 'PENDING'
  });

  console.log('Created BattleReport:', report._id, 'Status:', report.status);

  // 4. Simulate Admin rating rollback
  const mode = (report.mode || 'blitz').toLowerCase();
  const reporterDelta = report.ratingDetails.reporterRatingChange; // -12
  const cheaterDelta = report.ratingDetails.reportedRatingChange; // 16

  // Revert reporter
  const victimFresh = await User.findById(victim._id);
  const rollbackVictim = -reporterDelta; // +12
  victimFresh.ratings[mode] = Math.max(100, victimFresh.ratings[mode] + rollbackVictim);
  await victimFresh.save();

  await RatingHistory.create({
    userId: victimFresh._id,
    mode: 'blitz',
    oldRating: 1488,
    ratingChange: rollbackVictim,
    newRating: victimFresh.ratings[mode],
    reason: 'CHEATING_ROLLBACK'
  });

  // Revert cheater
  const cheaterFresh = await User.findById(cheater._id);
  const rollbackCheater = -cheaterDelta; // -16
  cheaterFresh.ratings[mode] = Math.max(100, cheaterFresh.ratings[mode] + rollbackCheater);
  await cheaterFresh.save();

  await RatingHistory.create({
    userId: cheaterFresh._id,
    mode: 'blitz',
    oldRating: 1516,
    ratingChange: rollbackCheater,
    newRating: cheaterFresh.ratings[mode],
    reason: 'CHEATING_ROLLBACK'
  });

  report.status = 'RESOLVED_REVERTED';
  report.ratingReverted = true;
  report.resolvedBy = adminUser._id;
  report.resolvedAt = new Date();
  await report.save();

  console.log('Ratings After Rollback:');
  console.log(`Victim: ${victimFresh.ratings.blitz} (Expected 1500)`);
  console.log(`Cheater: ${cheaterFresh.ratings.blitz} (Expected 1500)`);

  if (victimFresh.ratings.blitz === 1500 && cheaterFresh.ratings.blitz === 1500) {
    console.log('SUCCESS: Both ratings restored perfectly!');
  } else {
    console.error('FAILURE: Rating discrepancy detected.');
  }

  // Check RatingHistory
  const historyEntries = await RatingHistory.find({ reason: 'CHEATING_ROLLBACK' });
  console.log(`Found ${historyEntries.length} CHEATING_ROLLBACK history logs.`);

  // Clean up
  await User.deleteMany({ username: { $in: ['test_victim_coder', 'test_cheater_coder', 'test_eval_admin'] } });
  await Battle.deleteOne({ _id: battle._id });
  await BattleReport.deleteOne({ _id: report._id });
  await RatingHistory.deleteMany({ _id: { $in: historyEntries.map(h => h._id) } });

  await mongoose.disconnect();
  console.log('Test completed cleanly!');
}

runTest().catch(console.error);
