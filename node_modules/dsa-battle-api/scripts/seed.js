import mongoose from 'mongoose';
import dotenv from 'dotenv';
import GameMode from '../src/models/GameMode.js';
import TimeControl from '../src/models/TimeControl.js';
import Problem from '../src/models/Problem.js';
import ProblemVersion from '../src/models/ProblemVersion.js';

dotenv.config();

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/dsa-battle');
    console.log('Connected to DB for seeding...');

    await GameMode.deleteMany();
    await TimeControl.deleteMany();
    
    // Seed Game Modes
    const bullet = await GameMode.create({
      name: 'Bullet',
      description: 'Extreme speed. Easy problems.',
      defaultDifficulty: 'Easy',
      allowedDifficulties: ['Easy'],
      allowedPointValues: [2, 3],
      problemCount: 3,
      sortOrder: 1
    });

    const blitz = await GameMode.create({
      name: 'Blitz',
      description: 'Fast paced. Medium difficulty.',
      defaultDifficulty: 'Medium',
      allowedDifficulties: ['Easy', 'Medium'],
      allowedPointValues: [3, 4],
      problemCount: 4,
      sortOrder: 2
    });

    const rapid = await GameMode.create({
      name: 'Rapid',
      description: 'Deep problem solving. Medium to Hard.',
      defaultDifficulty: 'Medium',
      allowedDifficulties: ['Medium', 'Hard'],
      allowedPointValues: [4, 5, 6],
      problemCount: 4,
      sortOrder: 3
    });

    const classical = await GameMode.create({
      name: 'Classical',
      description: 'Marathon. Hard problems.',
      defaultDifficulty: 'Hard',
      allowedDifficulties: ['Hard'],
      allowedPointValues: [6, 7],
      problemCount: 4,
      sortOrder: 4
    });

    // Seed Time Controls
    await TimeControl.insertMany([
      { name: '5 min', durationSeconds: 300, mode: bullet._id, sortOrder: 1 },
      { name: '10 min', durationSeconds: 600, mode: bullet._id, sortOrder: 2 },
      { name: '10 min', durationSeconds: 600, mode: blitz._id, sortOrder: 1 },
      { name: '15 min', durationSeconds: 900, mode: blitz._id, sortOrder: 2 },
      { name: '20 min', durationSeconds: 1200, mode: rapid._id, sortOrder: 1 },
      { name: '45 min', durationSeconds: 2700, mode: rapid._id, sortOrder: 2 },
      { name: '60 min', durationSeconds: 3600, mode: classical._id, sortOrder: 1 }
    ]);

    console.log('Game Modes and Time Controls Seeded!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

seedData();
