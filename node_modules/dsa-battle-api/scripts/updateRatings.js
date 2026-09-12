import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/dsa-battle');
  const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
  
  const res = await User.updateMany(
    {
      $or: [
        { 'ratings.blitz': 1200 },
        { 'ratings.blitz': { $exists: false } }
      ]
    },
    {
      $set: {
        'ratings.bullet': 1500,
        'ratings.blitz': 1500,
        'ratings.rapid': 1500,
        'ratings.classical': 1500
      }
    }
  );

  console.log('Updated users with 1500 rating:', res.modifiedCount);
  const users = await User.find({}).select('username ratings');
  console.log('Users in DB:', users.map(u => ({ username: u.username, ratings: u.ratings })));
  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
