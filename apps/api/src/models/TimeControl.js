import mongoose from 'mongoose';

const timeControlSchema = new mongoose.Schema({
  name: { type: String, required: true }, // e.g. '5 min'
  durationSeconds: { type: Number, required: true },
  mode: { type: mongoose.Schema.Types.ObjectId, ref: 'GameMode', required: true },
  active: { type: Boolean, default: true },
  sortOrder: { type: Number, default: 0 }
}, { timestamps: true });

export default mongoose.model('TimeControl', timeControlSchema);
