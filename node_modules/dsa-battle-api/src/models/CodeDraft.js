import mongoose from 'mongoose';

const codeDraftSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  problemSlug: {
    type: String,
    required: true,
    index: true
  },
  problemTitle: {
    type: String,
    default: ''
  },
  problemDifficulty: {
    type: String,
    default: 'Medium'
  },
  tags: [{
    type: String
  }],
  language: {
    type: String,
    required: true,
    default: 'cpp'
  },
  code: {
    type: String,
    required: true
  }
}, { timestamps: true });

codeDraftSchema.index({ userId: 1, problemSlug: 1, language: 1 }, { unique: true });
codeDraftSchema.index({ userId: 1, updatedAt: -1 });

export default mongoose.model('CodeDraft', codeDraftSchema);
