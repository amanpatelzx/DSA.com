import { judgeRun } from '../apps/api/src/services/judgeService.js';

async function testPython() {
  const pyCode = `
class Solution:
    def diagonalSum(self, mat: list[list[int]]) -> int:
        n = len(mat)
        res = 0
        for i in range(n):
            res += mat[i][i]
            if i != n - 1 - i:
                res += mat[i][n - 1 - i]
        return res
`;
  const res = await judgeRun({
    language: 'python',
    slug: 'matrix-diagonal-sum',
    code: pyCode,
    testcases: [
      { input: 'mat = [[1,2,3],[4,5,6],[7,8,9]]', expected: '25' },
      { input: 'mat = [[1,1,1,1],[1,1,1,1],[1,1,1,1],[1,1,1,1]]', expected: '8' }
    ]
  });
  console.log('Python Result:', res.status, res.cases.map(c => ({ passed: c.passed, out: c.output })));
}

async function testJS() {
  const jsCode = `
var diagonalSum = function(mat) {
    let n = mat.length;
    let sum = 0;
    for (let i = 0; i < n; i++) {
        sum += mat[i][i];
        if (i !== n - 1 - i) {
            sum += mat[i][n - 1 - i];
        }
    }
    return sum;
};
`;
  const res = await judgeRun({
    language: 'javascript',
    slug: 'matrix-diagonal-sum',
    code: jsCode,
    testcases: [
      { input: 'mat = [[1,2,3],[4,5,6],[7,8,9]]', expected: '25' },
      { input: 'mat = [[1,1,1,1],[1,1,1,1],[1,1,1,1],[1,1,1,1]]', expected: '8' }
    ]
  });
  console.log('JavaScript Result:', res.status, res.cases.map(c => ({ passed: c.passed, out: c.output })));
}

async function run() {
  await testPython();
  await testJS();
}

run();
