import mongoose from 'mongoose';

const articleCommentSchema = new mongoose.Schema({
  subtopicSlug: {
    type: String,
    required: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  username: {
    type: String,
    required: true
  },
  displayName: {
    type: String,
    default: ''
  },
  userAvatar: {
    type: String,
    default: 'U'
  },
  content: {
    type: String,
    required: true,
    maxLength: 2000
  },
  upvotes: {
    type: Number,
    default: 0
  },
  upvotedUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
}, {
  timestamps: true
});

export default mongoose.model('ArticleComment', articleCommentSchema);
