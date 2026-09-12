import mongoose from 'mongoose';

const fairPlayEventSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  battleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Battle', index: true },
  type: { 
    type: String, 
    enum: [
      'EXTERNAL_PASTE_ATTEMPT', 
      'TAB_SWITCH', 
      'WINDOW_BLUR', 
      'VISIBILITY_CHANGE', 
      'MULTIPLE_SESSIONS', 
      'CLIENT_STATE_MISMATCH', 
      'SUSPICIOUS_SUBMISSION'
    ], 
    required: true 
  },
  details: { type: mongoose.Schema.Types.Mixed },
  resolved: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.model('FairPlayEvent', fairPlayEventSchema);
