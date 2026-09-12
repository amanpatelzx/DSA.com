import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

export default function Learn() {
  const { user, token, isLoggedIn } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [topics, setTopics] = useState([]);
  const [loadingTopics, setLoadingTopics] = useState(true);

  // Active topic & subtopic slugs from URL or default
  const activeTopicSlug = searchParams.get('topic') || 'arrays';
  const activeSubtopicSlug = searchParams.get('subtopic') || 'two-pointers';

  // State for selected topic/subtopic
  const [expandedTopic, setExpandedTopic] = useState(activeTopicSlug);
  const [articleData, setArticleData] = useState(null);
  const [loadingArticle, setLoadingArticle] = useState(true);

  // Multi-language code snippet tab
  const [selectedLang, setSelectedLang] = useState('cpp');
  const [copied, setCopied] = useState(false);

  // Discussion comments state
  const [comments, setComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [commentError, setCommentError] = useState('');

  // Topic search filter
  const [searchQuery, setSearchQuery] = useState('');

  // 1. Fetch Topics list
  useEffect(() => {
    const fetchTopics = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/learn/topics');
        if (res.data?.topics) {
          setTopics(res.data.topics);
        }
      } catch (err) {
        console.error('Failed to load DSA topics:', err);
      } finally {
        setLoadingTopics(false);
      }
    };
    fetchTopics();
  }, []);

  // 2. Fetch selected Article
  useEffect(() => {
    const fetchArticle = async () => {
      setLoadingArticle(true);
      try {
        const res = await axios.get(
          `http://localhost:5000/api/learn/article/${activeTopicSlug}/${activeSubtopicSlug}`
        );
        if (res.data?.article) {
          setArticleData(res.data);
        }
      } catch (err) {
        console.error('Failed to load article:', err);
      } finally {
        setLoadingArticle(false);
      }
    };

    if (activeTopicSlug && activeSubtopicSlug) {
      fetchArticle();
      setExpandedTopic(activeTopicSlug);
    }
  }, [activeTopicSlug, activeSubtopicSlug]);

  // 3. Fetch Comments for current subtopic
  useEffect(() => {
    const fetchComments = async () => {
      setLoadingComments(true);
      try {
        const res = await axios.get(
          `http://localhost:5000/api/learn/comments/${activeSubtopicSlug}`
        );
        if (res.data?.comments) {
          setComments(res.data.comments);
        }
      } catch (err) {
        console.error('Failed to load comments:', err);
      } finally {
        setLoadingComments(false);
      }
    };

    if (activeSubtopicSlug) {
      fetchComments();
    }
  }, [activeSubtopicSlug]);

  // Select a subtopic
  const handleSelectSubtopic = (topicSlug, subtopicSlug) => {
    setSearchParams({ topic: topicSlug, subtopic: subtopicSlug });
  };

  // Copy code handler
  const handleCopyCode = (codeText) => {
    if (!codeText) return;
    navigator.clipboard.writeText(codeText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Submit comment
  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    if (!token) {
      setCommentError('Please log in to participate in the discussion.');
      return;
    }

    setSubmittingComment(true);
    setCommentError('');

    try {
      const res = await axios.post(
        `http://localhost:5000/api/learn/comments/${activeSubtopicSlug}`,
        { content: newComment.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data?.comment) {
        setComments(prev => [res.data.comment, ...prev]);
        setNewComment('');
      }
    } catch (err) {
      setCommentError(err.response?.data?.message || 'Failed to post comment.');
    } finally {
      setSubmittingComment(false);
    }
  };

  // Upvote comment
  const handleUpvote = async (commentId) => {
    if (!token) {
      setCommentError('Please log in to upvote comments.');
      return;
    }

    try {
      const res = await axios.post(
        `http://localhost:5000/api/learn/comments/${commentId}/upvote`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data?.success) {
        setComments(prev =>
          prev.map(c =>
            c.id === commentId ? { ...c, upvotes: res.data.upvotes } : c
          )
        );
      }
    } catch (err) {
      console.error('Upvote failed:', err);
    }
  };

  // Filter topics by search query
  const filteredTopics = topics.filter(t => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const titleMatch = t.title.toLowerCase().includes(q);
    const subtopicMatch = t.subtopics.some(s => s.title.toLowerCase().includes(q));
    return titleMatch || subtopicMatch;
  });

  const article = articleData?.article;
  const topicMeta = articleData?.topic;

  return (
    <div className="min-h-screen bg-[#161513] text-[#c3c2bf] flex flex-col">
      {/* Header Bar */}
      <div className="border-b border-[#2d2a26] bg-[#1e1d1a]/80 backdrop-blur-md px-6 py-4 sticky top-0 z-30 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 via-[#81b64c] to-lime-400 flex items-center justify-center text-white font-bold shadow-md">
            &lt;/&gt;
          </div>
          <div>
            <h1 className="text-lg font-extrabold text-white leading-tight">
              DSA <span className="text-[#81b64c]">Knowledge Base</span>
            </h1>
            <p className="text-xs text-[#7d7c78]">
              Interactive theory, visualized figures, production code, and discussion
            </p>
          </div>
        </div>

        {article?.practiceSlug && (
          <Link
            to={`/problem/${article.practiceSlug}`}
            className="hidden sm:flex items-center gap-2 bg-[#81b64c] hover:bg-[#92c55b] text-white text-xs font-bold px-4 py-2 rounded-xl transition shadow-md"
          >
            <span>⚔️</span>
            <span>Practice in Arena</span>
          </Link>
        )}
      </div>

      {/* Main Content Layout */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN: DSA Topic Taxonomy (4 cols on lg) */}
        <div className="lg:col-span-4 flex flex-col gap-4 sticky top-24">
          <div className="bg-[#21201d] border border-[#2d2a26] rounded-2xl p-4 shadow-xl">
            {/* Search Box */}
            <div className="relative mb-4">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search topics (e.g., Sliding Window, Trees)..."
                className="w-full bg-[#181715] text-xs text-white placeholder-[#7d7c78] px-3.5 py-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-[#81b64c] transition"
              />
              <span className="absolute right-3 top-2.5 text-xs text-[#7d7c78]">🔍</span>
            </div>

            <h2 className="text-xs font-bold uppercase tracking-wider text-[#7d7c78] mb-3 px-1">
              Data Structures & Algorithms ({topics.length})
            </h2>

            {loadingTopics ? (
              <div className="flex flex-col gap-2 py-8 items-center text-xs text-[#7d7c78]">
                <div className="w-6 h-6 border-2 border-[#81b64c]/30 border-t-[#81b64c] rounded-full animate-spin"></div>
                <span>Loading roadmap topics...</span>
              </div>
            ) : (
              <div className="flex flex-col gap-1.5 max-h-[calc(100vh-250px)] overflow-y-auto pr-1">
                {filteredTopics.map((t) => {
                  const isExpanded = expandedTopic === t.slug;
                  const isActiveCategory = activeTopicSlug === t.slug;

                  return (
                    <div key={t.id} className="rounded-xl overflow-hidden border border-white/5 bg-[#1a1916]">
                      {/* Topic Category Button */}
                      <button
                        onClick={() => setExpandedTopic(isExpanded ? '' : t.slug)}
                        className={`w-full flex items-center justify-between p-3 text-left transition ${
                          isActiveCategory ? 'bg-[#2b2926]' : 'hover:bg-[#24221f]'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="text-base">{t.icon}</span>
                          <span className="text-xs sm:text-sm font-bold text-white truncate">
                            {t.title}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-white/5 text-[#8c8b88]">
                            {t.subtopicsCount}
                          </span>
                          <span className={`text-xs text-[#7d7c78] transform transition-transform ${isExpanded ? 'rotate-90' : ''}`}>
                            ▸
                          </span>
                        </div>
                      </button>

                      {/* Subtopics Accordion Drawer */}
                      {isExpanded && (
                        <div className="bg-[#161513] px-2 py-1.5 border-t border-[#2d2a26] flex flex-col gap-1">
                          {t.subtopics.map((sub) => {
                            const isSelected = activeSubtopicSlug === sub.slug && activeTopicSlug === t.slug;

                            return (
                              <button
                                key={sub.id}
                                onClick={() => handleSelectSubtopic(t.slug, sub.slug)}
                                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition text-left cursor-pointer ${
                                  isSelected
                                    ? 'bg-[#81b64c] text-white shadow-md font-bold'
                                    : 'text-[#9e9d9a] hover:bg-[#262421] hover:text-white'
                                }`}
                              >
                                <div className="flex items-center gap-2 truncate pr-2">
                                  <span className={isSelected ? 'text-white' : 'text-[#81b64c]'}>
                                    •
                                  </span>
                                  <span className="truncate">{sub.title}</span>
                                </div>
                                <span className={`text-[10px] uppercase font-mono px-1.5 py-0.5 rounded ${
                                  isSelected 
                                    ? 'bg-black/20 text-white' 
                                    : 'bg-white/5 text-[#7d7c78]'
                                }`}>
                                  {sub.readTime}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Rich Visual Article & Community Comments (8 cols on lg) */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {loadingArticle ? (
            <div className="bg-[#21201d] border border-[#2d2a26] rounded-2xl p-16 flex flex-col items-center justify-center gap-3">
              <div className="w-10 h-10 border-4 border-[#81b64c]/20 border-t-[#81b64c] rounded-full animate-spin"></div>
              <p className="text-white/60 text-sm font-medium">Loading illustrated tutorial...</p>
            </div>
          ) : article ? (
            <>
              {/* Article Card */}
              <article className="bg-[#21201d] border border-[#2d2a26] rounded-2xl p-6 sm:p-8 shadow-xl">
                
                {/* Meta Header */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-6 border-b border-[#2d2a26]">
                  <div className="flex items-center gap-2 text-xs text-[#7d7c78]">
                    <span>{topicMeta?.icon}</span>
                    <span>{topicMeta?.title}</span>
                    <span>/</span>
                    <span className="text-white font-semibold">{article.title}</span>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                      {article.difficulty}
                    </span>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-blue-500/15 text-blue-400 border border-blue-500/30">
                      ⏱ {article.readTime}
                    </span>
                  </div>
                </div>

                {/* Article Title */}
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-6 mb-3">
                  {article.title}
                </h1>
                
                <p className="text-sm sm:text-base text-[#9e9d9a] leading-relaxed mb-6 font-medium">
                  {article.summary}
                </p>

                {/* VISUAL DIAGRAM / FIGURE */}
                {article.figure && (
                  <div className="my-6 rounded-xl overflow-hidden border border-[#81b64c]/30 bg-[#161513] shadow-lg">
                    <div className="bg-[#1e1d1a] px-4 py-2 border-b border-[#2d2a26] flex items-center justify-between">
                      <span className="text-xs font-bold text-[#81b64c] flex items-center gap-1.5">
                        <span>📊</span>
                        <span>Architectural Diagram & Concept Figure</span>
                      </span>
                      <span className="text-[10px] text-[#7d7c78] font-mono">Visual Representation</span>
                    </div>
                    <pre className="p-4 sm:p-5 font-mono text-xs sm:text-sm text-emerald-300 overflow-x-auto leading-relaxed whitespace-pre selection:bg-emerald-900">
                      {article.figure.trim()}
                    </pre>
                  </div>
                )}

                {/* CORE CONCEPT SECTION */}
                <div className="my-8">
                  <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#81b64c]"></span>
                    <span>Core Intuition & Theory</span>
                  </h2>
                  <div className="text-sm text-[#c3c2bf] leading-relaxed space-y-4 whitespace-pre-line font-normal">
                    {article.concept.trim()}
                  </div>
                </div>

                {/* STEP-BY-STEP EXAMPLE WALKTHROUGH */}
                {article.exampleTrace && (
                  <div className="my-8 bg-[#1a1916] border border-white/10 rounded-xl p-5">
                    <h2 className="text-base font-bold text-white mb-2 flex items-center gap-2">
                      <span>🔍</span>
                      <span>Execution Walkthrough & Tracing</span>
                    </h2>
                    <div className="text-sm text-[#9e9d9a] leading-relaxed whitespace-pre-line font-mono text-xs sm:text-sm">
                      {article.exampleTrace.trim()}
                    </div>
                  </div>
                )}

                {/* MULTI-LANGUAGE CODE SNIPPETS */}
                <div className="my-8">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#81b64c]"></span>
                      <span>Production Implementation</span>
                    </h2>

                    {/* Language Switch Tabs */}
                    <div className="flex items-center p-1 bg-[#181715] rounded-xl border border-white/10 text-xs font-mono font-bold">
                      {['cpp', 'python', 'javascript'].map(lang => (
                        <button
                          key={lang}
                          onClick={() => setSelectedLang(lang)}
                          className={`px-3 py-1.5 rounded-lg transition cursor-pointer uppercase ${
                            selectedLang === lang
                              ? 'bg-[#81b64c] text-white shadow-sm'
                              : 'text-[#7d7c78] hover:text-white'
                          }`}
                        >
                          {lang === 'cpp' ? 'C++20' : lang === 'python' ? 'Python 3' : 'JS'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Code Container */}
                  <div className="rounded-xl overflow-hidden border border-white/10 bg-[#161513] shadow-inner">
                    <div className="bg-[#1f1e1b] px-4 py-2 flex items-center justify-between border-b border-[#2d2a26]">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                        <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                        <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
                        <span className="text-[11px] text-[#7d7c78] font-mono ml-2">
                          solution.{selectedLang === 'cpp' ? 'cpp' : selectedLang === 'python' ? 'py' : 'js'}
                        </span>
                      </div>

                      <button
                        onClick={() => handleCopyCode(article.codeSnippets?.[selectedLang])}
                        className="text-xs font-semibold text-[#81b64c] hover:text-white transition flex items-center gap-1 cursor-pointer"
                      >
                        {copied ? '✓ Copied!' : 'Copy Code'}
                      </button>
                    </div>

                    <pre className="p-4 sm:p-5 font-mono text-xs sm:text-sm text-yellow-100 overflow-x-auto leading-relaxed">
                      <code>{article.codeSnippets?.[selectedLang] || '// Code snippet unavailable'}</code>
                    </pre>
                  </div>
                </div>

                {/* COMPLEXITY ANALYSIS */}
                <div className="my-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-[#1b1917] border border-white/10 rounded-xl p-4">
                    <div className="text-xs font-bold text-[#81b64c] uppercase tracking-wider mb-1">
                      Time Complexity
                    </div>
                    <div className="text-sm font-semibold text-white">
                      {article.complexities?.time}
                    </div>
                  </div>

                  <div className="bg-[#1b1917] border border-white/10 rounded-xl p-4">
                    <div className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-1">
                      Space Complexity
                    </div>
                    <div className="text-sm font-semibold text-white">
                      {article.complexities?.space}
                    </div>
                  </div>
                </div>

                {/* ARENA CTA BANNER */}
                {article.practiceSlug && (
                  <div className="mt-8 bg-gradient-to-r from-[#223318] to-[#1c2914] border border-[#81b64c]/40 rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div>
                      <h3 className="text-base sm:text-lg font-extrabold text-white">
                        Put theory into practice: {article.practiceTitle}
                      </h3>
                      <p className="text-xs sm:text-sm text-[#a3c483] mt-1">
                        Battle against live players or test your solution against real hidden test cases in the Arena IDE.
                      </p>
                    </div>
                    <Link
                      to={`/problem/${article.practiceSlug}`}
                      className="bg-[#81b64c] hover:bg-[#92c55b] text-white font-bold text-xs sm:text-sm px-5 py-3 rounded-xl transition shadow-lg flex-shrink-0 cursor-pointer text-center"
                    >
                      Solve Problem Now ⚔️
                    </Link>
                  </div>
                )}
              </article>

              {/* COMMUNITY DISCUSSION & COMMENTS SECTION */}
              <section className="bg-[#21201d] border border-[#2d2a26] rounded-2xl p-6 sm:p-8 shadow-xl">
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#2d2a26]">
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <span>💬</span>
                    <span>Community Discussion</span>
                    <span className="text-xs font-normal text-[#7d7c78]">({comments.length})</span>
                  </h2>
                  <span className="text-xs text-[#7d7c78]">Share insights & ask questions</span>
                </div>

                {/* Comment Input Box */}
                <form onSubmit={handleCommentSubmit} className="mb-8">
                  {commentError && (
                    <div className="bg-danger/15 border border-danger/40 text-danger text-xs px-3.5 py-2 rounded-xl mb-3 flex items-center gap-2">
                      <span>⚠️</span>
                      <span>{commentError}</span>
                    </div>
                  )}

                  <div className="flex gap-3 items-start">
                    <div className="w-9 h-9 rounded-xl bg-[#81b64c] text-white font-bold flex items-center justify-center text-sm shadow-md flex-shrink-0">
                      {user?.username ? user.username.charAt(0).toUpperCase() : '?'}
                    </div>

                    <div className="flex-1 flex flex-col gap-2">
                      <textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder={isLoggedIn ? "Write a helpful explanation, query, or optimization hint..." : "Please log in to leave a comment."}
                        disabled={!isLoggedIn || submittingComment}
                        rows={3}
                        className="w-full bg-[#181715] text-xs sm:text-sm text-white placeholder-[#7d7c78] p-3 rounded-xl border border-white/10 focus:outline-none focus:border-[#81b64c] transition disabled:opacity-50"
                      />

                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-[#7d7c78]">
                          {isLoggedIn ? `Posting as @${user?.username}` : <Link to="/login" className="text-[#81b64c] hover:underline font-bold">Log in to comment</Link>}
                        </span>

                        <button
                          type="submit"
                          disabled={!isLoggedIn || submittingComment || !newComment.trim()}
                          className="bg-[#81b64c] hover:bg-[#92c55b] disabled:opacity-40 text-white font-bold text-xs px-5 py-2 rounded-xl transition cursor-pointer shadow-md"
                        >
                          {submittingComment ? 'Posting...' : 'Post Comment'}
                        </button>
                      </div>
                    </div>
                  </div>
                </form>

                {/* Comments List */}
                {loadingComments ? (
                  <div className="py-6 text-center text-xs text-[#7d7c78]">Loading comments...</div>
                ) : comments.length === 0 ? (
                  <div className="py-8 text-center text-xs text-[#7d7c78] bg-[#1a1916] rounded-xl border border-white/5">
                    No comments yet. Be the first to share an explanation or question on this topic!
                  </div>
                ) : (
                  <div className="flex flex-col divide-y divide-[#2a2825]">
                    {comments.map((c) => (
                      <div key={c.id} className="py-4 flex gap-3.5 items-start">
                        <div className="w-8 h-8 rounded-lg bg-[#2e2c28] border border-white/10 text-white font-bold flex items-center justify-center text-xs shadow-sm flex-shrink-0">
                          {c.userAvatar || c.username?.charAt(0).toUpperCase() || 'U'}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-white">
                                {c.displayName || c.username}
                              </span>
                              <span className="text-[10px] text-[#7d7c78] font-mono">
                                @{c.username}
                              </span>
                            </div>

                            <span className="text-[10px] text-[#7d7c78]">
                              {new Date(c.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </span>
                          </div>

                          <p className="text-xs sm:text-sm text-[#d4d3cf] leading-relaxed break-words whitespace-pre-line">
                            {c.content}
                          </p>

                          {/* Upvote Button */}
                          <div className="mt-2.5 flex items-center gap-3">
                            <button
                              onClick={() => handleUpvote(c.id)}
                              className="flex items-center gap-1.5 text-xs text-[#8c8b88] hover:text-[#81b64c] transition cursor-pointer"
                            >
                              <span>▲</span>
                              <span className="font-semibold">{c.upvotes || 0}</span>
                              <span className="text-[10px]">Helpful</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </>
          ) : (
            <div className="bg-[#21201d] border border-[#2d2a26] rounded-2xl p-12 text-center text-sm text-[#7d7c78]">
              Select a topic from the left sidebar to start reading tutorials.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
