import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Problem from '../models/Problem.js';
import { connectDB } from '../config/db.js';
import { ADDITIONAL_PROBLEMS } from './additionalProblems.js';

dotenv.config();

// Complete, copyright-safe dataset of free canonical algorithmic problems from LeetCode 1-300
// Reworded titles, descriptions, and examples to prevent copyright infringement while preserving algorithmic patterns.
export const PROBLEMS_300 = [
  // 1 - 25
  {
    title: "Two Sum: Target Pair Indices",
    slug: "two-sum",
    difficulty: "Easy",
    points: 3,
    tags: ["Array", "Hash Table", "LC-1"],
    description: "Given an array of integers nums and an integer target, determine the indices of two elements whose values add up to target.\n\nEach input has exactly one unique solution, and the same element index cannot be used twice. Indices can be returned in any order.",
    constraints: ["2 <= nums.length <= 10^4", "-10^9 <= nums[i] <= 10^9", "-10^9 <= target <= 10^9"],
    followUp: "Can you achieve an optimal O(n) runtime complexity?",
    examples: [
      { input: "nums = [2,7,11,15], target = 9", output: "[0,1]", explanation: "nums[0] + nums[1] == 9, so indices [0, 1] are returned." },
      { input: "nums = [3,2,4], target = 6", output: "[1,2]", explanation: "nums[1] + nums[2] == 6, return [1, 2]." }
    ]
  },
  {
    title: "Add Two Numbers: Reversed Digit Lists",
    slug: "add-two-numbers",
    difficulty: "Medium",
    points: 5,
    tags: ["Linked List", "Math", "Recursion", "LC-2"],
    description: "You are provided with two non-empty linked lists representing non-negative integers. Digits are stored in reverse order, where each node contains a single digit. Add the two numbers and return the resulting sum as a reversed linked list.",
    constraints: ["The number of nodes in each list is in range [1, 100]", "0 <= Node.val <= 9", "No numbers have leading zeros except 0 itself."],
    examples: [
      { input: "l1 = [2,4,3], l2 = [5,6,4]", output: "[7,0,8]", explanation: "342 + 465 = 807, represented in reverse as [7,0,8]." },
      { input: "l1 = [0], l2 = [0]", output: "[0]" }
    ]
  },
  {
    title: "Longest Unique Character Substring",
    slug: "longest-substring-without-repeating-characters",
    difficulty: "Medium",
    points: 5,
    tags: ["Hash Table", "String", "Sliding Window", "LC-3"],
    description: "Given a string s, calculate the length of the longest continuous substring without any repeating characters.",
    constraints: ["0 <= s.length <= 5 * 10^4", "s consists of standard ASCII symbols, digits, and letters."],
    examples: [
      { input: "s = \"abcabcbb\"", output: "3", explanation: "The longest unique substring is \"abc\" with length 3." },
      { input: "s = \"bbbbb\"", output: "1", explanation: "The answer is \"b\", with length 1." }
    ]
  },
  {
    title: "Median of Dual Sorted Arrays",
    slug: "median-of-two-sorted-arrays",
    difficulty: "Hard",
    points: 10,
    tags: ["Array", "Binary Search", "Divide and Conquer", "LC-4"],
    description: "Given two sorted arrays nums1 and nums2 of size m and n respectively, compute the median value of the combined sorted arrays in O(log(m + n)) time.",
    constraints: ["nums1.length == m", "nums2.length == n", "0 <= m, n <= 1000", "1 <= m + n <= 2000"],
    examples: [
      { input: "nums1 = [1,3], nums2 = [2]", output: "2.00000", explanation: "Merged array is [1,2,3] and median is 2.0." },
      { input: "nums1 = [1,2], nums2 = [3,4]", output: "2.50000", explanation: "Merged array is [1,2,3,4] with median (2 + 3) / 2 = 2.5." }
    ]
  },
  {
    title: "Longest Palindromic Substring",
    slug: "longest-palindromic-substring",
    difficulty: "Medium",
    points: 5,
    tags: ["Two Pointers", "String", "Dynamic Programming", "LC-5"],
    description: "Given a string s, return the longest contiguous substring in s that reads the same backward as forward.",
    constraints: ["1 <= s.length <= 1000", "s consists of only digits and English letters."],
    examples: [
      { input: "s = \"babad\"", output: "bab", explanation: "\"aba\" is also a valid response." },
      { input: "s = \"cbbd\"", output: "bb" }
    ]
  },
  {
    title: "Zigzag Conversion",
    slug: "zigzag-conversion",
    difficulty: "Medium",
    points: 5,
    tags: ["String", "LC-6"],
    description: "The string \"PAYPALISHIRING\" is written in a zigzag pattern across a given number of rows. Write a function that returns the string read line by line after forming the zigzag layout.",
    constraints: ["1 <= s.length <= 1000", "1 <= numRows <= 1000"],
    examples: [
      { input: "s = \"PAYPALISHIRING\", numRows = 3", output: "PAHNAPLSIIGYIR" },
      { input: "s = \"PAYPALISHIRING\", numRows = 4", output: "PINALSIGYAHRPI" }
    ]
  },
  {
    title: "Reverse 32-bit Signed Integer",
    slug: "reverse-integer",
    difficulty: "Medium",
    points: 5,
    tags: ["Math", "LC-7"],
    description: "Given a signed 32-bit integer x, return x with its digits reversed. If reversing x causes the value to overflow outside signed 32-bit integer range [-2^31, 2^31 - 1], return 0.",
    constraints: ["-2^31 <= x <= 2^31 - 1"],
    examples: [
      { input: "x = 123", output: "321" },
      { input: "x = -123", output: "-321" },
      { input: "x = 120", output: "21" }
    ]
  },
  {
    title: "Parse String to 32-bit Integer (atoi)",
    slug: "string-to-integer-atoi",
    difficulty: "Medium",
    points: 5,
    tags: ["String", "LC-8"],
    description: "Implement a parser that converts a string into a 32-bit signed integer according to standard C/C++ atoi behavior (discard leading whitespaces, detect sign, read consecutive digits, and clamp to 32-bit integer range).",
    constraints: ["0 <= s.length <= 200"],
    examples: [
      { input: "s = \"42\"", output: "42" },
      { input: "s = \"   -042\"", output: "-42" },
      { input: "s = \"1337c0d3\"", output: "1337" }
    ]
  },
  {
    title: "Verify Integer Palindrome",
    slug: "palindrome-number",
    difficulty: "Easy",
    points: 3,
    tags: ["Math", "LC-9"],
    description: "Given an integer x, return true if x is a palindrome (reads identically forwards and backward), and false otherwise. Negative numbers are not palindromic.",
    constraints: ["-2^31 <= x <= 2^31 - 1"],
    followUp: "Could you solve it without converting the integer to a string?",
    examples: [
      { input: "x = 121", output: "true" },
      { input: "x = -121", output: "false" },
      { input: "x = 10", output: "false" }
    ]
  },
  {
    title: "Regex Pattern Matcher (with '.' and '*')",
    slug: "regular-expression-matching",
    difficulty: "Hard",
    points: 10,
    tags: ["String", "Dynamic Programming", "Recursion", "LC-10"],
    description: "Given an input string s and a pattern p, implement regular expression matching with support for '.' (matches any single character) and '*' (matches zero or more of the preceding element).",
    constraints: ["1 <= s.length <= 20", "1 <= p.length <= 20", "s contains only lowercase English letters."],
    examples: [
      { input: "s = \"aa\", p = \"a\"", output: "false" },
      { input: "s = \"aa\", p = \"a*\"", output: "true" },
      { input: "s = \"ab\", p = \".*\"", output: "true" }
    ]
  },
  {
    title: "Max Water Container Capacity",
    slug: "container-with-most-water",
    difficulty: "Medium",
    points: 5,
    tags: ["Array", "Two Pointers", "Greedy", "LC-11"],
    description: "You are given an integer array height of length n. There are n vertical lines drawn such that the two endpoints of the i-th line are (i, 0) and (i, height[i]). Find two lines that together with the x-axis form a container, such that the container contains the most water.",
    constraints: ["n == height.length", "2 <= n <= 10^5", "0 <= height[i] <= 10^4"],
    examples: [
      { input: "height = [1,8,6,2,5,4,8,3,7]", output: "49", explanation: "Lines at index 1 and 8 hold 7 * 7 = 49 units of water." },
      { input: "height = [1,1]", output: "1" }
    ]
  },
  {
    title: "Integer to Roman Numeral",
    slug: "integer-to-roman",
    difficulty: "Medium",
    points: 5,
    tags: ["Hash Table", "Math", "String", "LC-12"],
    description: "Given an integer num between 1 and 3999, convert it to its canonical Roman numeral representation.",
    constraints: ["1 <= num <= 3999"],
    examples: [
      { input: "num = 3749", output: "MMMDCCXLIX" },
      { input: "num = 58", output: "LVIII" }
    ]
  },
  {
    title: "Roman Numeral to Integer",
    slug: "roman-to-integer",
    difficulty: "Easy",
    points: 3,
    tags: ["Hash Table", "Math", "String", "LC-13"],
    description: "Given a valid Roman numeral string s, convert and return its integer numerical equivalent.",
    constraints: ["1 <= s.length <= 15", "s contains only Roman characters ('I', 'V', 'X', 'L', 'C', 'D', 'M')."],
    examples: [
      { input: "s = \"III\"", output: "3" },
      { input: "s = \"LVIII\"", output: "58" },
      { input: "s = \"MCMXCIV\"", output: "1994" }
    ]
  },
  {
    title: "Longest Common Prefix Across Strings",
    slug: "longest-common-prefix",
    difficulty: "Easy",
    points: 3,
    tags: ["String", "Trie", "LC-14"],
    description: "Write a function to find the longest common prefix string amongst an array of strings. If there is no common prefix, return an empty string \"\".",
    constraints: ["1 <= strs.length <= 200", "0 <= strs[i].length <= 200"],
    examples: [
      { input: "strs = [\"flower\",\"flow\",\"flight\"]", output: "fl" },
      { input: "strs = [\"dog\",\"racecar\",\"car\"]", output: "" }
    ]
  },
  {
    title: "Three Sum Zero Triplets",
    slug: "3sum",
    difficulty: "Medium",
    points: 5,
    tags: ["Array", "Two Pointers", "Sorting", "LC-15"],
    description: "Given an integer array nums, return all unique triplets [nums[i], nums[j], nums[k]] such that i != j, i != k, and j != k, and nums[i] + nums[j] + nums[k] == 0. Notice that the solution set must not contain duplicate triplets.",
    constraints: ["3 <= nums.length <= 3000", "-10^5 <= nums[i] <= 10^5"],
    examples: [
      { input: "nums = [-1,0,1,2,-1,-4]", output: "[[-1,-1,2],[-1,0,1]]" },
      { input: "nums = [0,1,1]", output: "[]" }
    ]
  },
  {
    title: "3Sum Closest to Target",
    slug: "3sum-closest",
    difficulty: "Medium",
    points: 5,
    tags: ["Array", "Two Pointers", "Sorting", "LC-16"],
    description: "Given an integer array nums of length n and an integer target, find three integers in nums such that the sum is closest to target. Return the sum of the three integers.",
    constraints: ["3 <= nums.length <= 500", "-1000 <= nums[i] <= 1000", "-10^4 <= target <= 10^4"],
    examples: [
      { input: "nums = [-1,2,1,-4], target = 1", output: "2", explanation: "The sum that is closest to target is 2 (-1 + 2 + 1 = 2)." }
    ]
  },
  {
    title: "Phone Keypad Letter Combinations",
    slug: "letter-combinations-of-a-phone-number",
    difficulty: "Medium",
    points: 5,
    tags: ["Hash Table", "String", "Backtracking", "LC-17"],
    description: "Given a string containing digits from 2-9 inclusive, return all possible letter combinations that the number could represent based on telephone buttons. Return the answer in any order.",
    constraints: ["0 <= digits.length <= 4", "digits[i] is a digit in the range ['2', '9']."],
    examples: [
      { input: "digits = \"23\"", output: "[\"ad\",\"ae\",\"af\",\"bd\",\"be\",\"bf\",\"cd\",\"ce\",\"cf\"]" },
      { input: "digits = \"\"", output: "[]" }
    ]
  },
  {
    title: "Four Sum Target Quadruplets",
    slug: "4sum",
    difficulty: "Medium",
    points: 5,
    tags: ["Array", "Two Pointers", "Sorting", "LC-18"],
    description: "Given an array nums of n integers, return an array of all the unique quadruplets [nums[a], nums[b], nums[c], nums[d]] such that the four values sum to target without duplicate quadruplets.",
    constraints: ["1 <= nums.length <= 200", "-10^9 <= nums[i] <= 10^9", "-10^9 <= target <= 10^9"],
    examples: [
      { input: "nums = [1,0,-1,0,-2,2], target = 0", output: "[[-2,-1,1,2],[-2,0,0,2],[-1,0,0,1]]" }
    ]
  },
  {
    title: "Delete N-th Node From End of List",
    slug: "remove-nth-node-from-end-of-list",
    difficulty: "Medium",
    points: 5,
    tags: ["Linked List", "Two Pointers", "LC-19"],
    description: "Given the head of a linked list, remove the n-th node from the end of the list and return its head in a single pass.",
    constraints: ["The number of nodes in the list is sz", "1 <= sz <= 30", "1 <= n <= sz"],
    examples: [
      { input: "head = [1,2,3,4,5], n = 2", output: "[1,2,3,5]" },
      { input: "head = [1], n = 1", output: "[]" }
    ]
  },
  {
    title: "Valid Bracket Sequence",
    slug: "valid-parentheses",
    difficulty: "Easy",
    points: 3,
    tags: ["String", "Stack", "LC-20"],
    description: "Given a string s containing '(', ')', '{', '}', '[' and ']', determine if the input string is valid. Brackets must be closed by matching types in proper nested order.",
    constraints: ["1 <= s.length <= 10^4"],
    examples: [
      { input: "s = \"()\"", output: "true" },
      { input: "s = \"()[]{}\"", output: "true" },
      { input: "s = \"(]\"", output: "false" }
    ]
  },
  {
    title: "Merge Sorted Linked Lists",
    slug: "merge-two-sorted-lists",
    difficulty: "Easy",
    points: 3,
    tags: ["Linked List", "Recursion", "LC-21"],
    description: "You are given the heads of two sorted linked lists list1 and list2. Merge the two lists into one sorted list by splicing together nodes and return the head of the merged list.",
    constraints: ["The number of nodes in both lists is in range [0, 50]", "-100 <= Node.val <= 100"],
    examples: [
      { input: "list1 = [1,2,4], list2 = [1,3,4]", output: "[1,1,2,3,4,4]" },
      { input: "list1 = [], list2 = []", output: "[]" }
    ]
  },
  {
    title: "Generate Balanced Bracket Sequences",
    slug: "generate-parentheses",
    difficulty: "Medium",
    points: 5,
    tags: ["String", "Dynamic Programming", "Backtracking", "LC-22"],
    description: "Given n pairs of parentheses, write a function to generate all combinations of well-formed parentheses strings.",
    constraints: ["1 <= n <= 8"],
    examples: [
      { input: "n = 3", output: "[\"((()))\",\"(()())\",\"(())()\",\"()(())\",\"()()()\"]" },
      { input: "n = 1", output: "[\"()\"]" }
    ]
  },
  {
    title: "Merge K Sorted Linked Lists",
    slug: "merge-k-sorted-lists",
    difficulty: "Hard",
    points: 10,
    tags: ["Linked List", "Divide and Conquer", "Heap", "LC-23"],
    description: "You are given an array of k linked-lists lists, each linked-list is sorted in ascending order. Merge all the linked-lists into one sorted linked-list and return it.",
    constraints: ["k == lists.length", "0 <= k <= 10^4", "0 <= lists[i].length <= 500"],
    examples: [
      { input: "lists = [[1,4,5],[1,3,4],[2,6]]", output: "[1,1,2,3,4,4,5,6]" }
    ]
  },
  {
    title: "Swap Nodes in Pairs",
    slug: "swap-nodes-in-pairs",
    difficulty: "Medium",
    points: 5,
    tags: ["Linked List", "Recursion", "LC-24"],
    description: "Given a linked list, swap every two adjacent nodes and return its head. You must solve the problem without modifying the values in the list's nodes (i.e., only nodes themselves may be changed.)",
    constraints: ["The number of nodes in the list is in the range [0, 100].", "0 <= Node.val <= 100"],
    examples: [
      { input: "head = [1,2,3,4]", output: "[2,1,4,3]" },
      { input: "head = []", output: "[]" }
    ]
  },
  {
    title: "Reverse Nodes in K-Group",
    slug: "reverse-nodes-in-k-group",
    difficulty: "Hard",
    points: 10,
    tags: ["Linked List", "Recursion", "LC-25"],
    description: "Given the head of a linked list, reverse the nodes of the list k at a time, and return the modified list. If the number of nodes is not a multiple of k, left-out nodes at the end should remain as-is.",
    constraints: ["The number of nodes in the list is n", "1 <= k <= n <= 5000", "0 <= Node.val <= 1000"],
    examples: [
      { input: "head = [1,2,3,4,5], k = 2", output: "[2,1,4,3,5]" },
      { input: "head = [1,2,3,4,5], k = 3", output: "[3,2,1,4,5]" }
    ]
  },

  // 26 - 50
  {
    title: "Deduplicate In-Place Sorted Array",
    slug: "remove-duplicates-from-sorted-array",
    difficulty: "Easy",
    points: 3,
    tags: ["Array", "Two Pointers", "LC-26"],
    description: "Given an integer array nums sorted in non-decreasing order, remove duplicates in-place such that each unique element appears once. Return the number of unique elements k.",
    constraints: ["1 <= nums.length <= 3 * 10^4", "-100 <= nums[i] <= 100"],
    examples: [
      { input: "nums = [1,1,2]", output: "2", explanation: "Unique elements are [1, 2], return k = 2." }
    ]
  },
  {
    title: "Remove Target Element In-Place",
    slug: "remove-element",
    difficulty: "Easy",
    points: 3,
    tags: ["Array", "Two Pointers", "LC-27"],
    description: "Given an integer array nums and an integer val, remove all occurrences of val in nums in-place. Return the number of elements in nums which are not equal to val.",
    constraints: ["0 <= nums.length <= 100", "0 <= nums[i] <= 50", "0 <= val <= 100"],
    examples: [
      { input: "nums = [3,2,2,3], val = 3", output: "2", explanation: "After removal, remaining elements are [2, 2]." }
    ]
  },
  {
    title: "Find Index of First Substring Match",
    slug: "find-the-index-of-the-first-occurrence-in-a-string",
    difficulty: "Easy",
    points: 3,
    tags: ["Two Pointers", "String", "String Matching", "LC-28"],
    description: "Given two strings needle and haystack, return the index of the first occurrence of needle in haystack, or -1 if needle is not part of haystack.",
    constraints: ["1 <= haystack.length, needle.length <= 10^4"],
    examples: [
      { input: "haystack = \"sadbutsad\", needle = \"sad\"", output: "0" },
      { input: "haystack = \"leetcode\", needle = \"leeto\"", output: "-1" }
    ]
  },
  {
    title: "Divide Two Integers without Multiplication",
    slug: "divide-two-integers",
    difficulty: "Medium",
    points: 5,
    tags: ["Math", "Bit Manipulation", "LC-29"],
    description: "Given two integers dividend and divisor, divide two integers without using multiplication, division, and mod operator. Truncate towards zero and clamp to 32-bit signed integer limits.",
    constraints: ["-2^31 <= dividend, divisor <= 2^31 - 1", "divisor != 0"],
    examples: [
      { input: "dividend = 10, divisor = 3", output: "3" },
      { input: "dividend = 7, divisor = -3", output: "-2" }
    ]
  },
  {
    title: "Concatenated Words Substring Window",
    slug: "substring-with-concatenation-of-all-words",
    difficulty: "Hard",
    points: 10,
    tags: ["Hash Table", "String", "Sliding Window", "LC-30"],
    description: "You are given a string s and an array of strings words of the same length. Return all starting indices of substring(s) in s that is a concatenation of each word in words exactly once and without any intervening characters.",
    constraints: ["1 <= s.length <= 10^4", "1 <= words.length <= 5000", "1 <= words[i].length <= 30"],
    examples: [
      { input: "s = \"barfoothefoobarman\", words = [\"foo\",\"bar\"]", output: "[0,9]" }
    ]
  },
  {
    title: "Next Lexicographical Permutation",
    slug: "next-permutation",
    difficulty: "Medium",
    points: 5,
    tags: ["Array", "Two Pointers", "LC-31"],
    description: "A permutation of an array of integers is an arrangement of its members into a sequence. Rearrange numbers into the lexicographically next greater permutation in-place. If no greater arrangement exists, rearrange into lowest possible order.",
    constraints: ["1 <= nums.length <= 100", "0 <= nums[i] <= 100"],
    examples: [
      { input: "nums = [1,2,3]", output: "[1,3,2]" },
      { input: "nums = [3,2,1]", output: "[1,2,3]" }
    ]
  },
  {
    title: "Longest Valid Bracket Substring",
    slug: "longest-valid-parentheses",
    difficulty: "Hard",
    points: 10,
    tags: ["String", "Dynamic Programming", "Stack", "LC-32"],
    description: "Given a string containing just the characters '(' and ')', return the length of the longest valid (well-formed) parentheses substring.",
    constraints: ["0 <= s.length <= 3 * 10^4"],
    examples: [
      { input: "s = \"(()\"", output: "2" },
      { input: "s = \")()())\"", output: "4" }
    ]
  },
  {
    title: "Search in Rotated Sorted Array",
    slug: "search-in-rotated-sorted-array",
    difficulty: "Medium",
    points: 5,
    tags: ["Array", "Binary Search", "LC-33"],
    description: "There is an integer array nums sorted in ascending order (with distinct values), rotated at some unknown pivot. Given target, return its index in nums, or -1 if not found. Must run in O(log n) time.",
    constraints: ["1 <= nums.length <= 5000", "-10^4 <= nums[i] <= 10^4", "All values are unique."],
    examples: [
      { input: "nums = [4,5,6,7,0,1,2], target = 0", output: "4" },
      { input: "nums = [4,5,6,7,0,1,2], target = 3", output: "-1" }
    ]
  },
  {
    title: "Search Range in Sorted Array",
    slug: "find-first-and-last-position-of-element-in-sorted-array",
    difficulty: "Medium",
    points: 5,
    tags: ["Array", "Binary Search", "LC-34"],
    description: "Given an array of integers nums sorted in non-decreasing order, find the starting and ending position of a given target value in O(log n) time. If target is not found, return [-1, -1].",
    constraints: ["0 <= nums.length <= 10^5", "-10^9 <= nums[i], target <= 10^9"],
    examples: [
      { input: "nums = [5,7,7,8,8,10], target = 8", output: "[3,4]" },
      { input: "nums = [5,7,7,8,8,10], target = 6", output: "[-1,-1]" }
    ]
  },
  {
    title: "Binary Search Insert Position",
    slug: "search-insert-position",
    difficulty: "Easy",
    points: 3,
    tags: ["Array", "Binary Search", "LC-35"],
    description: "Given a sorted array of distinct integers and a target value, return the index if target is found. If not, return the index where it would be if it were inserted in order. Must run in O(log n).",
    constraints: ["1 <= nums.length <= 10^4", "-10^4 <= nums[i], target <= 10^4"],
    examples: [
      { input: "nums = [1,3,5,6], target = 5", output: "2" },
      { input: "nums = [1,3,5,6], target = 2", output: "1" }
    ]
  },
  {
    title: "Validate Sudoku Board State",
    slug: "valid-sudoku",
    difficulty: "Medium",
    points: 5,
    tags: ["Array", "Hash Table", "Matrix", "LC-36"],
    description: "Determine if a 9 x 9 Sudoku board is valid. Only the filled cells need to be validated according to standard rules: each row, column, and 3x3 sub-box must contain digits 1-9 without repetition.",
    constraints: ["board.length == 9", "board[i].length == 9"],
    examples: [
      { input: "board = [[\"5\",\"3\",\".\",\".\",\"7\",\".\",\".\",\".\",\".\"], ...]", output: "true" }
    ]
  },
  {
    title: "Solve Sudoku Board Backtracking",
    slug: "sudoku-solver",
    difficulty: "Hard",
    points: 10,
    tags: ["Array", "Hash Table", "Backtracking", "Matrix", "LC-37"],
    description: "Write a program to solve a Sudoku puzzle by filling the empty cells with digits from '1' to '9'. It is guaranteed that the input board has a single unique solution.",
    constraints: ["board.length == 9", "board[i].length == 9"],
    examples: [
      { input: "board = [[\"5\",\"3\",\".\",...]]", output: "[[\"5\",\"3\",\"4\",...]]" }
    ]
  },
  {
    title: "Count and Say Sequence",
    slug: "count-and-say",
    difficulty: "Medium",
    points: 5,
    tags: ["String", "LC-38"],
    description: "The count-and-say sequence is a sequence of digit strings defined by the recursive formula: countAndSay(1) = \"1\", countAndSay(n) is the run-length encoding of countAndSay(n-1). Given integer n, return the n-th string.",
    constraints: ["1 <= n <= 30"],
    examples: [
      { input: "n = 1", output: "1" },
      { input: "n = 4", output: "1211" }
    ]
  },
  {
    title: "Combination Sum (Unlimited Picks)",
    slug: "combination-sum",
    difficulty: "Medium",
    points: 5,
    tags: ["Array", "Backtracking", "LC-39"],
    description: "Given an array of distinct integers candidates and a target integer target, return a list of all unique combinations of candidates where chosen numbers sum to target. The same number may be chosen unlimited times.",
    constraints: ["1 <= candidates.length <= 30", "2 <= candidates[i] <= 40", "1 <= target <= 40"],
    examples: [
      { input: "candidates = [2,3,6,7], target = 7", output: "[[2,2,3],[7]]" }
    ]
  },
  {
    title: "Combination Sum II (Unique Usage)",
    slug: "combination-sum-ii",
    difficulty: "Medium",
    points: 5,
    tags: ["Array", "Backtracking", "LC-40"],
    description: "Given a collection of candidate numbers candidates and a target number target, find all unique combinations in candidates where the candidate numbers sum to target. Each number in candidates may only be used once in the combination.",
    constraints: ["1 <= candidates.length <= 100", "1 <= candidates[i] <= 50", "1 <= target <= 30"],
    examples: [
      { input: "candidates = [10,1,2,7,6,1,5], target = 8", output: "[[1,1,6],[1,2,5],[1,7],[2,6]]" }
    ]
  },
  {
    title: "First Missing Positive Integer",
    slug: "first-missing-positive",
    difficulty: "Hard",
    points: 10,
    tags: ["Array", "Hash Table", "LC-41"],
    description: "Given an unsorted integer array nums, return the smallest missing positive integer. You must implement an algorithm that runs in O(n) time and uses O(1) auxiliary space.",
    constraints: ["1 <= nums.length <= 10^5", "-2^31 <= nums[i] <= 2^31 - 1"],
    examples: [
      { input: "nums = [1,2,0]", output: "3" },
      { input: "nums = [3,4,-1,1]", output: "2" },
      { input: "nums = [7,8,9,11,12]", output: "1" }
    ]
  },
  {
    title: "Trapping Rainwater Capacity",
    slug: "trapping-rain-water",
    difficulty: "Hard",
    points: 10,
    tags: ["Array", "Two Pointers", "Dynamic Programming", "Stack", "LC-42"],
    description: "Given n non-negative integers representing an elevation map where the width of each bar is 1, compute how much water it can trap after raining.",
    constraints: ["n == height.length", "1 <= n <= 2 * 10^4", "0 <= height[i] <= 10^5"],
    examples: [
      { input: "height = [0,1,0,2,1,0,1,3,2,1,2,1]", output: "6" },
      { input: "height = [4,2,0,3,2,5]", output: "9" }
    ]
  },
  {
    title: "Multiply Numeric Strings",
    slug: "multiply-strings",
    difficulty: "Medium",
    points: 5,
    tags: ["Math", "String", "Simulation", "LC-43"],
    description: "Given two non-negative integers num1 and num2 represented as strings, return the product of num1 and num2, also represented as a string, without directly converting input strings to integers or using BigInt.",
    constraints: ["1 <= num1.length, num2.length <= 200", "num1 and num2 consist of digits only."],
    examples: [
      { input: "num1 = \"2\", num2 = \"3\"", output: "6" },
      { input: "num1 = \"123\", num2 = \"456\"", output: "56088" }
    ]
  },
  {
    title: "Wildcard Pattern Matcher",
    slug: "wildcard-matching",
    difficulty: "Hard",
    points: 10,
    tags: ["String", "Dynamic Programming", "Greedy", "Recursion", "LC-44"],
    description: "Given an input string s and a pattern p, implement wildcard pattern matching with support for '?' (matches any single character) and '*' (matches any sequence of characters including empty).",
    constraints: ["0 <= s.length, p.length <= 2000"],
    examples: [
      { input: "s = \"aa\", p = \"*\"", output: "true" },
      { input: "s = \"cb\", p = \"?a\"", output: "false" }
    ]
  },
  {
    title: "Minimum Jump Steps to Reach End",
    slug: "jump-game-ii",
    difficulty: "Medium",
    points: 5,
    tags: ["Array", "Dynamic Programming", "Greedy", "LC-45"],
    description: "You are given a 0-indexed array of integers nums of length n. You are initially positioned at nums[0]. Each element nums[i] represents maximum jump length from that position. Return the minimum number of jumps to reach index n - 1.",
    constraints: ["1 <= nums.length <= 10^4", "0 <= nums[i] <= 1000"],
    examples: [
      { input: "nums = [2,3,1,1,4]", output: "2", explanation: "Jump 1 step from index 0 to 1, then 3 steps to the last index." }
    ]
  },
  {
    title: "Generate All Permutations",
    slug: "permutations",
    difficulty: "Medium",
    points: 5,
    tags: ["Array", "Backtracking", "LC-46"],
    description: "Given an array nums of distinct integers, return all the possible permutations in any order.",
    constraints: ["1 <= nums.length <= 6", "-10 <= nums[i] <= 10", "All integers are unique."],
    examples: [
      { input: "nums = [1,2,3]", output: "[[1,2,3],[1,3,2],[2,1,3],[2,3,1],[3,1,2],[3,2,1]]" }
    ]
  },
  {
    title: "Generate Unique Permutations with Duplicates",
    slug: "permutations-ii",
    difficulty: "Medium",
    points: 5,
    tags: ["Array", "Backtracking", "Sorting", "LC-47"],
    description: "Given a collection of numbers nums, that might contain duplicates, return all possible unique permutations in any order.",
    constraints: ["1 <= nums.length <= 8", "-10 <= nums[i] <= 10"],
    examples: [
      { input: "nums = [1,1,2]", output: "[[1,1,2],[1,2,1],[2,1,1]]" }
    ]
  },
  {
    title: "Rotate 2D Matrix Clockwise In-Place",
    slug: "rotate-image",
    difficulty: "Medium",
    points: 5,
    tags: ["Array", "Math", "Matrix", "LC-48"],
    description: "You are given an n x n 2D matrix representing an image. Rotate the image by 90 degrees clockwise in-place without allocating another 2D matrix.",
    constraints: ["n == matrix.length == matrix[i].length", "1 <= n <= 20"],
    examples: [
      { input: "matrix = [[1,2,3],[4,5,6],[7,8,9]]", output: "[[7,4,1],[8,5,2],[9,6,3]]" }
    ]
  },
  {
    title: "Group Anagram Words",
    slug: "group-anagrams",
    difficulty: "Medium",
    points: 5,
    tags: ["Array", "Hash Table", "String", "Sorting", "LC-49"],
    description: "Given an array of strings strs, group the anagrams together. You can return the answer in any order.",
    constraints: ["1 <= strs.length <= 10^4", "0 <= strs[i].length <= 100", "strs[i] consists of lowercase English letters."],
    examples: [
      { input: "strs = [\"eat\",\"tea\",\"tan\",\"ate\",\"nat\",\"bat\"]", output: "[[\"bat\"],[\"nat\",\"tan\"],[\"ate\",\"eat\",\"tea\"]]" }
    ]
  },
  {
    title: "Fast Power Exponentiation Pow(x, n)",
    slug: "powx-n",
    difficulty: "Medium",
    points: 5,
    tags: ["Math", "Recursion", "LC-50"],
    description: "Implement pow(x, n), which calculates x raised to the power n (i.e., x^n) in O(log n) time.",
    constraints: ["-100.0 < x < 100.0", "-2^31 <= n <= 2^31 - 1", "n is an integer."],
    examples: [
      { input: "x = 2.00000, n = 10", output: "1024.00000" },
      { input: "x = 2.10000, n = 3", output: "9.26100" },
      { input: "x = 2.00000, n = -2", output: "0.25000" }
    ]
  },

  // 51 - 75
  {
    title: "N-Queens Board Configurations",
    slug: "n-queens",
    difficulty: "Hard",
    points: 10,
    tags: ["Array", "Backtracking", "LC-51"],
    description: "The n-queens puzzle is the problem of placing n queens on an n x n chessboard such that no two queens attack each other. Return all distinct board configurations.",
    constraints: ["1 <= n <= 9"],
    examples: [
      { input: "n = 4", output: "[\".Q..\",\"...Q\",\"Q...\",\"..Q.\"],[\"..Q.\",\"Q...\",\"...Q\",\".Q..\"]" }
    ]
  },
  {
    title: "Count N-Queens Solutions",
    slug: "n-queens-ii",
    difficulty: "Hard",
    points: 10,
    tags: ["Backtracking", "LC-52"],
    description: "The n-queens puzzle is the problem of placing n queens on an n x n chessboard such that no two queens attack each other. Return the number of distinct solutions.",
    constraints: ["1 <= n <= 9"],
    examples: [
      { input: "n = 4", output: "2" },
      { input: "n = 1", output: "1" }
    ]
  },
  {
    title: "Maximum Contiguous Subarray Sum",
    slug: "maximum-subarray",
    difficulty: "Medium",
    points: 5,
    tags: ["Array", "Divide and Conquer", "Dynamic Programming", "LC-53"],
    description: "Given an integer array nums, find the subarray with the largest sum, and return its sum (Kadane's algorithm).",
    constraints: ["1 <= nums.length <= 10^5", "-10^4 <= nums[i] <= 10^4"],
    examples: [
      { input: "nums = [-2,1,-3,4,-1,2,1,-5,4]", output: "6", explanation: "The subarray [4,-1,2,1] has the largest sum 6." }
    ]
  },
  {
    title: "Spiral Matrix Traversal",
    slug: "spiral-matrix",
    difficulty: "Medium",
    points: 5,
    tags: ["Array", "Matrix", "Simulation", "LC-54"],
    description: "Given an m x n matrix, return all elements of the matrix in spiral order.",
    constraints: ["m == matrix.length", "n == matrix[i].length", "1 <= m, n <= 10"],
    examples: [
      { input: "matrix = [[1,2,3],[4,5,6],[7,8,9]]", output: "[1,2,3,6,9,8,7,4,5]" }
    ]
  },
  {
    title: "Check Jump Game Reachability",
    slug: "jump-game",
    difficulty: "Medium",
    points: 5,
    tags: ["Array", "Dynamic Programming", "Greedy", "LC-55"],
    description: "You are given an integer array nums. You are initially positioned at index 0. Return true if you can reach the last index, or false otherwise.",
    constraints: ["1 <= nums.length <= 10^4", "0 <= nums[i] <= 10^5"],
    examples: [
      { input: "nums = [2,3,1,1,4]", output: "true" },
      { input: "nums = [3,2,1,0,4]", output: "false" }
    ]
  },
  {
    title: "Merge Overlapping Intervals",
    slug: "merge-intervals",
    difficulty: "Medium",
    points: 5,
    tags: ["Array", "Sorting", "Intervals", "LC-56"],
    description: "Given an array of intervals where intervals[i] = [start_i, end_i], merge all overlapping intervals, and return an array of the non-overlapping intervals that cover all the intervals in the input.",
    constraints: ["1 <= intervals.length <= 10^4", "intervals[i].length == 2", "0 <= start_i <= end_i <= 10^4"],
    examples: [
      { input: "intervals = [[1,3],[2,6],[8,10],[15,18]]", output: "[[1,6],[8,10],[15,18]]" }
    ]
  },
  {
    title: "Insert and Merge Interval",
    slug: "insert-interval",
    difficulty: "Medium",
    points: 5,
    tags: ["Array", "Intervals", "LC-57"],
    description: "You are given an array of non-overlapping intervals intervals where intervals are sorted in ascending order. Insert newInterval into intervals such that intervals is still sorted and non-overlapping (merge if necessary).",
    constraints: ["0 <= intervals.length <= 10^4", "intervals[i].length == 2", "0 <= start_i <= end_i <= 10^5"],
    examples: [
      { input: "intervals = [[1,3],[6,9]], newInterval = [2,5]", output: "[[1,5],[6,9]]" }
    ]
  },
  {
    title: "Length of Last Word",
    slug: "length-of-last-word",
    difficulty: "Easy",
    points: 3,
    tags: ["String", "LC-58"],
    description: "Given a string s consisting of words and spaces, return the length of the last word in the string.",
    constraints: ["1 <= s.length <= 10^4", "s contains only English letters and spaces."],
    examples: [
      { input: "s = \"Hello World\"", output: "5" },
      { input: "s = \"   fly me   to   the moon  \"", output: "4" }
    ]
  },
  {
    title: "Generate N x N Spiral Matrix",
    slug: "spiral-matrix-ii",
    difficulty: "Medium",
    points: 5,
    tags: ["Array", "Matrix", "Simulation", "LC-59"],
    description: "Given a positive integer n, generate an n x n matrix filled with elements from 1 to n^2 in spiral order.",
    constraints: ["1 <= n <= 20"],
    examples: [
      { input: "n = 3", output: "[[1,2,3],[8,9,4],[7,6,5]]" }
    ]
  },
  {
    title: "K-th Permutation Sequence",
    slug: "permutation-sequence",
    difficulty: "Hard",
    points: 10,
    tags: ["Math", "Recursion", "LC-60"],
    description: "The set [1, 2, ..., n] contains n! unique permutations. By listing and labeling all permutations in order, return the k-th permutation sequence.",
    constraints: ["1 <= n <= 9", "1 <= k <= n!"],
    examples: [
      { input: "n = 3, k = 3", output: "213" },
      { input: "n = 4, k = 9", output: "2314" }
    ]
  },
  {
    title: "Rotate Linked List by K",
    slug: "rotate-list",
    difficulty: "Medium",
    points: 5,
    tags: ["Linked List", "Two Pointers", "LC-61"],
    description: "Given the head of a linked list, rotate the list to the right by k places.",
    constraints: ["The number of nodes in the list is in the range [0, 500]", "-100 <= Node.val <= 100", "0 <= k <= 2 * 10^9"],
    examples: [
      { input: "head = [1,2,3,4,5], k = 2", output: "[4,5,1,2,3]" }
    ]
  },
  {
    title: "Grid Traversal Unique Paths",
    slug: "unique-paths",
    difficulty: "Medium",
    points: 5,
    tags: ["Math", "Dynamic Programming", "Combinatorics", "LC-62"],
    description: "There is a robot on an m x n grid located at top-left (0,0). The robot can only move either down or right at any point. Return the number of possible unique paths to reach the bottom-right corner.",
    constraints: ["1 <= m, n <= 100"],
    examples: [
      { input: "m = 3, n = 7", output: "28" },
      { input: "m = 3, n = 2", output: "3" }
    ]
  },
  {
    title: "Grid Traversal with Obstacles",
    slug: "unique-paths-ii",
    difficulty: "Medium",
    points: 5,
    tags: ["Array", "Dynamic Programming", "Matrix", "LC-63"],
    description: "You are given an m x n integer array obstacleGrid where 1 marks an obstacle and 0 marks space. Return the number of possible unique paths from top-left to bottom-right avoiding obstacles.",
    constraints: ["m == obstacleGrid.length", "n == obstacleGrid[i].length", "1 <= m, n <= 100"],
    examples: [
      { input: "obstacleGrid = [[0,0,0],[0,1,0],[0,0,0]]", output: "2" }
    ]
  },
  {
    title: "Minimum Grid Path Sum",
    slug: "minimum-path-sum",
    difficulty: "Medium",
    points: 5,
    tags: ["Array", "Dynamic Programming", "Matrix", "LC-64"],
    description: "Given a m x n grid filled with non-negative numbers, find a path from top left to bottom right, which minimizes the sum of all numbers along its path. You can only move either down or right at any point in time.",
    constraints: ["m == grid.length", "n == grid[i].length", "1 <= m, n <= 200", "0 <= grid[i][j] <= 200"],
    examples: [
      { input: "grid = [[1,3,1],[1,5,1],[4,2,1]]", output: "7", explanation: "Path 1 -> 3 -> 1 -> 1 -> 1 minimizes the sum to 7." }
    ]
  },
  {
    title: "Valid Numeric String Identifier",
    slug: "valid-number",
    difficulty: "Hard",
    points: 10,
    tags: ["String", "LC-65"],
    description: "A valid number can be split into an optional sign, digits, decimal point, and optional exponent notation ('e' or 'E'). Given string s, return true if s is a valid number.",
    constraints: ["1 <= s.length <= 20"],
    examples: [
      { input: "s = \"0\"", output: "true" },
      { input: "s = \"e\"", output: "false" },
      { input: "s = \".\"", output: "false" }
    ]
  },
  {
    title: "Add One to Large Number Array",
    slug: "plus-one",
    difficulty: "Easy",
    points: 3,
    tags: ["Array", "Math", "LC-66"],
    description: "You are given a large integer represented as an integer array digits, where digits[i] is the i-th digit. Digits are ordered from most significant to least significant. Increment the large integer by one and return the resulting array of digits.",
    constraints: ["1 <= digits.length <= 100", "0 <= digits[i] <= 9"],
    examples: [
      { input: "digits = [1,2,3]", output: "[1,2,4]" },
      { input: "digits = [9]", output: "[1,0]" }
    ]
  },
  {
    title: "Add Binary Strings",
    slug: "add-binary",
    difficulty: "Easy",
    points: 3,
    tags: ["Math", "String", "Bit Manipulation", "Simulation", "LC-67"],
    description: "Given two binary strings a and b, return their sum as a binary string.",
    constraints: ["1 <= a.length, b.length <= 10^4", "a and b consist only of '0' or '1' characters."],
    examples: [
      { input: "a = \"11\", b = \"1\"", output: "100" },
      { input: "a = \"1010\", b = \"1011\"", output: "10101" }
    ]
  },
  {
    title: "Full Text Line Justification",
    slug: "text-justification",
    difficulty: "Hard",
    points: 10,
    tags: ["Array", "String", "Simulation", "LC-68"],
    description: "Given an array of strings words and a width maxWidth, format the text such that each line has exactly maxWidth characters and is fully (left and right) justified.",
    constraints: ["1 <= words.length <= 300", "1 <= words[i].length <= 20", "words[i] consists of English letters and symbols.", "1 <= maxWidth <= 100"],
    examples: [
      { input: "words = [\"This\", \"is\", \"an\", \"example\", \"of\", \"text\", \"justification.\"], maxWidth = 16", output: "[\"This    is    an\",\"example  of text\",\"justification.  \"]" }
    ]
  },
  {
    title: "Integer Square Root Sqrt(x)",
    slug: "sqrtx",
    difficulty: "Easy",
    points: 3,
    tags: ["Math", "Binary Search", "LC-69"],
    description: "Given a non-negative integer x, return the square root of x rounded down to the nearest integer. The returned integer should be non-negative as well. Do not use built-in pow/sqrt.",
    constraints: ["0 <= x <= 2^31 - 1"],
    examples: [
      { input: "x = 4", output: "2" },
      { input: "x = 8", output: "2" }
    ]
  },
  {
    title: "Staircase Step Combinations",
    slug: "climbing-stairs",
    difficulty: "Easy",
    points: 3,
    tags: ["Math", "Dynamic Programming", "Memoization", "LC-70"],
    description: "You are climbing a staircase. It takes n steps to reach the top. Each time you can either climb 1 or 2 steps. In how many distinct ways can you climb to the top?",
    constraints: ["1 <= n <= 45"],
    examples: [
      { input: "n = 2", output: "2", explanation: "1 step + 1 step, or 2 steps." },
      { input: "n = 3", output: "3", explanation: "1+1+1, 1+2, or 2+1." }
    ]
  },
  {
    title: "Canonical Unix Path Simplifier",
    slug: "simplify-path",
    difficulty: "Medium",
    points: 5,
    tags: ["String", "Stack", "LC-71"],
    description: "Given an absolute path for a Unix-style file system, convert it to the simplified canonical path (resolving '.', '..', and multiple slashes).",
    constraints: ["1 <= path.length <= 3000"],
    examples: [
      { input: "path = \"/home/\"", output: "/home" },
      { input: "path = \"/home//foo/\"", output: "/home/foo" },
      { input: "path = \"/home/user/Documents/../Pictures\"", output: "/home/user/Pictures" }
    ]
  },
  {
    title: "Minimum Levenshtein Edit Distance",
    slug: "edit-distance",
    difficulty: "Medium",
    points: 5,
    tags: ["String", "Dynamic Programming", "LC-72"],
    description: "Given two strings word1 and word2, return the minimum number of operations required to convert word1 to word2 (insert character, delete character, replace character).",
    constraints: ["0 <= word1.length, word2.length <= 500"],
    examples: [
      { input: "word1 = \"horse\", word2 = \"ros\"", output: "3" },
      { input: "word1 = \"intention\", word2 = \"execution\"", output: "5" }
    ]
  },
  {
    title: "Propagate Matrix Zeroes In-Place",
    slug: "set-matrix-zeroes",
    difficulty: "Medium",
    points: 5,
    tags: ["Array", "Hash Table", "Matrix", "LC-73"],
    description: "Given an m x n integer matrix matrix, if an element is 0, set its entire row and column to 0's. You must do it in-place with O(1) extra space.",
    constraints: ["m == matrix.length", "n == matrix[0].length", "1 <= m, n <= 200"],
    examples: [
      { input: "matrix = [[1,1,1],[1,0,1],[1,1,1]]", output: "[[1,0,1],[0,0,0],[1,0,1]]" }
    ]
  },
  {
    title: "Search Row-Sorted 2D Matrix",
    slug: "search-a-2d-matrix",
    difficulty: "Medium",
    points: 5,
    tags: ["Array", "Binary Search", "Matrix", "LC-74"],
    description: "You are given an m x n integer matrix with properties: each row is sorted, and the first integer of each row is greater than the last integer of the previous row. Given target, return true if target is in matrix, false otherwise in O(log(m * n)).",
    constraints: ["m == matrix.length", "n == matrix[i].length", "1 <= m, n <= 100"],
    examples: [
      { input: "matrix = [[1,3,5,7],[10,11,16,20],[23,30,34,60]], target = 3", output: "true" },
      { input: "matrix = [[1,3,5,7],[10,11,16,20],[23,30,34,60]], target = 13", output: "false" }
    ]
  },
  {
    title: "Sort Three Colors In-Place",
    slug: "sort-colors",
    difficulty: "Medium",
    points: 5,
    tags: ["Array", "Two Pointers", "Sorting", "LC-75"],
    description: "Given an array nums with n objects colored red, white, or blue (represented as 0, 1, and 2), sort them in-place so that objects of the same color are adjacent, with colors in order 0, 1, and 2 (Dutch National Flag problem).",
    constraints: ["n == nums.length", "1 <= n <= 300", "nums[i] is either 0, 1, or 2."],
    examples: [
      { input: "nums = [2,0,2,1,1,0]", output: "[0,0,1,1,2,2]" },
      { input: "nums = [2,0,1]", output: "[0,1,2]" }
    ]
  },

  // 76 - 100
  {
    title: "Smallest Window Containing All Characters",
    slug: "minimum-window-substring",
    difficulty: "Hard",
    points: 10,
    tags: ["Hash Table", "String", "Sliding Window", "LC-76"],
    description: "Given two strings s and t of lengths m and n respectively, return the minimum window substring of s such that every character in t (including duplicates) is included in the window. If there is no such substring, return empty string \"\".",
    constraints: ["m == s.length", "n == t.length", "1 <= m, n <= 10^5"],
    examples: [
      { input: "s = \"ADOBECODEBANC\", t = \"ABC\"", output: "BANC" },
      { input: "s = \"a\", t = \"a\"", output: "a" }
    ]
  },
  {
    title: "Generate K-Length Combinations",
    slug: "combinations",
    difficulty: "Medium",
    points: 5,
    tags: ["Backtracking", "LC-77"],
    description: "Given two integers n and k, return all possible combinations of k numbers chosen from the range [1, n]. You may return the answer in any order.",
    constraints: ["1 <= n <= 20", "1 <= k <= n"],
    examples: [
      { input: "n = 4, k = 2", output: "[[1,2],[1,3],[1,4],[2,3],[2,4],[3,4]]" }
    ]
  },
  {
    title: "Generate Power Set Subsets",
    slug: "subsets",
    difficulty: "Medium",
    points: 5,
    tags: ["Array", "Backtracking", "Bit Manipulation", "LC-78"],
    description: "Given an integer array nums of unique elements, return all possible subsets (the power set). The solution set must not contain duplicate subsets. Return the solution in any order.",
    constraints: ["1 <= nums.length <= 10", "-10 <= nums[i] <= 10", "All the numbers of nums are unique."],
    examples: [
      { input: "nums = [1,2,3]", output: "[[],[1],[2],[1,2],[3],[1,3],[2,3],[1,2,3]]" }
    ]
  },
  {
    title: "Search Word in Character Grid",
    slug: "word-search",
    difficulty: "Medium",
    points: 5,
    tags: ["Array", "String", "Backtracking", "Matrix", "LC-79"],
    description: "Given an m x n grid of characters board and a string word, return true if word exists in the grid. The word can be constructed from letters of sequentially adjacent cells (horizontally or vertically), where the same letter cell may not be used more than once.",
    constraints: ["m == board.length", "n = board[i].length", "1 <= m, n <= 6", "1 <= word.length <= 15"],
    examples: [
      { input: "board = [[\"A\",\"B\",\"C\",\"E\"],[\"S\",\"F\",\"C\",\"S\"],[\"A\",\"D\",\"E\",\"E\"]], word = \"ABCCED\"", output: "true" }
    ]
  },
  {
    title: "Allow Two Duplicates in Sorted Array",
    slug: "remove-duplicates-from-sorted-array-ii",
    difficulty: "Medium",
    points: 5,
    tags: ["Array", "Two Pointers", "LC-80"],
    description: "Given an integer array nums sorted in non-decreasing order, remove some duplicates in-place such that each unique element appears at most twice. Return k after placing final result in the first k slots of nums.",
    constraints: ["1 <= nums.length <= 3 * 10^4", "-10^4 <= nums[i] <= 10^4"],
    examples: [
      { input: "nums = [1,1,1,2,2,3]", output: "5", explanation: "First 5 elements are [1, 1, 2, 2, 3]." }
    ]
  },
  {
    title: "Search Rotated Array with Duplicates",
    slug: "search-in-rotated-sorted-array-ii",
    difficulty: "Medium",
    points: 5,
    tags: ["Array", "Binary Search", "LC-81"],
    description: "Given the array nums after rotation and an integer target, return true if target is in nums, or false if it is not. The array may contain duplicate values.",
    constraints: ["1 <= nums.length <= 5000", "-10^4 <= nums[i], target <= 10^4"],
    examples: [
      { input: "nums = [2,5,6,0,0,1,2], target = 0", output: "true" },
      { input: "nums = [2,5,6,0,0,1,2], target = 3", output: "false" }
    ]
  },
  {
    title: "Delete All Duplicate Nodes in List",
    slug: "remove-duplicates-from-sorted-list-ii",
    difficulty: "Medium",
    points: 5,
    tags: ["Linked List", "Two Pointers", "LC-82"],
    description: "Given the head of a sorted linked list, delete all nodes that have duplicate numbers, leaving only distinct numbers from the original list. Return the linked list sorted as well.",
    constraints: ["The number of nodes in the list is in the range [0, 300].", "-100 <= Node.val <= 100"],
    examples: [
      { input: "head = [1,2,3,3,4,4,5]", output: "[1,2,5]" }
    ]
  },
  {
    title: "Deduplicate Sorted Linked List",
    slug: "remove-duplicates-from-sorted-list",
    difficulty: "Easy",
    points: 3,
    tags: ["Linked List", "LC-83"],
    description: "Given the head of a sorted linked list, delete all duplicates such that each element appears only once. Return the linked list sorted as well.",
    constraints: ["The number of nodes in the list is in the range [0, 300].", "-100 <= Node.val <= 100"],
    examples: [
      { input: "head = [1,1,2]", output: "[1,2]" },
      { input: "head = [1,1,2,3,3]", output: "[1,2,3]" }
    ]
  },
  {
    title: "Maximal Histogram Rectangle Area",
    slug: "largest-rectangle-in-histogram",
    difficulty: "Hard",
    points: 10,
    tags: ["Array", "Stack", "Monotonic Stack", "LC-84"],
    description: "Given an array of integers heights representing the histogram's bar height where the width of each bar is 1, return the area of the largest rectangle in the histogram in O(n) time.",
    constraints: ["1 <= heights.length <= 10^5", "0 <= heights[i] <= 10^4"],
    examples: [
      { input: "heights = [2,1,5,6,2,3]", output: "10", explanation: "The largest rectangle is formed by bars [5,6] with area = 2 * 5 = 10." }
    ]
  },
  {
    title: "Largest Binary Matrix Rectangle",
    slug: "maximal-rectangle",
    difficulty: "Hard",
    points: 10,
    tags: ["Array", "Dynamic Programming", "Stack", "Matrix", "Monotonic Stack", "LC-85"],
    description: "Given a rows x cols binary matrix filled with 0's and 1's, find the largest rectangle containing only 1's and return its area.",
    constraints: ["rows == matrix.length", "cols == matrix[i].length", "1 <= row, cols <= 200"],
    examples: [
      { input: "matrix = [[\"1\",\"0\",\"1\",\"0\",\"0\"],[\"1\",\"0\",\"1\",\"1\",\"1\"],[\"1\",\"1\",\"1\",\"1\",\"1\"],[\"1\",\"0\",\"0\",\"1\",\"0\"]]", output: "6" }
    ]
  },
  {
    title: "Partition Linked List Around Value",
    slug: "partition-list",
    difficulty: "Medium",
    points: 5,
    tags: ["Linked List", "Two Pointers", "LC-86"],
    description: "Given the head of a linked list and a value x, partition it such that all nodes less than x come before nodes greater than or equal to x while preserving relative order of nodes in each partition.",
    constraints: ["The number of nodes in the list is in the range [0, 200].", "-100 <= Node.val, x <= 100"],
    examples: [
      { input: "head = [1,4,3,2,5,2], x = 3", output: "[1,2,2,4,3,5]" }
    ]
  },
  {
    title: "Merge Sorted Arrays In-Place",
    slug: "merge-sorted-array",
    difficulty: "Easy",
    points: 3,
    tags: ["Array", "Two Pointers", "Sorting", "LC-88"],
    description: "You are given two integer arrays nums1 and nums2, sorted in non-decreasing order, and two integers m and n. Merge nums2 into nums1 as one sorted array in-place.",
    constraints: ["nums1.length == m + n", "nums2.length == n", "0 <= m, n <= 200", "1 <= m + n <= 200"],
    examples: [
      { input: "nums1 = [1,2,3,0,0,0], m = 3, nums2 = [2,5,6], n = 3", output: "[1,2,2,3,5,6]" }
    ]
  },
  {
    title: "Generate N-bit Gray Code Sequence",
    slug: "gray-code",
    difficulty: "Medium",
    points: 5,
    tags: ["Math", "Backtracking", "Bit Manipulation", "LC-89"],
    description: "An n-bit gray code sequence is a sequence of 2^n integers where every adjacent integer differs by exactly one bit. Given n, return any valid n-bit gray code sequence.",
    constraints: ["1 <= n <= 16"],
    examples: [
      { input: "n = 2", output: "[0,1,3,2]" }
    ]
  },
  {
    title: "Subsets with Duplicate Numbers",
    slug: "subsets-ii",
    difficulty: "Medium",
    points: 5,
    tags: ["Array", "Backtracking", "Bit Manipulation", "LC-90"],
    description: "Given an integer array nums that may contain duplicates, return all possible subsets (the power set). The solution set must not contain duplicate subsets.",
    constraints: ["1 <= nums.length <= 10", "-10 <= nums[i] <= 10"],
    examples: [
      { input: "nums = [1,2,2]", output: "[[],[1],[1,2],[1,2,2],[2],[2,2]]" }
    ]
  },
  {
    title: "Count Decoded Message Possibilities",
    slug: "decode-ways",
    difficulty: "Medium",
    points: 5,
    tags: ["String", "Dynamic Programming", "LC-91"],
    description: "A message containing letters from A-Z can be encoded into numbers using 'A' -> \"1\", ..., 'Z' -> \"26\". Given a string s containing only digits, return the number of ways to decode it.",
    constraints: ["1 <= s.length <= 100", "s contains only digits and may contain leading zero(s)."],
    examples: [
      { input: "s = \"12\"", output: "2", explanation: "\"AB\" (1 2) or \"L\" (12)." },
      { input: "s = \"226\"", output: "3", explanation: "\"BZ\" (2 26), \"VF\" (22 6), or \"BBF\" (2 2 6)." }
    ]
  },
  {
    title: "Reverse Linked List Subsegment",
    slug: "reverse-linked-list-ii",
    difficulty: "Medium",
    points: 5,
    tags: ["Linked List", "LC-92"],
    description: "Given the head of a singly linked list and two integers left and right where left <= right, reverse the nodes of the list from position left to position right, and return the reversed list.",
    constraints: ["The number of nodes in the list is n", "1 <= n <= 500", "-500 <= Node.val <= 500", "1 <= left <= right <= n"],
    examples: [
      { input: "head = [1,2,3,4,5], left = 2, right = 4", output: "[1,4,3,2,5]" }
    ]
  },
  {
    title: "Validate and Restore IPv4 Addresses",
    slug: "restore-ip-addresses",
    difficulty: "Medium",
    points: 5,
    tags: ["String", "Backtracking", "LC-93"],
    description: "A valid IPv4 address consists of exactly four integers separated by single dots. Each integer is between 0 and 255 (no leading zeros). Given a string s containing only digits, return all possible valid IP addresses.",
    constraints: ["1 <= s.length <= 20"],
    examples: [
      { input: "s = \"25525511135\"", output: "[\"255.255.11.135\",\"255.255.111.35\"]" }
    ]
  },
  {
    title: "Inorder Traversal of Binary Tree",
    slug: "binary-tree-inorder-traversal",
    difficulty: "Easy",
    points: 3,
    tags: ["Stack", "Tree", "Depth-First Search", "Binary Tree", "LC-94"],
    description: "Given the root of a binary tree, return the inorder traversal of its nodes' values.",
    constraints: ["The number of nodes in the tree is in the range [0, 100].", "-100 <= Node.val <= 100"],
    examples: [
      { input: "root = [1,null,2,3]", output: "[1,3,2]" },
      { input: "root = []", output: "[]" }
    ]
  },
  {
    title: "Count Unique BST Combinations",
    slug: "unique-binary-search-trees",
    difficulty: "Medium",
    points: 5,
    tags: ["Math", "Dynamic Programming", "Tree", "Binary Search Tree", "LC-96"],
    description: "Given an integer n, return the number of structurally unique BST's (binary search trees) which has exactly n nodes of unique values from 1 to n (Catalan numbers).",
    constraints: ["1 <= n <= 19"],
    examples: [
      { input: "n = 3", output: "5" },
      { input: "n = 1", output: "1" }
    ]
  },
  {
    title: "Verify Valid BST Properties",
    slug: "validate-binary-search-tree",
    difficulty: "Medium",
    points: 5,
    tags: ["Tree", "Depth-First Search", "Binary Search Tree", "Binary Tree", "LC-98"],
    description: "Given the root of a binary tree, determine if it is a valid binary search tree (BST). Left subtree values must be strictly less than node, right subtree values strictly greater.",
    constraints: ["The number of nodes in the tree is in the range [1, 10^4].", "-2^31 <= Node.val <= 2^31 - 1"],
    examples: [
      { input: "root = [2,1,3]", output: "true" },
      { input: "root = [5,1,4,null,null,3,6]", output: "false" }
    ]
  },
  {
    title: "Verify Identical Binary Trees",
    slug: "same-tree",
    difficulty: "Easy",
    points: 3,
    tags: ["Tree", "Depth-First Search", "Breadth-First Search", "Binary Tree", "LC-100"],
    description: "Given the roots of two binary trees p and q, write a function to check if they are the same or not. Two binary trees are considered the same if they are structurally identical, and the nodes have the same value.",
    constraints: ["The number of nodes in both trees is in the range [0, 100].", "-10^4 <= Node.val <= 10^4"],
    examples: [
      { input: "p = [1,2,3], q = [1,2,3]", output: "true" },
      { input: "p = [1,2], q = [1,null,2]", output: "false" }
    ]
  },

  // 101 - 150
  {
    title: "Mirror Symmetric Binary Tree",
    slug: "symmetric-tree",
    difficulty: "Easy",
    points: 3,
    tags: ["Tree", "Depth-First Search", "Breadth-First Search", "Binary Tree", "LC-101"],
    description: "Given the root of a binary tree, check whether it is a mirror of itself (i.e., symmetric around its center).",
    constraints: ["The number of nodes in the tree is in the range [1, 1000].", "-100 <= Node.val <= 100"],
    examples: [
      { input: "root = [1,2,2,3,4,4,3]", output: "true" },
      { input: "root = [1,2,2,null,3,null,3]", output: "false" }
    ]
  },
  {
    title: "Level-by-Level Tree Traversal",
    slug: "binary-tree-level-order-traversal",
    difficulty: "Medium",
    points: 5,
    tags: ["Tree", "Breadth-First Search", "Binary Tree", "LC-102"],
    description: "Given the root of a binary tree, return the level order traversal of its nodes' values (i.e., from left to right, level by level).",
    constraints: ["The number of nodes in the tree is in the range [0, 2000].", "-1000 <= Node.val <= 1000"],
    examples: [
      { input: "root = [3,9,20,null,null,15,7]", output: "[[3],[9,20],[15,7]]" }
    ]
  },
  {
    title: "Zigzag Level Tree Traversal",
    slug: "binary-tree-zigzag-level-order-traversal",
    difficulty: "Medium",
    points: 5,
    tags: ["Tree", "Breadth-First Search", "Binary Tree", "LC-103"],
    description: "Given the root of a binary tree, return the zigzag level order traversal of its nodes' values (i.e., alternate left-to-right and right-to-left for next level).",
    constraints: ["The number of nodes in the tree is in the range [0, 2000].", "-1000 <= Node.val <= 1000"],
    examples: [
      { input: "root = [3,9,20,null,null,15,7]", output: "[[3],[20,9],[15,7]]" }
    ]
  },
  {
    title: "Binary Tree Max Depth Height",
    slug: "maximum-depth-of-binary-tree",
    difficulty: "Easy",
    points: 3,
    tags: ["Tree", "Depth-First Search", "Breadth-First Search", "Binary Tree", "LC-104"],
    description: "Given the root of a binary tree, return its maximum depth. A binary tree's maximum depth is the number of nodes along the longest path from the root node down to the farthest leaf node.",
    constraints: ["The number of nodes in the tree is in the range [0, 10^4].", "-100 <= Node.val <= 100"],
    examples: [
      { input: "root = [3,9,20,null,null,15,7]", output: "3" },
      { input: "root = [1,null,2]", output: "2" }
    ]
  },
  {
    title: "Build Tree from Preorder and Inorder",
    slug: "construct-binary-tree-from-preorder-and-inorder-traversal",
    difficulty: "Medium",
    points: 5,
    tags: ["Array", "Hash Table", "Divide and Conquer", "Tree", "Binary Tree", "LC-105"],
    description: "Given two integer arrays preorder and inorder where preorder is the preorder traversal of a binary tree and inorder is the inorder traversal of the same tree, construct and return the binary tree.",
    constraints: ["1 <= preorder.length <= 3000", "inorder.length == preorder.length", "-3000 <= preorder[i], inorder[i] <= 3000"],
    examples: [
      { input: "preorder = [3,9,20,15,7], inorder = [9,3,15,20,7]", output: "[3,9,20,null,null,15,7]" }
    ]
  },
  {
    title: "Build Height-Balanced BST from Array",
    slug: "convert-sorted-array-to-binary-search-tree",
    difficulty: "Easy",
    points: 3,
    tags: ["Array", "Divide and Conquer", "Tree", "Binary Search Tree", "Binary Tree", "LC-108"],
    description: "Given an integer array nums where the elements are sorted in ascending order, convert it to a height-balanced binary search tree.",
    constraints: ["1 <= nums.length <= 10^4", "-10^4 <= nums[i] <= 10^4", "nums is sorted in strictly increasing order."],
    examples: [
      { input: "nums = [-10,-3,0,5,9]", output: "[0,-3,9,-10,null,5]" }
    ]
  },
  {
    title: "Verify Height-Balanced Tree",
    slug: "balanced-binary-tree",
    difficulty: "Easy",
    points: 3,
    tags: ["Tree", "Depth-First Search", "Binary Tree", "LC-110"],
    description: "Given a binary tree, determine if it is height-balanced (a binary tree in which the depth of the two subtrees of every node never differs by more than one).",
    constraints: ["The number of nodes in the tree is in the range [0, 5000].", "-10^4 <= Node.val <= 10^4"],
    examples: [
      { input: "root = [3,9,20,null,null,15,7]", output: "true" },
      { input: "root = [1,2,2,3,3,null,null,4,4]", output: "false" }
    ]
  },
  {
    title: "Root-to-Leaf Target Path Sum",
    slug: "path-sum",
    difficulty: "Easy",
    points: 3,
    tags: ["Tree", "Depth-First Search", "Breadth-First Search", "Binary Tree", "LC-112"],
    description: "Given the root of a binary tree and an integer targetSum, return true if the tree has a root-to-leaf path such that adding up all the values along the path equals targetSum.",
    constraints: ["The number of nodes in the tree is in the range [0, 5000].", "-1000 <= Node.val <= 1000", "-1000 <= targetSum <= 1000"],
    examples: [
      { input: "root = [5,4,8,11,null,13,4,7,2,null,null,null,1], targetSum = 22", output: "true" }
    ]
  },
  {
    title: "Find All Root-to-Leaf Target Paths",
    slug: "path-sum-ii",
    difficulty: "Medium",
    points: 5,
    tags: ["Backtracking", "Tree", "Depth-First Search", "Binary Tree", "LC-113"],
    description: "Given the root of a binary tree and an integer targetSum, return all root-to-leaf paths where the sum of the node values in the path equals targetSum. Each path should be returned as a list of the node values.",
    constraints: ["The number of nodes in the tree is in the range [0, 5000].", "-1000 <= Node.val, targetSum <= 1000"],
    examples: [
      { input: "root = [5,4,8,11,null,13,4,7,2,null,null,5,1], targetSum = 22", output: "[[5,4,11,2],[5,8,4,5]]" }
    ]
  },
  {
    title: "Flatten Tree to Right-Heavy List",
    slug: "flatten-binary-tree-to-linked-list",
    difficulty: "Medium",
    points: 5,
    tags: ["Linked List", "Stack", "Tree", "Depth-First Search", "Binary Tree", "LC-114"],
    description: "Given the root of a binary tree, flatten the tree into a \"linked list\" in-place following preorder traversal. The \"linked list\" should use the same TreeNode class where right child points to next node and left child is always null.",
    constraints: ["The number of nodes in the tree is in the range [0, 2000].", "-100 <= Node.val <= 100"],
    examples: [
      { input: "root = [1,2,5,3,4,null,6]", output: "[1,null,2,null,3,null,4,null,5,null,6]" }
    ]
  },
  {
    title: "Generate Pascal's Triangle Rows",
    slug: "pascals-triangle",
    difficulty: "Easy",
    points: 3,
    tags: ["Array", "Dynamic Programming", "LC-118"],
    description: "Given an integer numRows, return the first numRows of Pascal's triangle. In Pascal's triangle, each number is the sum of the two numbers directly above it.",
    constraints: ["1 <= numRows <= 30"],
    examples: [
      { input: "numRows = 5", output: "[[1],[1,1],[1,2,1],[1,3,3,1],[1,4,6,4,1]]" }
    ]
  },
  {
    title: "Minimum Total Path Sum in Triangle",
    slug: "triangle",
    difficulty: "Medium",
    points: 5,
    tags: ["Array", "Dynamic Programming", "LC-120"],
    description: "Given a triangle array, return the minimum path sum from top to bottom. For each step, you may move to an adjacent number on the row below.",
    constraints: ["1 <= triangle.length <= 200", "triangle[0].length == 1", "triangle[i].length == triangle[i - 1].length + 1"],
    examples: [
      { input: "triangle = [[2],[3,4],[6,5,7],[4,1,8,3]]", output: "11", explanation: "Path 2 -> 3 -> 5 -> 1 has minimum sum 11." }
    ]
  },
  {
    title: "Single Transaction Stock Max Profit",
    slug: "best-time-to-buy-and-sell-stock",
    difficulty: "Easy",
    points: 3,
    tags: ["Array", "Dynamic Programming", "LC-121"],
    description: "You are given an array prices where prices[i] is the price of a given stock on the i-th day. You want to maximize your profit by choosing a single day to buy one stock and choosing a different day in the future to sell that stock. Return maximum profit.",
    constraints: ["1 <= prices.length <= 10^5", "0 <= prices[i] <= 10^4"],
    examples: [
      { input: "prices = [7,1,5,3,6,4]", output: "5", explanation: "Buy on day 2 (price = 1) and sell on day 5 (price = 6), profit = 5." }
    ]
  },
  {
    title: "Unlimited Transactions Stock Profit",
    slug: "best-time-to-buy-and-sell-stock-ii",
    difficulty: "Medium",
    points: 5,
    tags: ["Array", "Dynamic Programming", "Greedy", "LC-122"],
    description: "You are given an integer array prices. On each day, you may decide to buy and/or sell the stock. You can only hold at most one share of the stock at any time. Find and return the maximum profit you can achieve.",
    constraints: ["1 <= prices.length <= 3 * 10^4", "0 <= prices[i] <= 10^4"],
    examples: [
      { input: "prices = [7,1,5,3,6,4]", output: "7", explanation: "Buy day 2 sell day 3 (profit 4), buy day 4 sell day 5 (profit 3), total = 7." }
    ]
  },
  {
    title: "At Most Two Stock Transactions",
    slug: "best-time-to-buy-and-sell-stock-iii",
    difficulty: "Hard",
    points: 10,
    tags: ["Array", "Dynamic Programming", "LC-123"],
    description: "You are given an array prices where prices[i] is the price of a given stock on the i-th day. Find the maximum profit you can achieve with at most two transactions. You may not engage in multiple transactions simultaneously.",
    constraints: ["1 <= prices.length <= 10^5", "0 <= prices[i] <= 10^5"],
    examples: [
      { input: "prices = [3,3,5,0,0,3,1,4]", output: "6" }
    ]
  },
  {
    title: "Max Path Sum in Binary Tree",
    slug: "binary-tree-maximum-path-sum",
    difficulty: "Hard",
    points: 10,
    tags: ["Dynamic Programming", "Tree", "Depth-First Search", "Binary Tree", "LC-124"],
    description: "A path in a binary tree is a sequence of nodes where each pair of adjacent nodes has an edge connecting them. Return the maximum path sum of any non-empty path in the tree.",
    constraints: ["The number of nodes in the tree is in the range [1, 3 * 10^4].", "-1000 <= Node.val <= 1000"],
    examples: [
      { input: "root = [1,2,3]", output: "6" },
      { input: "root = [-10,9,20,null,null,15,7]", output: "42" }
    ]
  },
  {
    title: "Alpha-Numeric Phrase Palindrome",
    slug: "valid-palindrome",
    difficulty: "Easy",
    points: 3,
    tags: ["Two Pointers", "String", "LC-125"],
    description: "A phrase is a palindrome if, after converting all uppercase letters into lowercase letters and removing all non-alphanumeric characters, it reads the same forward and backward. Given a string s, return true if it is a palindrome.",
    constraints: ["1 <= s.length <= 2 * 10^5", "s consists only of printable ASCII characters."],
    examples: [
      { input: "s = \"A man, a plan, a canal: Panama\"", output: "true" },
      { input: "s = \"race a car\"", output: "false" }
    ]
  },
  {
    title: "Shortest Transformation Word Ladder",
    slug: "word-ladder",
    difficulty: "Hard",
    points: 10,
    tags: ["Hash Table", "String", "Breadth-First Search", "Graph", "LC-127"],
    description: "A transformation sequence from word beginWord to word endWord using a dictionary wordList is a sequence of words beginWord -> s1 -> s2 -> ... -> sk such that every adjacent pair differs by single letter and words are in wordList. Return length of shortest sequence, or 0.",
    constraints: ["1 <= beginWord.length <= 10", "endWord.length == beginWord.length", "1 <= wordList.length <= 5000"],
    examples: [
      { input: "beginWord = \"hit\", endWord = \"cog\", wordList = [\"hot\",\"dot\",\"dog\",\"lot\",\"log\",\"cog\"]", output: "5" }
    ]
  },
  {
    title: "Longest Consecutive Sequence",
    slug: "longest-consecutive-sequence",
    difficulty: "Medium",
    points: 5,
    tags: ["Array", "Hash Table", "Union Find", "LC-128"],
    description: "Given an unsorted array of integers nums, return the length of the longest consecutive elements sequence in O(n) time.",
    constraints: ["0 <= nums.length <= 10^5", "-10^9 <= nums[i] <= 10^9"],
    examples: [
      { input: "nums = [100,4,200,1,3,2]", output: "4", explanation: "The longest consecutive elements sequence is [1, 2, 3, 4]. Length is 4." }
    ]
  },
  {
    title: "Sum of Root-to-Leaf Formed Numbers",
    slug: "sum-root-to-leaf-numbers",
    difficulty: "Medium",
    points: 5,
    tags: ["Tree", "Depth-First Search", "Binary Tree", "LC-129"],
    description: "You are given the root of a binary tree containing digits from 0 to 9 only. Each root-to-leaf path in the tree represents a number. Return the total sum of all root-to-leaf numbers.",
    constraints: ["The number of nodes in the tree is in the range [1, 1000].", "0 <= Node.val <= 9"],
    examples: [
      { input: "root = [1,2,3]", output: "25", explanation: "12 + 13 = 25." }
    ]
  },
  {
    title: "Capture Surrounded Board Regions",
    slug: "surrounded-regions",
    difficulty: "Medium",
    points: 5,
    tags: ["Array", "Depth-First Search", "Breadth-First Search", "Union Find", "Matrix", "LC-130"],
    description: "Given an m x n matrix board containing 'X' and 'O', capture all regions that are 4-directionally surrounded by 'X'. A region is captured by flipping all 'O's into 'X's in that surrounded region.",
    constraints: ["m == board.length", "n == board[i].length", "1 <= m, n <= 200"],
    examples: [
      { input: "board = [[\"X\",\"X\",\"X\",\"X\"],[\"X\",\"O\",\"O\",\"X\"],[\"X\",\"X\",\"O\",\"X\"],[\"X\",\"O\",\"X\",\"X\"]]", output: "[[\"X\",\"X\",\"X\",\"X\"],[\"X\",\"X\",\"X\",\"X\"],[\"X\",\"X\",\"X\",\"X\"],[\"X\",\"O\",\"X\",\"X\"]]" }
    ]
  },
  {
    title: "Partition String into Palindromes",
    slug: "palindrome-partitioning",
    difficulty: "Medium",
    points: 5,
    tags: ["String", "Dynamic Programming", "Backtracking", "LC-131"],
    description: "Given a string s, partition s such that every substring of the partition is a palindrome. Return all possible palindrome partitioning of s.",
    constraints: ["1 <= s.length <= 16", "s contains only lowercase English letters."],
    examples: [
      { input: "s = \"aab\"", output: "[[\"a\",\"a\",\"b\"],[\"aa\",\"b\"]]" }
    ]
  },
  {
    title: "Deep Copy of Connected Undirected Graph",
    slug: "clone-graph",
    difficulty: "Medium",
    points: 5,
    tags: ["Hash Table", "Depth-First Search", "Breadth-First Search", "Graph", "LC-133"],
    description: "Given a reference of a node in a connected undirected graph, return a deep copy (clone) of the graph. Each node contains a value val (int) and a list (List[Node]) of its neighbors.",
    constraints: ["The number of nodes in the graph is in the range [0, 100].", "1 <= Node.val <= 100"],
    examples: [
      { input: "adjList = [[2,4],[1,3],[2,4],[1,3]]", output: "[[2,4],[1,3],[2,4],[1,3]]" }
    ]
  },
  {
    title: "Complete Circular Gas Station Circuit",
    slug: "gas-station",
    difficulty: "Medium",
    points: 5,
    tags: ["Array", "Greedy", "LC-134"],
    description: "There are n gas stations along a circular route, where the amount of gas at the i-th station is gas[i]. You have a car with an unlimited gas tank and it costs cost[i] of gas to travel from the i-th station to its next (i + 1)-th station. Return starting gas station's index if you can travel around the circuit once clockwise.",
    constraints: ["n == gas.length == cost.length", "1 <= n <= 10^5", "0 <= gas[i], cost[i] <= 10^4"],
    examples: [
      { input: "gas = [1,2,3,4,5], cost = [3,4,5,1,2]", output: "3" }
    ]
  },
  {
    title: "Distribute Minimum Candies to Children",
    slug: "candy",
    difficulty: "Hard",
    points: 10,
    tags: ["Array", "Greedy", "LC-135"],
    description: "There are n children standing in a line. Each child is assigned a rating value given in ratings. Each child must have at least one candy, and children with a higher rating get more candies than their neighbors. Return minimum candies required.",
    constraints: ["n == ratings.length", "1 <= n <= 2 * 10^4", "0 <= ratings[i] <= 2 * 10^4"],
    examples: [
      { input: "ratings = [1,0,2]", output: "5", explanation: "Candies given: [2, 1, 2]." }
    ]
  },
  {
    title: "Find Unique Single Number in Pairs",
    slug: "single-number",
    difficulty: "Easy",
    points: 3,
    tags: ["Array", "Bit Manipulation", "LC-136"],
    description: "Given a non-empty array of integers nums, every element appears twice except for one. Find that single one. You must implement a solution with a linear runtime complexity and use only constant extra space (XOR).",
    constraints: ["1 <= nums.length <= 3 * 10^4", "-3 * 10^4 <= nums[i] <= 3 * 10^4"],
    examples: [
      { input: "nums = [2,2,1]", output: "1" },
      { input: "nums = [4,1,2,1,2]", output: "4" }
    ]
  },
  {
    title: "Find Unique Number Among Triplets",
    slug: "single-number-ii",
    difficulty: "Medium",
    points: 5,
    tags: ["Array", "Bit Manipulation", "LC-137"],
    description: "Given an integer array nums where every element appears three times except for one, which appears exactly once. Find the single element and return it in O(n) time and O(1) space.",
    constraints: ["1 <= nums.length <= 3 * 10^4", "-2^31 <= nums[i] <= 2^31 - 1"],
    examples: [
      { input: "nums = [2,2,3,2]", output: "3" },
      { input: "nums = [0,1,0,1,0,1,99]", output: "99" }
    ]
  },
  {
    title: "Deep Copy Linked List with Arbitrary Pointers",
    slug: "copy-list-with-random-pointer",
    difficulty: "Medium",
    points: 5,
    tags: ["Hash Table", "Linked List", "LC-138"],
    description: "A linked list of length n is given such that each node contains an additional random pointer, which could point to any node in the list, or null. Construct a deep copy of the list.",
    constraints: ["0 <= n <= 1000", "-10^4 <= Node.val <= 10^4"],
    examples: [
      { input: "head = [[7,null],[13,0],[11,4],[10,2],[1,0]]", output: "[[7,null],[13,0],[11,4],[10,2],[1,0]]" }
    ]
  },
  {
    title: "Segment String into Dictionary Words",
    slug: "word-break",
    difficulty: "Medium",
    points: 5,
    tags: ["Array", "Hash Table", "String", "Dynamic Programming", "Trie", "LC-139"],
    description: "Given a string s and a dictionary of strings wordDict, return true if s can be segmented into a space-separated sequence of one or more dictionary words.",
    constraints: ["1 <= s.length <= 300", "1 <= wordDict.length <= 1000", "1 <= wordDict[i].length <= 20"],
    examples: [
      { input: "s = \"leetcode\", wordDict = [\"leet\",\"code\"]", output: "true" },
      { input: "s = \"applepenapple\", wordDict = [\"apple\",\"pen\"]", output: "true" },
      { input: "s = \"catsandog\", wordDict = [\"cats\",\"dog\",\"sand\",\"and\",\"cat\"]", output: "false" }
    ]
  },
  {
    title: "Detect Cycle in Linked List",
    slug: "linked-list-cycle",
    difficulty: "Easy",
    points: 3,
    tags: ["Hash Table", "Linked List", "Two Pointers", "LC-141"],
    description: "Given head, the head of a linked list, determine if the linked list has a cycle in it using Floyd's Tortoise and Hare algorithm.",
    constraints: ["The number of the nodes in the list is in the range [0, 10^4].", "-10^5 <= Node.val <= 10^5"],
    examples: [
      { input: "head = [3,2,0,-4], pos = 1", output: "true" },
      { input: "head = [1], pos = -1", output: "false" }
    ]
  },
  {
    title: "Find Start Node of Linked List Cycle",
    slug: "linked-list-cycle-ii",
    difficulty: "Medium",
    points: 5,
    tags: ["Hash Table", "Linked List", "Two Pointers", "LC-142"],
    description: "Given the head of a linked list, return the node where the cycle begins. If there is no cycle, return null. Do not modify the linked list.",
    constraints: ["The number of the nodes in the list is in the range [0, 10^4].", "-10^5 <= Node.val <= 10^5"],
    examples: [
      { input: "head = [3,2,0,-4], pos = 1", output: "node with value 2" }
    ]
  },
  {
    title: "Fold and Interleave Linked List",
    slug: "reorder-list",
    difficulty: "Medium",
    points: 5,
    tags: ["Linked List", "Two Pointers", "Stack", "Recursion", "LC-143"],
    description: "You are given the head of a singly linked-list: L0 -> L1 -> ... -> Ln - 1 -> Ln. Reorder the list to: L0 -> Ln -> L1 -> Ln - 1 -> L2 -> Ln - 2 -> ... You may not modify the values in the list's nodes.",
    constraints: ["The number of nodes in the list is in the range [1, 5 * 10^4].", "1 <= Node.val <= 1000"],
    examples: [
      { input: "head = [1,2,3,4]", output: "[1,4,2,3]" },
      { input: "head = [1,2,3,4,5]", output: "[1,5,2,4,3]" }
    ]
  },
  {
    title: "Least Recently Used (LRU) Cache Design",
    slug: "lru-cache",
    difficulty: "Medium",
    points: 5,
    tags: ["Hash Table", "Linked List", "Design", "Doubly-Linked List", "LC-146"],
    description: "Design a data structure that follows the constraints of a Least Recently Used (LRU) cache. Implement LRUCache class with get(key) and put(key, value) in O(1) average time complexity.",
    constraints: ["1 <= capacity <= 3000", "0 <= key <= 10^4", "0 <= value <= 10^5", "At most 2 * 10^5 calls to get and put."],
    examples: [
      { input: "[\"LRUCache\",\"put\",\"put\",\"get\",\"put\",\"get\",\"put\",\"get\",\"get\",\"get\"], [[2],[1,1],[2,2],[1],[3,3],[2],[4,4],[1],[3],[4]]", output: "[null,null,null,1,null,-1,null,-1,3,4]" }
    ]
  },
  {
    title: "Merge Sort on Linked List in O(n log n)",
    slug: "sort-list",
    difficulty: "Medium",
    points: 5,
    tags: ["Linked List", "Two Pointers", "Divide and Conquer", "Sorting", "Merge Sort", "LC-148"],
    description: "Given the head of a linked list, return the list after sorting it in ascending order in O(n log n) time and O(1) memory space.",
    constraints: ["The number of nodes in the list is in the range [0, 5 * 10^4].", "-10^5 <= Node.val <= 10^5"],
    examples: [
      { input: "head = [4,2,1,3]", output: "[1,2,3,4]" },
      { input: "head = [-1,5,3,4,0]", output: "[-1,0,3,4,5]" }
    ]
  },
  {
    title: "Evaluate Postfix RPN Expression",
    slug: "evaluate-reverse-polish-notation",
    difficulty: "Medium",
    points: 5,
    tags: ["Array", "Math", "Stack", "LC-150"],
    description: "You are given an array of strings tokens that represents an arithmetic expression in a Reverse Polish Notation. Evaluate the expression and return an integer that represents the value of the expression.",
    constraints: ["1 <= tokens.length <= 10^4", "tokens[i] is either an operator: \"+\", \"-\", \"*\", or \"/\", or an integer."],
    examples: [
      { input: "tokens = [\"2\",\"1\",\"+\",\"3\",\"*\"]", output: "9", explanation: "((2 + 1) * 3) = 9" },
      { input: "tokens = [\"4\",\"13\",\"5\",\"/\",\"+\"]", output: "6", explanation: "(4 + (13 / 5)) = 6" }
    ]
  },

  // 151 - 200
  {
    title: "Reverse Words in a String",
    slug: "reverse-words-in-a-string",
    difficulty: "Medium",
    points: 5,
    tags: ["Two Pointers", "String", "LC-151"],
    description: "Given an input string s, reverse the order of the words. A word is defined as a sequence of non-space characters. Return a string of words in reverse order concatenated by a single space, with no leading or trailing spaces.",
    constraints: ["1 <= s.length <= 10^4", "s contains English letters, digits, and spaces."],
    examples: [
      { input: "s = \"the sky is blue\"", output: "blue is sky the" },
      { input: "s = \"  hello world  \"", output: "world hello" }
    ]
  },
  {
    title: "Maximum Contiguous Product Subarray",
    slug: "maximum-product-subarray",
    difficulty: "Medium",
    points: 5,
    tags: ["Array", "Dynamic Programming", "LC-152"],
    description: "Given an integer array nums, find a subarray that has the largest product, and return the product. The test cases are generated so that the answer will fit in a 32-bit integer.",
    constraints: ["1 <= nums.length <= 2 * 10^4", "-10 <= nums[i] <= 10"],
    examples: [
      { input: "nums = [2,3,-2,4]", output: "6", explanation: "[2,3] has the largest product 6." },
      { input: "nums = [-2,0,-1]", output: "0" }
    ]
  },
  {
    title: "Find Pivot Minimum in Rotated Array",
    slug: "find-minimum-in-rotated-sorted-array",
    difficulty: "Medium",
    points: 5,
    tags: ["Array", "Binary Search", "LC-153"],
    description: "Suppose an array of length n sorted in ascending order is rotated between 1 and n times. Given the sorted rotated array nums of unique elements, return the minimum element of this array in O(log n) time.",
    constraints: ["n == nums.length", "1 <= n <= 5000", "-5000 <= nums[i] <= 5000", "All values are unique."],
    examples: [
      { input: "nums = [3,4,5,1,2]", output: "1" },
      { input: "nums = [4,5,6,7,0,1,2]", output: "0" }
    ]
  },
  {
    title: "Min Stack with O(1) Minimum Retrieval",
    slug: "min-stack",
    difficulty: "Medium",
    points: 5,
    tags: ["Stack", "Design", "LC-155"],
    description: "Design a stack that supports push, pop, top, and retrieving the minimum element in constant O(1) time complexity.",
    constraints: ["-2^31 <= val <= 2^31 - 1", "Methods pop, top and getMin operations will always be called on non-empty stacks."],
    examples: [
      { input: "[\"MinStack\",\"push\",\"push\",\"push\",\"getMin\",\"pop\",\"top\",\"getMin\"], [[],[-2],[0],[-3],[],[],[],[]]", output: "[null,null,null,null,-3,null,0,-2]" }
    ]
  },
  {
    title: "Intersection Node of Dual Linked Lists",
    slug: "intersection-of-two-linked-lists",
    difficulty: "Easy",
    points: 3,
    tags: ["Hash Table", "Linked List", "Two Pointers", "LC-160"],
    description: "Given the heads of two singly linked-lists headA and headB, return the node at which the two lists intersect. If the two linked lists have no intersection at all, return null in O(m + n) time and O(1) memory.",
    constraints: ["The number of nodes of listA is in m", "The number of nodes of listB is in n", "1 <= m, n <= 3 * 10^4"],
    examples: [
      { input: "intersectVal = 8, listA = [4,1,8,4,5], listB = [5,6,1,8,4,5]", output: "Reference to node with value 8" }
    ]
  },
  {
    title: "Locate Local Peak Element",
    slug: "find-peak-element",
    difficulty: "Medium",
    points: 5,
    tags: ["Array", "Binary Search", "LC-162"],
    description: "A peak element is an element that is strictly greater than its neighbors. Given a 0-indexed integer array nums, find a peak element, and return its index in O(log n) time.",
    constraints: ["1 <= nums.length <= 1000", "-2^31 <= nums[i] <= 2^31 - 1", "nums[i] != nums[i + 1] for all valid i."],
    examples: [
      { input: "nums = [1,2,3,1]", output: "2", explanation: "3 is a peak element and your function should return the index number 2." }
    ]
  },
  {
    title: "Compare Semantic Version Numbers",
    slug: "compare-version-numbers",
    difficulty: "Medium",
    points: 5,
    tags: ["Two Pointers", "String", "LC-165"],
    description: "Given two version strings, version1 and version2, compare them. A version string consists of revisions separated by dots '.'. Return -1 if version1 < version2, 1 if version1 > version2, and 0 if equal.",
    constraints: ["1 <= version1.length, version2.length <= 500", "version1 and version2 only contain digits and '.'."],
    examples: [
      { input: "version1 = \"1.2\", version2 = \"1.10\"", output: "-1" },
      { input: "version1 = \"1.01\", version2 = \"1.001\"", output: "0" }
    ]
  },
  {
    title: "Target Pair Sum in Sorted Array",
    slug: "two-sum-ii-input-array-is-sorted",
    difficulty: "Medium",
    points: 5,
    tags: ["Array", "Two Pointers", "Binary Search", "LC-167"],
    description: "Given a 1-indexed array of integers numbers that is already sorted in non-decreasing order, find two numbers such that they add up to a specific target number. Return the indices of the two numbers [index1, index2] as an integer array of length 2.",
    constraints: ["2 <= numbers.length <= 3 * 10^4", "-1000 <= numbers[i] <= 1000", "numbers is sorted in non-decreasing order."],
    examples: [
      { input: "numbers = [2,7,11,15], target = 9", output: "[1,2]" }
    ]
  },
  {
    title: "Boyer-Moore Majority Element",
    slug: "majority-element",
    difficulty: "Easy",
    points: 3,
    tags: ["Array", "Hash Table", "Divide and Conquer", "Counting", "LC-169"],
    description: "Given an array nums of size n, return the majority element. The majority element is the element that appears more than ⌊n / 2⌋ times. You may assume that the majority element always exists in the array.",
    constraints: ["n == nums.length", "1 <= n <= 5 * 10^4", "-10^9 <= nums[i] <= 10^9"],
    examples: [
      { input: "nums = [3,2,3]", output: "3" },
      { input: "nums = [2,2,1,1,1,2,2]", output: "2" }
    ]
  },
  {
    title: "Controlled Inorder BST Iterator",
    slug: "binary-search-tree-iterator",
    difficulty: "Medium",
    points: 5,
    tags: ["Stack", "Tree", "Design", "Binary Search Tree", "Binary Tree", "Iterator", "LC-173"],
    description: "Implement the BSTIterator class that represents an iterator over the in-order traversal of a binary search tree (BST) with hasNext() and next() operations running in average O(1) time and using O(h) memory.",
    constraints: ["The number of nodes in the tree is in the range [1, 10^5].", "0 <= Node.val <= 10^6"],
    examples: [
      { input: "[\"BSTIterator\",\"next\",\"next\",\"hasNext\",\"next\",\"hasNext\"], [[[7,3,15,null,null,9,20]],[],[],[],[],[]]", output: "[null,3,7,true,9,true]" }
    ]
  },
  {
    title: "Knight Minimum Initial Health in Dungeon",
    slug: "dungeon-game",
    difficulty: "Hard",
    points: 10,
    tags: ["Array", "Dynamic Programming", "Matrix", "LC-174"],
    description: "The demons had captured the princess and imprisoned her in the bottom-right corner of a dungeon. A knight starts at top-left. Determine the knight's minimum initial health so that he can rescue the princess without health dropping to <= 0 at any room.",
    constraints: ["m == dungeon.length", "n == dungeon[i].length", "1 <= m, n <= 200", "-1000 <= dungeon[i][j] <= 1000"],
    examples: [
      { input: "dungeon = [[-2,-3,3],[-5,-10,1],[10,30,-5]]", output: "7" }
    ]
  },
  {
    title: "Arrange Numbers to Form Largest String",
    slug: "largest-number",
    difficulty: "Medium",
    points: 5,
    tags: ["Array", "String", "Greedy", "Sorting", "LC-179"],
    description: "Given a list of non-negative integers nums, arrange them such that they form the largest number and return it as a string.",
    constraints: ["1 <= nums.length <= 100", "0 <= nums[i] <= 10^9"],
    examples: [
      { input: "nums = [10,2]", output: "210" },
      { input: "nums = [3,30,34,5,9]", output: "9534330" }
    ]
  },
  {
    title: "Find Repeated 10-Letter DNA Sequences",
    slug: "repeated-dna-sequences",
    difficulty: "Medium",
    points: 5,
    tags: ["Hash Table", "String", "Bit Manipulation", "Sliding Window", "Rolling Hash", "LC-187"],
    description: "Given a string s that represents a DNA sequence, return all the 10-letter-long sequences (substrings) that occur more than once in a DNA molecule in any order.",
    constraints: ["1 <= s.length <= 10^5", "s[i] is either 'A', 'C', 'G', or 'T'."],
    examples: [
      { input: "s = \"AAAAACCCCCAAAAACCCCCCAAAAAGGGTTT\"", output: "[\"AAAAACCCCC\",\"CCCCCAAAAA\"]" }
    ]
  },
  {
    title: "Rotate Array by K Positions In-Place",
    slug: "rotate-array",
    difficulty: "Medium",
    points: 5,
    tags: ["Array", "Math", "Two Pointers", "LC-189"],
    description: "Given an integer array nums, rotate the array to the right by k steps, where k is non-negative. Do it in-place with O(1) extra space.",
    constraints: ["1 <= nums.length <= 10^5", "-2^31 <= nums[i] <= 2^31 - 1", "0 <= k <= 10^5"],
    examples: [
      { input: "nums = [1,2,3,4,5,6,7], k = 3", output: "[5,6,7,1,2,3,4]" }
    ]
  },
  {
    title: "Reverse Bits of 32-bit Integer",
    slug: "reverse-bits",
    difficulty: "Easy",
    points: 3,
    tags: ["Divide and Conquer", "Bit Manipulation", "LC-190"],
    description: "Reverse bits of a given 32 bits unsigned integer.",
    constraints: ["The input must be a binary string of length 32"],
    examples: [
      { input: "n = 00000010100101000001111010011100", output: "964176192 (00111001011110000010100101000000)" }
    ]
  },
  {
    title: "Hamming Weight: Count of Set Bits",
    slug: "number-of-1-bits",
    difficulty: "Easy",
    points: 3,
    tags: ["Divide and Conquer", "Bit Manipulation", "LC-191"],
    description: "Write a function that takes the binary representation of a positive integer and returns the number of set bits it has (also known as the Hamming weight).",
    constraints: ["1 <= n <= 2^31 - 1"],
    examples: [
      { input: "n = 11", output: "3", explanation: "11 in binary is 1011, having three set bits." },
      { input: "n = 128", output: "1" }
    ]
  },
  {
    title: "Maximum Non-Adjacent House Loot",
    slug: "house-robber",
    difficulty: "Medium",
    points: 5,
    tags: ["Array", "Dynamic Programming", "LC-198"],
    description: "You are a professional robber planning to rob houses along a street. Each house has a certain amount of money stashed. Adjacent houses have security systems connected. Given an integer array nums representing the amount of money of each house, return the maximum amount of money you can rob tonight without alerting the police.",
    constraints: ["1 <= nums.length <= 100", "0 <= nums[i] <= 400"],
    examples: [
      { input: "nums = [1,2,3,1]", output: "4", explanation: "Rob house 1 (money = 1) and house 3 (money = 3). Total = 4." },
      { input: "nums = [2,7,9,3,1]", output: "12" }
    ]
  },
  {
    title: "Right Visible Nodes of Binary Tree",
    slug: "binary-tree-right-side-view",
    difficulty: "Medium",
    points: 5,
    tags: ["Tree", "Depth-First Search", "Breadth-First Search", "Binary Tree", "LC-199"],
    description: "Given the root of a binary tree, imagine yourself standing on the right side of it, return the values of the nodes you can see ordered from top to bottom.",
    constraints: ["The number of nodes in the tree is in the range [0, 100].", "-100 <= Node.val <= 100"],
    examples: [
      { input: "root = [1,2,3,null,5,null,4]", output: "[1,3,4]" }
    ]
  },
  {
    title: "Count Connected Grid Islands",
    slug: "number-of-islands",
    difficulty: "Medium",
    points: 5,
    tags: ["Array", "Depth-First Search", "Breadth-First Search", "Union Find", "Matrix", "LC-200"],
    description: "Given an m x n 2D binary grid grid which represents a map of '1's (land) and '0's (water), return the number of islands. An island is surrounded by water and is formed by connecting adjacent lands horizontally or vertically.",
    constraints: ["m == grid.length", "n == grid[i].length", "1 <= m, n <= 300", "grid[i][j] is '0' or '1'."],
    examples: [
      { input: "grid = [[\"1\",\"1\",\"1\",\"1\",\"0\"],[\"1\",\"1\",\"0\",\"1\",\"0\"],[\"1\",\"1\",\"0\",\"0\",\"0\"],[\"0\",\"0\",\"0\",\"0\",\"0\"]]", output: "1" },
      { input: "grid = [[\"1\",\"1\",\"0\",\"0\",\"0\"],[\"1\",\"1\",\"0\",\"0\",\"0\"],[\"0\",\"0\",\"1\",\"0\",\"0\"],[\"0\",\"0\",\"0\",\"1\",\"1\"]]", output: "3" }
    ]
  },

  // 201 - 250
  {
    title: "Verify Happy Number Cycle",
    slug: "happy-number",
    difficulty: "Easy",
    points: 3,
    tags: ["Hash Table", "Math", "Two Pointers", "LC-202"],
    description: "Write an algorithm to determine if a number n is happy. Starting with any positive integer, replace the number by the sum of the squares of its digits, and repeat until the number equals 1 (where it stays), or it loops endlessly in a cycle which does not include 1.",
    constraints: ["1 <= n <= 2^31 - 1"],
    examples: [
      { input: "n = 19", output: "true", explanation: "1^2 + 9^2 = 82 -> 8^2 + 2^2 = 68 -> 6^2 + 8^2 = 100 -> 1^2 + 0 + 0 = 1." },
      { input: "n = 2", output: "false" }
    ]
  },
  {
    title: "Delete All Target Value Nodes in List",
    slug: "remove-linked-list-elements",
    difficulty: "Easy",
    points: 3,
    tags: ["Linked List", "Recursion", "LC-203"],
    description: "Given the head of a linked list and an integer val, remove all the nodes of the linked list that has Node.val == val, and return the new head.",
    constraints: ["The number of nodes in the list is in the range [0, 10^4].", "1 <= Node.val <= 50", "0 <= val <= 50"],
    examples: [
      { input: "head = [1,2,6,3,4,5,6], val = 6", output: "[1,2,3,4,5]" },
      { input: "head = [], val = 1", output: "[]" }
    ]
  },
  {
    title: "Sieve of Eratosthenes Prime Counter",
    slug: "count-primes",
    difficulty: "Medium",
    points: 5,
    tags: ["Array", "Math", "Number Theory", "LC-204"],
    description: "Given an integer n, return the number of prime numbers that are strictly less than n in O(n log log n) time.",
    constraints: ["0 <= n <= 5 * 10^6"],
    examples: [
      { input: "n = 10", output: "4", explanation: "There are 4 prime numbers less than 10: 2, 3, 5, 7." },
      { input: "n = 0", output: "0" }
    ]
  },
  {
    title: "Verify Character Mapping Isomorphism",
    slug: "isomorphic-strings",
    difficulty: "Easy",
    points: 3,
    tags: ["Hash Table", "String", "LC-205"],
    description: "Given two strings s and t, determine if they are isomorphic. Two strings s and t are isomorphic if the characters in s can be replaced to get t, preserving the order of characters with unique 1-to-1 mappings.",
    constraints: ["1 <= s.length <= 5 * 10^4", "t.length == s.length", "s and t consist of any valid ascii character."],
    examples: [
      { input: "s = \"egg\", t = \"add\"", output: "true" },
      { input: "s = \"foo\", t = \"bar\"", output: "false" }
    ]
  },
  {
    title: "Reverse Singly Linked List",
    slug: "reverse-linked-list",
    difficulty: "Easy",
    points: 3,
    tags: ["Linked List", "Recursion", "LC-206"],
    description: "Given the head of a singly linked list, reverse the list, and return the reversed list.",
    constraints: ["The number of nodes in the list is the range [0, 5000].", "-5000 <= Node.val <= 5000"],
    examples: [
      { input: "head = [1,2,3,4,5]", output: "[5,4,3,2,1]" },
      { input: "head = [1,2]", output: "[2,1]" }
    ]
  },
  {
    title: "Course Prerequisite Cycle Detector",
    slug: "course-schedule",
    difficulty: "Medium",
    points: 5,
    tags: ["Depth-First Search", "Breadth-First Search", "Graph", "Topological Sort", "LC-207"],
    description: "There are a total of numCourses courses you have to take, labeled from 0 to numCourses - 1. You are given an array prerequisites where prerequisites[i] = [ai, bi] indicates that you must take course bi first if you want to take course ai. Return true if you can finish all courses (no cycle), otherwise false.",
    constraints: ["1 <= numCourses <= 2000", "0 <= prerequisites.length <= 5000", "prerequisites[i].length == 2"],
    examples: [
      { input: "numCourses = 2, prerequisites = [[1,0]]", output: "true" },
      { input: "numCourses = 2, prerequisites = [[1,0],[0,1]]", output: "false" }
    ]
  },
  {
    title: "Design Prefix Tree (Trie)",
    slug: "implement-trie-prefix-tree",
    difficulty: "Medium",
    points: 5,
    tags: ["Hash Table", "String", "Design", "Trie", "LC-208"],
    description: "A trie (pronounced as \"try\") or prefix tree is a tree data structure used to efficiently store and retrieve keys in a dataset of strings. Implement the Trie class with insert, search, and startsWith operations.",
    constraints: ["1 <= word.length, prefix.length <= 2000", "word and prefix consist only of lowercase English letters.", "At most 3 * 10^4 calls in total will be made to insert, search, and startsWith."],
    examples: [
      { input: "[\"Trie\",\"insert\",\"search\",\"search\",\"startsWith\",\"insert\",\"search\"], [[],[\"apple\"],[\"apple\"],[\"app\"],[\"app\"],[\"app\"],[\"app\"]]", output: "[null,null,true,false,true,null,true]" }
    ]
  },
  {
    title: "Smallest Subarray with Sum Greater Than Target",
    slug: "minimum-size-subarray-sum",
    difficulty: "Medium",
    points: 5,
    tags: ["Array", "Binary Search", "Sliding Window", "Prefix Sum", "LC-209"],
    description: "Given an array of positive integers nums and a positive integer target, return the minimal length of a contiguous subarray of which the sum is greater than or equal to target. If there is no such subarray, return 0 instead.",
    constraints: ["1 <= target <= 10^9", "1 <= nums.length <= 10^5", "1 <= nums[i] <= 10^4"],
    examples: [
      { input: "target = 7, nums = [2,3,1,2,4,3]", output: "2", explanation: "The subarray [4,3] has minimal length 2." }
    ]
  },
  {
    title: "Course Ordering via Topological Sort",
    slug: "course-schedule-ii",
    difficulty: "Medium",
    points: 5,
    tags: ["Depth-First Search", "Breadth-First Search", "Graph", "Topological Sort", "LC-210"],
    description: "There are a total of numCourses courses labeled from 0 to numCourses - 1. Return the ordering of courses you should take to finish all courses using topological sort. If there are many valid answers, return any of them. If impossible, return an empty array.",
    constraints: ["1 <= numCourses <= 2000", "0 <= prerequisites.length <= numCourses * (numCourses - 1)"],
    examples: [
      { input: "numCourses = 2, prerequisites = [[1,0]]", output: "[0,1]" },
      { input: "numCourses = 4, prerequisites = [[1,0],[2,0],[3,1],[3,2]]", output: "[0,2,1,3]" }
    ]
  },
  {
    title: "Circular Street House Robbery II",
    slug: "house-robber-ii",
    difficulty: "Medium",
    points: 5,
    tags: ["Array", "Dynamic Programming", "LC-213"],
    description: "All houses at this place are arranged in a circle. That means the first house is the neighbor of the last one. Given an integer array nums representing the amount of money of each house, return the maximum amount of money you can rob tonight without alerting the police.",
    constraints: ["1 <= nums.length <= 100", "0 <= nums[i] <= 1000"],
    examples: [
      { input: "nums = [2,3,2]", output: "3", explanation: "You cannot rob house 1 (money = 2) and then rob house 3 (money = 2), because they are adjacent houses." },
      { input: "nums = [1,2,3,1]", output: "4" }
    ]
  },
  {
    title: "Kth Largest Element in an Array",
    slug: "kth-largest-element-in-an-array",
    difficulty: "Medium",
    points: 5,
    tags: ["Array", "Divide and Conquer", "Sorting", "Heap", "Quickselect", "LC-215"],
    description: "Given an integer array nums and an integer k, return the k-th largest element in the array. Note that it is the k-th largest element in the sorted order, not the k-th distinct element. Solve in O(n) average time.",
    constraints: ["1 <= k <= nums.length <= 10^5", "-10^4 <= nums[i] <= 10^4"],
    examples: [
      { input: "nums = [3,2,1,5,6,4], k = 2", output: "5" },
      { input: "nums = [3,2,3,1,2,4,5,5,6], k = 4", output: "4" }
    ]
  },
  {
    title: "Check for Duplicate Elements in Array",
    slug: "contains-duplicate",
    difficulty: "Easy",
    points: 3,
    tags: ["Array", "Hash Table", "Sorting", "LC-217"],
    description: "Given an integer array nums, return true if any value appears at least twice in the array, and return false if every element is distinct.",
    constraints: ["1 <= nums.length <= 10^5", "-10^9 <= nums[i] <= 10^9"],
    examples: [
      { input: "nums = [1,2,3,1]", output: "true" },
      { input: "nums = [1,2,3,4]", output: "false" }
    ]
  },
  {
    title: "Check for Duplicates within K Distance",
    slug: "contains-duplicate-ii",
    difficulty: "Easy",
    points: 3,
    tags: ["Array", "Hash Table", "Sliding Window", "LC-219"],
    description: "Given an integer array nums and an integer k, return true if there are two distinct indices i and j in the array such that nums[i] == nums[j] and abs(i - j) <= k.",
    constraints: ["1 <= nums.length <= 10^5", "-10^9 <= nums[i] <= 10^9", "0 <= k <= 10^5"],
    examples: [
      { input: "nums = [1,2,3,1], k = 3", output: "true" },
      { input: "nums = [1,2,3,1,2,3], k = 2", output: "false" }
    ]
  },
  {
    title: "Largest Square of 1s in Binary Matrix",
    slug: "maximal-square",
    difficulty: "Medium",
    points: 5,
    tags: ["Array", "Dynamic Programming", "Matrix", "LC-221"],
    description: "Given an m x n binary matrix filled with 0's and 1's, find the largest square containing only 1's and return its area in O(m * n) time.",
    constraints: ["m == matrix.length", "n == matrix[i].length", "1 <= m, n <= 300", "matrix[i][j] is '0' or '1'."],
    examples: [
      { input: "matrix = [[\"1\",\"0\",\"1\",\"0\",\"0\"],[\"1\",\"0\",\"1\",\"1\",\"1\"],[\"1\",\"1\",\"1\",\"1\",\"1\"],[\"1\",\"0\",\"0\",\"1\",\"0\"]]", output: "4" }
    ]
  },
  {
    title: "Invert (Mirror) Binary Tree",
    slug: "invert-binary-tree",
    difficulty: "Easy",
    points: 3,
    tags: ["Tree", "Depth-First Search", "Breadth-First Search", "Binary Tree", "LC-226"],
    description: "Given the root of a binary tree, invert the tree (swap left and right children recursively), and return its root.",
    constraints: ["The number of nodes in the tree is in the range [0, 100].", "-100 <= Node.val <= 100"],
    examples: [
      { input: "root = [4,2,7,1,3,6,9]", output: "[4,7,2,9,6,3,1]" },
      { input: "root = [2,1,3]", output: "[2,3,1]" }
    ]
  },
  {
    title: "Basic Calculator with Precedence (+, -, *, /)",
    slug: "basic-calculator-ii",
    difficulty: "Medium",
    points: 5,
    tags: ["Math", "String", "Stack", "LC-227"],
    description: "Given a string s which represents an expression, evaluate this expression and return its value according to standard operator precedence without using eval().",
    constraints: ["1 <= s.length <= 3 * 10^5", "s consists of integers and operators ('+', '-', '*', '/') separated by some number of spaces."],
    examples: [
      { input: "s = \"3+2*2\"", output: "7" },
      { input: "s = \" 3/2 \"", output: "1" },
      { input: "s = \" 3+5 / 2 \"", output: "5" }
    ]
  },
  {
    title: "K-th Smallest Value in BST",
    slug: "kth-smallest-element-in-a-bst",
    difficulty: "Medium",
    points: 5,
    tags: ["Tree", "Depth-First Search", "Binary Search Tree", "Binary Tree", "LC-230"],
    description: "Given the root of a binary search tree, and an integer k, return the k-th smallest value (1-indexed) of all the values of the nodes in the tree.",
    constraints: ["The number of nodes in the tree is n.", "1 <= k <= n <= 10^4", "0 <= Node.val <= 10^4"],
    examples: [
      { input: "root = [3,1,4,null,2], k = 1", output: "1" },
      { input: "root = [5,3,6,2,4,null,null,1], k = 3", output: "3" }
    ]
  },
  {
    title: "Determine if Integer is Power of Two",
    slug: "power-of-two",
    difficulty: "Easy",
    points: 3,
    tags: ["Math", "Bit Manipulation", "Recursion", "LC-231"],
    description: "Given an integer n, return true if it is a power of two. Otherwise, return false. An integer n is a power of two, if there exists an integer x such that n == 2^x.",
    constraints: ["-2^31 <= n <= 2^31 - 1"],
    examples: [
      { input: "n = 1", output: "true" },
      { input: "n = 16", output: "true" },
      { input: "n = 3", output: "false" }
    ]
  },
  {
    title: "Implement Queue using Dual Stacks",
    slug: "implement-queue-using-stacks",
    difficulty: "Easy",
    points: 3,
    tags: ["Stack", "Design", "Queue", "LC-232"],
    description: "Implement a first in first out (FIFO) queue using only two stacks. The implemented queue should support push, pop, peek, and empty with amortized O(1) time complexity.",
    constraints: ["1 <= x <= 9", "At most 100 calls will be made to push, pop, peek, and empty."],
    examples: [
      { input: "[\"MyQueue\",\"push\",\"push\",\"peek\",\"pop\",\"empty\"], [[],[1],[2],[],[],[]]", output: "[null,null,null,1,1,false]" }
    ]
  },
  {
    title: "Verify Singly Linked List Palindrome",
    slug: "palindrome-linked-list",
    difficulty: "Easy",
    points: 3,
    tags: ["Linked List", "Two Pointers", "Stack", "Recursion", "LC-234"],
    description: "Given the head of a singly linked list, return true if it is a palindrome or false otherwise in O(n) time and O(1) space.",
    constraints: ["The number of nodes in the list is in the range [1, 10^5].", "0 <= Node.val <= 9"],
    examples: [
      { input: "head = [1,2,2,1]", output: "true" },
      { input: "head = [1,2]", output: "false" }
    ]
  },
  {
    title: "Lowest Common Ancestor of a BST",
    slug: "lowest-common-ancestor-of-a-binary-search-tree",
    difficulty: "Medium",
    points: 5,
    tags: ["Tree", "Depth-First Search", "Binary Search Tree", "Binary Tree", "LC-235"],
    description: "Given a binary search tree (BST), find the lowest common ancestor (LCA) node of two given nodes in the BST.",
    constraints: ["The number of nodes in the tree is in the range [2, 10^5].", "-10^9 <= Node.val <= 10^9", "All Node.val are unique."],
    examples: [
      { input: "root = [6,2,8,0,4,7,9,null,null,3,5], p = 2, q = 8", output: "6" }
    ]
  },
  {
    title: "Lowest Common Ancestor of a Binary Tree",
    slug: "lowest-common-ancestor-of-a-binary-tree",
    difficulty: "Medium",
    points: 5,
    tags: ["Tree", "Depth-First Search", "Binary Tree", "LC-236"],
    description: "Given a binary tree, find the lowest common ancestor (LCA) of two given nodes p and q in the tree.",
    constraints: ["The number of nodes in the tree is in the range [2, 10^5].", "-10^9 <= Node.val <= 10^9", "All Node.val are unique."],
    examples: [
      { input: "root = [3,5,1,6,2,0,8,null,null,7,4], p = 5, q = 1", output: "3" }
    ]
  },
  {
    title: "Delete Node with Direct Reference Only",
    slug: "delete-node-in-a-linked-list",
    difficulty: "Medium",
    points: 5,
    tags: ["Linked List", "LC-237"],
    description: "There is a singly-linked list and you want to delete a node in it. You are given only the node to be deleted, not the head. Copy the next node value and skip the next node.",
    constraints: ["The number of the nodes in the given list is in the range [2, 1000].", "-1000 <= Node.val <= 1000", "The node to be deleted is in the list and is not a tail node."],
    examples: [
      { input: "head = [4,5,1,9], node = 5", output: "[4,1,9]" }
    ]
  },
  {
    title: "Prefix and Suffix Product Array",
    slug: "product-of-array-except-self",
    difficulty: "Medium",
    points: 5,
    tags: ["Array", "Prefix Sum", "LC-238"],
    description: "Given an integer array nums, return an array answer such that answer[i] is equal to the product of all the elements of nums except nums[i] in O(n) without using division.",
    constraints: ["2 <= nums.length <= 10^5", "-30 <= nums[i] <= 30"],
    examples: [
      { input: "nums = [1,2,3,4]", output: "[24,12,8,6]" },
      { input: "nums = [-1,1,0,-3,3]", output: "[0,0,9,0,0]" }
    ]
  },
  {
    title: "Sliding Window Maximum Element",
    slug: "sliding-window-maximum",
    difficulty: "Hard",
    points: 10,
    tags: ["Array", "Queue", "Sliding Window", "Heap", "Monotonic Queue", "LC-239"],
    description: "You are given an array of integers nums, there is a sliding window of size k which is moving from the very left of the array to the very right. Return the max sliding window in O(n) time using a monotonic deque.",
    constraints: ["1 <= nums.length <= 10^5", "-10^4 <= nums[i] <= 10^4", "1 <= k <= nums.length"],
    examples: [
      { input: "nums = [1,3,-1,-3,5,3,6,7], k = 3", output: "[3,3,5,5,6,7]" }
    ]
  },
  {
    title: "Search Row and Column Sorted Matrix",
    slug: "search-a-2d-matrix-ii",
    difficulty: "Medium",
    points: 5,
    tags: ["Array", "Binary Search", "Divide and Conquer", "Matrix", "LC-240"],
    description: "Write an efficient algorithm that searches for a value target in an m x n integer matrix where integers in each row and column are sorted in ascending order from left to right and top to bottom in O(m + n).",
    constraints: ["m == matrix.length", "n == matrix[i].length", "1 <= n, m <= 300", "-10^9 <= matrix[i][j] <= 10^9"],
    examples: [
      { input: "matrix = [[1,4,7,11,15],[2,5,8,12,19],[3,6,9,16,22],[10,13,14,17,24],[18,21,23,26,30]], target = 5", output: "true" }
    ]
  },
  {
    title: "Verify String Anagram Equivalence",
    slug: "valid-anagram",
    difficulty: "Easy",
    points: 3,
    tags: ["Hash Table", "String", "Sorting", "LC-242"],
    description: "Given two strings s and t, return true if t is an anagram of s, and false otherwise. An Anagram is a word formed by rearranging the letters of a different word using all original letters exactly once.",
    constraints: ["1 <= s.length, t.length <= 5 * 10^4", "s and t consist of lowercase English letters."],
    examples: [
      { input: "s = \"anagram\", t = \"nagaram\"", output: "true" },
      { input: "s = \"rat\", t = \"car\"", output: "false" }
    ]
  },

  // 251 - 300
  {
    title: "Root-to-Leaf Path Strings in Tree",
    slug: "binary-tree-paths",
    difficulty: "Easy",
    points: 3,
    tags: ["Tree", "Depth-First Search", "Binary Tree", "Backtracking", "LC-257"],
    description: "Given the root of a binary tree, return all root-to-leaf paths in any order formatted as \"node1->node2->...\".",
    constraints: ["The number of nodes in the tree is in the range [1, 100].", "-100 <= Node.val <= 100"],
    examples: [
      { input: "root = [1,2,3,null,5]", output: "[\"1->2->5\",\"1->3\"]" }
    ]
  },
  {
    title: "Digital Root Repeated Digit Sum",
    slug: "add-digits",
    difficulty: "Easy",
    points: 3,
    tags: ["Math", "Simulation", "Number Theory", "LC-258"],
    description: "Given an integer num, repeatedly add all its digits until the result has only one digit, and return it in O(1) runtime without any loops or recursion.",
    constraints: ["0 <= num <= 2^31 - 1"],
    examples: [
      { input: "num = 38", output: "2", explanation: "3 + 8 = 11 -> 1 + 1 = 2." },
      { input: "num = 0", output: "0" }
    ]
  },
  {
    title: "Two Unique Numbers Among Pairs",
    slug: "single-number-iii",
    difficulty: "Medium",
    points: 5,
    tags: ["Array", "Bit Manipulation", "LC-260"],
    description: "Given an integer array nums, in which exactly two elements appear only once and all the other elements appear exactly twice. Find the two elements that appear only once in O(n) time and O(1) space.",
    constraints: ["2 <= nums.length <= 3 * 10^4", "-2^31 <= nums[i] <= 2^31 - 1"],
    examples: [
      { input: "nums = [1,2,1,3,2,5]", output: "[3,5]" }
    ]
  },
  {
    title: "Verify Prime Factors Limited to 2, 3, 5",
    slug: "ugly-number",
    difficulty: "Easy",
    points: 3,
    tags: ["Math", "LC-263"],
    description: "An ugly number is a positive integer whose prime factors are limited to 2, 3, and 5. Given an integer n, return true if n is an ugly number.",
    constraints: ["-2^31 <= n <= 2^31 - 1"],
    examples: [
      { input: "n = 6", output: "true" },
      { input: "n = 1", output: "true" },
      { input: "n = 14", output: "false" }
    ]
  },
  {
    title: "Generate N-th Ugly Number",
    slug: "ugly-number-ii",
    difficulty: "Medium",
    points: 5,
    tags: ["Hash Table", "Math", "Dynamic Programming", "Heap", "LC-264"],
    description: "An ugly number is a positive integer whose prime factors are limited to 2, 3, and 5. Given an integer n, return the n-th ugly number using three pointers in O(n) time.",
    constraints: ["1 <= n <= 1690"],
    examples: [
      { input: "n = 10", output: "12", explanation: "[1, 2, 3, 4, 5, 6, 8, 9, 10, 12] is the sequence of the first 10 ugly numbers." }
    ]
  },
  {
    title: "Find Missing Value in Range [0, n]",
    slug: "missing-number",
    difficulty: "Easy",
    points: 3,
    tags: ["Array", "Hash Table", "Math", "Binary Search", "Bit Manipulation", "Sorting", "LC-268"],
    description: "Given an array nums containing n distinct numbers in the range [0, n], return the only number in the range that is missing from the array in O(n) time and O(1) space.",
    constraints: ["n == nums.length", "1 <= n <= 10^4", "0 <= nums[i] <= n", "All numbers are unique."],
    examples: [
      { input: "nums = [3,0,1]", output: "2" },
      { input: "nums = [0,1]", output: "2" },
      { input: "nums = [9,6,4,2,3,5,7,0,1]", output: "8" }
    ]
  },
  {
    title: "Calculate Researcher H-Index Metric",
    slug: "h-index",
    difficulty: "Medium",
    points: 5,
    tags: ["Array", "Sorting", "Counting Sort", "LC-274"],
    description: "Given an array of integers citations where citations[i] is the number of citations a researcher received for their i-th paper, return the researcher's h-index.",
    constraints: ["n == citations.length", "1 <= n <= 5000", "0 <= citations[i] <= 1000"],
    examples: [
      { input: "citations = [3,0,6,1,5]", output: "3", explanation: "[3,0,6,1,5] means the researcher has 3 papers with at least 3 citations." }
    ]
  },
  {
    title: "Calculate H-Index from Pre-Sorted Array",
    slug: "h-index-ii",
    difficulty: "Medium",
    points: 5,
    tags: ["Array", "Binary Search", "LC-275"],
    description: "Given an array of integers citations where citations is sorted in ascending order, calculate the researcher's h-index in O(log n) time.",
    constraints: ["n == citations.length", "1 <= n <= 10^5", "0 <= citations[i] <= 1000", "citations is sorted in ascending order."],
    examples: [
      { input: "citations = [0,1,3,5,6]", output: "3" }
    ]
  },
  {
    title: "Locate First Defective Version",
    slug: "first-bad-version",
    difficulty: "Easy",
    points: 3,
    tags: ["Binary Search", "Interactive", "LC-278"],
    description: "You have n versions [1, 2, ..., n] and you want to find out the first bad one which causes all following versions to be bad. Minimize API calls to isBadVersion(version) using binary search in O(log n).",
    constraints: ["1 <= bad <= n <= 2^31 - 1"],
    examples: [
      { input: "n = 5, bad = 4", output: "4" }
    ]
  },
  {
    title: "Least Number of Perfect Square Sums",
    slug: "perfect-squares",
    difficulty: "Medium",
    points: 5,
    tags: ["Math", "Dynamic Programming", "Breadth-First Search", "LC-279"],
    description: "Given an integer n, return the least number of perfect square numbers that sum to n.",
    constraints: ["1 <= n <= 10^4"],
    examples: [
      { input: "n = 12", output: "3", explanation: "12 = 4 + 4 + 4." },
      { input: "n = 13", output: "2", explanation: "13 = 4 + 9." }
    ]
  },
  {
    title: "Shift All Zeroes to Array End In-Place",
    slug: "move-zeroes",
    difficulty: "Easy",
    points: 3,
    tags: ["Array", "Two Pointers", "LC-283"],
    description: "Given an integer array nums, move all 0's to the end of it while maintaining the relative order of the non-zero elements in-place without making a copy of the array.",
    constraints: ["1 <= nums.length <= 10^4", "-2^31 <= nums[i] <= 2^31 - 1"],
    examples: [
      { input: "nums = [0,1,0,3,12]", output: "[1,3,12,0,0]" },
      { input: "nums = [0]", output: "[0]" }
    ]
  },
  {
    title: "Find Duplicate Number in [1, n] Read-Only",
    slug: "find-the-duplicate-number",
    difficulty: "Medium",
    points: 5,
    tags: ["Array", "Two Pointers", "Binary Search", "Bit Manipulation", "LC-287"],
    description: "Given an array of integers nums containing n + 1 integers where each integer is in the range [1, n] inclusive. There is only one repeated number in nums, return this repeated number without modifying the array in O(1) extra space (Floyd's Cycle Detection).",
    constraints: ["1 <= n <= 10^5", "nums.length == n + 1", "1 <= nums[i] <= n"],
    examples: [
      { input: "nums = [1,3,4,2,2]", output: "2" },
      { input: "nums = [3,1,3,4,2]", output: "3" }
    ]
  },
  {
    title: "Conway's Game of Life In-Place State",
    slug: "game-of-life",
    difficulty: "Medium",
    points: 5,
    tags: ["Array", "Matrix", "Simulation", "LC-289"],
    description: "Given an m x n grid of cells with each cell being live (1) or dead (0), compute the next state based on Conway's four rules: underpopulation, survival, overpopulation, reproduction. Update board in-place.",
    constraints: ["m == board.length", "n == board[i].length", "1 <= m, n <= 25"],
    examples: [
      { input: "board = [[0,1,0],[0,0,1],[1,1,1],[0,0,0]]", output: "[[0,0,0],[1,0,1],[0,1,1],[0,1,0]]" }
    ]
  },
  {
    title: "Bijective Mapping Between Pattern and Words",
    slug: "word-pattern",
    difficulty: "Easy",
    points: 3,
    tags: ["Hash Table", "String", "LC-290"],
    description: "Given a pattern and a string s, find if s follows the same pattern. Here follow means a full match, such that there is a bijection between a letter in pattern and a non-empty word in s.",
    constraints: ["1 <= pattern.length <= 300", "1 <= s.length <= 3000"],
    examples: [
      { input: "pattern = \"abba\", s = \"dog cat cat dog\"", output: "true" },
      { input: "pattern = \"abba\", s = \"dog cat cat fish\"", output: "false" }
    ]
  },
  {
    title: "Nim Game Winning Strategy",
    slug: "nim-game",
    difficulty: "Easy",
    points: 3,
    tags: ["Math", "Brainteaser", "Game Theory", "LC-292"],
    description: "You are playing the following Nim Game with your friend: Initially, there is a heap of stones. On your turn, you can remove 1 to 3 stones. The one who removes the last stone wins. Given n stones and you move first, return true if you can win the game.",
    constraints: ["1 <= n <= 2^31 - 1"],
    examples: [
      { input: "n = 4", output: "false" },
      { input: "n = 1", output: "true" },
      { input: "n = 2", output: "true" }
    ]
  },
  {
    title: "Continuous Median Tracking with Dual Heaps",
    slug: "find-median-from-data-stream",
    difficulty: "Hard",
    points: 10,
    tags: ["Two Pointers", "Design", "Sorting", "Heap", "Data Stream", "LC-295"],
    description: "The median is the middle value in an ordered integer list. Implement the MedianFinder class with addNum(num) and findMedian() using max-heap and min-heap in O(log n) insertion and O(1) median query.",
    constraints: ["-10^5 <= num <= 10^5", "There will be at least one element in the data structure before calling findMedian.", "At most 5 * 10^4 calls will be made to addNum and findMedian."],
    examples: [
      { input: "[\"MedianFinder\",\"addNum\",\"addNum\",\"findMedian\",\"addNum\",\"findMedian\"], [[],[1],[2],[],[3],[]]", output: "[null,null,null,1.5,null,2.0]" }
    ]
  },
  {
    title: "Encode and Decode Binary Tree Structure",
    slug: "serialize-and-deserialize-binary-tree",
    difficulty: "Hard",
    points: 10,
    tags: ["String", "Tree", "Depth-First Search", "Breadth-First Search", "Design", "Binary Tree", "LC-297"],
    description: "Serialization is the process of converting a data structure or object into a sequence of bits so that it can be stored. Design an algorithm to serialize and deserialize a binary tree.",
    constraints: ["The number of nodes in the tree is in the range [0, 10^4].", "-1000 <= Node.val <= 1000"],
    examples: [
      { input: "root = [1,2,3,null,null,4,5]", output: "[1,2,3,null,null,4,5]" }
    ]
  },
  {
    title: "Secret Code Guess Hint (Bulls and Cows)",
    slug: "bulls-and-cows",
    difficulty: "Medium",
    points: 5,
    tags: ["Hash Table", "String", "Counting", "LC-299"],
    description: "You are playing Bulls and Cows. Given the secret number secret and friend's guess, return the hint formatted as \"xAyB\" where x is the number of bulls (correct digit and position) and y is the number of cows (correct digit but wrong position).",
    constraints: ["1 <= secret.length, guess.length <= 1000", "secret and guess consist of digits only."],
    examples: [
      { input: "secret = \"1807\", guess = \"7810\"", output: "1A3B" },
      { input: "secret = \"1123\", guess = \"0111\"", output: "1A1B" }
    ]
  },
  {
    title: "Strictly Increasing Subsequence Length",
    slug: "longest-increasing-subsequence",
    difficulty: "Medium",
    points: 5,
    tags: ["Array", "Binary Search", "Dynamic Programming", "LC-300"],
    description: "Given an integer array nums, return the length of the longest strictly increasing subsequence in O(n log n) time using patience sorting / binary search.",
    constraints: ["1 <= nums.length <= 2500", "-10^4 <= nums[i] <= 10^4"],
    examples: [
      { input: "nums = [10,9,2,5,3,7,101,18]", output: "4", explanation: "The longest increasing subsequence is [2,3,7,101], therefore the length is 4." },
      { input: "nums = [0,1,0,3,2,3]", output: "4" },
      { input: "nums = [7,7,7,7,7,7,7]", output: "1" }
    ]
  }
];

PROBLEMS_300.push(...ADDITIONAL_PROBLEMS);

// Seeder Execution
export const seedProblems = async () => {
  try {
    await connectDB();
    console.log(`Starting seeding of ${PROBLEMS_300.length} copyright-safe canonical DSA problems...`);

    let inserted = 0;
    let updated = 0;

    for (const prob of PROBLEMS_300) {
      const existing = await Problem.findOne({ slug: prob.slug });
      
      const payload = {
        title: prob.title,
        slug: prob.slug,
        difficulty: prob.difficulty,
        points: prob.points || (prob.difficulty === 'Easy' ? 3 : prob.difficulty === 'Medium' ? 5 : 10),
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
    console.log(`✓ Seeding complete! Inserted: ${inserted}, Updated: ${updated}, Total in DB: ${totalCount}`);
    process.exit(0);
  } catch (err) {
    console.error('Error seeding problems:', err);
    process.exit(1);
  }
};

// Auto-run if executed directly
if (process.argv[1] && (import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/')) || process.argv[1].endsWith('seedProblems300.js'))) {
  seedProblems();
}

