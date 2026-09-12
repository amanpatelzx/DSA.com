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

    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Username, email, and password are required' });
    }

    const cleanUsername = username.toLowerCase().trim().replace(/[^a-z0-9_]/g, '');
    if (cleanUsername.length < 3) {
      return res.status(400).json({ message: 'Username must be at least 3 alphanumeric characters or underscores' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const fullName = (name || displayName || username).trim();

    const userExists = await User.findOne({
      $or: [{ email: cleanEmail }, { username: cleanUsername }]
    });

    if (userExists) {
      if (userExists.email === cleanEmail) {
        return res.status(400).json({ message: 'An account with this email already exists' });
      }
      return res.status(400).json({ message: 'Username is already taken. Please choose another.' });
    }

    const user = await User.create({
      username: cleanUsername,
      email: cleanEmail,
      password,
      displayName: fullName || cleanUsername,
      role: 'USER'
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        username: user.username,
        displayName: user.displayName,
        email: user.email,
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
// @desc    Auth user & get token (supports User or Admin login)
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { email, username, identifier, password, loginType } = req.body;
    const searchId = (identifier || email || username || '').toLowerCase().trim();

    if (!searchId || !password) {
      return res.status(400).json({ message: 'Email/username and password are required' });
    }

    const user = await User.findOne({
      $or: [{ email: searchId }, { username: searchId }]
    });

    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: 'Invalid credentials. Please check your username/email and password.' });
    }

    // If Admin login was selected, enforce ADMIN role check
    if (loginType === 'ADMIN' && user.role !== 'ADMIN') {
      return res.status(403).json({
        message: 'Access denied: This account does not have administrator privileges.'
      });
    }

    res.json({
      _id: user._id,
      username: user.username,
      displayName: user.displayName || user.username,
      email: user.email,
      role: user.role || 'USER',
      token: generateToken(user._id),
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
