import { judgeRun } from '../apps/api/src/services/judgeService.js';

async function testRotate() {
  console.log('Testing C++ rotate-image:');
  const cpp = await judgeRun({
    language: 'cpp',
    slug: 'rotate-image',
    code: `class Solution {
public:
    void rotate(vector<vector<int>>& matrix) {
        int n = matrix.size();
        for (int i = 0; i < n; i++) {
            for (int j = i; j < n; j++) swap(matrix[i][j], matrix[j][i]);
        }
        for (int i = 0; i < n; i++) {
            for (int j = 0; j < n / 2; j++) swap(matrix[i][j], matrix[i][n - 1 - j]);
        }
    }
};`,
    testcases: [{ input: 'matrix = [[1,2,3],[4,5,6],[7,8,9]]', expected: '[[7,4,1],[8,5,2],[9,6,3]]' }]
  });
  console.log('C++ rotate:', cpp.status, cpp.cases[0]?.output);

  console.log('Testing Python rotate-image:');
  const py = await judgeRun({
    language: 'python',
    slug: 'rotate-image',
    code: `class Solution:
    def rotate(self, matrix: list[list[int]]) -> None:
        n = len(matrix)
        for i in range(n):
            for j in range(i, n):
                matrix[i][j], matrix[j][i] = matrix[j][i], matrix[i][j]
        for i in range(n):
            matrix[i].reverse()
`,
    testcases: [{ input: 'matrix = [[1,2,3],[4,5,6],[7,8,9]]', expected: '[[7,4,1],[8,5,2],[9,6,3]]' }]
  });
  console.log('Python rotate:', py.status, py.cases[0]?.output);

  console.log('Testing JS rotate-image:');
  const js = await judgeRun({
    language: 'javascript',
    slug: 'rotate-image',
    code: `var rotate = function(matrix) {
    let n = matrix.length;
    for (let i = 0; i < n; i++) {
        for (let j = i; j < n; j++) {
            let tmp = matrix[i][j];
            matrix[i][j] = matrix[j][i];
            matrix[j][i] = tmp;
        }
    }
    for (let i = 0; i < n; i++) {
        matrix[i].reverse();
    }
};`,
    testcases: [{ input: 'matrix = [[1,2,3],[4,5,6],[7,8,9]]', expected: '[[7,4,1],[8,5,2],[9,6,3]]' }]
  });
  console.log('JS rotate:', js.status, js.cases[0]?.output);
}

testRotate().catch(console.error);
