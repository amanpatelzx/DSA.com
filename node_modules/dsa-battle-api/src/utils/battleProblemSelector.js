import Problem from '../models/Problem.js';

/**
 * Dynamically selects random battle problems on the backend based on mode, difficulty, and count.
 * Keeps problem selection secure and unknown to players until the match starts.
 */
export const selectBattleProblems = async ({ mode = 'Bullet', difficulty = '', count = 1 } = {}) => {
  const reqCount = Math.max(1, Math.min(10, parseInt(count, 10) || 1));
  const diffNorm = (difficulty || '').toLowerCase();
  const modeNorm = (mode || '').toLowerCase();

  let diffFilter = null;
  if (diffNorm === 'easy' || modeNorm === 'bullet') {
    diffFilter = 'Easy';
  } else if (diffNorm === 'medium' || modeNorm === 'rapid') {
    diffFilter = 'Medium';
  } else if (diffNorm === 'hard' || modeNorm === 'classical') {
    diffFilter = 'Hard';
  } else if (modeNorm === 'blitz') {
    diffFilter = ['Easy', 'Medium'];
  }

  let query = { status: 'ACTIVE' };
  if (diffFilter) {
    if (Array.isArray(diffFilter)) {
      query.difficulty = { $in: diffFilter };
    } else {
      query.difficulty = diffFilter;
    }
  }

  try {
    const matched = await Problem.find(query, 'slug difficulty').lean();
    if (matched && matched.length > 0) {
      // Shuffle array randomly
      const shuffled = [...matched].sort(() => 0.5 - Math.random());
      const selected = shuffled.slice(0, reqCount).map(p => p.slug);
      if (selected.length > 0) {
        return selected;
      }
    }
  } catch (err) {
    console.error('Error selecting battle problems from DB:', err);
  }

  // Robust fallback catalog if DB query returns empty or errors
  const fallbackCatalog = [
    'two-sum',
    'valid-parentheses',
    'best-time-to-buy-and-sell-stock',
    'longest-substring-without-repeating-characters',
    '3sum',
    'contains-duplicate',
    'climbing-stairs'
  ];
  const shuffledFallback = [...fallbackCatalog].sort(() => 0.5 - Math.random());
  return shuffledFallback.slice(0, reqCount);
};
