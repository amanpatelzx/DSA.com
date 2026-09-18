import express from 'express';
import { judgeRun } from '../services/judgeService.js';
import Problem from '../models/Problem.js';
import Submission from '../models/Submission.js';
import User from '../models/User.js';
import Battle from '../models/Battle.js';
import RatingHistory from '../models/RatingHistory.js';
import { findRealOpponent } from '../utils/opponentHelper.js';
import jwt from 'jsonwebtoken';
import { isBattleConcluded, markBattleConcluded, concludedBattles, getIO } from '../socket.js';

const router = express.Router();

// Atomic per-battle lock to prevent race conditions when two players submit simultaneously.
// Maps battleId -> true while the first "Accepted" submission is being processed.
const battleLocks = new Map();

// Helper to get authenticated user if token present (optional auth for Run, required for Submission)
const getOptionalUser = async (req) => {
  try {
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      const token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
      return await User.findById(decoded.id);
    }
  } catch {}
  return null;
};

// @route   POST /api/judge/run
// @desc    Run user code against sample/custom test cases in real-time
// @access  Public / Authenticated
router.post('/run', async (req, res) => {
  try {
    const { language, code, slug, testcases } = req.body;

    if (!code) {
      return res.status(400).json({ message: 'Code is required' });
    }

    if (!testcases || !Array.isArray(testcases) || testcases.length === 0) {
      return res.status(400).json({ message: 'At least one testcase is required' });
    }

    const result = await judgeRun({
      language: language || 'cpp',
      code,
      slug: slug || 'two-sum',
      testcases
    });

    res.json(result);
  } catch (error) {
    console.error('Judge run error:', error);
    res.status(500).json({
      status: 'Runtime Error',
      errorMessage: error.message,
      cases: []
    });
  }
});

// @route   POST /api/judge/submit
// @desc    Full submission against all testcases (including hidden testcases)
// @access  Public / Authenticated
router.post('/submit', async (req, res) => {
  try {
    const {
      language,
      code,
      slug,
      battleId,
      mode,
      opponentName,
      opponentId,
      isContinuation,
      isBattleConcluded: clientConcluded
    } = req.body;

    if (!code) {
      return res.status(400).json({ message: 'Code is required' });
    }

    // Retrieve problem and all test cases from DB
    let problem = await Problem.findOne({ slug }).select('+hiddenTestCases');
    if (!problem && slug) {
      problem = await Problem.findOne({ slug: new RegExp(`^${slug}$`, 'i') }).select('+hiddenTestCases');
    }
    let testcases = [];

    if (problem) {
      const visible = (problem.visibleTestCases || problem.examples || []).map(tc => ({
        input: tc.input,
        expected: tc.expected || tc.output,
        output: tc.output || tc.expected
      }));
      const hidden = (problem.hiddenTestCases || []).map(tc => ({
        input: tc.input,
        expected: tc.expected || tc.output,
        output: tc.output || tc.expected
      }));
      testcases = [...visible, ...hidden];
    }

    // Default fallback testcases if not found in DB
    if (!testcases || testcases.length === 0) {
      if (slug === 'two-sum') {
        testcases = [
          { input: 'nums = [2,7,11,15], target = 9', expected: '[0,1]' },
          { input: 'nums = [1,5,8,3], target = 11', expected: '[2,3]' },
          { input: 'nums = [3,3], target = 6', expected: '[0,1]' }
        ];
      } else if (slug === 'valid-parentheses') {
        testcases = [
          { input: 's = "()"', expected: 'true' },
          { input: 's = "()[]{}"', expected: 'true' },
          { input: 's = "(]"', expected: 'false' }
        ];
      } else {
        testcases = [{ input: 'example', expected: 'example' }];
      }
    }

    const result = await judgeRun({
      language: language || 'cpp',
      code,
      slug: slug || 'two-sum',
      testcases
    });

    // Save submission if user is logged in
    const user = await getOptionalUser(req);
    let submission = null;
    let ratingChange = 0;
    let newRating = 1500;
    let isRatedMatch = false;
    let battleAlreadyFinished = false;
    let existingBattleWinnerUsername = null;

    // ATOMIC LOCK: Check if battle is already concluded or locked by another concurrent request
    // This prevents a race condition where two players submit simultaneously and both get treated as winners.
    if (battleId) {
      const bIdStr = String(battleId);
      if (isBattleConcluded(bIdStr) || isContinuation || clientConcluded) {
        battleAlreadyFinished = true;
      } else if (result.status === 'Accepted') {
        // For accepted submissions in an active battle, acquire a lock.
        // The first request to reach here wins; the second sees the lock and treats battle as finished.
        if (battleLocks.has(bIdStr)) {
          battleAlreadyFinished = true;
        } else {
          battleLocks.set(bIdStr, true);
          // Auto-cleanup lock after 30 seconds to prevent memory leaks
          setTimeout(() => battleLocks.delete(bIdStr), 30000);
        }
      }
    } else {
      battleAlreadyFinished = Boolean(isContinuation || clientConcluded);
    }

    if (user) {
      if (!problem) {
        problem = await Problem.findOne({ slug: 'two-sum' }) || await Problem.findOne();
      }

      const totalCases = testcases.length;
      const passedCases = result.cases.filter(c => c.passed).length;
      const dbStatus = result.status === 'Accepted' ? 'ACCEPTED' :
        result.status === 'Compilation Error' ? 'COMPILATION_ERROR' :
        result.status === 'Runtime Error' ? 'RUNTIME_ERROR' :
        result.status === 'Time Limit Exceeded' ? 'TIME_LIMIT_EXCEEDED' : 'WRONG_ANSWER';

      submission = await Submission.create({
        userId: user._id,
        problemId: problem ? problem._id : user._id,
        battleId: battleId || null,
        language: language || 'cpp',
        code,
        status: dbStatus,
        runtime: parseInt(result.runtime) || 40,
        memory: parseFloat(result.memory) || 14.2,
        testCasesPassed: passedCases,
        totalTestCases: totalCases,
        errorMessage: result.errorMessage
      });

      const ratingKey = (mode || 'blitz').toLowerCase();
      newRating = (user.ratings && user.ratings[ratingKey]) || 1500;

      if (!battleAlreadyFinished && battleId) {
        try {
          const existingBattle = await Battle.findOne({
            battleId,
            status: { $in: ['COMPLETED', 'RESIGNED'] }
          });
          if (existingBattle) {
            battleAlreadyFinished = true;
            let winName = existingBattle.winnerUsername || '';
            if (!winName && existingBattle.winnerId) {
              const winUser = await User.findById(existingBattle.winnerId).select('username');
              if (winUser) winName = winUser.username;
            }
            if (!winName) {
              winName = existingBattle.opponentName || 'Opponent';
            }
            existingBattleWinnerUsername = winName;
            markBattleConcluded(battleId, {
              winnerUsername: winName,
              winnerId: existingBattle.winnerId,
              reason: 'already_completed'
            });
          }
        } catch {}
      }

      // Rating only changes when match is rated, NOT against an explicit bot, and NOT already concluded!
      const isExplicitNonRated = req.body.isRated === false || req.body.isRated === 'false' || req.body.isRated === 0 || req.body.isRated === '0';
      const isBotOpponent = opponentName && (
        String(opponentName).toLowerCase().includes('bot') ||
        String(opponentName).toLowerCase().includes('stockfish') ||
        String(opponentName).toLowerCase().includes('computer')
      );
      const realOpponent = (!isExplicitNonRated && !isBotOpponent && !battleAlreadyFinished) ? await findRealOpponent(opponentId || opponentName, user._id) : null;
      isRatedMatch = !isExplicitNonRated && !isBotOpponent && !battleAlreadyFinished;

      if (result.status === 'Accepted') {
        user.streak = (user.streak || 0) + 1;
        user.lastActive = new Date();

        if (isRatedMatch) {
          ratingChange = 16;
          if (!user.ratings) user.ratings = {};
          user.ratings[ratingKey] = (user.ratings[ratingKey] || 1500) + ratingChange;
          newRating = user.ratings[ratingKey];

          // Record rating history for user
          try {
            await RatingHistory.create({
              userId: user._id,
              mode: ['bullet', 'blitz', 'rapid', 'classical'].includes(ratingKey) ? ratingKey : 'blitz',
              oldRating: newRating - ratingChange,
              ratingChange,
              newRating,
              reason: 'BATTLE_WIN'
            });
          } catch {}

          // Real opponent loses rating in ranked match
          if (realOpponent) {
            try {
              if (!realOpponent.ratings) realOpponent.ratings = {};
              const oppRating = realOpponent.ratings[ratingKey] || 1500;
              realOpponent.ratings[ratingKey] = Math.max(100, oppRating - 12);
              await realOpponent.save();

              await RatingHistory.create({
                userId: realOpponent._id,
                mode: ['bullet', 'blitz', 'rapid', 'classical'].includes(ratingKey) ? ratingKey : 'blitz',
                oldRating: oppRating,
                ratingChange: -12,
                newRating: realOpponent.ratings[ratingKey],
                reason: 'BATTLE_LOSS'
              });
            } catch {}
          }
        } else {
          // Bot, Solo Training, or Post-Battle Practice / Already Concluded: UNRATED (No rating increase or decrease!)
          ratingChange = 0;
        }

        // CRITICAL: Mark this battle as concluded in socket registry for ALL match formats (rated and unrated)
        if (battleId && !battleAlreadyFinished) {
          markBattleConcluded(battleId, {
            winnerUsername: user.username,
            winnerId: user._id,
            reason: 'win'
          });

          // Emit battle:force_stop to ALL sockets in the battle room
          // This immediately notifies the opponent that the battle has ended,
          // even before the winner's client emits battle:won via socket.
          try {
            const io = getIO();
            if (io) {
              io.to(String(battleId)).emit('battle:force_stop', {
                battleId: String(battleId),
                winnerUsername: user.username,
                winnerId: String(user._id),
                reason: 'opponent_solved'
              });
            }
          } catch (forceStopErr) {
            console.warn('battle:force_stop emit error:', forceStopErr.message);
          }
        }

        await user.save();

        // Broadcast real-time profile and streak update to sockets
        try {
          const io = getIO();
          if (io) {
            const solvedTotal = await Submission.countDocuments({ userId: user._id, status: 'ACCEPTED' });
            io.emit('user:profile_update', {
              userId: user._id.toString(),
              username: user.username,
              streak: user.streak,
              ratings: user.ratings,
              solvedCount: solvedTotal
            });
            io.emit('user:streak_update', {
              userId: user._id.toString(),
              username: user.username,
              streak: user.streak
            });
          }
        } catch (socketErr) {
          console.warn('Realtime streak socket broadcast error:', socketErr.message);
        }
      }

      // Record Battle document ONLY if in an active unconcluded match context
      if (!battleAlreadyFinished && (isRatedMatch || opponentName)) {
        try {
          await Battle.create({
            battleId: battleId || `battle_${Date.now()}`,
            mode: mode || 'Blitz',
            timeControlStr: req.body.timeControl || '3 min',
            problemTitle: problem ? problem.title : 'Two Sum',
            isRated: isRatedMatch,
            status: 'COMPLETED',
            opponentName: realOpponent ? realOpponent.username : (opponentName || 'BOT'),
            opponentRating: realOpponent ? (realOpponent.ratings?.[ratingKey] || 1500) : 1510,
            opponentFlag: realOpponent ? (realOpponent.countryFlag || '') : '🤖',
            moves: 28,
            testAccuracy: '100%',
            players: [
              {
                userId: user._id,
                ratingBefore: isRatedMatch ? newRating - ratingChange : newRating,
                ratingChange,
                score: result.status === 'Accepted' ? 1 : 0,
                connected: true,
                submissions: [submission._id]
              }
            ],
            winnerId: result.status === 'Accepted' ? user._id : null,
            winnerUsername: result.status === 'Accepted' ? user.username : '',
            isDraw: false
          });
        } catch (bErr) {
          console.warn('Battle creation note:', bErr.message);
        }
      }
    }

    res.json({
      ...result,
      submissionId: submission ? submission._id : null,
      isRated: isRatedMatch,
      newRating,
      ratingChange,
      streak: user ? user.streak : 1,
      battleAlreadyFinished: Boolean(battleAlreadyFinished),
      winnerUsername: existingBattleWinnerUsername || (battleId && isBattleConcluded(battleId) ? concludedBattles.get(String(battleId))?.winnerUsername : null)
    });
  } catch (error) {
    console.error('Judge submit error:', error);
    res.status(500).json({
      status: 'Runtime Error',
      errorMessage: error.message,
      cases: []
    });
  }
});

export default router;
