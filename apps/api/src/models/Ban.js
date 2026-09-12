import mongoose from 'mongoose';

const banSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  type: { type: String, enum: ['WARNING', 'TEMPORARY', 'PERMANENT'], required: true },
  reason: { type: String, enum: ['FAIR_PLAY', 'ABUSE', 'OTHER'], required: true },
  issuedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Admin who issued
  startDate: { type: Date, default: Date.now },
  endDate: { type: Date }, // Null if permanent
  permanent: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.model('Ban', banSchema);
