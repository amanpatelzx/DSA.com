import mongoose from 'mongoose';

const testCaseSchema = new mongoose.Schema({
  input: { type: String, required: true },
  output: { type: String, required: true },
  explanation: { type: String }
}, { _id: false });

// ProblemVersion stores an immutable snapshot of a problem at a specific point in time
const problemVersionSchema = new mongoose.Schema({
  problemId: { type: mongoose.Schema.Types.ObjectId, ref: 'Problem', required: true, index: true },
  versionNumber: { type: Number, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  difficulty: { type: String, required: true },
  points: { type: Number, required: true },
  tags: [{ type: String }],
  constraints: { type: mongoose.Schema.Types.Mixed },
  followUp: { type: String },
  inputFormat: { type: String },
  outputFormat: { type: String },
  examples: [testCaseSchema],
  visibleTestCases: [testCaseSchema],
  hiddenTestCases: [testCaseSchema],
  supportedLanguages: [{ type: String }],
  timeLimit: { type: Number },
  memoryLimit: { type: Number },
  codeSnippets: [{
    lang: String,
    langSlug: String,
    code: String
  }],
  metaData: { type: mongoose.Schema.Types.Mixed },
}, { timestamps: true });

// Ensure unique version numbers per problem
problemVersionSchema.index({ problemId: 1, versionNumber: 1 }, { unique: true });

export default mongoose.model('ProblemVersion', problemVersionSchema);
