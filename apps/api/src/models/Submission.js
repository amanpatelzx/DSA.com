import mongoose from 'mongoose';

const submissionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  problemId: { type: mongoose.Schema.Types.ObjectId, ref: 'Problem', required: true },
  battleId: { type: String, index: true }, // Null if in training ground; String to match Battle model's battleId format
  language: { type: String, required: true },
  code: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['PENDING', 'ACCEPTED', 'WRONG_ANSWER', 'TIME_LIMIT_EXCEEDED', 'MEMORY_LIMIT_EXCEEDED', 'RUNTIME_ERROR', 'COMPILATION_ERROR'], 
    default: 'PENDING' 
  },
  runtime: { type: Number }, // ms
  memory: { type: Number }, // MB
  testCasesPassed: { type: Number, default: 0 },
  totalTestCases: { type: Number, default: 0 },
  errorMessage: { type: String }
}, { timestamps: true });

export default mongoose.model('Submission', submissionSchema);
