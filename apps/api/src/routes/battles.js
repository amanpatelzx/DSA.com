import express from 'express';
import Battle from '../models/Battle.js';
import User from '../models/User.js';
import RatingHistory from '../models/RatingHistory.js';
import { protect } from '../middleware/authMiddleware.js';
import { getTopLiveBattle, liveBattles, getPlatformStats, broadcastPlatformStats } from '../socket.js';
import { findRealOpponent } from '../utils/opponentHelper.js';

const router = express.Router();

// @route   POST /api/battles/record
// @desc    Record a completed match and update user ratings & streak
// @access  Private
router.post('/record', protect, async (req, res) => {
  try {
    const {
      mode = 'Blitz',
      timeControl = '3 min',
      result = 'win', // 'win', 'loss', 'draw'
      problemTitle = 'Two Sum',
      opponentName,
      moves = 28,
      testAccuracy = '100%'
    } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const ratingKey = mode.toLowerCase();
    const currentRating = (user.ratings && user.ratings[ratingKey]) || 1500;

    // Check whether the match is rated and not against an explicit bot
    const isExplicitNonRated = req.body.isRated === false || req.body.isRated === 'false' || req.body.isRated === 0 || req.body.isRated === '0';
    const isBotOpponent = opponentName && (
      String(opponentName).toLowerCase().includes('bot') ||
      String(opponentName).toLowerCase().includes('stockfish') ||
      String(opponentName).toLowerCase().includes('computer')
    );
    const realOpponent = (!isExplicitNonRated && !isBotOpponent) ? await findRealOpponent(opponentName, user._id) : null;
    const isRatedMatch = !isExplicitNonRated && !isBotOpponent;

    let ratingChange = 0;
    let userResultScore = 0;
    let opponentResultScore = 1;

    if (result === 'win') {
      userResultScore = 1;
      opponentResultScore = 0;
      user.streak = (user.streak || 0) + 1;
      if (isRatedMatch) {
        ratingChange = 16;
      }
    } else if (result === 'loss') {
      userResultScore = 0;
      opponentResultScore = 1;
      if (isRatedMatch) {
        ratingChange = -12;
      }
    } else {
      userResultScore = 0.5;
      opponentResultScore = 0.5;
      if (isRatedMatch) {
        ratingChange = 2;
      }
    }

    const newRating = isRatedMatch ? Math.max(100, currentRating + ratingChange) : currentRating;

    // Only update ratings when challenging a real person, not a bot!
    if (isRatedMatch) {
      if (!user.ratings) user.ratings = {};
      user.ratings[ratingKey] = newRating;
      await user.save();

      // Real opponent rating adjustment
      if (realOpponent) {
        try {
          const oppRating = (realOpponent.ratings && realOpponent.ratings[ratingKey]) || 1500;
          const oppChange = result === 'win' ? -12 : result === 'loss' ? 16 : 2;
          if (!realOpponent.ratings) realOpponent.ratings = {};
          realOpponent.ratings[ratingKey] = Math.max(100, oppRating + oppChange);
          await realOpponent.save();

          await RatingHistory.create({
            userId: realOpponent._id,
            mode: ['bullet', 'blitz', 'rapid', 'classical'].includes(ratingKey) ? ratingKey : 'blitz',
            oldRating: oppRating,
            ratingChange: oppChange,
            newRating: realOpponent.ratings[ratingKey],
            reason: 'BATTLE_PVP'
          });
        } catch {}
      }
    } else {
      await user.save();
    }

    // Default computer / bot opponents if none provided
    const defaultOpponents = [
      { name: 'BOT', flag: '🤖', rating: 1510 },
      { name: 'algo_expert', flag: '🤖', rating: 1495 },
      { name: 'deep_recursion', flag: '🤖', rating: 1520 },
      { name: 'matrix_solver', flag: '🤖', rating: 1480 }
    ];
    const pickedOpponent = defaultOpponents[Math.floor(Math.random() * defaultOpponents.length)];

    const finalOpponentName = realOpponent ? realOpponent.username : (opponentName || pickedOpponent.name);
    const finalOpponentRating = realOpponent ? (realOpponent.ratings?.[ratingKey] || 1500) : pickedOpponent.rating;
    const finalOpponentFlag = realOpponent ? (realOpponent.countryFlag || '') : pickedOpponent.flag;

    const battle = await Battle.create({
      mode,
      timeControlStr: timeControl,
      problemTitle,
      isRated: isRatedMatch,
      status: 'COMPLETED',
      opponentName: finalOpponentName,
      opponentRating: finalOpponentRating,
      opponentFlag: finalOpponentFlag,
      moves: moves || Math.floor(Math.random() * 20 + 20),
      testAccuracy,
      players: [
        {
          userId: user._id,
          ratingBefore: currentRating,
          ratingChange,
          score: userResultScore,
          connected: true
        }
      ],
      winnerId: result === 'win' ? user._id : null,
      isDraw: result === 'draw'
    });

    // Record rating history only for rated real human matches!
    if (isRatedMatch) {
      try {
        await RatingHistory.create({
          userId: user._id,
          battleId: battle._id,
          mode: ['bullet', 'blitz', 'rapid', 'classical'].includes(ratingKey) ? ratingKey : 'blitz',
          oldRating: currentRating,
          ratingChange,
          newRating,
          reason: 'BATTLE_PVP'
        });
      } catch (rhErr) {
        console.warn('RatingHistory log warning:', rhErr.message);
      }
    }

    if (req.body.battleId && liveBattles.has(req.body.battleId)) {
      liveBattles.delete(req.body.battleId);
    }
    broadcastPlatformStats();

    res.status(201).json({
      success: true,
      battle,
      newRating,
      ratingChange,
      streak: user.streak,
      updatedRatings: user.ratings
    });
  } catch (error) {
    console.error('Record battle error:', error);
    res.status(500).json({ message: 'Server error recording match' });
  }
});

// @route   GET /api/battles/my
// @desc    Get current user's real battles
// @access  Private
router.get('/my', protect, async (req, res) => {
  try {
    const battles = await Battle.find({
      'players.userId': req.user._id,
      status: 'COMPLETED'
    }).sort({ createdAt: -1 }).limit(30);

    res.json(battles);
  } catch (error) {
    console.error('Fetch battles error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/battles/stats
// @desc    Get real platform statistics (real online coders, running battles, finished battles)
// @access  Public
router.get('/stats', async (req, res) => {
  try {
    const stats = await getPlatformStats();
    res.json({
      success: true,
      onlineCoders: stats.onlineCoders,
      runningBattles: stats.runningBattles,
      finishedBattles: stats.finishedBattles,
      // Backward compatibility aliases
      totalPlayers: stats.onlineCoders,
      totalGames: stats.finishedBattles
    });
  } catch (error) {
    console.error('Fetch stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/battles/live-top
// @desc    Get highest-rated active battle for homepage POV preview
// @access  Public
router.get('/live-top', (req, res) => {
  try {
    const top = getTopLiveBattle();
    if (top) {
      return res.json(top);
    }

    // Default fallback when no real matches are currently in progress
    res.json({
      isRealLive: false,
      battleId: null,
      problemSlug: 'two-sum',
      problemTitle: 'Two Sum',
      mode: 'Blitz',
      timeControl: '3 + 0',
      timeLeft: 134,
      player: {
        username: 'aman patel',
        displayName: 'Aman Patel',
        rating: 1532,
        testsPassed: 3,
        testsTotal: 3,
        language: 'cpp'
      },
      opponent: {
        username: 'StockfishBot',
        displayName: 'Deep Algorithmic Master',
        rating: 1520,
        testsPassed: 2,
        testsTotal: 3
      }
    });
  } catch (err) {
    console.error('Live top battle error:', err);
    res.status(500).json({ message: 'Server error fetching live battle' });
  }
});

// @route   POST /api/battles/live-register
// @desc    Register a live battle session (HTTP/REST fallback)
// @access  Public
router.post('/live-register', (req, res) => {
  try {
    const data = req.body;
    if (!data || !data.battleId) {
      return res.status(400).json({ message: 'battleId is required' });
    }

    const pRating = data.player?.rating || data.user?.rating || 1500;
    const oRating = data.opponent?.rating || 1500;
    const topRating = Math.max(pRating, oRating);

    liveBattles.set(data.battleId, {
      battleId: data.battleId,
      problemSlug: data.problemSlug || 'two-sum',
      problemTitle: data.problemTitle || 'Two Sum',
      mode: data.mode || 'Blitz',
      timeControl: data.timeControl || '3 + 0',
      durationSeconds: data.durationSeconds || 180,
      startedAt: Date.now(),
      lastActivity: Date.now(),
      timeLeft: data.timeLeft !== undefined ? data.timeLeft : 180,
      status: 'IN_PROGRESS',
      topRating,
      player: {
        userId: data.player?.userId || data.user?.id || data.user?._id || 'guest',
        username: data.player?.username || data.user?.username || 'You',
        displayName: data.player?.displayName || data.user?.displayName || data.player?.username || data.user?.username || 'You',
        rating: pRating,
        code: data.player?.code || data.initialCode || '',
        language: data.language || data.player?.language || 'cpp',
        testsPassed: data.player?.testsPassed || 0,
        testsTotal: data.player?.testsTotal || data.testsTotal || 3
      },
      opponent: {
        userId: data.opponent?.id || data.opponent?.userId || 'bot',
        username: data.opponent?.username || 'Opponent',
        displayName: data.opponent?.displayName || data.opponent?.username || 'Opponent',
        rating: oRating,
        code: data.opponent?.code || '',
        language: data.language || data.opponent?.language || 'cpp',
        testsPassed: data.opponent?.testsPassed || 0,
        testsTotal: data.opponent?.testsTotal || data.testsTotal || 3
      }
    });

    res.json({ success: true, topBattle: getTopLiveBattle() });
    broadcastPlatformStats();
  } catch (err) {
    console.error('Live register error:', err);
    res.status(500).json({ message: 'Server error registering live battle' });
  }
});

// @route   POST /api/battles/live-sync
// @desc    Sync live battle state (HTTP fallback)
// @access  Public
router.post('/live-sync', (req, res) => {
  try {
    const { battleId, code, language, timeLeft, testsPassed, testsTotal } = req.body;
    if (battleId && liveBattles.has(battleId)) {
      const b = liveBattles.get(battleId);
      if (code !== undefined) b.player.code = code;
      if (language) b.player.language = language;
      if (timeLeft !== undefined) b.timeLeft = timeLeft;
      if (testsPassed !== undefined) b.player.testsPassed = testsPassed;
      if (testsTotal !== undefined) b.player.testsTotal = testsTotal;
      b.lastActivity = Date.now();
    }
    res.json({ success: true });
  } catch (err) {
    console.error('Live sync error:', err);
    res.status(500).json({ message: 'Server error syncing battle' });
  }
});

// @route   POST /api/battles/resign
// @desc    Resign an active battle, penalizing rating points immediately if rated
// @access  Private
router.post('/resign', protect, async (req, res) => {
  try {
    const {
      mode = 'Blitz',
      timeControl = '3 min',
      problemTitle = 'Two Sum',
      opponentName,
      isRated = false
    } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const ratingKey = (mode || 'blitz').toLowerCase();
    const currentRating = (user.ratings && user.ratings[ratingKey]) || 1500;

    // Check whether the match is rated and not against an explicit bot
    const isExplicitNonRated = isRated === false || isRated === 'false' || isRated === 0 || isRated === '0';
    const isBotOpponent = opponentName && (
      String(opponentName).toLowerCase().includes('bot') ||
      String(opponentName).toLowerCase().includes('stockfish') ||
      String(opponentName).toLowerCase().includes('computer')
    );
    const isRatedMatch = !isExplicitNonRated && !isBotOpponent;

    let ratingChange = 0;
    if (isRatedMatch) {
      ratingChange = -16;
    }

    const newRating = isRatedMatch ? Math.max(100, currentRating + ratingChange) : currentRating;

    user.streak = 0;
    if (isRatedMatch) {
      if (!user.ratings) user.ratings = {};
      user.ratings[ratingKey] = newRating;
    }
    await user.save();

    // If opponent is a real user in the system, award them +16
    const realOpponent = isRatedMatch ? await findRealOpponent(opponentName, user._id) : null;
    if (realOpponent && isRatedMatch) {
      try {
        const oppRating = (realOpponent.ratings && realOpponent.ratings[ratingKey]) || 1500;
        const oppChange = 16;
        if (!realOpponent.ratings) realOpponent.ratings = {};
        realOpponent.ratings[ratingKey] = Math.max(100, oppRating + oppChange);
        await realOpponent.save();

        await RatingHistory.create({
          userId: realOpponent._id,
          mode: ['bullet', 'blitz', 'rapid', 'classical'].includes(ratingKey) ? ratingKey : 'blitz',
          oldRating: oppRating,
          ratingChange: oppChange,
          newRating: realOpponent.ratings[ratingKey],
          reason: 'OPPONENT_RESIGNED'
        });
      } catch (oppErr) {
        console.warn('Opponent rating update error on resign:', oppErr.message);
      }
    }

    const battle = await Battle.create({
      mode,
      timeControlStr: timeControl,
      problemTitle,
      isRated: isRatedMatch,
      status: 'RESIGNED',
      opponentName: opponentName || 'Opponent',
      opponentRating: 1500,
      moves: 0,
      testAccuracy: '0%',
      players: [
        {
          userId: user._id,
          ratingBefore: currentRating,
          ratingChange,
          score: 0,
          connected: false
        }
      ],
      winnerId: realOpponent ? realOpponent._id : null,
      isDraw: false
    });

    if (isRatedMatch) {
      try {
        await RatingHistory.create({
          userId: user._id,
          battleId: battle._id,
          mode: ['bullet', 'blitz', 'rapid', 'classical'].includes(ratingKey) ? ratingKey : 'blitz',
          oldRating: currentRating,
          ratingChange,
          newRating,
          reason: 'RESIGNED_MATCH'
        });
      } catch (rhErr) {
        console.warn('RatingHistory log error on resign:', rhErr.message);
      }
    }

    if (req.body.battleId && liveBattles.has(req.body.battleId)) {
      liveBattles.delete(req.body.battleId);
    }
    broadcastPlatformStats();

    res.json({
      success: true,
      resigned: true,
      isRated: isRatedMatch,
      oldRating: currentRating,
      newRating,
      ratingChange,
      updatedRatings: user.ratings
    });
  } catch (err) {
    console.error('Error in battle resignation:', err);
    res.status(500).json({ message: 'Server error during battle resignation' });
  }
});

export default router;

