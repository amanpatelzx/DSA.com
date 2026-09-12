import express from 'express';
import ArticleComment from '../models/ArticleComment.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Rich DSA Learning Catalog
export const DSA_TOPICS = [
  {
    id: 'arrays',
    slug: 'arrays',
    title: 'Arrays & Two Pointers',
    icon: '📦',
    description: 'Fundamental linear structures, in-place manipulation, two pointers, and sliding window techniques.',
    subtopics: [
      {
        id: 'two-pointers',
        slug: 'two-pointers',
        title: 'Two Pointers Technique',
        difficulty: 'Easy to Medium',
        readTime: '6 min read',
        practiceSlug: 'two-sum',
        practiceTitle: 'Two Sum & 3Sum',
        summary: 'Solve search, partition, and pair problems in O(N) time with O(1) space using opposing or synchronized pointers.',
        figure: `
Visual Diagram: Opposing Two Pointers on Sorted Array
Target Sum = 14

Index:    [0]   [1]   [2]   [3]   [4]   [5]
Array:     2     4     7     10    12    15
           ^                             ^
        Left Pointer                  Right Pointer
        (Sum = 2 + 15 = 17 > 14)  --> Decrement Right!

Index:    [0]   [1]   [2]   [3]   [4]   [5]
Array:     2     4     7     10    12    15
           ^                       ^
        Left Pointer            Right Pointer
        (Sum = 2 + 12 = 14 == 14) --> TARGET FOUND! [0, 4]
`,
        concept: `
The **Two Pointers Technique** is an algorithmic pattern where two pointers iterate across the data structure in tandem until one or both meet a specific condition.

Instead of an exhaustive nested loop search costing **O(N²)**, two pointers exploit sorted order or structural properties to reduce search time down to linear **O(N)** with **O(1)** auxiliary memory.

### Common Variations:
1. **Opposing Pointers (Collision)**: One pointer starts at the beginning (\`left = 0\`) and the other at the end (\`right = n - 1\`). They move toward each other based on sum/value comparisons.
2. **Fast & Slow Pointers (Same Direction)**: Both start from index 0, but one moves faster or under conditional jumps (used in duplicate removal, cycle detection, and in-place partitioning).
3. **Merging Pointers**: Pointers traverse two separate sorted arrays simultaneously (used in Merge Sort).
`,
        exampleTrace: `
### Step-by-Step Example Walkthrough
**Problem**: Given a sorted array \`nums = [2, 7, 11, 15]\` and target \`9\`, return the 0-indexed positions.

1. **Initialize**: \`left = 0\` (\`nums[0] = 2\`), \`right = 3\` (\`nums[3] = 15\`).
2. **Iteration 1**: \`sum = 2 + 15 = 17\`. Since \`17 > 9\`, decrement \`right\` (\`right = 2\`).
3. **Iteration 2**: \`nums[left] + nums[right] = 2 + 11 = 13\`. Since \`13 > 9\`, decrement \`right\` (\`right = 1\`).
4. **Iteration 3**: \`nums[left] + nums[right] = 2 + 7 = 9\`. Match found! Return \`[0, 1]\`.
`,
        codeSnippets: {
          cpp: `// C++20 Two Pointers Solution
#include <vector>
#include <iostream>

std::pair<int, int> twoSumSorted(const std::vector<int>& nums, int target) {
    int left = 0;
    int right = static_cast<int>(nums.size()) - 1;

    while (left < right) {
        int currentSum = nums[left] + nums[right];
        if (currentSum == target) {
            return {left, right}; // Match found
        } else if (currentSum < target) {
            left++;  // Need a larger sum
        } else {
            right--; // Need a smaller sum
        }
    }
    return {-1, -1}; // No pair found
}`,
          python: `# Python 3 Two Pointers Solution
from typing import List, Tuple

def two_sum_sorted(nums: List[int], target: int) -> Tuple[int, int]:
    left = 0
    right = len(nums) - 1

    while left < right:
        current_sum = nums[left] + nums[right]
        if current_sum == target:
            return (left, right)
        elif current_sum < target:
            left += 1  # Shift rightward to increase sum
        else:
            right -= 1 # Shift leftward to decrease sum

    return (-1, -1)`,
          javascript: `// JavaScript (Node.js) Two Pointers Solution
function twoSumSorted(nums, target) {
  let left = 0;
  let right = nums.length - 1;

  while (left < right) {
    const currentSum = nums[left] + nums[right];
    if (currentSum === target) {
      return [left, right];
    } else if (currentSum < target) {
      left++;
    } else {
      right--;
    }
  }
  return [-1, -1];
}`
        },
        complexities: {
          time: 'O(N) — In the worst case, each element is visited at most once.',
          space: 'O(1) — Requires only two integer pointer variables.'
        }
      },
      {
        id: 'sliding-window',
        slug: 'sliding-window',
        title: 'Sliding Window Technique',
        difficulty: 'Medium',
        readTime: '7 min read',
        practiceSlug: 'longest-substring-without-repeating-characters',
        practiceTitle: 'Longest Substring Without Repeating Characters',
        summary: 'Dynamically expand and contract window boundaries to evaluate subarrays/substrings in linear time.',
        figure: `
Visual Diagram: Dynamic Sliding Window (Longest Unique Substring)
String: "p w w k e w"

Step 1: [p] w w k e w       --> Window {"p"}, Length = 1
Step 2: [p w] w k e w       --> Window {"p", "w"}, Length = 2
Step 3: p [w w] k e w       --> Duplicate 'w'! Shrink left:
Step 4: p w [w] k e w       --> Valid again! Window {"w"}, Length = 1
Step 5: p w [w k] e w       --> Window {"w", "k"}, Length = 2
Step 6: p w [w k e] w       --> Window {"w", "k", "e"}, Length = 3 (Max!)
`,
        concept: `
The **Sliding Window Pattern** is designed to process contiguous sequences (subarrays or substrings) without recalculating overlapping regions from scratch.

### Two Major Sliding Window Categories:
1. **Fixed Size Window**: The window size \`K\` is constant. As the right edge advances by 1, the left edge advances by 1. Useful for problems like *Maximum Sum Subarray of Size K*.
2. **Dynamic / Variable Size Window**: The right pointer expands the window until a condition is violated (e.g. character count exceeded, sum threshold crossed). Then, the left pointer contracts the window until validity is restored.
`,
        exampleTrace: `
### Step-by-Step Example Walkthrough
**Problem**: Find length of longest substring without repeating characters in \`"abcabcbb"\`.

1. Use a Hash Set to track characters currently inside the window.
2. Advance \`right\` pointer from 0 to \`n-1\`.
3. If \`s[right]\` already exists in set, remove \`s[left]\` and increment \`left\` until duplicate is removed.
4. Add \`s[right]\` to set and update \`maxLength = max(maxLength, right - left + 1)\`.
`,
        codeSnippets: {
          cpp: `// C++20 Sliding Window Solution
#include <string>
#include <unordered_set>
#include <algorithm>

int lengthOfLongestSubstring(const std::string& s) {
    std::unordered_set<char> seen;
    int left = 0, maxLength = 0;

    for (int right = 0; right < s.length(); ++right) {
        while (seen.count(s[right])) {
            seen.erase(s[left]);
            left++;
        }
        seen.insert(s[right]);
        maxLength = std::max(maxLength, right - left + 1);
    }
    return maxLength;
}`,
          python: `# Python 3 Sliding Window Solution
def length_of_longest_substring(s: str) -> int:
    seen = set()
    left = 0
    max_len = 0

    for right in range(len(s)):
        while s[right] in seen:
            seen.remove(s[left])
            left += 1
        seen.add(s[right])
        max_len = max(max_len, right - left + 1)

    return max_len`,
          javascript: `// JavaScript Sliding Window Solution
function lengthOfLongestSubstring(s) {
  const seen = new Set();
  let left = 0;
  let maxLen = 0;

  for (let right = 0; right < s.length; right++) {
    while (seen.has(s[right])) {
      seen.delete(s[left]);
      left++;
    }
    seen.add(s[right]);
    maxLen = Math.max(maxLen, right - left + 1);
  }
  return maxLen;
}`
        },
        complexities: {
          time: 'O(N) — Each character is added and removed from the set at most once.',
          space: 'O(min(N, M)) — Space occupied by set, bounded by character set size M.'
        }
      },
      {
        id: 'prefix-sum-kadane',
        slug: 'prefix-sum-kadane',
        title: "Prefix Sum & Kadane's Algorithm",
        difficulty: 'Medium',
        readTime: '6 min read',
        practiceSlug: 'best-time-to-buy-and-sell-stock',
        practiceTitle: 'Best Time to Buy and Sell Stock',
        summary: "Precompute cumulative sums for O(1) range queries, and find maximum contiguous subarray sums with Kadane's Algorithm.",
        figure: `
Visual Diagram: Kadane's Algorithm Maximum Subarray
Array: [-2,  1, -3,  4, -1,  2,  1, -5,  4]

Index  Num   currSum = max(num, currSum + num)   maxSum
  0    -2    max(-2, -2) = -2                    -2
  1     1    max( 1, -2 + 1) = 1                  1
  2    -3    max(-3,  1 - 3) = -2                 1
  3     4    max( 4, -2 + 4) = 4                  4
  4    -1    max(-1,  4 - 1) = 3                  4
  5     2    max( 2,  3 + 2) = 5                  5
  6     1    max( 1,  5 + 1) = 6                  6  <-- [4, -1, 2, 1] Sum = 6
`,
        concept: `
**Prefix Sums**:
An array \`P\` where \`P[i] = nums[0] + nums[1] + ... + nums[i-1]\`.
Allows range sum query from \`L\` to \`R\` in **O(1)** time via \`sum(L, R) = P[R+1] - P[L]\`.

**Kadane's Algorithm**:
Finds the contiguous subarray with the largest sum in **O(N)** time by deciding at each index whether to extend the current running subarray or start a new one from the current element.
`,
        exampleTrace: `
At index \`i\`, the best subarray ending at \`i\` is either:
- The element itself (\`nums[i]\`)
- The previous best plus current element (\`currentSum + nums[i]\`)
Formula: \`currentSum = max(nums[i], currentSum + nums[i])\`
`,
        codeSnippets: {
          cpp: `// C++ Kadane's Algorithm
#include <vector>
#include <algorithm>

int maxSubArray(const std::vector<int>& nums) {
    int currentSum = nums[0];
    int maxSum = nums[0];

    for (size_t i = 1; i < nums.size(); ++i) {
        currentSum = std::max(nums[i], currentSum + nums[i]);
        maxSum = std::max(maxSum, currentSum);
    }
    return maxSum;
}`,
          python: `# Python Kadane's Algorithm
def max_sub_array(nums: list[int]) -> int:
    curr_sum = nums[0]
    max_sum = nums[0]

    for num in nums[1:]:
        curr_sum = max(num, curr_sum + num)
        max_sum = max(max_sum, curr_sum)

    return max_sum`,
          javascript: `// JavaScript Kadane's Algorithm
function maxSubArray(nums) {
  let currSum = nums[0];
  let maxSum = nums[0];

  for (let i = 1; i < nums.length; i++) {
    currSum = Math.max(nums[i], currSum + nums[i]);
    maxSum = Math.max(maxSum, currSum);
  }
  return maxSum;
}`
        },
        complexities: {
          time: 'O(N) — Single linear scan through array.',
          space: 'O(1) — Only requires two accumulator variables.'
        }
      }
    ]
  },
  {
    id: 'linked-lists',
    slug: 'linked-lists',
    title: 'Linked Lists',
    icon: '🔗',
    description: 'Pointer-linked memory nodes, cycle detection, list reversal, and cache designs.',
    subtopics: [
      {
        id: 'fast-slow-pointers',
        slug: 'fast-slow-pointers',
        title: "Fast & Slow Pointers (Floyd's Cycle)",
        difficulty: 'Medium',
        readTime: '6 min read',
        practiceSlug: 'merge-k-sorted-lists',
        practiceTitle: 'Linked List Patterns',
        summary: 'Detect cycles and find middle nodes using two pointers traveling at different velocities.',
        figure: `
Visual Diagram: Fast & Slow Pointers (Tortoise & Hare)

Cycle exists:
[1] -> [2] -> [3] -> [4]
               ^      |
               |      v
              [6] <- [5]

Slow moves 1 step:  1 -> 2 -> 3 -> 4 -> 5 -> 6
Fast moves 2 steps: 1 -> 3 -> 5 -> 3 -> 5 -> ...
They are guaranteed to meet inside the loop!
`,
        concept: `
**Floyd's Cycle-Finding Algorithm** uses a slow pointer (\`slow = slow.next\`) moving at 1 step/iteration and a fast pointer (\`fast = fast.next.next\`) moving at 2 steps/iteration.

If no cycle exists, \`fast\` reaches the \`null\` tail in **O(N)** time. If a cycle exists, the relative speed between them is 1 node/step, guaranteeing they will collide inside the loop.
`,
        exampleTrace: `
### Finding the Middle of a Linked List:
When \`fast\` reaches the end of the list (\`fast == null\` or \`fast.next == null\`), \`slow\` is exactly at the midpoint!
`,
        codeSnippets: {
          cpp: `// C++ Cycle Detection
struct ListNode {
    int val;
    ListNode *next;
    ListNode(int x) : val(x), next(nullptr) {}
};

bool hasCycle(ListNode *head) {
    if (!head || !head->next) return false;
    ListNode *slow = head;
    ListNode *fast = head;

    while (fast && fast->next) {
        slow = slow->next;
        fast = fast->next->next;
        if (slow == fast) return true; // Collision detected
    }
    return false;
}`,
          python: `# Python Cycle Detection
class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next

def has_cycle(head: ListNode) -> bool:
    slow = head
    fast = head

    while fast and fast.next:
        slow = slow.next
        fast = fast.next.next
        if slow == fast:
            return True
    return False`,
          javascript: `// JavaScript Cycle Detection
function hasCycle(head) {
  let slow = head;
  let fast = head;

  while (fast && fast.next) {
    slow = slow.next;
    fast = fast.next.next;
    if (slow === fast) return true;
  }
  return false;
}`
        },
        complexities: {
          time: 'O(N) — Linear traversal.',
          space: 'O(1) — No extra data structures required.'
        }
      },
      {
        id: 'reversing-linked-list',
        slug: 'reversing-linked-list',
        title: 'In-Place Reversal of Linked Lists',
        difficulty: 'Easy',
        readTime: '5 min read',
        practiceSlug: 'merge-k-sorted-lists',
        practiceTitle: 'Reverse List & K-Group',
        summary: 'Reverse pointer directions iteratively with 3 pointers: prev, curr, and next.',
        figure: `
Visual Diagram: Step-by-Step Pointer Reversal

Original:  [1]  ->  [2]  ->  [3]  ->  NULL
            ^        ^
           prev     curr

Step 1: Save next = curr.next ([2])
Step 2: curr.next = prev (NULL)
Step 3: prev = curr ([1])
Step 4: curr = next ([2])

Result:   NULL  <-  [1]  <-  [2]  <-  [3] (New Head)
`,
        concept: `
Reversing a singly-linked list in place requires rewiring the \`next\` pointer of each node to point to the predecessor instead of the successor.

We maintain three references:
- \`prev\`: Initially \`null\`
- \`curr\`: Initially \`head\`
- \`nextTemp\`: Temporary reference to prevent losing the remainder of the chain.
`,
        exampleTrace: `
Loop terminates when \`curr == null\`. The new head of the reversed list is \`prev\`.
`,
        codeSnippets: {
          cpp: `ListNode* reverseList(ListNode* head) {
    ListNode* prev = nullptr;
    ListNode* curr = head;

    while (curr != nullptr) {
        ListNode* nextTemp = curr->next;
        curr->next = prev;
        prev = curr;
        curr = nextTemp;
    }
    return prev;
}`,
          python: `def reverse_list(head: ListNode) -> ListNode:
    prev = None
    curr = head

    while curr:
        next_temp = curr.next
        curr.next = prev
        prev = curr
        curr = next_temp

    return prev`,
          javascript: `function reverseList(head) {
  let prev = null;
  let curr = head;

  while (curr) {
    const nextTemp = curr.next;
    curr.next = prev;
    prev = curr;
    curr = nextTemp;
  }
  return prev;
}`
        },
        complexities: {
          time: 'O(N) — Visits each node exactly once.',
          space: 'O(1) — In-place pointer modifications.'
        }
      }
    ]
  },
  {
    id: 'stacks-queues',
    slug: 'stacks-queues',
    title: 'Stacks & Queues',
    icon: '🥞',
    description: 'LIFO and FIFO data buffers, expression validation, monotonic patterns, and circular buffers.',
    subtopics: [
      {
        id: 'valid-parentheses',
        slug: 'valid-parentheses',
        title: 'Stack Expression Matching',
        difficulty: 'Easy',
        readTime: '5 min read',
        practiceSlug: 'valid-parentheses',
        practiceTitle: 'Valid Parentheses',
        summary: 'Use LIFO properties to match nested brackets, tags, and operators in linear time.',
        figure: `
Visual Diagram: Stack Bracket Matching for "({[]})"

Read '('  --> Push to Stack: ['(']
Read '{'  --> Push to Stack: ['(', '{']
Read '['  --> Push to Stack: ['(', '{', '[']
Read ']'  --> Matches top '['! Pop: ['(', '{']
Read '}'  --> Matches top '{'! Pop: ['(']
Read ')'  --> Matches top '('! Pop: []  --> Stack Empty: VALID!
`,
        concept: `
Because closing brackets must match the most recent unmatched opening bracket, the **Last-In, First-Out (LIFO)** behavior of a Stack is the optimal data structure.

Whenever an opening character is seen, push it. Whenever a closing character is seen, pop the stack and verify that the popped element is the expected opening pair.
`,
        exampleTrace: `
If stack is empty when attempting to pop, or if elements remain in stack at the end of the string, the expression is invalid.
`,
        codeSnippets: {
          cpp: `// C++ Valid Parentheses
#include <string>
#include <stack>
#include <unordered_map>

bool isValid(const std::string& s) {
    std::stack<char> st;
    std::unordered_map<char, char> matching = {
        {')', '('}, {']', '['}, {'}', '{'}
    };

    for (char c : s) {
        if (matching.count(c)) {
            if (st.empty() || st.top() != matching[c]) return false;
            st.pop();
        } else {
            st.push(c);
        }
    }
    return st.empty();
}`,
          python: `# Python Valid Parentheses
def is_valid(s: str) -> bool:
    stack = []
    mapping = {')': '(', '}': '{', ']': '['}

    for char in s:
        if char in mapping:
            top_element = stack.pop() if stack else '#'
            if mapping[char] != top_element:
                return False
        else:
            stack.append(char)

    return len(stack) == 0`,
          javascript: `// JavaScript Valid Parentheses
function isValid(s) {
  const stack = [];
  const map = { ')': '(', '}': '{', ']': '[' };

  for (const char of s) {
    if (char in map) {
      if (stack.pop() !== map[char]) return false;
    } else {
      stack.push(char);
    }
  }
  return stack.length === 0;
}`
        },
        complexities: {
          time: 'O(N) — Single pass over string of length N.',
          space: 'O(N) — Stack size proportional to open brackets.'
        }
      },
      {
        id: 'monotonic-stack',
        slug: 'monotonic-stack',
        title: 'Monotonic Stack Pattern',
        difficulty: 'Hard',
        readTime: '8 min read',
        practiceSlug: 'trapping-rain-water',
        practiceTitle: 'Trapping Rain Water',
        summary: 'Maintain elements in strictly increasing or decreasing order to compute nearest greater/smaller values in O(N).',
        figure: `
Visual Diagram: Next Greater Element using Monotonic Decreasing Stack
Array: [2, 1, 2, 4, 3]

1. Push 2:  Stack [2]
2. Push 1:  Stack [2, 1] (Decreasing preserved)
3. Read 2:  2 > 1! Pop 1 -> Next Greater for 1 is 2!
            Push 2: Stack [2, 2]
4. Read 4:  4 > 2! Pop 2 -> Next Greater for 2 is 4!
            Pop 2 -> Next Greater for 2 is 4!
            Push 4: Stack [4]
`,
        concept: `
A **Monotonic Stack** enforces that items on the stack are always sorted (either non-increasing or non-decreasing).

When pushing a new item would break the monotonicity, we repeatedly pop items from the top. Those popped items are resolved by the incoming element!
`,
        exampleTrace: `
Crucial for problems like:
- Daily Temperatures (Next Warmer Day)
- Trapping Rain Water
- Largest Rectangle in Histogram
`,
        codeSnippets: {
          cpp: `// Monotonic Stack: Next Greater Element
#include <vector>
#include <stack>

std::vector<int> nextGreaterElements(const std::vector<int>& nums) {
    int n = nums.size();
    std::vector<int> result(n, -1);
    std::stack<int> st; // stores indices

    for (int i = 0; i < n; ++i) {
        while (!st.empty() && nums[st.top()] < nums[i]) {
            result[st.top()] = nums[i];
            st.pop();
        }
        st.push(i);
    }
    return result;
}`,
          python: `def next_greater_elements(nums: list[int]) -> list[int]:
    n = len(nums)
    result = [-1] * n
    stack = [] # stores indices

    for i in range(n):
        while stack and nums[stack[-1]] < nums[i]:
            idx = stack.pop()
            result[idx] = nums[i]
        stack.append(i)

    return result`,
          javascript: `function nextGreaterElements(nums) {
  const result = new Array(nums.length).fill(-1);
  const stack = [];

  for (let i = 0; i < nums.length; i++) {
    while (stack.length > 0 && nums[stack[stack.length - 1]] < nums[i]) {
      const idx = stack.pop();
      result[idx] = nums[i];
    }
    stack.push(i);
  }
  return result;
}`
        },
        complexities: {
          time: 'O(N) — Every index is pushed and popped at most once.',
          space: 'O(N) — For stack storage.'
        }
      }
    ]
  },
  {
    id: 'trees',
    slug: 'trees',
    title: 'Trees & Binary Search Trees',
    icon: '🌳',
    description: 'Hierarchical node models, recursive traversals, lowest common ancestors, and balanced search structures.',
    subtopics: [
      {
        id: 'tree-traversals',
        slug: 'tree-traversals',
        title: 'DFS & BFS Tree Traversals',
        difficulty: 'Medium',
        readTime: '7 min read',
        practiceSlug: 'merge-k-sorted-lists',
        practiceTitle: 'Binary Tree Traversals',
        summary: 'Master Inorder, Preorder, Postorder (DFS) and Level-Order (BFS) tree navigations.',
        figure: `
Visual Diagram: Binary Tree Traversals

            [ 1 ]
           /     \\
        [ 2 ]   [ 3 ]
        /   \\
      [ 4 ] [ 5 ]

Preorder  (Root, Left, Right): 1 -> 2 -> 4 -> 5 -> 3
Inorder   (Left, Root, Right): 4 -> 2 -> 5 -> 1 -> 3 (Sorted on BST!)
Postorder (Left, Right, Root): 4 -> 5 -> 2 -> 3 -> 1
Level-Order (BFS by depth):    Level 0: [1], Level 1: [2, 3], Level 2: [4, 5]
`,
        concept: `
Tree traversals determine the sequence in which each node is visited:
- **Preorder**: Used to clone or serialize trees.
- **Inorder**: Yields elements in ascending order when traversing a Binary Search Tree (BST).
- **Postorder**: Used for bottom-up computation (e.g. subtree sizes, tree deletion).
- **Breadth-First Search (Level Order)**: Uses a queue to explore nodes level-by-level.
`,
        exampleTrace: `
DFS implementations are natively recursive (using the call stack) or iterative using an explicit \`std::stack\`. BFS uses an explicit \`std::queue\`.
`,
        codeSnippets: {
          cpp: `// C++ Inorder & BFS Traversals
#include <vector>
#include <queue>

struct TreeNode {
    int val;
    TreeNode *left, *right;
    TreeNode(int x) : val(x), left(nullptr), right(nullptr) {}
};

void inorderDFS(TreeNode* root, std::vector<int>& result) {
    if (!root) return;
    inorderDFS(root->left, result);
    result.push_back(root->val);
    inorderDFS(root->right, result);
}

std::vector<std::vector<int>> levelOrderBFS(TreeNode* root) {
    std::vector<std::vector<int>> levels;
    if (!root) return levels;
    std::queue<TreeNode*> q;
    q.push(root);

    while (!q.empty()) {
        int levelSize = q.size();
        std::vector<int> currentLevel;
        for (int i = 0; i < levelSize; ++i) {
            TreeNode* node = q.front();
            q.pop();
            currentLevel.push_back(node->val);
            if (node->left) q.push(node->left);
            if (node->right) q.push(node->right);
        }
        levels.push_back(currentLevel);
    }
    return levels;
}`,
          python: `def inorder_dfs(root, res=None):
    if res is None: res = []
    if not root: return res
    inorder_dfs(root.left, res)
    res.append(root.val)
    inorder_dfs(root.right, res)
    return res`,
          javascript: `function levelOrder(root) {
  if (!root) return [];
  const levels = [];
  const queue = [root];

  while (queue.length > 0) {
    const levelSize = queue.length;
    const currentLevel = [];
    for (let i = 0; i < levelSize; i++) {
      const node = queue.shift();
      currentLevel.push(node.val);
      if (node.left) queue.push(node.left);
      if (node.right) queue.push(node.right);
    }
    levels.push(currentLevel);
  }
  return levels;
}`
        },
        complexities: {
          time: 'O(N) — Every node is visited once.',
          space: 'O(H) for DFS (where H is height), O(W) for BFS (where W is max width).'
        }
      }
    ]
  },
  {
    id: 'graphs',
    slug: 'graphs',
    title: 'Graphs & Networks',
    icon: '🕸️',
    description: 'Adjacency graphs, shortest paths, topological sort, cycle detection, and spanning trees.',
    subtopics: [
      {
        id: 'bfs-dfs',
        slug: 'bfs-dfs',
        title: 'Breadth-First & Depth-First Search',
        difficulty: 'Medium',
        readTime: '8 min read',
        practiceSlug: 'trapping-rain-water',
        practiceTitle: 'Graph Explorations',
        summary: 'Traverse graphs using queues for shortest paths or recursion for connectivity.',
        figure: `
Visual Diagram: BFS Shortest Path vs DFS Backtracking

      (A) --- (B) --- (E)
       |       |
      (C) --- (D)

BFS from (A): Visits distance 1 nodes first {(B), (C)}, then distance 2 {(E), (D)}.
Guarantees the shortest path on unweighted graphs!
`,
        concept: `
Graphs consist of vertices (nodes) and edges (connections).
- **BFS**: Explores equidistant neighbors iteratively using a FIFO queue and a \`visited\` set. Optimal for finding the shortest path in unweighted graphs.
- **DFS**: Plunges as deep as possible along each branch before backtracking. Essential for topological sorting, cycle detection, and connected components.
`,
        exampleTrace: `
Always track \`visited\` to prevent infinite cycles in cyclic graphs.
`,
        codeSnippets: {
          cpp: `// C++ BFS Shortest Path
#include <vector>
#include <queue>
#include <unordered_set>

int shortestPathBFS(int start, int target, const std::vector<std::vector<int>>& adj) {
    std::queue<std::pair<int, int>> q; // {node, distance}
    std::unordered_set<int> visited;

    q.push({start, 0});
    visited.insert(start);

    while (!q.empty()) {
        auto [node, dist] = q.front();
        q.pop();

        if (node == target) return dist;

        for (int neighbor : adj[node]) {
            if (!visited.count(neighbor)) {
                visited.insert(neighbor);
                q.push({neighbor, dist + 1});
            }
        }
    }
    return -1; // Unreachable
}`,
          python: `from collections import deque

def shortest_path_bfs(start, target, adj):
    queue = deque([(start, 0)])
    visited = {start}

    while queue:
        node, dist = queue.popleft()
        if node == target:
            return dist
        for neighbor in adj.get(node, []):
            if neighbor not in visited:
                visited.add(neighbor)
                queue.append((neighbor, dist + 1))
    return -1`,
          javascript: `function shortestPathBFS(start, target, adj) {
  const queue = [[start, 0]];
  const visited = new Set([start]);

  while (queue.length > 0) {
    const [node, dist] = queue.shift();
    if (node === target) return dist;

    for (const neighbor of (adj[node] || [])) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push([neighbor, dist + 1]);
      }
    }
  }
  return -1;
}`
        },
        complexities: {
          time: 'O(V + E) — Where V is vertices and E is edges.',
          space: 'O(V) — For visited set and queue/recursion stack.'
        }
      }
    ]
  },
  {
    id: 'dynamic-programming',
    slug: 'dynamic-programming',
    title: 'Dynamic Programming',
    icon: '⚡',
    description: 'Optimal substructure, overlapping subproblems, memoization, and bottom-up tabulation.',
    subtopics: [
      {
        id: 'memoization-tabulation',
        slug: 'memoization-tabulation',
        title: 'Memoization vs Tabulation',
        difficulty: 'Medium to Hard',
        readTime: '9 min read',
        practiceSlug: 'best-time-to-buy-and-sell-stock',
        practiceTitle: 'DP Foundations',
        summary: 'Turn exponential O(2^N) recursive trees into polynomial O(N) by storing subproblem answers.',
        figure: `
Visual Diagram: Overlapping Subproblems in Fibonacci

                     fib(5)
                   /        \\
              fib(4)        fib(3)  <-- Repeated!
             /      \\       /     \\
         fib(3)    fib(2) fib(2)  fib(1)
        /     \\
     fib(2)  fib(1)

Without DP: 2^N calls.
With Memoization / Tabulation: Exactly N subproblems solved once!
`,
        concept: `
Dynamic Programming applies when a problem exhibits:
1. **Overlapping Subproblems**: The same smaller subproblems are computed repeatedly.
2. **Optimal Substructure**: The optimal solution to the problem incorporates optimal solutions to its subproblems.

### Two Paradigms:
- **Top-Down (Memoization)**: Write natural recursion and cache results in a hash map or table.
- **Bottom-Up (Tabulation)**: Build an array iteratively from base cases up to \`N\`. Avoids call stack overhead.
`,
        exampleTrace: `
Example: Climbing Stairs where \`dp[i] = dp[i-1] + dp[i-2]\`.
`,
        codeSnippets: {
          cpp: `// C++ Space-Optimized Tabulation
int climbStairs(int n) {
    if (n <= 2) return n;
    int prev2 = 1, prev1 = 2;

    for (int i = 3; i <= n; ++i) {
        int current = prev1 + prev2;
        prev2 = prev1;
        prev1 = current;
    }
    return prev1;
}`,
          python: `def climb_stairs(n: int) -> int:
    if n <= 2: return n
    prev2, prev1 = 1, 2
    for _ in range(3, n + 1):
        prev2, prev1 = prev1, prev1 + prev2
    return prev1`,
          javascript: `function climbStairs(n) {
  if (n <= 2) return n;
  let prev2 = 1, prev1 = 2;
  for (let i = 3; i <= n; i++) {
    const current = prev1 + prev2;
    prev2 = prev1;
    prev1 = current;
  }
  return prev1;
}`
        },
        complexities: {
          time: 'O(N) — Linear state transitions.',
          space: 'O(1) — Space-optimized with two variables.'
        }
      }
    ]
  }
];

// Initial seed discussion comments
const DEFAULT_COMMENTS = {
  'two-pointers': [
    {
      id: 'c1',
      username: 'algo_master',
      displayName: 'Alex Rivers',
      userAvatar: 'A',
      content: 'Two Pointers is honestly the most versatile pattern in competitive programming. Remembering to sort first is the key trick for 3Sum!',
      upvotes: 14,
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString()
    },
    {
      id: 'c2',
      username: 'dev_ninja',
      displayName: 'Sarah Chen',
      userAvatar: 'S',
      content: 'The visual diagram makes it so clear why opposing pointers work. No need for nested loops when you can eliminate a whole row in O(1)!',
      upvotes: 8,
      createdAt: new Date(Date.now() - 86400000 * 1).toISOString()
    }
  ],
  'sliding-window': [
    {
      id: 'c3',
      username: 'code_warrior',
      displayName: 'Priya Sharma',
      userAvatar: 'P',
      content: 'Dynamic window size problems used to trip me up until I internalized: expand with right, shrink with left when invalid.',
      upvotes: 11,
      createdAt: new Date(Date.now() - 86400000 * 3).toISOString()
    }
  ]
};

// @route   GET /api/learn/topics
// @desc    Get all DSA topics and subtopic summaries
// @access  Public
router.get('/topics', (req, res) => {
  const topicsSummary = DSA_TOPICS.map(t => ({
    id: t.id,
    slug: t.slug,
    title: t.title,
    icon: t.icon,
    description: t.description,
    subtopicsCount: t.subtopics.length,
    subtopics: t.subtopics.map(s => ({
      id: s.id,
      slug: s.slug,
      title: s.title,
      difficulty: s.difficulty,
      readTime: s.readTime,
      summary: s.summary,
      practiceSlug: s.practiceSlug,
      practiceTitle: s.practiceTitle
    }))
  }));

  res.json({ success: true, topics: topicsSummary });
});

// @route   GET /api/learn/article/:topicSlug/:subtopicSlug
// @desc    Get full article for a specific subtopic
// @access  Public
router.get('/article/:topicSlug/:subtopicSlug', (req, res) => {
  const { topicSlug, subtopicSlug } = req.params;

  const topic = DSA_TOPICS.find(t => t.slug === topicSlug || t.id === topicSlug);
  if (!topic) {
    return res.status(404).json({ message: 'Topic not found' });
  }

  const subtopic = topic.subtopics.find(s => s.slug === subtopicSlug || s.id === subtopicSlug);
  if (!subtopic) {
    return res.status(404).json({ message: 'Subtopic article not found' });
  }

  res.json({
    success: true,
    topic: {
      id: topic.id,
      slug: topic.slug,
      title: topic.title,
      icon: topic.icon
    },
    article: subtopic
  });
});

// @route   GET /api/learn/comments/:subtopicSlug
// @desc    Get discussion comments for an article
// @access  Public
router.get('/comments/:subtopicSlug', async (req, res) => {
  try {
    const { subtopicSlug } = req.params;

    // Fetch comments from DB
    const dbComments = await ArticleComment.find({ subtopicSlug })
      .sort({ createdAt: -1 })
      .limit(50);

    const initialSeed = DEFAULT_COMMENTS[subtopicSlug] || [];
    
    // Combine db comments and default seeds
    const combined = [
      ...dbComments.map(c => ({
        id: c._id.toString(),
        username: c.username,
        displayName: c.displayName || c.username,
        userAvatar: c.userAvatar || c.username.charAt(0).toUpperCase(),
        content: c.content,
        upvotes: c.upvotes,
        createdAt: c.createdAt
      })),
      ...initialSeed
    ];

    res.json({ success: true, comments: combined });
  } catch (err) {
    console.error('Error loading comments:', err);
    res.status(500).json({ message: 'Failed to fetch comments' });
  }
});

// @route   POST /api/learn/comments/:subtopicSlug
// @desc    Post a new discussion comment
// @access  Private
router.post('/comments/:subtopicSlug', protect, async (req, res) => {
  try {
    const { subtopicSlug } = req.params;
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ message: 'Comment content cannot be empty' });
    }

    const comment = await ArticleComment.create({
      subtopicSlug,
      userId: req.user._id,
      username: req.user.username,
      displayName: req.user.displayName || req.user.username,
      userAvatar: req.user.username ? req.user.username.charAt(0).toUpperCase() : 'U',
      content: content.trim()
    });

    res.status(201).json({
      success: true,
      comment: {
        id: comment._id.toString(),
        username: comment.username,
        displayName: comment.displayName,
        userAvatar: comment.userAvatar,
        content: comment.content,
        upvotes: comment.upvotes,
        createdAt: comment.createdAt
      }
    });
  } catch (err) {
    console.error('Error posting comment:', err);
    res.status(500).json({ message: err.message || 'Failed to post comment' });
  }
});

// @route   POST /api/learn/comments/:commentId/upvote
// @desc    Upvote a comment
// @access  Private
router.post('/comments/:commentId/upvote', protect, async (req, res) => {
  try {
    const comment = await ArticleComment.findById(req.params.commentId);
    if (!comment) {
      // If it's a seed comment, just return mock increment
      return res.json({ success: true, upvotes: 15 });
    }

    const hasUpvoted = comment.upvotedUsers?.includes(req.user._id);

    if (hasUpvoted) {
      comment.upvotes = Math.max(0, comment.upvotes - 1);
      comment.upvotedUsers = comment.upvotedUsers.filter(id => id.toString() !== req.user._id.toString());
    } else {
      comment.upvotes += 1;
      if (!comment.upvotedUsers) comment.upvotedUsers = [];
      comment.upvotedUsers.push(req.user._id);
    }

    await comment.save();
    res.json({ success: true, upvotes: comment.upvotes, hasUpvoted: !hasUpvoted });
  } catch (err) {
    console.error('Error upvoting comment:', err);
    res.status(500).json({ message: 'Failed to upvote' });
  }
});

export default router;
