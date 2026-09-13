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

/**
 * Automatically infer LeetCode AST metadata and multi-language starter code snippets
 * based on problem title, slug, and example testcases.
 */
export function inferProblemMetaAndSnippets({ title = '', slug = '', examples = [] }) {
  let baseStr = slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const words = baseStr.split(/[-_\s]+/).filter(Boolean);
  let funcName = words[0] || 'solve';
  for (let i = 1; i < words.length; i++) {
    funcName += words[i].charAt(0).toUpperCase() + words[i].slice(1);
  }

  const firstEx = (examples && examples.length > 0) ? examples[0] : { input: '', output: '' };
  const rawInput = firstEx.input || '';
  const rawOutput = (firstEx.output !== undefined && firstEx.output !== null) ? String(firstEx.output).trim() : '';

  // Bracket-aware chunker
  const parts = [];
  let bracketDepth = 0;
  let inStr = false;
  let quoteChar = null;
  let start = 0;
  for (let i = 0; i < rawInput.length; i++) {
    const c = rawInput[i];
    if ((c === '"' || c === "'") && (i === 0 || rawInput[i - 1] !== '\\')) {
      if (!inStr) { inStr = true; quoteChar = c; }
      else if (c === quoteChar) { inStr = false; }
    } else if (!inStr) {
      if (c === '[' || c === '{' || c === '(') bracketDepth++;
      else if (c === ']' || c === '}' || c === ')') bracketDepth--;
      else if (bracketDepth === 0 && (c === ',' || c === '\n')) {
        const chunk = rawInput.substring(start, i).trim();
        if (chunk) parts.push(chunk);
        start = i + 1;
      }
    }
  }
  const rem = rawInput.substring(start).trim();
  if (rem) parts.push(rem);

  const params = [];
  for (let idx = 0; idx < parts.length; idx++) {
    const p = parts[idx];
    let pName = `param${idx + 1}`;
    let pVal = p;
    if (p.includes('=')) {
      const eq = p.indexOf('=');
      pName = p.substring(0, eq).trim();
      pVal = p.substring(eq + 1).trim();
    }

    let pType = 'integer';
    const lowName = pName.toLowerCase();
    if (pVal.startsWith('[[') && pVal.endsWith(']]')) {
      if (pVal.includes('"') || pVal.includes("'")) {
        pType = (pVal.length < 60 && /['"][a-zA-Z0-9.+-]['"]/.test(pVal)) ? 'character[][]' : 'string[][]';
      } else {
        pType = 'integer[][]';
      }
    } else if (pVal.startsWith('[') && pVal.endsWith(']')) {
      if (lowName === 'head' || lowName.includes('listnode') || lowName === 'list1' || lowName === 'list2') {
        pType = 'ListNode';
      } else if (lowName === 'root' || lowName.includes('treenode')) {
        pType = 'TreeNode';
      } else if (pVal.includes('"') || pVal.includes("'")) {
        pType = 'string[]';
      } else {
        pType = 'integer[]';
      }
    } else if ((pVal.startsWith('"') && pVal.endsWith('"')) || (pVal.startsWith("'") && pVal.endsWith("'"))) {
      pType = pVal.length === 3 ? 'character' : 'string';
    } else if (pVal.toLowerCase() === 'true' || pVal.toLowerCase() === 'false') {
      pType = 'boolean';
    } else if (!isNaN(Number(pVal))) {
      pType = pVal.includes('.') ? 'double' : 'integer';
    }

    params.push({ name: pName, type: pType });
  }

  // 3. Infer return type
  let returnType = 'integer';
  if (rawOutput.toLowerCase() === 'true' || rawOutput.toLowerCase() === 'false') {
    returnType = 'boolean';
  } else if (rawOutput.startsWith('[[') && rawOutput.endsWith(']]')) {
    returnType = (rawOutput.includes('"') || rawOutput.includes("'")) ? 'string[][]' : 'integer[][]';
  } else if (rawOutput.startsWith('[') && rawOutput.endsWith(']')) {
    const hasListNode = params.some(p => p.type === 'ListNode');
    const hasTreeNode = params.some(p => p.type === 'TreeNode');
    if (hasListNode) returnType = 'ListNode';
    else if (hasTreeNode) returnType = 'TreeNode';
    else if (rawOutput.includes('"') || rawOutput.includes("'")) returnType = 'string[]';
    else returnType = 'integer[]';
  } else if ((rawOutput.startsWith('"') && rawOutput.endsWith('"')) || (rawOutput.startsWith("'") && rawOutput.endsWith("'"))) {
    returnType = 'string';
  } else if (rawOutput === 'null' || rawOutput === '') {
    returnType = 'void';
  } else if (!isNaN(Number(rawOutput))) {
    returnType = rawOutput.includes('.') ? 'double' : 'integer';
  }

  const metaData = {
    name: funcName,
    params,
    return: { type: returnType }
  };

  // C++ snippet
  const cppTypeMap = {
    'integer': 'int',
    'long': 'long long',
    'double': 'double',
    'boolean': 'bool',
    'character': 'char',
    'string': 'string',
    'integer[]': 'vector<int>&',
    'character[]': 'vector<char>&',
    'string[]': 'vector<string>&',
    'integer[][]': 'vector<vector<int>>&',
    'character[][]': 'vector<vector<char>>&',
    'string[][]': 'vector<vector<string>>&',
    'ListNode': 'ListNode*',
    'ListNode[]': 'vector<ListNode*>&',
    'TreeNode': 'TreeNode*',
    'void': 'void'
  };
  const cppRetType = (cppTypeMap[returnType] || 'int').replace('&', '');
  const cppArgs = params.map(p => `${cppTypeMap[p.type] || 'int'} ${p.name}`).join(', ');
  const cppCode = `class Solution {\npublic:\n    ${cppRetType} ${funcName}(${cppArgs}) {\n        \n    }\n};`;

  // Java snippet
  const javaTypeMap = {
    'integer': 'int',
    'long': 'long',
    'double': 'double',
    'boolean': 'boolean',
    'character': 'char',
    'string': 'String',
    'integer[]': 'int[]',
    'character[]': 'char[]',
    'string[]': 'String[]',
    'integer[][]': 'int[][]',
    'character[][]': 'char[][]',
    'string[][]': 'String[][]',
    'ListNode': 'ListNode',
    'ListNode[]': 'ListNode[]',
    'TreeNode': 'TreeNode',
    'void': 'void'
  };
  const javaRetType = javaTypeMap[returnType] || 'int';
  const javaArgs = params.map(p => `${javaTypeMap[p.type] || 'int'} ${p.name}`).join(', ');
  const javaCode = `class Solution {\n    public ${javaRetType} ${funcName}(${javaArgs}) {\n        \n    }\n}`;

  // Python snippet
  const pyTypeMap = {
    'integer': 'int',
    'long': 'int',
    'double': 'float',
    'boolean': 'bool',
    'character': 'str',
    'string': 'str',
    'integer[]': 'List[int]',
    'character[]': 'List[str]',
    'string[]': 'List[str]',
    'integer[][]': 'List[List[int]]',
    'character[][]': 'List[List[str]]',
    'string[][]': 'List[List[str]]',
    'ListNode': 'Optional[ListNode]',
    'ListNode[]': 'List[Optional[ListNode]]',
    'TreeNode': 'Optional[TreeNode]',
    'void': 'None'
  };
  const pyRetType = pyTypeMap[returnType] || 'int';
  const pyArgs = params.map(p => `${p.name}: ${pyTypeMap[p.type] || 'Any'}`).join(', ');
  const pyCode = `class Solution:\n    def ${funcName}(self, ${pyArgs}) -> ${pyRetType}:\n        pass\n`;

  // JavaScript snippet
  const jsTypeMap = {
    'integer': 'number',
    'long': 'number',
    'double': 'number',
    'boolean': 'boolean',
    'character': 'character',
    'string': 'string',
    'integer[]': 'number[]',
    'character[]': 'character[]',
    'string[]': 'string[]',
    'integer[][]': 'number[][]',
    'character[][]': 'character[][]',
    'string[][]': 'string[][]',
    'ListNode': 'ListNode',
    'TreeNode': 'TreeNode',
    'void': 'void'
  };
  const jsDocParams = params.map(p => ` * @param {${jsTypeMap[p.type] || '*'}} ${p.name}`).join('\n');
  const jsArgs = params.map(p => p.name).join(', ');
  const jsCode = `/**\n${jsDocParams}\n * @return {${jsTypeMap[returnType] || '*'}}\n */\nvar ${funcName} = function(${jsArgs}) {\n    \n};`;

  const codeSnippets = [
    { lang: 'C++', langSlug: 'cpp', code: cppCode },
    { lang: 'Java', langSlug: 'java', code: javaCode },
    { lang: 'Python 3', langSlug: 'python', code: pyCode },
    { lang: 'JavaScript', langSlug: 'javascript', code: jsCode }
  ];

  return { metaData, codeSnippets };
}

// @route   POST /api/problems/infer-meta
// @desc    Preview inferred function signature & templates for admin creation modal
// @access  Private/Admin
router.post('/infer-meta', protect, admin, (req, res) => {
  try {
    const { title, slug, examples, visibleTestCases } = req.body;
    const inferred = inferProblemMetaAndSnippets({
      title: title || '',
      slug: slug || '',
      examples: (examples && examples.length > 0) ? examples : visibleTestCases
    });
    res.json(inferred);
  } catch (err) {
    res.status(500).json({ message: 'Failed to infer problem metadata', error: err.message });
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
      supportedLanguages, timeLimit, memoryLimit, status, codeSnippets, metaData
    } = req.body;

    const problemExists = await Problem.findOne({ slug });
    if (problemExists) {
      return res.status(400).json({ message: 'Problem with this slug already exists' });
    }

    let finalMetaData = metaData;
    let finalCodeSnippets = codeSnippets;

    if (!finalMetaData || !finalCodeSnippets || finalCodeSnippets.length === 0) {
      const inferred = inferProblemMetaAndSnippets({
        title,
        slug,
        examples: (examples && examples.length > 0) ? examples : visibleTestCases
      });
      if (!finalMetaData) finalMetaData = inferred.metaData;
      if (!finalCodeSnippets || finalCodeSnippets.length === 0) finalCodeSnippets = inferred.codeSnippets;
    }

    const problem = await Problem.create({
      title, slug, description, difficulty, points: points || 3, tags, constraints, followUp,
      inputFormat, outputFormat, examples, visibleTestCases, hiddenTestCases,
      supportedLanguages: supportedLanguages || ['cpp', 'python', 'javascript', 'java'],
      timeLimit: timeLimit || 2000,
      memoryLimit: memoryLimit || 256,
      metaData: finalMetaData,
      codeSnippets: finalCodeSnippets,
      status: status || 'ACTIVE'
    });

    // Create initial version
    const problemVersion = await ProblemVersion.create({
      problemId: problem._id,
      versionNumber: 1,
      title, description, difficulty, points: points || 3, tags, constraints,
      inputFormat, outputFormat, examples, visibleTestCases, hiddenTestCases,
      supportedLanguages: supportedLanguages || ['cpp', 'python', 'javascript', 'java'],
      timeLimit: timeLimit || 2000,
      memoryLimit: memoryLimit || 256,
      metaData: finalMetaData,
      codeSnippets: finalCodeSnippets
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
      supportedLanguages, timeLimit, memoryLimit, status, codeSnippets, metaData
    } = req.body;

    // Update problem fields
    problem.title = title || problem.title;
    problem.slug = slug || problem.slug;
    problem.description = description || problem.description;
    problem.difficulty = difficulty || problem.difficulty;
    problem.points = points !== undefined ? points : problem.points;
    problem.tags = tags || problem.tags;
    problem.constraints = constraints || problem.constraints;
    problem.followUp = req.body.followUp !== undefined ? req.body.followUp : problem.followUp;
    problem.inputFormat = inputFormat || problem.inputFormat;
    problem.outputFormat = outputFormat || problem.outputFormat;
    problem.examples = examples || problem.examples;
    problem.visibleTestCases = visibleTestCases || problem.visibleTestCases;
    problem.hiddenTestCases = hiddenTestCases || problem.hiddenTestCases;
    problem.supportedLanguages = supportedLanguages || problem.supportedLanguages;
    problem.timeLimit = timeLimit || problem.timeLimit;
    problem.memoryLimit = memoryLimit || problem.memoryLimit;
    problem.status = status || problem.status;

    if (metaData) problem.metaData = metaData;
    if (codeSnippets && codeSnippets.length > 0) problem.codeSnippets = codeSnippets;

    if (!problem.metaData || !problem.codeSnippets || problem.codeSnippets.length === 0) {
      const inferred = inferProblemMetaAndSnippets({
        title: problem.title,
        slug: problem.slug,
        examples: (problem.examples && problem.examples.length > 0) ? problem.examples : problem.visibleTestCases
      });
      if (!problem.metaData) problem.metaData = inferred.metaData;
      if (!problem.codeSnippets || problem.codeSnippets.length === 0) problem.codeSnippets = inferred.codeSnippets;
    }

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
      memoryLimit: problem.memoryLimit,
      metaData: problem.metaData,
      codeSnippets: problem.codeSnippets
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
