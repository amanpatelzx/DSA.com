import mongoose from 'mongoose';

const problemAttemptSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  problemId: { type: mongoose.Schema.Types.ObjectId, ref: 'Problem', required: true },
  status: { type: String, enum: ['ATTEMPTED', 'SOLVED'], default: 'ATTEMPTED' },
  attempts: { type: Number, default: 1 },
  bestSubmission: { type: mongoose.Schema.Types.ObjectId, ref: 'Submission' },
  firstSolvedAt: { type: Date }
}, { timestamps: true });

problemAttemptSchema.index({ userId: 1, problemId: 1 }, { unique: true });

export default mongoose.model('ProblemAttempt', problemAttemptSchema);
