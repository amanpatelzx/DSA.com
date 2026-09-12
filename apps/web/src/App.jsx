import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { io } from 'socket.io-client';
import { useAuth } from './context/AuthContext';
import { useSocket } from './context/SocketContext';
import { fetchRandomBattleProblems, selectRandomClientSide } from './utils/problemSelector';

const CP_DEMO_PROBLEMS = [
  {
    slug: 'two-sum',
    title: 'Two Sum',
    mode: 'Blitz',
    timeControl: '3 + 0',
    language: 'cpp',
    filename: 'Solution.cpp',
    rating: 1742,
    coder: 'aman patel',
    opponent: 'StockfishAlgo',
    opponentRating: 1690,
    testsTotal: 3,
    code: `// Two Sum - Optimal O(n) Hash Map Solution
#include <vector>
#include <unordered_map>

class Solution {
public:
    std::vector<int> twoSum(std::vector<int>& nums, int target) {
        std::unordered_map<int, int> lookup;
        for (int i = 0; i < (int)nums.size(); ++i) {
            int complement = target - nums[i];
            if (lookup.count(complement)) {
                return {lookup[complement], i};
            }
            lookup[nums[i]] = i;
        }
        return {};
    }
};`
  },
  {
    slug: 'trapping-rain-water',
    title: 'Trapping Rain Water',
    mode: 'Rapid',
    timeControl: '10 + 0',
    language: 'cpp',
    filename: 'Solution.cpp',
    rating: 1860,
    coder: 'aman patel',
    opponent: 'GrandmasterBot',
    opponentRating: 1815,
    testsTotal: 4,
    code: `// Trapping Rain Water - Two Pointer O(1) Space
#include <vector>
#include <algorithm>

class Solution {
public:
    int trap(std::vector<int>& height) {
        int left = 0, right = (int)height.size() - 1;
        int maxL = 0, maxR = 0, water = 0;

        while (left < right) {
            if (height[left] <= height[right]) {
                maxL = std::max(maxL, height[left]);
                water += maxL - height[left++];
            } else {
                maxR = std::max(maxR, height[right]);
                water += maxR - height[right--];
            }
        }
        return water;
    }
};`
  },
  {
    slug: 'longest-substring-without-repeating-characters',
    title: 'Longest Substring Without Repeating',
    mode: 'Blitz',
    timeControl: '3 + 0',
    language: 'cpp',
    filename: 'Solution.cpp',
    rating: 1810,
    coder: 'aman patel',
    opponent: 'AlgoBeast99',
    opponentRating: 1775,
    testsTotal: 3,
    code: `// Longest Substring - Sliding Window O(n)
#include <string>
#include <vector>
#include <algorithm>

class Solution {
public:
    int lengthOfLongestSubstring(std::string s) {
        std::vector<int> last(256, -1);
        int maxLen = 0, start = 0;

        for (int i = 0; i < (int)s.size(); ++i) {
            unsigned char c = s[i];
            if (last[c] >= start) {
                start = last[c] + 1;
            }
            last[c] = i;
            maxLen = std::max(maxLen, i - start + 1);
        }
        return maxLen;
    }
};`
  },
  {
    slug: 'merge-k-sorted-lists',
    title: 'Merge k Sorted Lists',
    mode: 'Rapid',
    timeControl: '5 + 0',
    language: 'cpp',
    filename: 'Solution.cpp',
    rating: 1930,
    coder: 'aman patel',
    opponent: 'CodeMasterX',
    opponentRating: 1895,
    testsTotal: 4,
    code: `// Merge k Sorted Lists - Min Heap Priority Queue
#include <vector>
#include <queue>

class Solution {
public:
    ListNode* mergeKLists(std::vector<ListNode*>& lists) {
        auto cmp = [](ListNode* a, ListNode* b) { return a->val > b->val; };
        std::priority_queue<ListNode*, std::vector<ListNode*>, decltype(cmp)> pq(cmp);

        for (auto head : lists) {
            if (head) pq.push(head);
        }

        ListNode dummy(0);
        ListNode* tail = &dummy;
        while (!pq.empty()) {
            ListNode* curr = pq.top(); pq.pop();
            tail->next = curr;
            tail = tail->next;
            if (curr->next) pq.push(curr->next);
        }
        return dummy.next;
    }
};`
  }
];

const colorizeTokens = (line) => {
  if (!line) return <span>&nbsp;</span>;
  const tokens = line.split(/(\b(?:class|public|private|vector|unordered_map|map|int|bool|string|void|return|for|if|else|while|new|def|auto|const)\b|[{}();<>,=+\-*/]|".*?"|'.*?'|\d+|\s+)/g);

  return (
    <>
      {tokens.map((token, i) => {
        if (!token) return null;
        if (/^(class|public|private|return|for|if|else|while|new|def|auto|const)$/.test(token)) {
          return <span key={i} className="text-purple-400 font-bold">{token}</span>;
        }
        if (/^(vector|unordered_map|map|int|bool|string|void)$/.test(token)) {
          return <span key={i} className="text-cyan-400 font-semibold">{token}</span>;
        }
        if (/^(".*?"|'.*?')$/.test(token)) {
          return <span key={i} className="text-emerald-300">{token}</span>;
        }
        if (/^\d+$/.test(token)) {
          return <span key={i} className="text-amber-300 font-mono">{token}</span>;
        }
        if (/^[{}();<>,=+\-*/]$/.test(token)) {
          return <span key={i} className="text-white/70">{token}</span>;
        }
        return <span key={i} className="text-[#d4d4d4]">{token}</span>;
      })}
    </>
  );
};

const renderHighlightedCode = (codeStr) => {
  if (!codeStr) return null;
  const lines = codeStr.split('\n');

  return (
    <div className="font-mono text-[11px] sm:text-xs leading-relaxed select-text">
      {lines.map((line, idx) => {
        const isComment = line.trim().startsWith('//') || line.trim().startsWith('#');
        const isLastLine = idx === lines.length - 1;
        return (
          <div key={idx} className="flex hover:bg-white/[0.04] px-1 rounded transition">
            <span className="w-5 sm:w-7 shrink-0 text-right pr-2 text-[#555] select-none text-[10px]">
              {idx + 1}
            </span>
            <span className="flex-1 whitespace-pre-wrap break-all">
              {isComment ? (
                <span className="text-[#6a9955] italic">{line}</span>
              ) : (
                colorizeTokens(line)
              )}
              {isLastLine && (
                <span className="inline-block w-2 h-3.5 bg-emerald-400 ml-0.5 animate-pulse align-middle" />
              )}
            </span>
          </div>
        );
      })}
    </div>
  );
};

export const CHALLENGE_CATEGORIES = [
  {
    id: 'bullet',
    name: 'Bullet',
    icon: '⚡',
    badge: '3 Pts',
    pointsDesc: '3-Pointer Problems (Speed & Accuracy)',
    description: 'Fast-paced algorithmic blitz with 3-pointer problems',
    options: [
      {
        id: 'bullet_1',
        time: '10 min',
        timeControl: '10 + 0',
        problems: 1,
        points: 3,
        mode: 'Bullet'
      },
      {
        id: 'bullet_2',
        time: '20 min',
        timeControl: '20 + 0',
        problems: 2,
        points: 6,
        mode: 'Bullet'
      },
      {
        id: 'bullet_3',
        time: '30 min',
        timeControl: '30 + 0',
        problems: 3,
        points: 9,
        mode: 'Bullet'
      }
    ]
  },
  {
    id: 'blitz',
    name: 'Blitz',
    icon: '🔥',
    badge: '4 Pts',
    pointsDesc: '4-Pointer Problems (Tactical Speed)',
    description: 'Dynamic competitive challenges with 4-pointer problems',
    options: [
      {
        id: 'blitz_1',
        time: '15 min',
        timeControl: '15 + 0',
        problems: 1,
        points: 4,
        mode: 'Blitz'
      },
      {
        id: 'blitz_2',
        time: '30 min',
        timeControl: '30 + 0',
        problems: 2,
        points: 8,
        mode: 'Blitz'
      },
      {
        id: 'blitz_3',
        time: '45 min',
        timeControl: '45 + 0',
        problems: 3,
        points: 12,
        mode: 'Blitz'
      }
    ]
  },
  {
    id: 'rapid',
    name: 'Rapid',
    icon: '⏱️',
    badge: '5 Pts',
    pointsDesc: '5-Pointer Medium Problems (Deep Logic)',
    description: 'Standard medium-tier problems requiring thoughtful design',
    options: [
      {
        id: 'rapid_1',
        time: '25 min',
        timeControl: '25 + 0',
        problems: 1,
        points: 5,
        mode: 'Rapid'
      },
      {
        id: 'rapid_2',
        time: '50 min',
        timeControl: '50 + 0',
        problems: 2,
        points: 10,
        mode: 'Rapid'
      },
      {
        id: 'rapid_3',
        time: '100 min',
        timeControl: '100 + 0',
        problems: 3,
        points: 15,
        mode: 'Rapid'
      }
    ]
  },
  {
    id: 'classical',
    name: 'Classical',
    icon: '⏳',
    badge: '6-7 Pts',
    pointsDesc: '6 or 7-Pointer Hard Problems (Mastery)',
    description: 'Challenging CP problems for grandmasters and competitive programmers',
    options: [
      {
        id: 'classical_1',
        time: '40 min',
        timeControl: '40 + 0',
        problems: 1,
        points: 7,
        mode: 'Classical'
      },
      {
        id: 'classical_2',
        time: '80 min',
        timeControl: '80 + 0',
        problems: 2,
        points: 14,
        mode: 'Classical'
      },
      {
        id: 'classical_3',
        time: '120 min',
        timeControl: '120 + 0',
        problems: 3,
        points: 21,
        mode: 'Classical'
      }
    ]
  },
  {
    id: 'custom',
    name: 'Custom',
    icon: '⚙️',
    badge: 'Friend Only',
    pointsDesc: 'Custom Duration & Difficulty',
    description: 'Customize duration, questions count, and difficulty (Available in Friend section)',
    isCustom: true
  }
];

export default function App() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Modals state
  const [showTimeControlModal, setShowTimeControlModal] = useState(false);
  const [showChallengeModal, setShowChallengeModal] = useState(false);
  const [showTournamentsModal, setShowTournamentsModal] = useState(false);
  const [appTournaments, setAppTournaments] = useState([]);
  const [tournamentsLoading, setTournamentsLoading] = useState(false);
  const [viewingAppLeaderboard, setViewingAppLeaderboard] = useState(null);
  const [registeringId, setRegisteringId] = useState(null);

  const fetchAppTournaments = async () => {
    setTournamentsLoading(true);
    try {
      const res = await axios.get('http://localhost:5000/api/tournaments');
      if (res.data) {
        setAppTournaments(res.data);
      }
    } catch (err) {
      console.error('Failed to load tournaments:', err);
    } finally {
      setTournamentsLoading(false);
    }
  };

  useEffect(() => {
    if (showTournamentsModal) {
      fetchAppTournaments();
    }
  }, [showTournamentsModal]);

  const handleRegisterTournament = async (tourneyId) => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Please log in to register for tournaments.');
      navigate('/login');
      return;
    }
    setRegisteringId(tourneyId);
    try {
      const res = await axios.post(`http://localhost:5000/api/tournaments/${tourneyId}/register`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert(res.data.message || 'Successfully registered!');
      fetchAppTournaments();
    } catch (err) {
      alert(err.response?.data?.message || 'Error registering for tournament');
    } finally {
      setRegisteringId(null);
    }
  };

  const handleEnterTournament = (tourney) => {
    setShowTournamentsModal(false);
    const problemSlugs = tourney.problems?.map(p => typeof p === 'string' ? p : p.slug).filter(Boolean) || [];
    const firstSlug = problemSlugs[0] || 'two-sum';
    const problemListQuery = problemSlugs.join(',');
    // All tournaments are strictly practice-only: rated=0
    navigate(`/problem/${firstSlug}?contest=${tourney._id}&tournamentId=${tourney._id}&mode=${encodeURIComponent(tourney.mode || 'Blitz')}&time=${encodeURIComponent(tourney.timeControl || '15+0')}&problemList=${encodeURIComponent(problemListQuery)}&rated=0&isTournament=1`);
  };

  // Challenge Category (5 parts: bullet, blitz, rapid, classical, custom)
  const [selectedCategory, setSelectedCategory] = useState('bullet');
  const [selectedOptionId, setSelectedOptionId] = useState('bullet_1');
  const [isChallengeRated, setIsChallengeRated] = useState(true);

  // Challenge friend & Global Open Challenges state
  const {
    socket,
    sendChallenge,
    openChallenges = [],
    createOpenChallenge,
    acceptOpenChallenge,
    cancelOpenChallenge
  } = useSocket();

  const myOpenChallenge = useMemo(() => {
    if (!user || !openChallenges) return null;
    return openChallenges.find(c =>
      (c.creator?.userId && String(c.creator.userId) === String(user._id || user.id)) ||
      (c.creator?.username && c.creator.username.toLowerCase() === (user.username || '').toLowerCase())
    );
  }, [user, openChallenges]);

  // Order open challenges: user's own challenge ALWAYS pinned at the very top (first) on their screen!
  // For other users, challenges are sorted chronologically by who posted first (createdAt ascending)
  const displayChallenges = useMemo(() => {
    if (!openChallenges || openChallenges.length === 0) return [];
    return [...openChallenges].sort((a, b) => {
      const aIsMine = user && (
        (a.creator?.userId && String(a.creator.userId) === String(user._id || user.id)) ||
        (a.creator?.username && a.creator.username.toLowerCase() === (user.username || '').toLowerCase())
      );
      const bIsMine = user && (
        (b.creator?.userId && String(b.creator.userId) === String(user._id || user.id)) ||
        (b.creator?.username && b.creator.username.toLowerCase() === (user.username || '').toLowerCase())
      );
      if (aIsMine && !bIsMine) return -1;
      if (!aIsMine && bIsMine) return 1;
      return (a.createdAt || 0) - (b.createdAt || 0);
    });
  }, [openChallenges, user]);

  // Real-time ticker for elapsed challenge time
  const [lobbyTimeTicker, setLobbyTimeTicker] = useState(Date.now());
  useEffect(() => {
    if (openChallenges.length === 0) return;
    const interval = setInterval(() => setLobbyTimeTicker(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [openChallenges.length]);
  const [friendModalError, setFriendModalError] = useState('');
  const [friendCategory, setFriendCategory] = useState('bullet');
  const [friendSelectedOptionId, setFriendSelectedOptionId] = useState('bullet_1');
  const [friendIsRated, setFriendIsRated] = useState(true);
  const [friendUsername, setFriendUsername] = useState('');
  const [friendTargetMode, setFriendTargetMode] = useState('online'); // 'online' | 'type'
  const [myFriends, setMyFriends] = useState([]);
  const [loadingFriends, setLoadingFriends] = useState(false);
  const [challengeCopied, setChallengeCopied] = useState(false);
  const [friendProblemList, setFriendProblemList] = useState([]);
  const [problemsPool, setProblemsPool] = useState([]);

  // Fetch user's friends with real-time online status for Challenge modal
  const fetchMyFriends = useCallback(async () => {
    if (!user?.username) return;
    setLoadingFriends(true);
    try {
      const res = await axios.get(`http://localhost:5000/api/users/${user.username}/friends`);
      if (res.data?.success && Array.isArray(res.data.friends)) {
        setMyFriends(res.data.friends);
      }
    } catch (err) {
      console.error('Failed to load friends for challenge modal:', err);
    } finally {
      setLoadingFriends(false);
    }
  }, [user?.username]);

  // Load friends whenever challenge modal is opened
  useEffect(() => {
    if (showChallengeModal && user?.username) {
      fetchMyFriends();
    }
  }, [showChallengeModal, user?.username, fetchMyFriends]);

  // Listen to socket presence updates to keep friends online status reactive in real-time
  useEffect(() => {
    if (!socket) return;
    const handlePresence = ({ username, status }) => {
      if (!username) return;
      const uClean = username.toLowerCase().trim();
      setMyFriends(prev => prev.map(f => {
        if ((f.username || '').toLowerCase().trim() === uClean) {
          return { ...f, isOnline: status === 'ONLINE' };
        }
        return f;
      }));
    };
    socket.on('presence:update', handlePresence);
    return () => {
      socket.off('presence:update', handlePresence);
    };
  }, [socket]);

  // Filter strictly only friends who are online
  const onlineFriends = useMemo(() => {
    return myFriends.filter(f => Boolean(f.isOnline));
  }, [myFriends]);

  // Custom Friend Duel Configuration
  const [customFriendTime, setCustomFriendTime] = useState('15');
  const [customFriendProblems, setCustomFriendProblems] = useState(1);
  const [customFriendDifficulty, setCustomFriendDifficulty] = useState('medium'); // 'easy' | 'medium' | 'hard' | 'mixed'

  // Real database stats
  const [liveStats, setLiveStats] = useState({ totalPlayers: 1422, totalGames: 3540 });
  const [lastActivePractice, setLastActivePractice] = useState(null);

  // Live top-rated battle streaming state
  const [topBattle, setTopBattle] = useState(null);
  const [liveCode, setLiveCode] = useState('');
  const [liveTimeLeft, setLiveTimeLeft] = useState(134);
  const [isLiveActive, setIsLiveActive] = useState(false);
  const socketRef = useRef(null);
  const editorScrollRef = useRef(null);

  // Dynamic CP Demo Problem cycling & human typing simulation
  const [demoProblemIdx, setDemoProblemIdx] = useState(0);
  const [demoTestsPassed, setDemoTestsPassed] = useState(0);
  const [demoStatus, setDemoStatus] = useState('coding'); // 'coding' | 'submitting' | 'accepted'

  const activeDemo = CP_DEMO_PROBLEMS[demoProblemIdx % CP_DEMO_PROBLEMS.length];

  // Auto-scroll editor to bottom as code is typed
  useEffect(() => {
    if (editorScrollRef.current) {
      editorScrollRef.current.scrollTop = editorScrollRef.current.scrollHeight;
    }
  }, [liveCode]);

  // Fetch real platform stats & user last active practice problem
  useEffect(() => {
    axios.get('http://localhost:5000/api/battles/stats')
      .then(res => {
        if (res.data) {
          setLiveStats({
            totalPlayers: Math.max(res.data.totalPlayers || 0, 1),
            totalGames: res.data.totalGames || 0
          });
        }
      })
      .catch(() => {});

    axios.get('http://localhost:5000/api/problems')
      .then(res => {
        if (Array.isArray(res.data)) {
          setProblemsPool(res.data);
        }
      })
      .catch(() => {});

    const token = localStorage.getItem('token');
    if (token) {
      axios.get('http://localhost:5000/api/problems/practice/last-active', {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => {
        if (res.data?.hasActivePractice) {
          setLastActivePractice(res.data);
        }
      })
      .catch(() => {});
    }
  }, []);

  // Fetch initial top battle & subscribe to live socket updates
  useEffect(() => {
    axios.get('http://localhost:5000/api/battles/live-top')
      .then(res => {
        if (res.data) {
          setTopBattle(res.data);
          if (res.data.isRealLive) {
            setIsLiveActive(true);
            setLiveCode(res.data.player?.code || '');
            setLiveTimeLeft(res.data.timeLeft || 180);
          }
        }
      })
      .catch(() => {});

    let socket;
    try {
      socket = io('http://localhost:5000', {
        transports: ['websocket', 'polling']
      });
      socketRef.current = socket;

      socket.emit('live:get_top_battle');

      socket.on('live:top_battle_update', (data) => {
        if (data && data.isRealLive) {
          setTopBattle(data);
          setIsLiveActive(true);
          setLiveCode(data.player?.code || '');
          if (data.timeLeft !== undefined) {
            setLiveTimeLeft(data.timeLeft);
          }
        } else {
          setIsLiveActive(false);
        }
      });

      socket.on('live:code_stream', (data) => {
        setIsLiveActive(true);
        if (data.code !== undefined) {
          setLiveCode(data.code);
        }
        if (data.timeLeft !== undefined) {
          setLiveTimeLeft(data.timeLeft);
        }
        setTopBattle(prev => prev ? {
          ...prev,
          player: {
            ...prev.player,
            code: data.code !== undefined ? data.code : prev.player?.code,
            language: data.language || prev.player?.language,
            testsPassed: data.testsPassed !== undefined ? data.testsPassed : prev.player?.testsPassed
          }
        } : prev);
      });
    } catch (e) {
      console.warn('Socket connection warning:', e);
    }

    return () => {
      if (socket) socket.disconnect();
    };
  }, []);

  // Timer countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setLiveTimeLeft(prev => (prev > 0 ? prev - 1 : 180));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Simulated human competitive programming live typing when no human matches are active on server
  useEffect(() => {
    if (isLiveActive) return;

    const currentProblem = CP_DEMO_PROBLEMS[demoProblemIdx % CP_DEMO_PROBLEMS.length];
    const targetCode = currentProblem.code;
    let charIdx = 0;
    let timeoutId;
    let typoHandled = false;

    // Start fresh with clean editor
    setLiveCode('');
    setDemoTestsPassed(0);
    setDemoStatus('coding');

    const typeNext = () => {
      if (charIdx < targetCode.length) {
        // Natural Human Typo & Self-Correction (happens ~1-2 times per solution at safe spots)
        if (!typoHandled && (charIdx === 95 || charIdx === 210) && charIdx + 2 < targetCode.length) {
          typoHandled = true;
          const wrongChar = targetCode[charIdx] === 'i' ? 'o' : (targetCode[charIdx] === 'e' ? 'w' : 'n');
          setLiveCode(targetCode.substring(0, charIdx) + wrongChar);

          // Real human detects typo after ~90ms
          timeoutId = setTimeout(() => {
            // Immediate backspace of wrong character
            setLiveCode(targetCode.substring(0, charIdx));
            timeoutId = setTimeout(() => {
              typeNext();
            }, 70);
          }, 110);
          return;
        }

        charIdx += 1;
        setLiveCode(targetCode.substring(0, charIdx));

        // Gradual testcase progress as the solution is built
        const ratio = charIdx / targetCode.length;
        if (ratio > 0.8) {
          setDemoTestsPassed(Math.min(currentProblem.testsTotal - 1, 2));
        } else if (ratio > 0.45) {
          setDemoTestsPassed(1);
        } else {
          setDemoTestsPassed(0);
        }

        const currentChar = targetCode[charIdx - 1];
        const nextChar = charIdx < targetCode.length ? targetCode[charIdx] : '';

        // CP Keystroke latency: quick bursts on standard idioms, thoughtful pauses at newlines & logic
        let delay;
        if (currentChar === '\n') {
          // Line break: 140ms - 260ms pause
          delay = Math.floor(Math.random() * 90 + 150);
        } else if (currentChar === ';') {
          // Statement completion
          delay = Math.floor(Math.random() * 70 + 100);
        } else if (currentChar === '{' || currentChar === '}') {
          delay = Math.floor(Math.random() * 80 + 120);
        } else if (currentChar === ' ' && nextChar === 'i' && targetCode.substring(charIdx, charIdx + 3) === 'if ') {
          // Hesitation before if condition logic
          delay = Math.floor(Math.random() * 100 + 200);
        } else if (currentChar === ' ' && targetCode.substring(charIdx, charIdx + 4) === 'for ') {
          // Hesitation before loop construct
          delay = Math.floor(Math.random() * 80 + 160);
        } else if (currentChar === ' ') {
          delay = Math.floor(Math.random() * 15 + 25);
        } else {
          // Fast burst typing with slight human jitter
          delay = Math.floor(Math.random() * 18 + 16);
        }

        timeoutId = setTimeout(typeNext, delay);
      } else {
        // Entire solution completed!
        setDemoStatus('submitting');

        // Quick testcase execution evaluation
        timeoutId = setTimeout(() => {
          setDemoTestsPassed(currentProblem.testsTotal);
          setDemoStatus('accepted');

          // Hold the accepted optimal solution for 3.8s for viewers to read
          timeoutId = setTimeout(() => {
            // Move cleanly to the next CP problem (NO BACKSPACING!)
            setDemoProblemIdx(prev => (prev + 1) % CP_DEMO_PROBLEMS.length);
          }, 3800);
        }, 550);
      }
    };

    timeoutId = setTimeout(typeNext, 350);

    return () => clearTimeout(timeoutId);
  }, [isLiveActive, demoProblemIdx]);

  const formatTimer = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const refreshFriendProblems = async (catId, optId, diff, probCount) => {
    const activeCatId = catId || friendCategory;
    const currentCat = CHALLENGE_CATEGORIES.find(c => c.id === activeCatId) || CHALLENGE_CATEGORIES[0];
    let mode = 'Bullet';
    let difficulty = '';
    let count = 1;

    if (currentCat.isCustom) {
      mode = 'Custom';
      difficulty = diff || customFriendDifficulty;
      count = probCount !== undefined ? probCount : customFriendProblems;
    } else {
      const activeOptId = optId || friendSelectedOptionId;
      const selectedOpt = currentCat.options?.find(o => o.id === activeOptId) || currentCat.options?.[0] || CHALLENGE_CATEGORIES[0].options[0];
      mode = selectedOpt.mode || 'Blitz';
      count = selectedOpt.problems || 1;
    }

    const randomSlugs = await fetchRandomBattleProblems({
      mode,
      difficulty,
      count,
      problemsPool
    });
    setFriendProblemList(randomSlugs);
    return randomSlugs;
  };

  useEffect(() => {
    if (showChallengeModal) {
      refreshFriendProblems(friendCategory, friendSelectedOptionId, customFriendDifficulty, customFriendProblems);
    }
  }, [showChallengeModal]);

  const handleSelectFriendCategory = (catId) => {
    setFriendCategory(catId);
    const cat = CHALLENGE_CATEGORIES.find(c => c.id === catId);
    let newOptId = friendSelectedOptionId;
    if (cat && cat.options && cat.options.length > 0) {
      newOptId = cat.options[0].id;
      setFriendSelectedOptionId(newOptId);
    }
    refreshFriendProblems(catId, newOptId, customFriendDifficulty, customFriendProblems);
  };

  const handleSelectFriendOption = (optId) => {
    setFriendSelectedOptionId(optId);
    refreshFriendProblems(friendCategory, optId, customFriendDifficulty, customFriendProblems);
  };

  const handleSelectCustomDifficulty = (diff) => {
    setCustomFriendDifficulty(diff);
    refreshFriendProblems(friendCategory, friendSelectedOptionId, diff, customFriendProblems);
  };

  const handleSelectCustomProblems = (num) => {
    setCustomFriendProblems(num);
    refreshFriendProblems(friendCategory, friendSelectedOptionId, customFriendDifficulty, num);
  };

  const getFriendChallengeUrl = () => {
    const currentCat = CHALLENGE_CATEGORIES.find(c => c.id === friendCategory) || CHALLENGE_CATEGORIES[0];
    const ratedParam = friendIsRated ? '1' : '0';
    const opponentName = friendUsername.trim() || 'Friend';
    const selectedOpt = currentCat.options?.find(o => o.id === friendSelectedOptionId) || currentCat.options?.[0] || CHALLENGE_CATEGORIES[0].options[0];
    const mode = currentCat.isCustom ? 'Custom' : (selectedOpt.mode || 'Bullet');
    const timeParam = currentCat.isCustom ? `${customFriendTime} + 0` : (selectedOpt.timeControl || selectedOpt.time || '10 + 0');
    const problemsCount = currentCat.isCustom ? customFriendProblems : (selectedOpt.problems || 1);
    const difficultyParam = currentCat.isCustom ? `&difficulty=${encodeURIComponent(customFriendDifficulty)}` : '';

    return `${window.location.origin}/problem/battle?challenge=${encodeURIComponent(user?.username || 'coder')}&opponent=${encodeURIComponent(opponentName)}&mode=${encodeURIComponent(mode)}&time=${encodeURIComponent(timeParam)}&problems=${problemsCount}${difficultyParam}&rated=${ratedParam}`;
  };

  const handleCancelQueue = () => {
    if (myOpenChallenge) {
      cancelOpenChallenge(myOpenChallenge.challengeId);
    }
  };

  const handleSelectChallengeOption = async (opt) => {
    setShowTimeControlModal(false);
    if (opt.isCustom) {
      setShowChallengeModal(true);
      handleSelectFriendCategory('custom');
      return;
    }

    // Completely random selection across entire problem set for this mode & problems count
    const randomSlugs = await fetchRandomBattleProblems({
      mode: opt.mode,
      count: opt.problems || 1,
      problemsPool
    });

    createOpenChallenge({
      mode: opt.mode,
      timeControl: opt.timeControl || opt.time,
      time: opt.time,
      problemsCount: opt.problems || 1,
      isRated: isChallengeRated,
      problemList: randomSlugs
    });
  };

  const handleCopyChallenge = () => {
    const url = getFriendChallengeUrl();
    navigator.clipboard.writeText(url);
    setChallengeCopied(true);
    setTimeout(() => setChallengeCopied(false), 2500);
  };

  const handleStartFriendChallenge = async () => {
    const target = friendUsername.trim();
    if (!target) {
      setFriendModalError(
        friendTargetMode === 'online' && onlineFriends.length > 0
          ? 'Please select an online friend from the list, or switch to Type Username!'
          : 'Please enter your friend\'s username to send a battle challenge, or copy the direct challenge link below!'
      );
      return;
    }
    setFriendModalError('');
    setShowChallengeModal(false);

    const currentCat = CHALLENGE_CATEGORIES.find(c => c.id === friendCategory) || CHALLENGE_CATEGORIES[0];
    const selectedOpt = currentCat.options?.find(o => o.id === friendSelectedOptionId) || currentCat.options?.[0] || CHALLENGE_CATEGORIES[0].options[0];
    const mode = currentCat.isCustom ? 'Custom' : (selectedOpt.mode || 'Bullet');
    const timeControl = currentCat.isCustom ? `${customFriendTime} + 0` : (selectedOpt.timeControl || selectedOpt.time || '10 + 0');
    const problemsCount = currentCat.isCustom ? customFriendProblems : (selectedOpt.problems || 1);
    const difficulty = currentCat.isCustom ? customFriendDifficulty : '';
    const durationSeconds = currentCat.isCustom ? (parseInt(customFriendTime, 10) * 60) : 600;

    sendChallenge({
      toUsername: target,
      mode,
      timeControl,
      isRated: friendIsRated,
      problemsCount,
      difficulty,
      problemList: [], // Dynamically rolled and secured on backend upon match start
      durationSeconds
    });
  };

  return (
    <div className="min-h-full bg-[#161512] text-[#c9c8c5] px-4 py-6 sm:px-6 lg:px-8 flex flex-col justify-center items-center">
      
      {/* MAIN CONTAINER MATCHING CHESS.COM HOMEPAGE SCREENSHOT */}
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-stretch">
        
        {/* LEFT COLUMN: REPLACING THE CHESSBOARD WITH "ABOUT OUR PLATFORM" */}
        <div className="lg:col-span-7 flex flex-col justify-between gap-3">
          
          {/* Top Opponent / Arena Status Bar (reminiscent of top opponent bar in screenshot) */}
          <div className="flex items-center justify-between px-3 py-2 bg-[#21201d] border border-[#2d2a26] rounded-xl text-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-[#2b2926] border border-white/10 flex items-center justify-center font-bold text-white text-xs">
                🌐
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5 font-bold text-white">
                  <span>DSA Battle Arena</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                </div>
                <span className="text-[10px] text-[#888888]">
                  Global Rated Matchmaking
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 text-[11px] font-semibold text-[#888888]">
              <span className="hidden sm:inline">⚡ <strong className="text-white font-bold">{liveStats.totalPlayers.toLocaleString()}</strong> Coders Online</span>
              <span>⚔️ <strong className="text-white font-bold">{liveStats.totalGames.toLocaleString()}</strong> Battles</span>
            </div>
          </div>

          {/* MAIN PLATFORM SHOWCASE CARD (THE CENTRAL SQUARE AREA REPLACING THE CHESSBOARD) */}
          <div className="flex-1 bg-gradient-to-br from-[#1e1d1a] via-[#21201d] to-[#1a1917] border border-[#33302b] rounded-2xl p-5 sm:p-6 flex flex-col justify-between shadow-2xl relative overflow-hidden group">
            
            {/* Ambient Background Glow & Watermark */}
            <div className="absolute -right-16 -top-16 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute -left-16 -bottom-16 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none"></div>

            {/* Header: Platform Intro & Showcase Tab Switcher */}
            <div className="relative z-10">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-white tracking-tight leading-snug">
                  Battle Coders Worldwide in Live <span className="text-[#81b64c]">1v1 Algorithmic Duels</span>
                </h1>
              </div>

              {/* Global Open Challenges Header Bar */}
              <div className="flex items-center justify-between gap-2 border-b border-[#2d2a26] pb-2.5 mt-3">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <div className="px-3.5 py-1.5 rounded-xl text-xs font-extrabold bg-[#2b2926] text-white border border-[#81b64c]/60 shadow-md flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span>⚔️ Global Open Challenges</span>
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                      openChallenges.length > 0
                        ? 'bg-[#81b64c] text-white shadow-sm shadow-emerald-500/40 animate-pulse'
                        : 'bg-white/10 text-white/60'
                    }`}>
                      {openChallenges.length}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowTimeControlModal(true)}
                  className="bg-[#81b64c] hover:bg-[#92c55b] text-white font-extrabold text-xs px-3.5 py-1.5 rounded-xl transition shadow flex items-center gap-1.5 cursor-pointer shrink-0 group transform hover:-translate-y-0.5 active:translate-y-0"
                >
                  <span className="text-sm font-bold group-hover:rotate-90 transition-transform duration-200">+</span>
                  <span>Post Challenge</span>
                </button>
              </div>
            </div>

            {/* MAIN CONTENT: GLOBAL OPEN CHALLENGES LOBBY */}
            <div className="relative z-10 my-4 bg-[#171614] border border-[#2d2a26] rounded-2xl p-4 sm:p-5 shadow-2xl flex flex-col justify-between min-h-[440px]">
              <div>
                {/* Lobby Header */}
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#282622] text-xs">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="font-extrabold text-white text-sm">
                      Live Global Challenge Lobby
                    </span>
                    <span className="text-[#81b64c] bg-[#81b64c]/10 px-2 py-0.5 rounded text-[10px] font-mono font-bold border border-[#81b64c]/20">
                      {openChallenges.length} {openChallenges.length === 1 ? 'Challenger' : 'Challengers'} Waiting
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-[11px] text-[#8c8b88]">
                    <span className="hidden sm:inline">Real-time matchmaking</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-[#81b64c]"></span>
                  </div>
                </div>

                {/* Empty state or Challenge List */}
                {openChallenges.length === 0 ? (
                  <div className="py-14 px-4 text-center flex flex-col items-center justify-center">
                    <div className="w-16 h-16 rounded-2xl bg-[#21201d] border border-white/10 flex items-center justify-center text-3xl mb-3 shadow-inner">
                      ⚔️
                    </div>
                    <h4 className="text-base font-extrabold text-white mb-1.5">
                      No Open Challenges Right Now
                    </h4>
                    <p className="text-xs text-[#8c8b88] max-w-sm mx-auto mb-5 leading-relaxed">
                      Be the first to challenge the arena! Post a challenge with your preferred theme (e.g. Bullet 10 min) and any coder worldwide can accept, or you will be matched automatically if someone chooses the same theme.
                    </p>
                    <button
                      type="button"
                      onClick={() => setShowTimeControlModal(true)}
                      className="bg-[#81b64c] hover:bg-[#92c55b] text-white font-extrabold text-xs px-5 py-2.5 rounded-xl transition shadow-lg cursor-pointer flex items-center gap-2"
                    >
                      <span>⚡ Create Global Challenge</span>
                      <span>→</span>
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2.5 max-h-[340px] overflow-y-auto pr-1">
                    {displayChallenges.map((chal) => {
                      const isMyChallenge = user && (
                        (chal.creator?.userId && String(chal.creator.userId) === String(user._id || user.id)) ||
                        (chal.creator?.username && chal.creator.username.toLowerCase() === (user.username || '').toLowerCase())
                      );

                      const elapsedSecs = Math.max(0, Math.floor((lobbyTimeTicker - (chal.createdAt || lobbyTimeTicker)) / 1000));

                      return (
                        <div
                          key={chal.challengeId}
                          className={`p-3 sm:p-3.5 rounded-xl border transition flex items-center justify-between gap-3 shadow-md relative overflow-hidden ${
                            isMyChallenge
                              ? 'bg-gradient-to-r from-[#2a2416] via-[#221f19] to-[#1f2619] border-amber-400/80 animate-lightning-glow'
                              : 'bg-[#1e1d1a] hover:bg-[#252320] border-[#2f2c28] hover:border-white/20'
                          }`}
                        >
                          {/* Animated Lighting Streak Effect for user's own challenge */}
                          {isMyChallenge && (
                            <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-xl">
                              <div className="absolute top-0 bottom-0 w-32 bg-gradient-to-r from-transparent via-amber-300/20 to-transparent skew-x-[-25deg] animate-lightning-streak"></div>
                              <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-amber-500/0 via-amber-300 to-amber-500/0"></div>
                            </div>
                          )}

                          {/* Left: Player info & theme badges */}
                          <div className="flex items-center gap-3 min-w-0 relative z-10">
                            <div className={`w-10 h-10 rounded-xl text-white flex items-center justify-center font-extrabold text-sm shadow shrink-0 ${
                              isMyChallenge
                                ? 'bg-gradient-to-tr from-amber-600 to-yellow-400 text-black font-black shadow-amber-500/30'
                                : 'bg-gradient-to-tr from-[#383531] to-[#48443e]'
                            }`}>
                              {isMyChallenge ? '⚡' : (chal.creator?.username ? chal.creator.username.charAt(0).toUpperCase() : 'C')}
                            </div>

                            <div className="flex flex-col min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-extrabold text-white text-xs sm:text-sm truncate max-w-[130px] sm:max-w-[170px]">
                                  {chal.creator?.username || 'Coder'}
                                </span>
                                {isMyChallenge && (
                                  <span className="text-[9px] bg-amber-500/25 text-amber-300 border border-amber-400/60 px-2 py-0.5 rounded-full font-black uppercase tracking-wider flex items-center gap-1 shadow-sm">
                                    <span className="animate-pulse">⚡</span>
                                    <span>Your Challenge</span>
                                  </span>
                                )}
                                <span className="text-[11px] text-yellow-400 font-mono font-bold">
                                  {chal.creator?.rating || 1500} Elo
                                </span>
                                {isMyChallenge && (
                                  <span className="text-[10px] text-amber-300/90 font-mono font-bold bg-black/40 px-1.5 py-0.5 rounded border border-amber-500/30 flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping"></span>
                                    <span>Live: {formatTimer(elapsedSecs)}</span>
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-2 text-[11px] text-[#8c8b88] mt-1 flex-wrap">
                                <span className="text-[#81b64c] bg-[#81b64c]/10 border border-[#81b64c]/20 px-2 py-0.5 rounded font-mono font-bold">
                                  ⚡ {chal.mode} {chal.timeControl}
                                </span>
                                <span className={`px-2 py-0.5 rounded font-medium ${
                                  chal.isRated
                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                    : 'bg-white/5 text-white/70 border border-white/10'
                                }`}>
                                  {chal.isRated ? '🏆 Rated' : '🎮 Casual'}
                                </span>
                                <span className="hidden sm:inline text-white/50">
                                  {chal.problemsCount || 1} {chal.problemsCount === 1 ? 'Problem' : 'Problems'}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Right: Actions */}
                          <div className="flex items-center gap-2 shrink-0 relative z-10">
                            {isMyChallenge ? (
                              <div className="flex items-center gap-2">
                                <span className="text-[11px] text-amber-300 font-mono font-bold hidden lg:inline flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping"></span>
                                  Waiting for player...
                                </span>
                                <button
                                  type="button"
                                  onClick={() => cancelOpenChallenge(chal.challengeId)}
                                  title="Cancel and remove this open challenge"
                                  className="bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40 text-xs font-extrabold px-3.5 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-sm active:scale-95"
                                >
                                  <span>✕</span>
                                  <span>Cancel</span>
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => acceptOpenChallenge(chal.challengeId)}
                                title={`Accept battle against ${chal.creator?.username}`}
                                className="bg-[#81b64c] hover:bg-[#92c55b] text-white font-extrabold text-xs px-3.5 sm:px-4 py-2 rounded-xl transition shadow-md hover:shadow-emerald-500/20 cursor-pointer flex items-center gap-1.5 group transform hover:-translate-y-0.5 active:translate-y-0"
                              >
                                <span className="group-hover:scale-110 transition">⚔️</span>
                                <span>Accept Battle</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Footer Info / Auto-Match Explanation */}
              <div className="pt-3 mt-3 border-t border-white/5 flex items-center justify-between text-[11px] text-[#8c8b88] flex-wrap gap-2">
                <span className="flex items-center gap-1.5">
                  <span>💡</span>
                  <span><strong>Theme Match:</strong> If anyone challenges with the same theme (e.g. Bullet 10 min), the duel starts automatically!</span>
                </span>
                <button
                  type="button"
                  onClick={() => setShowTimeControlModal(true)}
                  className="text-[#81b64c] hover:text-[#92c55b] transition font-bold cursor-pointer shrink-0 ml-auto flex items-center gap-1"
                >
                  <span>+ Create Challenge</span>
                  <span>→</span>
                </button>
              </div>
            </div>
            </div>
          </div>

        {/* RIGHT COLUMN: CODING CHALLENGE MENU PANEL (EXACTLY MATCHING SCREENSHOT) */}
        <div className="lg:col-span-5 bg-[#21201d] border border-[#2d2a26] rounded-2xl p-5 sm:p-6 flex flex-col justify-between shadow-2xl">
          
          <div className="flex flex-col gap-5">
            {/* Top Header: Coding Challenge (replaces "Play Chess") */}
            <div className="flex items-center justify-center gap-3 pb-3 border-b border-[#2d2a26]">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 via-[#81b64c] to-lime-400 flex items-center justify-center shadow-lg text-white font-black text-lg">
                ⚔️
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Coding Challenge
              </h2>
            </div>

            {/* Menu Items List */}
            <div className="flex flex-col gap-3">
              
              {/* CONTINUE WHERE YOU LEFT OFF (TRAINING GROUND) */}
              {lastActivePractice?.hasActivePractice && (
                <Link
                  to={`/problem/${lastActivePractice.slug}`}
                  className="w-full bg-gradient-to-r from-emerald-950/50 via-[#232920] to-[#272522] hover:from-emerald-900/60 hover:to-[#322f2b] border border-emerald-500/30 hover:border-emerald-500/50 rounded-xl p-4 flex items-center gap-3.5 text-left transition-all duration-150 transform hover:-translate-y-0.5 shadow-lg cursor-pointer group"
                >
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-2xl flex-shrink-0 group-hover:scale-110 transition shadow-inner">
                    🎯
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-1.5 py-0.5 rounded">
                        Resume Practice
                      </span>
                      <span className="text-[10px] text-[#8c8b88] font-mono">
                        Auto-saved
                      </span>
                    </div>
                    <h4 className="text-sm sm:text-base font-bold text-white group-hover:text-[#81b64c] transition truncate mt-0.5">
                      {lastActivePractice.title}
                    </h4>
                    <p className="text-xs text-[#8c8b88] mt-0.5">
                      Continue from where you left off in Training Ground
                    </p>
                  </div>

                  <span className="text-emerald-400 group-hover:translate-x-1 transition text-lg font-bold">
                    →
                  </span>
                </Link>
              )}

              {/* ITEM 1: CHALLENGE ONLINE (Replaces Play Online) */}
              <button
                onClick={() => setShowTimeControlModal(true)}
                className="w-full bg-[#272522] hover:bg-[#322f2b] active:bg-[#1f1e1b] border border-[#363430] hover:border-white/20 rounded-xl p-4 sm:p-5 flex items-center gap-4 text-left transition-all duration-150 transform hover:-translate-y-0.5 shadow-md cursor-pointer group"
              >
                {/* Lightning Icon with amber glow */}
                <div className="w-12 h-12 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-2xl flex-shrink-0 group-hover:scale-110 transition shadow-inner">
                  ⚡
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="text-base sm:text-lg font-bold text-white group-hover:text-[#81b64c] transition">
                    Challenge Online
                  </h3>
                  <p className="text-xs sm:text-sm text-[#8c8b88] mt-0.5 leading-snug">
                    Challenge vs a person of similar skill
                  </p>
                </div>

                <span className="text-white/30 group-hover:text-white transition text-lg">
                  ›
                </span>
              </button>

              {/* ITEM 2: CHALLENGE A FRIEND (Replaces Play a Friend) */}
              <button
                onClick={() => setShowChallengeModal(true)}
                className="w-full bg-[#272522] hover:bg-[#322f2b] active:bg-[#1f1e1b] border border-[#363430] hover:border-white/20 rounded-xl p-4 sm:p-5 flex items-center gap-4 text-left transition-all duration-150 transform hover:-translate-y-0.5 shadow-md cursor-pointer group"
              >
                {/* Handshake Icon */}
                <div className="w-12 h-12 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-2xl flex-shrink-0 group-hover:scale-110 transition shadow-inner">
                  🤝
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="text-base sm:text-lg font-bold text-white group-hover:text-[#81b64c] transition">
                    Challenge a Friend
                  </h3>
                  <p className="text-xs sm:text-sm text-[#8c8b88] mt-0.5 leading-snug">
                    Invite a friend to a 1v1 coding duel
                  </p>
                </div>

                <span className="text-white/30 group-hover:text-white transition text-lg">
                  ›
                </span>
              </button>

              {/* ITEM 3: TOURNAMENTS */}
              <button
                onClick={() => setShowTournamentsModal(true)}
                className="w-full bg-[#272522] hover:bg-[#322f2b] active:bg-[#1f1e1b] border border-[#363430] hover:border-white/20 rounded-xl p-4 sm:p-5 flex items-center gap-4 text-left transition-all duration-150 transform hover:-translate-y-0.5 shadow-md cursor-pointer group"
              >
                {/* Gold Medal Icon */}
                <div className="w-12 h-12 rounded-xl bg-yellow-500/15 border border-yellow-500/30 flex items-center justify-center text-2xl flex-shrink-0 group-hover:scale-110 transition shadow-inner">
                  🏅
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="text-base sm:text-lg font-bold text-white group-hover:text-[#81b64c] transition">
                    Tournaments
                  </h3>
                  <p className="text-xs sm:text-sm text-[#8c8b88] mt-0.5 leading-snug">
                    Join an Arena where anyone can win
                  </p>
                </div>

                <span className="text-white/30 group-hover:text-white transition text-lg">
                  ›
                </span>
              </button>
            </div>
          </div>

          {/* BOTTOM BAR: GAME HISTORY & LEADERBOARD (MATCHING SCREENSHOT) */}
          <div className="pt-6 mt-6 border-t border-[#2d2a26] flex items-center justify-around text-xs font-semibold text-[#8c8b88]">
            <Link
              to={user?.username ? `/${user.username}` : '/profile'}
              className="flex items-center gap-2 hover:text-white transition group py-1.5 px-3 rounded-lg hover:bg-white/5"
            >
              <span className="text-base group-hover:scale-110 transition">📁</span>
              <span>Game History</span>
            </Link>

            <span className="text-white/10">|</span>

            <Link
              to="/search"
              className="flex items-center gap-2 hover:text-white transition group py-1.5 px-3 rounded-lg hover:bg-white/5"
            >
              <span className="text-base group-hover:scale-110 transition">🏆</span>
              <span>Leaderboard</span>
            </Link>
          </div>
        </div>
      </div>

      {/* TIME CONTROL PICKER MODAL (5-PART CHALLENGE ONLINE) */}
      {showTimeControlModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#24221f] border border-white/15 rounded-3xl p-5 sm:p-7 max-w-xl w-full shadow-2xl animate-in zoom-in duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold text-lg">
                  ⚡
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-white">Challenge Online</h3>
                  <p className="text-xs text-[#8c8b88]">Select your preferred format & match type to find an opponent</p>
                </div>
              </div>
              <button
                onClick={() => setShowTimeControlModal(false)}
                className="text-white/50 hover:text-white text-lg p-1.5 cursor-pointer rounded-lg hover:bg-white/5 transition"
              >
                ✕
              </button>
            </div>

            {/* RATED vs NON-RATED TOGGLE SECTION */}
            <div className="mb-4">
              <div className="bg-[#1b1a18] p-1 rounded-xl border border-white/10 flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setIsChallengeRated(true)}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                    isChallengeRated
                      ? 'bg-[#81b64c] text-white shadow'
                      : 'text-[#8c8b88] hover:text-white hover:bg-white/5'
                  }`}
                >
                  <span>🏆</span>
                  <span>Rated Match</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsChallengeRated(false)}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                    !isChallengeRated
                      ? 'bg-[#383531] text-white border border-white/20 shadow'
                      : 'text-[#8c8b88] hover:text-white hover:bg-white/5'
                  }`}
                >
                  <span>🎮</span>
                  <span>Non-Rated (Practice)</span>
                </button>
              </div>

              {/* Rated explanation helper */}
              <div className="mt-2 px-1 text-[11px] flex items-center justify-between">
                {isChallengeRated ? (
                  <span className="text-emerald-400 font-medium flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span>Rated: Rating will change according to your performance (+ / - Elo)</span>
                  </span>
                ) : (
                  <span className="text-amber-400/90 font-medium flex items-center gap-1.5">
                    <span>🛡️</span>
                    <span>Non-Rated: Casual practice duel — ratings will NOT change</span>
                  </span>
                )}
              </div>
            </div>

            {/* 5-PART CATEGORY TABS: 1-Bullet, 2-Blitz, 3-Rapid, 4-Classical, 5-Custom */}
            <div className="grid grid-cols-5 gap-1.5 bg-[#1b1a18] p-1.5 rounded-2xl border border-white/10 mb-4">
              {CHALLENGE_CATEGORIES.map((cat, idx) => {
                const isSelected = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      setSelectedCategory(cat.id);
                      if (cat.options && cat.options[0]) {
                        setSelectedOptionId(cat.options[0].id);
                      }
                    }}
                    className={`py-2 px-1.5 rounded-xl text-xs font-extrabold transition flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
                      isSelected
                        ? 'bg-[#2e2c28] text-white border border-[#81b64c]/70 shadow-md'
                        : 'text-[#8c8b88] hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <span className="text-base">{cat.icon}</span>
                    <span className="leading-tight text-[11px] truncate w-full text-center">
                      {idx + 1}. {cat.name}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* CATEGORY BODY: STANDARD 3 OPTIONS vs CUSTOM FRIEND NOTICE */}
            {(() => {
              const currentCat = CHALLENGE_CATEGORIES.find(c => c.id === selectedCategory) || CHALLENGE_CATEGORIES[0];
              const activeSelectedOpt = currentCat.options?.find(o => o.id === selectedOptionId) || currentCat.options?.[0];

              if (currentCat.isCustom) {
                return (
                  <div className="bg-[#1b1a18] border border-amber-500/30 rounded-2xl p-6 text-center mb-5">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-2xl mx-auto mb-3">
                      🤝
                    </div>
                    <h4 className="text-base font-extrabold text-white mb-1.5">
                      Custom Matches are Exclusive to Friends
                    </h4>
                    <p className="text-xs text-[#8c8b88] max-w-md mx-auto mb-5 leading-relaxed">
                      Global ranked matchmaking requires standard time controls to maintain fair queues and competitive ratings. To create a duel with custom time, custom number of questions, and custom difficulty, invite a friend!
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setShowTimeControlModal(false);
                        setShowChallengeModal(true);
                        handleSelectFriendCategory('custom');
                      }}
                      className="bg-[#81b64c] hover:bg-[#92c55b] text-white font-extrabold text-xs px-5 py-3 rounded-xl transition shadow-lg inline-flex items-center gap-2 cursor-pointer"
                    >
                      <span>🤝 Create Friend Custom Duel</span>
                      <span>→</span>
                    </button>
                  </div>
                );
              }

              return (
                <div>
                  {/* Category Details Banner */}
                  <div className="bg-[#1b1a18] border border-white/5 rounded-xl px-3.5 py-2.5 mb-4 flex items-center justify-between text-xs">
                    <span className="text-white/80 font-medium flex items-center gap-1.5 truncate">
                      <span>{currentCat.icon}</span>
                      <strong className="text-white">{currentCat.name}:</strong>
                      <span className="text-[#8c8b88] truncate">{currentCat.pointsDesc}</span>
                    </span>
                    <span className="text-[10px] bg-white/10 text-white/90 px-2 py-0.5 rounded font-mono font-bold shrink-0 ml-2">
                      {currentCat.badge}
                    </span>
                  </div>

                  {/* 3 Challenge Option Cards for this Category */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
                    {currentCat.options.map((opt, oIdx) => {
                      const isOptionActive = activeSelectedOpt?.id === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setSelectedOptionId(opt.id)}
                          className={`rounded-2xl p-4 flex flex-col items-center justify-between text-center transition group shadow cursor-pointer relative overflow-hidden ${
                            isOptionActive
                              ? 'bg-[#22281c] border-2 border-[#81b64c] shadow-[0_0_18px_rgba(129,182,76,0.35)]'
                              : 'bg-[#1e1d1a] hover:bg-[#2c2a26] border border-[#363430] hover:border-white/20'
                          }`}
                        >
                          <div className="w-full flex items-center justify-between text-[10px] text-[#8c8b88] mb-1.5 font-mono">
                            <span className={`px-1.5 py-0.5 rounded font-bold ${
                              isOptionActive ? 'bg-[#81b64c]/20 text-[#81b64c]' : 'bg-white/5 text-white/70'
                            }`}>
                              Option {oIdx + 1}
                            </span>
                            <span className="text-amber-400 font-bold">+{opt.points} pts</span>
                          </div>

                          <span className={`text-2xl sm:text-3xl font-black transition my-1 font-mono tracking-tight ${
                            isOptionActive ? 'text-[#81b64c]' : 'text-white group-hover:text-white/90'
                          }`}>
                            {opt.time}
                          </span>

                          <div className="mt-2 flex flex-col items-center gap-1 w-full">
                            <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border w-full truncate ${
                              isOptionActive
                                ? 'text-white bg-[#81b64c]/25 border-[#81b64c]/40'
                                : 'text-white/90 bg-[#282622] group-hover:bg-[#33302b] border-white/10'
                            }`}>
                              {opt.problems} {opt.problems === 1 ? 'Problem' : 'Problems'}
                            </span>
                            <span className="text-[10px] text-[#8c8b88]">
                              {opt.timeControl} • {opt.mode}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Footer Bar with Send Challenge Action */}
                  <div className="bg-[#1b1a18] p-3.5 sm:p-4 rounded-2xl border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                    <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 text-[#8c8b88] text-center sm:text-left">
                      <span>Selected:</span>
                      <div className="flex items-center gap-1.5 font-bold text-white flex-wrap justify-center sm:justify-start">
                        <strong className="text-white">{currentCat.name}</strong>
                        <span className="text-white/40">•</span>
                        <span className="text-[#81b64c] bg-[#81b64c]/10 border border-[#81b64c]/20 px-2 py-0.5 rounded font-mono font-bold">
                          ⚡ {activeSelectedOpt?.time || currentCat.options[0].time}
                        </span>
                        <span className="text-white/40">•</span>
                        <span>{activeSelectedOpt?.problems || 1} {activeSelectedOpt?.problems === 1 ? 'Problem' : 'Problems'}</span>
                        <span className="text-white/40">•</span>
                        <span className={isChallengeRated ? 'text-amber-400' : 'text-white/70'}>
                          {isChallengeRated ? '🏆 Rated' : '🎮 Non-Rated'}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleSelectChallengeOption(activeSelectedOpt || currentCat.options[0])}
                      className="w-full sm:w-auto bg-[#81b64c] hover:bg-[#92c55b] text-white font-black text-sm sm:text-base px-6 sm:px-8 py-3 sm:py-3.5 rounded-xl transition shadow-lg hover:shadow-emerald-500/25 cursor-pointer flex items-center justify-center gap-2 transform hover:-translate-y-0.5 active:translate-y-0 shrink-0 group"
                    >
                      <span className="text-base group-hover:scale-110 transition">⚔️</span>
                      <span>Send Challenge</span>
                      <span className="text-sm font-bold group-hover:translate-x-1 transition">→</span>
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* CHALLENGE A FRIEND MODAL (ALL 5 CATEGORIES + RATED/NON-RATED + CUSTOM) */}
      {showChallengeModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#24221f] border border-white/15 rounded-3xl p-5 sm:p-7 max-w-xl w-full shadow-2xl max-h-[92vh] overflow-y-auto animate-in zoom-in duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold text-lg">
                  🤝
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-white">Challenge a Friend</h3>
                  <p className="text-xs text-[#8c8b88]">Choose any time control or customize your own duel to battle a friend</p>
                </div>
              </div>
              <button 
                onClick={() => setShowChallengeModal(false)}
                className="text-white/50 hover:text-white text-lg p-1.5 cursor-pointer rounded-lg hover:bg-white/5 transition"
              >
                ✕
              </button>
            </div>

            {/* RATED vs NON-RATED TOGGLE SECTION */}
            <div className="mb-4">
              <div className="bg-[#1b1a18] p-1 rounded-xl border border-white/10 flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setFriendIsRated(true)}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                    friendIsRated
                      ? 'bg-[#81b64c] text-white shadow'
                      : 'text-[#8c8b88] hover:text-white hover:bg-white/5'
                  }`}
                >
                  <span>🏆</span>
                  <span>Rated Duel</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFriendIsRated(false)}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                    !friendIsRated
                      ? 'bg-[#383531] text-white border border-white/20 shadow'
                      : 'text-[#8c8b88] hover:text-white hover:bg-white/5'
                  }`}
                >
                  <span>🎮</span>
                  <span>Non-Rated (Practice)</span>
                </button>
              </div>

              <div className="mt-2 px-1 text-[11px] flex items-center justify-between">
                {friendIsRated ? (
                  <span className="text-emerald-400 font-medium flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span>Rated: Duel performance will update Elo rating (+ / - Elo)</span>
                  </span>
                ) : (
                  <span className="text-amber-400/90 font-medium flex items-center gap-1.5">
                    <span>🛡️</span>
                    <span>Non-Rated: Casual practice duel — ratings will NOT change</span>
                  </span>
                )}
              </div>
            </div>

            {/* 5-PART CATEGORY TABS: 1-Bullet, 2-Blitz, 3-Rapid, 4-Classical, 5-Custom */}
            <div className="grid grid-cols-5 gap-1.5 bg-[#1b1a18] p-1.5 rounded-2xl border border-white/10 mb-4">
              {CHALLENGE_CATEGORIES.map((cat, idx) => {
                const isSelected = friendCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => handleSelectFriendCategory(cat.id)}
                    className={`py-2 px-1.5 rounded-xl text-xs font-extrabold transition flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
                      isSelected
                        ? 'bg-[#2e2c28] text-white border border-[#81b64c]/70 shadow-md'
                        : 'text-[#8c8b88] hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <span className="text-base">{cat.icon}</span>
                    <span className="leading-tight text-[11px] truncate w-full text-center">
                      {idx + 1}. {cat.name}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* CATEGORY BODY: STANDARD 3 OPTIONS vs CUSTOM DUEL SETUP */}
            {(() => {
              const currentCat = CHALLENGE_CATEGORIES.find(c => c.id === friendCategory) || CHALLENGE_CATEGORIES[0];

              if (currentCat.isCustom) {
                return (
                  <div className="bg-[#1b1a18] border border-white/10 rounded-2xl p-4 sm:p-5 mb-4 space-y-4">
                    <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">⚙️</span>
                        <span className="text-sm font-bold text-white">Custom Duel Configuration</span>
                      </div>
                      <span className="text-[10px] bg-white/10 text-white/90 px-2 py-0.5 rounded font-mono font-bold">
                        Friend Exclusive
                      </span>
                    </div>

                    {/* 1. Time Selection */}
                    <div>
                      <label className="block text-xs font-bold text-white mb-1.5">
                        1. Match Duration (Minutes)
                      </label>
                      <div className="grid grid-cols-4 gap-2 mb-2">
                        {['10', '15', '25', '30', '45', '60', '90', '120'].map((mins) => (
                          <button
                            key={mins}
                            type="button"
                            onClick={() => setCustomFriendTime(mins)}
                            className={`py-1.5 px-2 rounded-lg text-xs font-mono font-bold transition cursor-pointer ${
                              customFriendTime === mins
                                ? 'bg-[#81b64c] text-white shadow'
                                : 'bg-[#23221f] border border-white/10 text-[#8c8b88] hover:text-white'
                            }`}
                          >
                            {mins}m
                          </button>
                        ))}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-[#8c8b88]">Custom:</span>
                        <input
                          type="number"
                          min="1"
                          max="180"
                          value={customFriendTime}
                          onChange={(e) => setCustomFriendTime(e.target.value)}
                          className="w-24 bg-[#23221f] border border-white/15 rounded-lg px-2.5 py-1 text-xs text-white font-mono focus:border-[#81b64c] focus:outline-none"
                        />
                        <span className="text-[11px] text-[#8c8b88]">minutes total</span>
                      </div>
                    </div>

                    {/* 2. Number of Questions (1, 2, 3) */}
                    <div>
                      <label className="block text-xs font-bold text-white mb-1.5">
                        2. Number of Questions
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {[1, 2, 3].map((num) => (
                          <button
                            key={num}
                            type="button"
                            onClick={() => handleSelectCustomProblems(num)}
                            className={`py-2 px-3 rounded-xl text-xs font-bold transition cursor-pointer flex flex-col items-center gap-0.5 ${
                              customFriendProblems === num
                                ? 'bg-[#81b64c] text-white shadow'
                                : 'bg-[#23221f] border border-white/10 text-[#8c8b88] hover:text-white'
                            }`}
                          >
                            <span className="text-sm font-black">{num}</span>
                            <span className="text-[10px]">{num === 1 ? 'Problem' : 'Problems'}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* 3. Difficulty of Questions */}
                    <div>
                      <label className="block text-xs font-bold text-white mb-1.5">
                        3. Problem Difficulty
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {[
                          { id: 'easy', label: 'Easy', pts: '3 Pts', color: 'text-emerald-400' },
                          { id: 'medium', label: 'Medium', pts: '5 Pts', color: 'text-yellow-400' },
                          { id: 'hard', label: 'Hard', pts: '6-7 Pts', color: 'text-red-400' },
                          { id: 'mixed', label: 'Mixed', pts: 'Varied', color: 'text-purple-400' }
                        ].map((d) => (
                          <button
                            key={d.id}
                            type="button"
                            onClick={() => handleSelectCustomDifficulty(d.id)}
                            className={`py-2 px-2 rounded-xl text-xs font-bold transition cursor-pointer flex flex-col items-center ${
                              customFriendDifficulty === d.id
                                ? 'bg-[#2e2c28] border border-[#81b64c] text-white shadow'
                                : 'bg-[#23221f] border border-white/10 text-[#8c8b88] hover:text-white'
                            }`}
                          >
                            <span>{d.label}</span>
                            <span className={`text-[10px] font-mono ${d.color}`}>{d.pts}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              }

              return (
                <div className="mb-4">
                  {/* Category Details Banner */}
                  <div className="bg-[#1b1a18] border border-white/5 rounded-xl px-3.5 py-2.5 mb-3 flex items-center justify-between text-xs">
                    <span className="text-white/80 font-medium flex items-center gap-1.5 truncate">
                      <span>{currentCat.icon}</span>
                      <strong className="text-white">{currentCat.name}:</strong>
                      <span className="text-[#8c8b88] truncate">{currentCat.pointsDesc}</span>
                    </span>
                    <span className="text-[10px] bg-white/10 text-white/90 px-2 py-0.5 rounded font-mono font-bold shrink-0 ml-2">
                      {currentCat.badge}
                    </span>
                  </div>

                  {/* 3 Challenge Option Cards for this Category */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {currentCat.options.map((opt, oIdx) => {
                      const isOptionSelected = friendSelectedOptionId === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => handleSelectFriendOption(opt.id)}
                          className={`border rounded-2xl p-3.5 flex flex-col items-center justify-between text-center transition group shadow cursor-pointer relative overflow-hidden ${
                            isOptionSelected
                              ? 'bg-[#2b2925] border-[#81b64c] ring-1 ring-[#81b64c]/50'
                              : 'bg-[#1e1d1a] hover:bg-[#2c2a26] border-[#363430] hover:border-white/20'
                          }`}
                        >
                          <div className="w-full flex items-center justify-between text-[10px] text-[#8c8b88] mb-1 font-mono">
                            <span className="bg-white/5 px-1.5 py-0.5 rounded font-bold">Option {oIdx + 1}</span>
                            <span className="text-amber-400 font-bold">+{opt.points} pts</span>
                          </div>

                          <span className={`text-2xl sm:text-3xl font-black my-1 font-mono tracking-tight transition ${
                            isOptionSelected ? 'text-[#81b64c]' : 'text-white group-hover:text-white'
                          }`}>
                            {opt.time}
                          </span>

                          <div className="mt-1 flex flex-col items-center gap-0.5 w-full">
                            <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border w-full truncate ${
                              isOptionSelected
                                ? 'bg-[#81b64c]/20 text-[#81b64c] border-[#81b64c]/40'
                                : 'bg-[#282622] text-white/90 border-white/10'
                            }`}>
                              {opt.problems} {opt.problems === 1 ? 'Problem' : 'Problems'}
                            </span>
                            <span className="text-[10px] text-[#8c8b88] mt-0.5">
                              {opt.timeControl} • {opt.mode}
                            </span>
                          </div>

                          {isOptionSelected && (
                            <div className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#81b64c]"></div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })()}



            {/* FRIEND INVITE CONTROLS & LINK SHARING */}
            <div className="bg-[#1b1a18] p-3.5 rounded-2xl border border-white/10 space-y-3 mb-4">
              {friendModalError && (
                <div className="bg-amber-500/15 border border-amber-500/40 text-amber-300 text-xs px-3 py-2 rounded-xl flex items-center gap-2 animate-in fade-in duration-150">
                  <span>⚠️</span>
                  <span>{friendModalError}</span>
                </div>
              )}

              {/* TWO OPPONENT SELECTION OPTIONS: 1. Online Friends, 2. Type Username */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-[#8c8b88] uppercase tracking-wider flex items-center gap-1.5">
                    <span>🎯</span> Opponent Selection
                  </span>
                  {friendUsername && (
                    <div className="flex items-center gap-1 text-[11px]">
                      <span className="text-[#8c8b88]">Selected:</span>
                      <span className="bg-[#81b64c]/20 text-[#81b64c] border border-[#81b64c]/40 px-2 py-0.5 rounded-md font-mono font-bold truncate max-w-[140px]">
                        @{friendUsername}
                      </span>
                      <button
                        type="button"
                        onClick={() => setFriendUsername('')}
                        className="text-white/40 hover:text-white ml-0.5 p-0.5 rounded cursor-pointer"
                        title="Clear selection"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>

                {/* Option Tabs */}
                <div className="grid grid-cols-2 gap-1.5 p-1 bg-[#23221f] rounded-xl border border-white/10 mb-3">
                  <button
                    type="button"
                    onClick={() => {
                      setFriendTargetMode('online');
                      if (friendModalError) setFriendModalError('');
                    }}
                    className={`py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                      friendTargetMode === 'online'
                        ? 'bg-[#2e2c28] text-white border border-[#81b64c]/70 shadow'
                        : 'text-[#8c8b88] hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span>Online Friends</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold ${
                      onlineFriends.length > 0
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-white/5 text-[#8c8b88]'
                    }`}>
                      {onlineFriends.length}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setFriendTargetMode('type');
                      if (friendModalError) setFriendModalError('');
                    }}
                    className={`py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                      friendTargetMode === 'type'
                        ? 'bg-[#2e2c28] text-white border border-[#81b64c]/70 shadow'
                        : 'text-[#8c8b88] hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <span>✍️</span>
                    <span>Type Username</span>
                  </button>
                </div>

                {/* OPTION 1: ONLINE FRIENDS LIST */}
                {friendTargetMode === 'online' && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[11px] text-[#8c8b88] px-0.5">
                      <span>Select a friend currently active to battle:</span>
                      <button
                        type="button"
                        onClick={fetchMyFriends}
                        disabled={loadingFriends}
                        className="text-[#81b64c] hover:underline flex items-center gap-1 cursor-pointer disabled:opacity-50"
                        title="Refresh online status"
                      >
                        <span className={loadingFriends ? 'animate-spin inline-block' : ''}>🔄</span>
                        <span>Refresh</span>
                      </button>
                    </div>

                    {loadingFriends ? (
                      <div className="py-6 text-center text-xs text-[#8c8b88] bg-[#23221f] rounded-xl border border-white/5 flex flex-col items-center justify-center gap-2">
                        <span className="w-5 h-5 border-2 border-[#81b64c] border-t-transparent rounded-full animate-spin"></span>
                        <span>Checking online friends...</span>
                      </div>
                    ) : !user ? (
                      <div className="p-4 text-center text-xs text-[#8c8b88] bg-[#23221f] rounded-xl border border-white/5">
                        <p className="mb-2">Please log in to see and challenge your online friends directly.</p>
                        <button
                          type="button"
                          onClick={() => setFriendTargetMode('type')}
                          className="text-[#81b64c] font-bold underline cursor-pointer text-xs"
                        >
                          Or type their username manually →
                        </button>
                      </div>
                    ) : onlineFriends.length === 0 ? (
                      <div className="p-4 text-center bg-[#23221f] rounded-xl border border-dashed border-white/10">
                        <div className="text-xl mb-1">😴</div>
                        <p className="text-xs font-bold text-white mb-0.5">No friends are online right now</p>
                        <p className="text-[11px] text-[#8c8b88] mb-2.5">
                          {myFriends.length > 0 
                            ? `You have ${myFriends.length} friend${myFriends.length > 1 ? 's' : ''}, but none are active at the moment.` 
                            : 'You haven\'t added any friends yet.'}
                        </p>
                        <button
                          type="button"
                          onClick={() => setFriendTargetMode('type')}
                          className="bg-[#2e2c28] hover:bg-[#3b3833] text-white px-3 py-1.5 rounded-lg text-xs font-bold border border-white/10 transition cursor-pointer inline-flex items-center gap-1.5"
                        >
                          <span>✍️ Type opponent username manually</span>
                        </button>
                      </div>
                    ) : (
                      <div className="max-h-44 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin scrollbar-thumb-white/10">
                        {onlineFriends.map((f) => {
                          const isSelected = friendUsername.toLowerCase() === f.username.toLowerCase();
                          return (
                            <div
                              key={f._id || f.username}
                              onClick={() => {
                                setFriendUsername(f.username);
                                if (friendModalError) setFriendModalError('');
                              }}
                              className={`p-2.5 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition ${
                                isSelected
                                  ? 'bg-[#81b64c]/15 border-[#81b64c] shadow-sm ring-1 ring-[#81b64c]/40'
                                  : 'bg-[#23221f] hover:bg-[#2a2925] border-white/10 hover:border-white/20'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className="relative shrink-0">
                                  {f.avatar ? (
                                    <img
                                      src={f.avatar}
                                      alt={f.username}
                                      className="w-8 h-8 rounded-full object-cover border border-white/20"
                                    />
                                  ) : (
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#81b64c] to-[#456b23] text-white font-black text-xs flex items-center justify-center">
                                      {f.username.charAt(0).toUpperCase()}
                                    </div>
                                  )}
                                  <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#1b1a18] animate-pulse"></span>
                                </div>

                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-xs font-bold text-white truncate">
                                      {f.displayName || f.username}
                                    </span>
                                    <span className="text-[10px] text-[#8c8b88] font-mono truncate">
                                      @{f.username}
                                    </span>
                                  </div>
                                  <div className="text-[10px] text-[#8c8b88] flex items-center gap-1.5 mt-0.5">
                                    <span className="text-emerald-400 font-semibold flex items-center gap-1">
                                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Online
                                    </span>
                                    <span>•</span>
                                    <span className="font-mono text-yellow-400 font-bold">
                                      ⚡ {f.ratings?.[friendCategory] || f.ratings?.bullet || f.ratings?.blitz || 1500}
                                    </span>
                                    {f.tier && <span>• {f.tier}</span>}
                                  </div>
                                </div>
                              </div>

                              <div className="shrink-0">
                                {isSelected ? (
                                  <span className="bg-[#81b64c] text-white text-[11px] font-black px-2.5 py-1 rounded-lg flex items-center gap-1 shadow">
                                    <span>✓</span> Selected
                                  </span>
                                ) : (
                                  <span className="bg-white/5 hover:bg-white/10 text-white/80 text-[11px] font-bold px-2.5 py-1 rounded-lg border border-white/10 transition">
                                    Select
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* OPTION 2: TYPE USERNAME MANUALLY */}
                {friendTargetMode === 'type' && (
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold text-[#8c8b88]">
                      Friend's Username (Required for direct challenge)
                    </label>
                    <div className="relative">
                      <input 
                        type="text" 
                        placeholder="Enter your friend's username..."
                        value={friendUsername}
                        onChange={(e) => {
                          setFriendUsername(e.target.value);
                          if (friendModalError) setFriendModalError('');
                        }}
                        className="w-full bg-[#23221f] border border-white/15 rounded-xl px-3 py-2.5 text-xs text-white placeholder-white/40 focus:outline-none focus:border-[#81b64c]"
                      />
                      {friendUsername && (
                        <button
                          type="button"
                          onClick={() => setFriendUsername('')}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white text-xs cursor-pointer p-1"
                          title="Clear input"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                    <p className="text-[10px] text-[#8c8b88]">
                      Enter any user's exact username to send them a live 1v1 battle challenge.
                    </p>
                  </div>
                )}
              </div>

              {/* Direct Challenge Link with Copy Button */}
              <div>
                <label className="block text-[11px] font-bold text-[#8c8b88] mb-1">
                  Direct Challenge Link
                </label>
                <div className="bg-[#23221f] p-2 sm:p-2.5 rounded-xl border border-white/10 flex items-center justify-between gap-2 font-mono text-[11px] text-white/80 break-all">
                  <span className="truncate">{getFriendChallengeUrl()}</span>
                  <button
                    type="button"
                    onClick={handleCopyChallenge}
                    className="bg-[#2e2c28] hover:bg-[#3b3833] text-white px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 border border-white/10 transition cursor-pointer flex items-center gap-1"
                  >
                    <span>{challengeCopied ? '✓' : '📋'}</span>
                    <span>{challengeCopied ? 'Copied!' : 'Copy Link'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* ACTION BUTTON */}
            {(() => {
              const currentCat = CHALLENGE_CATEGORIES.find(c => c.id === friendCategory) || CHALLENGE_CATEGORIES[0];
              const selectedOpt = currentCat.options?.find(o => o.id === friendSelectedOptionId) || currentCat.options?.[0];
              const summaryText = currentCat.isCustom
                ? `Custom (${customFriendTime}m • ${customFriendProblems} ${customFriendProblems === 1 ? 'Problem' : 'Problems'} • ${customFriendDifficulty.toUpperCase()})`
                : `${currentCat.name} (${selectedOpt?.time || '10 min'} • ${selectedOpt?.problems || 1} ${selectedOpt?.problems === 1 ? 'Problem' : 'Problems'})`;

              return (
                <button
                  type="button"
                  onClick={handleStartFriendChallenge}
                  className="w-full bg-[#81b64c] hover:bg-[#92c55b] text-white font-black text-xs sm:text-sm py-3 px-4 rounded-xl transition shadow-lg cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>🤝 Start Friend Challenge ({summaryText} • {friendIsRated ? 'Rated 🏆' : 'Non-Rated 🎮'})</span>
                  <span>→</span>
                </button>
              );
            })()}
          </div>
        </div>
      )}

      {/* TOURNAMENTS MODAL */}
      {showTournamentsModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#24221f] border border-white/15 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
              <div className="flex items-center gap-2">
                <span className="text-xl">🏅</span>
                <h3 className="text-lg font-extrabold text-white">Arena Tournaments</h3>
              </div>
              <button 
                onClick={() => setShowTournamentsModal(false)}
                className="text-white/50 hover:text-white text-sm p-1 cursor-pointer rounded-lg hover:bg-white/5"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-[#8c8b88] mb-4">
              Join open arena tournaments where anyone can compete, solve algorithmic puzzles, and climb to the podium. Strictly practice-only with zero rating deductions.
            </p>

            {tournamentsLoading ? (
              <div className="p-8 text-center text-xs text-[#8c8b88]">
                Loading available tournaments...
              </div>
            ) : appTournaments.length === 0 ? (
              <div className="bg-[#1b1a18] p-6 rounded-2xl border border-dashed border-white/10 text-center space-y-2.5 mb-5">
                <div className="text-3xl">⏳</div>
                <h4 className="text-sm font-extrabold text-white">Coming Soon</h4>
                <p className="text-xs text-[#8c8b88] max-w-sm mx-auto">
                  No tournaments are currently scheduled. Our administrators will publish upcoming practice tournaments here soon!
                </p>
                <div className="inline-block bg-[#81b64c]/10 text-[#81b64c] text-[10px] font-bold px-3 py-1 rounded-full border border-[#81b64c]/30">
                  🛡️ Practice Only • 0 Rating Risk
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-3 mb-5 max-h-96 overflow-y-auto pr-1">
                {appTournaments.map((tourney) => {
                  const isUserRegistered = tourney.participants?.some(
                    p => (user?._id && p.userId === user._id) || (user?.username && p.username === user.username)
                  );
                  const isCompleted = tourney.status === 'COMPLETED';
                  const isActive = tourney.status === 'ACTIVE';
                  const isUpcoming = tourney.status === 'UPCOMING';

                  return (
                    <div key={tourney._id} className="bg-[#1b1a18] p-3.5 rounded-xl border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-white">{tourney.title}</span>
                          <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded border uppercase tracking-wider ${
                            isActive
                              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                              : isCompleted
                              ? 'bg-sky-500/20 text-sky-400 border-sky-500/30'
                              : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                          }`}>
                            {tourney.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs mt-0.5">
                          <span className="text-[#81b64c] font-semibold">{tourney.timeControl || '15+0'} ({tourney.mode || 'Blitz'})</span>
                          <span className="text-white/30">•</span>
                          <span className="text-white/60 font-mono text-[11px]">{tourney.durationMinutes || 15}m</span>
                          <span className="text-white/30">•</span>
                          <span className="text-amber-400/90 text-[11px] font-bold">Practice Only</span>
                        </div>
                        {tourney.description && (
                          <span className="text-[11px] text-[#8c8b88] mt-1 line-clamp-1">{tourney.description}</span>
                        )}
                        <div className="flex items-center gap-3 text-[10px] text-white/50 mt-1.5 font-mono">
                          <span>📚 {tourney.problems?.length || 0} Problems</span>
                          <span>👥 {tourney.participants?.length || 0} Players</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                        {(isCompleted || (tourney.participants && tourney.participants.length > 0)) && (
                          <button
                            type="button"
                            onClick={() => setViewingAppLeaderboard(tourney)}
                            className="bg-[#262421] hover:bg-[#302d29] text-amber-300 font-bold text-xs px-3 py-2 rounded-lg border border-amber-500/30 transition cursor-pointer"
                          >
                            🏆 Rankings
                          </button>
                        )}

                        {isUpcoming && (
                          isUserRegistered ? (
                            <button
                              disabled
                              className="bg-emerald-500/10 text-emerald-400 font-bold text-xs px-3.5 py-2 rounded-lg border border-emerald-500/30"
                            >
                              ✓ Registered
                            </button>
                          ) : (
                            <button
                              onClick={() => handleRegisterTournament(tourney._id)}
                              disabled={registeringId === tourney._id}
                              className="bg-[#81b64c] hover:bg-[#92c55b] text-white font-bold text-xs px-3.5 py-2 rounded-lg transition cursor-pointer disabled:opacity-50"
                            >
                              {registeringId === tourney._id ? 'Registering...' : 'Register'}
                            </button>
                          )
                        )}

                        {isActive && (
                          <button
                            onClick={() => handleEnterTournament(tourney)}
                            className="bg-[#81b64c] hover:bg-[#92c55b] text-white font-bold text-xs px-3.5 py-2 rounded-lg transition cursor-pointer shadow-md flex items-center gap-1.5"
                          >
                            <span>Enter Arena</span>
                            <span>→</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <button
              onClick={() => {
                setShowTournamentsModal(false);
                navigate('/training');
              }}
              className="w-full bg-[#2b2926] hover:bg-[#363431] border border-white/10 text-white font-bold text-xs py-3 rounded-xl transition cursor-pointer"
            >
              View Training & Practice Grounds
            </button>
          </div>
        </div>
      )}

      {/* TOURNAMENT LEADERBOARD / RANKINGS MODAL */}
      {viewingAppLeaderboard && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#24221f] border border-white/15 rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4 shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🏆</span>
                <div>
                  <h3 className="text-lg font-extrabold text-white">
                    {viewingAppLeaderboard.title} — Leaderboard
                  </h3>
                  <p className="text-xs text-[#8c8b88]">
                    {viewingAppLeaderboard.timeControl} ({viewingAppLeaderboard.mode}) • Practice Only
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setViewingAppLeaderboard(null)}
                className="text-white/50 hover:text-white text-sm p-1 cursor-pointer rounded-lg hover:bg-white/5"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto mb-4">
              {(!viewingAppLeaderboard.participants || viewingAppLeaderboard.participants.length === 0) ? (
                <div className="p-8 text-center space-y-2">
                  <div className="text-3xl">👥</div>
                  <p className="text-sm font-bold text-white">No participants yet</p>
                  <p className="text-xs text-[#8c8b88]">
                    Rankings will appear as players solve challenges in this arena.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto bg-[#1b1a18] border border-white/5 rounded-xl">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-[#2b2926] text-[#8c8b88] border-b border-white/5 font-bold uppercase tracking-wider text-[11px]">
                        <th className="py-3 px-4">Rank</th>
                        <th className="py-3 px-4">Player</th>
                        <th className="py-3 px-3">Problems Solved</th>
                        <th className="py-3 px-3">Score</th>
                        <th className="py-3 px-3">Time</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 font-medium">
                      {[...viewingAppLeaderboard.participants]
                        .sort((a, b) => (a.rank || 999) - (b.rank || 999))
                        .map((part, idx) => (
                          <tr key={idx} className="hover:bg-white/[0.02]">
                            <td className="py-3 px-4 font-black">
                              {idx === 0 ? '🥇 1st' : idx === 1 ? '🥈 2nd' : idx === 2 ? '🥉 3rd' : `#${idx + 1}`}
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-[#81b64c]/20 text-[#81b64c] flex items-center justify-center font-bold text-[10px]">
                                  {part.username?.charAt(0)?.toUpperCase() || 'P'}
                                </div>
                                <span className="font-bold text-white">{part.username}</span>
                              </div>
                            </td>
                            <td className="py-3 px-3 text-[#81b64c] font-bold">
                              {part.problemsSolved || 0} solved
                            </td>
                            <td className="py-3 px-3 font-mono text-amber-400 font-bold">
                              {part.score || 0} pts
                            </td>
                            <td className="py-3 px-3 font-mono text-white/70">
                              {part.timeTakenSeconds ? `${Math.floor(part.timeTakenSeconds / 60)}m ${part.timeTakenSeconds % 60}s` : '--'}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-white/10 flex items-center justify-between shrink-0">
              <span className="text-[11px] text-[#81b64c] font-bold">
                🛡️ Practice Only: Global ratings are not changed.
              </span>
              <button
                type="button"
                onClick={() => setViewingAppLeaderboard(null)}
                className="bg-[#2b2926] hover:bg-[#363431] text-white text-xs font-bold px-4 py-2 rounded-xl transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
