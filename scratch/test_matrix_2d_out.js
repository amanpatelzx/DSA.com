import { connectDB } from '../apps/api/src/config/db.js';
import { judgeRun } from '../apps/api/src/services/judgeService.js';
import mongoose from 'mongoose';

async function testMore() {
  await connectDB();

  // Test search-a-2d-matrix (matrix + int -> bool)
  console.log('Testing search-a-2d-matrix (C++)...');
  const r1 = await judgeRun({
    language: 'cpp',
    slug: 'search-a-2d-matrix',
    code: `class Solution {
public:
    bool searchMatrix(vector<vector<int>>& matrix, int target) {
        int m = matrix.size(), n = matrix[0].size();
        int l = 0, r = m * n - 1;
        while (l <= r) {
            int mid = l + (r - l) / 2;
            int val = matrix[mid / n][mid % n];
            if (val == target) return true;
            if (val < target) l = mid + 1;
            else r = mid - 1;
        }
        return false;
    }
};`,
    testcases: [
      { input: 'matrix = [[1,3,5,7],[10,11,16,20],[23,30,34,60]], target = 3', expected: 'true' },
      { input: 'matrix = [[1,3,5,7],[10,11,16,20],[23,30,34,60]], target = 13', expected: 'false' }
    ]
  });
  console.log(`search-a-2d-matrix (C++): ${r1.status} (${r1.cases.filter(c => c.passed).length}/${r1.cases.length})`);

  // Test merge-intervals (2d array in, 2d array out) in C++, Python, JS
  console.log('\nTesting merge-intervals (2D in -> 2D out)...');
  const cppMerge = await judgeRun({
    language: 'cpp',
    slug: 'merge-intervals',
    code: `class Solution {
public:
    vector<vector<int>> merge(vector<vector<int>>& intervals) {
        if (intervals.empty()) return {};
        sort(intervals.begin(), intervals.end());
        vector<vector<int>> res;
        res.push_back(intervals[0]);
        for (int i = 1; i < intervals.size(); i++) {
            if (intervals[i][0] <= res.back()[1]) {
                res.back()[1] = max(res.back()[1], intervals[i][1]);
            } else {
                res.push_back(intervals[i]);
            }
        }
        return res;
    }
};`,
    testcases: [
      { input: 'intervals = [[1,3],[2,6],[8,10],[15,18]]', expected: '[[1,6],[8,10],[15,18]]' },
      { input: 'intervals = [[1,4],[4,5]]', expected: '[[1,5]]' }
    ]
  });
  console.log(`merge-intervals (C++): ${cppMerge.status} (${cppMerge.cases.filter(c => c.passed).length}/${cppMerge.cases.length})`);

  const pyMerge = await judgeRun({
    language: 'python',
    slug: 'merge-intervals',
    code: `class Solution:
    def merge(self, intervals: list[list[int]]) -> list[list[int]]:
        intervals.sort(key=lambda x: x[0])
        res = []
        for interval in intervals:
            if not res or res[-1][1] < interval[0]:
                res.append(interval)
            else:
                res[-1][1] = max(res[-1][1], interval[1])
        return res
`,
    testcases: [
      { input: 'intervals = [[1,3],[2,6],[8,10],[15,18]]', expected: '[[1,6],[8,10],[15,18]]' },
      { input: 'intervals = [[1,4],[4,5]]', expected: '[[1,5]]' }
    ]
  });
  console.log(`merge-intervals (Python): ${pyMerge.status} (${pyMerge.cases.filter(c => c.passed).length}/${pyMerge.cases.length})`);

  const jsMerge = await judgeRun({
    language: 'javascript',
    slug: 'merge-intervals',
    code: `var merge = function(intervals) {
    intervals.sort((a, b) => a[0] - b[0]);
    const res = [];
    for (const [start, end] of intervals) {
        if (!res.length || res[res.length - 1][1] < start) {
            res.push([start, end]);
        } else {
            res[res.length - 1][1] = Math.max(res[res.length - 1][1], end);
        }
    }
    return res;
};`,
    testcases: [
      { input: 'intervals = [[1,3],[2,6],[8,10],[15,18]]', expected: '[[1,6],[8,10],[15,18]]' },
      { input: 'intervals = [[1,4],[4,5]]', expected: '[[1,5]]' }
    ]
  });
  console.log(`merge-intervals (JS): ${jsMerge.status} (${jsMerge.cases.filter(c => c.passed).length}/${jsMerge.cases.length})`);

  await mongoose.disconnect();
}

testMore().catch(err => {
  console.error(err);
  process.exit(1);
});
