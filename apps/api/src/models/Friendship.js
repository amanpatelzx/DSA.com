import mongoose from 'mongoose';

const friendshipSchema = new mongoose.Schema({
  requesterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  recipientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['REQUESTED', 'ACCEPTED', 'BLOCKED'], default: 'REQUESTED' }
}, { timestamps: true });

// Ensure unique friendship per pair
friendshipSchema.index({ requesterId: 1, recipientId: 1 }, { unique: true });

export default mongoose.model('Friendship', friendshipSchema);
