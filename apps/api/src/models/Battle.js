import mongoose from 'mongoose';

const battlePlayerSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  ratingBefore: { type: Number, default: 1500 },
  ratingChange: { type: Number, default: 0 },
  score: { type: Number, default: 0 },
  connected: { type: Boolean, default: true },
  submissions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Submission' }]
}, { _id: false });

const battleSchema = new mongoose.Schema({
  gameModeId: { type: mongoose.Schema.Types.ObjectId, ref: 'GameMode' },
  timeControlId: { type: mongoose.Schema.Types.ObjectId, ref: 'TimeControl' },
  mode: { type: String, default: 'Blitz' },
  timeControlStr: { type: String, default: '3 min' },
  problemTitle: { type: String, default: 'Two Sum' },
  isRated: { type: Boolean, default: true },
  
  players: [battlePlayerSchema],
  opponentName: { type: String, default: 'Opponent' },
  opponentRating: { type: Number, default: 1500 },
  opponentFlag: { type: String, default: '🇺🇸' },
  moves: { type: Number, default: 30 },
  testAccuracy: { type: String, default: '100%' },

  problemSet: [{ type: mongoose.Schema.Types.ObjectId, ref: 'ProblemVersion' }],
  
  status: { 
    type: String, 
    enum: ['WAITING', 'MATCHED', 'READY', 'COUNTDOWN', 'ACTIVE', 'COMPLETED', 'CANCELLED', 'ABANDONED', 'RESIGNED'],
    default: 'COMPLETED'
  },
  
  serverStartTime: { type: Date, default: Date.now },
  durationSeconds: { type: Number, default: 180 },
  serverEndTime: { type: Date, default: Date.now },
  
  winnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Null if draw
  isDraw: { type: Boolean, default: false }

}, { timestamps: true });

export default mongoose.model('Battle', battleSchema);
