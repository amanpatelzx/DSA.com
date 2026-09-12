import mongoose from 'mongoose';

const ratingHistorySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  battleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Battle' },
  mode: { type: String, enum: ['bullet', 'blitz', 'rapid', 'classical'], required: true },
  oldRating: { type: Number, required: true },
  ratingChange: { type: Number, required: true },
  newRating: { type: Number, required: true },
  reason: { 
    type: String, 
    enum: ['BATTLE', 'ADMIN_ADJUSTMENT', 'CHEATING_ROLLBACK', 'SEASON_RESET'], 
    default: 'BATTLE' 
  }
}, { timestamps: true });

export default mongoose.model('RatingHistory', ratingHistorySchema);
