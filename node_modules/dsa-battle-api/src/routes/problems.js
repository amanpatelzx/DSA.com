import express from 'express';
import Problem from '../models/Problem.js';
import ProblemVersion from '../models/ProblemVersion.js';
import CodeDraft from '../models/CodeDraft.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// @route   GET /api/problems
// @desc    Get active problems (for training ground) with optional search, difficulty, tag, and pagination
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { search, difficulty, tag, page, limit } = req.query;
    const filter = { status: 'ACTIVE' };

    if (difficulty && difficulty !== 'all') {
      filter.difficulty = new RegExp(`^${difficulty}$`, 'i');
    }

    if (tag && tag !== 'all') {
      filter.tags = { $in: [new RegExp(`^${tag}$`, 'i')] };
    }

    if (search && search.trim()) {
      const q = search.trim();
      const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.$or = [
        { title: { $regex: escaped, $options: 'i' } },
        { slug: { $regex: escaped, $options: 'i' } },
        { tags: { $regex: escaped, $options: 'i' } }
      ];
    }

    const total = await Problem.countDocuments(filter);
    let query = Problem.find(filter).select('-hiddenTestCases');

    if (page || limit) {
      const pageNum = Math.max(1, parseInt(page) || 1);
      const limitNum = Math.max(1, Math.min(100, parseInt(limit) || 25));
      const skip = (pageNum - 1) * limitNum;
      query = query.skip(skip).limit(limitNum);

      const problems = await query;
      return res.json({
        problems,
        total,
        page: pageNum,
        totalPages: Math.ceil(total / limitNum)
      });
    }

    const problems = await query;
    res.setHeader('X-Total-Count', total);
    res.json(problems);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/problems/practice/last-active
// @desc    Get the last problem the user was practicing on training ground
// @access  Private
router.get('/practice/last-active', protect, async (req, res) => {
  try {
    const lastDraft = await CodeDraft.findOne({ userId: req.user._id })
      .sort({ updatedAt: -1 });

    if (!lastDraft) {
      return res.json({ hasActivePractice: false });
    }

    const problem = await Problem.findOne({ slug: lastDraft.problemSlug }).select('title difficulty tags points');

    res.json({
      hasActivePractice: true,
      slug: lastDraft.problemSlug,
      title: problem?.title || lastDraft.problemTitle || lastDraft.problemSlug,
      difficulty: problem?.difficulty || lastDraft.problemDifficulty || 'Medium',
      tags: problem?.tags || lastDraft.tags || [],
      points: problem?.points || (lastDraft.problemDifficulty === 'Easy' ? 3 : lastDraft.problemDifficulty === 'Hard' ? 10 : 5),
      language: lastDraft.language,
      updatedAt: lastDraft.updatedAt
    });
  } catch (error) {
    console.error('Error fetching last active practice:', error);
    res.status(500).json({ message: 'Server error fetching last active practice' });
  }
});

// @route   GET /api/problems/random
// @desc    Get randomized problems for 1v1 battles & challenges across the full problem set
// @access  Public
router.get('/random', async (req, res) => {
  try {
    const count = Math.max(1, Math.min(10, parseInt(req.query.count) || 1));
    const mode = (req.query.mode || '').toLowerCase().trim();
    const difficulty = (req.query.difficulty || '').toLowerCase().trim();
    const excludeRaw = req.query.exclude || '';
    const excludeSlugs = excludeRaw ? excludeRaw.split(',').map(s => s.trim().toLowerCase()).filter(Boolean) : [];

    const sampleFromPool = async (baseFilter, size, excludeList = []) => {
      const matchFilter = { status: 'ACTIVE', ...baseFilter };
      if (excludeList.length > 0) {
        matchFilter.slug = { $nin: excludeList };
      }

      let sampled = await Problem.aggregate([
        { $match: matchFilter },
        { $sample: { size } },
        { $project: { slug: 1, title: 1, difficulty: 1, points: 1, tags: 1, description: 1 } }
      ]);

      if (sampled.length < size && excludeList.length > 0) {
        const remainingNeeded = size - sampled.length;
        const alreadySlugs = sampled.map(p => p.slug);
        const fallback = await Problem.aggregate([
          { $match: { status: 'ACTIVE', ...baseFilter, slug: { $nin: alreadySlugs } } },
          { $sample: { size: remainingNeeded } },
          { $project: { slug: 1, title: 1, difficulty: 1, points: 1, tags: 1, description: 1 } }
        ]);
        sampled = sampled.concat(fallback);
      }

      if (sampled.length < size) {
        const remainingNeeded = size - sampled.length;
        const alreadySlugs = sampled.map(p => p.slug);
        const fallbackAny = await Problem.aggregate([
          { $match: { status: 'ACTIVE', slug: { $nin: alreadySlugs } } },
          { $sample: { size: remainingNeeded } },
          { $project: { slug: 1, title: 1, difficulty: 1, points: 1, tags: 1, description: 1 } }
        ]);
        sampled = sampled.concat(fallbackAny);
      }

      return sampled;
    };

    let resultProblems = [];

    if (difficulty === 'mixed') {
      if (count === 1) {
        resultProblems = await sampleFromPool({}, 1, excludeSlugs);
      } else if (count === 2) {
        const p1 = await sampleFromPool({ difficulty: /^easy$/i }, 1, excludeSlugs);
        const p2 = await sampleFromPool({ difficulty: /^medium$/i }, 1, [...excludeSlugs, ...(p1.map(p => p.slug))]);
        resultProblems = [...p1, ...p2];
      } else if (count === 3) {
        const p1 = await sampleFromPool({ difficulty: /^easy$/i }, 1, excludeSlugs);
        const p2 = await sampleFromPool({ difficulty: /^medium$/i }, 1, [...excludeSlugs, ...(p1.map(p => p.slug))]);
        const p3 = await sampleFromPool({ difficulty: /^hard$/i }, 1, [...excludeSlugs, ...(p1.map(p => p.slug)), ...(p2.map(p => p.slug))]);
        resultProblems = [...p1, ...p2, ...p3];
      } else {
        resultProblems = await sampleFromPool({}, count, excludeSlugs);
      }
    } else if (difficulty === 'easy') {
      resultProblems = await sampleFromPool({ difficulty: /^easy$/i }, count, excludeSlugs);
    } else if (difficulty === 'medium') {
      resultProblems = await sampleFromPool({ difficulty: /^medium$/i }, count, excludeSlugs);
    } else if (difficulty === 'hard') {
      resultProblems = await sampleFromPool({ difficulty: /^hard$/i }, count, excludeSlugs);
    } else if (mode === 'bullet') {
      resultProblems = await sampleFromPool({ difficulty: /^easy$/i }, count, excludeSlugs);
    } else if (mode === 'blitz') {
      resultProblems = await sampleFromPool({ difficulty: { $in: [/^easy$/i, /^medium$/i] } }, count, excludeSlugs);
    } else if (mode === 'rapid') {
      resultProblems = await sampleFromPool({ difficulty: /^medium$/i }, count, excludeSlugs);
    } else if (mode === 'classical') {
      resultProblems = await sampleFromPool({ difficulty: /^hard$/i }, count, excludeSlugs);
    } else {
      resultProblems = await sampleFromPool({}, count, excludeSlugs);
    }

    res.json({
      count: resultProblems.length,
      slugs: resultProblems.map(p => p.slug),
      problems: resultProblems
    });
  } catch (error) {
    console.error('Error fetching random problems:', error);
    res.status(500).json({ message: 'Server error fetching random problems' });
  }
});

// @route   GET /api/problems/:slug
// @desc    Get single problem by slug
// @access  Public
router.get('/:slug', async (req, res) => {
  try {
    const problem = await Problem.findOne({ slug: req.params.slug, status: 'ACTIVE' })
      .select('-hiddenTestCases');
      
    if (!problem) {
      return res.status(404).json({ message: 'Problem not found' });
    }
    
    res.json(problem);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/problems/:slug/draft
// @desc    Get user's auto-saved practice code for this problem and language
// @access  Private
router.get('/:slug/draft', protect, async (req, res) => {
  try {
    const lang = req.query.lang || 'cpp';
    const draft = await CodeDraft.findOne({
      userId: req.user._id,
      problemSlug: req.params.slug,
      language: lang
    });

    if (!draft) {
      return res.json({ exists: false });
    }

    res.json({
      exists: true,
      code: draft.code,
      language: draft.language,
      updatedAt: draft.updatedAt
    });
  } catch (error) {
    console.error('Error fetching code draft:', error);
    res.status(500).json({ message: 'Server error fetching code draft' });
  }
});

// @route   POST /api/problems/:slug/draft
// @desc    Auto-save user's practice code in training ground to their user account
// @access  Private
router.post('/:slug/draft', protect, async (req, res) => {
  try {
    const { language = 'cpp', code, problemTitle, problemDifficulty, tags } = req.body;
    if (code === undefined || typeof code !== 'string') {
      return res.status(400).json({ message: 'Code is required' });
    }

    const draft = await CodeDraft.findOneAndUpdate(
      {
        userId: req.user._id,
        problemSlug: req.params.slug,
        language
      },
      {
        code,
        problemTitle: problemTitle || req.params.slug,
        problemDifficulty: problemDifficulty || 'Medium',
        ...(tags && Array.isArray(tags) && { tags }),
        updatedAt: new Date()
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.json({
      message: 'Draft auto-saved successfully',
      updatedAt: draft.updatedAt
    });
  } catch (error) {
    console.error('Error saving code draft:', error);
    res.status(500).json({ message: 'Server error saving code draft' });
  }
});

// ==========================================
// ADMIN ROUTES
// ==========================================

// @route   GET /api/problems/admin/all
// @desc    Get all problems including drafts (Admin)
// @access  Private/Admin
router.get('/admin/all', protect, admin, async (req, res) => {
  try {
    // Admins can see hiddenTestCases if needed, using +hiddenTestCases
    const problems = await Problem.find().select('+hiddenTestCases');
    res.json(problems);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/problems
// @desc    Create a new problem (Admin)
// @access  Private/Admin
router.post('/', protect, admin, async (req, res) => {
  try {
    const {
      title, slug, description, difficulty, points, tags, constraints, followUp,
      inputFormat, outputFormat, examples, visibleTestCases, hiddenTestCases,
      supportedLanguages, timeLimit, memoryLimit, status
    } = req.body;

    const problemExists = await Problem.findOne({ slug });
    if (problemExists) {
      return res.status(400).json({ message: 'Problem with this slug already exists' });
    }

    const problem = await Problem.create({
      title, slug, description, difficulty, points: points || 3, tags, constraints, followUp,
      inputFormat, outputFormat, examples, visibleTestCases, hiddenTestCases,
      supportedLanguages, timeLimit, memoryLimit, status: status || 'ACTIVE'
    });

    // Create initial version
    const problemVersion = await ProblemVersion.create({
      problemId: problem._id,
      versionNumber: 1,
      title, description, difficulty, points: points || 3, tags, constraints,
      inputFormat, outputFormat, examples, visibleTestCases, hiddenTestCases,
      supportedLanguages, timeLimit, memoryLimit
    });

    problem.activeVersionId = problemVersion._id;
    await problem.save();

    res.status(201).json(problem);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/problems/:id
// @desc    Update a problem and create new version (Admin)
// @access  Private/Admin
router.put('/:id', protect, admin, async (req, res) => {
  try {
    const problem = await Problem.findById(req.params.id).select('+hiddenTestCases');
    
    if (!problem) {
      return res.status(404).json({ message: 'Problem not found' });
    }

    const {
      title, slug, description, difficulty, points, tags, constraints,
      inputFormat, outputFormat, examples, visibleTestCases, hiddenTestCases,
      supportedLanguages, timeLimit, memoryLimit, status
    } = req.body;

    // Update problem fields
    problem.title = title || problem.title;
    problem.slug = slug || problem.slug;
    problem.description = description || problem.description;
    problem.difficulty = difficulty || problem.difficulty;
    problem.points = points !== undefined ? points : problem.points;
    problem.tags = tags || problem.tags;
    problem.constraints = constraints || problem.constraints;
    problem.followUp = followUp !== undefined ? followUp : problem.followUp;
    problem.inputFormat = inputFormat || problem.inputFormat;
    problem.outputFormat = outputFormat || problem.outputFormat;
    problem.examples = examples || problem.examples;
    problem.visibleTestCases = visibleTestCases || problem.visibleTestCases;
    problem.hiddenTestCases = hiddenTestCases || problem.hiddenTestCases;
    problem.supportedLanguages = supportedLanguages || problem.supportedLanguages;
    problem.timeLimit = timeLimit || problem.timeLimit;
    problem.memoryLimit = memoryLimit || problem.memoryLimit;
    problem.status = status || problem.status;

    // Determine current highest version
    const lastVersion = await ProblemVersion.findOne({ problemId: problem._id }).sort({ versionNumber: -1 });
    const newVersionNumber = lastVersion ? lastVersion.versionNumber + 1 : 1;

    // Create new version snapshot
    const newVersion = await ProblemVersion.create({
      problemId: problem._id,
      versionNumber: newVersionNumber,
      title: problem.title,
      description: problem.description,
      difficulty: problem.difficulty,
      points: problem.points,
      tags: problem.tags,
      constraints: problem.constraints,
      inputFormat: problem.inputFormat,
      outputFormat: problem.outputFormat,
      examples: problem.examples,
      visibleTestCases: problem.visibleTestCases,
      hiddenTestCases: problem.hiddenTestCases,
      supportedLanguages: problem.supportedLanguages,
      timeLimit: problem.timeLimit,
      memoryLimit: problem.memoryLimit
    });

    problem.activeVersionId = newVersion._id;
    const updatedProblem = await problem.save();

    res.json(updatedProblem);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/problems/:id
// @desc    Delete a problem (Admin)
// @access  Private/Admin
router.delete('/:id', protect, admin, async (req, res) => {
  try {
    const problem = await Problem.findById(req.params.id);
    if (!problem) {
      return res.status(404).json({ message: 'Problem not found' });
    }

    await Problem.findByIdAndDelete(req.params.id);
    await ProblemVersion.deleteMany({ problemId: req.params.id });

    res.json({ message: 'Problem deleted successfully', id: req.params.id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
