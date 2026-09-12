// Additional free canonical DSA problems from LeetCode 1-300
// Reworded, copyright-safe titles, descriptions, and examples preserving exact algorithmic signatures and tags.

export const ADDITIONAL_PROBLEMS = [
  {
    title: "Scrambled String Verification",
    slug: "scramble-string",
    difficulty: "Hard",
    points: 10,
    tags: ["String", "Dynamic Programming", "LC-87"],
    description: "Given two strings s1 and s2 of equal length, determine if s2 is a scrambled representation of s1 formed by recursively partitioning and optionally swapping substrings.",
    constraints: ["s1.length == s2.length", "1 <= s1.length <= 30", "s1 and s2 consist of lowercase English letters."],
    examples: [
      { input: 's1 = "great", s2 = "rgeat"', output: "true", explanation: 'Partitioning "great" -> "gr"/"eat", swapping "gr" -> "rg" yields "rgeat".' },
      { input: 's1 = "abcde", s2 = "caebd"', output: "false" },
      { input: 's1 = "a", s2 = "a"', output: "true" }
    ]
  },
  {
    title: "Generate All Unique BSTs",
    slug: "unique-binary-search-trees-ii",
    difficulty: "Medium",
    points: 5,
    tags: ["Dynamic Programming", "Backtracking", "Tree", "Binary Search Tree", "LC-95"],
    description: "Given an integer n, generate all structurally unique Binary Search Trees (BSTs) consisting of exactly n nodes with values from 1 to n. Return the roots of all distinct trees.",
    constraints: ["1 <= n <= 8"],
    examples: [
      { input: "n = 3", output: "[[1,null,2,null,3],[1,null,3,2],[2,1,3],[3,1,null,null,2],[3,2,null,1]]" },
      { input: "n = 1", output: "[[1]]" }
    ]
  },
  {
    title: "Interleaving String Validation",
    slug: "interleaving-string",
    difficulty: "Medium",
    points: 5,
    tags: ["String", "Dynamic Programming", "LC-97"],
    description: "Given strings s1, s2, and s3, verify if s3 is formed by an interleaving sequence of s1 and s2 where the relative order of characters from both strings is preserved.",
    constraints: ["0 <= s1.length, s2.length <= 100", "0 <= s3.length <= 200", "All strings consist of lowercase letters."],
    examples: [
      { input: 's1 = "aabcc", s2 = "dbbca", s3 = "aadbbcbcac"', output: "true" },
      { input: 's1 = "aabcc", s2 = "dbbca", s3 = "aadbbbaccc"', output: "false" }
    ]
  },
  {
    title: "Fix Swapped Nodes in BST",
    slug: "recover-binary-search-tree",
    difficulty: "Medium",
    points: 5,
    tags: ["Tree", "Depth-First Search", "Binary Search Tree", "LC-99"],
    description: "You are given the root of a binary search tree (BST), where values of exactly two nodes were inadvertently swapped. Recover the tree structure without altering the nodes' positions.",
    constraints: ["The number of nodes is in range [2, 1000]", "-2^31 <= Node.val <= 2^31 - 1"],
    followUp: "Can you solve it in O(1) extra space using Morris Traversal?",
    examples: [
      { input: "root = [1,3,null,null,2]", output: "[3,1,null,null,2]" },
      { input: "root = [3,1,4,null,null,2]", output: "[2,1,4,null,null,3]" }
    ]
  },
  {
    title: "Build Binary Tree from Inorder and Postorder",
    slug: "construct-binary-tree-from-inorder-and-postorder-traversal",
    difficulty: "Medium",
    points: 5,
    tags: ["Array", "Hash Table", "Divide and Conquer", "Tree", "Binary Tree", "LC-106"],
    description: "Given two integer arrays inorder and postorder where inorder is the inorder traversal of a binary tree and postorder is the postorder traversal of the same tree, construct and return the binary tree.",
    constraints: ["1 <= inorder.length <= 3000", "postorder.length == inorder.length", "All values are unique."],
    examples: [
      { input: "inorder = [9,3,15,20,7], postorder = [9,15,7,20,3]", output: "[3,9,20,null,null,15,7]" },
      { input: "inorder = [-1], postorder = [-1]", output: "[-1]" }
    ]
  },
  {
    title: "Bottom-Up Level Order Traversal",
    slug: "binary-tree-level-order-traversal-ii",
    difficulty: "Medium",
    points: 5,
    tags: ["Tree", "Breadth-First Search", "Binary Tree", "LC-107"],
    description: "Given the root of a binary tree, return the bottom-up level order traversal of its nodes' values (i.e., from left to right, level by level from leaf level up to the root).",
    constraints: ["The number of nodes is in range [0, 2000]", "-1000 <= Node.val <= 1000"],
    examples: [
      { input: "root = [3,9,20,null,null,15,7]", output: "[[15,7],[9,20],[3]]" },
      { input: "root = [1]", output: "[[1]]" }
    ]
  },
  {
    title: "Convert Sorted Linked List to Balanced BST",
    slug: "convert-sorted-list-to-binary-search-tree",
    difficulty: "Medium",
    points: 5,
    tags: ["Linked List", "Divide and Conquer", "Tree", "Binary Search Tree", "LC-109"],
    description: "Given the head of a singly linked list where elements are sorted in ascending order, convert it into a height-balanced binary search tree.",
    constraints: ["The number of nodes in head is in [0, 2 * 10^4]", "-10^5 <= Node.val <= 10^5"],
    examples: [
      { input: "head = [-10,-3,0,5,9]", output: "[0,-3,9,-10,null,5]" },
      { input: "head = []", output: "[]" }
    ]
  },
  {
    title: "Minimum Depth to Leaf",
    slug: "minimum-depth-of-binary-tree",
    difficulty: "Easy",
    points: 3,
    tags: ["Tree", "Depth-First Search", "Breadth-First Search", "Binary Tree", "LC-111"],
    description: "Given a binary tree, find its minimum depth. The minimum depth is the number of nodes along the shortest path from the root node down to the nearest leaf node.",
    constraints: ["The number of nodes is in range [0, 10^5]", "-1000 <= Node.val <= 1000"],
    examples: [
      { input: "root = [3,9,20,null,null,15,7]", output: "2" },
      { input: "root = [2,null,3,null,4,null,5,null,6]", output: "5" }
    ]
  },
  {
    title: "Count Distinct Subsequence Occurrences",
    slug: "distinct-subsequences",
    difficulty: "Hard",
    points: 10,
    tags: ["String", "Dynamic Programming", "LC-115"],
    description: "Given two strings s and t, return the number of distinct subsequences of s which equals t. The answer is guaranteed to fit in a 32-bit signed integer.",
    constraints: ["1 <= s.length, t.length <= 1000", "s and t consist of English letters."],
    examples: [
      { input: 's = "rabbbit", t = "rabbit"', output: "3" },
      { input: 's = "babgbag", t = "bag"', output: "5" }
    ]
  },
  {
    title: "Connect Next Right Pointers in Perfect Binary Tree",
    slug: "populating-next-right-pointers-in-each-node",
    difficulty: "Medium",
    points: 5,
    tags: ["Tree", "Depth-First Search", "Breadth-First Search", "Binary Tree", "LC-116"],
    description: "You are given a perfect binary tree where all leaves are on the same level, and every parent has two children. Populate each next pointer to point to its next right node. If there is no next right node, set next to NULL.",
    constraints: ["The number of nodes is in range [0, 2^12 - 1]", "-1000 <= Node.val <= 1000"],
    followUp: "Can you achieve this using only constant extra memory O(1)?",
    examples: [
      { input: "root = [1,2,3,4,5,6,7]", output: "[1,#,2,3,#,4,5,6,7,#]" },
      { input: "root = []", output: "[]" }
    ]
  },
  {
    title: "Connect Next Right Pointers in Any Binary Tree",
    slug: "populating-next-right-pointers-in-each-node-ii",
    difficulty: "Medium",
    points: 5,
    tags: ["Tree", "Depth-First Search", "Breadth-First Search", "Binary Tree", "LC-117"],
    description: "Populate each next pointer to point to its next right node in any arbitrary binary tree. If there is no next right node, set next to NULL. Initial next pointers point to NULL.",
    constraints: ["The number of nodes is in range [0, 6000]", "-100 <= Node.val <= 100"],
    followUp: "Use only constant O(1) additional memory.",
    examples: [
      { input: "root = [1,2,3,4,5,null,7]", output: "[1,#,2,3,#,4,5,7,#]" },
      { input: "root = []", output: "[]" }
    ]
  },
  {
    title: "Pascal's Triangle Row Generator",
    slug: "pascals-triangle-ii",
    difficulty: "Easy",
    points: 3,
    tags: ["Array", "Dynamic Programming", "LC-119"],
    description: "Given an integer rowIndex, return the rowIndex-th (0-indexed) row of Pascal's triangle.",
    constraints: ["0 <= rowIndex <= 33"],
    followUp: "Can you optimize your algorithm to use only O(rowIndex) extra space?",
    examples: [
      { input: "rowIndex = 3", output: "[1,3,3,1]" },
      { input: "rowIndex = 0", output: "[1]" },
      { input: "rowIndex = 1", output: "[1,1]" }
    ]
  },
  {
    title: "Shortest Transformation Sequences (Word Ladder II)",
    slug: "word-ladder-ii",
    difficulty: "Hard",
    points: 10,
    tags: ["Hash Table", "String", "Backtracking", "Breadth-First Search", "LC-126"],
    description: "Given two words (beginWord and endWord), and a dictionary's word list, find all shortest transformation sequences from beginWord to endWord such that only one letter is changed at each step and each word is present in wordList.",
    constraints: ["1 <= beginWord.length <= 5", "1 <= wordList.length <= 500", "All words have the same length."],
    examples: [
      { input: 'beginWord = "hit", endWord = "cog", wordList = ["hot","dot","dog","lot","log","cog"]', output: '[["hit","hot","dot","dog","cog"],["hit","hot","lot","log","cog"]]' }
    ]
  },
  {
    title: "Minimum Palindrome Cuts",
    slug: "palindrome-partitioning-ii",
    difficulty: "Hard",
    points: 10,
    tags: ["String", "Dynamic Programming", "LC-132"],
    description: "Given a string s, partition s such that every substring of the partition is a palindrome. Return the minimum cuts needed for a palindrome partitioning of s.",
    constraints: ["1 <= s.length <= 2000", "s contains only lowercase English letters."],
    examples: [
      { input: 's = "aab"', output: "1", explanation: 'Cut once between "aa" and "b".' },
      { input: 's = "a"', output: "0" },
      { input: 's = "ab"', output: "1" }
    ]
  },
  {
    title: "Word Break Sentence Assembler",
    slug: "word-break-ii",
    difficulty: "Hard",
    points: 10,
    tags: ["Hash Table", "String", "Dynamic Programming", "Backtracking", "Trie", "Memoization", "LC-140"],
    description: "Given a string s and a dictionary of strings wordDict, add spaces in s to construct a sentence where each word is a valid dictionary word. Return all such possible sentences in any order.",
    constraints: ["1 <= s.length <= 20", "1 <= wordDict.length <= 1000", "1 <= wordDict[i].length <= 10"],
    examples: [
      { input: 's = "catsanddog", wordDict = ["cat","cats","and","sand","dog"]', output: '["cats and dog","cat sand dog"]' },
      { input: 's = "pineapplepenapple", wordDict = ["apple","pen","applepen","pine","pineapple"]', output: '["pine apple pen apple","pineapple pen apple","pine applepen apple"]' }
    ]
  },
  {
    title: "Binary Tree Preorder Traversal",
    slug: "binary-tree-preorder-traversal",
    difficulty: "Easy",
    points: 3,
    tags: ["Stack", "Tree", "Depth-First Search", "Binary Tree", "LC-144"],
    description: "Given the root of a binary tree, return the preorder traversal (Root -> Left -> Right) of its nodes' values.",
    constraints: ["The number of nodes is in range [0, 100]", "-100 <= Node.val <= 100"],
    followUp: "Recursive solution is trivial, can you do it iteratively?",
    examples: [
      { input: "root = [1,null,2,3]", output: "[1,2,3]" },
      { input: "root = []", output: "[]" },
      { input: "root = [1]", output: "[1]" }
    ]
  },
  {
    title: "Binary Tree Postorder Traversal",
    slug: "binary-tree-postorder-traversal",
    difficulty: "Easy",
    points: 3,
    tags: ["Stack", "Tree", "Depth-First Search", "Binary Tree", "LC-145"],
    description: "Given the root of a binary tree, return the postorder traversal (Left -> Right -> Root) of its nodes' values.",
    constraints: ["The number of nodes is in range [0, 100]", "-100 <= Node.val <= 100"],
    followUp: "Can you implement the iterative version?",
    examples: [
      { input: "root = [1,null,2,3]", output: "[3,2,1]" },
      { input: "root = []", output: "[]" },
      { input: "root = [1]", output: "[1]" }
    ]
  },
  {
    title: "Insertion Sort on Linked List",
    slug: "insertion-sort-list",
    difficulty: "Medium",
    points: 5,
    tags: ["Linked List", "Sorting", "LC-147"],
    description: "Given the head of a singly linked list, sort the list using insertion sort, and return the sorted list's head node.",
    constraints: ["The number of nodes in the list is in range [1, 5000]", "-5000 <= Node.val <= 5000"],
    examples: [
      { input: "head = [4,2,1,3]", output: "[1,2,3,4]" },
      { input: "head = [-1,5,3,4,0]", output: "[-1,0,3,4,5]" }
    ]
  },
  {
    title: "Maximum Collinear Points",
    slug: "max-points-on-a-line",
    difficulty: "Hard",
    points: 10,
    tags: ["Array", "Hash Table", "Math", "Geometry", "LC-149"],
    description: "Given an array of points where points[i] = [xi, yi] represents a point on the X-Y plane, return the maximum number of points that lie on the same straight line.",
    constraints: ["1 <= points.length <= 300", "points[i].length == 2", "-10^4 <= xi, yi <= 10^4", "All points are unique."],
    examples: [
      { input: "points = [[1,1],[2,2],[3,3]]", output: "3" },
      { input: "points = [[1,1],[3,2],[5,3],[4,1],[2,3],[1,4]]", output: "4" }
    ]
  },
  {
    title: "Find Minimum in Rotated Array with Duplicates",
    slug: "find-minimum-in-rotated-sorted-array-ii",
    difficulty: "Hard",
    points: 10,
    tags: ["Array", "Binary Search", "LC-154"],
    description: "Suppose an array sorted in ascending order is rotated at some pivot unknown to you beforehand, and may contain duplicate values. Find the minimum element.",
    constraints: ["n == nums.length", "1 <= n <= 5000", "-5000 <= nums[i] <= 5000"],
    examples: [
      { input: "nums = [1,3,5]", output: "1" },
      { input: "nums = [2,2,2,0,1]", output: "0" }
    ]
  },
  {
    title: "Maximum Successive Gap in Linear Time",
    slug: "maximum-gap",
    difficulty: "Medium",
    points: 5,
    tags: ["Array", "Sorting", "Bucket Sort", "Radix Sort", "LC-164"],
    description: "Given an integer array nums, return the maximum difference between two successive elements in its sorted form. If the array contains less than two elements, return 0. You must write an algorithm that runs in linear time and uses linear extra space.",
    constraints: ["1 <= nums.length <= 10^5", "0 <= nums[i] <= 10^9"],
    examples: [
      { input: "nums = [3,6,9,1]", output: "3", explanation: "Sorted: [1,3,6,9], max diff is 3 between adjacent pairs." },
      { input: "nums = [10]", output: "0" }
    ]
  },
  {
    title: "Fraction to Recurring Decimal String",
    slug: "fraction-to-recurring-decimal",
    difficulty: "Medium",
    points: 5,
    tags: ["Hash Table", "Math", "String", "LC-166"],
    description: "Given two integers representing the numerator and denominator of a fraction, return the fraction in string format. If the fractional part is repeating, enclose the repeating digits in parentheses.",
    constraints: ["-2^31 <= numerator, denominator <= 2^31 - 1", "denominator != 0"],
    examples: [
      { input: "numerator = 1, denominator = 2", output: '"0.5"' },
      { input: "numerator = 2, denominator = 1", output: '"2"' },
      { input: "numerator = 4, denominator = 333", output: '"0.(012)"' }
    ]
  },
  {
    title: "Convert Number to Spreadsheet Column Title",
    slug: "excel-sheet-column-title",
    difficulty: "Easy",
    points: 3,
    tags: ["Math", "String", "LC-168"],
    description: "Given an integer columnNumber, return its corresponding column title as it appears in an Excel spreadsheet (1 -> A, 2 -> B, ..., 26 -> Z, 27 -> AA, 28 -> AB, etc.).",
    constraints: ["1 <= columnNumber <= 2^31 - 1"],
    examples: [
      { input: "columnNumber = 1", output: '"A"' },
      { input: "columnNumber = 28", output: '"AB"' },
      { input: "columnNumber = 701", output: '"ZY"' }
    ]
  },
  {
    title: "Convert Spreadsheet Column Title to Number",
    slug: "excel-sheet-column-number",
    difficulty: "Easy",
    points: 3,
    tags: ["Math", "String", "LC-171"],
    description: "Given a string columnTitle that represents the column title as appears in an Excel sheet, return its corresponding column number.",
    constraints: ["1 <= columnTitle.length <= 7", "columnTitle consists only of uppercase English letters."],
    examples: [
      { input: 'columnTitle = "A"', output: "1" },
      { input: 'columnTitle = "AB"', output: "28" },
      { input: 'columnTitle = "ZY"', output: "701" }
    ]
  },
  {
    title: "Count Factorial Trailing Zeroes",
    slug: "factorial-trailing-zeroes",
    difficulty: "Medium",
    points: 5,
    tags: ["Math", "LC-172"],
    description: "Given an integer n, return the number of trailing zeroes in n!. Your solution should run in logarithmic time complexity O(log n).",
    constraints: ["0 <= n <= 10^4"],
    examples: [
      { input: "n = 3", output: "0", explanation: "3! = 6, no trailing zeroes." },
      { input: "n = 5", output: "1", explanation: "5! = 120, one trailing zero." },
      { input: "n = 0", output: "0" }
    ]
  },
  {
    title: "Stock Trader with At Most K Transactions",
    slug: "best-time-to-buy-and-sell-stock-iv",
    difficulty: "Hard",
    points: 10,
    tags: ["Array", "Dynamic Programming", "LC-188"],
    description: "You are given an integer array prices where prices[i] is the price of a given stock on the i-th day, and an integer k. Find the maximum profit you can achieve with at most k completed buy-sell transactions.",
    constraints: ["1 <= k <= 100", "1 <= prices.length <= 1000", "0 <= prices[i] <= 1000"],
    examples: [
      { input: "k = 2, prices = [2,4,1]", output: "2" },
      { input: "k = 2, prices = [3,2,6,5,0,3]", output: "7" }
    ]
  },
  {
    title: "Range Bitwise AND Product",
    slug: "bitwise-and-of-numbers-range",
    difficulty: "Medium",
    points: 5,
    tags: ["Bit Manipulation", "LC-201"],
    description: "Given two integers left and right representing the inclusive range [left, right], return the bitwise AND of all numbers in this range.",
    constraints: ["0 <= left <= right <= 2^31 - 1"],
    examples: [
      { input: "left = 5, right = 7", output: "4", explanation: "5 & 6 & 7 = 101 & 110 & 111 = 100 (4)." },
      { input: "left = 0, right = 0", output: "0" },
      { input: "left = 1, right = 2147483647", output: "0" }
    ]
  },
  {
    title: "Wildcard Dictionary Search (Trie)",
    slug: "design-add-and-search-words-data-structure",
    difficulty: "Medium",
    points: 5,
    tags: ["String", "Depth-First Search", "Design", "Trie", "LC-211"],
    description: "Design a data structure that supports adding new words and finding if a string matches any previously added string. Word query can contain the character '.' to represent any one letter.",
    constraints: ["1 <= word.length <= 25", "At most 10^4 calls will be made to addWord and search."],
    examples: [
      { input: 'WordDictionary(); addWord("bad"); addWord("dad"); addWord("mad"); search("pad"); search("bad"); search(".ad"); search("b..");', output: "[null,null,null,null,false,true,true,true]" }
    ]
  },
  {
    title: "Multi-Word Boggle Board Finder",
    slug: "word-search-ii",
    difficulty: "Hard",
    points: 10,
    tags: ["Array", "String", "Backtracking", "Trie", "Matrix", "LC-212"],
    description: "Given an m x n board of characters and a list of strings words, return all words that can be formed from sequential adjacent letters on the board.",
    constraints: ["m == board.length", "n == board[i].length", "1 <= m, n <= 12", "1 <= words.length <= 3 * 10^4"],
    examples: [
      { input: 'board = [["o","a","a","n"],["e","t","a","e"],["i","h","k","r"],["i","f","l","v"]], words = ["oath","pea","eat","rain"]', output: '["eat","oath"]' }
    ]
  },
  {
    title: "Shortest Palindrome Prefix Extender",
    slug: "shortest-palindrome",
    difficulty: "Hard",
    points: 10,
    tags: ["String", "Rolling Hash", "String Matching", "Hash Function", "LC-214"],
    description: "You are given a string s. You can convert s to a palindrome by adding characters in front of it. Return the shortest palindrome you can find by performing this transformation.",
    constraints: ["0 <= s.length <= 5 * 10^4", "s consists of lowercase English letters only."],
    examples: [
      { input: 's = "aacecaaa"', output: '"aaacecaaa"' },
      { input: 's = "abcd"', output: '"dcbabcd"' }
    ]
  },
  {
    title: "Unique K-Digit Combinations Summing to N",
    slug: "combination-sum-iii",
    difficulty: "Medium",
    points: 5,
    tags: ["Array", "Backtracking", "LC-216"],
    description: "Find all valid combinations of k numbers that add up to n such that only digits 1 through 9 are used and each digit is used at most once. Return a list of all possible valid combinations.",
    constraints: ["2 <= k <= 9", "1 <= n <= 60"],
    examples: [
      { input: "k = 3, n = 7", output: "[[1,2,4]]" },
      { input: "k = 3, n = 9", output: "[[1,2,6],[1,3,5],[2,3,4]]" }
    ]
  },
  {
    title: "City Skyline Contour Extraction",
    slug: "the-skyline-problem",
    difficulty: "Hard",
    points: 10,
    tags: ["Array", "Divide and Conquer", "Binary Indexed Tree", "Segment Tree", "Line Sweep", "Heap", "LC-218"],
    description: "A city's skyline is the outer contour formed by all the buildings when viewed from a distance. Given the locations and heights of all buildings [left, right, height], return the key points that uniquely characterize the skyline.",
    constraints: ["1 <= buildings.length <= 10^4", "0 <= left < right <= 2^31 - 1", "1 <= height <= 2^31 - 1"],
    examples: [
      { input: "buildings = [[2,9,10],[3,7,15],[5,12,12],[15,20,10],[19,24,8]]", output: "[[2,10],[3,15],[7,12],[12,0],[15,10],[20,8],[24,0]]" }
    ]
  },
  {
    title: "Near Duplicate Elements within Value and Index Distance",
    slug: "contains-duplicate-iii",
    difficulty: "Hard",
    points: 10,
    tags: ["Array", "Sliding Window", "Sorting", "Bucket Sort", "Ordered Set", "LC-220"],
    description: "You are given an integer array nums and two integers indexDiff and valueDiff. Find if there exist two distinct indices i and j such that abs(i - j) <= indexDiff and abs(nums[i] - nums[j]) <= valueDiff.",
    constraints: ["2 <= nums.length <= 10^5", "-10^9 <= nums[i] <= 10^9", "1 <= indexDiff <= nums.length", "0 <= valueDiff <= 10^9"],
    examples: [
      { input: "nums = [1,2,3,1], indexDiff = 3, valueDiff = 0", output: "true" },
      { input: "nums = [1,5,9,1,5,9], indexDiff = 2, valueDiff = 3", output: "false" }
    ]
  },
  {
    title: "Count Nodes in Complete Binary Tree Fast",
    slug: "count-complete-tree-nodes",
    difficulty: "Medium",
    points: 5,
    tags: ["Binary Search", "Bit Manipulation", "Tree", "Binary Tree", "LC-222"],
    description: "Given the root of a complete binary tree, count the total number of nodes in strictly faster than O(n) time complexity by leveraging tree heights and binary search.",
    constraints: ["The number of nodes is in range [0, 5 * 10^4]", "0 <= Node.val <= 5 * 10^4"],
    examples: [
      { input: "root = [1,2,3,4,5,6]", output: "6" },
      { input: "root = []", output: "0" },
      { input: "root = [1]", output: "1" }
    ]
  },
  {
    title: "Total Area of Two Overlapping Rectangles",
    slug: "rectangle-area",
    difficulty: "Medium",
    points: 5,
    tags: ["Math", "Geometry", "LC-223"],
    description: "Given the coordinates of two rectilinear rectangles in a 2D plane defined by their bottom-left and top-right corners, return the total area covered by the two rectangles without double-counting the overlap.",
    constraints: ["-10^4 <= ax1 <= ax2 <= 10^4", "-10^4 <= ay1 <= ay2 <= 10^4", "-10^4 <= bx1 <= bx2 <= 10^4", "-10^4 <= by1 <= by2 <= 10^4"],
    examples: [
      { input: "ax1 = -3, ay1 = 0, ax2 = 3, ay2 = 4, bx1 = 0, by1 = -1, bx2 = 9, by2 = 2", output: "45" },
      { input: "ax1 = -2, ay1 = -2, ax2 = 2, ay2 = 2, bx1 = -2, by1 = -2, bx2 = 2, by2 = 2", output: "16" }
    ]
  },
  {
    title: "Basic Arithmetic Calculator with Parentheses",
    slug: "basic-calculator",
    difficulty: "Hard",
    points: 10,
    tags: ["Math", "String", "Stack", "Recursion", "LC-224"],
    description: "Given a string s representing a valid expression containing digits, '+', '-', '(', ')', and spaces, evaluate this expression and return its result.",
    constraints: ["1 <= s.length <= 3 * 10^5", "s consists of digits, '+', '-', '(', ')', and ' '."],
    examples: [
      { input: 's = "1 + 1"', output: "2" },
      { input: 's = " 2-1 + 2 "', output: "3" },
      { input: 's = "(1+(4+5+2)-3)+(6+8)"', output: "23" }
    ]
  },
  {
    title: "Simulate LIFO Stack Using Queues",
    slug: "implement-stack-using-queues",
    difficulty: "Easy",
    points: 3,
    tags: ["Stack", "Design", "Queue", "LC-225"],
    description: "Implement a last-in-first-out (LIFO) stack using only standard FIFO queue operations (push to back, peek/pop from front, size, and is empty).",
    constraints: ["1 <= x <= 9", "At most 100 calls will be made to push, pop, top, and empty."],
    examples: [
      { input: 'MyStack(); push(1); push(2); top(); pop(); empty();', output: "[null, null, null, 2, 2, false]" }
    ]
  },
  {
    title: "Summarize Consecutive Number Ranges",
    slug: "summary-ranges",
    difficulty: "Easy",
    points: 3,
    tags: ["Array", "LC-228"],
    description: "You are given a sorted unique integer array nums. Return the smallest sorted list of ranges that cover all the numbers in the array exactly.",
    constraints: ["0 <= nums.length <= 20", "-2^31 <= nums[i] <= 2^31 - 1", "All values are unique and sorted."],
    examples: [
      { input: "nums = [0,1,2,4,5,7]", output: '["0->2","4->5","7"]' },
      { input: "nums = [0,2,3,4,6,8,9]", output: '["0","2->4","6","8->9"]' }
    ]
  },
  {
    title: "Elements Appearing More Than N/3 Times",
    slug: "majority-element-ii",
    difficulty: "Medium",
    points: 5,
    tags: ["Array", "Hash Table", "Sorting", "Counting", "LC-229"],
    description: "Given an integer array of size n, find all elements that appear more than ⌊ n/3 ⌋ times in O(n) time and O(1) space using Boyer-Moore Voting.",
    constraints: ["1 <= nums.length <= 5 * 10^4", "-10^9 <= nums[i] <= 10^9"],
    examples: [
      { input: "nums = [3,2,3]", output: "[3]" },
      { input: "nums = [1]", output: "[1]" },
      { input: "nums = [1,2]", output: "[1,2]" }
    ]
  },
  {
    title: "Total Occurrences of Digit One Up to N",
    slug: "number-of-digit-one",
    difficulty: "Hard",
    points: 10,
    tags: ["Math", "Dynamic Programming", "Recursion", "LC-233"],
    description: "Given an integer n, count the total number of digit 1 appearing in all non-negative integers less than or equal to n.",
    constraints: ["0 <= n <= 10^9"],
    examples: [
      { input: "n = 13", output: "6", explanation: "Digit 1 appears in 1, 10, 11 (two 1s), 12, 13, for total 6 times." },
      { input: "n = 0", output: "0" }
    ]
  },
  {
    title: "All Computation Results from Parenthesized Expression",
    slug: "different-ways-to-add-parentheses",
    difficulty: "Medium",
    points: 5,
    tags: ["Math", "String", "Dynamic Programming", "Recursion", "Memoization", "LC-241"],
    description: "Given a string expression of numbers and operators (+, -, *), return all possible results from computing all different valid parenthesizations.",
    constraints: ["1 <= expression.length <= 20", "The operators are '+', '-', and '*'."],
    examples: [
      { input: 'expression = "2-1-1"', output: "[0,2]", explanation: "((2-1)-1) = 0, (2-(1-1)) = 2." },
      { input: 'expression = "2*3-4*5"', output: "[-34,-14,-10,-10,10]" }
    ]
  },
  {
    title: "Convert Integer to Spoken English Words",
    slug: "integer-to-english-words",
    difficulty: "Hard",
    points: 10,
    tags: ["Math", "String", "Recursion", "LC-273"],
    description: "Convert a non-negative integer num to its English words representation.",
    constraints: ["0 <= num <= 2^31 - 1"],
    examples: [
      { input: "num = 123", output: '"One Hundred Twenty Three"' },
      { input: "num = 12345", output: '"Twelve Thousand Three Hundred Forty Five"' },
      { input: "num = 1234567", output: '"One Million Two Hundred Thirty Four Thousand Five Hundred Sixty Seven"' }
    ]
  },
  {
    title: "Insert Arithmetic Operators to Form Target Value",
    slug: "expression-add-operators",
    difficulty: "Hard",
    points: 10,
    tags: ["Math", "String", "Backtracking", "LC-282"],
    description: "Given a string num that contains only digits and an integer target, return all possibilities to insert binary operators '+', '-', and/or '*' between the digits of num so that the resultant expression evaluates to the target value.",
    constraints: ["1 <= num.length <= 10", "num consists of only digits.", "-2^31 <= target <= 2^31 - 1"],
    examples: [
      { input: 'num = "123", target = 6', output: '["1*2*3","1+2+3"]' },
      { input: 'num = "232", target = 8', output: '["2*3+2","2+3*2"]' },
      { input: 'num = "3456237490", target = 9191', output: "[]" }
    ]
  },
  {
    title: "Design Iterator with Lookahead Peek",
    slug: "peeking-iterator",
    difficulty: "Medium",
    points: 5,
    tags: ["Array", "Design", "Iterator", "LC-284"],
    description: "Design an iterator that supports the peek() operation on an existing iterator in addition to the standard next() and hasNext() operations without advancing the internal cursor prematurely.",
    constraints: ["1 <= nums.length <= 1000", "At most 1000 calls will be made to next, hasNext, and peek."],
    examples: [
      { input: "PeekingIterator([1, 2, 3]); next(); peek(); next(); next(); hasNext();", output: "[null, 1, 2, 2, 3, false]" }
    ]
  }
];
