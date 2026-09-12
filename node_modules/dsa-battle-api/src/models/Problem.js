import mongoose from 'mongoose';

const testCaseSchema = new mongoose.Schema({
  input: { type: String, required: true },
  output: { type: String, required: true },
  explanation: { type: String }
}, { _id: false });

const problemSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
  description: { type: String, required: true },
  difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], required: true },
  points: { type: Number, default: 3 },
  tags: [{ type: String, trim: true }],
  constraints: { type: mongoose.Schema.Types.Mixed },
  followUp: { type: String },
  inputFormat: { type: String },
  outputFormat: { type: String },
  examples: [testCaseSchema],
  visibleTestCases: [testCaseSchema],
  // In a real prod setup, hidden tests might be stored securely in S3 or encrypted, but for MVP we use the DB
  hiddenTestCases: { type: [testCaseSchema], select: false }, 
  supportedLanguages: [{ type: String, default: ['cpp', 'python', 'javascript', 'java'] }],
  timeLimit: { type: Number, default: 2000 }, // ms
  memoryLimit: { type: Number, default: 256 }, // MB
  codeSnippets: [{
    lang: String,
    langSlug: String,
    code: String
  }],
  metaData: { type: mongoose.Schema.Types.Mixed },
  status: { type: String, enum: ['DRAFT', 'ACTIVE', 'DISABLED', 'ARCHIVED'], default: 'ACTIVE' },
  activeVersionId: { type: mongoose.Schema.Types.ObjectId, ref: 'ProblemVersion' }
}, { timestamps: true });

// Pre-save hook to ensure hiddenTestCases isn't accidentally exposed to clients through typical finds
// handled by 'select: false' on the field.

export default mongoose.model('Problem', problemSchema);
