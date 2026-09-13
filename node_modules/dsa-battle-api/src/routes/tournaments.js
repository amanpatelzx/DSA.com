import express from 'express';
import Tournament from '../models/Tournament.js';
import Problem from '../models/Problem.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * Synchronize tournament statuses based on current time:
 * - now < startTime                => UPCOMING
 * - startTime <= now < endTime     => ACTIVE (LIVE)
 * - now >= endTime                 => COMPLETED
 */
export const syncTournamentStatuses = async () => {
  try {
    const now = new Date();
    const candidates = await Tournament.find({
      status: { $in: ['UPCOMING', 'ACTIVE'] }
    });

    let anyChanged = false;
    for (const tourney of candidates) {
      const startTime = tourney.startTime ? new Date(tourney.startTime) : new Date(tourney.createdAt || Date.now());
      const durationMs = (Number(tourney.durationMinutes) || 15) * 60 * 1000;
      const endTime = tourney.endTime ? new Date(tourney.endTime) : new Date(startTime.getTime() + durationMs);

      // Ensure endTime is persisted
      if (!tourney.endTime || Math.abs(tourney.endTime.getTime() - endTime.getTime()) > 1000) {
        tourney.endTime = endTime;
      }

      if (now.getTime() >= endTime.getTime()) {
        if (tourney.status !== 'COMPLETED') {
          tourney.status = 'COMPLETED';
          tourney.endTime = endTime;
          await tourney.save();
          anyChanged = true;
          console.log(`[Tournament Lifecycle] "${tourney.title}" duration ended -> COMPLETED`);
        }
      } else if (now.getTime() >= startTime.getTime() && now.getTime() < endTime.getTime()) {
        if (tourney.status !== 'ACTIVE') {
          tourney.status = 'ACTIVE';
          await tourney.save();
          anyChanged = true;
          console.log(`[Tournament Lifecycle] "${tourney.title}" hit scheduled start time -> ACTIVE (LIVE)`);
        }
      } else if (now.getTime() < startTime.getTime()) {
        if (tourney.status !== 'UPCOMING') {
          tourney.status = 'UPCOMING';
          await tourney.save();
          anyChanged = true;
          console.log(`[Tournament Lifecycle] "${tourney.title}" is in future -> UPCOMING`);
        }
      }
    }

    if (anyChanged) {
      try {
        const { getIO } = await import('../socket.js');
        const io = getIO();
        if (io) {
          io.emit('tournaments:status_change', { timestamp: Date.now() });
        }
      } catch (err) {
        // Socket may not be initialized yet
      }
    }

    return anyChanged;
  } catch (error) {
    console.error('Error syncing tournament statuses:', error);
    return false;
  }
};

// Background ticker every 5 seconds to automatically activate/complete tournaments on schedule
setInterval(() => {
  syncTournamentStatuses().catch(() => {});
}, 5000);

// @route   GET /api/tournaments
// @desc    Get all tournaments (active, upcoming, completed)
// @access  Public
router.get('/', async (req, res) => {
  try {
    await syncTournamentStatuses();

    const tournaments = await Tournament.find({})
      .sort({ startTime: -1, createdAt: -1 })
      .populate('createdBy', 'username displayName avatar');

    const sanitized = tournaments.map(t => {
      const obj = t.toObject();
      if (Array.isArray(obj.participants)) {
        obj.participants = obj.participants.filter(p => {
          const u = (p.username || '').toLowerCase().trim();
          return !u.includes('coder_alice') &&
                 !u.includes('coder_bob') &&
                 !u.includes('test_') &&
                 !u.includes('dummy') &&
                 !u.includes('bot');
        });
      }
      return obj;
    });

    res.json(sanitized);
  } catch (error) {
    console.error('Error fetching tournaments:', error);
    res.status(500).json({ message: 'Server error fetching tournaments' });
  }
});

// @route   GET /api/tournaments/:id
// @desc    Get single tournament details with leaderboard
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    await syncTournamentStatuses();

    const tournament = await Tournament.findById(req.params.id)
      .populate('createdBy', 'username displayName avatar');
    if (!tournament) {
      return res.status(404).json({ message: 'Tournament not found' });
    }
    const obj = tournament.toObject();
    if (Array.isArray(obj.participants)) {
      obj.participants = obj.participants.filter(p => {
        const u = (p.username || '').toLowerCase().trim();
        return !u.includes('coder_alice') &&
               !u.includes('coder_bob') &&
               !u.includes('test_') &&
               !u.includes('dummy') &&
               !u.includes('bot');
      });
    }
    res.json(obj);
  } catch (error) {
    console.error('Error fetching tournament:', error);
    res.status(500).json({ message: 'Server error fetching tournament' });
  }
});

// @route   POST /api/tournaments/:id/register
// @desc    Register authenticated real user for an UPCOMING tournament
// @access  Private
router.post('/:id/register', protect, async (req, res) => {
  try {
    await syncTournamentStatuses();

    const tournament = await Tournament.findById(req.params.id);
    if (!tournament) {
      return res.status(404).json({ message: 'Tournament not found' });
    }

    const now = new Date();
    const startTime = tournament.startTime ? new Date(tournament.startTime) : new Date(tournament.createdAt || Date.now());

    if (tournament.status === 'COMPLETED') {
      return res.status(400).json({ message: 'This tournament has already ended.' });
    }

    // Strict rule: Registration is only open before start time (while UPCOMING)
    if (tournament.status === 'ACTIVE' || now.getTime() >= startTime.getTime()) {
      return res.status(400).json({
        message: 'Registration is closed because this tournament is already live. Only participants who registered beforehand can enter.'
      });
    }

    const uClean = (req.user.username || '').toLowerCase().trim();
    if (uClean.includes('bot') || req.user.isBot) {
      return res.status(403).json({ message: 'Bots cannot join tournaments.' });
    }

    // Check if already registered
    const alreadyRegistered = tournament.participants.some(
      p => p.userId && p.userId.toString() === req.user._id.toString()
    );

    if (alreadyRegistered) {
      return res.json({
        success: true,
        message: 'You are already registered for this tournament!',
        tournament
      });
    }

    tournament.participants.push({
      userId: req.user._id,
      username: req.user.username,
      avatar: req.user.avatar || '',
      registeredAt: new Date(),
      score: 0,
      problemsSolved: 0,
      timeTakenSeconds: 0,
      rank: 0
    });

    await tournament.save();

    res.json({
      success: true,
      message: 'Successfully registered for tournament!',
      tournament
    });
  } catch (error) {
    console.error('Error registering for tournament:', error);
    res.status(500).json({ message: 'Server error during tournament registration' });
  }
});

// @route   POST /api/tournaments/:id/submit-score
// @desc    Submit tournament practice score and calculate leaderboard ranks (no Elo changes)
// @access  Private
router.post('/:id/submit-score', protect, async (req, res) => {
  try {
    await syncTournamentStatuses();

    const tournament = await Tournament.findById(req.params.id);
    if (!tournament) {
      return res.status(404).json({ message: 'Tournament not found' });
    }

    const now = new Date();
    const durationMs = (tournament.durationMinutes || 15) * 60 * 1000;
    const endTime = tournament.endTime ? new Date(tournament.endTime) : new Date(tournament.startTime.getTime() + durationMs);

    if (tournament.status === 'COMPLETED' || now.getTime() >= endTime.getTime()) {
      return res.status(400).json({
        message: 'Tournament time has expired. Submissions are no longer accepted.',
        completed: true
      });
    }

    // Only registered participants can submit scores
    let participant = tournament.participants.find(
      p => p.userId && p.userId.toString() === req.user._id.toString()
    );

    if (!participant) {
      return res.status(403).json({
        message: 'You are not a registered participant for this tournament.'
      });
    }

    const { problemsSolved = 0, score = 0, timeTakenSeconds = 0 } = req.body;
    participant.score = Math.max(participant.score || 0, score);
    participant.problemsSolved = Math.max(participant.problemsSolved || 0, problemsSolved);
    participant.timeTakenSeconds = timeTakenSeconds;
    participant.completedAt = new Date();

    // Recalculate rankings for all participants who have completed/scored
    // Sort: 1. problemsSolved desc, 2. score desc, 3. timeTakenSeconds asc
    const scoredParticipants = tournament.participants.filter(p => (p.problemsSolved > 0 || p.score > 0 || p.completedAt));
    scoredParticipants.sort((a, b) => {
      if (b.problemsSolved !== a.problemsSolved) {
        return b.problemsSolved - a.problemsSolved;
      }
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      return (a.timeTakenSeconds || 0) - (b.timeTakenSeconds || 0);
    });

    scoredParticipants.forEach((p, index) => {
      p.rank = index + 1;
    });

    await tournament.save();

    res.json({
      success: true,
      message: 'Tournament score recorded successfully',
      participant,
      tournament
    });
  } catch (error) {
    console.error('Error submitting tournament score:', error);
    res.status(500).json({ message: 'Server error submitting tournament score' });
  }
});

// @route   POST /api/tournaments
// @desc    Create a new practice tournament with scheduled start time (Admin only)
// @access  Private (Admin)
router.post('/', protect, admin, async (req, res) => {
  try {
    const {
      title,
      description,
      mode = 'Blitz',
      timeControl = '15 + 0',
      durationMinutes = 15,
      problemSlugs = [],
      status = 'UPCOMING',
      startTime
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ message: 'Tournament title is required' });
    }

    // Resolve problem objects from slugs
    let resolvedProblems = [];
    if (Array.isArray(problemSlugs) && problemSlugs.length > 0) {
      const foundProbs = await Problem.find({ slug: { $in: problemSlugs } });
      resolvedProblems = problemSlugs.map(slug => {
        const found = foundProbs.find(p => p.slug === slug);
        return {
          slug,
          title: found?.title || slug,
          difficulty: found?.difficulty || 'Medium'
        };
      });
    }

    // Fallback problem if none selected
    if (resolvedProblems.length === 0) {
      const defaultProb = await Problem.findOne({ status: 'ACTIVE' });
      resolvedProblems = [{
        slug: defaultProb?.slug || 'two-sum',
        title: defaultProb?.title || 'Two Sum',
        difficulty: defaultProb?.difficulty || 'Easy'
      }];
    }

    const duration = parseInt(durationMinutes, 10) || 15;
    const start = startTime ? new Date(startTime) : new Date();
    const end = new Date(start.getTime() + duration * 60 * 1000);
    const now = new Date();

    let computedStatus = status;
    if (now.getTime() >= end.getTime()) {
      computedStatus = 'COMPLETED';
    } else if (now.getTime() >= start.getTime()) {
      computedStatus = 'ACTIVE';
    } else {
      computedStatus = 'UPCOMING';
    }

    const tournament = await Tournament.create({
      title: title.trim(),
      description: description || 'Open practice arena tournament. Climb the rankings!',
      mode,
      timeControl,
      durationMinutes: duration,
      problems: resolvedProblems,
      status: computedStatus,
      startTime: start,
      endTime: end,
      createdBy: req.user._id,
      participants: [],
      isPracticeOnly: true
    });

    res.status(201).json({
      success: true,
      message: 'Tournament created successfully',
      tournament
    });
  } catch (error) {
    console.error('Error creating tournament:', error);
    res.status(500).json({ message: 'Server error creating tournament' });
  }
});

// @route   PUT /api/tournaments/:id
// @desc    Update tournament details or scheduled times (Admin only)
// @access  Private (Admin)
router.put('/:id', protect, admin, async (req, res) => {
  try {
    const { title, description, mode, timeControl, durationMinutes, status, problemSlugs, startTime } = req.body;
    const tournament = await Tournament.findById(req.params.id);
    if (!tournament) {
      return res.status(404).json({ message: 'Tournament not found' });
    }

    if (title) tournament.title = title.trim();
    if (description !== undefined) tournament.description = description;
    if (mode) tournament.mode = mode;
    if (timeControl) tournament.timeControl = timeControl;
    if (durationMinutes !== undefined) tournament.durationMinutes = parseInt(durationMinutes, 10) || 15;
    if (startTime) tournament.startTime = new Date(startTime);

    const start = tournament.startTime ? new Date(tournament.startTime) : new Date(tournament.createdAt || Date.now());
    const durationMs = (tournament.durationMinutes || 15) * 60 * 1000;
    tournament.endTime = new Date(start.getTime() + durationMs);

    const now = new Date();
    if (status && ['UPCOMING', 'ACTIVE', 'COMPLETED'].includes(status)) {
      tournament.status = status;
      if (status === 'COMPLETED') {
        tournament.endTime = now;
      }
    } else {
      // Auto-compute status matching schedule
      if (now.getTime() >= tournament.endTime.getTime()) {
        tournament.status = 'COMPLETED';
      } else if (now.getTime() >= start.getTime()) {
        tournament.status = 'ACTIVE';
      } else {
        tournament.status = 'UPCOMING';
      }
    }

    if (Array.isArray(problemSlugs) && problemSlugs.length > 0) {
      const foundProbs = await Problem.find({ slug: { $in: problemSlugs } });
      tournament.problems = problemSlugs.map(slug => {
        const found = foundProbs.find(p => p.slug === slug);
        return {
          slug,
          title: found?.title || slug,
          difficulty: found?.difficulty || 'Medium'
        };
      });
    }

    await tournament.save();

    res.json({
      success: true,
      message: 'Tournament updated successfully',
      tournament
    });
  } catch (error) {
    console.error('Error updating tournament:', error);
    res.status(500).json({ message: 'Server error updating tournament' });
  }
});

// @route   DELETE /api/tournaments/:id
// @desc    Delete a tournament (Admin only)
// @access  Private (Admin)
router.delete('/:id', protect, admin, async (req, res) => {
  try {
    const tournament = await Tournament.findById(req.params.id);
    if (!tournament) {
      return res.status(404).json({ message: 'Tournament not found' });
    }

    await tournament.deleteOne();

    res.json({
      success: true,
      message: 'Tournament deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting tournament:', error);
    res.status(500).json({ message: 'Server error deleting tournament' });
  }
});

export default router;
