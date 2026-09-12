import axios from 'axios';

const RECENT_SLUGS_KEY = 'dsa_recent_battle_slugs';
const MAX_RECENT_TRACKED = 35;

/**
 * Get recently played / selected battle problem slugs to prevent immediate repetition
 */
export function getRecentSlugs() {
  try {
    const raw = sessionStorage.getItem(RECENT_SLUGS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Record slugs as recently selected
 */
export function recordRecentSlugs(slugs) {
  if (!slugs || !slugs.length) return;
  try {
    const current = getRecentSlugs();
    const updated = Array.from(new Set([...slugs, ...current])).slice(0, MAX_RECENT_TRACKED);
    sessionStorage.setItem(RECENT_SLUGS_KEY, JSON.stringify(updated));
  } catch {
    // Ignore session storage errors
  }
}

/**
 * Fallback static problem catalog spanning easy, medium, and hard
 * Used if API request is offline or unavailable.
 */
const FALLBACK_CATALOG = {
  easy: [
    'two-sum', 'valid-parentheses', 'best-time-to-buy-and-sell-stock',
    'contains-duplicate', 'climbing-stairs', 'maximum-subarray',
    'reverse-linked-list', 'merge-two-sorted-lists', 'symmetric-tree',
    'binary-tree-inorder-traversal', 'invert-binary-tree', 'search-insert-position',
    'plus-one', 'single-number', 'majority-element', 'happy-number',
    'remove-linked-list-elements', 'divisor-game', 'n-th-tribonacci-number'
  ],
  medium: [
    'longest-substring-without-repeating-characters', '3sum', 'lru-cache',
    'container-with-most-water', 'group-anagrams', 'product-of-array-except-self',
    'word-break', 'coin-change', 'course-schedule', 'number-of-islands',
    'house-robber', 'daily-temperatures', 'kth-largest-element-in-an-array',
    'subsets', 'generate-parentheses', 'letter-combinations-of-a-phone-number',
    'different-ways-to-add-parentheses', 'reverse-linked-list-ii'
  ],
  hard: [
    'trapping-rain-water', 'merge-k-sorted-lists', 'median-of-two-sorted-arrays',
    'word-ladder', 'longest-valid-parentheses', 'first-missing-positive',
    'n-queens', 'edit-distance', 'regular-expression-matching',
    'sliding-window-maximum', 'binary-tree-maximum-path-sum'
  ]
};

/**
 * Select N random problems client-side from an array of problem objects or fallback pool
 */
export function selectRandomClientSide({ problemsPool = [], mode = '', difficulty = '', count = 1 }) {
  const reqCount = Math.max(1, Math.min(10, count));
  const recent = getRecentSlugs();

  let candidateSlugs = [];

  if (problemsPool && problemsPool.length > 0) {
    let filtered = problemsPool;
    const diffNorm = (difficulty || '').toLowerCase();
    const modeNorm = (mode || '').toLowerCase();

    if (diffNorm === 'easy' || modeNorm === 'bullet') {
      filtered = problemsPool.filter(p => (p.difficulty || '').toLowerCase() === 'easy');
    } else if (diffNorm === 'medium' || modeNorm === 'rapid') {
      filtered = problemsPool.filter(p => (p.difficulty || '').toLowerCase() === 'medium');
    } else if (diffNorm === 'hard' || modeNorm === 'classical') {
      filtered = problemsPool.filter(p => (p.difficulty || '').toLowerCase() === 'hard');
    } else if (modeNorm === 'blitz') {
      filtered = problemsPool.filter(p => ['easy', 'medium'].includes((p.difficulty || '').toLowerCase()));
    } else if (diffNorm === 'mixed') {
      // Mixed: pick across difficulties
      const easyPool = problemsPool.filter(p => (p.difficulty || '').toLowerCase() === 'easy');
      const medPool = problemsPool.filter(p => (p.difficulty || '').toLowerCase() === 'medium');
      const hardPool = problemsPool.filter(p => (p.difficulty || '').toLowerCase() === 'hard');

      const pickRandomOne = (arr, exclude = []) => {
        const avail = arr.filter(p => !exclude.includes(p.slug));
        const src = avail.length > 0 ? avail : arr;
        return src[Math.floor(Math.random() * src.length)]?.slug;
      };

      const mixedPicks = [];
      if (reqCount === 1) {
        const any = problemsPool[Math.floor(Math.random() * problemsPool.length)]?.slug;
        if (any) mixedPicks.push(any);
      } else if (reqCount === 2) {
        const e = pickRandomOne(easyPool, recent);
        if (e) mixedPicks.push(e);
        const m = pickRandomOne(medPool, [...recent, ...mixedPicks]);
        if (m) mixedPicks.push(m);
      } else {
        const e = pickRandomOne(easyPool, recent);
        if (e) mixedPicks.push(e);
        const m = pickRandomOne(medPool, [...recent, ...mixedPicks]);
        if (m) mixedPicks.push(m);
        const h = pickRandomOne(hardPool, [...recent, ...mixedPicks]);
        if (h) mixedPicks.push(h);
      }

      if (mixedPicks.length >= reqCount) {
        recordRecentSlugs(mixedPicks);
        return mixedPicks;
      }
    }

    candidateSlugs = filtered.map(p => p.slug);
  }

  // Fallback to static lists if candidateSlugs is empty
  if (!candidateSlugs.length) {
    const diffNorm = (difficulty || '').toLowerCase();
    const modeNorm = (mode || '').toLowerCase();
    if (diffNorm === 'easy' || modeNorm === 'bullet') {
      candidateSlugs = FALLBACK_CATALOG.easy;
    } else if (diffNorm === 'medium' || modeNorm === 'rapid') {
      candidateSlugs = FALLBACK_CATALOG.medium;
    } else if (diffNorm === 'hard' || modeNorm === 'classical') {
      candidateSlugs = FALLBACK_CATALOG.hard;
    } else if (modeNorm === 'blitz') {
      candidateSlugs = [...FALLBACK_CATALOG.easy, ...FALLBACK_CATALOG.medium];
    } else {
      candidateSlugs = [...FALLBACK_CATALOG.easy, ...FALLBACK_CATALOG.medium, ...FALLBACK_CATALOG.hard];
    }
  }

  // Exclude recent slugs if enough items remain
  let available = candidateSlugs.filter(s => !recent.includes(s));
  if (available.length < reqCount) {
    available = candidateSlugs;
  }

  // Fisher-Yates shuffle
  const shuffled = [...available].sort(() => Math.random() - 0.5);
  const picked = shuffled.slice(0, reqCount);

  recordRecentSlugs(picked);
  return picked;
}

/**
 * Fetch random battle problems from server API (with exclude filter and full DB aggregation)
 * Falls back to client-side random generation if network is unavailable.
 */
export async function fetchRandomBattleProblems({ mode = '', difficulty = '', count = 1, problemsPool = [] } = {}) {
  const recent = getRecentSlugs();
  const excludeParam = recent.slice(0, 25).join(',');

  try {
    const params = new URLSearchParams();
    if (count) params.append('count', count.toString());
    if (mode) params.append('mode', mode);
    if (difficulty) params.append('difficulty', difficulty);
    if (excludeParam) params.append('exclude', excludeParam);

    const res = await axios.get(`http://localhost:5000/api/problems/random?${params.toString()}`, { timeout: 3500 });
    if (res.data?.slugs && Array.isArray(res.data.slugs) && res.data.slugs.length > 0) {
      recordRecentSlugs(res.data.slugs);
      return res.data.slugs;
    }
  } catch (err) {
    console.warn('Random problems API failed, using client-side fallback:', err.message);
  }

  return selectRandomClientSide({ problemsPool, mode, difficulty, count });
}
