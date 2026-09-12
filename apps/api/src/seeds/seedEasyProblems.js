import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Problem from '../models/Problem.js';
import { connectDB } from '../config/db.js';

dotenv.config();

// Comprehensive collection of iconic, canonical LeetCode Easy problems beyond #300.
// Reworded titles, descriptions, and examples to prevent copyright infringement while strictly preserving algorithmic challenges and function signatures.
export const EASY_PROBLEMS = [
  // --- Arrays, Two Pointers & Hashing ---
  {
    title: "Static Range Sum Query",
    slug: "range-sum-query-immutable",
    difficulty: "Easy",
    points: 3,
    tags: ["Array", "Design", "Prefix Sum", "LC-303"],
    description: "Given an integer array nums, handle multiple queries of calculating the sum of elements between indices left and right inclusive (i.e. nums[left] + ... + nums[right]) in O(1) time per query using prefix sums.",
    constraints: ["1 <= nums.length <= 10^4", "-10^5 <= nums[i] <= 10^5", "0 <= left <= right < nums.length", "At most 10^4 calls will be made to sumRange."],
    examples: [
      { input: 'NumArray([-2, 0, 3, -5, 2, -1]); sumRange(0, 2); sumRange(2, 5); sumRange(0, 5);', output: '[null, 1, -1, -3]' }
    ]
  },
  {
    title: "Set Intersection of Two Arrays",
    slug: "intersection-of-two-arrays",
    difficulty: "Easy",
    points: 3,
    tags: ["Array", "Hash Table", "Two Pointers", "Binary Search", "Sorting", "LC-349"],
    description: "Given two integer arrays nums1 and nums2, return an array of their intersection. Each element in the result must be unique and elements may be returned in any order.",
    constraints: ["1 <= nums1.length, nums2.length <= 1000", "0 <= nums1[i], nums2[i] <= 1000"],
    examples: [
      { input: "nums1 = [1,2,2,1], nums2 = [2,2]", output: "[2]" },
      { input: "nums1 = [4,9,5], nums2 = [9,4,9,8,4]", output: "[9,4]" }
    ]
  },
  {
    title: "Frequency Intersection of Two Arrays",
    slug: "intersection-of-two-arrays-ii",
    difficulty: "Easy",
    points: 3,
    tags: ["Array", "Hash Table", "Two Pointers", "Binary Search", "Sorting", "LC-350"],
    description: "Given two integer arrays nums1 and nums2, return an array of their intersection. Each element in the result must appear as many times as it shows in both arrays.",
    constraints: ["1 <= nums1.length, nums2.length <= 1000", "0 <= nums1[i], nums2[i] <= 1000"],
    examples: [
      { input: "nums1 = [1,2,2,1], nums2 = [2,2]", output: "[2,2]" },
      { input: "nums1 = [4,9,5], nums2 = [9,4,9,8,4]", output: "[4,9]" }
    ]
  },
  {
    title: "Third Distinct Maximum Value",
    slug: "third-maximum-number",
    difficulty: "Easy",
    points: 3,
    tags: ["Array", "Sorting", "LC-414"],
    description: "Given an integer array nums, return the third distinct maximum number in this array. If the third maximum does not exist, return the maximum number.",
    constraints: ["1 <= nums.length <= 10^4", "-2^31 <= nums[i] <= 2^31 - 1"],
    examples: [
      { input: "nums = [3,2,1]", output: "1" },
      { input: "nums = [1,2]", output: "2", explanation: "Third max doesn't exist, return maximum (2)." },
      { input: "nums = [2,2,3,1]", output: "1" }
    ]
  },
  {
    title: "Find Missing Numbers in Range [1, n]",
    slug: "find-all-numbers-disappeared-in-an-array",
    difficulty: "Easy",
    points: 3,
    tags: ["Array", "Hash Table", "LC-448"],
    description: "Given an array nums of n integers where nums[i] is in the range [1, n], return an array of all integers in the range [1, n] that do not appear in nums in O(n) runtime and O(1) extra space.",
    constraints: ["n == nums.length", "1 <= n <= 10^5", "1 <= nums[i] <= n"],
    examples: [
      { input: "nums = [4,3,2,7,8,2,3,1]", output: "[5,6]" },
      { input: "nums = [1,1]", output: "[2]" }
    ]
  },
  {
    title: "Longest Streak of Consecutive Ones",
    slug: "max-consecutive-ones",
    difficulty: "Easy",
    points: 3,
    tags: ["Array", "LC-485"],
    description: "Given a binary array nums, return the maximum number of consecutive 1's in the array.",
    constraints: ["1 <= nums.length <= 10^5", "nums[i] is either 0 or 1."],
    examples: [
      { input: "nums = [1,1,0,1,1,1]", output: "3" },
      { input: "nums = [1,0,1,1,0,1]", output: "2" }
    ]
  },
  {
    title: "Athlete Olympic Medal and Placement Ranks",
    slug: "relative-ranks",
    difficulty: "Easy",
    points: 3,
    tags: ["Array", "Sorting", "Heap", "LC-506"],
    description: "You are given an integer array score of size n, where score[i] is the score of the i-th athlete in a competition. Assign 'Gold Medal', 'Silver Medal', 'Bronze Medal' to top 3, and placement strings ('4', '5', ...) to the rest.",
    constraints: ["n == score.length", "1 <= n <= 10^4", "0 <= score[i] <= 10^6", "All scores are unique."],
    examples: [
      { input: "score = [5,4,3,2,1]", output: '["Gold Medal","Silver Medal","Bronze Medal","4","5"]' },
      { input: "score = [10,3,8,9,4]", output: '["Gold Medal","5","Bronze Medal","Silver Medal","4"]' }
    ]
  },
  {
    title: "Pair Maximum Sum Partition",
    slug: "array-partition",
    difficulty: "Easy",
    points: 3,
    tags: ["Array", "Greedy", "Sorting", "Counting Sort", "LC-561"],
    description: "Given an integer array nums of 2n integers, group these integers into n pairs (a1, b1), (a2, b2), ..., (an, bn) such that the sum of min(ai, bi) for all i is maximized. Return the maximized sum.",
    constraints: ["1 <= n <= 10^4", "nums.length == 2 * n", "-10^4 <= nums[i] <= 10^4"],
    examples: [
      { input: "nums = [1,4,3,2]", output: "4", explanation: "Optimal pairs: (1, 2) and (3, 4). min(1, 2) + min(3, 4) = 1 + 3 = 4." },
      { input: "nums = [6,2,6,5,1,2]", output: "9" }
    ]
  },
  {
    title: "Matrix Reshape Transformation",
    slug: "reshape-the-matrix",
    difficulty: "Easy",
    points: 3,
    tags: ["Array", "Matrix", "Simulation", "LC-566"],
    description: "In MATLAB, there is a handy function called reshape. Given an m x n matrix mat and two integers r and c representing desired row and column dimensions, reshape the matrix preserving row-traversal order if legal, else return original.",
    constraints: ["m == mat.length", "n == mat[i].length", "1 <= m, n <= 100", "-1000 <= mat[i][j] <= 1000", "1 <= r, c <= 300"],
    examples: [
      { input: "mat = [[1,2],[3,4]], r = 1, c = 4", output: "[[1,2,3,4]]" },
      { input: "mat = [[1,2],[3,4]], r = 2, c = 4", output: "[[1,2],[3,4]]" }
    ]
  },
  {
    title: "Maximum Diverse Candy Varieties",
    slug: "distribute-candies",
    difficulty: "Easy",
    points: 3,
    tags: ["Array", "Hash Table", "LC-575"],
    description: "Alice has n candies, where the i-th candy is of type candyType[i]. Alice wants to eat n / 2 candies with the maximum number of different types. Return the maximum number of different types of candies she can eat.",
    constraints: ["n == candyType.length", "2 <= n <= 10^4", "n is even", "-10^5 <= candyType[i] <= 10^5"],
    examples: [
      { input: "candyType = [1,1,2,2,3,3]", output: "3" },
      { input: "candyType = [1,1,2,3]", output: "2" },
      { input: "candyType = [6,6,6,6]", output: "1" }
    ]
  },
  {
    title: "Adjacent Plot Flower Planting",
    slug: "can-place-flowers",
    difficulty: "Easy",
    points: 3,
    tags: ["Array", "Greedy", "LC-605"],
    description: "You have a long flowerbed in which some plots are planted (1) and some are empty (0). Flowers cannot be planted in adjacent plots. Given flowerbed and integer n, return true if n new flowers can be planted without violating no-adjacent rule.",
    constraints: ["1 <= flowerbed.length <= 2 * 10^4", "flowerbed[i] is 0 or 1", "No two adjacent flowers exist initially.", "0 <= n <= flowerbed.length"],
    examples: [
      { input: "flowerbed = [1,0,0,0,1], n = 1", output: "true" },
      { input: "flowerbed = [1,0,0,0,1], n = 2", output: "false" }
    ]
  },
  {
    title: "Maximum Average Fixed Window",
    slug: "maximum-average-subarray-i",
    difficulty: "Easy",
    points: 3,
    tags: ["Array", "Sliding Window", "LC-643"],
    description: "You are given an integer array nums consisting of n elements, and an integer k. Find a contiguous subarray whose length is equal to k that has the maximum average value and return this value.",
    constraints: ["n == nums.length", "1 <= k <= n <= 10^5", "-10^4 <= nums[i] <= 10^4"],
    examples: [
      { input: "nums = [1,12,-5,-6,50,3], k = 4", output: "12.75", explanation: "Subarray [12, -5, -6, 50] has max sum 51, average = 51/4 = 12.75." },
      { input: "nums = [5], k = 1", output: "5.0" }
    ]
  },
  {
    title: "Locate Duplicate and Missing Number",
    slug: "set-mismatch",
    difficulty: "Easy",
    points: 3,
    tags: ["Array", "Hash Table", "Bit Manipulation", "Sorting", "LC-645"],
    description: "You have a set of integers from 1 to n. Due to an error, one number in the set got duplicated to another number, resulting in repetition of one number and loss of another. Find the duplicate and missing number.",
    constraints: ["2 <= nums.length <= 10^4", "1 <= nums[i] <= 10^4"],
    examples: [
      { input: "nums = [1,2,2,4]", output: "[2,3]" },
      { input: "nums = [1,1]", output: "[1,2]" }
    ]
  },
  {
    title: "Pixel 3x3 Average Image Smoother",
    slug: "image-smoother",
    difficulty: "Easy",
    points: 3,
    tags: ["Array", "Matrix", "LC-661"],
    description: "An image smoother is a filter applied to a grayscale image where each pixel's value is replaced by the rounded down average of its 3 x 3 surrounding cells (including itself). Return the smoothed matrix.",
    constraints: ["m == img.length", "n == img[i].length", "1 <= m, n <= 200", "0 <= img[i][j] <= 255"],
    examples: [
      { input: "img = [[1,1,1],[1,0,1],[1,1,1]]", output: "[[0,0,0],[0,0,0],[0,0,0]]" },
      { input: "img = [[100,200,100],[200,50,200],[100,200,100]]", output: "[[137,141,137],[141,138,141],[137,141,137]]" }
    ]
  },
  {
    title: "Shortest Subarray with Matching Array Degree",
    slug: "degree-of-an-array",
    difficulty: "Easy",
    points: 3,
    tags: ["Array", "Hash Table", "Sliding Window", "LC-697"],
    description: "Given a non-empty array of non-negative integers nums, the degree of this array is defined as the maximum frequency of any one of its elements. Find the smallest length of a contiguous subarray that has the same degree as nums.",
    constraints: ["nums.length will be between 1 and 50,000", "nums[i] will be an integer between 0 and 49,999"],
    examples: [
      { input: "nums = [1,2,2,3,1]", output: "2", explanation: "Degree is 2 (values 1 and 2). Subarray [2,2] has length 2." },
      { input: "nums = [1,2,2,3,1,4,2]", output: "6" }
    ]
  },
  {
    title: "Classic Ordered Binary Search",
    slug: "binary-search",
    difficulty: "Easy",
    points: 3,
    tags: ["Array", "Binary Search", "LC-704"],
    description: "Given an array of integers nums which is sorted in ascending order, and an integer target, write a function to search target in nums in O(log n) runtime. If target exists, return its index; otherwise, return -1.",
    constraints: ["1 <= nums.length <= 10^4", "-10^4 < nums[i], target < 10^4", "All the integers in nums are unique.", "nums is sorted in ascending order."],
    examples: [
      { input: "nums = [-1,0,3,5,9,12], target = 9", output: "4", explanation: "9 exists in nums and its index is 4." },
      { input: "nums = [-1,0,3,5,9,12], target = 2", output: "-1" }
    ]
  },
  {
    title: "Equilibrium Array Pivot Index",
    slug: "find-pivot-index",
    difficulty: "Easy",
    points: 3,
    tags: ["Array", "Prefix Sum", "LC-724"],
    description: "Given an array of integers nums, calculate the pivot index where the sum of all the numbers strictly to the left is equal to the sum of all numbers strictly to the right. Return the leftmost pivot index, or -1.",
    constraints: ["1 <= nums.length <= 10^4", "-1000 <= nums[i] <= 1000"],
    examples: [
      { input: "nums = [1,7,3,6,5,6]", output: "3", explanation: "Left sum = 1+7+3 = 11, Right sum = 5+6 = 11." },
      { input: "nums = [1,2,3]", output: "-1" },
      { input: "nums = [2,1,-1]", output: "0" }
    ]
  },
  {
    title: "Minimum Energy Cost Staircase",
    slug: "min-cost-climbing-stairs",
    difficulty: "Easy",
    points: 3,
    tags: ["Array", "Dynamic Programming", "LC-746"],
    description: "You are given an integer array cost where cost[i] is the cost of i-th step on a staircase. Once you pay the cost, you can climb either one or two steps. You can start from index 0 or 1. Return the minimum cost to reach the top.",
    constraints: ["2 <= cost.length <= 1000", "0 <= cost[i] <= 999"],
    examples: [
      { input: "cost = [10,15,20]", output: "15", explanation: "Start at index 1, pay 15 and climb two steps to reach the top." },
      { input: "cost = [1,100,1,1,1,100,1,1,100,1]", output: "6" }
    ]
  },
  {
    title: "Dominant Element Verification",
    slug: "largest-number-at-least-twice-of-others",
    difficulty: "Easy",
    points: 3,
    tags: ["Array", "Sorting", "LC-747"],
    description: "You are given an integer array nums where the largest integer is unique. Determine whether the largest element is at least twice as much as every other number in the array. Return its index if true, else -1.",
    constraints: ["2 <= nums.length <= 50", "0 <= nums[i] <= 100", "The largest element in nums is unique."],
    examples: [
      { input: "nums = [3,6,1,0]", output: "1", explanation: "6 is at least twice of 3, 1, and 0. Index is 1." },
      { input: "nums = [1,2,3,4]", output: "-1", explanation: "4 is not at least twice of 3." }
    ]
  },
  {
    title: "Horizontal Invert and Flip Image",
    slug: "flipping-an-image",
    difficulty: "Easy",
    points: 3,
    tags: ["Array", "Two Pointers", "Matrix", "Simulation", "LC-832"],
    description: "Given an n x n binary matrix image, flip the image horizontally (reverse each row), then invert it (change 0 to 1 and 1 to 0), and return the resulting matrix.",
    constraints: ["n == image.length == image[i].length", "1 <= n <= 20", "image[i][j] is either 0 or 1."],
    examples: [
      { input: "image = [[1,1,0],[1,0,1],[0,0,0]]", output: "[[1,0,0],[0,1,0],[1,1,1]]" },
      { input: "image = [[1,1,0,0],[1,0,0,1],[0,1,1,1],[1,0,1,0]]", output: "[[1,1,0,0],[0,1,1,0],[0,0,0,1],[1,0,1,0]]" }
    ]
  },
  {
    title: "Matrix Transposition Swap",
    slug: "transpose-matrix",
    difficulty: "Easy",
    points: 3,
    tags: ["Array", "Matrix", "Simulation", "LC-867"],
    description: "Given a 2D integer array matrix, return the transpose of matrix. The transpose of a matrix is the matrix flipped over its main diagonal, switching the matrix's row and column indices.",
    constraints: ["m == matrix.length", "n == matrix[i].length", "1 <= m, n <= 1000", "1 <= m * n <= 10^5", "-10^9 <= matrix[i][j] <= 10^9"],
    examples: [
      { input: "matrix = [[1,2,3],[4,5,6],[7,8,9]]", output: "[[1,4,7],[2,5,8],[3,6,9]]" },
      { input: "matrix = [[1,2,3],[4,5,6]]", output: "[[1,4],[2,5],[3,6]]" }
    ]
  },
  {
    title: "Two-Pointer Linked List Middle Node",
    slug: "middle-of-the-linked-list",
    difficulty: "Easy",
    points: 3,
    tags: ["Linked List", "Two Pointers", "LC-876"],
    description: "Given the head of a singly linked list, return the middle node of the linked list. If there are two middle nodes, return the second middle node.",
    constraints: ["The number of nodes in the list is in the range [1, 100]", "1 <= Node.val <= 100"],
    examples: [
      { input: "head = [1,2,3,4,5]", output: "[3,4,5]" },
      { input: "head = [1,2,3,4,5,6]", output: "[4,5,6]" }
    ]
  },
  {
    title: "Equal Total Candy Bar Exchange",
    slug: "fair-candy-swap",
    difficulty: "Easy",
    points: 3,
    tags: ["Array", "Hash Table", "Binary Search", "Sorting", "LC-888"],
    description: "Alice and Bob have different amounts of candy bars. aliceSizes[i] and bobSizes[j] denote box sizes. Find an exchange [aliceSizes[i], bobSizes[j]] such that after the swap, both have the exact same total candy count.",
    constraints: ["1 <= aliceSizes.length, bobSizes.length <= 10^4", "1 <= aliceSizes[i], bobSizes[j] <= 10^5"],
    examples: [
      { input: "aliceSizes = [1,1], bobSizes = [2,2]", output: "[1,2]" },
      { input: "aliceSizes = [1,2], bobSizes = [2,3]", output: "[1,2]" },
      { input: "aliceSizes = [2], bobSizes = [1,3]", output: "[2,3]" }
    ]
  },
  {
    title: "Monotonic Array Order Check",
    slug: "monotonic-array",
    difficulty: "Easy",
    points: 3,
    tags: ["Array", "LC-896"],
    description: "An array is monotonic if it is either monotone increasing or monotone decreasing. Given an integer array nums, return true if the given array is monotonic, or false otherwise.",
    constraints: ["1 <= nums.length <= 10^5", "-10^5 <= nums[i] <= 10^5"],
    examples: [
      { input: "nums = [1,2,2,3]", output: "true" },
      { input: "nums = [6,5,4,4]", output: "true" },
      { input: "nums = [1,3,2]", output: "false" }
    ]
  },
  {
    title: "Partition Evens and Odds In-Place",
    slug: "sort-array-by-parity",
    difficulty: "Easy",
    points: 3,
    tags: ["Array", "Two Pointers", "Sorting", "LC-905"],
    description: "Given an integer array nums, move all the even integers at the beginning of the array followed by all the odd integers. Return any array that satisfies this condition.",
    constraints: ["1 <= nums.length <= 5000", "0 <= nums[i] <= 5000"],
    examples: [
      { input: "nums = [3,1,2,4]", output: "[2,4,3,1]", explanation: "[4,2,3,1], [2,4,1,3], and [4,2,1,3] are also accepted." },
      { input: "nums = [0]", output: "[0]" }
    ]
  },
  {
    title: "Alternate Even and Odd Indices",
    slug: "sort-array-by-parity-ii",
    difficulty: "Easy",
    points: 3,
    tags: ["Array", "Two Pointers", "Sorting", "LC-922"],
    description: "Given an array of integers nums of even length where half the integers are even and half are odd, sort the array so that whenever nums[i] is odd, i is odd, and whenever nums[i] is even, i is even.",
    constraints: ["2 <= nums.length <= 2 * 10^4", "nums.length is even", "Half of integers are even, half are odd.", "0 <= nums[i] <= 1000"],
    examples: [
      { input: "nums = [4,2,5,7]", output: "[4,5,2,7]", explanation: "[4,7,2,5], [2,5,4,7] are also valid." }
    ]
  },
  {
    title: "Strict Mountain Peak Array",
    slug: "valid-mountain-array",
    difficulty: "Easy",
    points: 3,
    tags: ["Array", "LC-941"],
    description: "Given an array of integers arr, return true if and only if it is a valid mountain array (strictly increases to a single peak at index i (0 < i < arr.length - 1), then strictly decreases).",
    constraints: ["1 <= arr.length <= 10^4", "0 <= arr[i] <= 10^4"],
    examples: [
      { input: "arr = [2,1]", output: "false" },
      { input: "arr = [3,5,5]", output: "false" },
      { input: "arr = [0,3,2,1]", output: "true" }
    ]
  },
  {
    title: "Two-Pointer Sorted Array Squares",
    slug: "squares-of-a-sorted-array",
    difficulty: "Easy",
    points: 3,
    tags: ["Array", "Two Pointers", "Sorting", "LC-977"],
    description: "Given an integer array nums sorted in non-decreasing order, return an array of the squares of each number sorted in non-decreasing order in O(n) time using two pointers.",
    constraints: ["1 <= nums.length <= 10^4", "-10^4 <= nums[i] <= 10^4", "nums is sorted in non-decreasing order."],
    examples: [
      { input: "nums = [-4,-1,0,3,10]", output: "[0,1,9,16,100]" },
      { input: "nums = [-7,-3,2,3,11]", output: "[4,9,9,49,121]" }
    ]
  },
  {
    title: "Array Integer Addition",
    slug: "add-to-array-form-of-integer",
    difficulty: "Easy",
    points: 3,
    tags: ["Array", "Math", "LC-989"],
    description: "The array-form of an integer num is an array representing its digits in left to right order. Given num and an integer k, return the array-form of the integer num + k.",
    constraints: ["1 <= num.length <= 10^4", "0 <= num[i] <= 9", "num does not contain any leading zeros, except the number 0 itself.", "1 <= k <= 10^4"],
    examples: [
      { input: "num = [1,2,0,0], k = 34", output: "[1,2,3,4]" },
      { input: "num = [2,7,4], k = 181", output: "[4,5,5]" }
    ]
  },
  {
    title: "Common Character Multiplicity in Words",
    slug: "find-common-characters",
    difficulty: "Easy",
    points: 3,
    tags: ["Array", "Hash Table", "String", "LC-1002"],
    description: "Given a string array words, return an array of all characters that show up in all strings within words (including duplicates). You may return the answer in any order.",
    constraints: ["1 <= words.length <= 100", "1 <= words[i].length <= 100", "words[i] consists of lowercase English letters."],
    examples: [
      { input: 'words = ["bella","label","roller"]', output: '["e","l","l"]' },
      { input: 'words = ["cool","lock","cook"]', output: '["c","o"]' }
    ]
  },
  {
    title: "Student Lineup Height Discrepancies",
    slug: "height-checker",
    difficulty: "Easy",
    points: 3,
    tags: ["Array", "Sorting", "Counting Sort", "LC-1051"],
    description: "A school is trying to take an annual photo of students ordered by non-decreasing height. Return the number of indices where heights[i] != expected[i] when compared to the correctly sorted array.",
    constraints: ["1 <= heights.length <= 100", "1 <= heights[i] <= 100"],
    examples: [
      { input: "heights = [1,1,4,2,1,3]", output: "3", explanation: "Sorted: [1,1,1,2,3,4]. Indices 2, 4, 5 do not match." },
      { input: "heights = [5,1,2,3,4]", output: "5" }
    ]
  },
  {
    title: "In-Place Zero Duplication",
    slug: "duplicate-zeros",
    difficulty: "Easy",
    points: 3,
    tags: ["Array", "Two Pointers", "LC-1089"],
    description: "Given a fixed-length integer array arr, duplicate each occurrence of zero, shifting the remaining elements to the right. Elements beyond the original array length are discarded. Modify in-place.",
    constraints: ["1 <= arr.length <= 10^4", "0 <= arr[i] <= 9"],
    examples: [
      { input: "arr = [1,0,2,3,0,4,5,0]", output: "[1,0,0,2,3,0,0,4]" },
      { input: "arr = [1,2,3]", output: "[1,2,3]" }
    ]
  },
  {
    title: "Custom Secondary Order Array Sort",
    slug: "relative-sort-array",
    difficulty: "Easy",
    points: 3,
    tags: ["Array", "Hash Table", "Sorting", "Counting Sort", "LC-1122"],
    description: "Given two arrays arr1 and arr2, the elements of arr2 are distinct, and all in arr1. Sort elements of arr1 such that the relative ordering of items in arr1 are the same as in arr2. Elements not in arr2 appear at end in ascending order.",
    constraints: ["1 <= arr1.length, arr2.length <= 1000", "0 <= arr1[i], arr2[i] <= 1000", "All elements of arr2 are distinct."],
    examples: [
      { input: "arr1 = [2,3,1,3,2,4,6,7,9,2,19], arr2 = [2,1,4,3,9,6]", output: "[2,2,2,1,4,3,3,9,6,7,19]" }
    ]
  },
  {
    title: "Smallest Absolute Difference Pairs",
    slug: "minimum-absolute-difference",
    difficulty: "Easy",
    points: 3,
    tags: ["Array", "Sorting", "LC-1200"],
    description: "Given an array of distinct integers arr, find all pairs of elements with the minimum absolute difference of any two elements. Return a list of pairs in ascending order [a, b] with a < b.",
    constraints: ["2 <= arr.length <= 10^5", "-10^6 <= arr[i] <= 10^6"],
    examples: [
      { input: "arr = [4,2,1,3]", output: "[[1,2],[2,3],[3,4]]", explanation: "Min difference is 1." },
      { input: "arr = [1,3,6,10,15]", output: "[[1,3]]" }
    ]
  },
  {
    title: "Unique Element Frequency Verification",
    slug: "unique-number-of-occurrences",
    difficulty: "Easy",
    points: 3,
    tags: ["Array", "Hash Table", "LC-1207"],
    description: "Given an array of integers arr, return true if the number of occurrences of each value in the array is unique, or false otherwise.",
    constraints: ["1 <= arr.length <= 1000", "-1000 <= arr[i] <= 1000"],
    examples: [
      { input: "arr = [1,2,2,1,1,3]", output: "true", explanation: "1 occurs 3 times, 2 occurs 2 times, 3 occurs 1 time. Counts [3, 2, 1] are all unique." },
      { input: "arr = [1,2]", output: "false" }
    ]
  },
  {
    title: "Parity Cost Chip Movement",
    slug: "minimum-cost-to-move-chips-to-the-same-position",
    difficulty: "Easy",
    points: 3,
    tags: ["Array", "Math", "Greedy", "LC-1217"],
    description: "We have n chips, where the position of the i-th chip is position[i]. Moving a chip 2 units costs 0; moving 1 unit costs 1. Return minimum cost to move all chips to the same position.",
    constraints: ["1 <= position.length <= 100", "1 <= position[i] <= 10^9"],
    examples: [
      { input: "position = [1,2,3]", output: "1" },
      { input: "position = [2,2,2,3,3]", output: "2" }
    ]
  },
  {
    title: "Odd Value Matrix Cell Counter",
    slug: "cells-with-odd-values-in-a-matrix",
    difficulty: "Easy",
    points: 3,
    tags: ["Array", "Math", "Simulation", "LC-1252"],
    description: "There is an m x n matrix initialized to all 0's. You are given an array indices where indices[i] = [ri, ci]. Increment all cells on row ri and column ci by 1. Return the count of odd cells.",
    constraints: ["1 <= m, n <= 50", "1 <= indices.length <= 100", "0 <= ri < m", "0 <= ci < n"],
    examples: [
      { input: "m = 2, n = 3, indices = [[0,1],[1,1]]", output: "6" },
      { input: "m = 2, n = 2, indices = [[1,1],[0,0]]", output: "0" }
    ]
  },
  {
    title: "Chebyshev Distance Path Travel Time",
    slug: "minimum-time-visiting-all-points",
    difficulty: "Easy",
    points: 3,
    tags: ["Array", "Math", "Geometry", "LC-1266"],
    description: "On a 2D plane, there are n points with integer coordinates points[i] = [xi, yi]. Moving 1 step vertically, horizontally, or diagonally takes 1 second. Return the minimum time in seconds to visit all points in order.",
    constraints: ["points.length == n", "1 <= n <= 100", "points[i].length == 2", "-1000 <= points[i][0], points[i][1] <= 1000"],
    examples: [
      { input: "points = [[1,1],[3,4],[-1,0]]", output: "7" },
      { input: "points = [[3,2],[-2,2]]", output: "5" }
    ]
  },
  {
    title: "Digit Product Minus Digit Sum",
    slug: "subtract-the-product-and-sum-of-digits-of-an-integer",
    difficulty: "Easy",
    points: 3,
    tags: ["Math", "LC-1281"],
    description: "Given an integer number n, return the difference between the product of its digits and the sum of its digits.",
    constraints: ["1 <= n <= 10^5"],
    examples: [
      { input: "n = 234", output: "15", explanation: "Product: 2 * 3 * 4 = 24. Sum: 2 + 3 + 4 = 9. Result = 24 - 9 = 15." },
      { input: "n = 4421", output: "21" }
    ]
  },
  {
    title: "Count Even Digit Length Numbers",
    slug: "find-numbers-with-even-number-of-digits",
    difficulty: "Easy",
    points: 3,
    tags: ["Array", "Math", "LC-1295"],
    description: "Given an array nums of integers, return how many of them contain an even number of digits.",
    constraints: ["1 <= nums.length <= 500", "1 <= nums[i] <= 10^5"],
    examples: [
      { input: "nums = [12,345,2,6,7896]", output: "2", explanation: "12 (2 digits) and 7896 (4 digits) have even digits." },
      { input: "nums = [555,901,482,1771]", output: "1" }
    ]
  },
  {
    title: "Suffix Maximum Replacement",
    slug: "replace-elements-with-greatest-element-on-right-side",
    difficulty: "Easy",
    points: 3,
    tags: ["Array", "LC-1299"],
    description: "Given an array arr, replace every element in that array with the greatest element among the elements to its right, and replace the last element with -1.",
    constraints: ["1 <= arr.length <= 10^4", "1 <= arr[i] <= 10^5"],
    examples: [
      { input: "arr = [17,18,5,4,6,1]", output: "[18,6,6,6,1,-1]" },
      { input: "arr = [400]", output: "[-1]" }
    ]
  },
  {
    title: "Zero Sum Symmetric Number Generator",
    slug: "find-n-unique-integers-sum-up-to-zero",
    difficulty: "Easy",
    points: 3,
    tags: ["Array", "Math", "LC-1304"],
    description: "Given an integer n, return any array containing n unique integers such that they add up to 0.",
    constraints: ["1 <= n <= 1000"],
    examples: [
      { input: "n = 5", output: "[-7,-1,1,3,4]", explanation: "[-2,-1,0,1,2] is also valid." },
      { input: "n = 3", output: "[-1,0,1]" }
    ]
  },
  {
    title: "Decompress Run-Length Encoded Stream",
    slug: "decompress-run-length-encoded-list",
    difficulty: "Easy",
    points: 3,
    tags: ["Array", "LC-1313"],
    description: "We are given a list nums of integers representing a run-length encoded list. For each pair [freq, val] = [nums[2*i], nums[2*i+1]], concatenate freq occurrences of val into the output list.",
    constraints: ["2 <= nums.length <= 100", "nums.length % 2 == 0", "1 <= nums[i] <= 100"],
    examples: [
      { input: "nums = [1,2,3,4]", output: "[2,4,4,4]" },
      { input: "nums = [1,1,2,3]", output: "[1,3,3]" }
    ]
  },
  {
    title: "Pairwise Double Value Check",
    slug: "check-if-n-and-its-double-exist",
    difficulty: "Easy",
    points: 3,
    tags: ["Array", "Hash Table", "Two Pointers", "Binary Search", "Sorting", "LC-1346"],
    description: "Given an array arr of integers, check if there exist two indices i and j such that i != j and arr[i] == 2 * arr[j].",
    constraints: ["2 <= arr.length <= 500", "-10^3 <= arr[i] <= 10^3"],
    examples: [
      { input: "arr = [10,2,5,3]", output: "true", explanation: "10 is 2 * 5." },
      { input: "arr = [3,1,7,11]", output: "false" }
    ]
  },
  {
    title: "Count Strictly Smaller Preceding Values",
    slug: "how-many-numbers-are-smaller-than-the-current-number",
    difficulty: "Easy",
    points: 3,
    tags: ["Array", "Hash Table", "Sorting", "Counting Sort", "LC-1365"],
    description: "Given the array nums, for each nums[i] find out how many numbers in the array are smaller than it. Return the answer in an array.",
    constraints: ["2 <= nums.length <= 500", "0 <= nums[i] <= 100"],
    examples: [
      { input: "nums = [8,1,2,2,3]", output: "[4,0,1,1,3]" },
      { input: "nums = [6,5,4,8]", output: "[2,1,0,3]" }
    ]
  },
  {
    title: "Extra Candies Maximum Possibility",
    slug: "kids-with-the-greatest-number-of-candies",
    difficulty: "Easy",
    points: 3,
    tags: ["Array", "LC-1431"],
    description: "There are n kids with candies. You are given an integer array candies and an integer extraCandies. Return a boolean array result where result[i] is true if giving kid i all extraCandies makes them have >= any other kid.",
    constraints: ["n == candies.length", "2 <= n <= 100", "1 <= candies[i] <= 100", "1 <= extraCandies <= 50"],
    examples: [
      { input: "candies = [2,3,5,1,3], extraCandies = 3", output: "[true,true,true,false,true]" },
      { input: "candies = [4,2,1,1,2], extraCandies = 1", output: "[true,false,false,false,false]" }
    ]
  },
  {
    title: "Interleave Array Halves",
    slug: "shuffle-the-array",
    difficulty: "Easy",
    points: 3,
    tags: ["Array", "LC-1470"],
    description: "Given the array nums consisting of 2n elements in the form [x1,x2,...,xn,y1,y2,...,yn]. Return the array in the form [x1,y1,x2,y2,...,xn,yn].",
    constraints: ["1 <= n <= 500", "nums.length == 2n", "1 <= nums[i] <= 10^3"],
    examples: [
      { input: "nums = [2,5,1,3,4,7], n = 3", output: "[2,3,5,4,1,7]" },
      { input: "nums = [1,2,3,4,4,3,2,1], n = 4", output: "[1,4,2,3,3,2,4,1]" }
    ]
  },
  {
    title: "Prefix Cumulative Sum Array",
    slug: "running-sum-of-1d-array",
    difficulty: "Easy",
    points: 3,
    tags: ["Array", "Prefix Sum", "LC-1480"],
    description: "Given an array nums. We define a running sum of an array as runningSum[i] = sum(nums[0]...nums[i]). Return the running sum of nums.",
    constraints: ["1 <= nums.length <= 1000", "-10^6 <= nums[i] <= 10^6"],
    examples: [
      { input: "nums = [1,2,3,4]", output: "[1,3,6,10]" },
      { input: "nums = [1,1,1,1,1]", output: "[1,2,3,4,5]" }
    ]
  },
  {
    title: "Identical Value Pair Counting",
    slug: "number-of-good-pairs",
    difficulty: "Easy",
    points: 3,
    tags: ["Array", "Hash Table", "Math", "Counting", "LC-1512"],
    description: "Given an array of integers nums, return the number of good pairs. A pair (i, j) is called good if nums[i] == nums[j] and i < j.",
    constraints: ["1 <= nums.length <= 100", "1 <= nums[i] <= 100"],
    examples: [
      { input: "nums = [1,2,3,1,1,3]", output: "4", explanation: "4 good pairs: (0,3), (0,4), (3,4), (2,5)." },
      { input: "nums = [1,1,1,1]", output: "6" }
    ]
  },
  {
    title: "Restore Cyclic String Permutation",
    slug: "shuffle-string",
    difficulty: "Easy",
    points: 3,
    tags: ["Array", "String", "LC-1528"],
    description: "You are given a string s and an integer array indices of the same length. The string s will be shuffled such that the character at the i-th position moves to indices[i] in the shuffled string. Return the restored string.",
    constraints: ["s.length == indices.length == n", "1 <= n <= 100", "s consists of only lowercase English letters.", "All values of indices are unique."],
    examples: [
      { input: 's = "codeleet", indices = [4,5,6,7,0,2,1,3]', output: '"leetcode"' },
      { input: 's = "abc", indices = [0,1,2]', output: '"abc"' }
    ]
  },
  {
    title: "Matrix Primary and Secondary Diagonal Sum",
    slug: "matrix-diagonal-sum",
    difficulty: "Easy",
    points: 3,
    tags: ["Array", "Matrix", "LC-1572"],
    description: "Given a square matrix mat, return the sum of the matrix diagonals. Only include the sum of all the elements on the primary diagonal and all elements on the secondary diagonal that are not part of the primary diagonal.",
    constraints: ["n == mat.length == mat[i].length", "1 <= n <= 100", "1 <= mat[i][j] <= 100"],
    examples: [
      { input: "mat = [[1,2,3],[4,5,6],[7,8,9]]", output: "25", explanation: "1 + 5 + 9 + 3 + 7 = 25 (center 5 not double counted)." },
      { input: "mat = [[1,1,1,1],[1,1,1,1],[1,1,1,1],[1,1,1,1]]", output: "8" }
    ]
  },
  {
    title: "Cumulative Odd-Length Subarray Sum",
    slug: "sum-of-all-odd-length-subarrays",
    difficulty: "Easy",
    points: 3,
    tags: ["Array", "Math", "Prefix Sum", "LC-1588"],
    description: "Given an array of positive integers arr, return the sum of all possible odd-length subarrays of arr in O(n) time.",
    constraints: ["1 <= arr.length <= 1000", "1 <= arr[i] <= 1000"],
    examples: [
      { input: "arr = [1,4,2,5,3]", output: "58" },
      { input: "arr = [1,2]", output: "3" }
    ]
  },
  {
    title: "Maximum Row Sum Account Wealth",
    slug: "richest-customer-wealth",
    difficulty: "Easy",
    points: 3,
    tags: ["Array", "Matrix", "LC-1672"],
    description: "You are given an m x n integer grid accounts where accounts[i][j] is the amount of money the i-th customer has in the j-th bank. Return the wealth that the richest customer has.",
    constraints: ["m == accounts.length", "n == accounts[i].length", "1 <= m, n <= 50", "1 <= accounts[i][j] <= 100"],
    examples: [
      { input: "accounts = [[1,2,3],[3,2,1]]", output: "6" },
      { input: "accounts = [[1,5],[7,3],[3,5]]", output: "10" }
    ]
  },
  {
    title: "Peak Net Altitude Tracker",
    slug: "find-the-highest-altitude",
    difficulty: "Easy",
    points: 3,
    tags: ["Array", "Prefix Sum", "LC-1732"],
    description: "There is a biker going on a road trip starting at altitude 0. Given an integer array gain of length n where gain[i] is net gain in altitude between points i and i+1, return the highest altitude of a point.",
    constraints: ["n == gain.length", "1 <= n <= 100", "-100 <= gain[i] <= 100"],
    examples: [
      { input: "gain = [-5,1,5,0,-7]", output: "1", explanation: "Altitudes: [0, -5, -4, 1, 1, -6]. Max is 1." },
      { input: "gain = [-4,-3,-2,-1,4,3,2]", output: "0" }
    ]
  },
  {
    title: "Sum of Non-Duplicate Elements",
    slug: "sum-of-unique-elements",
    difficulty: "Easy",
    points: 3,
    tags: ["Array", "Hash Table", "Counting", "LC-1748"],
    description: "You are given an integer array nums. The unique elements of an array are the elements that appear exactly once in the array. Return the sum of all the unique elements of nums.",
    constraints: ["1 <= nums.length <= 100", "1 <= nums[i] <= 100"],
    examples: [
      { input: "nums = [1,2,3,2]", output: "4", explanation: "Unique elements are [1, 3], sum = 4." },
      { input: "nums = [1,1,1,1,1]", output: "0" }
    ]
  },
  {
    title: "Filter Items by Category Rule",
    slug: "count-items-matching-a-rule",
    difficulty: "Easy",
    points: 3,
    tags: ["Array", "String", "LC-1773"],
    description: "You are given an array items, where each items[i] = [typei, colori, namei]. You are also given ruleKey and ruleValue. Return the number of items that match the given rule.",
    constraints: ["1 <= items.length <= 10^4", "ruleKey is either 'type', 'color', or 'name'.", "All strings consist only of lowercase letters."],
    examples: [
      { input: 'items = [["phone","blue","pixel"],["computer","silver","lenovo"],["phone","gold","iphone"]], ruleKey = "color", ruleValue = "silver"', output: "1" }
    ]
  },
  {
    title: "Product Sign Calculation Without Overflow",
    slug: "sign-of-the-product-of-an-array",
    difficulty: "Easy",
    points: 3,
    tags: ["Array", "Math", "LC-1822"],
    description: "There is a function signFunc(x) that returns: 1 if x > 0, -1 if x < 0, and 0 if x == 0. You are given an integer array nums. Return signFunc(product of all values in nums).",
    constraints: ["1 <= nums.length <= 1000", "-100 <= nums[i] <= 100"],
    examples: [
      { input: "nums = [-1,-2,-3,-4,3,2,1]", output: "1" },
      { input: "nums = [1,5,0,2,-3]", output: "0" },
      { input: "nums = [-1,1,-1,1,-1]", output: "-1" }
    ]
  },
  {
    title: "Zero-Indexed Array Permutation Builder",
    slug: "build-array-from-permutation",
    difficulty: "Easy",
    points: 3,
    tags: ["Array", "Simulation", "LC-1920"],
    description: "Given a zero-based permutation nums (0-indexed), build an array ans of the same length where ans[i] = nums[nums[i]] for each 0 <= i < nums.length and return it.",
    constraints: ["1 <= nums.length <= 1000", "0 <= nums[i] < nums.length", "The elements in nums are distinct."],
    followUp: "Can you solve it in O(1) extra space by encoding two numbers in one position?",
    examples: [
      { input: "nums = [0,2,1,5,3,4]", output: "[0,1,2,4,5,3]" },
      { input: "nums = [5,0,1,2,3,4]", output: "[4,5,0,1,2,3]" }
    ]
  },
  {
    title: "Self-Array Doubling Concatenation",
    slug: "concatenation-of-array",
    difficulty: "Easy",
    points: 3,
    tags: ["Array", "Simulation", "LC-1929"],
    description: "Given an integer array nums of length n, you want to create an array ans of length 2n where ans[i] == nums[i] and ans[i + n] == nums[i] for 0 <= i < n (0-indexed).",
    constraints: ["n == nums.length", "1 <= n <= 1000", "1 <= nums[i] <= 1000"],
    examples: [
      { input: "nums = [1,2,1]", output: "[1,2,1,1,2,1]" },
      { input: "nums = [1,3,2,1]", output: "[1,3,2,1,1,3,2,1]" }
    ]
  },
  {
    title: "Arithmetic String Operations Evaluator",
    slug: "final-value-of-variable-after-performing-operations",
    difficulty: "Easy",
    points: 3,
    tags: ["Array", "String", "Simulation", "LC-2011"],
    description: "There is a programming language with only four operations and one variable X initially 0: '++X', 'X++', '--X', and 'X--'. Given a list of operations, return the final value of X.",
    constraints: ["1 <= operations.length <= 100", "operations[i] will be either '++X', 'X++', '--X', or 'X--'."],
    examples: [
      { input: 'operations = ["--X","X++","X++"]', output: "1" },
      { input: 'operations = ["++X","++X","X++"]', output: "3" }
    ]
  },
  {
    title: "Highest Word Count in Sentence List",
    slug: "maximum-number-of-words-found-in-sentences",
    difficulty: "Easy",
    points: 3,
    tags: ["Array", "String", "LC-2114"],
    description: "A sentence is a list of words separated by a single space. You are given an array of strings sentences. Return the maximum number of words that appear in a single sentence.",
    constraints: ["1 <= sentences.length <= 100", "1 <= sentences[i].length <= 100", "Words consist of lowercase English letters and spaces only."],
    examples: [
      { input: 'sentences = ["alice and bob love leetcode", "i think so too", "this is great thanks very much"]', output: "6" },
      { input: 'sentences = ["please wait", "continue to fight", "continue to win"]', output: "3" }
    ]
  },

  // --- Strings, Parsing & Two Pointers ---
  {
    title: "Two-Pointer In-Place String Reversal",
    slug: "reverse-string",
    difficulty: "Easy",
    points: 3,
    tags: ["Two Pointers", "String", "LC-344"],
    description: "Write a function that reverses a string. The input string is given as an array of characters s. You must do this by modifying the input array in-place with O(1) extra memory.",
    constraints: ["1 <= s.length <= 10^5", "s[i] is a printable ascii character."],
    examples: [
      { input: 's = ["h","e","l","l","o"]', output: '["o","l","l","e","h"]' },
      { input: 's = ["H","a","n","n","a","h"]', output: '["h","a","n","n","a","H"]' }
    ]
  },
  {
    title: "Two-Pointer Vowel Swap in String",
    slug: "reverse-vowels-of-a-string",
    difficulty: "Easy",
    points: 3,
    tags: ["Two Pointers", "String", "LC-345"],
    description: "Given a string s, reverse only all the vowels in the string and return it. The vowels are 'a', 'e', 'i', 'o', and 'u', and they can appear in both lower and upper cases, more than once.",
    constraints: ["1 <= s.length <= 3 * 10^5", "s consist of printable ASCII characters."],
    examples: [
      { input: 's = "hello"', output: '"holle"' },
      { input: 's = "leetcode"', output: '"leotcede"' }
    ]
  },
  {
    title: "Letter Frequency Ransom Note Verification",
    slug: "ransom-note",
    difficulty: "Easy",
    points: 3,
    tags: ["Hash Table", "String", "Counting", "LC-383"],
    description: "Given two strings ransomNote and magazine, return true if ransomNote can be constructed by using the letters from magazine and false otherwise. Each letter in magazine can only be used once in ransomNote.",
    constraints: ["1 <= ransomNote.length, magazine.length <= 10^5", "ransomNote and magazine consist of lowercase English letters."],
    examples: [
      { input: 'ransomNote = "a", magazine = "b"', output: "false" },
      { input: 'ransomNote = "aa", magazine = "ab"', output: "false" },
      { input: 'ransomNote = "aa", magazine = "aab"', output: "true" }
    ]
  },
  {
    title: "Locate First Non-Repeating Character Index",
    slug: "first-unique-character-in-a-string",
    difficulty: "Easy",
    points: 3,
    tags: ["Hash Table", "String", "Queue", "Counting", "LC-387"],
    description: "Given a string s, find the first non-repeating character in it and return its index. If it does not exist, return -1.",
    constraints: ["1 <= s.length <= 10^5", "s consists of only lowercase English letters."],
    examples: [
      { input: 's = "leetcode"', output: "0" },
      { input: 's = "loveleetcode"', output: "2" },
      { input: 's = "aabb"', output: "-1" }
    ]
  },
  {
    title: "Bitwise XOR Extra Letter Finder",
    slug: "find-the-difference",
    difficulty: "Easy",
    points: 3,
    tags: ["Hash Table", "String", "Bit Manipulation", "Sorting", "LC-389"],
    description: "You are given two strings s and t. String t is generated by random shuffling string s and then adding one more letter at a random position. Return the letter that was added to t.",
    constraints: ["0 <= s.length <= 1000", "t.length == s.length + 1", "s and t consist of lowercase English letters."],
    examples: [
      { input: 's = "abcd", t = "abcde"', output: '"e"' },
      { input: 's = "", t = "y"', output: '"y"' }
    ]
  },
  {
    title: "Two-Pointer Subsequence Verification",
    slug: "is-subsequence",
    difficulty: "Easy",
    points: 3,
    tags: ["Two Pointers", "String", "Dynamic Programming", "LC-392"],
    description: "Given two strings s and t, return true if s is a subsequence of t, or false otherwise. A subsequence is formed from the original string by deleting some (can be none) characters without disturbing relative order.",
    constraints: ["0 <= s.length <= 100", "0 <= t.length <= 10^4", "s and t consist only of lowercase English letters."],
    examples: [
      { input: 's = "abc", t = "ahbgdc"', output: "true" },
      { input: 's = "axc", t = "ahbgdc"', output: "false" }
    ]
  },
  {
    title: "Maximum Palindrome Length from Char Set",
    slug: "longest-palindrome",
    difficulty: "Easy",
    points: 3,
    tags: ["Hash Table", "String", "Greedy", "LC-409"],
    description: "Given a string s which consists of lowercase or uppercase letters, return the length of the longest palindrome that can be built with those letters. Case sensitive.",
    constraints: ["1 <= s.length <= 2000", "s consists of lowercase and/or uppercase English letters only."],
    examples: [
      { input: 's = "abccccdd"', output: "7", explanation: "One longest palindrome that can be built is 'dccaccd', whose length is 7." },
      { input: 's = "a"', output: "1" }
    ]
  },
  {
    title: "FizzBuzz Game Sequence",
    slug: "fizz-buzz",
    difficulty: "Easy",
    points: 3,
    tags: ["Math", "String", "Simulation", "LC-412"],
    description: "Given an integer n, return a string array answer (1-indexed) where: answer[i] == 'FizzBuzz' if i is divisible by 3 and 5, 'Fizz' if by 3, 'Buzz' if by 5, and i as string otherwise.",
    constraints: ["1 <= n <= 10^4"],
    examples: [
      { input: "n = 3", output: '["1","2","Fizz"]' },
      { input: "n = 5", output: '["1","2","Fizz","4","Buzz"]' },
      { input: "n = 15", output: '["1","2","Fizz","4","Buzz","Fizz","7","8","Fizz","Buzz","11","Fizz","13","14","FizzBuzz"]' }
    ]
  },
  {
    title: "Big Integer String Digit Addition",
    slug: "add-strings",
    difficulty: "Easy",
    points: 3,
    tags: ["Math", "String", "Simulation", "LC-415"],
    description: "Given two non-negative integers, num1 and num2 represented as string, return the sum of num1 and num2 as a string. You must not use any built-in BigInteger library or convert directly to integer.",
    constraints: ["1 <= num1.length, num2.length <= 10^4", "num1 and num2 consist of only digits.", "No leading zero except '0' itself."],
    examples: [
      { input: 'num1 = "11", num2 = "123"', output: '"134"' },
      { input: 'num1 = "456", num2 = "77"', output: '"533"' }
    ]
  },
  {
    title: "Whitespace Delimited Segment Counter",
    slug: "number-of-segments-in-a-string",
    difficulty: "Easy",
    points: 3,
    tags: ["String", "LC-434"],
    description: "Given a string s, return the number of segments in the string. A segment is defined to be a contiguous sequence of non-space characters.",
    constraints: ["0 <= s.length <= 300", "s consists of lowercase and uppercase English letters, digits, or spaces."],
    examples: [
      { input: 's = "Hello, my name is John"', output: "5" },
      { input: 's = "Hello"', output: "1" },
      { input: 's = ""', output: "0" }
    ]
  },
  {
    title: "Periodic Substring Pattern Match",
    slug: "repeated-substring-pattern",
    difficulty: "Easy",
    points: 3,
    tags: ["String", "String Matching", "LC-459"],
    description: "Given a string s, check if it can be constructed by taking a substring of it and appending multiple copies of the substring together in O(n) time.",
    constraints: ["1 <= s.length <= 10^4", "s consists of lowercase English letters."],
    examples: [
      { input: 's = "abab"', output: "true", explanation: "Constructed by 'ab' twice." },
      { input: 's = "aba"', output: "false" },
      { input: 's = "abcabcabcabc"', output: "true" }
    ]
  },
  {
    title: "Single Qwerty Keyboard Row Words",
    slug: "keyboard-row",
    difficulty: "Easy",
    points: 3,
    tags: ["Array", "Hash Table", "String", "LC-500"],
    description: "Given an array of strings words, return the words that can be typed using letters of the alphabet on only one row of American English QWERTY keyboard.",
    constraints: ["1 <= words.length <= 20", "1 <= words[i].length <= 100", "words[i] consists of English letters (both lowercase and uppercase)."],
    examples: [
      { input: 'words = ["Hello","Alaska","Dad","Peace"]', output: '["Alaska","Dad"]' },
      { input: 'words = ["omk"]', output: '[]' }
    ]
  },
  {
    title: "Capitalization Grammar Rules Validator",
    slug: "detect-capital",
    difficulty: "Easy",
    points: 3,
    tags: ["String", "LC-520"],
    description: "We define the usage of capitals in a word to be right when: all letters are capitals ('USA'), all letters are lowercase ('leetcode'), or only the first letter is capital ('Google'). Return true if capitalization is valid.",
    constraints: ["1 <= word.length <= 100", "word consists of lowercase and uppercase English letters."],
    examples: [
      { input: 'word = "USA"', output: "true" },
      { input: 'word = "FlaG"', output: "false" },
      { input: 'word = "leetcode"', output: "true" }
    ]
  },
  {
    title: "Longest Distinct Subsequence Length",
    slug: "longest-uncommon-subsequence-i",
    difficulty: "Easy",
    points: 3,
    tags: ["String", "LC-521"],
    description: "Given two strings a and b, return the length of the longest uncommon subsequence between a and b. If no such subsequence exists, return -1.",
    constraints: ["1 <= a.length, b.length <= 100", "a and b consist of lowercase English letters."],
    examples: [
      { input: 'a = "aba", b = "cdc"', output: "3" },
      { input: 'a = "aaa", b = "a"', output: "3" },
      { input: 'a = "aaa", b = "aaa"', output: "-1" }
    ]
  },
  {
    title: "Block Reversal in 2k Chunks",
    slug: "reverse-string-ii",
    difficulty: "Easy",
    points: 3,
    tags: ["Two Pointers", "String", "LC-541"],
    description: "Given a string s and an integer k, reverse the first k characters for every 2k characters counting from the start of the string. If fewer than k characters remain, reverse all of them.",
    constraints: ["1 <= s.length <= 10^4", "s consists of only lowercase English letters.", "1 <= k <= 10^4"],
    examples: [
      { input: 's = "abcdefg", k = 2', output: '"bacdfeg"' },
      { input: 's = "abcd", k = 2', output: '"bacd"' }
    ]
  },
  {
    title: "Absence and Late Attendance Compliance",
    slug: "student-attendance-record-i",
    difficulty: "Easy",
    points: 3,
    tags: ["String", "LC-551"],
    description: "You are given a string s representing an attendance record for a student ('A': Absent, 'L': Late, 'P': Present). The student is eligible for an attendance award if they have strictly fewer than 2 'A's and no 3 or more consecutive 'L's.",
    constraints: ["1 <= s.length <= 1000", "s[i] is either 'A', 'L', or 'P'."],
    examples: [
      { input: 's = "PPALLP"', output: "true" },
      { input: 's = "PPALLL"', output: "false" }
    ]
  },
  {
    title: "Invert Individual Words Preserving Spaces",
    slug: "reverse-words-in-a-string-iii",
    difficulty: "Easy",
    points: 3,
    tags: ["Two Pointers", "String", "LC-557"],
    description: "Given a string s, reverse the order of characters in each word within a sentence while still preserving whitespace and initial word order.",
    constraints: ["1 <= s.length <= 5 * 10^4", "s contains printable ASCII characters.", "s does not contain any leading or trailing spaces.", "Words are separated by a single space."],
    examples: [
      { input: 's = "Let\'s take LeetCode contest"', output: '"s\'teL ekat edoCteeL tsetnoc"' },
      { input: 's = "Mr Ding"', output: '"rM gniD"' }
    ]
  },
  {
    title: "2D Grid Robot Net Displacement",
    slug: "robot-return-to-origin",
    difficulty: "Easy",
    points: 3,
    tags: ["String", "Simulation", "LC-657"],
    description: "There is a robot starting at position (0, 0). Given a string moves representing a sequence of robot moves ('R', 'L', 'U', 'D'), determine if the robot returns to origin (0, 0) after completing all moves.",
    constraints: ["1 <= moves.length <= 2 * 10^4", "moves only contains characters 'U', 'D', 'L', and 'R'."],
    examples: [
      { input: 'moves = "UD"', output: "true" },
      { input: 'moves = "LL"', output: "false" }
    ]
  },
  {
    title: "Palindrome Verification with At Most One Deletion",
    slug: "valid-palindrome-ii",
    difficulty: "Easy",
    points: 3,
    tags: ["Two Pointers", "String", "Greedy", "LC-680"],
    description: "Given a string s, return true if the s can be palindrome after deleting at most one character from it.",
    constraints: ["1 <= s.length <= 10^5", "s consists of lowercase English letters."],
    examples: [
      { input: 's = "aba"', output: "true" },
      { input: 's = "abca"', output: "true", explanation: "Delete 'c' to get 'aba'." },
      { input: 's = "abc"', output: "false" }
    ]
  },
  {
    title: "ASCII Manual Lowercase Converter",
    slug: "to-lower-case",
    difficulty: "Easy",
    points: 3,
    tags: ["String", "LC-709"],
    description: "Given a string s, return the string after replacing every uppercase letter with the corresponding lowercase letter without using built-in string lowercase shortcuts.",
    constraints: ["1 <= s.length <= 100", "s consists of printable ASCII characters."],
    examples: [
      { input: 's = "Hello"', output: '"hello"' },
      { input: 's = "here"', output: '"here"' },
      { input: 's = "LOVELY"', output: '"lovely"' }
    ]
  },
  {
    title: "Jewel Counter in Stone Collection",
    slug: "jewels-and-stones",
    difficulty: "Easy",
    points: 3,
    tags: ["Hash Table", "String", "LC-771"],
    description: "You're given strings jewels representing the types of stones that are jewels, and stones representing the stones you have. Each character in stones is a type of stone you have. Find how many stones you have that are also jewels.",
    constraints: ["1 <= jewels.length, stones.length <= 50", "jewels and stones consist of only English letters.", "All the characters of jewels are unique."],
    examples: [
      { input: 'jewels = "aA", stones = "aAAbbbb"', output: "3" },
      { input: 'jewels = "z", stones = "ZZ"', output: "0" }
    ]
  },
  {
    title: "Circular String Shift Equality",
    slug: "rotate-string",
    difficulty: "Easy",
    points: 3,
    tags: ["String", "String Matching", "LC-796"],
    description: "Given two strings s and goal, return true if and only if s can become goal after some number of cyclic shifts on s (moving leftmost char to rightmost position).",
    constraints: ["1 <= s.length, goal.length <= 100", "s and goal consist of lowercase English letters."],
    examples: [
      { input: 's = "abcde", goal = "cdeab"', output: "true" },
      { input: 's = "abcde", goal = "abced"', output: "false" }
    ]
  },
  {
    title: "Distinct Morse Code Representation Count",
    slug: "unique-morse-code-words",
    difficulty: "Easy",
    points: 3,
    tags: ["Array", "Hash Table", "String", "LC-804"],
    description: "Given an array of strings words where each word can be written as a concatenation of the Morse code of each letter, return the number of different transformations among all words we have.",
    constraints: ["1 <= words.length <= 100", "1 <= words[i].length <= 12", "words[i] consists of lowercase English letters."],
    examples: [
      { input: 'words = ["gin","zen","gig","msg"]', output: "2" },
      { input: 'words = ["a"]', output: "1" }
    ]
  },
  {
    title: "Goat Latin Word Transformer",
    slug: "goat-latin",
    difficulty: "Easy",
    points: 3,
    tags: ["String", "LC-824"],
    description: "Transform sentence to Goat Latin rules: vowel words append 'ma', consonant words shift first letter to end and append 'ma', and append 'a' repeated based on word index (1-based).",
    constraints: ["1 <= sentence.length <= 150", "sentence consists of English letters and spaces.", "sentence has no leading or trailing spaces."],
    examples: [
      { input: 'sentence = "I speak Goat Latin"', output: '"Imaa speaksmaaa oatGmaaaa atinLmaaaaa"' }
    ]
  },
  {
    title: "Two-Pointer Backspace Character Simulation",
    slug: "backspace-string-compare",
    difficulty: "Easy",
    points: 3,
    tags: ["Two Pointers", "String", "Stack", "Simulation", "LC-844"],
    description: "Given two strings s and t, return true if they are equal when both are typed into empty text editors. '#' means a backspace character. Solve in O(n) time and O(1) space.",
    constraints: ["1 <= s.length, t.length <= 200", "s and t only contain lowercase letters and '#' characters."],
    examples: [
      { input: 's = "ab#c", t = "ad#c"', output: "true", explanation: "Both become 'ac'." },
      { input: 's = "ab##", t = "c#d#"', output: "true", explanation: "Both become ''." },
      { input: 's = "a#c", t = "b"', output: "false" }
    ]
  },
  {
    title: "Single Swap String Identity Check",
    slug: "buddy-strings",
    difficulty: "Easy",
    points: 3,
    tags: ["Hash Table", "String", "LC-859"],
    description: "Given two strings s and goal, return true if you can swap two letters in s so the result is equal to goal, else false. Swapping consists of taking two indices i and j (0-indexed) such that i != j and swapping s[i] and s[j].",
    constraints: ["1 <= s.length, goal.length <= 2 * 10^4", "s and goal consist of lowercase letters."],
    examples: [
      { input: 's = "ab", goal = "ba"', output: "true" },
      { input: 's = "ab", goal = "ab"', output: "false" },
      { input: 's = "aa", goal = "aa"', output: "true" }
    ]
  },
  {
    title: "Letter-Only Reverse Preserving Punctuation",
    slug: "reverse-only-letters",
    difficulty: "Easy",
    points: 3,
    tags: ["Two Pointers", "String", "LC-917"],
    description: "Given a string s, reverse the string according to the following rules: all characters that are not English letters remain in the same position, and all English letters reverse order.",
    constraints: ["1 <= s.length <= 100", "s consists of characters with ASCII values in the range [33, 122]."],
    examples: [
      { input: 's = "ab-cd"', output: '"dc-ba"' },
      { input: 's = "a-bC-dEf-ghIj"', output: '"j-Ih-gfE-dCba"' }
    ]
  },
  {
    title: "Email Normalization with Dots and Pluses",
    slug: "unique-email-addresses",
    difficulty: "Easy",
    points: 3,
    tags: ["Array", "Hash Table", "String", "LC-929"],
    description: "Every valid email consists of a local name and domain name separated by '@'. In local name, '.' are ignored, and anything after '+' is dropped. Return the number of different addresses that actually receive mail.",
    constraints: ["1 <= emails.length <= 100", "1 <= emails[i].length <= 100", "emails[i] consist of lowercase English letters, '+', '.', and '@'."],
    examples: [
      { input: 'emails = ["test.email+alex@leetcode.com","test.e.mail+bob.cathy@leetcode.com","testemail+david@lee.tcode.com"]', output: "2" }
    ]
  },
  {
    title: "Stack-Based Adjacent Duplicate Elimination",
    slug: "remove-all-adjacent-duplicates-in-string",
    difficulty: "Easy",
    points: 3,
    tags: ["String", "Stack", "LC-1047"],
    description: "You are given a string s consisting of lowercase English letters. A duplicate removal consists of choosing two adjacent and equal letters and removing them. Repeatedly make duplicate removals until no more can be done.",
    constraints: ["1 <= s.length <= 10^5", "s consists of lowercase English letters."],
    examples: [
      { input: 's = "abbaca"', output: '"ca"', explanation: "Remove 'bb' -> 'aaca', remove 'aa' -> 'ca'." },
      { input: 's = "azxxzy"', output: '"ay"' }
    ]
  },
  {
    title: "Euclidean String GCD Prefix",
    slug: "greatest-common-divisor-of-strings",
    difficulty: "Easy",
    points: 3,
    tags: ["Math", "String", "LC-1071"],
    description: "For two strings s and t, we say 't divides s' if and only if s = t + t + ... + t. Given two strings str1 and str2, return the largest string x such that x divides both str1 and str2.",
    constraints: ["1 <= str1.length, str2.length <= 1000", "str1 and str2 consist of English uppercase letters."],
    examples: [
      { input: 'str1 = "ABCABC", str2 = "ABC"', output: '"ABC"' },
      { input: 'str1 = "ABABAB", str2 = "ABAB"', output: '"AB"' },
      { input: 'str1 = "LEET", str2 = "CODE"', output: '""' }
    ]
  },
  {
    title: "Dot Defanging in IPv4 Address",
    slug: "defanging-an-ip-address",
    difficulty: "Easy",
    points: 3,
    tags: ["String", "LC-1108"],
    description: "Given a valid (IPv4) IP address, return a defanged version of that IP address. A defanged IP address replaces every period '.' with '[.]'.",
    constraints: ["The given address is a valid IPv4 address."],
    examples: [
      { input: 'address = "1.1.1.1"', output: '"1[.]1[.]1[.]1"' },
      { input: 'address = "255.100.50.0"', output: '"255[.]100[.]50[.]0"' }
    ]
  },
  {
    title: "String Array Concatenation Equality",
    slug: "check-if-two-string-arrays-are-equivalent",
    difficulty: "Easy",
    points: 3,
    tags: ["Array", "String", "Two Pointers", "LC-1662"],
    description: "Given two string arrays word1 and word2, return true if the two arrays represent the same string, and false otherwise. A string is represented by an array if the array elements concatenated in order form the string.",
    constraints: ["1 <= word1.length, word2.length <= 10^3", "1 <= word1[i].length, word2[i].length <= 10^3", "words consist of lowercase letters."],
    examples: [
      { input: 'word1 = ["ab", "c"], word2 = ["a", "bc"]', output: "true" },
      { input: 'word1 = ["a", "cb"], word2 = ["ab", "c"]', output: "false" }
    ]
  },
  {
    title: "Goal Alphabet Command Decoder",
    slug: "goal-parser-interpretation",
    difficulty: "Easy",
    points: 3,
    tags: ["String", "LC-1678"],
    description: "You own a Goal Parser that can interpret a string command consisting of the alphabet 'G', '()' and/or '(al)' in some order. The Goal Parser will interpret 'G' as string 'G', '()' as 'o', and '(al)' as 'al'. Return the interpreted string.",
    constraints: ["1 <= command.length <= 100", "command consists of 'G', '()', and/or '(al)' in some order."],
    examples: [
      { input: 'command = "G()(al)"', output: '"Goal"' },
      { input: 'command = "G()()()()(al)"', output: '"Gooooal"' }
    ]
  },
  {
    title: "Alternating Character String Zip",
    slug: "merge-strings-alternately",
    difficulty: "Easy",
    points: 3,
    tags: ["Two Pointers", "String", "LC-1768"],
    description: "You are given two strings word1 and word2. Merge the strings by adding letters in alternating order, starting with word1. If a string is longer than the other, append the additional letters onto the end of the merged string.",
    constraints: ["1 <= word1.length, word2.length <= 100", "word1 and word2 consist of lowercase English letters."],
    examples: [
      { input: 'word1 = "abc", word2 = "pqr"', output: '"apbqcr"' },
      { input: 'word1 = "ab", word2 = "pqrs"', output: '"apbqrs"' }
    ]
  },
  {
    title: "Extract First K Words in Sentence",
    slug: "truncate-sentence",
    difficulty: "Easy",
    points: 3,
    tags: ["Array", "String", "LC-1816"],
    description: "A sentence is a list of words that are separated by a single space with no leading or trailing spaces. You are given a sentence s and an integer k. Truncate s such that it contains only the first k words.",
    constraints: ["s consists of only lowercase and uppercase English letters and spaces.", "1 <= k <= number of words in s."],
    examples: [
      { input: 's = "Hello how are you Contestant", k = 4', output: '"Hello how are you"' },
      { input: 's = "What is the solution to this problem", k = 4', output: '"What is the solution"' }
    ]
  },
  {
    title: "Reorder Sentence by Appended Word Numbers",
    slug: "sorting-the-sentence",
    difficulty: "Easy",
    points: 3,
    tags: ["String", "Sorting", "LC-1859"],
    description: "A sentence can be shuffled by appending the 1-indexed word position to each word then rearranging the words. Given a shuffled sentence s containing no more than 9 words, reconstruct and return the original sentence.",
    constraints: ["2 <= s.length <= 200", "s consists of words separated by single spaces.", "The number of words in s is between 1 and 9."],
    examples: [
      { input: 's = "is2 sentence4 This1 a3"', output: '"This is a sentence"' },
      { input: 's = "Myself2 Me1 I4 and3"', output: '"Me Myself and I"' }
    ]
  },
  {
    title: "Invert Substring Up to Target Character",
    slug: "reverse-prefix-of-word",
    difficulty: "Easy",
    points: 3,
    tags: ["Two Pointers", "String", "LC-2000"],
    description: "Given a 0-indexed string word and a character ch, reverse the segment of word that starts at index 0 and ends at the index of the first occurrence of ch (inclusive). If the character ch does not exist, do nothing.",
    constraints: ["1 <= word.length <= 250", "word consists of lowercase English letters.", "ch is a lowercase English letter."],
    examples: [
      { input: 'word = "abcdefd", ch = "d"', output: '"dcbaefd"' },
      { input: 'word = "xyxzxe", ch = "z"', output: '"zxyxxe"' }
    ]
  },

  // --- Trees & Graphs ---
  {
    title: "Sum of All Left Leaf Values in Binary Tree",
    slug: "sum-of-left-leaves",
    difficulty: "Easy",
    points: 3,
    tags: ["Tree", "Depth-First Search", "Breadth-First Search", "Binary Tree", "LC-404"],
    description: "Given the root of a binary tree, return the sum of all left leaves (a leaf that is the left child of its parent with no children).",
    constraints: ["The number of nodes in the tree is in the range [1, 1000]", "-1000 <= Node.val <= 1000"],
    examples: [
      { input: "root = [3,9,20,null,null,15,7]", output: "24", explanation: "9 and 15 are left leaves, 9 + 15 = 24." },
      { input: "root = [1]", output: "0" }
    ]
  },
  {
    title: "Most Frequent Elements in BST",
    slug: "find-mode-in-binary-search-tree",
    difficulty: "Easy",
    points: 3,
    tags: ["Tree", "Depth-First Search", "Binary Search Tree", "Binary Tree", "LC-501"],
    description: "Given the root of a binary search tree (BST) with duplicates, return all the mode(s) (i.e., the most frequently occurred element) in it. If more than one mode exists, return in any order.",
    constraints: ["The number of nodes is in range [1, 10^4]", "-10^5 <= Node.val <= 10^5"],
    examples: [
      { input: "root = [1,null,2,2]", output: "[2]" },
      { input: "root = [0]", output: "[0]" }
    ]
  },
  {
    title: "Smallest Node Value Difference in BST",
    slug: "minimum-absolute-difference-in-bst",
    difficulty: "Easy",
    points: 3,
    tags: ["Tree", "Depth-First Search", "Breadth-First Search", "Binary Search Tree", "Binary Tree", "LC-530"],
    description: "Given the root of a Binary Search Tree (BST), return the minimum absolute difference between the values of any two different nodes in the tree.",
    constraints: ["The number of nodes is in the range [2, 10^4]", "0 <= Node.val <= 10^5"],
    examples: [
      { input: "root = [4,2,6,1,3]", output: "1" },
      { input: "root = [1,0,48,null,null,12,49]", output: "1" }
    ]
  },
  {
    title: "Longest Path Between Any Two Nodes in Tree",
    slug: "diameter-of-binary-tree",
    difficulty: "Easy",
    points: 3,
    tags: ["Tree", "Depth-First Search", "Binary Tree", "LC-543"],
    description: "Given the root of a binary tree, return the length of the diameter of the tree. The diameter of a binary tree is the length of the longest path between any two nodes in a tree. This path may or may not pass through the root.",
    constraints: ["The number of nodes is in range [1, 10^4]", "-100 <= Node.val <= 100"],
    examples: [
      { input: "root = [1,2,3,4,5]", output: "3", explanation: "Path [4,2,1,3] or [5,2,1,3] has 3 edges." },
      { input: "root = [1,2]", output: "1" }
    ]
  },
  {
    title: "Total Subtree Sum Absolute Difference Tilt",
    slug: "binary-tree-tilt",
    difficulty: "Easy",
    points: 3,
    tags: ["Tree", "Depth-First Search", "Binary Tree", "LC-563"],
    description: "Given the root of a binary tree, return the sum of every tree node's tilt. The tilt of a tree node is the absolute difference between the sum of all left subtree node values and all right subtree node values.",
    constraints: ["The number of nodes is in range [0, 10^4]", "-1000 <= Node.val <= 1000"],
    examples: [
      { input: "root = [1,2,3]", output: "1" },
      { input: "root = [4,2,9,3,5,null,7]", output: "15" }
    ]
  },
  {
    title: "Subtree Structural and Value Match",
    slug: "subtree-of-another-tree",
    difficulty: "Easy",
    points: 3,
    tags: ["Tree", "Depth-First Search", "String Matching", "Binary Tree", "Hash Function", "LC-572"],
    description: "Given the roots of two binary trees root and subRoot, return true if there is a subtree of root with the same structure and node values of subRoot and false otherwise.",
    constraints: ["The number of nodes in root is in [1, 2000]", "The number of nodes in subRoot is in [1, 1000]", "-10^4 <= Node.val <= 10^4"],
    examples: [
      { input: "root = [3,4,5,1,2], subRoot = [4,1,2]", output: "true" },
      { input: "root = [3,4,5,1,2,null,null,null,null,0], subRoot = [4,1,2]", output: "false" }
    ]
  },
  {
    title: "Recursive Overlapping Tree Node Sum",
    slug: "merge-two-binary-trees",
    difficulty: "Easy",
    points: 3,
    tags: ["Tree", "Depth-First Search", "Breadth-First Search", "Binary Tree", "LC-617"],
    description: "You are given two binary trees root1 and root2. Merge them into a single binary tree: if two nodes overlap, their sum becomes the new node's value; otherwise, the non-null node will be used.",
    constraints: ["The number of nodes in both trees is in range [0, 2000]", "-10^4 <= Node.val <= 10^4"],
    examples: [
      { input: "root1 = [1,3,2,5], root2 = [2,1,3,null,4,null,7]", output: "[3,4,5,5,4,null,7]" },
      { input: "root1 = [1], root2 = [1,2]", output: "[2,2]" }
    ]
  },
  {
    title: "BFS Level-by-Level Value Averages",
    slug: "average-of-levels-in-binary-tree",
    difficulty: "Easy",
    points: 3,
    tags: ["Tree", "Depth-First Search", "Breadth-First Search", "Binary Tree", "LC-637"],
    description: "Given the root of a binary tree, return the average value of the nodes on each level in the form of an array. Answers within 10^-5 of the actual answer will be accepted.",
    constraints: ["The number of nodes in the tree is in range [1, 10^4]", "-2^31 <= Node.val <= 2^31 - 1"],
    examples: [
      { input: "root = [3,9,20,null,null,15,7]", output: "[3.00000,14.50000,11.00000]" },
      { input: "root = [3,9,20,15,7]", output: "[3.00000,14.50000,11.00000]" }
    ]
  },
  {
    title: "Target Sum Pair in Binary Search Tree",
    slug: "two-sum-iv-input-is-a-bst",
    difficulty: "Easy",
    points: 3,
    tags: ["Tree", "Depth-First Search", "Breadth-First Search", "Binary Search Tree", "Two Pointers", "LC-653"],
    description: "Given the root of a binary search tree and an integer k, return true if there exist two elements in the BST such that their sum is equal to k, or false otherwise.",
    constraints: ["The number of nodes in the tree is in range [1, 10^4]", "-10^4 <= Node.val <= 10^4", "root is guaranteed to be a valid BST.", "-10^5 <= k <= 10^5"],
    examples: [
      { input: "root = [5,3,6,2,4,null,7], k = 9", output: "true" },
      { input: "root = [5,3,6,2,4,null,7], k = 28", output: "false" }
    ]
  },
  {
    title: "Locate Subtree Root in BST",
    slug: "search-in-a-binary-search-tree",
    difficulty: "Easy",
    points: 3,
    tags: ["Tree", "Binary Search Tree", "Binary Tree", "LC-700"],
    description: "You are given the root of a binary search tree (BST) and an integer val. Find the node in the BST that the node's value equals val and return the subtree rooted with that node. If such a node does not exist, return null.",
    constraints: ["The number of nodes in the tree is in range [1, 5000]", "1 <= Node.val <= 10^7", "root is a valid BST."],
    examples: [
      { input: "root = [4,2,7,1,3], val = 2", output: "[2,1,3]" },
      { input: "root = [4,2,7,1,3], val = 5", output: "[]" }
    ]
  },
  {
    title: "Min-Heap Kth Highest Element Tracker",
    slug: "kth-largest-element-in-a-stream",
    difficulty: "Easy",
    points: 3,
    tags: ["Tree", "Design", "Binary Search Tree", "Heap", "Binary Tree", "Data Stream", "LC-703"],
    description: "Design a class to find the kth largest element in a stream. Note that it is the kth largest element in the sorted order, not the kth distinct element. Implement KthLargest(k, nums) and add(val).",
    constraints: ["1 <= k <= 10^4", "0 <= nums.length <= 10^4", "-10^4 <= nums[i], val <= 10^4", "At most 10^4 calls will be made to add."],
    examples: [
      { input: 'KthLargest(3, [4, 5, 8, 2]); add(3); add(5); add(10); add(9); add(4);', output: '[null, 4, 5, 5, 8, 8]' }
    ]
  },
  {
    title: "Identical Leaf Sequence Verification",
    slug: "leaf-similar-trees",
    difficulty: "Easy",
    points: 3,
    tags: ["Tree", "Depth-First Search", "Binary Tree", "LC-872"],
    description: "Consider all the leaves of a binary tree, from left to right order, the values of those leaves form a leaf value sequence. Return true if and only if two given trees with head nodes root1 and root2 are leaf-similar.",
    constraints: ["The number of nodes in each tree will be in range [1, 200]", "0 <= Node.val <= 200"],
    examples: [
      { input: "root1 = [3,5,1,6,2,9,8,null,null,7,4], root2 = [3,5,1,6,7,4,2,null,null,null,null,null,null,9,8]", output: "true" }
    ]
  },
  {
    title: "Pruned In-Range BST Sum",
    slug: "range-sum-of-bst",
    difficulty: "Easy",
    points: 3,
    tags: ["Tree", "Depth-First Search", "Binary Search Tree", "Binary Tree", "LC-938"],
    description: "Given the root node of a binary search tree and two integers low and high, return the sum of values of all nodes with a value in the inclusive range [low, high] leveraging BST pruning.",
    constraints: ["The number of nodes is in range [1, 2 * 10^4]", "1 <= Node.val <= 10^5", "1 <= low <= high <= 10^5", "All Node.val are unique."],
    examples: [
      { input: "root = [10,5,15,3,7,null,18], low = 7, high = 15", output: "32", explanation: "7 + 10 + 15 = 32." },
      { input: "root = [10,5,15,3,7,13,18,1,null,6], low = 6, high = 10", output: "23" }
    ]
  },
  {
    title: "Verify Single Value in Binary Tree",
    slug: "univalued-binary-tree",
    difficulty: "Easy",
    points: 3,
    tags: ["Tree", "Depth-First Search", "Breadth-First Search", "Binary Tree", "LC-965"],
    description: "A binary tree is uni-valued if every node in the tree has the same value. Given the root of a binary tree, return true if the given tree is uni-valued, or false otherwise.",
    constraints: ["The number of nodes in the tree is in range [1, 100]", "0 <= Node.val < 100"],
    examples: [
      { input: "root = [1,1,1,1,1,null,1]", output: "true" },
      { input: "root = [2,2,2,5,2]", output: "false" }
    ]
  },
  {
    title: "Same Level Different Parent Tree Cousins",
    slug: "cousins-in-binary-tree",
    difficulty: "Easy",
    points: 3,
    tags: ["Tree", "Depth-First Search", "Breadth-First Search", "Binary Tree", "LC-993"],
    description: "Given the root of a binary tree with unique values and integers x and y, return true if the nodes corresponding to x and y are cousins (i.e. they have the same depth with different parents).",
    constraints: ["The number of nodes in the tree is in range [2, 100]", "1 <= Node.val <= 100", "Each node has a unique value."],
    examples: [
      { input: "root = [1,2,3,4], x = 4, y = 3", output: "false" },
      { input: "root = [1,2,3,null,4,null,5], x = 5, y = 4", output: "true" }
    ]
  },
  {
    title: "Directed Graph Trusted Judge Node",
    slug: "find-the-town-judge",
    difficulty: "Easy",
    points: 3,
    tags: ["Array", "Hash Table", "Graph", "LC-997"],
    description: "In a town of n people labeled from 1 to n, there is a rumor that one is the secret judge. The judge trusts nobody, but everybody trusts the judge. Given array trust where trust[i] = [ai, bi], return label of the judge, or -1.",
    constraints: ["1 <= n <= 1000", "0 <= trust.length <= 10^4", "trust[i].length == 2", "ai != bi"],
    examples: [
      { input: "n = 2, trust = [[1,2]]", output: "2" },
      { input: "n = 3, trust = [[1,3],[2,3]]", output: "3" },
      { input: "n = 3, trust = [[1,3],[2,3],[3,1]]", output: "-1" }
    ]
  },
  {
    title: "Radial Central Node in Star Graph",
    slug: "find-center-of-star-graph",
    difficulty: "Easy",
    points: 3,
    tags: ["Graph", "LC-1791"],
    description: "There is an undirected star graph consisting of n nodes labeled from 1 to n with a center connected to every other node. Given edges where edges[i] = [ui, vi], return the center of the star graph in O(1) time.",
    constraints: ["3 <= n <= 10^5", "edges.length == n - 1", "edges[i].length == 2", "The given edges represent a valid star graph."],
    examples: [
      { input: "edges = [[1,2],[2,3],[4,2]]", output: "2", explanation: "Node 2 is connected to all other nodes." },
      { input: "edges = [[1,2],[5,1],[1,3],[1,4]]", output: "1" }
    ]
  },

  // --- Math, Bits & Dynamic Programming ---
  {
    title: "Determine If Integer Is Power of 3",
    slug: "power-of-three",
    difficulty: "Easy",
    points: 3,
    tags: ["Math", "Recursion", "LC-326"],
    description: "Given an integer n, return true if it is a power of three. Otherwise, return false. An integer n is a power of three, if there exists an integer x such that n == 3^x.",
    constraints: ["-2^31 <= n <= 2^31 - 1"],
    followUp: "Could you solve it without loops/recursion using max 32-bit power 1162261467?",
    examples: [
      { input: "n = 27", output: "true" },
      { input: "n = 0", output: "false" },
      { input: "n = -1", output: "false" }
    ]
  },
  {
    title: "Determine If Integer Is Power of 4",
    slug: "power-of-four",
    difficulty: "Easy",
    points: 3,
    tags: ["Math", "Bit Manipulation", "Recursion", "LC-342"],
    description: "Given an integer n, return true if it is a power of four. Otherwise, return false. An integer n is a power of four, if there exists an integer x such that n == 4^x.",
    constraints: ["-2^31 <= n <= 2^31 - 1"],
    followUp: "Could you solve it without loops/recursion using bit masks?",
    examples: [
      { input: "n = 16", output: "true" },
      { input: "n = 5", output: "false" },
      { input: "n = 1", output: "true" }
    ]
  },
  {
    title: "Binary Search Integer Perfect Square",
    slug: "valid-perfect-square",
    difficulty: "Easy",
    points: 3,
    tags: ["Math", "Binary Search", "LC-367"],
    description: "Given a positive integer num, return true if num is a perfect square or false otherwise. A perfect square is an integer that is the square of an integer. Do not use any built-in sqrt library function.",
    constraints: ["1 <= num <= 2^31 - 1"],
    examples: [
      { input: "num = 16", output: "true" },
      { input: "num = 14", output: "false" }
    ]
  },
  {
    title: "Binary Search Guess Feedback Game",
    slug: "guess-number-higher-or-lower",
    difficulty: "Easy",
    points: 3,
    tags: ["Binary Search", "Interactive", "LC-374"],
    description: "We are playing the Guess Game. I pick a number from 1 to n. You call a pre-defined API guess(int num) which returns -1 (my number is lower), 1 (my number is higher), or 0 (you got it). Find the picked number in O(log n).",
    constraints: ["1 <= n <= 2^31 - 1", "1 <= pick <= n"],
    examples: [
      { input: "n = 10, pick = 6", output: "6" },
      { input: "n = 1, pick = 1", output: "1" }
    ]
  },
  {
    title: "Two's Complement Hexadecimal String",
    slug: "convert-a-number-to-hexadecimal",
    difficulty: "Easy",
    points: 3,
    tags: ["Math", "Bit Manipulation", "LC-405"],
    description: "Given an integer num, return a string representing its hexadecimal representation. For negative integers, two's complement method is used. All letters must be lowercase, and no leading zeroes except for '0' itself.",
    constraints: ["-2^31 <= num <= 2^31 - 1"],
    examples: [
      { input: "num = 26", output: '"1a"' },
      { input: "num = -1", output: '"ffffffff"' }
    ]
  },
  {
    title: "Complete Coin Staircase Rows",
    slug: "arranging-coins",
    difficulty: "Easy",
    points: 3,
    tags: ["Math", "Binary Search", "LC-441"],
    description: "You have n coins and you want to build a staircase where the k-th row has exactly k coins. The last row may be incomplete. Return the number of complete rows of the staircase you will build.",
    constraints: ["1 <= n <= 2^31 - 1"],
    examples: [
      { input: "n = 5", output: "2", explanation: "Row 1: 1 coin, Row 2: 2 coins. Total 3 coins used, 2 remaining which is not enough for row 3." },
      { input: "n = 8", output: "3" }
    ]
  },
  {
    title: "Greedy Cookie Size Satisfaction",
    slug: "assign-cookies",
    difficulty: "Easy",
    points: 3,
    tags: ["Array", "Two Pointers", "Greedy", "Sorting", "LC-455"],
    description: "Assume you are an awesome parent and want to give your children some cookies. Each child i has greed factor g[i], and each cookie j has size s[j]. If s[j] >= g[i], child i is content. Maximize the number of content children.",
    constraints: ["1 <= g.length <= 3 * 10^4", "0 <= s.length <= 3 * 10^4", "1 <= g[i], s[j] <= 2^31 - 1"],
    examples: [
      { input: "g = [1,2,3], s = [1,1]", output: "1" },
      { input: "g = [1,2], s = [1,2,3]", output: "2" }
    ]
  },
  {
    title: "Bitwise XOR Differing Bits Count",
    slug: "hamming-distance",
    difficulty: "Easy",
    points: 3,
    tags: ["Bit Manipulation", "LC-461"],
    description: "The Hamming distance between two integers is the number of positions at which the corresponding bits are different. Given two integers x and y, return the Hamming distance between them.",
    constraints: ["0 <= x, y <= 2^31 - 1"],
    examples: [
      { input: "x = 1, y = 4", output: "2", explanation: "1 = (0001)2, 4 = (0100)2. Two bit positions differ." },
      { input: "x = 3, y = 1", output: "1" }
    ]
  },
  {
    title: "Grid Land Cell Exposed Boundary Perimeter",
    slug: "island-perimeter",
    difficulty: "Easy",
    points: 3,
    tags: ["Array", "Depth-First Search", "Breadth-First Search", "Matrix", "LC-463"],
    description: "You are given row x col grid representing a map where grid[i][j] = 1 represents land and grid[i][j] = 0 represents water. Grid cells are connected horizontally/vertically. Find the perimeter of the island.",
    constraints: ["row == grid.length", "col == grid[i].length", "1 <= row, col <= 100", "grid[i][j] is 0 or 1", "There is exactly one island."],
    examples: [
      { input: "grid = [[0,1,0,0],[1,1,1,0],[0,1,0,0],[1,1,0,0]]", output: "16" },
      { input: "grid = [[1]]", output: "4" }
    ]
  },
  {
    title: "Bitwise Bit Flipping Complement",
    slug: "number-complement",
    difficulty: "Easy",
    points: 3,
    tags: ["Bit Manipulation", "LC-476"],
    description: "The complement of an integer is the integer you get when you flip all the 0's to 1's and all the 1's to 0's in its binary representation. Given an integer num, return its complement.",
    constraints: ["1 <= num < 2^31"],
    examples: [
      { input: "num = 5", output: "2", explanation: "5 in binary is 101; its complement is 010 (2 in base-10)." },
      { input: "num = 1", output: "0" }
    ]
  },
  {
    title: "Optimal Aspect Ratio Webpage Rectangle",
    slug: "construct-the-rectangle",
    difficulty: "Easy",
    points: 3,
    tags: ["Math", "LC-492"],
    description: "A web developer needs to design a rectangular web page whose area is equal to a given target area. Design rectangle [L, W] such that L * W = area, L >= W, and L - W is minimized.",
    constraints: ["1 <= area <= 10^7"],
    examples: [
      { input: "area = 4", output: "[2,2]" },
      { input: "area = 37", output: "[37,1]" },
      { input: "area = 122122", output: "[427,286]" }
    ]
  },
  {
    title: "Total Poison Duration Over Time",
    slug: "teemo-attacking",
    difficulty: "Easy",
    points: 3,
    tags: ["Array", "Simulation", "LC-495"],
    description: "Our hero attacks at time points timeSeries[i]. Each attack resets the poison timer to last duration seconds. Given non-decreasing integer array timeSeries and integer duration, return the total seconds poisoned.",
    constraints: ["1 <= timeSeries.length <= 10^4", "0 <= timeSeries[i], duration <= 10^7", "timeSeries is sorted in non-decreasing order."],
    examples: [
      { input: "timeSeries = [1,4], duration = 2", output: "4", explanation: "Poisoned at [1, 2] and [4, 5], total 4 seconds." },
      { input: "timeSeries = [1,2], duration = 2", output: "3", explanation: "Poisoned at [1, 3], total 3 seconds." }
    ]
  },
  {
    title: "Monotonic Stack Next Greater Value",
    slug: "next-greater-element-i",
    difficulty: "Easy",
    points: 3,
    tags: ["Array", "Hash Table", "Stack", "Monotonic Stack", "LC-496"],
    description: "The next greater element of some element x in an array is the first greater element that is to the right of x in the same array. Given subset nums1 and array nums2, return an array ans where ans[i] is next greater element in nums2.",
    constraints: ["1 <= nums1.length <= nums2.length <= 1000", "0 <= nums1[i], nums2[i] <= 10^4", "All integers in nums1 and nums2 are unique.", "All integers in nums1 appear in nums2."],
    examples: [
      { input: "nums1 = [4,1,2], nums2 = [1,3,4,2]", output: "[-1,3,-1]" },
      { input: "nums1 = [2,4], nums2 = [1,2,3,4]", output: "[3,-1]" }
    ]
  },
  {
    title: "Convert Base-10 Integer to Base-7",
    slug: "base-7",
    difficulty: "Easy",
    points: 3,
    tags: ["Math", "LC-504"],
    description: "Given an integer num, return a string of its base 7 representation.",
    constraints: ["-10^7 <= num <= 10^7"],
    examples: [
      { input: "num = 100", output: '"202"' },
      { input: "num = -7", output: '"-10"' }
    ]
  },
  {
    title: "Sum of Proper Divisors Check",
    slug: "perfect-number",
    difficulty: "Easy",
    points: 3,
    tags: ["Math", "LC-507"],
    description: "A perfect number is a positive integer that is equal to the sum of its positive divisors, excluding the number itself. Given an integer num, return true if num is a perfect number, otherwise return false.",
    constraints: ["1 <= num <= 10^8"],
    examples: [
      { input: "num = 28", output: "true", explanation: "1 + 2 + 4 + 7 + 14 = 28." },
      { input: "num = 7", output: "false" }
    ]
  },
  {
    title: "Dynamic Fibonacci Number Calculation",
    slug: "fibonacci-number",
    difficulty: "Easy",
    points: 3,
    tags: ["Math", "Dynamic Programming", "Recursion", "Memoization", "LC-509"],
    description: "The Fibonacci numbers, commonly denoted F(n) form a sequence such that each number is the sum of the two preceding ones, starting from 0 and 1: F(0) = 0, F(1) = 1, F(n) = F(n - 1) + F(n - 2). Return F(n).",
    constraints: ["0 <= n <= 30"],
    examples: [
      { input: "n = 2", output: "1", explanation: "F(2) = F(1) + F(0) = 1 + 0 = 1." },
      { input: "n = 3", output: "2" },
      { input: "n = 4", output: "3" }
    ]
  },
  {
    title: "Optimal Turn Math Divisor Strategy",
    slug: "divisor-game",
    difficulty: "Easy",
    points: 3,
    tags: ["Math", "Dynamic Programming", "Brainteaser", "Game Theory", "LC-1025"],
    description: "Alice and Bob take turns playing a game, with Alice starting first. There is a number n on blackboard. On each turn, a player chooses x with 0 < x < n and n % x == 0, and replaces n with n - x. Return true if Alice wins.",
    constraints: ["1 <= n <= 1000"],
    examples: [
      { input: "n = 2", output: "true", explanation: "Alice chooses 1, and Bob has no moves left." },
      { input: "n = 3", output: "false" }
    ]
  },
  {
    title: "Three-Term Tribonacci Sequence",
    slug: "n-th-tribonacci-number",
    difficulty: "Easy",
    points: 3,
    tags: ["Math", "Dynamic Programming", "Memoization", "LC-1137"],
    description: "The Tribonacci sequence Tn is defined as: T0 = 0, T1 = 1, T2 = 1, and Tn+3 = Tn + Tn+1 + Tn+2 for n >= 0. Given n, return the value of Tn.",
    constraints: ["0 <= n <= 37", "The 32-bit integer will not overflow."],
    examples: [
      { input: "n = 4", output: "4", explanation: "T_3 = 0 + 1 + 1 = 2, T_4 = 1 + 1 + 2 = 4." },
      { input: "n = 25", output: "1389537" }
    ]
  },
  {
    title: "Bit Shift and Subtraction Step Counter",
    slug: "number-of-steps-to-reduce-a-number-to-zero",
    difficulty: "Easy",
    points: 3,
    tags: ["Math", "Bit Manipulation", "LC-1342"],
    description: "Given an integer num, return the number of steps to reduce it to zero. In one step, if the current number is even, you have to divide it by 2, otherwise, you have to subtract 1 from it.",
    constraints: ["0 <= num <= 10^6"],
    examples: [
      { input: "num = 14", output: "6", explanation: "14 -> 7 -> 6 -> 3 -> 2 -> 1 -> 0." },
      { input: "num = 8", output: "4" }
    ]
  }
];

// Seeder Execution
export const seedEasyProblems = async () => {
  try {
    await connectDB();
    console.log(`Starting seeding of ${EASY_PROBLEMS.length} copyright-safe canonical Easy problems...`);

    let inserted = 0;
    let updated = 0;

    for (const prob of EASY_PROBLEMS) {
      const existing = await Problem.findOne({ slug: prob.slug });
      
      const payload = {
        title: prob.title,
        slug: prob.slug,
        difficulty: prob.difficulty,
        points: prob.points || 3,
        tags: prob.tags || ['Algorithms'],
        description: prob.description,
        constraints: prob.constraints || ['1 <= n <= 10^5'],
        followUp: prob.followUp,
        examples: prob.examples || [],
        visibleTestCases: prob.examples ? prob.examples.map(ex => ({ input: ex.input, output: ex.output })) : [],
        supportedLanguages: ['cpp', 'python', 'javascript', 'java'],
        status: 'ACTIVE'
      };

      if (existing) {
        await Problem.updateOne({ slug: prob.slug }, { $set: payload });
        updated++;
      } else {
        await Problem.create(payload);
        inserted++;
      }
    }

    const totalCount = await Problem.countDocuments();
    const totalEasy = await Problem.countDocuments({ difficulty: 'Easy' });
    console.log(`✓ Seeding complete! Inserted: ${inserted}, Updated: ${updated}, Total in DB: ${totalCount}, Total Easy in DB: ${totalEasy}`);
    process.exit(0);
  } catch (err) {
    console.error('Error seeding Easy problems:', err);
    process.exit(1);
  }
};

// Auto-run if executed directly
if (process.argv[1] && (import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/')) || process.argv[1].endsWith('seedEasyProblems.js'))) {
  seedEasyProblems();
}
