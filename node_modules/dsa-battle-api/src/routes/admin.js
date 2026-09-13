import express from 'express';
import { protect, admin, superAdmin } from '../middleware/authMiddleware.js';
import User from '../models/User.js';
import Ban from '../models/Ban.js';
import FairPlayEvent from '../models/FairPlayEvent.js';
import Battle from '../models/Battle.js';
import BattleReport from '../models/BattleReport.js';
import RatingHistory from '../models/RatingHistory.js';

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

// @route   GET /api/admin/reports
// @desc    Get cheating reports with optional status filter
// @access  Admin & Super Admin
router.get('/reports', async (req, res) => {
  try {
    const { status } = req.query;
    const filter = {};
    if (status && status !== 'ALL') {
      filter.status = status;
    }

    const reports = await BattleReport.find(filter)
      .populate('reporterId', 'username displayName email avatar ratings isBanned')
      .populate('reportedUserId', 'username displayName email avatar ratings isBanned')
      .populate('resolvedBy', 'username displayName')
      .sort({ status: 1, createdAt: -1 });

    res.json(reports);
  } catch (error) {
    console.error('Fetch reports error:', error);
    res.status(500).json({ message: 'Server error fetching reports' });
  }
});

// @route   POST /api/admin/reports/:reportId/revert-ratings
// @desc    Revert ratings for both players involved in a reported battle
// @access  Admin & Super Admin
router.post('/reports/:reportId/revert-ratings', async (req, res) => {
  try {
    const report = await BattleReport.findById(req.params.reportId)
      .populate('reporterId')
      .populate('reportedUserId');

    if (!report) {
      return res.status(404).json({ message: 'Cheating report not found' });
    }

    if (report.ratingReverted) {
      return res.status(400).json({ message: 'Ratings have already been reverted for this report.' });
    }

    const mode = (report.mode || report.ratingDetails?.mode || 'blitz').toLowerCase();
    const reporter = report.reporterId;
    const cheater = report.reportedUserId;

    const reporterDelta = report.ratingDetails?.reporterRatingChange !== undefined
      ? report.ratingDetails.reporterRatingChange
      : -12;
    const cheaterDelta = report.ratingDetails?.reportedRatingChange !== undefined
      ? report.ratingDetails.reportedRatingChange
      : 16;

    // 1. Revert Reporter Rating (give back lost points, or undo gain)
    let reporterOld = 1500;
    let reporterNew = 1500;
    if (reporter) {
      reporterOld = (reporter.ratings && reporter.ratings[mode]) || 1500;
      // If reporter lost 12, ratingChange was -12. Reversal is - (-12) = +12
      const rollbackAmount = -reporterDelta;
      reporterNew = Math.max(100, reporterOld + rollbackAmount);

      if (!reporter.ratings) reporter.ratings = {};
      reporter.ratings[mode] = reporterNew;
      await reporter.save();

      await RatingHistory.create({
        userId: reporter._id,
        battleId: null,
        mode: ['bullet', 'blitz', 'rapid', 'classical'].includes(mode) ? mode : 'blitz',
        oldRating: reporterOld,
        ratingChange: rollbackAmount,
        newRating: reporterNew,
        reason: 'CHEATING_ROLLBACK'
      });
    }

    // 2. Revert Cheater Rating (strip away ill-gotten points)
    let cheaterOld = 1500;
    let cheaterNew = 1500;
    if (cheater && String(cheater._id) !== String(reporter?._id)) {
      cheaterOld = (cheater.ratings && cheater.ratings[mode]) || 1500;
      // If cheater gained 16, ratingChange was 16. Reversal is - 16
      const rollbackAmount = -cheaterDelta;
      cheaterNew = Math.max(100, cheaterOld + rollbackAmount);

      if (!cheater.ratings) cheater.ratings = {};
      cheater.ratings[mode] = cheaterNew;
      await cheater.save();

      await RatingHistory.create({
        userId: cheater._id,
        battleId: null,
        mode: ['bullet', 'blitz', 'rapid', 'classical'].includes(mode) ? mode : 'blitz',
        oldRating: cheaterOld,
        ratingChange: rollbackAmount,
        newRating: cheaterNew,
        reason: 'CHEATING_ROLLBACK'
      });
    }

    // 3. Mark Report as Resolved & Reverted
    report.status = 'RESOLVED_REVERTED';
    report.ratingReverted = true;
    report.resolvedBy = req.user._id;
    report.resolvedAt = new Date();
    report.adminNotes = req.body.adminNotes || 'Rating changes reversed following cheating verification.';
    await report.save();

    res.json({
      success: true,
      message: `Ratings successfully reverted! @${reporter?.username || 'Reporter'} restored to ${reporterNew}, @${cheater?.username || 'Cheater'} adjusted to ${cheaterNew}.`,
      report,
      reporter: {
        username: reporter?.username,
        oldRating: reporterOld,
        newRating: reporterNew
      },
      cheater: {
        username: cheater?.username,
        oldRating: cheaterOld,
        newRating: cheaterNew
      }
    });
  } catch (error) {
    console.error('Rating revert error:', error);
    res.status(500).json({ message: error.message || 'Server error reverting ratings' });
  }
});

// @route   PUT /api/admin/reports/:reportId/dismiss
// @desc    Dismiss a cheating report without reverting ratings
// @access  Admin & Super Admin
router.put('/reports/:reportId/dismiss', async (req, res) => {
  try {
    const report = await BattleReport.findById(req.params.reportId);
    if (!report) {
      return res.status(404).json({ message: 'Cheating report not found' });
    }

    report.status = 'DISMISSED';
    report.resolvedBy = req.user._id;
    report.resolvedAt = new Date();
    report.adminNotes = req.body.adminNotes || 'Report dismissed after code and activity review.';
    await report.save();

    res.json({
      success: true,
      message: 'Cheating report dismissed.',
      report
    });
  } catch (error) {
    console.error('Dismiss report error:', error);
    res.status(500).json({ message: error.message || 'Server error dismissing report' });
  }
});

export default router;

