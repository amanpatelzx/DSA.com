import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    minLength: 3,
    maxLength: 20
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minLength: 6
  },
  displayName: {
    type: String,
    trim: true
  },
  avatar: {
    type: String,
    default: ''
  },
  bio: {
    type: String,
    maxLength: 500,
    default: ''
  },
  country: {
    type: String,
    default: 'India'
  },
  countryFlag: {
    type: String,
    default: '🇮🇳'
  },
  location: {
    type: String,
    default: 'India'
  },
  organization: {
    type: String,
    default: 'REC BANDA'
  },
  profileViews: {
    type: Number,
    default: 0
  },
  streak: {
    type: Number,
    default: 1
  },
  ratings: {
    bullet: { type: Number, default: 1500 },
    blitz: { type: Number, default: 1500 },
    rapid: { type: Number, default: 1500 },
    classical: { type: Number, default: 1500 }
  },
  role: {
    type: String,
    enum: ['USER', 'ADMIN', 'BOT'],
    default: 'USER'
  },
  isBot: {
    type: Boolean,
    default: false
  },
  socialLinks: {
    github: { type: String, default: '' },
    linkedin: { type: String, default: '' },
    leetcode: { type: String, default: '' },
    codeforces: { type: String, default: '' },
    website: { type: String, default: '' },
    other: { type: String, default: '' },
    custom: [{
      label: { type: String, default: '' },
      url: { type: String, default: '' }
    }]
  }
}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare password
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

export default mongoose.model('User', userSchema);
