import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

export const getDifficultyBadge = (difficulty) => {
  switch (difficulty?.toLowerCase()) {
    case 'easy':
      return 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30';
    case 'medium':
      return 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/30';
    case 'hard':
      return 'bg-danger/15 text-danger border border-danger/30';
    default:
      return 'bg-surface text-textMuted border border-white/10';
  }
};

const POPULAR_TOPICS = [
  'All',
  'Array',
  'String',
  'Dynamic Programming',
  'Tree',
  'Binary Search',
  'Hash Table',
  'Two Pointers',
  'Linked List',
  'Stack',
  'Backtracking',
  'Heap',
  'Greedy',
  'Math',
  'Bit Manipulation',
  'Design'
];

export default function TrainingGround() {
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState('all');
  const [selectedTopic, setSelectedTopic] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [lastActive, setLastActive] = useState(null);

  useEffect(() => {
    const fetchProblems = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/problems');
        if (Array.isArray(res.data)) {
          setProblems(res.data);
        } else if (res.data?.problems) {
          setProblems(res.data.problems);
        }
      } catch (err) {
        console.error('Failed to load problems from API:', err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchProblems();

    // Fetch user's last active practice problem
    const fetchLastActive = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;
      try {
        const res = await axios.get('http://localhost:5000/api/problems/practice/last-active', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data?.hasActivePractice) {
          setLastActive(res.data);
        }
      } catch (err) {
        // quiet error
      }
    };
    fetchLastActive();
  }, []);

  // Compute counts
  const stats = useMemo(() => {
    let easy = 0, medium = 0, hard = 0;
    problems.forEach(p => {
      const diff = p.difficulty?.toLowerCase();
      if (diff === 'easy') easy++;
      else if (diff === 'medium') medium++;
      else if (diff === 'hard') hard++;
    });
    return { total: problems.length, easy, medium, hard };
  }, [problems]);

  // Filtered problem set
  const filteredProblems = useMemo(() => {
    return problems.filter(p => {
      // Difficulty match
      if (filterDifficulty !== 'all' && p.difficulty?.toLowerCase() !== filterDifficulty.toLowerCase()) {
        return false;
      }

      // Topic match
      if (selectedTopic !== 'All') {
        const hasTopic = p.tags?.some(tag => tag.toLowerCase().includes(selectedTopic.toLowerCase()));
        if (!hasTopic) return false;
      }

      // Search match
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const inTitle = p.title?.toLowerCase().includes(q);
        const inSlug = p.slug?.toLowerCase().includes(q);
        const inTags = p.tags?.some(t => t.toLowerCase().includes(q));
        if (!inTitle && !inSlug && !inTags) return false;
      }

      return true;
    });
  }, [problems, filterDifficulty, selectedTopic, searchQuery]);

  // Reset page on filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filterDifficulty, selectedTopic, searchQuery, pageSize]);

  // Pagination slice
  const totalPages = Math.max(1, Math.ceil(filteredProblems.length / pageSize));
  const paginatedProblems = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredProblems.slice(start, start + pageSize);
  }, [filteredProblems, currentPage, pageSize]);

  // Extract LC number tag helper
  const getLcRef = (tags) => {
    if (!tags) return null;
    const lcTag = tags.find(t => /^LC-\d+$/i.test(t));
    return lcTag || null;
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Banner & Stats */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 pb-2 border-b border-white/10">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Training <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400">Ground</span>
          </h1>
        </div>

        {/* Quick Stats Cards */}
        <div className="grid grid-cols-4 gap-2 sm:gap-3 w-full lg:w-auto">
          <div className="glass-panel px-3 py-2 text-center rounded-xl border border-white/10">
            <div className="text-xs text-textMuted font-medium uppercase tracking-wider">Total</div>
            <div className="text-lg sm:text-xl font-black text-white">{stats.total}</div>
          </div>
          <div className="glass-panel px-3 py-2 text-center rounded-xl border border-emerald-500/20 bg-emerald-500/5">
            <div className="text-xs text-emerald-400 font-medium uppercase tracking-wider">Easy</div>
            <div className="text-lg sm:text-xl font-black text-emerald-400">{stats.easy}</div>
          </div>
          <div className="glass-panel px-3 py-2 text-center rounded-xl border border-yellow-500/20 bg-yellow-500/5">
            <div className="text-xs text-yellow-400 font-medium uppercase tracking-wider">Medium</div>
            <div className="text-lg sm:text-xl font-black text-yellow-400">{stats.medium}</div>
          </div>
          <div className="glass-panel px-3 py-2 text-center rounded-xl border border-danger/20 bg-danger/5">
            <div className="text-xs text-danger font-medium uppercase tracking-wider">Hard</div>
            <div className="text-lg sm:text-xl font-black text-danger">{stats.hard}</div>
          </div>
        </div>
      </div>

      {/* CONTINUE WHERE YOU LEFT OFF BANNER */}
      {lastActive?.hasActivePractice && (
        <div className="bg-gradient-to-r from-emerald-950/40 via-[#1f291e] to-[#1a2118] border border-emerald-500/30 hover:border-emerald-500/50 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl backdrop-blur-md transition">
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-2xl flex-shrink-0 shadow-inner">
              🎯
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                  Continue Where You Left Off
                </span>
                <span className="text-xs text-textMuted">• Auto-saved code ready</span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white truncate mt-1">
                {lastActive.title}
              </h3>
              <div className="flex items-center gap-2 text-xs text-textMuted mt-0.5">
                <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${getDifficultyBadge(lastActive.difficulty)}`}>
                  {lastActive.difficulty}
                </span>
                <span>•</span>
                <span className="font-mono text-white/70 uppercase text-[11px]">{lastActive.language || 'C++'}</span>
                <span>•</span>
                <span>+{lastActive.points || 3} pts</span>
              </div>
            </div>
          </div>

          <Link
            to={`/problem/${lastActive.slug}`}
            className="w-full sm:w-auto bg-[#81b64c] hover:bg-[#92c55b] text-white font-bold text-xs sm:text-sm px-5 py-2.5 rounded-xl transition shadow-lg flex items-center justify-center gap-2 flex-shrink-0 cursor-pointer"
          >
            <span>▶ Resume Problem</span>
            <span>→</span>
          </Link>
        </div>
      )}

      {/* Interactive Controls & Filters */}
      <div className="glass-panel p-4 sm:p-5 rounded-2xl border border-white/10 space-y-4">
        {/* Search & Difficulty Bar */}
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Search Box */}
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-textMuted">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title, tag, slug, or LC reference (e.g. LC-1, two-sum, tree, DP)..."
              className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-surface/70 border border-white/10 text-white placeholder-textMuted text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-textMuted hover:text-white transition"
              >
                ✕
              </button>
            )}
          </div>

          {/* Difficulty Tabs */}
          <div className="flex items-center bg-surface/80 p-1 rounded-xl border border-white/10 self-start md:self-auto">
            <button
              onClick={() => setFilterDifficulty('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                filterDifficulty === 'all'
                  ? 'bg-primary text-white shadow-md'
                  : 'text-textMuted hover:text-white'
              }`}
            >
              All ({problems.length})
            </button>
            <button
              onClick={() => setFilterDifficulty('easy')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                filterDifficulty === 'easy'
                  ? 'bg-emerald-500 text-white shadow-md'
                  : 'text-textMuted hover:text-emerald-400'
              }`}
            >
              Easy ({stats.easy})
            </button>
            <button
              onClick={() => setFilterDifficulty('medium')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                filterDifficulty === 'medium'
                  ? 'bg-yellow-500 text-black shadow-md'
                  : 'text-textMuted hover:text-yellow-400'
              }`}
            >
              Medium ({stats.medium})
            </button>
            <button
              onClick={() => setFilterDifficulty('hard')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                filterDifficulty === 'hard'
                  ? 'bg-danger text-white shadow-md'
                  : 'text-textMuted hover:text-danger'
              }`}
            >
              Hard ({stats.hard})
            </button>
          </div>

          {/* Page Size Selector */}
          <div className="flex items-center gap-2 self-end md:self-auto">
            <span className="text-xs text-textMuted font-medium">Show:</span>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="bg-surface border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-primary transition cursor-pointer"
            >
              <option value={15}>15</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>

        {/* Topic Tag Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin text-xs">
          <span className="text-textMuted font-semibold text-xs whitespace-nowrap mr-1">Topic:</span>
          {POPULAR_TOPICS.map(topic => (
            <button
              key={topic}
              onClick={() => setSelectedTopic(topic)}
              className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition border ${
                selectedTopic === topic
                  ? 'bg-white/15 text-white border-white/30 shadow-sm'
                  : 'bg-surface/50 text-textMuted border-white/5 hover:bg-surface hover:text-white'
              }`}
            >
              {topic}
            </button>
          ))}
        </div>
      </div>

      {/* Problems Table */}
      <div className="glass-panel overflow-hidden border border-white/10 rounded-2xl shadow-xl">
        {loading ? (
          <div className="py-24 text-center">
            <div className="inline-block w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin mb-3"></div>
            <div className="text-textMuted text-sm font-medium">Loading problem library...</div>
          </div>
        ) : filteredProblems.length === 0 ? (
          <div className="py-20 text-center space-y-3">
            <div className="text-4xl">🔍</div>
            <div className="text-lg font-bold text-white">No challenges match your criteria</div>
            <p className="text-sm text-textMuted max-w-sm mx-auto">
              Try adjusting your search query, topic filter, or difficulty settings.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setFilterDifficulty('all');
                setSelectedTopic('All');
              }}
              className="mt-2 px-4 py-1.5 bg-primary/20 text-primary border border-primary/30 rounded-xl text-xs font-bold hover:bg-primary/30 transition"
            >
              Reset All Filters
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-surface/60 text-textMuted text-xs uppercase tracking-wider">
                  <th className="p-4 font-semibold w-12 text-center">Ref</th>
                  <th className="p-4 font-semibold">Title & Challenge</th>
                  <th className="p-4 font-semibold w-28">Difficulty</th>
                  <th className="p-4 font-semibold w-24">Points</th>
                  <th className="p-4 font-semibold">Topics</th>
                  <th className="p-4 font-semibold w-28 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {paginatedProblems.map((p, idx) => {
                  const lcRef = getLcRef(p.tags);
                  const displayTags = (p.tags || []).filter(t => !t.startsWith('LC-'));

                  return (
                    <tr 
                      key={p.slug || idx} 
                      className="hover:bg-white/[0.03] transition-colors group"
                    >
                      {/* LC Reference Badge */}
                      <td className="p-4 text-center">
                        {lcRef ? (
                          <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20">
                            {lcRef}
                          </span>
                        ) : (
                          <span className="font-mono text-xs text-textMuted">#{(currentPage - 1) * pageSize + idx + 1}</span>
                        )}
                      </td>

                      {/* Title & Link */}
                      <td className="p-4">
                        <Link 
                          to={`/problem/${p.slug}`} 
                          className="font-bold text-white group-hover:text-primary transition flex items-center gap-2"
                        >
                          <span>{p.title}</span>
                          <span className="text-xs text-textMuted font-mono opacity-0 group-hover:opacity-100 transition">
                            →
                          </span>
                        </Link>
                        <div className="text-xs text-textMuted/70 font-mono mt-0.5 truncate max-w-md">
                          /{p.slug}
                        </div>
                      </td>

                      {/* Difficulty Badge */}
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-md text-xs font-bold inline-block ${getDifficultyBadge(p.difficulty)}`}>
                          {p.difficulty}
                        </span>
                      </td>

                      {/* Points */}
                      <td className="p-4 text-sm font-semibold text-textMuted">
                        <span className="text-white font-mono">{p.points || 5}</span> pts
                      </td>

                      {/* Topic Tags */}
                      <td className="p-4">
                        <div className="flex gap-1.5 flex-wrap max-w-md">
                          {displayTags.map(tag => (
                            <button
                              key={tag}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedTopic(tag);
                              }}
                              className="bg-surface/80 hover:bg-surface px-2 py-0.5 rounded text-xs border border-white/5 text-textMuted hover:text-white font-mono transition cursor-pointer"
                            >
                              {tag}
                            </button>
                          ))}
                        </div>
                      </td>

                      {/* Action Button */}
                      <td className="p-4 text-right">
                        <Link
                          to={`/problem/${p.slug}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-white/5 hover:bg-primary hover:text-white border border-white/10 hover:border-primary text-textMuted transition"
                        >
                          <span>Solve</span>
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                          </svg>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {!loading && filteredProblems.length > 0 && (
          <div className="p-4 border-t border-white/10 bg-surface/40 flex flex-col sm:flex-row justify-between items-center gap-3">
            <div className="text-xs text-textMuted">
              Showing <span className="text-white font-medium">{(currentPage - 1) * pageSize + 1}</span> to{' '}
              <span className="text-white font-medium">
                {Math.min(currentPage * pageSize, filteredProblems.length)}
              </span>{' '}
              of <span className="text-white font-medium">{filteredProblems.length}</span> problems
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center gap-1.5">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(1)}
                className="px-2.5 py-1 rounded-lg text-xs font-medium border border-white/10 bg-surface text-textMuted hover:text-white disabled:opacity-40 disabled:pointer-events-none transition"
              >
                «
              </button>
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                className="px-3 py-1 rounded-lg text-xs font-medium border border-white/10 bg-surface text-textMuted hover:text-white disabled:opacity-40 disabled:pointer-events-none transition"
              >
                Prev
              </button>

              {/* Page Number Indicators */}
              <div className="flex items-center gap-1 px-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(page => {
                    return (
                      page === 1 ||
                      page === totalPages ||
                      Math.abs(page - currentPage) <= 2
                    );
                  })
                  .map((page, idx, arr) => {
                    const prev = arr[idx - 1];
                    const hasGap = prev && page - prev > 1;

                    return (
                      <span key={page} className="flex items-center gap-1">
                        {hasGap && <span className="text-textMuted text-xs px-1">…</span>}
                        <button
                          onClick={() => setCurrentPage(page)}
                          className={`w-7 h-7 rounded-lg text-xs font-bold transition ${
                            currentPage === page
                              ? 'bg-primary text-white shadow-md'
                              : 'bg-surface/60 text-textMuted hover:text-white hover:bg-surface border border-white/5'
                          }`}
                        >
                          {page}
                        </button>
                      </span>
                    );
                  })}
              </div>

              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                className="px-3 py-1 rounded-lg text-xs font-medium border border-white/10 bg-surface text-textMuted hover:text-white disabled:opacity-40 disabled:pointer-events-none transition"
              >
                Next
              </button>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(totalPages)}
                className="px-2.5 py-1 rounded-lg text-xs font-medium border border-white/10 bg-surface text-textMuted hover:text-white disabled:opacity-40 disabled:pointer-events-none transition"
              >
                »
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
