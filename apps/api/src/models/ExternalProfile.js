import mongoose from 'mongoose';

const externalProfileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  platform: {
    type: String,
    enum: ['LeetCode', 'Codeforces', 'LinkedIn', 'CodeChef', 'AtCoder', 'HackerRank', 'GeeksforGeeks', 'GitHub', 'Other'],
    required: true,
  },
  username: {
    type: String,
    required: true,
  },
  profileUrl: {
    type: String,
    required: true,
  },
  displayOrder: {
    type: Number,
    default: 0,
  },
  isVisible: {
    type: Boolean,
    default: true,
  }
}, { timestamps: true });

export default mongoose.model('ExternalProfile', externalProfileSchema);
