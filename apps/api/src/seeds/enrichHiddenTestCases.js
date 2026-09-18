import mongoose from 'mongoose';
import Problem from '../models/Problem.js';
import { connectDB } from '../config/db.js';

// Dedicated hidden test cases for single-example problems
export const SINGLE_EX_HIDDEN_TESTCASES = {
  '3sum-closest': [{ input: 'nums = [0,0,0], target = 1', output: '0' }],
  '4sum': [{ input: 'nums = [2,2,2,2,2], target = 8', output: '[[2,2,2,2]]' }],
  'merge-k-sorted-lists': [{ input: 'lists = []', output: '[]' }],
  'remove-duplicates-from-sorted-array': [{ input: 'nums = [0,0,1,1,1,2,2,3,3,4]', output: '5' }],
  'remove-element': [{ input: 'nums = [0,1,2,2,3,0,4,2], val = 2', output: '5' }],
  'substring-with-concatenation-of-all-words': [{ input: 's = "wordgoodgoodgoodbestword", words = ["word","good","best","word"]', output: '[]' }],
  'valid-sudoku': [{ input: 'board = [["8","3",".",".","7",".",".",".","."],["6",".",".","1","9","5",".",".","."],[".","9","8",".",".",".",".","6","."],["8",".",".",".","6",".",".",".","3"],["4",".",".","8",".","3",".",".","1"],["7",".",".",".","2",".",".",".","6"],[".","6",".",".",".",".","2","8","."],[".",".",".","4","1","9",".",".","5"],[".",".",".",".","8",".",".","7","9"]]', output: 'false' }],
  'sudoku-solver': [{ input: 'board = [[".",".",".",".",".",".",".",".","."],[".",".",".",".",".",".",".",".","."],[".",".",".",".",".",".",".",".","."],[".",".",".",".",".",".",".",".","."],[".",".",".",".",".",".",".",".","."],[".",".",".",".",".",".",".",".","."],[".",".",".",".",".",".",".",".","."],[".",".",".",".",".",".",".",".","."],[".",".",".",".",".",".",".",".","."]]', output: '[["1","2","3","4","5","6","7","8","9"],["4","5","6","7","8","9","1","2","3"],["7","8","9","1","2","3","4","5","6"],["2","1","4","3","6","5","8","9","7"],["3","6","5","8","9","7","2","1","4"],["8","9","7","2","1","4","3","6","5"],["5","3","1","6","4","2","9","7","8"],["6","4","2","9","7","8","5","3","1"],["9","7","8","5","3","1","6","4","2"]]' }],
  'combination-sum': [{ input: 'candidates = [2,3,5], target = 8', output: '[[2,2,2,2],[2,3,3],[3,5]]' }],
  'combination-sum-ii': [{ input: 'candidates = [2,5,2,1,2], target = 5', output: '[[1,2,2],[5]]' }],
  'jump-game-ii': [{ input: 'nums = [2,3,0,1,4]', output: '2' }],
  'permutations': [{ input: 'nums = [0,1]', output: '[[0,1],[1,0]]' }],
  'permutations-ii': [{ input: 'nums = [1,2,3]', output: '[[1,2,3],[1,3,2],[2,1,3],[2,3,1],[3,1,2],[3,2,1]]' }],
  'rotate-image': [{ input: 'matrix = [[1,2],[3,4]]', output: '[[3,1],[4,2]]' }],
  'group-anagrams': [{ input: 'strs = ["a"]', output: '[["a"]]' }],
  'n-queens': [{ input: 'n = 1', output: '[["Q"]]' }],
  'maximum-subarray': [{ input: 'nums = [1]', output: '1' }],
  'spiral-matrix': [{ input: 'matrix = [[1,2,3,4],[5,6,7,8],[9,10,11,12]]', output: '[1,2,3,4,8,12,11,10,9,5,6,7]' }],
  'merge-intervals': [{ input: 'intervals = [[1,4],[4,5]]', output: '[[1,5]]' }],
  'insert-interval': [{ input: 'intervals = [[1,5]], newInterval = [2,3]', output: '[[1,5]]' }],
  'spiral-matrix-ii': [{ input: 'n = 1', output: '[[1]]' }],
  'rotate-list': [{ input: 'head = [0,1,2], k = 4', output: '[2,0,1]' }],
  'unique-paths-ii': [{ input: 'obstacleGrid = [[0,1],[0,0]]', output: '1' }],
  'minimum-path-sum': [{ input: 'grid = [[1,2,3],[4,5,6]]', output: '12' }],
  'text-justification': [{ input: 'words = ["What","must","be","acknowledgment","shall","be"], maxWidth = 16', output: '["What   must   be","acknowledgment  ","shall be        "]' }],
  'set-matrix-zeroes': [{ input: 'matrix = [[0,1,2,0],[3,4,5,2],[1,3,1,5]]', output: '[[0,0,0,0],[0,4,5,0],[0,3,1,0]]' }],
  'combinations': [{ input: 'n = 1, k = 1', output: '[[1]]' }],
  'subsets': [{ input: 'nums = [0]', output: '[[],[0]]' }],
  'word-search': [{ input: 'board = [["A","B","C","E"],["S","F","C","S"],["A","D","E","E"]], word = "ABCB"', output: 'false' }],
  'remove-duplicates-from-sorted-array-ii': [{ input: 'nums = [0,0,1,1,1,1,2,3,3]', output: '7' }],
  'remove-duplicates-from-sorted-list-ii': [{ input: 'head = [1,1,1,2,3]', output: '[2,3]' }],
  'largest-rectangle-in-histogram': [{ input: 'heights = [2,4]', output: '4' }],
  'maximal-rectangle': [{ input: 'matrix = [["0"]]', output: '0' }],
  'partition-list': [{ input: 'head = [2,1], x = 2', output: '[1,2]' }],
  'merge-sorted-array': [{ input: 'nums1 = [1], m = 1, nums2 = [], n = 0', output: '[1]' }],
  'gray-code': [{ input: 'n = 1', output: '[0,1]' }],
  'subsets-ii': [{ input: 'nums = [0]', output: '[[],[0]]' }],
  'reverse-linked-list-ii': [{ input: 'head = [5], left = 1, right = 1', output: '[5]' }],
  'restore-ip-addresses': [{ input: 's = "0000"', output: '["0.0.0.0"]' }],
  'binary-tree-level-order-traversal': [{ input: 'root = [1]', output: '[[1]]' }],
  'binary-tree-zigzag-level-order-traversal': [{ input: 'root = [1]', output: '[[1]]' }],
  'construct-binary-tree-from-preorder-and-inorder-traversal': [{ input: 'preorder = [-1], inorder = [-1]', output: '[-1]' }],
  'convert-sorted-array-to-binary-search-tree': [{ input: 'nums = [1,3]', output: '[3,1]' }],
  'path-sum': [{ input: 'root = [1,2,3], targetSum = 5', output: 'false' }],
  'path-sum-ii': [{ input: 'root = [1,2], targetSum = 0', output: '[]' }],
  'flatten-binary-tree-to-linked-list': [{ input: 'root = []', output: '[]' }],
  'pascals-triangle': [{ input: 'numRows = 1', output: '[[1]]' }],
  'triangle': [{ input: 'triangle = [[-10]]', output: '-10' }],
  'best-time-to-buy-and-sell-stock': [{ input: 'prices = [7,6,4,3,1]', output: '0' }],
  'best-time-to-buy-and-sell-stock-ii': [{ input: 'prices = [1,2,3,4,5]', output: '4' }],
  'best-time-to-buy-and-sell-stock-iii': [{ input: 'prices = [7,6,4,3,1]', output: '0' }],
  'word-ladder': [{ input: 'beginWord = "hit", endWord = "cog", wordList = ["hot","dot","dog","lot","log"]', output: '0' }],
  'longest-consecutive-sequence': [{ input: 'nums = [0,3,7,2,5,8,4,6,0,1]', output: '9' }],
  'sum-root-to-leaf-numbers': [{ input: 'root = [4,9,0,5,1]', output: '1026' }],
  'surrounded-regions': [{ input: 'board = [["X"]]', output: '[["X"]]' }],
  'palindrome-partitioning': [{ input: 's = "a"', output: '[["a"]]' }],
  'clone-graph': [{ input: 'adjList = [[]]', output: '[[]]' }],
  'gas-station': [{ input: 'gas = [2,3,4], cost = [3,4,3]', output: '-1' }],
  'candy': [{ input: 'ratings = [1,2,2]', output: '4' }],
  'copy-list-with-random-pointer': [{ input: 'head = []', output: '[]' }],
  'linked-list-cycle-ii': [{ input: 'head = [1], pos = -1', output: 'no cycle' }],
  'lru-cache': [{ input: '["LRUCache","put","get"], [[1],[2,1],[2]]', output: '[null,null,1]' }],
  'min-stack': [{ input: '["MinStack","push","push","top","getMin"], [[],[1],[2],[],[]]', output: '[null,null,null,2,1]' }],
  'intersection-of-two-linked-lists': [{ input: 'intersectVal = 0, listA = [2,6,4], listB = [1,5]', output: 'No intersection' }],
  'find-peak-element': [{ input: 'nums = [1,2,1,3,5,6,4]', output: '5' }],
  'two-sum-ii-input-array-is-sorted': [{ input: 'numbers = [2,3,4], target = 6', output: '[1,3]' }],
  'binary-search-tree-iterator': [{ input: '["BSTIterator","next","hasNext"], [[[1]],[],[]]', output: '[null,1,false]' }],
  'dungeon-game': [{ input: 'dungeon = [[0]]', output: '1' }],
  'repeated-dna-sequences': [{ input: 's = "AAAAAAAAAAAAA"', output: '["AAAAAAAAAA"]' }],
  'rotate-array': [{ input: 'nums = [-1,-100,3,99], k = 2', output: '[3,99,-1,-100]' }],
  'reverse-bits': [{ input: 'n = 11111111111111111111111111111101', output: '3221225471' }],
  'binary-tree-right-side-view': [{ input: 'root = [1,null,3]', output: '[1,3]' }],
  'implement-trie-prefix-tree': [{ input: '["Trie","insert","search","startsWith"], [[],["hello"],["hello"],["hell"]]', output: '[null,null,true,true]' }],
  'minimum-size-subarray-sum': [{ input: 'target = 4, nums = [1,4,4]', output: '1' }],
  'maximal-square': [{ input: 'matrix = [["0","1"],["1","0"]]', output: '1' }],
  'implement-queue-using-stacks': [{ input: '["MyQueue","push","pop","empty"], [[],[1],[],[]]', output: '[null,null,1,true]' }],
  'lowest-common-ancestor-of-a-binary-search-tree': [{ input: 'root = [2,1], p = 2, q = 1', output: '2' }],
  'lowest-common-ancestor-of-a-binary-tree': [{ input: 'root = [1,2], p = 1, q = 2', output: '1' }],
  'delete-node-in-a-linked-list': [{ input: 'head = [4,5,1,9], node = 1', output: '[4,5,9]' }],
  'sliding-window-maximum': [{ input: 'nums = [1], k = 1', output: '[1]' }],
  'search-a-2d-matrix-ii': [{ input: 'matrix = [[1,4,7,11,15],[2,5,8,12,19],[3,6,9,16,22],[10,13,14,17,24],[18,21,23,26,30]], target = 20', output: 'false' }],
  'binary-tree-paths': [{ input: 'root = [1]', output: '["1"]' }],
  'single-number-iii': [{ input: 'nums = [-1,0]', output: '[-1,0]' }],
  'ugly-number-ii': [{ input: 'n = 1', output: '1' }],
  'h-index': [{ input: 'citations = [1,3,1]', output: '1' }],
  'h-index-ii': [{ input: 'citations = [1,2,100]', output: '2' }],
  'first-bad-version': [{ input: 'n = 1, bad = 1', output: '1' }],
  'game-of-life': [{ input: 'board = [[1,1],[1,0]]', output: '[[1,1],[1,1]]' }],
  'find-median-from-data-stream': [{ input: '["MedianFinder","addNum","findMedian"], [[],[5],[]]', output: '[null,null,5.0]' }],
  'serialize-and-deserialize-binary-tree': [{ input: 'root = []', output: '[]' }],
  'word-ladder-ii': [{ input: 'beginWord = "hit", endWord = "cog", wordList = ["hot","dot","dog","lot","log"]', output: '[]' }],
  'design-add-and-search-words-data-structure': [{ input: 'WordDictionary(); addWord("a"); search("a"); search(".");', output: '[null, null, true, true]' }],
  'word-search-ii': [{ input: 'board = [["a","b"],["c","d"]], words = ["abcb"]', output: '[]' }],
  'the-skyline-problem': [{ input: 'buildings = [[0,2,3],[2,5,3]]', output: '[[0,3],[5,0]]' }],
  'implement-stack-using-queues': [{ input: 'MyStack(); push(5); top(); pop(); empty();', output: '[null, null, 5, 5, true]' }],
  'peeking-iterator': [{ input: 'PeekingIterator([5]); peek(); next(); hasNext();', output: '[null, 5, 5, false]' }],
  'range-sum-query-immutable': [{ input: 'NumArray([1, 2, 3, 4]); sumRange(1, 2);', output: '[null, 5]' }],
  'sort-array-by-parity-ii': [{ input: 'nums = [2,3]', output: '[2,3]' }],
  'relative-sort-array': [{ input: 'arr1 = [28,6,22,8,44,17], arr2 = [22,28,8,6]', output: '[22,28,8,6,17,44]' }],
  'count-items-matching-a-rule': [{ input: 'items = [["phone","blue","pixel"],["computer","silver","phone"],["phone","gold","iphone"]], ruleKey = "type", ruleValue = "phone"', output: '2' }],
  'goat-latin': [{ input: 'sentence = "The quick brown fox jumped over the lazy dog"', output: '"heTmaa uickqmaaa rownbmaaaa oxfmaaaaa umpedjmaaaaaa overmaaaaaaa hetmaaaaaaaa azylmaaaaaaaaa ogdmaaaaaaaaaa"' }],
  'unique-email-addresses': [{ input: 'emails = ["a@leetcode.com","b@leetcode.com","c@leetcode.com"]', output: '3' }],
  'kth-largest-element-in-a-stream': [{ input: 'KthLargest(1, []); add(-3); add(-2); add(-4); add(0); add(4);', output: '[null, -3, -2, -2, 0, 4]' }],
  'leaf-similar-trees': [{ input: 'root1 = [1,2,3], root2 = [1,3,2]', output: 'false' }]
};

export async function enrichAllHiddenTestCases() {
  await connectDB();

  const problems = await Problem.find().select('+hiddenTestCases');
  console.log(`Found ${problems.length} problems in database.`);

  let updatedCount = 0;
  let multiExCount = 0;
  let singleExCount = 0;

  for (const prob of problems) {
    let newHidden = [];

    if (prob.examples && prob.examples.length >= 2) {
      // Use secondary examples as hidden test cases
      newHidden = prob.examples.slice(1).map(ex => ({
        input: ex.input,
        output: ex.output !== undefined && ex.output !== null ? String(ex.output) : '',
        explanation: ex.explanation || ''
      }));
      multiExCount++;
    } else if (SINGLE_EX_HIDDEN_TESTCASES[prob.slug]) {
      newHidden = SINGLE_EX_HIDDEN_TESTCASES[prob.slug];
      singleExCount++;
    } else if (prob.examples && prob.examples.length === 1) {
      newHidden = [{
        input: prob.examples[0].input,
        output: prob.examples[0].output !== undefined ? String(prob.examples[0].output) : '',
        explanation: prob.examples[0].explanation || ''
      }];
      singleExCount++;
    }

    newHidden = newHidden.filter(h => !(h && h.input && h.input.includes('3,2,4') && h.input.includes('target = 6')));
    prob.hiddenTestCases = newHidden;
    prob.markModified('hiddenTestCases');
    await prob.save();
    updatedCount++;
  }

  console.log(`Successfully enriched ${updatedCount} problems!`);
  console.log(`- Multi-example derived: ${multiExCount}`);
  console.log(`- Single-example mapped: ${singleExCount}`);

  // Verification check: confirm how many have hiddenTestCases and whether Two Sum is on non-Two-Sum problems
  const recheck = await Problem.find().select('+hiddenTestCases');
  const withHidden = recheck.filter(p => p.hiddenTestCases && p.hiddenTestCases.length > 0);
  const twoSumAnomaly = recheck.filter(p => 
    p.slug !== 'two-sum' && 
    p.hiddenTestCases && 
    p.hiddenTestCases.some(h => h.input && h.input.includes('target = 6') && h.input.includes('[3,2,4]'))
  );

  console.log(`Verification:`);
  console.log(`- Problems with hidden test cases: ${withHidden.length} / ${recheck.length}`);
  console.log(`- Problems incorrectly containing Two Sum test case: ${twoSumAnomaly.length}`);
}

// Run if called directly
enrichAllHiddenTestCases().then(() => {
  console.log('Enrichment completed.');
  process.exit(0);
}).catch(err => {
  console.error('Enrichment error:', err);
  process.exit(1);
});
