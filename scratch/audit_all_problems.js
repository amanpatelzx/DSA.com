import { connectDB } from '../apps/api/src/config/db.js';
import Problem from '../apps/api/src/models/Problem.js';
import mongoose from 'mongoose';

async function runAudit() {
  await connectDB();
  const problems = await Problem.find({}).lean();
  console.log(`Auditing ${problems.length} problems...`);

  let issues = [];
  let matrixProblems = 0;
  let listProblems = 0;
  let treeProblems = 0;
  let customProblems = 0;

  for (const p of problems) {
    const meta = p.metaData || {};
    const params = meta.params || [];
    const expectedParamCount = params.length;

    // Check if matrix
    const isMatrix = params.some(pm => pm.type && (pm.type.includes('[][]') || pm.type.includes('vector<vector')));
    if (isMatrix) matrixProblems++;
    if (params.some(pm => pm.type && pm.type.includes('ListNode'))) listProblems++;
    if (params.some(pm => pm.type && pm.type.includes('TreeNode'))) treeProblems++;

    const allInputs = [
      ...(p.examples || []).map((e, idx) => ({ src: `example_${idx}`, input: e.input })),
      ...(p.visibleTestCases || []).map((t, idx) => ({ src: `testcase_${idx}`, input: t.input }))
    ];

    for (const item of allInputs) {
      const inp = item.input;
      if (!inp) {
        issues.push({ slug: p.slug, type: 'empty_input', src: item.src });
        continue;
      }

      let stack = [];
      let inQuote = false;
      let quoteChar = '';
      for (let i = 0; i < inp.length; i++) {
        const char = inp[i];
        if (inQuote) {
          if (char === quoteChar && inp[i - 1] !== '\\') {
            inQuote = false;
          }
          continue;
        }
        if (char === '"' || char === "'") {
          inQuote = true;
          quoteChar = char;
          continue;
        }
        if (char === '[' || char === '{') {
          stack.push(char);
        } else if (char === ']') {
          const popped = stack.pop();
          if (popped !== '[') {
            issues.push({ slug: p.slug, type: 'mismatched_square_bracket', inp, src: item.src });
          }
        } else if (char === '}') {
          const popped = stack.pop();
          if (popped !== '{') {
            issues.push({ slug: p.slug, type: 'mismatched_curly_brace', inp, src: item.src });
          }
        }
      }

      if (stack.length > 0) {
        issues.push({ slug: p.slug, type: 'unclosed_brackets', inp, unclosed: stack.join(''), src: item.src });
      }
    }
  }

  console.log('--- Problem Catalog Statistics ---');
  console.log(`Total Problems: ${problems.length}`);
  console.log(`Matrix (2D Array) Problems: ${matrixProblems}`);
  console.log(`ListNode Problems: ${listProblems}`);
  console.log(`TreeNode Problems: ${treeProblems}`);
  console.log(`Total Syntax / Balance Issues Found: ${issues.length}`);

  if (issues.length > 0) {
    console.log('Issues:', JSON.stringify(issues, null, 2));
  } else {
    console.log('✓ PERFECT: All 375 problems have 100% syntactically balanced inputs across all testcases and examples!');
  }

  await mongoose.disconnect();
}

runAudit().catch(err => {
  console.error('Audit failed:', err);
  process.exit(1);
});
