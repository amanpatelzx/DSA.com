import mongoose from 'mongoose';

const gameModeSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true }, // e.g. 'Bullet', 'Blitz', 'Rapid', 'Classical'
  description: { type: String },
  defaultDifficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'] },
  allowedDifficulties: [{ type: String, enum: ['Easy', 'Medium', 'Hard'] }],
  allowedPointValues: [{ type: Number }],
  problemCount: { type: Number, default: 3 },
  ratedEnabled: { type: Boolean, default: true },
  active: { type: Boolean, default: true },
  sortOrder: { type: Number, default: 0 }
}, { timestamps: true });

export default mongoose.model('GameMode', gameModeSchema);
