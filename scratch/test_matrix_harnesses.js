import { judgeRun } from '../apps/api/src/services/judgeService.js';

async function testHarnesses() {
  console.log('Testing C++ Matrix Diagonal Sum:');
  const cppRes = await judgeRun({
    language: 'cpp',
    slug: 'matrix-diagonal-sum',
    code: `
class Solution {
public:
    int diagonalSum(vector<vector<int>>& mat) {
        int n = mat.size();
        int sum = 0;
        for (int i = 0; i < n; i++) {
            sum += mat[i][i];
            if (i != n - 1 - i) {
                sum += mat[i][n - 1 - i];
            }
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
  console.log('C++ Matrix Result:', cppRes.status, cppRes.cases.map(c => ({ out: c.output, passed: c.passed })));

  console.log('Testing Python Matrix Diagonal Sum:');
  const pyRes = await judgeRun({
    language: 'python',
    slug: 'matrix-diagonal-sum',
    code: `
class Solution:
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
      { input: 'mat = [[1,1,1,1],[1,1,1,1],[1,1,1,1],[1,1,1,1]]', expected: '8' }
    ]
  });
  console.log('Python Matrix Result:', pyRes.status, pyRes.cases.map(c => ({ out: c.output, passed: c.passed })));

  console.log('Testing JS Matrix Diagonal Sum:');
  const jsRes = await judgeRun({
    language: 'javascript',
    slug: 'matrix-diagonal-sum',
    code: `
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
`,
    testcases: [
      { input: 'mat = [[1,2,3],[4,5,6],[7,8,9]]', expected: '25' },
      { input: 'mat = [[1,1,1,1],[1,1,1,1],[1,1,1,1],[1,1,1,1]]', expected: '8' }
    ]
  });
  console.log('JS Matrix Result:', jsRes.status, jsRes.cases.map(c => ({ out: c.output, passed: c.passed })));

  console.log('Testing Java Matrix Diagonal Sum:');
  const javaRes = await judgeRun({
    language: 'java',
    slug: 'matrix-diagonal-sum',
    code: `
class Solution {
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
}
`,
    testcases: [
      { input: 'mat = [[1,2,3],[4,5,6],[7,8,9]]', expected: '25' },
      { input: 'mat = [[1,1,1,1],[1,1,1,1],[1,1,1,1],[1,1,1,1]]', expected: '8' }
    ]
  });
  console.log('Java Matrix Result:', javaRes.status, javaRes.errorMessage, javaRes.cases.map(c => ({ out: c.output, passed: c.passed })));
}

testHarnesses().catch(console.error);

