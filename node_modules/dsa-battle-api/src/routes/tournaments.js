import express from 'express';
import Tournament from '../models/Tournament.js';
import Problem from '../models/Problem.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// @route   GET /api/tournaments
// @desc    Get all tournaments (active, upcoming, completed)
// @access  Public
router.get('/', async (req, res) => {
  try {
    const tournaments = await Tournament.find({})
      .sort({ createdAt: -1 })
      .populate('createdBy', 'username displayName avatar');
    res.json(tournaments);
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
    const tournament = await Tournament.findById(req.params.id)
      .populate('createdBy', 'username displayName avatar');
    if (!tournament) {
      return res.status(404).json({ message: 'Tournament not found' });
    }
    res.json(tournament);
  } catch (error) {
    console.error('Error fetching tournament:', error);
    res.status(500).json({ message: 'Server error fetching tournament' });
  }
});

// @route   POST /api/tournaments/:id/register
// @desc    Register authenticated user for a tournament
// @access  Private
router.post('/:id/register', protect, async (req, res) => {
  try {
    const tournament = await Tournament.findById(req.params.id);
    if (!tournament) {
      return res.status(404).json({ message: 'Tournament not found' });
    }

    // Check if already registered
    const alreadyRegistered = tournament.participants.some(
      p => p.userId.toString() === req.user._id.toString()
    );

    if (alreadyRegistered) {
      return res.json({
        success: true,
        message: 'Already registered for this tournament',
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
      message: 'Successfully registered for tournament',
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
    const { problemsSolved = 0, score = 0, timeTakenSeconds = 0 } = req.body;
    const tournament = await Tournament.findById(req.params.id);
    if (!tournament) {
      return res.status(404).json({ message: 'Tournament not found' });
    }

    let participant = tournament.participants.find(
      p => p.userId.toString() === req.user._id.toString()
    );

    if (!participant) {
      // Auto-register if not registered yet
      participant = {
        userId: req.user._id,
        username: req.user.username,
        avatar: req.user.avatar || '',
        registeredAt: new Date(),
        score,
        problemsSolved,
        timeTakenSeconds,
        completedAt: new Date(),
        rank: 0
      };
      tournament.participants.push(participant);
    } else {
      participant.score = Math.max(participant.score || 0, score);
      participant.problemsSolved = Math.max(participant.problemsSolved || 0, problemsSolved);
      participant.timeTakenSeconds = timeTakenSeconds;
      participant.completedAt = new Date();
    }

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
// @desc    Create a new practice tournament (Admin only)
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

    const tournament = await Tournament.create({
      title: title.trim(),
      description: description || 'Open practice arena tournament. Climb the rankings!',
      mode,
      timeControl,
      durationMinutes: parseInt(durationMinutes, 10) || 15,
      problems: resolvedProblems,
      status: ['UPCOMING', 'ACTIVE', 'COMPLETED'].includes(status) ? status : 'UPCOMING',
      startTime: startTime ? new Date(startTime) : new Date(),
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
// @desc    Update tournament details or status (Admin only)
// @access  Private (Admin)
router.put('/:id', protect, admin, async (req, res) => {
  try {
    const { title, description, mode, timeControl, status, problemSlugs, startTime } = req.body;
    const tournament = await Tournament.findById(req.params.id);
    if (!tournament) {
      return res.status(404).json({ message: 'Tournament not found' });
    }

    if (title) tournament.title = title.trim();
    if (description !== undefined) tournament.description = description;
    if (mode) tournament.mode = mode;
    if (timeControl) tournament.timeControl = timeControl;
    if (status && ['UPCOMING', 'ACTIVE', 'COMPLETED'].includes(status)) {
      tournament.status = status;
      if (status === 'COMPLETED') {
        tournament.endTime = new Date();
      }
    }
    if (startTime) tournament.startTime = new Date(startTime);

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
