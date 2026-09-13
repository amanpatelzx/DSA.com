import express from 'express';
import { protect, admin, superAdmin } from '../middleware/authMiddleware.js';
import User from '../models/User.js';
import Ban from '../models/Ban.js';
import FairPlayEvent from '../models/FairPlayEvent.js';
import Battle from '../models/Battle.js';

const router = express.Router();

// Apply middleware to all routes (Admin or Super Admin allowed)
router.use(protect);
router.use(admin);

// @route   GET /api/admin/users
// @desc    Get all users with roles and ban status (Admin & Super Admin)
router.get('/users', async (req, res) => {
  try {
    const users = await User.find({ isBot: { $ne: true } })
      .select('username displayName email role isBanned bannedReason bannedAt avatar ratings createdAt')
      .sort({ role: 1, createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   PUT /api/admin/users/:userId/role
// @desc    Assign anyone as Admin or remove Admin position (Super Admin only)
// @access  Super Admin only
router.put('/users/:userId/role', superAdmin, async (req, res) => {
  try {
    const { role } = req.body; // 'ADMIN' or 'USER'
    const targetUser = await User.findById(req.params.userId);

    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (targetUser.role === 'SUPER_ADMIN') {
      return res.status(400).json({ message: 'Cannot modify Super Admin position' });
    }

    if (role !== 'ADMIN' && role !== 'USER') {
      return res.status(400).json({ message: 'Role must be either ADMIN or USER' });
    }

    targetUser.role = role;
    await targetUser.save();

    res.json({
      message: `Successfully ${role === 'ADMIN' ? 'promoted to Admin' : 'removed Admin position for'} @${targetUser.username}`,
      user: {
        _id: targetUser._id,
        username: targetUser.username,
        role: targetUser.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server Error' });
  }
});

// @route   PUT /api/admin/users/:userId/ban
// @desc    Ban or unban a user (Admin & Super Admin)
// @access  Admin & Super Admin
router.put('/users/:userId/ban', async (req, res) => {
  try {
    const { banned, reason } = req.body;
    const targetUser = await User.findById(req.params.userId);

    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (targetUser.role === 'SUPER_ADMIN') {
      return res.status(403).json({ message: 'Cannot ban the Super Admin' });
    }

    // Normal admins cannot ban other admins
    if (req.user.role === 'ADMIN' && targetUser.role === 'ADMIN') {
      return res.status(403).json({ message: 'Only Super Admin can ban an administrator' });
    }

    targetUser.isBanned = Boolean(banned);
    targetUser.bannedReason = banned ? (reason || 'Violation of platform fair play rules') : '';
    targetUser.bannedAt = banned ? new Date() : null;
    await targetUser.save();

    if (banned) {
      await Ban.create({
        userId: targetUser._id,
        type: 'PERMANENT',
        reason: 'FAIR_PLAY',
        issuedBy: req.user._id,
        permanent: true
      });
    }

    res.json({
      message: `User @${targetUser.username} has been ${banned ? 'banned' : 'unbanned'} successfully`,
      user: {
        _id: targetUser._id,
        username: targetUser.username,
        isBanned: targetUser.isBanned,
        bannedReason: targetUser.bannedReason
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server Error' });
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
// @desc    Ban a user (legacy endpoint)
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

    await User.findByIdAndUpdate(userId, {
      isBanned: true,
      bannedReason: reason,
      bannedAt: new Date()
    });

    res.status(201).json(ban);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});

export default router;
