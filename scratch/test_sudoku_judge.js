import { judgeRun } from '../apps/api/src/services/judgeService.js';

async function test() {
  const code = `
class Solution {
public:
    bool isValidSudoku(vector<vector<char>>& board) {
        int rows[9] = {0}, cols[9] = {0}, boxes[9] = {0};
        for (int r = 0; r < 9; r++) {
            for (int c = 0; c < 9; c++) {
                if (board[r][c] == '.') continue;
                int val = board[r][c] - '1';
                int bit = 1 << val;
                int b = (r / 3) * 3 + (c / 3);
                if ((rows[r] & bit) || (cols[c] & bit) || (boxes[b] & bit)) return false;
                rows[r] |= bit;
                cols[c] |= bit;
                boxes[b] |= bit;
            }
        }
        return true;
    }
};
`;
  const result = await judgeRun({
    language: 'cpp',
    slug: 'valid-sudoku',
    code,
    testcases: [{
      input: 'board = [["5","3",".",".","7",".",".",".","."],["6",".",".","1","9","5",".",".","."],補助[".","9","8",".",".",".",".","6","."],["8",".",".",".","6",".",".",".","3"],["4",".",".","8",".","3",".",".","1"],["7",".",".",".","2",".",".",".","6"],補助[".","6",".",".",".",".","2","8","."],補助[".",".",".","4","1","9",".",".","5"],補助[".",".",".",".","8",".",".","7","9"]]',
      expected: 'true'
    }].map(tc => ({ ...tc, input: tc.input.replace(/補助/g, '') }))
  });
  console.log('Sudoku Result:', result.status, result.cases.map(c => ({ passed: c.passed, out: c.output })));
}

test();
