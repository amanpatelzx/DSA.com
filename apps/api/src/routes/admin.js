import express from 'express';
import { protect, admin } from '../middleware/authMiddleware.js';
import User from '../models/User.js';
import Ban from '../models/Ban.js';
import FairPlayEvent from '../models/FairPlayEvent.js';
import Battle from '../models/Battle.js';

const router = express.Router();

// Apply middleware to all routes
router.use(protect);
router.use(admin);

// @route   GET /api/admin/users
// @desc    Get all users
router.get('/users', async (req, res) => {
  try {
    const users = await User.find({}).select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   GET /api/admin/fair-play
// @desc    Get all fair play events
router.get('/fair-play', async (req, res) => {
  try {
    const events = await FairPlayEvent.find({}).populate('userId', 'username').sort({ createdAt: -1 });
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   POST /api/admin/bans
// @desc    Ban a user
router.post('/bans', async (req, res) => {
  try {
    const { userId, type, reason, permanent, endDate } = req.body;
    
    const ban = await Ban.create({
      userId,
      type,
      reason,
      issuedBy: req.user._id,
      permanent,
      endDate: permanent ? null : endDate
    });

    res.status(201).json(ban);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});

export default router;
