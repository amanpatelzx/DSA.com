import mongoose from 'mongoose';

const challengeSchema = new mongoose.Schema({
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  receiverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  gameModeId: { type: mongoose.Schema.Types.ObjectId, ref: 'GameMode', required: true },
  timeControlId: { type: mongoose.Schema.Types.ObjectId, ref: 'TimeControl', required: true },
  isRated: { type: Boolean, default: true },
  
  status: { type: String, enum: ['PENDING', 'ACCEPTED', 'DECLINED', 'EXPIRED', 'CANCELLED'], default: 'PENDING' },
  expiresAt: { type: Date, required: true }
}, { timestamps: true });

export default mongoose.model('Challenge', challengeSchema);
