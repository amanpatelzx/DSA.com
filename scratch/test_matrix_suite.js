import { connectDB } from '../apps/api/src/config/db.js';
import Problem from '../apps/api/src/models/Problem.js';
import { judgeRun } from '../apps/api/src/services/judgeService.js';
import mongoose from 'mongoose';

async function testMatrixProblems() {
  await connectDB();
  const matrixProblems = await Problem.find({
    'metaData.params.type': { $regex: /(\[\]\[\]|vector<vector)/ }
  }).limit(10).lean();

  console.log(`Found ${matrixProblems.length} matrix problems:`);
  for (const p of matrixProblems) {
    console.log(`- ${p.title} (${p.slug}): params:`, p.metaData.params.map(pm => `${pm.name}: ${pm.type}`).join(', '), `return: ${p.metaData.return?.type}`);
  }

  // Let's test Matrix Diagonal Sum with Python, JS, Java, and C++
  console.log('\n--- Testing Matrix Diagonal Sum (LC-1572) across all 4 languages ---');
  const matSlug = 'matrix-diagonal-sum';

  // 1. C++
  const cppRes = await judgeRun({
    language: 'cpp',
    slug: matSlug,
    code: `class Solution {
public:
    int diagonalSum(vector<vector<int>>& mat) {
        int n = mat.size(), sum = 0;
        for (int i = 0; i < n; i++) {
            sum += mat[i][i];
            if (i != n - 1 - i) sum += mat[i][n - 1 - i];
        }
        return sum;
    }
};`,
    testcases: [
      { input: 'mat = [[1,2,3],[4,5,6],[7,8,9]]', expected: '25' },
      { input: 'mat = [[1,1,1,1],[1,1,1,1],[1,1,1,1],[1,1,1,1]]', expected: '8' },
      { input: 'mat = [[5]]', expected: '5' }
    ]
  });
  console.log(`C++ result: ${cppRes.status} (${cppRes.cases.filter(c => c.passed).length}/${cppRes.cases.length})`);

  // 2. Python
  const pyRes = await judgeRun({
    language: 'python',
    slug: matSlug,
    code: `class Solution:
    def diagonalSum(self, mat: list[list[int]]) -> int:
        n = len(mat)
        res = 0
        for i in range(n):
            res += mat[i][i]
            if i != n - 1 - i:
                res += mat[i][n - 1 - i]
        return res
`,
    testcases: [
      { input: 'mat = [[1,2,3],[4,5,6],[7,8,9]]', expected: '25' },
      { input: 'mat = [[1,1,1,1],[1,1,1,1],[1,1,1,1],[1,1,1,1]]', expected: '8' },
      { input: 'mat = [[5]]', expected: '5' }
    ]
  });
  console.log(`Python result: ${pyRes.status} (${pyRes.cases.filter(c => c.passed).length}/${pyRes.cases.length})`);

  // 3. JavaScript
  const jsRes = await judgeRun({
    language: 'javascript',
    slug: matSlug,
    code: `var diagonalSum = function(mat) {
    let n = mat.length, sum = 0;
    for (let i = 0; i < n; i++) {
        sum += mat[i][i];
        if (i !== n - 1 - i) sum += mat[i][n - 1 - i];
    }
    return sum;
};`,
    testcases: [
      { input: 'mat = [[1,2,3],[4,5,6],[7,8,9]]', expected: '25' },
      { input: 'mat = [[1,1,1,1],[1,1,1,1],[1,1,1,1],[1,1,1,1]]', expected: '8' },
      { input: 'mat = [[5]]', expected: '5' }
    ]
  });
  console.log(`JavaScript result: ${jsRes.status} (${jsRes.cases.filter(c => c.passed).length}/${jsRes.cases.length})`);

  // 4. Java
  const javaRes = await judgeRun({
    language: 'java',
    slug: matSlug,
    code: `class Solution {
    public int diagonalSum(int[][] mat) {
        int n = mat.length;
        int sum = 0;
        for (int i = 0; i < n; i++) {
            sum += mat[i][i];
            if (i != n - 1 - i) {
                sum += mat[i][n - 1 - i];
            }
        }
        return sum;
    }
}`,
    testcases: [
      { input: 'mat = [[1,2,3],[4,5,6],[7,8,9]]', expected: '25' },
      { input: 'mat = [[1,1,1,1],[1,1,1,1],[1,1,1,1],[1,1,1,1]]', expected: '8' },
      { input: 'mat = [[5]]', expected: '5' }
    ]
  });
  console.log(`Java result: ${javaRes.status} (${javaRes.cases.filter(c => c.passed).length}/${javaRes.cases.length})`);

  await mongoose.disconnect();
}

testMatrixProblems().catch(err => {
  console.error(err);
  process.exit(1);
});
