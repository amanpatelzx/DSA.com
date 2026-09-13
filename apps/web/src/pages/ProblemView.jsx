import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import axios from 'axios';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import leetcodeSnippetsCache from '../utils/leetcodeSnippetsCache.json';

// Standard LeetCode function templates for supported DSA challenges
const CODE_TEMPLATES = {
  'two-sum': {
    cpp: `class Solution {\npublic:\n    vector<int> twoSum(vector<int>& nums, int target) {\n        \n    }\n};`,
    java: `class Solution {\n    public int[] twoSum(int[] nums, int target) {\n        \n    }\n}`,
    python: `class Solution:\n    def twoSum(self, nums: List[int], target: int) -> List[int]:\n        pass\n`,
    javascript: `/**\n * @param {number[]} nums\n * @param {number} target\n * @return {number[]}\n */\nvar twoSum = function(nums, target) {\n    \n};`,
    typescript: `function twoSum(nums: number[], target: number): number[] {\n    \n};`,
    c: `/**\n * Note: The returned array must be malloced, assume caller calls free().\n */\nint* twoSum(int* nums, int numsSize, int target, int* returnSize) {\n    \n}`
  },
  'valid-parentheses': {
    cpp: `class Solution {\npublic:\n    bool isValid(string s) {\n        \n    }\n};`,
    java: `class Solution {\n    public boolean isValid(String s) {\n        \n    }\n}`,
    python: `class Solution:\n    def isValid(self, s: str) -> bool:\n        pass\n`,
    javascript: `/**\n * @param {string} s\n * @return {boolean}\n */\nvar isValid = function(s) {\n    \n};`,
    typescript: `function isValid(s: string): boolean {\n    \n};`,
    c: `bool isValid(char* s) {\n    \n}`
  },
  'best-time-to-buy-and-sell-stock': {
    cpp: `class Solution {\npublic:\n    int maxProfit(vector<int>& prices) {\n        \n    }\n};`,
    java: `class Solution {\n    public int maxProfit(int[] prices) {\n        \n    }\n}`,
    python: `class Solution:\n    def maxProfit(self, prices: List[int]) -> int:\n        pass\n`,
    javascript: `/**\n * @param {number[]} prices\n * @return {number}\n */\nvar maxProfit = function(prices) {\n    \n};`,
    typescript: `function maxProfit(prices: number[]): number {\n    \n};`,
    c: `int maxProfit(int* prices, int pricesSize) {\n    \n}`
  },
  'lru-cache': {
    cpp: `class LRUCache {\npublic:\n    LRUCache(int capacity) {\n        \n    }\n    \n    int get(int key) {\n        \n    }\n    \n    void put(int key, int value) {\n        \n    }\n};\n\n/**\n * Your LRUCache object will be instantiated and called as such:\n * LRUCache* obj = new LRUCache(capacity);\n * int param_1 = obj->get(key);\n * obj->put(key,value);\n */`,
    java: `class LRUCache {\n\n    public LRUCache(int capacity) {\n        \n    }\n    \n    public int get(int key) {\n        \n    }\n    \n    public void put(int key, int value) {\n        \n    }\n}\n\n/**\n * Your LRUCache object will be instantiated and called as such:\n * LRUCache obj = new LRUCache(capacity);\n * int param_1 = obj.get(key);\n * obj.put(key,value);\n */`,
    python: `class LRUCache:\n\n    def __init__(self, capacity: int):\n        pass\n\n    def get(self, key: int) -> int:\n        pass\n\n    def put(self, key: int, value: int) -> None:\n        pass\n\n# Your LRUCache object will be instantiated and called as such:\n# obj = LRUCache(capacity)\n# param_1 = obj.get(key)\n# obj.put(key,value)`,
    javascript: `/**\n * @param {number} capacity\n */\nvar LRUCache = function(capacity) {\n    \n};\n\n/** \n * @param {number} key\n * @return {number}\n */\nLRUCache.prototype.get = function(key) {\n    \n};\n\n/** \n * @param {number} key \n * @param {number} value\n * @return {void}\n */\nLRUCache.prototype.put = function(key, value) {\n    \n};\n\n/** \n * Your LRUCache object will be instantiated and called as such:\n * var obj = new LRUCache(capacity)\n * var param_1 = obj.get(key)\n * obj.put(key,value)\n */`,
    typescript: `class LRUCache {\n    constructor(capacity: number) {\n\n    }\n\n    get(key: number): number {\n\n    }\n\n    put(key: number, value: number): void {\n\n    }\n}`,
    c: `typedef struct {\n    \n} LRUCache;\n\nLRUCache* lRUCacheCreate(int capacity) {\n    \n}\n\nint lRUCacheGet(LRUCache* obj, int key) {\n    \n}\n\nvoid lRUCachePut(LRUCache* obj, int key, int value) {\n    \n}\n\nvoid lRUCacheFree(LRUCache* obj) {\n    \n}`
  },
  '3sum': {
    cpp: `class Solution {\npublic:\n    vector<vector<int>> threeSum(vector<int>& nums) {\n        \n    }\n};`,
    java: `class Solution {\n    public List<List<Integer>> threeSum(int[] nums) {\n        \n    }\n}`,
    python: `class Solution:\n    def threeSum(self, nums: List[int]) -> List[List[int]]:\n        pass\n`,
    javascript: `/**\n * @param {number[]} nums\n * @return {number[][]}\n */\nvar threeSum = function(nums) {\n    \n};`,
    typescript: `function threeSum(nums: number[]): number[][] {\n    \n};`,
    c: `int** threeSum(int* nums, int numsSize, int* returnSize, int** returnColumnSizes) {\n    \n}`
  },
  'longest-substring-without-repeating-characters': {
    cpp: `class Solution {\npublic:\n    int lengthOfLongestSubstring(string s) {\n        \n    }\n};`,
    java: `class Solution {\n    public int lengthOfLongestSubstring(String s) {\n        \n    }\n}`,
    python: `class Solution:\n    def lengthOfLongestSubstring(self, s: str) -> int:\n        pass\n`,
    javascript: `/**\n * @param {string} s\n * @return {number}\n */\nvar lengthOfLongestSubstring = function(s) {\n    \n};`,
    typescript: `function lengthOfLongestSubstring(s: string): number {\n    \n};`,
    c: `int lengthOfLongestSubstring(char* s) {\n    \n}`
  },
  'trapping-rain-water': {
    cpp: `class Solution {\npublic:\n    int trap(vector<int>& height) {\n        \n    }\n};`,
    java: `class Solution {\n    public int trap(int[] height) {\n        \n    }\n}`,
    python: `class Solution:\n    def trap(self, height: List[int]) -> int:\n        pass\n`,
    javascript: `/**\n * @param {number[]} height\n * @return {number}\n */\nvar trap = function(height) {\n    \n};`,
    typescript: `function trap(height: number[]): number {\n    \n};`,
    c: `int trap(int* height, int heightSize) {\n    \n}`
  },
  'merge-k-sorted-lists': {
    cpp: `/**\n * Definition for singly-linked list.\n * struct ListNode {\n *     int val;\n *     ListNode *next;\n *     ListNode() : val(0), next(nullptr) {}\n *     ListNode(int x) : val(x), next(nullptr) {}\n *     ListNode(int x, ListNode *next) : val(x), next(next) {}\n * };\n */\nclass Solution {\npublic:\n    ListNode* mergeKLists(vector<ListNode*>& lists) {\n        \n    }\n};`,
    java: `/**\n * Definition for singly-linked list.\n * public class ListNode {\n *     int val;\n *     ListNode next;\n *     ListNode() {}\n *     ListNode(int val) { this.val = val; } \n *     ListNode(int val, ListNode next) { this.val = val; this.next = next; }\n * }\n */\nclass Solution {\n    public ListNode mergeKLists(ListNode[] lists) {\n        \n    }\n}`,
    python: `# Definition for singly-linked list.\n# class ListNode:\n#     def __init__(self, val=0, next=None):\n#         self.val = val\n#         self.next = next\nclass Solution:\n    def mergeKLists(self, lists: List[Optional[ListNode]]) -> Optional[ListNode]:\n        pass\n`,
    javascript: `/**\n * Definition for singly-linked list.\n * function ListNode(val, next) {\n *     this.val = (val===undefined ? 0 : val)\n *     this.next = (next===undefined ? null : next)\n * }\n */\n/**\n * @param {ListNode[]} lists\n * @return {ListNode}\n */\nvar mergeKLists = function(lists) {\n    \n};`,
    typescript: `function mergeKLists(lists: Array<ListNode | null>): ListNode | null {\n    \n};`,
    c: `struct ListNode* mergeKLists(struct ListNode** lists, int listsSize) {\n    \n}`
  },
  'median-of-two-sorted-arrays': {
    cpp: `class Solution {\npublic:\n    double findMedianSortedArrays(vector<int>& nums1, vector<int>& nums2) {\n        \n    }\n};`,
    java: `class Solution {\n    public double findMedianSortedArrays(int[] nums1, int[] nums2) {\n        \n    }\n}`,
    python: `class Solution:\n    def findMedianSortedArrays(self, nums1: List[int], nums2: List[int]) -> float:\n        pass\n`,
    javascript: `/**\n * @param {number[]} nums1\n * @param {number[]} nums2\n * @return {number}\n */\nvar findMedianSortedArrays = function(nums1, nums2) {\n    \n};`,
    typescript: `function findMedianSortedArrays(nums1: number[], nums2: number[]): number {\n    \n};`,
    c: `double findMedianSortedArrays(int* nums1, int nums1Size, int* nums2, int nums2Size) {\n    \n}`
  }
};

const toCamelCase = (str) => {
  return (str || 'solution').replace(/[-_ ]+(.)?/g, (_, c) => c ? c.toUpperCase() : '');
};

const getBoilerplateTemplate = (slug, problemTitle, lang, problemObj = null) => {
  const problemKey = (slug || '').toLowerCase().trim();

  // 1. Check live problem object codeSnippets from database
  if (problemObj?.codeSnippets && Array.isArray(problemObj.codeSnippets)) {
    const langSlug = lang === 'python' ? 'python3' : lang;
    const match = problemObj.codeSnippets.find(
      s => s.langSlug === langSlug || s.langSlug === lang || s.lang === lang
    );
    if (match && match.code && match.code.trim()) {
      return match.code;
    }
  }

  // 2. Check client-side LeetCode snippets cache
  const cached = leetcodeSnippetsCache[problemKey];
  if (cached?.snippets) {
    const langSlug = lang === 'python' ? 'python3' : lang;
    if (cached.snippets[langSlug]) return cached.snippets[langSlug];
    if (cached.snippets[lang]) return cached.snippets[lang];
  }

  // 3. Check hardcoded standard templates
  if (CODE_TEMPLATES[problemKey] && CODE_TEMPLATES[problemKey][lang]) {
    return CODE_TEMPLATES[problemKey][lang];
  }

  // 4. Construct typed signature dynamically from metaData if available
  const meta = problemObj?.metaData || cached?.meta;
  if (meta && meta.name) {
    const funcName = meta.name;
    const params = meta.params || [];
    const returnType = meta.return?.type || 'integer';

    if (lang === 'cpp') {
      const cppTypeMap = {
        'integer': 'int',
        'long': 'long long',
        'float': 'double',
        'double': 'double',
        'boolean': 'bool',
        'character': 'char',
        'string': 'string',
        'integer[]': 'vector<int>&',
        'string[]': 'vector<string>&',
        'character[]': 'vector<char>&',
        'list<integer>': 'vector<int>&',
        'list<string>': 'vector<string>&',
        'integer[][]': 'vector<vector<int>>&',
        'void': 'void'
      };
      const retCpp = cppTypeMap[returnType] ? cppTypeMap[returnType].replace('&', '') : 'int';
      const paramList = params.map(p => `${cppTypeMap[p.type] || 'int'} ${p.name}`).join(', ');
      return `class Solution {\npublic:\n    ${retCpp} ${funcName}(${paramList}) {\n        \n    }\n};`;
    } else if (lang === 'python') {
      const pyTypeMap = {
        'integer': 'int',
        'long': 'int',
        'float': 'float',
        'double': 'float',
        'boolean': 'bool',
        'character': 'str',
        'string': 'str',
        'integer[]': 'List[int]',
        'string[]': 'List[str]',
        'integer[][]': 'List[List[int]]',
        'void': 'None'
      };
      const retPy = pyTypeMap[returnType] || 'Any';
      const paramList = ['self', ...params.map(p => `${p.name}: ${pyTypeMap[p.type] || 'Any'}`)].join(', ');
      return `class Solution:\n    def ${funcName}(${paramList}) -> ${retPy}:\n        pass\n`;
    } else if (lang === 'java') {
      const javaTypeMap = {
        'integer': 'int',
        'long': 'long',
        'float': 'double',
        'double': 'double',
        'boolean': 'boolean',
        'character': 'char',
        'string': 'String',
        'integer[]': 'int[]',
        'string[]': 'String[]',
        'integer[][]': 'int[][]',
        'void': 'void'
      };
      const retJava = javaTypeMap[returnType] || 'int';
      const paramList = params.map(p => `${javaTypeMap[p.type] || 'int'} ${p.name}`).join(', ');
      return `class Solution {\n    public ${retJava} ${funcName}(${paramList}) {\n        \n    }\n}`;
    } else if (lang === 'javascript') {
      const paramNames = params.map(p => p.name).join(', ');
      return `/**\n * @return {${returnType}}\n */\nvar ${funcName} = function(${paramNames}) {\n    \n};`;
    }
  }

  // 5. Intelligent Fallback: deduce from example input instead of assuming vector<int>& nums
  const funcName = toCamelCase(slug || 'solution');
  const exInput = problemObj?.examples?.[0]?.input || '';
  const numMatch = exInput.match(/^([a-zA-Z_]\w*)\s*=\s*(-?\d+)$/);
  const strMatch = exInput.match(/^([a-zA-Z_]\w*)\s*=\s*"([^"]*)"$/);

  if (numMatch) {
    const paramName = numMatch[1];
    if (lang === 'cpp') return `class Solution {\npublic:\n    int ${funcName}(int ${paramName}) {\n        \n    }\n};`;
    if (lang === 'python') return `class Solution:\n    def ${funcName}(self, ${paramName}: int) -> int:\n        pass\n`;
    if (lang === 'java') return `class Solution {\n    public int ${funcName}(int ${paramName}) {\n        return 0;\n    }\n}`;
    if (lang === 'javascript') return `var ${funcName} = function(${paramName}) {\n    \n};`;
  }
  if (strMatch) {
    const paramName = strMatch[1];
    if (lang === 'cpp') return `class Solution {\npublic:\n    int ${funcName}(string ${paramName}) {\n        \n    }\n};`;
    if (lang === 'python') return `class Solution:\n    def ${funcName}(self, ${paramName}: str) -> int:\n        pass\n`;
    if (lang === 'java') return `class Solution {\n    public int ${funcName}(String ${paramName}) {\n        return 0;\n    }\n}`;
    if (lang === 'javascript') return `var ${funcName} = function(${paramName}) {\n    \n};`;
  }

  switch (lang) {
    case 'cpp':
      return `class Solution {\npublic:\n    // Problem: ${problemTitle || 'Solution'}\n    int ${funcName}(vector<int>& nums) {\n        \n    }\n};`;
    case 'java':
      return `class Solution {\n    // Problem: ${problemTitle || 'Solution'}\n    public int ${funcName}(int[] nums) {\n        return 0;\n    }\n}`;
    case 'python':
      return `class Solution:\n    # Problem: ${problemTitle || 'Solution'}\n    def ${funcName}(self, nums: List[int]) -> int:\n        pass\n`;
    case 'javascript':
      return `/**\n * Problem: ${problemTitle || 'Solution'}\n * @param {number[]} nums\n * @return {number}\n */\nvar ${funcName} = function(nums) {\n    \n};`;
    case 'typescript':
      return `function ${funcName}(nums: number[]): number {\n    \n};`;
    case 'c':
      return `int ${funcName}(int* nums, int numsSize) {\n    \n}`;
    default:
      return `// Solution for ${problemTitle || slug}\n`;
  }
};

export default function ProblemView() {
  const { slug: rawSlug } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, token, refreshUser, isLoggedIn } = useAuth();

  const slug = rawSlug || localStorage.getItem('dsa_last_problem_slug') || 'two-sum';

  useEffect(() => {
    if (!rawSlug) {
      navigate(`/problem/${slug}`, { replace: true });
    }
  }, [rawSlug, slug, navigate]);

  // Dynamic direct battle link resolver: if slug is 'battle' or 'direct-challenge', fetch random problem from backend
  useEffect(() => {
    if (rawSlug === 'battle' || rawSlug === 'direct-challenge') {
      const modeQuery = searchParams.get('mode') || 'Bullet';
      const diffQuery = searchParams.get('difficulty') || '';
      const countQuery = searchParams.get('problems') || 1;

      axios.get(`http://localhost:5000/api/problems/random?mode=${encodeURIComponent(modeQuery)}&difficulty=${encodeURIComponent(diffQuery)}&count=${countQuery}`)
        .then(res => {
          if (res.data?.slugs && res.data.slugs.length > 0) {
            const first = res.data.slugs[0];
            const newParams = new URLSearchParams(searchParams);
            newParams.set('problemList', res.data.slugs.join(','));
            navigate(`/problem/${first}?${newParams.toString()}`, { replace: true });
          } else {
            navigate(`/problem/two-sum?${searchParams.toString()}`, { replace: true });
          }
        })
        .catch(() => {
          navigate(`/problem/two-sum?${searchParams.toString()}`, { replace: true });
        });
    }
  }, [rawSlug, searchParams, navigate]);

  const modeParam = searchParams.get('mode');
  const isExplicitPractice = modeParam && modeParam.toLowerCase() === 'practice';
  const isChallenge = !isExplicitPractice && Boolean(
    searchParams.get('opponent') ||
    searchParams.get('challenge') ||
    searchParams.get('battle') ||
    searchParams.get('contest') ||
    searchParams.get('tournament') ||
    searchParams.get('battleId')
  );

  const mode = searchParams.get('mode') || (isChallenge ? 'Blitz' : 'Practice');
  const timeControlParam = searchParams.get('time') || (isChallenge ? '3 + 0' : 'Untimed');
  const opponentParam = isChallenge ? (searchParams.get('opponent') || searchParams.get('challenge') || 'BOT') : null;
  const opponentRatingParam = parseInt(searchParams.get('opponentRating') || '1510', 10);

  // Rated vs Non-Rated match configuration
  const isExplicitNonRated = searchParams.get('rated') === '0' || searchParams.get('rated') === 'false';
  const isLikelyBot = Boolean(
    searchParams.get('isBot') === '1' ||
    searchParams.get('bot') === '1' ||
    (opponentParam && (
      opponentParam.toLowerCase().includes('bot') ||
      opponentParam.toLowerCase().includes('computer') ||
      opponentParam.toLowerCase().includes('stockfish') ||
      opponentParam.toLowerCase().includes('deepcoder')
    ))
  );
  const tournamentId = searchParams.get('tournamentId') || (
    searchParams.get('contest') && searchParams.get('contest') !== 'tournament'
      ? searchParams.get('contest')
      : null
  );
  const isTournament = Boolean(tournamentId || searchParams.get('isTournament'));
  const isRated = !isTournament && isChallenge && !isExplicitNonRated && !isLikelyBot;

  // Multi-problem challenge support (1, 2, or 3 problems)
  const problemListParam = searchParams.get('problemList');
  const initialMatchProblems = problemListParam
    ? problemListParam.split(',').map(s => s.trim()).filter(Boolean)
    : [slug];

  const activeUsername = user?.username || localStorage.getItem('username') || 'user';
  const userModeRating = user?.ratings?.[mode.toLowerCase()] ?? 1500;

  // Unique session key for current 1v1 battle / challenge
  const currentMatchKey = isChallenge ? [
    activeUsername,
    opponentParam || 'challenge',
    mode || 'blitz',
    timeControlParam || '3+0',
    initialMatchProblems.slice().sort().join(',')
  ].join('_') : null;

  const [matchProblems, setMatchProblems] = useState(initialMatchProblems);
  const [currentProblemSlug, setCurrentProblemSlug] = useState(slug || initialMatchProblems[0] || 'two-sum');
  const activeSlug = currentProblemSlug;
  const [solvedProblemSlugs, setSolvedProblemSlugs] = useState(() => new Set());
  const [problemProgressModal, setProblemProgressModal] = useState(null);
  const [showProblemDropdown, setShowProblemDropdown] = useState(false);
  const problemDropdownRef = useRef(null);
  const codeCacheByProblemLangRef = useRef({});

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (problemDropdownRef.current && !problemDropdownRef.current.contains(e.target)) {
        setShowProblemDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Preferred language persistence (defaulting to C++20 if not set)
  const [language, setLanguage] = useState(() => localStorage.getItem('dsa_preferred_lang') || 'cpp');
  const [codeByLanguage, setCodeByLanguage] = useState({});
  const [code, setCode] = useState('');
  const [problem, setProblem] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [matchResult, setMatchResult] = useState(null);
  const [saveStatus, setSaveStatus] = useState('idle'); // 'idle' | 'saving' | 'saved'
  const [opponentTestsPassed, setOpponentTestsPassed] = useState(0);
  const autoSaveTimerRef = useRef(null);

  // Editor Font Size state & persistence (defaulting to 14px like standard VS Code/IDE)
  const [editorFontSize, setEditorFontSize] = useState(() => {
    try {
      const saved = localStorage.getItem('dsa_editor_font_size');
      const parsed = saved ? parseInt(saved, 10) : 14;
      return (!isNaN(parsed) && parsed >= 10 && parsed <= 32) ? parsed : 14;
    } catch {
      return 14;
    }
  });
  const [zoomNotification, setZoomNotification] = useState(null);
  const zoomToastTimerRef = useRef(null);
  const editorContainerRef = useRef(null);

  const PRESET_FONT_SIZES = [11, 12, 13, 14, 15, 16, 17, 18, 20, 22, 24];

  const availableFontSizes = useMemo(() => {
    if (PRESET_FONT_SIZES.includes(editorFontSize)) {
      return PRESET_FONT_SIZES;
    }
    return [...PRESET_FONT_SIZES, editorFontSize].sort((a, b) => a - b);
  }, [editorFontSize]);

  const showZoomNotification = useCallback((size) => {
    setZoomNotification(`${size}px`);
    if (zoomToastTimerRef.current) clearTimeout(zoomToastTimerRef.current);
    zoomToastTimerRef.current = setTimeout(() => {
      setZoomNotification(null);
    }, 1200);
  }, []);

  const updateFontSize = useCallback((newSize) => {
    const clamped = Math.min(32, Math.max(10, Math.round(newSize)));
    setEditorFontSize(clamped);
    if (editorInstanceRef.current) {
      editorInstanceRef.current.updateOptions({ fontSize: clamped });
    }
    try {
      localStorage.setItem('dsa_editor_font_size', String(clamped));
    } catch {}
    showZoomNotification(clamped);
  }, [showZoomNotification]);

  const adjustFontSize = useCallback((delta) => {
    setEditorFontSize((prev) => {
      const next = Math.min(32, Math.max(10, prev + delta));
      if (editorInstanceRef.current) {
        editorInstanceRef.current.updateOptions({ fontSize: next });
      }
      try {
        localStorage.setItem('dsa_editor_font_size', String(next));
      } catch {}
      showZoomNotification(next);
      return next;
    });
  }, [showZoomNotification]);

  // Dynamic zoom listener on editor container for Ctrl + MouseWheel / Cmd + MouseWheel (like VS Code)
  useEffect(() => {
    const container = editorContainerRef.current;
    if (!container) return;

    const handleWheel = (e) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        e.stopPropagation();
        const direction = e.deltaY < 0 ? 1 : -1;
        adjustFontSize(direction);
      }
    };

    container.addEventListener('wheel', handleWheel, { passive: false, capture: true });
    return () => {
      container.removeEventListener('wheel', handleWheel, { capture: true });
    };
  }, [adjustFontSize]);

  const switchMatchProblem = (newSlug) => {
    if (newSlug === currentProblemSlug) return;
    // Save current problem code to cache before switching
    codeCacheByProblemLangRef.current[`${currentProblemSlug}_${language}`] = code;

    setCurrentProblemSlug(newSlug);
    setRunResults(null);
    setSelectedCaseIdx(0);

    const cachedCode = codeCacheByProblemLangRef.current[`${newSlug}_${language}`];
    if (cachedCode) {
      setCode(cachedCode);
    } else {
      const probTitle = PROBLEM_DICTIONARY[newSlug]?.title || newSlug;
      setCode(getBoilerplateTemplate(newSlug, probTitle, language));
    }
  };

  // LeetCode-style Bottom Panel Tabs: 'testcase' | 'result'
  const [activeBottomTab, setActiveBottomTab] = useState('testcase');
  const [testcases, setTestcases] = useState([]);
  const [selectedCaseIdx, setSelectedCaseIdx] = useState(0);
  const [runResults, setRunResults] = useState(null);

  // Screen shake and submission reactions
  const [shakeScreen, setShakeScreen] = useState(false);
  const [wrongSubmissionReaction, setWrongSubmissionReaction] = useState(null);
  const [toastReaction, setToastReaction] = useState(null);

  // Anti-Cheat System: Restrict copy & paste during 1v1 battles and contests
  const isChallengeRef = useRef(isChallenge);
  useEffect(() => {
    isChallengeRef.current = isChallenge;
  }, [isChallenge]);

  const [antiCheatAlert, setAntiCheatAlert] = useState(null);
  const antiCheatTimerRef = useRef(null);
  const editorInstanceRef = useRef(null);
  const monacoInstanceRef = useRef(null);

  const triggerCopyPasteWarning = (action) => {
    let actionTitle = 'Copy & Paste Prohibited';
    let detailMessage = 'Internal and external copy-paste is disabled during competitive 1v1 battles and contests!';
    if (action === 'paste') {
      actionTitle = 'Pasting Code Disabled';
      detailMessage = 'Pasting code is blocked in competitive matches. All solutions must be manually written!';
    } else if (action === 'copy') {
      actionTitle = 'Copying Code Disabled';
      detailMessage = 'Copying code is blocked during competitive battles to prevent external sharing.';
    } else if (action === 'cut') {
      actionTitle = 'Cutting Code Disabled';
      detailMessage = 'Cutting code is blocked during competitive battles.';
    } else if (action === 'contextmenu') {
      actionTitle = 'Right-Click Disabled';
      detailMessage = 'Right-click clipboard actions are disabled during 1v1 battles and contests.';
    }

    setAntiCheatAlert({
      action,
      message: actionTitle,
      detail: detailMessage
    });

    if (antiCheatTimerRef.current) clearTimeout(antiCheatTimerRef.current);
    antiCheatTimerRef.current = setTimeout(() => {
      setAntiCheatAlert(null);
    }, 3800);

    playWrongAnswerSound();
    setShakeScreen(true);
    setTimeout(() => setShakeScreen(false), 500);
  };

  const handleEditorDidMount = (editor, monaco) => {
    editorInstanceRef.current = editor;
    monacoInstanceRef.current = monaco;

    // Apply persisted font size on mount
    editor.updateOptions({ fontSize: editorFontSize });

    // Monaco onKeyDown listener: intercepts zoom shortcuts, and handles anti-cheat during 1v1 battles / contests!
    editor.onKeyDown((e) => {
      const isCtrlOrCmd = e.ctrlKey || e.metaKey;
      const browserEvent = e.browserEvent;
      const key = (browserEvent?.key || '').toLowerCase();

      // VS Code style zoom keyboard shortcuts (Ctrl + '=', Ctrl + '+', Ctrl + '-', Ctrl + '0')
      if (isCtrlOrCmd && (key === '=' || key === '+')) {
        e.preventDefault();
        if (browserEvent) browserEvent.preventDefault();
        adjustFontSize(1);
        return;
      }
      if (isCtrlOrCmd && (key === '-' || key === '_')) {
        e.preventDefault();
        if (browserEvent) browserEvent.preventDefault();
        adjustFontSize(-1);
        return;
      }
      if (isCtrlOrCmd && key === '0') {
        e.preventDefault();
        if (browserEvent) browserEvent.preventDefault();
        updateFontSize(14);
        return;
      }

      if (!isChallengeRef.current) return; // Full native copy/paste allowed in normal practice

      if (isCtrlOrCmd && (key === 'v' || key === 'c' || key === 'x')) {
        e.preventDefault();
        e.stopPropagation();
        if (browserEvent) {
          browserEvent.preventDefault();
          browserEvent.stopPropagation();
        }
        triggerCopyPasteWarning(key === 'v' ? 'paste' : (key === 'c' ? 'copy' : 'cut'));
      } else if (e.shiftKey && (key === 'insert' || browserEvent?.keyCode === 45)) {
        e.preventDefault();
        e.stopPropagation();
        if (browserEvent) {
          browserEvent.preventDefault();
          browserEvent.stopPropagation();
        }
        triggerCopyPasteWarning('paste');
      }
    });
  };

  // Anti-Cheat System: Capture and block copy, cut, paste, drop, and right-click
  // ONLY during competitive 1v1 battles and contests!
  // In normal and resumed practice, ZERO listeners are attached so clipboard is 100% unrestricted.
  useEffect(() => {
    if (!isChallenge) return;

    const editorDom = editorInstanceRef.current?.getDomNode();

    const blockEvent = (e, action) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.stopImmediatePropagation) e.stopImmediatePropagation();
      triggerCopyPasteWarning(action);
    };

    const onPaste = (e) => blockEvent(e, 'paste');
    const onCopy = (e) => blockEvent(e, 'copy');
    const onCut = (e) => blockEvent(e, 'cut');
    const onDrop = (e) => blockEvent(e, 'paste');
    const onContextMenu = (e) => blockEvent(e, 'contextmenu');

    if (editorDom) {
      editorDom.addEventListener('paste', onPaste, true);
      editorDom.addEventListener('copy', onCopy, true);
      editorDom.addEventListener('cut', onCut, true);
      editorDom.addEventListener('drop', onDrop, true);
      editorDom.addEventListener('contextmenu', onContextMenu, true);
    }

    const handleWindowPaste = (e) => {
      if (rightPaneRef.current && rightPaneRef.current.contains(e.target)) {
        blockEvent(e, 'paste');
      }
    };

    const handleWindowCopy = (e) => {
      if (rightPaneRef.current && rightPaneRef.current.contains(e.target)) {
        blockEvent(e, 'copy');
      }
    };

    const handleWindowCut = (e) => {
      if (rightPaneRef.current && rightPaneRef.current.contains(e.target)) {
        blockEvent(e, 'cut');
      }
    };

    window.addEventListener('paste', handleWindowPaste, true);
    window.addEventListener('copy', handleWindowCopy, true);
    window.addEventListener('cut', handleWindowCut, true);

    return () => {
      if (editorDom) {
        editorDom.removeEventListener('paste', onPaste, true);
        editorDom.removeEventListener('copy', onCopy, true);
        editorDom.removeEventListener('cut', onCut, true);
        editorDom.removeEventListener('drop', onDrop, true);
        editorDom.removeEventListener('contextmenu', onContextMenu, true);
      }
      window.removeEventListener('paste', handleWindowPaste, true);
      window.removeEventListener('copy', handleWindowCopy, true);
      window.removeEventListener('cut', handleWindowCut, true);
    };
  }, [isChallenge]);

  // Dynamic Window Resizing (LeetCode Style)
  const containerRef = useRef(null);
  const rightPaneRef = useRef(null);

  // Horizontal Splitter (Problem Width % vs Editor Width %)
  const [leftWidthPercent, setLeftWidthPercent] = useState(() => {
    const saved = localStorage.getItem('dsa_problem_pane_width');
    return saved ? Math.min(Math.max(parseFloat(saved), 20), 75) : 48;
  });
  const [isDraggingHorizontal, setIsDraggingHorizontal] = useState(false);
  const leftWidthRef = useRef(leftWidthPercent);
  useEffect(() => {
    leftWidthRef.current = leftWidthPercent;
  }, [leftWidthPercent]);

  // Vertical Splitter (Testcase Panel Height in pixels)
  const [testcaseHeight, setTestcaseHeight] = useState(() => {
    const saved = localStorage.getItem('dsa_testcase_pane_height');
    return saved ? Math.min(Math.max(parseInt(saved, 10), 42), 700) : 260;
  });
  const [isDraggingVertical, setIsDraggingVertical] = useState(false);
  const testcaseHeightRef = useRef(testcaseHeight);
  const lastExpandedHeightRef = useRef(260);
  useEffect(() => {
    testcaseHeightRef.current = testcaseHeight;
    if (testcaseHeight > 60) {
      lastExpandedHeightRef.current = testcaseHeight;
    }
  }, [testcaseHeight]);

  // Dynamic window resizing event listeners with zero-lag smooth 60fps tracking
  useEffect(() => {
    if (!isDraggingHorizontal && !isDraggingVertical) return;

    const handleMouseMove = (e) => {
      if (isDraggingHorizontal && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const newPercent = ((e.clientX - rect.left) / rect.width) * 100;
        const clamped = Math.min(Math.max(newPercent, 20), 75);
        leftWidthRef.current = clamped;
        setLeftWidthPercent(clamped);
      }

      if (isDraggingVertical && rightPaneRef.current) {
        const rect = rightPaneRef.current.getBoundingClientRect();
        const newHeight = rect.bottom - e.clientY;
        const maxHeight = Math.max(rect.height - 100, 160);
        const clamped = Math.min(Math.max(newHeight, 42), maxHeight);
        testcaseHeightRef.current = clamped;
        setTestcaseHeight(clamped);
      }
    };

    const handleMouseUp = () => {
      if (isDraggingHorizontal) {
        setIsDraggingHorizontal(false);
        localStorage.setItem('dsa_problem_pane_width', leftWidthRef.current.toFixed(1));
      }
      if (isDraggingVertical) {
        setIsDraggingVertical(false);
        localStorage.setItem('dsa_testcase_pane_height', Math.round(testcaseHeightRef.current).toString());
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    document.body.style.userSelect = 'none';
    if (isDraggingHorizontal) document.body.style.cursor = 'col-resize';
    if (isDraggingVertical) document.body.style.cursor = 'row-resize';

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };
  }, [isDraggingHorizontal, isDraggingVertical]);

  // Time remaining calculation
  const parseSeconds = (tcStr) => {
    if (!tcStr || tcStr === 'Untimed') return 180;
    const sStr = String(tcStr).trim();
    if (sStr.endsWith('s') && !sStr.includes('+')) {
      const sMatch = sStr.match(/^(\d+)/);
      if (sMatch) return parseInt(sMatch[1], 10);
    }
    const match = sStr.match(/^(\d+)/);
    if (match) return parseInt(match[1], 10) * 60;
    return 180;
  };

  // Helper to cleanly clear battle state from storage on win, loss, resignation, or timeout
  const clearBattleSession = () => {
    try {
      localStorage.removeItem('dsa_active_battle_session');
      if (Array.isArray(initialMatchProblems)) {
        initialMatchProblems.forEach(pSlug => {
          ['cpp', 'python', 'java', 'javascript', 'typescript', 'c'].forEach(l => {
            sessionStorage.removeItem(`dsa_battle_code_${pSlug}_${l}`);
          });
        });
      }
    } catch {}
  };

  // Synchronous session detector: checks if an active battle is already running in localStorage
  const getInitialBattleSession = () => {
    if (!isChallenge) {
      return {
        battleId: 'battle_practice_' + Date.now(),
        initialTime: 180,
        isResume: false,
        isExpired: false
      };
    }

    const totalSecs = parseSeconds(timeControlParam);
    const now = Date.now();

    try {
      const stored = localStorage.getItem('dsa_active_battle_session');
      if (stored) {
        const session = JSON.parse(stored);
        if (session && session.matchKey === currentMatchKey && session.endTime) {
          const diffMs = session.endTime - now;
          const remainingSecs = Math.ceil(diffMs / 1000);

          if (remainingSecs > 0) {
            // Reconnect to active battle session and continue smoothly!
            return {
              battleId: session.battleId || ('battle_' + activeUsername + '_' + now),
              initialTime: remainingSecs,
              isResume: true,
              isExpired: false
            };
          } else if (diffMs > -60000) {
            // Expired recently during this match while reloading
            return {
              battleId: session.battleId || ('battle_' + activeUsername + '_' + now),
              initialTime: 0,
              isResume: true,
              isExpired: true
            };
          }
        }
      }
    } catch (e) {
      console.warn('Error reading stored battle session:', e);
    }

    // Initialize brand new battle session anchored to real-world clock time
    const endTime = now + totalSecs * 1000;
    const battleId = 'battle_' + (user?._id || user?.id || activeUsername) + '_' + now;
    const newSession = {
      matchKey: currentMatchKey,
      battleId,
      startTime: now,
      endTime,
      totalDurationSeconds: totalSecs,
      mode,
      timeControl: timeControlParam,
      opponent: opponentParam,
      isRated
    };
    try {
      localStorage.setItem('dsa_active_battle_session', JSON.stringify(newSession));
    } catch (e) {}

    return {
      battleId,
      initialTime: totalSecs,
      isResume: false,
      isExpired: false
    };
  };

  // Live WebSocket Battle POV Broadcasting (Only for 1v1 battles / challenges)
  const socketRef = useRef(null);
  const initialBattleSessionRef = useRef(null);
  if (!initialBattleSessionRef.current) {
    initialBattleSessionRef.current = getInitialBattleSession();
  }

  const battleIdRef = useRef(initialBattleSessionRef.current.battleId);
  const debounceTimerRef = useRef(null);
  const timeLeftRef = useRef(initialBattleSessionRef.current.initialTime);

  const [timeLeft, setTimeLeft] = useState(initialBattleSessionRef.current.initialTime);
  const [timerActive, setTimerActive] = useState(() => initialBattleSessionRef.current.initialTime > 0);

  useEffect(() => {
    timeLeftRef.current = timeLeft;
  }, [timeLeft]);

  useEffect(() => {
    if (!isChallenge) return;

    let socket;
    try {
      socket = io('http://localhost:5000', {
        transports: ['websocket', 'polling']
      });
      socketRef.current = socket;

      const battleId = battleIdRef.current;
      const userRating = (user?.ratings && user.ratings[mode?.toLowerCase()]) || user?.ratings?.blitz || 1500;

      socket.emit('battle:live_register', {
        battleId,
        problemSlug: activeSlug,
        problemTitle: problem?.title || activeSlug,
        mode,
        timeControl: timeControlParam,
        durationSeconds: parseSeconds(timeControlParam),
        timeLeft: timeLeftRef.current,
        user: {
          id: user?._id || user?.id || 'guest',
          username: user?.username || 'You',
          displayName: user?.displayName || user?.username || 'You',
          rating: userRating
        },
        opponent: {
          username: opponentParam || 'Opponent',
          rating: opponentRatingParam || 1510
        },
        initialCode: code,
        language,
        testsTotal: testcases.length || 3
      });

      socket.emit('battle:join', battleId);

      socket.on('battle:peer_test_update', ({ testsPassed }) => {
        if (typeof testsPassed === 'number') {
          setOpponentTestsPassed(testsPassed);
        }
      });

      socket.on('battle:peer_won', ({ winnerUsername }) => {
        if (winnerUsername && winnerUsername !== activeUsername) {
          playWrongAnswerSound();
          clearBattleSession();
          setTimerActive(false);
          const ratingChange = isRated ? -12 : 0;
          setMatchResult({
            status: 'loss',
            newRating: isRated ? Math.max(100, userModeRating + ratingChange) : userModeRating,
            ratingChange,
            isRated,
            streak: 0,
            mode,
            opponent: opponentParam,
            problemsSolved: solvedProblemSlugs.size,
            totalProblems: matchProblems.length,
            winnerName: winnerUsername
          });
        }
      });
    } catch (err) {
      console.warn('Live battle socket connect warning:', err);
    }

    return () => {
      if (socket) {
        socket.emit('battle:live_leave', { battleId: battleIdRef.current });
        socket.disconnect();
      }
    };
  }, [activeSlug, mode, timeControlParam, user, problem, isChallenge]);

  // Simulated bot opponent progress over match duration
  useEffect(() => {
    if (!isChallenge || !isLikelyBot || matchResult) return;
    const totalSecs = parseSeconds(timeControlParam);
    const elapsed = totalSecs - timeLeft;
    const progressRatio = elapsed / (totalSecs || 1);

    const totalCases = testcases.length || 3;
    if (progressRatio > 0.72) {
      setOpponentTestsPassed(Math.min(totalCases - 1, 2));
    } else if (progressRatio > 0.36) {
      setOpponentTestsPassed(1);
    }
  }, [isChallenge, isLikelyBot, timeLeft, timeControlParam, testcases.length, matchResult]);

  const broadcastCode = (newCode, currentLang) => {
    if (!isChallenge) return;
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      if (socketRef.current) {
        socketRef.current.emit('battle:code_update', {
          battleId: battleIdRef.current,
          code: newCode,
          language: currentLang || language,
          timeLeft: timeLeftRef.current,
          testsPassed: runResults?.cases?.filter(c => c.passed).length || 0,
          testsTotal: testcases.length || 3
        });
      }
    }, 200);
  };

  // Native Browser Audio Synthesizer (Buzzer for Wrong Answer / Chime for Victory)
  const playWrongAnswerSound = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(160, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(70, ctx.currentTime + 0.35);
      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch {}
  };

  const playVictorySound = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const freqs = [523.25, 659.25, 783.99, 1046.5];
      freqs.forEach((f, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(f, ctx.currentTime + i * 0.08);
        gain.gain.setValueAtTime(0.15, ctx.currentTime + i * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.08 + 0.22);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + i * 0.08);
        osc.stop(ctx.currentTime + i * 0.08 + 0.22);
      });
    } catch {}
  };

  // Match timeout handler (records defeat if rated and displays time-out summary)
  const handleTimeExpired = useCallback(async () => {
    if (!isChallenge || matchResult) return;

    playWrongAnswerSound();

    if (socketRef.current) {
      try {
        socketRef.current.emit('battle:live_leave', { battleId: battleIdRef.current });
      } catch {}
    }

    clearBattleSession();

    const activeToken = localStorage.getItem('token') || token;
    let newRating = userModeRating;
    let ratingChange = 0;

    if (isRated) {
      ratingChange = -12;
      newRating = Math.max(100, userModeRating + ratingChange);

      if (activeToken) {
        try {
          await axios.post(
            'http://localhost:5000/api/battles/record',
            {
              mode,
              timeControl: timeControlParam,
              result: 'loss',
              problemTitle: problem?.title || activeSlug,
              opponentName: opponentParam,
              isRated: true,
              moves: 0,
              testAccuracy: '0%'
            },
            { headers: { Authorization: `Bearer ${activeToken}` } }
          );
          if (refreshUser) refreshUser();
        } catch (apiErr) {
          console.warn('Error recording timeout loss to API:', apiErr.message);
        }
      }
    }

    setMatchResult({
      status: 'timeout',
      newRating,
      ratingChange,
      isRated,
      streak: 0,
      mode,
      opponent: opponentParam,
      problemsSolved: solvedProblemSlugs.size,
      totalProblems: matchProblems.length
    });
  }, [isChallenge, matchResult, isRated, userModeRating, token, mode, timeControlParam, problem, activeSlug, opponentParam, solvedProblemSlugs.size, matchProblems.length, refreshUser]);

  const handleTimeExpiredRef = useRef(handleTimeExpired);
  useEffect(() => {
    handleTimeExpiredRef.current = handleTimeExpired;
  }, [handleTimeExpired]);

  // If match was already expired on page load, trigger timeout immediately
  useEffect(() => {
    if (initialBattleSessionRef.current?.isExpired && isChallenge && !matchResult) {
      if (handleTimeExpiredRef.current) {
        handleTimeExpiredRef.current();
      }
    }
  }, [isChallenge, matchResult]);

  // Match countdown timer (only for challenge / 1v1 battle / contest)
  // Driven strictly by wall-clock real time (session.endTime - Date.now()) to maintain exact time across page refreshes
  useEffect(() => {
    if (!isChallenge || !timerActive) return;

    const checkRealTime = () => {
      try {
        const stored = localStorage.getItem('dsa_active_battle_session');
        if (stored) {
          const session = JSON.parse(stored);
          if (session && session.endTime) {
            const diffMs = session.endTime - Date.now();
            const remaining = Math.max(0, Math.ceil(diffMs / 1000));
            setTimeLeft(remaining);
            timeLeftRef.current = remaining;

            if (remaining <= 0) {
              setTimerActive(false);
              if (handleTimeExpiredRef.current) {
                handleTimeExpiredRef.current();
              }
              return;
            }
            return;
          }
        }
      } catch (err) {
        console.warn('Real-time timer check warning:', err);
      }

      // Fallback in case storage is unavailable
      setTimeLeft(prev => {
        const nextVal = prev <= 1 ? 0 : prev - 1;
        timeLeftRef.current = nextVal;
        if (nextVal <= 0) {
          setTimerActive(false);
          if (handleTimeExpiredRef.current) {
            handleTimeExpiredRef.current();
          }
        }
        return nextVal;
      });
    };

    // Run initial check
    checkRealTime();

    // Check every 500ms to stay synchronous with wall clock without drift
    const interval = setInterval(checkRealTime, 500);

    return () => clearInterval(interval);
  }, [isChallenge, timerActive]);

  const formatTimer = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // ==========================================
  // NORMAL PRACTICE MODE: Practice Timer & Stopwatch
  // ==========================================
  const formatPracticeTime = (totalSecs) => {
    const s = Math.max(0, Math.floor(totalSecs || 0));
    const hrs = Math.floor(s / 3600);
    const mins = Math.floor((s % 3600) / 60);
    const secs = s % 60;
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatLeetCodeTimer = (totalSecs) => {
    const s = Math.max(0, Math.floor(totalSecs || 0));
    const hrs = Math.floor(s / 3600);
    const mins = Math.floor((s % 3600) / 60);
    const secs = s % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const [isTimerCollapsed, setIsTimerCollapsed] = useState(() => {
    try {
      return localStorage.getItem('dsa_timer_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const [isPracticeTimerVisible, setIsPracticeTimerVisible] = useState(() => {
    try {
      const saved = localStorage.getItem('dsa_practice_timer_visible');
      return saved !== null ? saved === 'true' : true;
    } catch {
      return true;
    }
  });

  const [practiceSeconds, setPracticeSeconds] = useState(0);
  const [isPracticeTimerRunning, setIsPracticeTimerRunning] = useState(true);
  const [isPracticeSolved, setIsPracticeSolved] = useState(false);
  const [practiceSolveTime, setPracticeSolveTime] = useState(null);

  // Initialize or restore practice timer when problem slug changes
  useEffect(() => {
    if (isChallenge) return;

    try {
      const savedState = sessionStorage.getItem(`dsa_practice_timer_${activeSlug}`);
      if (savedState) {
        const parsed = JSON.parse(savedState);
        let elapsed = parsed.elapsed || 0;
        if (parsed.isRunning && !parsed.isSolved && parsed.lastTimestamp) {
          const diff = Math.floor((Date.now() - parsed.lastTimestamp) / 1000);
          if (diff > 0 && diff < 86400) {
            elapsed += diff;
          }
        }
        setPracticeSeconds(elapsed);
        setIsPracticeTimerRunning(Boolean(parsed.isRunning && !parsed.isSolved));
        setIsPracticeSolved(Boolean(parsed.isSolved));
        setPracticeSolveTime(parsed.solveTime || null);
        return;
      }
    } catch (e) {}

    // Fresh start for practice timer
    setPracticeSeconds(0);
    setIsPracticeTimerRunning(true);
    setIsPracticeSolved(false);
    setPracticeSolveTime(null);
  }, [activeSlug, isChallenge]);

  // Practice timer interval: ticks every 1000ms while running and not solved
  useEffect(() => {
    if (isChallenge || !isPracticeTimerRunning || isPracticeSolved) return;

    const interval = setInterval(() => {
      setPracticeSeconds(prev => {
        const next = prev + 1;
        try {
          sessionStorage.setItem(
            `dsa_practice_timer_${activeSlug}`,
            JSON.stringify({
              elapsed: next,
              isRunning: true,
              lastTimestamp: Date.now(),
              isSolved: false,
              solveTime: null
            })
          );
        } catch (e) {}
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isChallenge, isPracticeTimerRunning, isPracticeSolved, activeSlug]);

  const togglePracticeTimer = () => {
    setIsPracticeTimerRunning(prev => {
      const next = !prev;
      try {
        sessionStorage.setItem(
          `dsa_practice_timer_${activeSlug}`,
          JSON.stringify({
            elapsed: practiceSeconds,
            isRunning: next,
            lastTimestamp: Date.now(),
            isSolved: isPracticeSolved,
            solveTime: practiceSolveTime
          })
        );
      } catch (e) {}
      return next;
    });
  };

  const resetPracticeTimer = () => {
    setPracticeSeconds(0);
    setIsPracticeTimerRunning(true);
    setIsPracticeSolved(false);
    setPracticeSolveTime(null);
    try {
      sessionStorage.setItem(
        `dsa_practice_timer_${activeSlug}`,
        JSON.stringify({
          elapsed: 0,
          isRunning: true,
          lastTimestamp: Date.now(),
          isSolved: false,
          solveTime: null
        })
      );
    } catch (e) {}
  };

  const togglePracticeTimerVisibility = () => {
    setIsPracticeTimerVisible(prev => {
      const next = !prev;
      try {
        localStorage.setItem('dsa_practice_timer_visible', String(next));
      } catch (e) {}
      return next;
    });
  };

  // Active Battle Lock & Resignation System
  const [showResignModal, setShowResignModal] = useState(false);
  const [pendingNavigationPath, setPendingNavigationPath] = useState('/');
  const [isResigning, setIsResigning] = useState(false);
  const isBattleRunningRef = useRef(false);

  // A battle is running if isChallenge is active, timer is active, and match is not yet finished
  const isBattleRunning = Boolean(isChallenge && !matchResult && timerActive && timeLeft > 0);

  useEffect(() => {
    isBattleRunningRef.current = isBattleRunning;

    if (!isBattleRunning) {
      window.__DSA_ACTIVE_BATTLE__ = null;
      return;
    }

    // Register active battle guard for website navigation
    window.__DSA_ACTIVE_BATTLE__ = {
      isRunning: true,
      promptResign: (targetPath) => {
        setPendingNavigationPath(targetPath || '/');
        setShowResignModal(true);
      }
    };

    // Push state into browser history to trap the Back button
    window.history.pushState({ inDsaBattle: true }, document.title, window.location.href);

    const handlePopState = () => {
      if (isBattleRunningRef.current) {
        // Prevent going back by pushing state again
        window.history.pushState({ inDsaBattle: true }, document.title, window.location.href);
        // Show resign confirmation popup
        setPendingNavigationPath('/');
        setShowResignModal(true);
      }
    };

    const handleBeforeUnload = (e) => {
      if (isBattleRunningRef.current) {
        e.preventDefault();
        e.returnValue = 'You have a competitive battle in progress. Leaving will count as a resignation!';
        return e.returnValue;
      }
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.__DSA_ACTIVE_BATTLE__ = null;
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isBattleRunning]);

  const handlePromptResign = (targetPath = '/') => {
    setPendingNavigationPath(targetPath);
    setShowResignModal(true);
  };

  const handleConfirmResign = async () => {
    if (isResigning) return;
    setIsResigning(true);

    try {
      const activeToken = localStorage.getItem('token') || token;

      if (activeToken) {
        try {
          await axios.post(
            'http://localhost:5000/api/battles/resign',
            {
              mode,
              timeControl: timeControlParam,
              problemTitle: problem?.title || activeSlug,
              opponentName: opponentParam,
              isRated
            },
            { headers: { Authorization: `Bearer ${activeToken}` } }
          );
        } catch (apiErr) {
          console.warn('API battle resign warning:', apiErr.message);
        }
      }

      playWrongAnswerSound();

      // Clean up battle storage and guards
      clearBattleSession();
      isBattleRunningRef.current = false;
      if (window.__DSA_ACTIVE_BATTLE__) {
        window.__DSA_ACTIVE_BATTLE__.isRunning = false;
        window.__DSA_ACTIVE_BATTLE__ = null;
      }

      // Stop match timer
      setTimerActive(false);

      // Instant refresh of user profile in context so header and ratings update everywhere
      if (refreshUser) {
        await refreshUser();
      }

      setShowResignModal(false);
      setIsResigning(false);

      const target = pendingNavigationPath || '/';
      navigate(target, { replace: true });
    } catch (err) {
      console.error('Error during resignation:', err);
      isBattleRunningRef.current = false;
      if (window.__DSA_ACTIVE_BATTLE__) {
        window.__DSA_ACTIVE_BATTLE__.isRunning = false;
        window.__DSA_ACTIVE_BATTLE__ = null;
      }
      setShowResignModal(false);
      setIsResigning(false);
      navigate(pendingNavigationPath || '/', { replace: true });
    }
  };

  const getDifficultyBadge = (difficulty) => {
    switch (difficulty?.toLowerCase()) {
      case 'easy':
        return 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30';
      case 'medium':
        return 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/30';
      case 'hard':
        return 'bg-danger/15 text-danger border border-danger/30';
      default:
        return 'bg-[#2b2926] text-[#8c8b88] border border-white/10';
    }
  };

  const PROBLEM_DICTIONARY = {
    'two-sum': {
      id: 1,
      title: 'Two Sum',
      difficulty: 'Easy',
      points: 3,
      tags: ['Array', 'Hash Table'],
      description: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.\n\nYou can return the answer in any order.',
      examples: [
        {
          input: 'nums = [2,7,11,15], target = 9',
          output: '[0,1]',
          explanation: 'Because nums[0] + nums[1] == 9, we return [0, 1].'
        },
        {
          input: 'nums = [3,2,4], target = 6',
          output: '[1,2]',
          explanation: 'Because nums[1] + nums[2] == 6, we return [1, 2].'
        },
        {
          input: 'nums = [3,3], target = 6',
          output: '[0,1]'
        }
      ],
      constraints: [
        '2 <= nums.length <= 10⁴',
        '-10⁹ <= nums[i] <= 10⁹',
        '-10⁹ <= target <= 10⁹',
        'Only one valid answer exists.'
      ],
      followUp: 'Can you come up with an algorithm that is less than O(n²) time complexity?'
    },
    'valid-parentheses': {
      id: 20,
      title: 'Valid Parentheses',
      difficulty: 'Easy',
      points: 2,
      tags: ['String', 'Stack'],
      description: 'Given a string s containing just the characters "(", ")", "{", "}", "[" and "]", determine if the input string is valid.\n\nAn input string is valid if:\n1. Open brackets must be closed by the same type of brackets.\n2. Open brackets must be closed in the correct order.\n3. Every close bracket has a corresponding open bracket of the same type.',
      examples: [
        { input: 's = "()"', output: 'true' },
        { input: 's = "()[]{}"', output: 'true' },
        { input: 's = "(]"', output: 'false', explanation: 'The open bracket does not match the closing bracket.' }
      ],
      constraints: [
        '1 <= s.length <= 10⁴',
        's consists of parentheses only \'()[]{}\'.'
      ]
    },
    'best-time-to-buy-and-sell-stock': {
      id: 121,
      title: 'Best Time to Buy and Sell Stock',
      difficulty: 'Easy',
      points: 3,
      tags: ['Array', 'Dynamic Programming'],
      description: 'You are given an array prices where prices[i] is the price of a given stock on the ith day.\n\nYou want to maximize your profit by choosing a single day to buy one stock and choosing a different day in the future to sell that stock.\n\nReturn the maximum profit you can achieve from this transaction. If you cannot achieve any profit, return 0.',
      examples: [
        {
          input: 'prices = [7,1,5,3,6,4]',
          output: '5',
          explanation: 'Buy on day 2 (price = 1) and sell on day 5 (price = 6), profit = 6 - 1 = 5. Note that buying on day 2 and selling on day 1 is not allowed because you must buy before you sell.'
        },
        {
          input: 'prices = [7,6,4,3,1]',
          output: '0',
          explanation: 'In this case, no transactions are done and the max profit = 0.'
        }
      ],
      constraints: [
        '1 <= prices.length <= 10⁵',
        '0 <= prices[i] <= 10⁴'
      ]
    },
    'lru-cache': {
      id: 146,
      title: 'LRU Cache',
      difficulty: 'Medium',
      points: 5,
      tags: ['Hash Table', 'Linked List', 'Design', 'Doubly-Linked List'],
      description: 'Design a data structure that follows the constraints of a Least Recently Used (LRU) cache.\n\nImplement the LRUCache class:\n• LRUCache(int capacity) Initialize the LRU cache with positive size capacity.\n• int get(int key) Return the value of the key if the key exists, otherwise return -1.\n• void put(int key, int value) Update the value of the key if the key exists. Otherwise, add the key-value pair to the cache. If the number of keys exceeds the capacity from this operation, evict the least recently used key.\n\nThe functions get and put must each run in O(1) average time complexity.',
      examples: [
        {
          input: '["LRUCache", "put", "put", "get", "put", "get", "put", "get", "get", "get"]\n[[2], [1, 1], [2, 2], [1], [3, 3], [2], [4, 4], [1], [3], [4]]',
          output: '[null, null, null, 1, null, -1, null, -1, 3, 4]',
          explanation: 'LRUCache lRUCache = new LRUCache(2);\nlRUCache.put(1, 1); // cache is {1=1}\nlRUCache.put(2, 2); // cache is {1=1, 2=2}\nlRUCache.get(1);    // return 1\nlRUCache.put(3, 3); // LRU key was 2, evicts key 2, cache is {1=1, 3=3}\nlRUCache.get(2);    // returns -1 (not found)\nlRUCache.put(4, 4); // LRU key was 1, evicts key 1, cache is {4=4, 3=3}\nlRUCache.get(1);    // return -1 (not found)\nlRUCache.get(3);    // return 3\nlRUCache.get(4);    // return 4'
        }
      ],
      constraints: [
        '1 <= capacity <= 3000',
        '0 <= key <= 10⁴',
        '0 <= value <= 10⁵',
        'At most 2 * 10⁵ calls will be made to get and put.'
      ],
      followUp: 'Could you design and implement each operation in O(1) time complexity?'
    },
    '3sum': {
      id: 15,
      title: '3Sum',
      difficulty: 'Medium',
      points: 5,
      tags: ['Array', 'Two Pointers', 'Sorting'],
      description: 'Given an integer array nums, return all the triplets [nums[i], nums[j], nums[k]] such that i != j, i != k, and j != k, and nums[i] + nums[j] + nums[k] == 0.\n\nNotice that the solution set must not contain duplicate triplets.',
      examples: [
        {
          input: 'nums = [-1,0,1,2,-1,-4]',
          output: '[[-1,-1,2],[-1,0,1]]',
          explanation: 'nums[0] + nums[1] + nums[2] = (-1) + 0 + 1 = 0.\nnums[1] + nums[2] + nums[4] = 0 + 1 + (-1) = 0.\nnums[0] + nums[3] + nums[4] = (-1) + 2 + (-1) = 0.\nThe distinct triplets are [-1,0,1] and [-1,-1,2].'
        },
        {
          input: 'nums = [0,1,1]',
          output: '[]',
          explanation: 'The only possible triplet does not sum up to 0.'
        },
        {
          input: 'nums = [0,0,0]',
          output: '[[0,0,0]]',
          explanation: 'The only possible triplet sums up to 0.'
        }
      ],
      constraints: [
        '3 <= nums.length <= 3000',
        '-10⁵ <= nums[i] <= 10⁵'
      ]
    },
    'longest-substring-without-repeating-characters': {
      id: 3,
      title: 'Longest Substring Without Repeating Characters',
      difficulty: 'Medium',
      points: 5,
      tags: ['Hash Table', 'String', 'Sliding Window'],
      description: 'Given a string s, find the length of the longest substring without repeating characters.',
      examples: [
        {
          input: 's = "abcabcbb"',
          output: '3',
          explanation: 'The answer is "abc", with the length of 3.'
        },
        {
          input: 's = "bbbbb"',
          output: '1',
          explanation: 'The answer is "b", with the length of 1.'
        },
        {
          input: 's = "pwwkew"',
          output: '3',
          explanation: 'The answer is "wke", with the length of 3. Notice that the answer must be a substring, "pwke" is a subsequence and not a substring.'
        }
      ],
      constraints: [
        '0 <= s.length <= 5 * 10⁴',
        's consists of English letters, digits, symbols and spaces.'
      ]
    },
    'trapping-rain-water': {
      id: 42,
      title: 'Trapping Rain Water',
      difficulty: 'Hard',
      points: 8,
      tags: ['Array', 'Two Pointers', 'Dynamic Programming', 'Stack'],
      description: 'Given n non-negative integers representing an elevation map where the width of each bar is 1, compute how much water it can trap after raining.',
      examples: [
        {
          input: 'height = [0,1,0,2,1,0,1,3,2,1,2,1]',
          output: '6',
          explanation: 'The elevation map is represented by array [0,1,0,2,1,0,1,3,2,1,2,1]. In this case, 6 units of rain water are being trapped.'
        },
        {
          input: 'height = [4,2,0,3,2,5]',
          output: '9'
        }
      ],
      constraints: [
        'n == height.length',
        '1 <= n <= 2 * 10⁴',
        '0 <= height[i] <= 10⁵'
      ]
    },
    'merge-k-sorted-lists': {
      id: 23,
      title: 'Merge k Sorted Lists',
      difficulty: 'Hard',
      points: 9,
      tags: ['Linked List', 'Divide and Conquer', 'Heap', 'Merge Sort'],
      description: 'You are given an array of k linked-lists lists, each linked-list is sorted in ascending order.\n\nMerge all the linked-lists into one sorted linked-list and return it.',
      examples: [
        {
          input: 'lists = [[1,4,5],[1,3,4],[2,6]]',
          output: '[1,1,2,3,4,4,5,6]',
          explanation: 'The linked-lists are:\n[\n  1->4->5,\n  1->3->4,\n  2->6\n]\nmerging them into one sorted list:\n1->1->2->3->4->4->5->6'
        },
        {
          input: 'lists = []',
          output: '[]'
        }
      ],
      constraints: [
        'k == lists.length',
        '0 <= k <= 10⁴',
        '0 <= lists[i].length <= 500',
        '-10⁴ <= lists[i][j] <= 10⁴',
        'lists[i] is sorted in ascending order.',
        'The sum of lists[i].length will not exceed 10⁴.'
      ]
    },
    'median-of-two-sorted-arrays': {
      id: 4,
      title: 'Median of Two Sorted Arrays',
      difficulty: 'Hard',
      points: 10,
      tags: ['Array', 'Binary Search', 'Divide and Conquer'],
      description: 'Given two sorted arrays nums1 and nums2 of size m and n respectively, return the median of the two sorted arrays.\n\nThe overall run time complexity should be O(log (m+n)).',
      examples: [
        {
          input: 'nums1 = [1,3], nums2 = [2]',
          output: '2.00000',
          explanation: 'merged array = [1,2,3] and median is 2.'
        },
        {
          input: 'nums1 = [1,2], nums2 = [3,4]',
          output: '2.50000',
          explanation: 'merged array = [1,2,3,4] and median is (2 + 3) / 2 = 2.5.'
        }
      ],
      constraints: [
        'nums1.length == m',
        'nums2.length == n',
        '0 <= m <= 1000',
        '0 <= n <= 1000',
        '1 <= m + n <= 2000',
        '-10⁶ <= nums1[i], nums2[i] <= 10⁶'
      ],
      followUp: 'The overall run time complexity should be O(log (m+n)).'
    }
  };

  const getProblemMeta = (slugKey) => {
    if (slugKey === activeSlug && problem) {
      return {
        title: problem.title || slugKey,
        difficulty: problem.difficulty || 'Medium',
        points: problem.points || 3
      };
    }
    const dict = PROBLEM_DICTIONARY ? PROBLEM_DICTIONARY[slugKey] : null;
    if (dict) {
      return {
        title: dict.title || slugKey,
        difficulty: dict.difficulty || 'Medium',
        points: dict.points || 3
      };
    }
    return {
      title: slugKey ? slugKey.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : 'Problem',
      difficulty: 'Medium',
      points: 3
    };
  };

  const currentProbIndex = Math.max(0, matchProblems.indexOf(activeSlug));
  const hasPrevProb = currentProbIndex > 0;
  const hasNextProb = currentProbIndex < matchProblems.length - 1;

  const goToPrevProblem = () => {
    if (hasPrevProb) {
      switchMatchProblem(matchProblems[currentProbIndex - 1]);
    }
  };

  const goToNextProblem = () => {
    if (hasNextProb) {
      switchMatchProblem(matchProblems[currentProbIndex + 1]);
    }
  };

  // Fetch problem and initialize language template & testcases
  useEffect(() => {
    const fetchProblem = async () => {
      let currentProb = null;
      try {
        const res = await axios.get(`http://localhost:5000/api/problems/${activeSlug}`);
        if (res.data) {
          currentProb = res.data;
        }
      } catch (err) {
        // Fallback to local dictionary
      }

      const dictProb = PROBLEM_DICTIONARY[activeSlug];
      if (dictProb) {
        if (currentProb) {
          currentProb = {
            ...dictProb,
            ...currentProb,
            id: currentProb.id || dictProb.id,
            tags: (currentProb.tags && currentProb.tags.length > 0) ? currentProb.tags : dictProb.tags,
            constraints: (currentProb.constraints && Array.isArray(currentProb.constraints) && currentProb.constraints.length > 0)
              ? currentProb.constraints
              : (typeof currentProb.constraints === 'string' && currentProb.constraints.trim().length > 0)
                ? [currentProb.constraints]
                : dictProb.constraints,
            followUp: currentProb.followUp || dictProb.followUp,
            examples: (dictProb.examples && dictProb.examples.length > 0) ? dictProb.examples : currentProb.examples
          };
        } else {
          currentProb = dictProb;
        }
      } else if (!currentProb) {
        currentProb = {
          id: 1,
          title: activeSlug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
          difficulty: 'Medium',
          points: 5,
          description: 'Problem description for ' + activeSlug + '.',
          tags: ['Algorithms', 'Data Structures'],
          constraints: ['1 <= n <= 10⁵', 'Time complexity requirement: O(n) or O(n log n)'],
          examples: [{ input: 'example_input', output: 'example_output', explanation: 'Standard test case evaluation.' }]
        };
      }

      setProblem(currentProb);

      // Initialize editor code
      if (isChallenge) {
        // IN CHALLENGE / 1V1 BATTLE / CONTEST:
        // Check in-memory ref cache or sessionStorage draft before falling back to boilerplate
        const cachedCode = codeCacheByProblemLangRef.current[`${activeSlug}_${language}`] ||
          sessionStorage.getItem(`dsa_battle_code_${activeSlug}_${language}`);
        if (cachedCode) {
          setCode(cachedCode);
          setCodeByLanguage({ [language]: cachedCode });
        } else {
          const template = getBoilerplateTemplate(activeSlug, currentProb.title, language, currentProb);
          setCode(template);
          setCodeByLanguage({ [language]: template });
        }
      } else {
        // IN NORMAL PRACTICE / TRAINING GROUND:
        // Try to load user's last written auto-saved code from the database for this problem and language!
        let loaded = false;
        const authToken = localStorage.getItem('token');
        if (authToken) {
          try {
            const draftRes = await axios.get(
              `http://localhost:5000/api/problems/${activeSlug}/draft?lang=${language}`,
              { headers: { Authorization: `Bearer ${authToken}` } }
            );
            if (draftRes.data?.exists && draftRes.data?.code) {
              setCode(draftRes.data.code);
              setCodeByLanguage({ [language]: draftRes.data.code });
              setSaveStatus('saved');
              loaded = true;
            }
          } catch (e) {
            console.warn('Could not load practice draft code:', e.message);
          }
        }

        if (!loaded) {
          const template = getBoilerplateTemplate(activeSlug, currentProb.title, language, currentProb);
          setCode(template);
          setCodeByLanguage({ [language]: template });
          setSaveStatus('idle');
        }
      }

      // Initialize LeetCode-style testcases
      const initialCases = (currentProb.examples && currentProb.examples.length > 0)
        ? currentProb.examples.map((ex, i) => ({
            id: i + 1,
            name: `Case ${i + 1}`,
            input: ex.input,
            expected: ex.output,
            output: ex.output,
            isCustom: false
          }))
        : [
            {
              id: 1,
              name: 'Case 1',
              input: 'nums = [2,7,11,15], target = 9',
              expected: '[0,1]',
              output: '[0,1]',
              isCustom: false
            }
          ];

      setTestcases(initialCases);
      setSelectedCaseIdx(0);
      setRunResults(null);
    };

    fetchProblem();
  }, [activeSlug, isChallenge]);

  // Handle LeetCode-style language switching
  const handleLanguageChange = async (newLang) => {
    // 1. Preserve edits in current language
    setCodeByLanguage(prev => ({
      ...prev,
      [language]: code
    }));
    codeCacheByProblemLangRef.current[`${activeSlug}_${language}`] = code;

    // 2. Set new active language
    setLanguage(newLang);
    localStorage.setItem('dsa_preferred_lang', newLang);

    if (isChallenge) {
      // In battle/challenge: check local cache, sessionStorage draft, or fresh boilerplate
      const cached = codeCacheByProblemLangRef.current[`${activeSlug}_${newLang}`] ||
        sessionStorage.getItem(`dsa_battle_code_${activeSlug}_${newLang}`);
      if (cached) {
        setCode(cached);
      } else {
        const freshTemplate = getBoilerplateTemplate(activeSlug, problem?.title, newLang, problem);
        setCode(freshTemplate);
      }
    } else {
      // In normal practice: check state cache first, or fetch from backend draft
      if (codeByLanguage[newLang] !== undefined) {
        setCode(codeByLanguage[newLang]);
      } else {
        let loaded = false;
        const authToken = localStorage.getItem('token');
        if (authToken) {
          try {
            const draftRes = await axios.get(
              `http://localhost:5000/api/problems/${activeSlug}/draft?lang=${newLang}`,
              { headers: { Authorization: `Bearer ${authToken}` } }
            );
            if (draftRes.data?.exists && draftRes.data?.code) {
              setCode(draftRes.data.code);
              setCodeByLanguage(prev => ({ ...prev, [newLang]: draftRes.data.code }));
              setSaveStatus('saved');
              loaded = true;
            }
          } catch (e) {}
        }

        if (!loaded) {
          const freshTemplate = getBoilerplateTemplate(activeSlug, problem?.title, newLang, problem);
          setCode(freshTemplate);
          setSaveStatus('idle');
        }
      }
    }
  };

  // Reset current language template back to default
  const handleResetCode = () => {
    const defaultTemplate = getBoilerplateTemplate(activeSlug, problem?.title, language, problem);
    setCode(defaultTemplate);
    setCodeByLanguage(prev => ({
      ...prev,
      [language]: defaultTemplate
    }));
    codeCacheByProblemLangRef.current[`${activeSlug}_${language}`] = defaultTemplate;
    try {
      sessionStorage.removeItem(`dsa_battle_code_${activeSlug}_${language}`);
    } catch {}
    if (!isChallenge) {
      const authToken = localStorage.getItem('token');
      if (authToken) {
        axios.post(
          `http://localhost:5000/api/problems/${activeSlug}/draft`,
          {
            language,
            code: defaultTemplate,
            problemTitle: problem?.title,
            problemDifficulty: problem?.difficulty,
            tags: problem?.tags
          },
          { headers: { Authorization: `Bearer ${authToken}` } }
        ).catch(() => {});
      }
    }
  };

  // Add custom user testcase
  const handleAddTestcase = () => {
    const nextIdx = testcases.length + 1;
    const templateInput = testcases[0] ? testcases[0].input : 'input = 0';
    const newCase = {
      id: Date.now(),
      name: `Case ${nextIdx}`,
      input: templateInput,
      expected: 'Output evaluated on run',
      output: '',
      isCustom: true
    };
    setTestcases(prev => [...prev, newCase]);
    setSelectedCaseIdx(testcases.length);
    setActiveBottomTab('testcase');
  };

  // Delete custom testcase
  const handleDeleteTestcase = (e, indexToDelete) => {
    e.stopPropagation();
    if (testcases.length <= 1) return;
    const filtered = testcases.filter((_, idx) => idx !== indexToDelete);
    setTestcases(filtered);
    if (selectedCaseIdx >= filtered.length) {
      setSelectedCaseIdx(filtered.length - 1);
    }
  };

  // Edit testcase input parameter
  const handleTestcaseInputChange = (val) => {
    setTestcases(prev => prev.map((tc, idx) => {
      if (idx === selectedCaseIdx) {
        return { ...tc, input: val };
      }
      return tc;
    }));
  };

  // Run code on testcases & display real LeetCode results
  const handleRun = async () => {
    setIsRunning(true);
    setActiveBottomTab('result');

    try {
      const res = await axios.post('http://localhost:5000/api/judge/run', {
        language,
        code,
        slug: activeSlug,
        testcases
      });

      if (res.data) {
        setRunResults(res.data);
        const passedCount = res.data.cases?.filter(c => c.passed).length || 0;
        if (socketRef.current) {
          socketRef.current.emit('battle:test_update', {
            battleId: battleIdRef.current,
            testsPassed: passedCount,
            testsTotal: res.data.cases?.length || 3
          });
        }
        const firstFail = res.data.cases?.findIndex(c => !c.passed);
        if (firstFail !== undefined && firstFail !== -1) {
          setSelectedCaseIdx(firstFail);
          playWrongAnswerSound();
          setShakeScreen(true);
          setTimeout(() => setShakeScreen(false), 600);
          setToastReaction({
            type: 'error',
            message: `${res.data.status}: Testcase ${firstFail + 1} Failed`
          });
          setTimeout(() => setToastReaction(null), 3500);
        } else {
          setToastReaction({
            type: 'success',
            message: '✓ All sample test cases passed!'
          });
          setTimeout(() => setToastReaction(null), 3000);
        }
      }
    } catch (err) {
      console.error('Judge run error:', err);
      playWrongAnswerSound();
      setShakeScreen(true);
      setTimeout(() => setShakeScreen(false), 600);
      setRunResults({
        status: 'Runtime Error',
        runtime: '0 ms',
        memory: '0 MB',
        errorMessage: err.response?.data?.errorMessage || err.message,
        cases: testcases.map((tc, idx) => ({
          id: tc.id || idx + 1,
          name: tc.name || `Case ${idx + 1}`,
          input: tc.input,
          output: '',
          expected: tc.expected,
          passed: false,
          error: err.message
        }))
      });
    } finally {
      setIsRunning(false);
    }
  };

  const handleSubmit = async () => {
    setIsRunning(true);
    setActiveBottomTab('result');

    const activeToken = token || localStorage.getItem('token');

    // Ensure the submitted code is saved to user's account so they can resume it in Normal Practice
    if (activeToken) {
      axios.post(
        `http://localhost:5000/api/problems/${activeSlug}/draft`,
        {
          language,
          code,
          problemTitle: problem?.title,
          problemDifficulty: problem?.difficulty,
          tags: problem?.tags
        },
        { headers: { Authorization: `Bearer ${activeToken}` } }
      ).catch(() => {});
    }

    try {
      const res = await axios.post(
        'http://localhost:5000/api/judge/submit',
        {
          language,
          code,
          slug: activeSlug,
          mode,
          timeControl: timeControlParam,
          opponentName: opponentParam,
          opponentRating: opponentRatingParam,
          isRated
        },
        activeToken ? { headers: { Authorization: `Bearer ${activeToken}` } } : {}
      );

      if (res.data) {
        setRunResults(res.data);

        if (res.data.status === 'Accepted') {
          const nextSolved = new Set([...solvedProblemSlugs, activeSlug]);
          setSolvedProblemSlugs(nextSolved);

          // In normal practice mode: stop timer and record solve time
          if (!isChallenge) {
            setIsPracticeTimerRunning(false);
            setIsPracticeSolved(true);
            setPracticeSolveTime(practiceSeconds);
            const formattedSolveTime = formatPracticeTime(practiceSeconds);
            res.data.solveTimeFormatted = formattedSolveTime;
            try {
              sessionStorage.setItem(
                `dsa_practice_timer_${activeSlug}`,
                JSON.stringify({
                  elapsed: practiceSeconds,
                  isRunning: false,
                  lastTimestamp: Date.now(),
                  isSolved: true,
                  solveTime: practiceSeconds
                })
              );
            } catch (e) {}
            setToastReaction({
              type: 'success',
              message: `🎉 Accepted! You solved this in ${formattedSolveTime}!`
            });
            setTimeout(() => setToastReaction(null), 4500);
          }

          // Update tournament leaderboard score if this is a tournament match
          if (tournamentId && activeToken) {
            const totalTime = parseSeconds(timeControlParam);
            const elapsed = Math.max(1, totalTime - (timeLeftRef.current || 0));
            axios.post(
              `http://localhost:5000/api/tournaments/${tournamentId}/submit-score`,
              {
                problemsSolved: nextSolved.size,
                score: nextSolved.size * 100,
                timeTakenSeconds: elapsed
              },
              { headers: { Authorization: `Bearer ${activeToken}` } }
            ).catch(err => console.log('Tournament score update error:', err));
          }

          const isAllSolved = matchProblems.every(p => nextSolved.has(p));

          if (isAllSolved) {
            clearBattleSession();
            playVictorySound();
            setTimerActive(false);
            if (socketRef.current) {
              socketRef.current.emit('battle:test_update', {
                battleId: battleIdRef.current,
                testsPassed: res.data.cases?.length || 3,
                testsTotal: res.data.cases?.length || 3
              });
              socketRef.current.emit('battle:won', {
                battleId: battleIdRef.current,
                winnerUsername: activeUsername
              });
              socketRef.current.emit('battle:live_leave', { battleId: battleIdRef.current });
            }
            const isRatedResult = Boolean(res.data.isRated);
            const ratingChange = typeof res.data.ratingChange === 'number' ? res.data.ratingChange : (isRated ? 16 : 0);
            setMatchResult({
              status: activeToken ? 'win' : 'win_guest',
              newRating: res.data.newRating || (userModeRating + ratingChange),
              ratingChange,
              isRated: isRatedResult,
              streak: res.data.streak || 1,
              mode,
              opponent: opponentParam,
              problemsSolved: nextSolved.size,
              totalProblems: matchProblems.length
            });
            if (refreshUser) refreshUser();
          } else {
            // Multi-problem progress: 1 of N solved!
            playVictorySound();
            const nextUnsolved = matchProblems.find(p => !nextSolved.has(p));
            setProblemProgressModal({
              currentSlug: activeSlug,
              currentTitle: problem?.title || activeSlug,
              nextSlug: nextUnsolved,
              solvedCount: nextSolved.size,
              totalCount: matchProblems.length
            });
          }
        } else {
          // Play reaction sound & screen shake
          playWrongAnswerSound();
          setShakeScreen(true);
          setTimeout(() => setShakeScreen(false), 600);

          const firstFail = res.data.cases?.find(c => !c.passed);
          const firstFailIdx = res.data.cases?.findIndex(c => !c.passed);
          if (firstFailIdx !== undefined && firstFailIdx !== -1) {
            setSelectedCaseIdx(firstFailIdx);
          }

          // Open Wrong Answer Reaction Modal
          setWrongSubmissionReaction({
            status: res.data.status,
            failedCase: firstFail,
            passedCount: res.data.cases?.filter(c => c.passed).length || 0,
            totalCount: res.data.cases?.length || 0,
            errorMessage: res.data.errorMessage,
            runtime: res.data.runtime
          });
        }
      }
    } catch (err) {
      console.error('Submit error:', err);
      playWrongAnswerSound();
      setShakeScreen(true);
      setTimeout(() => setShakeScreen(false), 600);
      setWrongSubmissionReaction({
        status: 'Runtime Error',
        failedCase: null,
        passedCount: 0,
        totalCount: testcases.length,
        errorMessage: err.response?.data?.errorMessage || err.message,
        runtime: '0 ms'
      });
    } finally {
      setIsRunning(false);
    }
  };

  if (!problem) return (
    <div className="flex items-center justify-center min-h-[60vh] gap-3 text-white/60">
      <div className="w-8 h-8 border-2 border-[#81b64c]/20 border-t-[#81b64c] rounded-full animate-spin"></div>
      <span>Loading arena challenge...</span>
    </div>
  );

  return (
    <div className="flex flex-col h-full flex-1 min-h-0 bg-[#161512] text-[#e3e2de] overflow-hidden">
      
      {/* Top Arena or Practice Bar */}
      {isChallenge ? (
        <div className="bg-[#1e1d1a] border-b border-[#2d2a26] px-4 py-2.5 flex items-center justify-between gap-4 shrink-0 shadow-md">
          {/* Left: Problem, Mode & Rated/Unrated Badge */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => handlePromptResign('/')}
              className="text-white/60 hover:text-red-400 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer group"
              title="Resign this match and return to Arena"
            >
              <span className="group-hover:-translate-x-0.5 transition-transform font-bold">←</span>
              <span>Leave</span>
            </button>
            <span className="text-white/20">|</span>
            <span className="font-extrabold text-white text-sm truncate">{problem?.title || activeSlug}</span>
            <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${getDifficultyBadge(problem?.difficulty)}`}>
              {problem?.difficulty || 'Medium'}
            </span>
            <span className="bg-[#e66025]/15 text-[#e66025] border border-[#e66025]/30 text-[11px] font-bold px-2 py-0.5 rounded hidden sm:inline-block">
              ⚡ {mode} {timeControlParam}
            </span>
            {isRated ? (
              <span className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[11px] font-bold px-2 py-0.5 rounded flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>⚡ Rated Match</span>
              </span>
            ) : (
              <span className="bg-amber-500/15 text-amber-300 border border-amber-500/30 text-[11px] font-bold px-2 py-0.5 rounded flex items-center gap-1">
                <span>🛡️</span>
                <span className="hidden sm:inline">Non-Rated (Practice)</span>
                <span className="sm:hidden">Unrated</span>
              </span>
            )}
            <button
              type="button"
              onClick={() => handlePromptResign('/')}
              className="bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-400 hover:text-red-300 text-[11px] font-bold px-2.5 py-0.5 rounded-md transition cursor-pointer flex items-center gap-1 ml-1"
              title="Resign this match and forfeit"
            >
              <span>🏳️</span>
              <span className="hidden sm:inline">Resign</span>
            </button>
          </div>

          {/* Center: Match Countdown Timer */}
          <div className="flex items-center gap-2 bg-[#262421] border border-white/10 px-3.5 py-1 rounded-xl shadow-inner font-mono">
            <span className="text-yellow-400 text-sm">⏱️</span>
            <span className={`font-bold text-sm tracking-wider ${timeLeft < 30 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
              {formatTimer(timeLeft)}
            </span>
          </div>

          {/* Right: Opponent vs User Matchup */}
          <div className="flex items-center gap-3 text-xs">
            {/* Opponent */}
            <div className="flex items-center gap-1.5 text-white/80">
              <span className={`w-5 h-5 rounded-md text-[10px] font-bold text-white flex items-center justify-center ${isLikelyBot ? 'bg-[#363431]' : 'bg-indigo-600'}`}>
                {isLikelyBot ? '🤖' : opponentParam.charAt(0).toUpperCase()}
              </span>
              <span className="font-semibold text-white/90 truncate max-w-[90px]">{opponentParam}</span>
              {isLikelyBot && (
                <span className="text-[9px] font-mono bg-purple-500/20 text-purple-300 border border-purple-500/30 px-1 rounded uppercase font-bold">Bot</span>
              )}
              {opponentTestsPassed > 0 && (
                <span className="text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded animate-pulse">
                  {opponentTestsPassed} passed
                </span>
              )}
              <span className="text-yellow-400 font-mono font-bold">({opponentRatingParam})</span>
            </div>

            <span className="font-extrabold text-[#8c8b88] text-[10px] uppercase">VS</span>

            {/* Player */}
            <div className="flex items-center gap-1.5 text-white">
              <span className="w-5 h-5 rounded-md bg-[#81b64c] text-[10px] font-bold text-white flex items-center justify-center">
                {user?.username ? user.username.charAt(0).toUpperCase() : 'U'}
              </span>
              <span className="font-bold truncate max-w-[90px]">{user?.username || 'You'}</span>
              <span className="text-yellow-400 font-mono font-bold">({userModeRating})</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-[#1e1d1a] border-b border-[#2d2a26] px-4 py-2.5 flex items-center justify-between gap-4 shrink-0 shadow-md">
          {/* Left: Back to Training Ground, Problem, Difficulty & Practice Badge */}
          <div className="flex items-center gap-3">
            <Link to="/training" className="text-white/60 hover:text-white text-xs font-semibold flex items-center gap-1">
              <span>←</span>
              <span>Training Ground</span>
            </Link>
            <span className="text-white/20">|</span>
            <span className="font-extrabold text-white text-sm truncate">{problem?.title || activeSlug}</span>
            <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${getDifficultyBadge(problem?.difficulty)}`}>
              {problem?.difficulty || 'Medium'}
            </span>
            <span className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[11px] font-bold px-2 py-0.5 rounded flex items-center gap-1.5">
              <span>🧠</span>
              <span>Normal Practice</span>
            </span>
          </div>

          {/* Right: Points + User */}
          <div className="flex items-center gap-3 text-xs">
            <span className="text-emerald-400 font-mono font-bold">+{problem?.points || 3} pts</span>
            <div className="flex items-center gap-1.5 text-white">
              <span className="w-5 h-5 rounded-md bg-[#81b64c] text-[10px] font-bold text-white flex items-center justify-center">
                {user?.username ? user.username.charAt(0).toUpperCase() : 'U'}
              </span>
              <span className="font-bold truncate max-w-[100px]">{user?.username || 'You'}</span>
            </div>
          </div>
        </div>
      )}

      {/* MULTI-PROBLEM SWITCHER BAR (LeetCode Format with Dropdown & Arrow Option to go to Next Problem) */}
      {isChallenge && matchProblems.length > 1 && (
        <div className="bg-[#181714] border-b border-[#2d2a26] px-4 py-2 flex items-center justify-between gap-3 text-xs shrink-0 shadow-inner">
          {/* Left: Arrow options & LeetCode-style Dropdown */}
          <div className="flex items-center gap-2 relative" ref={problemDropdownRef}>
            <span className="text-[#8c8b88] font-bold shrink-0 text-[11px] uppercase tracking-wider hidden sm:inline">
              Problems:
            </span>

            {/* Prev Problem Arrow Button */}
            <button
              type="button"
              onClick={goToPrevProblem}
              disabled={!hasPrevProb}
              title={hasPrevProb ? `Go to Previous: ${getProblemMeta(matchProblems[currentProbIndex - 1]).title}` : 'First problem'}
              className="h-8 px-2.5 rounded-lg bg-[#252320] hover:bg-[#322f2b] active:bg-[#1a1917] border border-white/10 text-white flex items-center gap-1 transition cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed group"
            >
              <span className="text-sm font-bold group-hover:-translate-x-0.5 transition-transform">‹</span>
              <span className="text-[11px] font-bold hidden md:inline">Prev</span>
            </button>

            {/* LeetCode Dropdown Trigger Button */}
            <button
              type="button"
              onClick={() => setShowProblemDropdown(prev => !prev)}
              className={`bg-[#252320] hover:bg-[#2e2c28] border px-3 py-1.5 rounded-xl font-bold text-white flex items-center gap-2.5 transition cursor-pointer shadow-sm ${
                showProblemDropdown ? 'border-[#81b64c] bg-[#2a2824]' : 'border-white/15'
              }`}
            >
              <span className="w-5 h-5 rounded-md bg-[#81b64c] text-white flex items-center justify-center text-[10px] font-mono font-black">
                Q{currentProbIndex + 1}
              </span>

              <span className="font-extrabold text-white text-xs truncate max-w-[160px] sm:max-w-[240px]">
                {getProblemMeta(activeSlug).title}
              </span>

              <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getDifficultyBadge(getProblemMeta(activeSlug).difficulty)}`}>
                {getProblemMeta(activeSlug).difficulty}
              </span>

              {solvedProblemSlugs.has(activeSlug) ? (
                <span className="text-emerald-400 font-extrabold text-xs flex items-center gap-1">
                  <span>✓</span>
                  <span className="text-[10px] hidden sm:inline">Solved</span>
                </span>
              ) : (
                <span className="text-white/50 text-[10px] font-mono">
                  +{getProblemMeta(activeSlug).points}p
                </span>
              )}

              <span className={`text-white/40 text-xs transition-transform duration-200 ${showProblemDropdown ? 'rotate-180 text-white' : ''}`}>
                ▾
              </span>
            </button>

            {/* Next Problem Arrow Button */}
            <button
              type="button"
              onClick={goToNextProblem}
              disabled={!hasNextProb}
              title={hasNextProb ? `Go to Next: ${getProblemMeta(matchProblems[currentProbIndex + 1]).title}` : 'Last problem'}
              className="h-8 px-2.5 rounded-lg bg-[#252320] hover:bg-[#322f2b] active:bg-[#1a1917] border border-white/10 text-white flex items-center gap-1 transition cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed group"
            >
              <span className="text-[11px] font-bold hidden md:inline">Next</span>
              <span className="text-sm font-bold group-hover:translate-x-0.5 transition-transform">›</span>
            </button>

            {/* Quick Next Problem Pill */}
            {hasNextProb && (
              <button
                type="button"
                onClick={goToNextProblem}
                className="hidden lg:flex items-center gap-1.5 text-xs text-[#81b64c] hover:text-[#92c55b] bg-[#81b64c]/10 hover:bg-[#81b64c]/20 border border-[#81b64c]/30 px-3 py-1 rounded-lg transition font-bold cursor-pointer"
              >
                <span>Go to Problem {currentProbIndex + 2}</span>
                <span>→</span>
              </button>
            )}

            {/* LEETCODE DROPDOWN MENU */}
            {showProblemDropdown && (
              <div className="absolute top-full left-0 mt-2 w-80 sm:w-96 bg-[#1f1e1b] border border-white/15 rounded-2xl shadow-2xl z-50 p-2 text-xs animate-in zoom-in-95 duration-100">
                {/* Header */}
                <div className="px-3 py-2 border-b border-white/10 flex items-center justify-between text-[#8c8b88]">
                  <span className="font-bold uppercase tracking-wider text-[10px]">
                    Challenge Problems ({solvedProblemSlugs.size}/{matchProblems.length} Solved)
                  </span>
                  <span className="font-mono text-[10px] text-[#81b64c] font-bold">
                    {Math.round((solvedProblemSlugs.size / matchProblems.length) * 100)}%
                  </span>
                </div>

                {/* Items */}
                <div className="py-1 space-y-1">
                  {matchProblems.map((probSlug, idx) => {
                    const isCurrent = probSlug === activeSlug;
                    const isSolved = solvedProblemSlugs.has(probSlug);
                    const meta = getProblemMeta(probSlug);

                    return (
                      <button
                        key={probSlug}
                        type="button"
                        onClick={() => {
                          switchMatchProblem(probSlug);
                          setShowProblemDropdown(false);
                        }}
                        className={`w-full p-2.5 rounded-xl text-left transition flex items-center justify-between gap-3 cursor-pointer ${
                          isCurrent
                            ? 'bg-[#81b64c]/20 border border-[#81b64c]/40 text-white'
                            : 'hover:bg-white/5 text-white/80 hover:text-white border border-transparent'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <span className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-mono font-black shrink-0 ${
                            isCurrent
                              ? 'bg-[#81b64c] text-white'
                              : isSolved
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : 'bg-[#262421] text-white/60'
                          }`}>
                            {idx + 1}
                          </span>
                          <span className={`font-bold truncate ${isCurrent ? 'text-white' : ''}`}>
                            {meta.title}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getDifficultyBadge(meta.difficulty)}`}>
                            {meta.difficulty}
                          </span>
                          {isSolved ? (
                            <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
                              ✓
                            </span>
                          ) : (
                            <span className="text-[10px] text-white/40 font-mono">
                              +{meta.points}p
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Right: Progress Summary & Bar */}
          <div className="shrink-0 flex items-center gap-3">
            <div className="hidden sm:flex flex-col items-end text-[10px]">
              <span className="text-white/80 font-bold">
                {solvedProblemSlugs.size} of {matchProblems.length} Solved
              </span>
            </div>
            <div className="w-20 sm:w-28 bg-[#252320] h-2 rounded-full overflow-hidden border border-white/5">
              <div
                className="bg-[#81b64c] h-full transition-all duration-300 rounded-full"
                style={{ width: `${(solvedProblemSlugs.size / matchProblems.length) * 100}%` }}
              ></div>
            </div>
            <span className="text-[11px] font-mono text-[#8c8b88] font-bold">
              {Math.round((solvedProblemSlugs.size / matchProblems.length) * 100)}%
            </span>
          </div>
        </div>
      )}

      {/* Main Workspace (Problem View + Editor) */}
      <div
        ref={containerRef}
        className={`flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden ${
          isDraggingHorizontal || isDraggingVertical ? 'select-none' : 'transition-all duration-150'
        } ${shakeScreen ? 'animate-shake flash-red ring-2 ring-red-500/60' : ''}`}
      >
        {/* Left: LeetCode-style Problem Statement, Examples & Constraints */}
        <div
          style={{ width: `${leftWidthPercent}%` }}
          className="w-full md:w-auto flex flex-col bg-[#1a1916] overflow-y-auto p-6 space-y-6 shrink-0"
        >
          {/* Problem Header: Number + Title + Badges */}
          <div>
            <div className="flex items-start justify-between gap-3 mb-3">
              <h1 className="text-xl font-bold text-white tracking-tight">
                {problem.id ? `${problem.id}. ` : ''}{problem.title}
              </h1>
              <span className="text-xs font-semibold text-[#81b64c] bg-[#81b64c]/10 border border-[#81b64c]/20 px-2.5 py-1 rounded-lg whitespace-nowrap shrink-0">
                +{problem.points || 3} Challenge Points
              </span>
            </div>

            {/* Metadata Bar: Difficulty & LeetCode Topic Tags */}
            <div className="flex flex-wrap items-center gap-2">
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${getDifficultyBadge(problem.difficulty)}`}>
                {problem.difficulty}
              </span>

              {problem.tags && problem.tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="bg-[#262421] text-white/70 hover:text-white text-[11px] px-2.5 py-0.5 rounded-full border border-white/5 transition flex items-center gap-1 cursor-default"
                >
                  <span className="text-white/40">#</span>
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Problem Description */}
          <div className="text-sm text-[#d1d0cb] leading-relaxed whitespace-pre-wrap font-normal">
            {problem.description}
          </div>

          {/* Example Test Cases */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">
              Examples
            </h3>
            {problem.examples && problem.examples.map((ex, i) => (
              <div key={i} className="space-y-1.5">
                <div className="text-xs font-semibold text-white/80">
                  Example {i + 1}:
                </div>
                <div className="bg-[#21201d] border-l-2 border-white/20 border-y border-r border-white/5 rounded-r-xl p-3.5 font-mono text-xs space-y-1.5 shadow-sm">
                  <div>
                    <span className="text-white/50 select-none">Input: </span>
                    <span className="text-white/90 font-medium">{ex.input}</span>
                  </div>
                  <div>
                    <span className="text-white/50 select-none">Output: </span>
                    <span className="text-[#81b64c] font-bold">{ex.output}</span>
                  </div>
                  {ex.explanation && (
                    <div className="pt-1 text-white/70 font-sans text-[12px] border-t border-white/5 leading-normal">
                      <span className="text-white/50 font-mono text-xs select-none">Explanation: </span>
                      {ex.explanation}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Constraints Section */}
          {problem.constraints && problem.constraints.length > 0 && (
            <div className="space-y-2.5 pt-2 border-t border-[#282622]">
              <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                Constraints:
              </h3>
              <ul className="list-disc pl-5 space-y-1.5 text-xs text-white/80 font-mono">
                {problem.constraints.map((c, i) => (
                  <li key={i}>
                    <code className="bg-[#262421] text-[#eff1f6]/95 px-2 py-0.5 rounded text-[11px] border border-white/5 inline-block">
                      {c}
                    </code>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Follow-up Section */}
          {problem.followUp && (
            <div className="bg-[#23221e] border border-amber-500/20 rounded-xl p-3.5 text-xs space-y-1">
              <div className="text-amber-400 font-bold flex items-center gap-1.5">
                <span>💡</span>
                <span>Follow-up:</span>
              </div>
              <p className="text-white/80 italic font-sans leading-relaxed">
                {problem.followUp}
              </p>
            </div>
          )}
        </div>

        {/* LeetCode Horizontal Window Resizer (Drag to adjust Problem vs Editor width) */}
        <div
          onMouseDown={(e) => {
            e.preventDefault();
            setIsDraggingHorizontal(true);
          }}
          onDoubleClick={() => {
            setLeftWidthPercent(48);
            localStorage.setItem('dsa_problem_pane_width', '48');
          }}
          title="Drag horizontally to resize Problem and Editor panels (Double-click to reset)"
          className={`hidden md:flex w-2 hover:w-2.5 bg-[#23221e] hover:bg-[#81b64c]/70 active:bg-[#81b64c] transition-colors cursor-col-resize items-center justify-center relative select-none shrink-0 z-30 group border-x border-[#2d2a26] ${
            isDraggingHorizontal ? 'bg-[#81b64c] w-2.5 shadow-lg shadow-[#81b64c]/30' : ''
          }`}
        >
          {/* Grip dots */}
          <div className="flex flex-col gap-1 py-1 px-0.5 pointer-events-none">
            <div className="w-1 h-1 rounded-full bg-white/30 group-hover:bg-white/90"></div>
            <div className="w-1 h-1 rounded-full bg-white/30 group-hover:bg-white/90"></div>
            <div className="w-1 h-1 rounded-full bg-white/30 group-hover:bg-white/90"></div>
            <div className="w-1 h-1 rounded-full bg-white/30 group-hover:bg-white/90"></div>
          </div>
        </div>

        {/* Right: Monaco Code Editor & LeetCode Interactive Testcase Panel */}
        <div
          ref={rightPaneRef}
          className="flex-1 flex flex-col min-w-0 min-h-0 bg-[#161512] overflow-hidden relative"
        >
          {/* Editor Action Bar */}
          <div className="p-2.5 bg-[#1e1d1a] border-b border-[#2d2a26] flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <select
                value={language}
                onChange={(e) => handleLanguageChange(e.target.value)}
                className="bg-[#262421] hover:bg-[#2e2c28] text-white text-xs border border-white/10 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-[#81b64c] cursor-pointer font-medium transition"
              >
                <option value="cpp">C++20</option>
                <option value="java">Java 17</option>
                <option value="python">Python 3</option>
                <option value="javascript">JavaScript</option>
                <option value="typescript">TypeScript</option>
                <option value="c">C</option>
              </select>

              {/* Reset to Default Template Button */}
              <button
                onClick={handleResetCode}
                title="Reset to LeetCode default template"
                className="bg-[#262421] hover:bg-[#2e2c28] text-white/70 hover:text-white text-xs border border-white/10 rounded-lg px-2.5 py-1.5 transition flex items-center gap-1.5 cursor-pointer"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span className="hidden sm:inline">Reset Code</span>
              </button>

              {/* Dynamic Text Size Selector & Stepper */}
              <div
                className="flex items-center bg-[#262421] hover:bg-[#2c2a26] border border-white/10 rounded-lg p-0.5 transition group select-none"
                title="Editor Text Size (Ctrl + MouseWheel to zoom like VS Code)"
              >
                <button
                  type="button"
                  onClick={() => adjustFontSize(-1)}
                  title="Decrease text size (Ctrl + Wheel Down)"
                  className="w-6 h-6 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/15 rounded-md transition cursor-pointer"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" />
                  </svg>
                </button>

                <div className="relative flex items-center px-1 text-white/80">
                  <span className="text-[11px] text-white/40 mr-1 font-mono font-bold select-none pointer-events-none hidden sm:inline">
                    Aa
                  </span>
                  <div className="relative flex items-center">
                    <select
                      value={editorFontSize}
                      onChange={(e) => updateFontSize(Number(e.target.value))}
                      className="appearance-none bg-transparent text-white text-xs font-bold focus:outline-none cursor-pointer pl-0.5 pr-3.5 py-0.5 font-mono"
                      title="Select Editor Font Size"
                    >
                      {availableFontSizes.map((sz) => (
                        <option key={sz} value={sz} className="bg-[#262421] text-white font-mono">
                          {sz}px
                        </option>
                      ))}
                    </select>
                    <svg className="w-2.5 h-2.5 text-white/40 pointer-events-none absolute right-0.5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.25 4.25a.75.75 0 01-1.06 0L5.21 8.27a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => adjustFontSize(1)}
                  title="Increase text size (Ctrl + Wheel Up)"
                  className="w-6 h-6 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/15 rounded-md transition cursor-pointer"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14m7-7H5" />
                  </svg>
                </button>
              </div>

              {/* LeetCode Practice Stopwatch Widget in Editor Action Bar */}
              {!isChallenge && (
                isTimerCollapsed ? (
                  <button
                    type="button"
                    onClick={() => {
                      setIsTimerCollapsed(false);
                      try { localStorage.setItem('dsa_timer_collapsed', 'false'); } catch {}
                    }}
                    title="Expand Practice Timer"
                    className="flex items-center gap-1.5 bg-[#262626] hover:bg-[#2e2e2e] border border-white/10 rounded-lg px-2 py-1 text-xs text-[#2cb5ff] font-mono transition cursor-pointer"
                  >
                    <svg className="w-3 h-3 text-[#9ca3af]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                    <span className="text-xs">⏱️</span>
                    <span className="font-semibold tracking-wider">{formatLeetCodeTimer(practiceSeconds)}</span>
                  </button>
                ) : (
                  <div className="flex items-center bg-[#262626] hover:bg-[#2a2a2a] border border-white/10 rounded-lg px-1.5 py-1 gap-2.5 select-none transition">
                    <button
                      type="button"
                      onClick={() => {
                        setIsTimerCollapsed(true);
                        try { localStorage.setItem('dsa_timer_collapsed', 'true'); } catch {}
                      }}
                      title="Collapse Timer"
                      className="w-5 h-6 bg-[#333333] hover:bg-[#404040] rounded flex items-center justify-center text-[#9ca3af] hover:text-white transition cursor-pointer"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>

                    <button
                      type="button"
                      onClick={togglePracticeTimer}
                      title={isPracticeTimerRunning ? "Pause Timer" : "Resume Timer"}
                      className="text-[#9ca3af] hover:text-white transition cursor-pointer p-0.5 flex items-center justify-center"
                    >
                      {isPracticeTimerRunning ? (
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                          <rect x="6" y="4" width="3.5" height="16" rx="1.5" />
                          <rect x="14.5" y="4" width="3.5" height="16" rx="1.5" />
                        </svg>
                      ) : (
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M7 4v16l13-8z" />
                        </svg>
                      )}
                    </button>

                    <span
                      className={`font-mono text-xs sm:text-sm tracking-wider font-semibold select-none ${
                        isPracticeSolved ? 'text-emerald-400' : 'text-[#2cb5ff]'
                      }`}
                      title={
                        isPracticeSolved
                          ? `Solved in ${formatLeetCodeTimer(practiceSolveTime !== null ? practiceSolveTime : practiceSeconds)}`
                          : isPracticeTimerRunning
                          ? "Practice stopwatch running"
                          : "Practice stopwatch paused"
                      }
                    >
                      {formatLeetCodeTimer(isPracticeSolved && practiceSolveTime !== null ? practiceSolveTime : practiceSeconds)}
                    </span>

                    <button
                      type="button"
                      onClick={resetPracticeTimer}
                      title="Reset Timer to 00:00:00"
                      className="text-[#9ca3af] hover:text-white transition cursor-pointer p-0.5 flex items-center justify-center"
                    >
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
                        <path d="M21 3v5h-5" />
                        <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
                        <path d="M3 21v-5h5" />
                      </svg>
                    </button>
                  </div>
                )
              )}

              {/* Anti-Cheat Status Pill during 1v1 Battle / Contest */}
              {isChallenge && (
                <div
                  title="Anti-Cheat System Active: Internal and external copy-paste is strictly disabled to maintain fair play."
                  className="hidden sm:flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] font-bold px-2.5 py-1 rounded-lg select-none"
                >
                  <span className="text-xs">🛡️</span>
                  <span>No Copy-Paste</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              {/* Cloud Save status indicator (subtle indicator when saving/saved) */}
              <div className="flex items-center gap-1.5 text-xs">
                {saveStatus === 'saving' && (
                  <span className="text-amber-400 font-mono text-[11px] flex items-center gap-1 bg-amber-500/10 border border-amber-500/25 px-2 py-0.5 rounded">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping"></span>
                    Saving...
                  </span>
                )}
                {saveStatus === 'saved' && (
                  <span className="text-emerald-400 font-mono text-[11px] flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/25 px-2 py-0.5 rounded">
                    <span>☁️</span>
                    Saved
                  </span>
                )}
              </div>

              <button
                onClick={handleRun}
                disabled={isRunning}
                className="bg-[#2b2926] hover:bg-[#363431] text-white text-xs font-semibold px-4 py-1.5 rounded-lg border border-white/10 transition disabled:opacity-50 cursor-pointer"
              >
                {isRunning ? 'Running...' : 'Run Code'}
              </button>
              <button
                onClick={handleSubmit}
                disabled={isRunning}
                className="bg-[#81b64c] hover:bg-[#92c55b] text-white text-xs font-bold px-5 py-1.5 rounded-lg shadow-md transition disabled:opacity-50 cursor-pointer"
              >
                Submit Solution
              </button>
            </div>
          </div>

          {/* Monaco Editor Pane */}
          <div
            ref={editorContainerRef}
            className="flex-1 min-h-0 relative overflow-hidden"
          >
            {/* Dynamic VS Code-style Zoom Toast Notification */}
            {zoomNotification && (
              <div className="absolute bottom-4 right-4 z-30 bg-[#201e1a]/95 backdrop-blur border border-white/20 text-white text-xs font-mono font-semibold px-3 py-1.5 rounded-lg shadow-2xl pointer-events-none flex items-center gap-2 animate-in fade-in zoom-in-95 duration-150">
                <svg className="w-3.5 h-3.5 text-[#81b64c]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" />
                  <path d="M21 21l-4.35-4.35" />
                  <path d="M11 8v6M8 11h6" />
                </svg>
                <span>Zoom: {zoomNotification}</span>
                <span className="text-[10px] text-white/50">(Ctrl + Wheel)</span>
              </div>
            )}

            {/* Anti-Cheat Alert Popup Banner */}
            {antiCheatAlert && (
              <div className="absolute top-3 left-1/2 -translate-x-1/2 z-40 bg-[#241416]/95 border-2 border-red-500/80 backdrop-blur-md text-red-100 px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-top-3 duration-200 ring-4 ring-red-500/20 max-w-md w-[92%]">
                <div className="w-9 h-9 rounded-xl bg-red-500/20 border border-red-500/40 text-red-400 flex items-center justify-center text-lg shrink-0 animate-pulse">
                  🛡️
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-red-400 font-mono">Anti-Cheat Fair Play</span>
                    <span className="text-[9px] bg-red-500/20 text-red-300 px-1.5 py-0.2 rounded font-bold">Prohibited</span>
                  </div>
                  <p className="text-xs font-bold text-white mt-0.5 leading-tight">
                    {antiCheatAlert.message}
                  </p>
                  <p className="text-[11px] text-[#c9a7a7] mt-0.5 leading-snug">
                    {antiCheatAlert.detail}
                  </p>
                </div>
                <button
                  onClick={() => setAntiCheatAlert(null)}
                  className="text-white/50 hover:text-white text-xs p-1 rounded-lg hover:bg-white/10 shrink-0 cursor-pointer"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Transparent overlay during drag so Monaco doesn't swallow mouse events */}
            {(isDraggingHorizontal || isDraggingVertical) && (
              <div className="absolute inset-0 z-50 bg-transparent cursor-pointer"></div>
            )}
            <Editor
              height="100%"
              language={language === 'c' ? 'c' : (language === 'typescript' ? 'typescript' : language)}
              theme="vs-dark"
              value={code}
              onMount={handleEditorDidMount}
              onChange={(val) => {
                const updated = val || '';
                setCode(updated);
                setCodeByLanguage(prev => ({
                  ...prev,
                  [language]: updated
                }));

                // In 1v1 battle / contest: broadcast live POV to opponent and save draft in sessionStorage
                if (isChallenge) {
                  broadcastCode(updated, language);
                  try {
                    sessionStorage.setItem(`dsa_battle_code_${activeSlug}_${language}`, updated);
                  } catch {}
                  codeCacheByProblemLangRef.current[`${activeSlug}_${language}`] = updated;
                }

                // ALWAYS auto-save the code written in the editor to user's account!
                // Even during 1v1 battle / contest, so that when user opens Normal Practice later,
                // their code is safely preserved!
                const authToken = localStorage.getItem('token');
                if (authToken) {
                  setSaveStatus('saving');
                  if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
                  autoSaveTimerRef.current = setTimeout(async () => {
                    try {
                      await axios.post(
                        `http://localhost:5000/api/problems/${slug}/draft`,
                        {
                          language,
                          code: updated,
                          problemTitle: problem?.title,
                          problemDifficulty: problem?.difficulty,
                          tags: problem?.tags
                        },
                        { headers: { Authorization: `Bearer ${authToken}` } }
                      );
                      setSaveStatus('saved');
                      setTimeout(() => setSaveStatus('idle'), 2500);
                    } catch (err) {
                      console.warn('Auto-save failed:', err.message);
                      setSaveStatus('idle');
                    }
                  }, 1200);
                }
              }}
              options={{
                automaticLayout: true,
                minimap: { enabled: false },
                fontSize: editorFontSize,
                fontFamily: 'JetBrains Mono, Menlo, monospace',
                padding: { top: 12 },
                scrollBeyondLastLine: false,
                smoothScrolling: true,
                tabSize: language === 'python' ? 4 : 4,
                autoIndent: 'full',
                contextmenu: !isChallenge,
                mouseWheelZoom: false
              }}
            />
          </div>

          {/* LeetCode Vertical Window Resizer (Drag to adjust Editor vs Testcase height) */}
          <div
            onMouseDown={(e) => {
              e.preventDefault();
              setIsDraggingVertical(true);
            }}
            onDoubleClick={() => {
              setTestcaseHeight(260);
              localStorage.setItem('dsa_testcase_pane_height', '260');
            }}
            title="Drag vertically to resize Code Editor and Testcase panel (Double-click to reset)"
            className={`h-2 hover:h-2.5 bg-[#23221e] hover:bg-[#81b64c]/70 active:bg-[#81b64c] transition-colors cursor-row-resize flex items-center justify-center relative select-none shrink-0 z-30 group border-y border-[#2d2a26] ${
              isDraggingVertical ? 'bg-[#81b64c] h-2.5 shadow-lg shadow-[#81b64c]/30' : ''
            }`}
          >
            {/* Grip line */}
            <div className="flex items-center gap-1 px-1 pointer-events-none">
              <div className="h-1 w-1 rounded-full bg-white/30 group-hover:bg-white/90"></div>
              <div className="h-1 w-8 rounded-full bg-white/30 group-hover:bg-white/90"></div>
              <div className="h-1 w-1 rounded-full bg-white/30 group-hover:bg-white/90"></div>
            </div>
          </div>

          {/* Bottom LeetCode Panel: Interactive Testcase & Test Result */}
          <div
            style={{ height: `${testcaseHeight}px` }}
            className="bg-[#161512] flex flex-col min-h-0 shrink-0 shadow-lg overflow-hidden"
          >
            {/* Panel Tabs Header */}
            <div className="px-4 pt-2.5 pb-2 bg-[#1e1d1a] border-b border-[#2d2a26] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-6 text-xs font-bold">
                <button
                  onClick={() => {
                    setActiveBottomTab('testcase');
                    if (testcaseHeight <= 50) {
                      const target = lastExpandedHeightRef.current > 100 ? lastExpandedHeightRef.current : 260;
                      setTestcaseHeight(target);
                      localStorage.setItem('dsa_testcase_pane_height', target.toString());
                    }
                  }}
                  className={`flex items-center gap-1.5 pb-1 relative cursor-pointer transition ${
                    activeBottomTab === 'testcase' ? 'text-white' : 'text-[#7d7b77] hover:text-white'
                  }`}
                >
                  <span className="text-[#81b64c]">✓</span>
                  <span>Testcase</span>
                  {activeBottomTab === 'testcase' && (
                    <div className="absolute -bottom-2 left-0 right-0 h-0.5 bg-[#81b64c] rounded-full"></div>
                  )}
                </button>

                <button
                  onClick={() => {
                    setActiveBottomTab('result');
                    if (testcaseHeight <= 50) {
                      const target = lastExpandedHeightRef.current > 100 ? lastExpandedHeightRef.current : 260;
                      setTestcaseHeight(target);
                      localStorage.setItem('dsa_testcase_pane_height', target.toString());
                    }
                  }}
                  className={`flex items-center gap-1.5 pb-1 relative cursor-pointer transition ${
                    activeBottomTab === 'result' ? 'text-white' : 'text-[#7d7b77] hover:text-white'
                  }`}
                >
                  <span>Test Result</span>
                  {runResults && (
                    <span className="w-2 h-2 rounded-full bg-[#81b64c]"></span>
                  )}
                  {activeBottomTab === 'result' && (
                    <div className="absolute -bottom-2 left-0 right-0 h-0.5 bg-[#81b64c] rounded-full"></div>
                  )}
                </button>
              </div>

              <div className="flex items-center gap-2">
                {isRunning ? (
                  <div className="flex items-center gap-2 text-xs text-[#81b64c] font-semibold animate-pulse">
                    <div className="w-3 h-3 border-2 border-[#81b64c]/20 border-t-[#81b64c] rounded-full animate-spin"></div>
                    <span>Running test cases...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-xs text-[#8c8b88]">
                    {/* Default Height Reset */}
                    <button
                      onClick={() => {
                        setTestcaseHeight(260);
                        localStorage.setItem('dsa_testcase_pane_height', '260');
                      }}
                      title="Reset testcase height to 260px"
                      className="px-2 py-0.5 rounded text-[11px] hover:text-white hover:bg-white/5 transition flex items-center gap-1 cursor-pointer"
                    >
                      <svg className="w-3 h-3 text-white/50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                      </svg>
                      <span className="hidden sm:inline">Reset</span>
                    </button>

                    {/* Maximize Height */}
                    <button
                      onClick={() => {
                        const target = 480;
                        setTestcaseHeight(target);
                        localStorage.setItem('dsa_testcase_pane_height', target.toString());
                      }}
                      title="Maximize testcase height"
                      className="px-2 py-0.5 rounded text-[11px] hover:text-white hover:bg-white/5 transition flex items-center gap-1 cursor-pointer"
                    >
                      <svg className="w-3 h-3 text-white/50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h7M3 3v7M3 3l6 6m12-6h-7m7 0v7m0-7l-6 6" />
                      </svg>
                      <span className="hidden sm:inline">Maximize</span>
                    </button>

                    {/* Collapse / Expand Toggle Button */}
                    <button
                      onClick={() => {
                        if (testcaseHeight <= 50) {
                          const target = lastExpandedHeightRef.current > 100 ? lastExpandedHeightRef.current : 260;
                          setTestcaseHeight(target);
                          localStorage.setItem('dsa_testcase_pane_height', target.toString());
                        } else {
                          lastExpandedHeightRef.current = testcaseHeight;
                          setTestcaseHeight(42);
                          localStorage.setItem('dsa_testcase_pane_height', '42');
                        }
                      }}
                      title={testcaseHeight <= 50 ? "Expand testcase panel" : "Collapse testcase panel"}
                      className="px-2 py-0.5 rounded text-[11px] hover:text-white hover:bg-white/5 transition flex items-center gap-1 cursor-pointer font-medium"
                    >
                      {testcaseHeight <= 50 ? (
                        <>
                          <svg className="w-3.5 h-3.5 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" />
                          </svg>
                          <span>Expand</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-3.5 h-3.5 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                          </svg>
                          <span>Collapse</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* TAB 1: TESTCASE */}
            {activeBottomTab === 'testcase' && (
              <div className="flex-1 p-4 overflow-y-auto flex flex-col min-h-0 bg-[#171613]">
                {/* Testcase Case Pills + Add Button */}
                <div className="flex items-center gap-2 mb-3 flex-wrap shrink-0">
                  {testcases.map((tc, idx) => (
                    <div
                      key={tc.id || idx}
                      onClick={() => setSelectedCaseIdx(idx)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 cursor-pointer transition border ${
                        selectedCaseIdx === idx
                          ? 'bg-[#2b2926] text-white border-white/20 shadow-sm'
                          : 'bg-[#21201d] text-[#8c8b88] hover:text-white border-white/5 hover:border-white/10'
                      }`}
                    >
                      <span>{tc.name || `Case ${idx + 1}`}</span>
                      {tc.isCustom && testcases.length > 1 && (
                        <button
                          onClick={(e) => handleDeleteTestcase(e, idx)}
                          title="Remove testcase"
                          className="text-white/40 hover:text-danger text-xs ml-0.5"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}

                  {/* Add Testcase Button (+) */}
                  <button
                    onClick={handleAddTestcase}
                    title="Add new testcase"
                    className="bg-[#21201d] hover:bg-[#2b2926] text-white/70 hover:text-white border border-white/10 px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                  >
                    <span className="text-base leading-none">+</span>
                  </button>
                </div>

                {/* Editable Input Box for Selected Testcase */}
                {testcases[selectedCaseIdx] && (
                  <div className="flex-1 flex flex-col min-h-0">
                    <div className="text-[11px] text-[#8c8b88] font-bold uppercase tracking-wider mb-1.5 flex items-center justify-between">
                      <span>{testcases[selectedCaseIdx].name || `Case ${selectedCaseIdx + 1}`} Input Parameter:</span>
                      {testcases[selectedCaseIdx].isCustom && (
                        <span className="text-[10px] bg-[#81b64c]/15 text-[#81b64c] px-2 py-0.5 rounded font-mono">
                          Custom Testcase
                        </span>
                      )}
                    </div>

                    <textarea
                      value={testcases[selectedCaseIdx].input || ''}
                      onChange={(e) => handleTestcaseInputChange(e.target.value)}
                      rows={3}
                      placeholder="Enter custom testcase input..."
                      className="w-full bg-[#1b1a18] border border-white/10 hover:border-white/20 focus:border-[#81b64c] rounded-xl p-3 font-mono text-xs text-white focus:outline-none resize-none transition shadow-inner"
                    />
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: TEST RESULT */}
            {activeBottomTab === 'result' && (
              <div className="flex-1 p-4 overflow-y-auto flex flex-col min-h-0 bg-[#171613]">
                {!runResults ? (
                  <div className="flex flex-col items-center justify-center flex-1 text-center py-6 text-[#7d7b77]">
                    <p className="text-xs mb-3">You must run your code first to view the test result.</p>
                    <button
                      onClick={handleRun}
                      className="bg-[#81b64c] hover:bg-[#92c55b] text-white font-bold text-xs px-4 py-2 rounded-xl transition shadow-md cursor-pointer"
                    >
                      Run Code
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {/* Status Header: LeetCode Status Banner */}
                    <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-white/5">
                      <div className="flex items-center gap-2">
                        {runResults.status === 'Accepted' ? (
                          <span className="text-lg sm:text-xl font-black text-[#81b64c] flex items-center gap-1.5">
                            <span>✓</span>
                            <span>Accepted</span>
                          </span>
                        ) : runResults.status === 'Compilation Error' ? (
                          <span className="text-lg sm:text-xl font-black text-red-500 flex items-center gap-1.5">
                            <span>⚠️</span>
                            <span>Compilation Error</span>
                          </span>
                        ) : runResults.status === 'Runtime Error' ? (
                          <span className="text-lg sm:text-xl font-black text-red-500 flex items-center gap-1.5">
                            <span>💥</span>
                            <span>Runtime Error</span>
                          </span>
                        ) : runResults.status === 'Time Limit Exceeded' ? (
                          <span className="text-lg sm:text-xl font-black text-amber-400 flex items-center gap-1.5">
                            <span>⏱</span>
                            <span>Time Limit Exceeded</span>
                          </span>
                        ) : (
                          <span className="text-lg sm:text-xl font-black text-red-500 flex items-center gap-1.5">
                            <span>✗</span>
                            <span>Wrong Answer</span>
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 sm:gap-4 text-xs font-mono flex-wrap">
                        {runResults.solveTimeFormatted && (
                          <span className="text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 px-2.5 py-0.5 rounded-lg font-bold flex items-center gap-1.5 shadow-xs">
                            <span>⏱️ Solved in</span>
                            <strong className="text-white font-black">{runResults.solveTimeFormatted}</strong>
                          </span>
                        )}
                        <span className="text-[#8c8b88]">
                          Runtime: <strong className="text-white font-bold">{runResults.runtime}</strong>
                        </span>
                        <span className="text-[#8c8b88]">
                          Memory: <strong className="text-white font-bold">{runResults.memory}</strong>
                        </span>
                      </div>
                    </div>

                    {/* Compilation or Runtime Error Display Box */}
                    {runResults.errorMessage && (
                      <div className="bg-[#241315] border border-red-500/30 rounded-xl p-3.5 text-xs font-mono text-red-200 overflow-x-auto whitespace-pre-wrap max-h-44 shadow-inner">
                        <div className="text-[10px] text-red-400 uppercase font-bold tracking-wider mb-1.5 flex items-center gap-1.5">
                          <span>Compiler / Error Log</span>
                        </div>
                        {runResults.errorMessage}
                      </div>
                    )}

                    {/* Result Case Selector Pills */}
                    {runResults.cases && runResults.cases.length > 0 && (
                      <div className="flex items-center gap-2 flex-wrap">
                        {runResults.cases.map((c, idx) => (
                          <button
                            key={c.id || idx}
                            onClick={() => setSelectedCaseIdx(idx)}
                            className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition border ${
                              selectedCaseIdx === idx
                                ? 'bg-[#2b2926] text-white border-white/20'
                                : 'bg-[#21201d] text-[#8c8b88] hover:text-white border-white/5'
                            }`}
                          >
                            <span className={c.passed ? 'text-[#81b64c] text-xs' : 'text-red-500 text-xs'}>
                              {c.passed ? '✓' : '✗'}
                            </span>
                            <span>{c.name || `Case ${idx + 1}`}</span>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Active Case Details (Input, Output, Expected) */}
                    {runResults.cases && runResults.cases[selectedCaseIdx] && (
                      <div className="flex flex-col gap-2.5 mt-1 font-mono text-xs">
                        <div>
                          <div className="text-[10px] text-[#7d7b77] uppercase font-bold tracking-wider mb-1">Input</div>
                          <div className="bg-[#1b1a18] border border-white/5 rounded-xl p-2.5 text-white/90">
                            {runResults.cases[selectedCaseIdx].input}
                          </div>
                        </div>

                        <div>
                          <div className="text-[10px] text-[#7d7b77] uppercase font-bold tracking-wider mb-1">
                            Your Output
                          </div>
                          <div className={`bg-[#1b1a18] border border-white/5 rounded-xl p-2.5 font-bold ${
                            runResults.cases[selectedCaseIdx].passed ? 'text-[#81b64c]' : 'text-red-400'
                          }`}>
                            {runResults.cases[selectedCaseIdx].output || '(No output or error)'}
                          </div>
                        </div>

                        <div>
                          <div className="text-[10px] text-[#7d7b77] uppercase font-bold tracking-wider mb-1">Expected Output</div>
                          <div className="bg-[#1b1a18] border border-white/5 rounded-xl p-2.5 text-white/90">
                            {runResults.cases[selectedCaseIdx].expected}
                          </div>
                        </div>

                        {runResults.cases[selectedCaseIdx].error && (
                          <div>
                            <div className="text-[10px] text-red-400 uppercase font-bold tracking-wider mb-1">Error Message</div>
                            <div className="bg-[#241315] border border-red-500/20 rounded-xl p-2.5 text-red-300">
                              {runResults.cases[selectedCaseIdx].error}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MULTI-PROBLEM PROGRESS / ADVANCE MODAL */}
      {problemProgressModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#21201d] border border-white/20 rounded-3xl p-6 sm:p-8 max-w-md w-full text-center shadow-2xl animate-in zoom-in duration-200">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center text-3xl mx-auto mb-4 shadow-lg">
              ✓
            </div>

            <div className="inline-block bg-[#81b64c]/20 text-[#81b64c] text-xs font-extrabold px-3 py-1 rounded-full uppercase tracking-wider mb-2 font-mono">
              Problem {problemProgressModal.solvedCount} of {problemProgressModal.totalCount} Solved!
            </div>

            <h2 className="text-xl font-black text-white mb-1">
              Accepted: {problemProgressModal.currentTitle}
            </h2>
            <p className="text-xs text-[#8c8b88] mb-6">
              Great work! You passed all test cases. Now proceed to problem {problemProgressModal.solvedCount + 1} to complete the challenge.
            </p>

            {problemProgressModal.nextSlug && (
              <div className="bg-[#181715] border border-white/10 rounded-2xl p-4 mb-6 text-left">
                <div className="text-[11px] uppercase tracking-wider text-[#8c8b88] font-bold mb-1">
                  Next Challenge:
                </div>
                <div className="text-sm font-extrabold text-white flex items-center justify-between">
                  <span>{PROBLEM_DICTIONARY[problemProgressModal.nextSlug]?.title || problemProgressModal.nextSlug}</span>
                  <span className="text-xs font-mono text-amber-400 font-bold">
                    +{PROBLEM_DICTIONARY[problemProgressModal.nextSlug]?.points || 4} pts
                  </span>
                </div>
              </div>
            )}

            <div className="flex flex-col gap-2.5">
              {problemProgressModal.nextSlug && (
                <button
                  onClick={() => {
                    const nextSlug = problemProgressModal.nextSlug;
                    setProblemProgressModal(null);
                    switchMatchProblem(nextSlug);
                  }}
                  className="w-full bg-[#81b64c] hover:bg-[#92c55b] text-white font-extrabold text-sm py-3 rounded-xl transition shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Proceed to Next Problem</span>
                  <span>→</span>
                </button>
              )}
              <button
                onClick={() => setProblemProgressModal(null)}
                className="w-full bg-[#2c2a26] hover:bg-[#383531] text-white/80 hover:text-white font-bold text-xs py-2.5 rounded-xl border border-white/10 transition cursor-pointer"
              >
                Stay Here & Review Code
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VICTORY / MATCH FINISHED MODAL */}
      {matchResult && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#21201d] border border-white/20 rounded-3xl p-6 sm:p-8 max-w-md w-full text-center shadow-2xl animate-in zoom-in duration-200">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center text-4xl mx-auto mb-4 shadow-xl ${
              matchResult.status === 'timeout'
                ? 'bg-gradient-to-tr from-amber-600 to-rose-500'
                : 'bg-gradient-to-tr from-amber-500 to-yellow-300'
            }`}>
              {matchResult.status === 'timeout' ? '⏳' : '🏆'}
            </div>

            <h2 className="text-2xl font-black text-white mb-1">
              {matchResult.status === 'timeout' ? 'Time Expired!' : 'Victory! Challenge Won'}
            </h2>
            <p className="text-xs text-[#8c8b88] mb-6">
              {matchResult.status === 'timeout' ? (
                <span>
                  Match time ran out against <strong className="text-white">@{matchResult.opponent || 'Opponent'}</strong> in {matchResult.mode} match.
                </span>
              ) : (
                <>
                  Defeated <strong className="text-white">@{matchResult.opponent || 'Opponent'}</strong> in {matchResult.mode} match!
                  {matchResult.totalProblems > 1 && (
                    <span className="block mt-1 text-emerald-400 font-bold">
                      🎯 Solved all {matchResult.totalProblems} problems!
                    </span>
                  )}
                </>
              )}
            </p>

            {isLoggedIn ? (
              <div className="bg-[#181715] border border-white/10 rounded-2xl p-4 mb-6 flex flex-col gap-3">
                {matchResult.isRated ? (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[#8c8b88]">Rating Adjustment:</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-mono text-white/70">{matchResult.newRating - matchResult.ratingChange}</span>
                      <span className="text-xs text-white/40">→</span>
                      <span className={`text-base font-extrabold font-mono ${matchResult.ratingChange < 0 ? 'text-red-400' : 'text-[#81b64c]'}`}>
                        {matchResult.newRating}
                      </span>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        matchResult.ratingChange < 0 ? 'bg-red-500/20 text-red-400' : 'bg-[#81b64c]/20 text-[#81b64c]'
                      }`}>
                        {matchResult.ratingChange > 0 ? `+${matchResult.ratingChange}` : matchResult.ratingChange} Elo
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[#8c8b88]">Rating Adjustment:</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                        🛡️ Non-Rated ({matchResult.opponent?.toLowerCase().includes('bot') ? 'Casual Duel' : 'Practice Match'})
                      </span>
                      <span className="text-xs text-[#8c8b88] font-mono">
                        (Unchanged: {matchResult.newRating})
                      </span>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between border-t border-white/5 pt-2 text-xs">
                  <span className="text-[#8c8b88]">Current Streak:</span>
                  <span className={`font-extrabold flex items-center gap-1 ${matchResult.status === 'timeout' ? 'text-zinc-400' : 'text-amber-400'}`}>
                    <span>{matchResult.status === 'timeout' ? '⏹️' : '🔥'}</span>
                    <span>{matchResult.streak || 0} Day Streak</span>
                  </span>
                </div>

                <div className={`text-[11px] text-center font-medium ${matchResult.status === 'timeout' ? 'text-amber-400' : 'text-[#81b64c]'}`}>
                  {matchResult.isRated
                    ? (matchResult.status === 'timeout' ? '✓ Rated timeout recorded into your Rating & Battle History' : '✓ Rated challenge recorded into your Rating & Battle History')
                    : '✓ Non-rated challenge completed — ratings preserved without change'}
                </div>
              </div>
            ) : (
              <div className="bg-[#181715] border border-white/10 rounded-2xl p-4 mb-6 text-xs text-[#8c8b88]">
                <p className="text-white font-semibold mb-1">Great job solving this challenge!</p>
                <p className="mb-3">Log in to record this match to your profile and challenge real players to increase your Elo rating.</p>
                <Link
                  to="/login"
                  className="inline-block bg-[#81b64c] text-white font-bold px-4 py-1.5 rounded-lg"
                >
                  Log In to Save
                </Link>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                to="/profile"
                className="flex-1 bg-[#81b64c] hover:bg-[#92c55b] text-white font-bold text-xs py-3 rounded-xl transition shadow-lg text-center"
              >
                View Profile & History
              </Link>
              <Link
                to="/"
                className="flex-1 bg-[#2b2926] hover:bg-[#363431] text-white font-bold text-xs py-3 rounded-xl border border-white/10 transition text-center"
              >
                Challenge Next Match
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* WRONG SUBMISSION REACTION MODAL */}
      {wrongSubmissionReaction && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#21201d] border border-red-500/40 rounded-3xl p-6 sm:p-8 max-w-md w-full text-center shadow-2xl animate-in zoom-in duration-200">
            {/* Animated Reaction Icon */}
            <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-red-600 to-rose-400 flex items-center justify-center text-4xl mx-auto mb-4 shadow-xl ring-4 ring-red-500/20 animate-bounce">
              {wrongSubmissionReaction.status === 'Compilation Error' ? '⚠️' :
               wrongSubmissionReaction.status === 'Runtime Error' ? '💥' :
               wrongSubmissionReaction.status === 'Time Limit Exceeded' ? '⏱' : '💔'}
            </div>

            <h2 className="text-2xl font-black text-white mb-1 flex items-center justify-center gap-2">
              <span className="text-red-500">✗</span>
              <span>{wrongSubmissionReaction.status}</span>
            </h2>

            <p className="text-xs text-[#b0afa9] mb-5">
              {wrongSubmissionReaction.status === 'Wrong Answer' ? (
                <>Blunder! Your solution failed on <strong className="text-white">{wrongSubmissionReaction.failedCase?.name || 'Test Case'}</strong>.</>
              ) : wrongSubmissionReaction.status === 'Compilation Error' ? (
                <>Syntax or build error! The compiler failed to compile your code.</>
              ) : wrongSubmissionReaction.status === 'Time Limit Exceeded' ? (
                <>Time limit exceeded! Execution took longer than 2000 ms.</>
              ) : (
                <>Runtime error! An exception occurred during execution.</>
              )}
            </p>

            {/* Test Case Passed vs Total Meter */}
            <div className="bg-[#181715] border border-white/10 rounded-2xl p-3.5 mb-5 space-y-2 text-xs">
              <div className="flex items-center justify-between font-bold">
                <span className="text-[#8c8b88]">Test Cases Passed:</span>
                <span className={wrongSubmissionReaction.passedCount > 0 ? 'text-amber-400' : 'text-red-400 font-mono'}>
                  {wrongSubmissionReaction.passedCount} / {wrongSubmissionReaction.totalCount} Passed
                </span>
              </div>
              <div className="w-full bg-[#262421] rounded-full h-2 overflow-hidden">
                <div
                  className="bg-red-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${(wrongSubmissionReaction.passedCount / Math.max(wrongSubmissionReaction.totalCount, 1)) * 100}%` }}
                />
              </div>
            </div>

            {/* Failing Test Case Details */}
            {wrongSubmissionReaction.failedCase && (
              <div className="bg-[#181715] border border-red-500/20 rounded-2xl p-3.5 mb-6 text-left font-mono text-xs space-y-2">
                <div>
                  <span className="text-[10px] text-[#8c8b88] uppercase font-bold block mb-0.5">Input</span>
                  <div className="text-white/90 bg-[#12110f] p-2 rounded-lg border border-white/5 truncate">
                    {wrongSubmissionReaction.failedCase.input}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10px] text-red-400 uppercase font-bold block mb-0.5">Your Output</span>
                    <div className="text-red-400 font-bold bg-[#12110f] p-2 rounded-lg border border-red-500/20 truncate">
                      {wrongSubmissionReaction.failedCase.output || '(empty)'}
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#81b64c] uppercase font-bold block mb-0.5">Expected</span>
                    <div className="text-[#81b64c] font-bold bg-[#12110f] p-2 rounded-lg border border-white/5 truncate">
                      {wrongSubmissionReaction.failedCase.expected}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Error Message Snippet if CE / RE */}
            {wrongSubmissionReaction.errorMessage && (
              <div className="bg-[#181715] border border-red-500/20 rounded-2xl p-3 text-left font-mono text-[11px] text-red-300 max-h-32 overflow-y-auto mb-6 whitespace-pre-wrap">
                {wrongSubmissionReaction.errorMessage}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => setWrongSubmissionReaction(null)}
                className="flex-1 bg-[#ef4444] hover:bg-[#dc2626] text-white font-bold text-xs py-3 rounded-xl transition shadow-lg cursor-pointer"
              >
                Fix Code & Try Again
              </button>
              <button
                onClick={() => {
                  setWrongSubmissionReaction(null);
                  setActiveBottomTab('result');
                }}
                className="flex-1 bg-[#2b2926] hover:bg-[#363431] text-white font-bold text-xs py-3 rounded-xl border border-white/10 transition cursor-pointer"
              >
                Inspect Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FLOATING TOAST NOTIFICATION ON RUN CODE */}
      {toastReaction && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-xl shadow-2xl border text-xs font-bold transition animate-in slide-in-from-bottom-2 duration-200 ${
          toastReaction.type === 'error'
            ? 'bg-[#211819] text-red-300 border-red-500/40 shadow-red-950/40'
            : 'bg-[#1b2219] text-emerald-300 border-emerald-500/40 shadow-emerald-950/40'
        }`}>
          <span className={toastReaction.type === 'error' ? 'text-red-400 text-sm' : 'text-emerald-400 text-sm'}>
            {toastReaction.type === 'error' ? '✗' : '✓'}
          </span>
          <span>{toastReaction.message}</span>
        </div>
      )}

      {/* QUIT / RESIGN BATTLE POPUP CONFIRMATION MODAL */}
      {showResignModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#1e1d1a] border border-red-500/40 rounded-3xl p-6 sm:p-8 max-w-md w-full text-center shadow-2xl shadow-red-950/40 animate-in zoom-in-95 duration-150">
            {/* Pulsating Warning Shield Icon */}
            <div className="w-16 h-16 rounded-2xl bg-red-500/15 border border-red-500/30 flex items-center justify-center text-3xl mx-auto mb-4 shadow-inner">
              ⚠️
            </div>

            <h2 className="text-2xl font-black text-white mb-2 tracking-tight">
              Quit & Resign Battle?
            </h2>

            <p className="text-xs text-[#a09e99] leading-relaxed mb-5">
              A competitive <strong className="text-white">{mode}</strong> match is currently in progress against <strong className="text-white">@{opponentParam || 'Opponent'}</strong>.
              Leaving now will count as an immediate voluntary <strong className="text-red-400">resignation</strong>!
            </p>

            {/* Rating Impact Consequence Box */}
            {isRated ? (
              <div className="bg-[#241315] border border-red-500/30 rounded-2xl p-4 mb-6 text-left shadow-inner">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-red-400 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
                    ⚡ Rated Match Penalty
                  </span>
                  <span className="bg-red-500/20 text-red-400 border border-red-500/40 text-[11px] font-bold px-2 py-0.5 rounded-full font-mono">
                    -16 pts
                  </span>
                </div>
                <p className="text-xs text-red-200/80 mb-3">
                  If you resign, your <strong>{mode}</strong> rating will decrease immediately:
                </p>
                <div className="flex items-center justify-between bg-black/40 px-3.5 py-2.5 rounded-xl font-mono text-sm border border-red-500/20">
                  <div className="flex items-center gap-2">
                    <span className="text-white/60 text-xs">Current:</span>
                    <strong className="text-white font-bold">{userModeRating}</strong>
                  </div>
                  <span className="text-red-400 font-bold">→</span>
                  <div className="flex items-center gap-2">
                    <span className="text-white/60 text-xs">New Rating:</span>
                    <strong className="text-red-400 font-black">{Math.max(100, userModeRating - 16)}</strong>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-[#23221e] border border-white/10 rounded-2xl p-4 mb-6 text-left shadow-inner">
                <div className="flex items-center gap-2 mb-1 text-[11px] font-bold text-amber-400">
                  <span>🛡️</span>
                  <span className="uppercase tracking-wider">Non-Rated Match</span>
                </div>
                <p className="text-xs text-[#8c8b88]">
                  This is a practice / non-rated match. Resigning will forfeit the battle, but your rating points will not be reduced.
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowResignModal(false);
                  setPendingNavigationPath('/');
                }}
                disabled={isResigning}
                className="flex-1 bg-[#81b64c] hover:bg-[#92c55b] active:scale-95 text-black font-black text-sm py-3 px-4 rounded-xl transition shadow-lg shadow-[#81b64c]/20 cursor-pointer"
              >
                Keep Fighting
              </button>

              <button
                type="button"
                onClick={handleConfirmResign}
                disabled={isResigning}
                className="flex-1 bg-red-600/20 hover:bg-red-600/30 active:scale-95 border border-red-500/50 text-red-400 hover:text-red-300 font-bold text-sm py-3 px-4 rounded-xl transition cursor-pointer flex items-center justify-center gap-2"
              >
                {isResigning ? (
                  <>
                    <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin"></div>
                    <span>Resigning...</span>
                  </>
                ) : (
                  <span>Resign & Leave</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
