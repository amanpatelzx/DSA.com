import mongoose from 'mongoose';

const participantSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  username: { type: String, required: true },
  avatar: { type: String },
  registeredAt: { type: Date, default: Date.now },
  score: { type: Number, default: 0 },
  problemsSolved: { type: Number, default: 0 },
  timeTakenSeconds: { type: Number, default: 0 },
  completedAt: { type: Date },
  rank: { type: Number, default: 0 }
}, { _id: false });

const tournamentSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, default: 'Open practice arena tournament. Climb the rankings!' },
  mode: {
    type: String,
    enum: ['Bullet', 'Blitz', 'Rapid', 'Classical', 'Custom'],
    default: 'Blitz'
  },
  timeControl: { type: String, default: '15 + 0' },
  durationMinutes: { type: Number, default: 15 },
  problems: [{
    slug: { type: String, required: true },
    title: { type: String, required: true },
    difficulty: { type: String, default: 'Medium' }
  }],
  status: {
    type: String,
    enum: ['UPCOMING', 'ACTIVE', 'COMPLETED'],
    default: 'UPCOMING'
  },
  startTime: { type: Date, default: Date.now },
  endTime: { type: Date },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  participants: [participantSchema],
  isPracticeOnly: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.model('Tournament', tournamentSchema);
