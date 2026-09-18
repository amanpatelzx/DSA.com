import { seedProblems } from './seedProblems300.js';
import { seedEasyProblems } from './seedEasyProblems.js';
import { connectDB } from '../config/db.js';
import Problem from '../models/Problem.js';
import { SINGLE_EX_HIDDEN_TESTCASES } from './enrichHiddenTestCases.js';

const getHiddenTestCases = (prob) => {
  if (prob.hiddenTestCases && prob.hiddenTestCases.length > 0) return prob.hiddenTestCases;
  if (prob.examples && prob.examples.length >= 2) {
    return prob.examples.slice(1).map(ex => ({ input: ex.input, output: ex.output !== undefined && ex.output !== null ? String(ex.output) : '', explanation: ex.explanation || '' }));
  }
  if (SINGLE_EX_HIDDEN_TESTCASES[prob.slug]) {
    return SINGLE_EX_HIDDEN_TESTCASES[prob.slug];
  }
  if (prob.examples && prob.examples.length === 1) {
    return [{ input: prob.examples[0].input, output: prob.examples[0].output !== undefined && prob.examples[0].output !== null ? String(prob.examples[0].output) : '', explanation: prob.examples[0].explanation || '' }];
  }
  return [];
};

const runAllSeeds = async () => {
  try {
    await connectDB();
    console.log('--- Running Canonical 1-300 Seeder ---');
    // Load static leetcode snippets/metadata
    let lcData = {};
    try {
      const fs = await import('fs');
      const path = await import('path');
      const cachePath = path.resolve('./apps/api/src/seeds/leetcodeDataCache.json');
      const rootPath = path.resolve('./scratch_all_lc_results.json');
      if (fs.existsSync(rootPath)) {
        lcData = JSON.parse(fs.readFileSync(rootPath, 'utf-8'));
      }
    } catch {}

    const { PROBLEMS_300 } = await import('./seedProblems300.js');
    for (const prob of PROBLEMS_300) {
      const lc = lcData[prob.slug];
      const payload = {
        title: lc?.title || prob.title,
        slug: prob.slug,
        difficulty: prob.difficulty,
        points: prob.points || (prob.difficulty === 'Easy' ? 3 : prob.difficulty === 'Medium' ? 5 : 10),
        tags: prob.tags || ['Algorithms'],
        description: prob.description,
        constraints: prob.constraints || ['1 <= n <= 10^5'],
        followUp: prob.followUp,
        examples: prob.examples || [],
        visibleTestCases: prob.examples ? prob.examples.map(ex => ({ input: ex.input, output: ex.output })) : [],
        hiddenTestCases: getHiddenTestCases(prob),
        supportedLanguages: ['cpp', 'python', 'javascript', 'java'],
        status: 'ACTIVE'
      };
      if (lc?.codeSnippets) {
        payload.codeSnippets = lc.codeSnippets.filter(s => ['cpp', 'java', 'python3', 'python', 'javascript', 'typescript', 'c'].includes(s.langSlug));
      }
      if (lc?.metaData) {
        payload.metaData = lc.metaData;
      }
      await Problem.updateOne({ slug: prob.slug }, { $set: payload }, { upsert: true });
    }

    console.log('--- Running Canonical Easy Problems Seeder ---');
    const { EASY_PROBLEMS } = await import('./seedEasyProblems.js');
    for (const prob of EASY_PROBLEMS) {
      const lc = lcData[prob.slug];
      const payload = {
        title: lc?.title || prob.title,
        slug: prob.slug,
        difficulty: prob.difficulty,
        points: prob.points || 3,
        tags: prob.tags || ['Algorithms'],
        description: prob.description,
        constraints: prob.constraints || ['1 <= n <= 10^5'],
        followUp: prob.followUp,
        examples: prob.examples || [],
        visibleTestCases: prob.examples ? prob.examples.map(ex => ({ input: ex.input, output: ex.output })) : [],
        hiddenTestCases: getHiddenTestCases(prob),
        supportedLanguages: ['cpp', 'python', 'javascript', 'java'],
        status: 'ACTIVE'
      };
      if (lc?.codeSnippets) {
        payload.codeSnippets = lc.codeSnippets.filter(s => ['cpp', 'java', 'python3', 'python', 'javascript', 'typescript', 'c'].includes(s.langSlug));
      }
      if (lc?.metaData) {
        payload.metaData = lc.metaData;
      }
      await Problem.updateOne({ slug: prob.slug }, { $set: payload }, { upsert: true });
    }

    const totalCount = await Problem.countDocuments();
    const totalEasy = await Problem.countDocuments({ difficulty: 'Easy' });
    const totalMedium = await Problem.countDocuments({ difficulty: 'Medium' });
    const totalHard = await Problem.countDocuments({ difficulty: 'Hard' });

    console.log(`\n========================================`);
    console.log(`✓ All Seeds Completed Successfully!`);
    console.log(`Total Problems in Database: ${totalCount}`);
    console.log(`- Easy:   ${totalEasy}`);
    console.log(`- Medium: ${totalMedium}`);
    console.log(`- Hard:   ${totalHard}`);
    console.log(`========================================\n`);

    process.exit(0);
  } catch (err) {
    console.error('Seeding error:', err);
    process.exit(1);
  }
};

runAllSeeds();
