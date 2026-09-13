import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const router = express.Router();

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'fallback_secret', {
    expiresIn: '30d',
  });
};

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, name, displayName } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    const cleanUsername = username.toLowerCase().trim().replace(/[^a-z0-9_]/g, '');
    if (cleanUsername.length < 3) {
      return res.status(400).json({ message: 'Username must be at least 3 alphanumeric characters or underscores' });
    }

    const cleanEmail = email && typeof email === 'string' && email.trim() ? email.toLowerCase().trim() : null;
    const fullName = (name || displayName || username).trim();

    // Check if username already exists
    const usernameExists = await User.findOne({ username: cleanUsername });
    if (usernameExists) {
      return res.status(400).json({ message: 'Username is already taken. Please choose another.' });
    }

    // Check if email already exists (only if an email was provided)
    if (cleanEmail) {
      const emailExists = await User.findOne({ email: cleanEmail });
      if (emailExists) {
        return res.status(400).json({ message: 'An account with this email already exists' });
      }
    }

    const newUserData = {
      username: cleanUsername,
      password,
      displayName: fullName || cleanUsername,
      role: 'USER'
    };
    if (cleanEmail) {
      newUserData.email = cleanEmail;
    }

    const user = await User.create(newUserData);

    if (user) {
      res.status(201).json({
        _id: user._id,
        username: user.username,
        displayName: user.displayName,
        email: user.email || '',
        role: user.role || 'USER',
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
});

// @route   POST /api/auth/login
// @desc    Auth user & get token (Option 1: Username or Email, Option 2: Password)
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { name, displayName, username, identifier, email, loginId, password } = req.body;
    const inputIdentifier = (identifier || username || email || loginId || '').toLowerCase().trim();

    if (!inputIdentifier || !password) {
      return res.status(400).json({ 
        message: 'Username or Email ID, and Password are required.' 
      });
    }

    const user = await User.findOne({
      $or: [
        { username: inputIdentifier },
        { email: inputIdentifier }
      ]
    });

    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: 'Invalid credentials. Please check your username/email and password.' });
    }

    if (user.isBanned) {
      return res.status(403).json({
        message: `Your account has been banned. Reason: ${user.bannedReason || 'Violation of platform rules'}`
      });
    }

    // Sync display name if user optionally provided one
    const inputName = (name || displayName || '').trim();
    if (inputName && user.displayName !== inputName && user.role !== 'SUPER_ADMIN') {
      user.displayName = inputName;
      await user.save();
    }

    res.json({
      _id: user._id,
      username: user.username,
      displayName: user.displayName || user.username,
      email: user.email || '',
      role: user.role || 'USER',
      token: generateToken(user._id),
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/auth/google
// @desc    Authenticate via Google account (Takes name from Google, asks for compulsory username, optional password)
// @access  Public
router.post('/google', async (req, res) => {
  try {
    const { googleName, googleEmail, googleAvatar, username, password } = req.body;

    if (!googleEmail || !googleName) {
      return res.status(400).json({ message: 'Google account details (name and email) are required.' });
    }

    const cleanEmail = googleEmail.toLowerCase().trim();

    // Check if user already exists with this Google email
    let user = await User.findOne({ email: cleanEmail });

    if (user) {
      if (user.isBanned) {
        return res.status(403).json({
          message: `Your account has been banned. Reason: ${user.bannedReason || 'Violation of platform rules'}`
        });
      }

      // Update name from Google if missing
      if (googleName && (!user.displayName || user.displayName === user.username)) {
        user.displayName = googleName.trim();
        if (googleAvatar && !user.avatar) user.avatar = googleAvatar;
        await user.save();
      }

      return res.json({
        _id: user._id,
        username: user.username,
        displayName: user.displayName || user.username,
        email: user.email,
        role: user.role || 'USER',
        token: generateToken(user._id),
      });
    }

    // If new user signing up with Google, username is compulsory
    if (!username || username.trim().length < 3) {
      return res.status(400).json({ 
        message: 'Username is required and must be at least 3 characters.',
        requiresUsername: true
      });
    }

    const cleanUsername = username.toLowerCase().trim().replace(/[^a-z0-9_]/g, '');
    const usernameExists = await User.findOne({ username: cleanUsername });
    if (usernameExists) {
      return res.status(400).json({ message: 'This username is already taken. Please choose another username.' });
    }

    // Password is not necessary / optional for Google login
    const finalPassword = password && password.length >= 6 
      ? password 
      : `GAuth_${Math.random().toString(36).slice(-8)}_${Date.now()}`;

    user = await User.create({
      username: cleanUsername,
      displayName: googleName.trim(),
      email: cleanEmail,
      password: finalPassword,
      avatar: googleAvatar || '',
      role: 'USER'
    });

    res.status(201).json({
      _id: user._id,
      username: user.username,
      displayName: user.displayName,
      email: user.email,
      role: user.role || 'USER',
      token: generateToken(user._id),
    });
  } catch (error) {
    console.error('Google auth error:', error);
    res.status(500).json({ message: error.message || 'Server error during Google authentication' });
  }
});

export default router;
