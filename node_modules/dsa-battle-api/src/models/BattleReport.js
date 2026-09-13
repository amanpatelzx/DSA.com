import mongoose from 'mongoose';

const battleReportSchema = new mongoose.Schema({
  battleId: { type: String, required: true, index: true },
  reporterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  reportedUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  
  problemSlug: { type: String, default: 'two-sum' },
  problemTitle: { type: String, default: 'Two Sum' },
  mode: { type: String, default: 'Blitz' },

  reason: {
    type: String,
    enum: [
      'SUSPICIOUS_SPEED',
      'AI_GENERATED',
      'EXTERNAL_PASTE',
      'TAB_SWITCHING',
      'OTHER'
    ],
    default: 'AI_GENERATED'
  },
  description: { type: String, default: '' },

  // Snapshots of both codes at time of match completion
  reporterCode: { type: String, default: '' },
  reporterLanguage: { type: String, default: 'cpp' },
  reportedCode: { type: String, default: '' },
  reportedLanguage: { type: String, default: 'cpp' },

  // Rating snapshot for this battle to enable exact rating rollback
  ratingDetails: {
    mode: { type: String, default: 'blitz' },
    reporterRatingBefore: { type: Number, default: 1500 },
    reporterRatingChange: { type: Number, default: 0 },
    reportedRatingBefore: { type: Number, default: 1500 },
    reportedRatingChange: { type: Number, default: 0 }
  },

  status: {
    type: String,
    enum: ['PENDING', 'RESOLVED_REVERTED', 'DISMISSED'],
    default: 'PENDING',
    index: true
  },
  ratingReverted: { type: Boolean, default: false },
  resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  resolvedAt: { type: Date },
  adminNotes: { type: String, default: '' }
}, { timestamps: true });

export default mongoose.model('BattleReport', battleReportSchema);
