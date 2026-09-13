import { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { fetchRandomBattleProblems } from '../utils/problemSelector';

export default function Community() {
  const { user } = useAuth();
  const { sendChallenge } = useSocket();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const handleBattleUser = async (targetUsername, battleMode = 'Blitz') => {
    const [randomSlug] = await fetchRandomBattleProblems({ mode: battleMode, count: 1 });
    sendChallenge({
      toUsername: targetUsername,
      mode: battleMode,
      timeControl: '3 + 0',
      isRated: true,
      problemsCount: 1,
      problemList: [randomSlug || 'two-sum'],
      durationSeconds: 180
    });
  };

  const [activeTab, setActiveTab] = useState(
    searchParams.get('tab') === 'clubs' || searchParams.get('create') === 'club' 
      ? 'clubs' 
      : searchParams.get('tab') === 'friends' 
      ? 'friends' 
      : 'leaderboard'
  ); // 'leaderboard' (first), 'friends' (second), 'clubs' (third)
  const [clubs, setClubs] = useState([]);
  const [clubSearch, setClubSearch] = useState('');
  const [clubFilter, setClubFilter] = useState('all'); // 'all', 'my'
  const [loadingClubs, setLoadingClubs] = useState(true);

  // Friends state
  const [friendsList, setFriendsList] = useState([]);
  const [loadingFriends, setLoadingFriends] = useState(false);
  const [friendSearch, setFriendSearch] = useState('');

  // Leaderboard & players
  const [players, setPlayers] = useState([]);
  const [playerSearch, setPlayerSearch] = useState(searchParams.get('q') || '');
  const [loadingPlayers, setLoadingPlayers] = useState(false);
  const [leaderboardSort, setLeaderboardSort] = useState('blitz'); // 'blitz', 'rapid', 'bullet', 'solved'

  // Create Club Modal
  const [showCreateModal, setShowCreateModal] = useState(searchParams.get('create') === 'club' || searchParams.get('create') === '1');
  const [newClubName, setNewClubName] = useState('');
  const [newClubDesc, setNewClubDesc] = useState('');
  const [newClubIcon, setNewClubIcon] = useState('💻');
  const [newClubLocation, setNewClubLocation] = useState('');
  const [createError, setCreateError] = useState('');
  const [createSubmitting, setCreateSubmitting] = useState(false);

  // Manage Club Members Modal
  const [managingClub, setManagingClub] = useState(null);
  const [memberUsernameToAdd, setMemberUsernameToAdd] = useState('');
  const [manageError, setManageError] = useState('');
  const [manageSuccess, setManageSuccess] = useState('');
  const [manageSubmitting, setManageSubmitting] = useState(false);

  // Auto-open create modal or switch tab if url parameter exists
  useEffect(() => {
    if (searchParams.get('create') === 'club' || searchParams.get('create') === '1') {
      setShowCreateModal(true);
    }
    const tabParam = searchParams.get('tab');
    if (tabParam === 'clubs') {
      setActiveTab('clubs');
    } else if (tabParam === 'friends') {
      setActiveTab('friends');
    } else if (tabParam === 'leaderboard') {
      setActiveTab('leaderboard');
    }
  }, [searchParams]);

  // Fetch Clubs
  const fetchClubs = async () => {
    try {
      setLoadingClubs(true);
      const res = await axios.get(`http://localhost:5000/api/clubs${clubSearch ? `?search=${encodeURIComponent(clubSearch)}` : ''}`);
      setClubs(res.data);
    } catch (err) {
      console.error('Failed to fetch clubs:', err);
    } finally {
      setLoadingClubs(false);
    }
  };

  useEffect(() => {
    fetchClubs();
  }, [clubSearch]);

  // Fetch Players / Leaderboard
  const fetchPlayers = async () => {
    try {
      setLoadingPlayers(true);
      const query = playerSearch.trim();
      const res = await axios.get(
        `http://localhost:5000/api/users/leaderboard?sortBy=${leaderboardSort}${query ? `&q=${encodeURIComponent(query)}` : ''}`
      );
      setPlayers(res.data);
    } catch (err) {
      console.error('Failed to fetch leaderboard:', err);
    } finally {
      setLoadingPlayers(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'leaderboard') {
      fetchPlayers();
    }
  }, [activeTab, playerSearch, leaderboardSort]);

  // Fetch Friends
  const fetchFriends = async () => {
    if (!user?.username) {
      setFriendsList([]);
      return;
    }
    try {
      setLoadingFriends(true);
      const res = await axios.get(`http://localhost:5000/api/users/${user.username}/friends`);
      if (res.data?.success && Array.isArray(res.data.friends)) {
        setFriendsList(res.data.friends);
      }
    } catch (err) {
      console.error('Failed to fetch friends:', err);
    } finally {
      setLoadingFriends(false);
    }
  };

  useEffect(() => {
    if (user?.username) {
      fetchFriends();
    }
  }, [user?.username]);

  useEffect(() => {
    if (activeTab === 'friends' && user?.username) {
      fetchFriends();
    }
  }, [activeTab]);

  const filteredFriends = friendsList.filter(f => {
    if (!friendSearch.trim()) return true;
    const q = friendSearch.toLowerCase().trim();
    return (
      (f.username && f.username.toLowerCase().includes(q)) ||
      (f.displayName && f.displayName.toLowerCase().includes(q))
    );
  });

  // Handle Create Club
  const handleCreateClub = async (e) => {
    e.preventDefault();
    setCreateError('');
    if (!newClubName.trim()) {
      setCreateError('Please provide a club name.');
      return;
    }

    try {
      setCreateSubmitting(true);
      const token = localStorage.getItem('token');
      await axios.post(
        'http://localhost:5000/api/clubs',
        {
          name: newClubName.trim(),
          description: newClubDesc.trim() || 'A community of passionate competitive programmers.',
          icon: newClubIcon || '💻',
          location: newClubLocation.trim() || 'Global'
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setShowCreateModal(false);
      setNewClubName('');
      setNewClubDesc('');
      setNewClubLocation('');
      fetchClubs();
      // Remove create query param if present
      searchParams.delete('create');
      setSearchParams(searchParams);
    } catch (err) {
      setCreateError(err.response?.data?.message || 'Failed to create club.');
    } finally {
      setCreateSubmitting(false);
    }
  };

  // Handle Join Club
  const handleJoinClub = async (clubId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `http://localhost:5000/api/clubs/${clubId}/join`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchClubs();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to join club.');
    }
  };

  // Handle Leave Club
  const handleLeaveClub = async (clubId) => {
    if (!window.confirm('Are you sure you want to leave this club?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `http://localhost:5000/api/clubs/${clubId}/leave`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchClubs();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to leave club.');
    }
  };

  // Open Manage Members Modal
  const openManageModal = async (club) => {
    try {
      const res = await axios.get(`http://localhost:5000/api/clubs/${club.slug || club.id}`);
      setManagingClub(res.data);
      setManageError('');
      setManageSuccess('');
      setMemberUsernameToAdd('');
    } catch (err) {
      alert('Could not load club details.');
    }
  };

  // Add Member
  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!memberUsernameToAdd.trim() || !managingClub) return;
    setManageError('');
    setManageSuccess('');

    try {
      setManageSubmitting(true);
      const token = localStorage.getItem('token');
      const res = await axios.post(
        `http://localhost:5000/api/clubs/${managingClub.id}/members`,
        { username: memberUsernameToAdd.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setManageSuccess(res.data.message);
      setMemberUsernameToAdd('');
      // Reload club details
      const updated = await axios.get(`http://localhost:5000/api/clubs/${managingClub.id}`);
      setManagingClub(updated.data);
      fetchClubs();
    } catch (err) {
      setManageError(err.response?.data?.message || 'Failed to add member.');
    } finally {
      setManageSubmitting(false);
    }
  };

  // Remove Member
  const handleRemoveMember = async (memberUserId) => {
    if (!managingClub) return;
    if (!window.confirm('Are you sure you want to remove this member?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(
        `http://localhost:5000/api/clubs/${managingClub.id}/members/${memberUserId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const updated = await axios.get(`http://localhost:5000/api/clubs/${managingClub.id}`);
      setManagingClub(updated.data);
      fetchClubs();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to remove member.');
    }
  };

  // Delete Club
  const handleDeleteClub = async () => {
    if (!managingClub) return;
    if (!window.confirm(`Are you sure you want to permanently delete "${managingClub.name}"? This action cannot be undone.`)) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(
        `http://localhost:5000/api/clubs/${managingClub.id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setManagingClub(null);
      fetchClubs();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete club.');
    }
  };

  const filteredClubs = clubs.filter(c => {
    if (clubFilter === 'my') {
      return c.members?.some(m => m.username === user?.username) || c.owner?.username === user?.username;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-[#161512] text-[#c9c8c5] px-4 py-8 sm:px-6 lg:px-12 max-w-6xl mx-auto">
      
      {/* HEADER BAR */}
      <div className="pb-6 border-b border-[#2d2a26]">
        <div className="flex items-center gap-2">
          <span className="text-2xl">👥</span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Community
          </h1>
        </div>
        <p className="text-xs sm:text-sm text-[#8c8b88] mt-1">
          Explore global rankings, connect with competitive programmers, and discover coding clubs.
        </p>
      </div>

      {/* TABS: LEADERBOARD, FRIENDS, CLUBS */}
      <div className="flex items-center gap-6 sm:gap-8 border-b border-[#2d2a26] mt-6 text-sm font-semibold overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveTab('leaderboard')}
          className={`pb-3 transition relative cursor-pointer whitespace-nowrap ${
            activeTab === 'leaderboard' ? 'text-white font-bold' : 'text-[#8c8b88] hover:text-white'
          }`}
        >
          <span>🏆 Leaderboard Ranking</span>
          {activeTab === 'leaderboard' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#81b64c] rounded-full"></div>
          )}
        </button>

        <button
          onClick={() => setActiveTab('friends')}
          className={`pb-3 transition relative cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'friends' ? 'text-white font-bold' : 'text-[#8c8b88] hover:text-white'
          }`}
        >
          <span>👥 Friends</span>
          {friendsList.length > 0 && (
            <span className="text-[10px] bg-[#2b2926] text-[#81b64c] px-2 py-0.5 rounded-full border border-white/5 font-bold">
              {friendsList.length}
            </span>
          )}
          {activeTab === 'friends' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#81b64c] rounded-full"></div>
          )}
        </button>

        <button
          onClick={() => setActiveTab('clubs')}
          className={`pb-3 transition relative cursor-pointer whitespace-nowrap ${
            activeTab === 'clubs' ? 'text-white font-bold' : 'text-[#8c8b88] hover:text-white'
          }`}
        >
          <span>🏛️ Clubs ({clubs.length})</span>
          {activeTab === 'clubs' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#81b64c] rounded-full"></div>
          )}
        </button>
      </div>

      {/* TAB 1: LEADERBOARD & PLAYER SEARCH (COMES FIRST) */}
      {activeTab === 'leaderboard' && (
        <div className="mt-6 flex flex-col gap-4">
          {/* Controls: Format Pills & Search Input */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
            {/* Format Sort Selector Buttons */}
            <div className="flex items-center gap-1.5 bg-[#21201d] p-1.5 rounded-2xl border border-[#2d2a26] overflow-x-auto shadow-md">
              <button
                type="button"
                onClick={() => setLeaderboardSort('blitz')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                  leaderboardSort === 'blitz'
                    ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/40 shadow'
                    : 'text-[#8c8b88] hover:text-white hover:bg-white/5 border border-transparent'
                }`}
              >
                <span>⚡</span>
                <span>Blitz Rating</span>
              </button>

              <button
                type="button"
                onClick={() => setLeaderboardSort('rapid')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                  leaderboardSort === 'rapid'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow'
                    : 'text-[#8c8b88] hover:text-white hover:bg-white/5 border border-transparent'
                }`}
              >
                <span>⏱️</span>
                <span>Rapid Rating</span>
              </button>

              <button
                type="button"
                onClick={() => setLeaderboardSort('bullet')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                  leaderboardSort === 'bullet'
                    ? 'bg-orange-500/20 text-orange-300 border border-orange-500/40 shadow'
                    : 'text-[#8c8b88] hover:text-white hover:bg-white/5 border border-transparent'
                }`}
              >
                <span>🚀</span>
                <span>Bullet Rating</span>
              </button>

              <button
                type="button"
                onClick={() => setLeaderboardSort('solved')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                  leaderboardSort === 'solved'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow'
                    : 'text-[#8c8b88] hover:text-white hover:bg-white/5 border border-transparent'
                }`}
              >
                <span>🧩</span>
                <span>Questions Solved</span>
              </button>
            </div>

            {/* Player Search Bar */}
            <div className="relative lg:w-80 flex-shrink-0">
              <input
                type="text"
                value={playerSearch}
                onChange={(e) => setPlayerSearch(e.target.value)}
                placeholder="Search coders by username or name..."
                className="w-full bg-[#21201d] border border-[#2d2a26] focus:border-[#81b64c] text-white text-xs sm:text-sm px-4 py-2.5 rounded-xl pl-10 pr-9 placeholder-[#7d7c78] focus:outline-none transition shadow"
              />
              <span className="absolute left-3.5 top-2.5 sm:top-3 text-sm text-[#7d7c78]">🔍</span>
              {playerSearch && (
                <button
                  type="button"
                  onClick={() => setPlayerSearch('')}
                  className="absolute right-3 top-2.5 text-xs text-[#7d7c78] hover:text-white"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Active Sort Banner / Info */}
          <div className="flex items-center justify-between text-xs text-[#8c8b88] px-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-white">
                {leaderboardSort === 'blitz' && '⚡ Blitz Format (3 min)'}
                {leaderboardSort === 'rapid' && '⏱️ Rapid Format (10 min)'}
                {leaderboardSort === 'bullet' && '🚀 Bullet Format (1 min)'}
                {leaderboardSort === 'solved' && '🧩 Solved Problems Ranking'}
              </span>
              <span>• Ranked highest to lowest</span>
            </div>
            <span className="bg-[#21201d] px-2.5 py-1 rounded-lg border border-[#2d2a26] text-[11px] font-semibold text-stone-300">
              {players.length} {players.length === 1 ? 'coder' : 'coders'} on platform
            </span>
          </div>

          {/* Players Table */}
          <div className="bg-[#21201d] border border-[#2d2a26] rounded-2xl overflow-hidden shadow-2xl">
            {loadingPlayers ? (
              <div className="flex flex-col items-center justify-center p-12 gap-3 text-[#8c8b88]">
                <div className="w-8 h-8 border-3 border-[#81b64c]/30 border-t-[#81b64c] rounded-full animate-spin"></div>
                <span className="text-sm">Loading leaderboard rankings...</span>
              </div>
            ) : players.length === 0 ? (
              <div className="p-12 text-center text-[#8c8b88]">
                <span className="text-4xl block mb-2">🔍</span>
                <p className="font-bold text-white text-base">No coders found</p>
                <p className="text-xs mt-1">Try another search query or clear the filter.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b border-[#2d2a26] bg-[#1a1917]/70 text-[#7d7c78] uppercase text-[11px] select-none">
                      <th className="py-3.5 px-4 text-center w-14">#</th>
                      <th className="py-3.5 px-4">Player</th>
                      <th
                        onClick={() => setLeaderboardSort('blitz')}
                        className={`py-3.5 px-4 text-center cursor-pointer transition ${
                          leaderboardSort === 'blitz' ? 'text-yellow-400 font-extrabold bg-yellow-500/5' : 'hover:text-white'
                        }`}
                      >
                        ⚡ Blitz {leaderboardSort === 'blitz' && '▼'}
                      </th>
                      <th
                        onClick={() => setLeaderboardSort('rapid')}
                        className={`py-3.5 px-4 text-center cursor-pointer transition ${
                          leaderboardSort === 'rapid' ? 'text-emerald-400 font-extrabold bg-emerald-500/5' : 'hover:text-white'
                        }`}
                      >
                        ⏱️ Rapid {leaderboardSort === 'rapid' && '▼'}
                      </th>
                      <th
                        onClick={() => setLeaderboardSort('bullet')}
                        className={`py-3.5 px-4 text-center cursor-pointer transition ${
                          leaderboardSort === 'bullet' ? 'text-orange-400 font-extrabold bg-orange-500/5' : 'hover:text-white'
                        }`}
                      >
                        🚀 Bullet {leaderboardSort === 'bullet' && '▼'}
                      </th>
                      <th
                        onClick={() => setLeaderboardSort('solved')}
                        className={`py-3.5 px-4 text-center cursor-pointer transition ${
                          leaderboardSort === 'solved' ? 'text-cyan-400 font-extrabold bg-cyan-500/5' : 'hover:text-white'
                        }`}
                      >
                        🧩 Questions Solved {leaderboardSort === 'solved' && '▼'}
                      </th>
                      <th className="py-3.5 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2d2a26]">
                    {players.map((p, idx) => {
                      const isCurrentUser = user && (user.username === p.username || user._id === p._id);
                      const rank = p.rank || idx + 1;

                      return (
                        <tr
                          key={p._id}
                          className={`transition ${
                            isCurrentUser ? 'bg-[#81b64c]/10 hover:bg-[#81b64c]/15' : 'hover:bg-[#262421]'
                          }`}
                        >
                          {/* Rank */}
                          <td className="py-3.5 px-4 text-center">
                            {rank === 1 ? (
                              <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 text-black font-black text-xs shadow-md">
                                🥇
                              </span>
                            ) : rank === 2 ? (
                              <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-gradient-to-tr from-slate-400 to-slate-200 text-black font-black text-xs shadow-md">
                                🥈
                              </span>
                            ) : rank === 3 ? (
                              <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-gradient-to-tr from-amber-700 to-orange-400 text-white font-black text-xs shadow-md">
                                🥉
                              </span>
                            ) : (
                              <span className="text-[#8c8b88] font-bold font-mono text-xs">
                                #{rank}
                              </span>
                            )}
                          </td>

                          {/* Player */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3 min-w-[180px]">
                              {/* Avatar (DP) */}
                              <div className="w-9 h-9 rounded-xl overflow-hidden flex-shrink-0 bg-gradient-to-tr from-[#81b64c] to-emerald-600 border border-white/10 flex items-center justify-center text-white font-black text-sm shadow">
                                {p.avatar ? (
                                  <img src={p.avatar} alt={p.username} className="w-full h-full object-cover" />
                                ) : (
                                  p.username?.charAt(0).toUpperCase()
                                )}
                              </div>

                              {/* Details */}
                              <div className="flex flex-col min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <Link
                                    to={`/${p.username}`}
                                    className="font-bold text-white hover:text-[#81b64c] transition truncate"
                                  >
                                    {p.displayName || p.username}
                                  </Link>
                                  {isCurrentUser && (
                                    <span className="bg-[#81b64c]/20 text-[#81b64c] text-[10px] font-extrabold px-1.5 py-0.5 rounded">
                                      You
                                    </span>
                                  )}
                                  {p.role === 'ADMIN' && (
                                    <span className="bg-purple-500/20 text-purple-300 text-[10px] font-extrabold px-1.5 py-0.5 rounded">
                                      ADMIN
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-1.5 text-xs text-[#7d7c78]">
                                  <span>@{p.username}</span>
                                  {p.countryFlag && (
                                    <>
                                      <span>•</span>
                                      <span>{p.countryFlag}</span>
                                    </>
                                  )}
                                  {p.organization && (
                                    <>
                                      <span>•</span>
                                      <span className="truncate max-w-[120px]">{p.organization}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Blitz Rating */}
                          <td className={`py-3.5 px-4 text-center font-mono ${leaderboardSort === 'blitz' ? 'bg-yellow-500/5' : ''}`}>
                            <span
                              className={`inline-block px-2.5 py-1 rounded-lg text-xs font-bold ${
                                leaderboardSort === 'blitz'
                                  ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/40 shadow-sm'
                                  : 'text-yellow-400'
                              }`}
                            >
                              ⚡ {p.ratings?.blitz ?? 1500}
                            </span>
                          </td>

                          {/* Rapid Rating */}
                          <td className={`py-3.5 px-4 text-center font-mono ${leaderboardSort === 'rapid' ? 'bg-emerald-500/5' : ''}`}>
                            <span
                              className={`inline-block px-2.5 py-1 rounded-lg text-xs font-bold ${
                                leaderboardSort === 'rapid'
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                                  : 'text-emerald-400'
                              }`}
                            >
                              ⏱️ {p.ratings?.rapid ?? 1500}
                            </span>
                          </td>

                          {/* Bullet Rating */}
                          <td className={`py-3.5 px-4 text-center font-mono ${leaderboardSort === 'bullet' ? 'bg-orange-500/5' : ''}`}>
                            <span
                              className={`inline-block px-2.5 py-1 rounded-lg text-xs font-bold ${
                                leaderboardSort === 'bullet'
                                  ? 'bg-orange-500/20 text-orange-300 border border-orange-500/40 shadow-sm'
                                  : 'text-orange-400'
                              }`}
                            >
                              🚀 {p.ratings?.bullet ?? 1500}
                            </span>
                          </td>

                          {/* Questions Solved */}
                          <td className={`py-3.5 px-4 text-center font-mono ${leaderboardSort === 'solved' ? 'bg-cyan-500/5' : ''}`}>
                            <span
                              className={`inline-block px-2.5 py-1 rounded-lg text-xs font-bold ${
                                leaderboardSort === 'solved'
                                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                                  : 'text-cyan-400 bg-cyan-500/5'
                              }`}
                            >
                              🧩 {p.solvedCount || 0}
                            </span>
                          </td>

                          {/* Action */}
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() =>
                                  handleBattleUser(
                                    p.username,
                                    leaderboardSort === 'rapid'
                                      ? 'Rapid'
                                      : leaderboardSort === 'bullet'
                                      ? 'Bullet'
                                      : 'Blitz'
                                  )
                                }
                                className="bg-[#2b2926] hover:bg-[#81b64c] hover:text-white border border-white/10 text-xs font-bold px-3 py-1.5 rounded-lg transition shadow cursor-pointer whitespace-nowrap"
                              >
                                ⚔️ Battle
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: FRIENDS SECTION */}
      {activeTab === 'friends' && (
        <div className="mt-6 flex flex-col gap-6">
          {/* Top Bar: Title, Search, Online badge */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span>My Friends</span>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#81b64c]/15 text-[#81b64c] border border-[#81b64c]/30">
                  {friendsList.length} Total
                </span>
              </h2>
              {friendsList.some(f => f.isOnline) && (
                <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>{friendsList.filter(f => f.isOnline).length} Online Now</span>
                </span>
              )}
            </div>

            <div className="relative w-full sm:w-72">
              <input
                type="text"
                value={friendSearch}
                onChange={(e) => setFriendSearch(e.target.value)}
                placeholder="Search friends by name or username..."
                className="w-full bg-[#21201d] border border-[#2d2a26] focus:border-[#81b64c] text-white text-xs px-3.5 py-2.5 rounded-xl pl-9 placeholder-[#7d7c78] focus:outline-none transition"
              />
              <span className="absolute left-3 top-2.5 text-xs text-[#7d7c78]">🔍</span>
              {friendSearch && (
                <button
                  onClick={() => setFriendSearch('')}
                  className="absolute right-3 top-2.5 text-xs text-[#7d7c78] hover:text-white"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {!user ? (
            <div className="bg-[#21201d] border border-[#2d2a26] rounded-2xl p-12 text-center flex flex-col items-center gap-3">
              <span className="text-4xl">👥</span>
              <h3 className="text-lg font-bold text-white">Log in to view your friends</h3>
              <p className="text-xs text-[#8c8b88] max-w-md">
                Connect with coding partners, challenge friends to real-time duels, and track their ratings.
              </p>
              <Link
                to="/login"
                className="mt-2 bg-[#81b64c] hover:bg-[#92c55b] text-white font-bold text-xs px-5 py-2.5 rounded-xl transition shadow"
              >
                Log In Now
              </Link>
            </div>
          ) : loadingFriends ? (
            <div className="flex items-center justify-center py-16 gap-3 text-[#8c8b88]">
              <div className="w-6 h-6 border-2 border-[#81b64c]/30 border-t-[#81b64c] rounded-full animate-spin"></div>
              <span>Loading friends...</span>
            </div>
          ) : filteredFriends.length === 0 ? (
            <div className="bg-[#21201d] border border-[#2d2a26] rounded-2xl p-12 text-center flex flex-col items-center gap-3">
              <span className="text-4xl">👥</span>
              <h3 className="text-lg font-bold text-white">
                {friendSearch ? `No friends found matching "${friendSearch}"` : 'No Friends Added Yet'}
              </h3>
              <p className="text-xs text-[#8c8b88] max-w-md">
                {friendSearch
                  ? 'Try a different search query or clear the filter.'
                  : 'You have not added any friends yet. Visit player profiles from the Leaderboard tab to add them and duel in real time!'}
              </p>
              {!friendSearch && (
                <button
                  onClick={() => setActiveTab('leaderboard')}
                  className="mt-2 bg-[#81b64c] hover:bg-[#92c55b] text-white font-bold text-xs px-5 py-2.5 rounded-xl transition shadow cursor-pointer"
                >
                  Browse Leaderboard Players
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredFriends.map(friend => (
                <div
                  key={friend._id || friend.username}
                  className="bg-[#21201d] border border-[#2d2a26] hover:border-[#81b64c]/40 rounded-2xl p-4 transition duration-200 shadow-lg flex flex-col justify-between gap-4 group"
                >
                  {/* Top: Avatar, Online Badge, Info */}
                  <div className="flex items-start gap-3">
                    <div className="relative">
                      {friend.avatar ? (
                        <img
                          src={friend.avatar}
                          alt={friend.username}
                          className="w-12 h-12 rounded-xl object-cover border border-white/10"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#81b64c]/40 to-[#2b2926] border border-white/10 flex items-center justify-center text-white font-extrabold text-lg">
                          {(friend.displayName || friend.username).charAt(0).toUpperCase()}
                        </div>
                      )}
                      {/* Real-time Online Indicator */}
                      <span
                        title={friend.isOnline ? 'Online Now' : 'Offline'}
                        className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-[#21201d] ${
                          friend.isOnline
                            ? 'bg-emerald-500 ring-2 ring-emerald-500/30'
                            : 'bg-[#5c5a57]'
                        }`}
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <Link
                          to={`/${friend.username}`}
                          className="font-bold text-white hover:text-[#81b64c] transition truncate text-sm"
                        >
                          {friend.displayName || friend.username}
                        </Link>
                        {friend.isOnline ? (
                          <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 whitespace-nowrap">
                            Online
                          </span>
                        ) : (
                          <span className="text-[10px] text-[#7d7c78] bg-white/5 px-1.5 py-0.5 rounded border border-white/5 whitespace-nowrap">
                            Offline
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-[#8c8b88] mt-0.5">
                        <span className="truncate">@{friend.username}</span>
                        <span>•</span>
                        <span>{friend.country || 'Global'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Middle: Rating Stats & Solved Count */}
                  <div className="grid grid-cols-4 gap-1.5 bg-[#161512] p-2 rounded-xl border border-white/5 text-center font-mono">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-yellow-400 font-bold">⚡ Blitz</span>
                      <span className="text-xs text-white font-bold">{friend.ratings?.blitz ?? 1500}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] text-emerald-400 font-bold">⏱️ Rapid</span>
                      <span className="text-xs text-white font-bold">{friend.ratings?.rapid ?? 1500}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] text-orange-400 font-bold">🚀 Bullet</span>
                      <span className="text-xs text-white font-bold">{friend.ratings?.bullet ?? 1500}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] text-cyan-400 font-bold">🧩 Solved</span>
                      <span className="text-xs text-white font-bold">{friend.solvedProblemsCount ?? 0}</span>
                    </div>
                  </div>

                  {/* Actions: View Profile & Challenge Button */}
                  <div className="flex items-center gap-2 pt-1">
                    <Link
                      to={`/${friend.username}`}
                      className="flex-1 text-center bg-[#2b2926] hover:bg-[#383531] text-[#c9c8c5] hover:text-white border border-white/10 text-xs font-semibold py-2 rounded-xl transition"
                    >
                      Profile
                    </Link>
                    <button
                      onClick={() => handleBattleUser(friend.username, 'Blitz')}
                      className="flex-1 bg-[#81b64c] hover:bg-[#92c55b] text-white text-xs font-bold py-2 rounded-xl transition shadow flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <span>⚔️ Challenge</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: CLUBS SECTION (ONLY HERE IS CREATE CLUB AVAILABLE) */}
      {activeTab === 'clubs' && (
        <div className="mt-6 flex flex-col gap-6">
          
          {/* Top Row of Clubs Section: Filters, Search, and Create Club Button */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Filter Buttons */}
            <div className="flex items-center gap-2 bg-[#21201d] p-1 rounded-xl border border-[#2d2a26] self-start">
              <button
                onClick={() => setClubFilter('all')}
                className={`text-xs font-bold px-4 py-1.5 rounded-lg transition cursor-pointer ${
                  clubFilter === 'all'
                    ? 'bg-[#81b64c] text-white shadow'
                    : 'text-[#8c8b88] hover:text-white'
                }`}
              >
                All Clubs
              </button>
              <button
                onClick={() => setClubFilter('my')}
                className={`text-xs font-bold px-4 py-1.5 rounded-lg transition cursor-pointer ${
                  clubFilter === 'my'
                    ? 'bg-[#81b64c] text-white shadow'
                    : 'text-[#8c8b88] hover:text-white'
                }`}
              >
                My Clubs
              </button>
            </div>

            <div className="flex items-center gap-3">
              {/* Search Input */}
              <div className="relative flex-1 sm:w-64">
                <input
                  type="text"
                  value={clubSearch}
                  onChange={(e) => setClubSearch(e.target.value)}
                  placeholder="Search clubs by name..."
                  className="w-full bg-[#21201d] border border-[#2d2a26] focus:border-[#81b64c] text-white text-xs px-3.5 py-2.5 rounded-xl pl-9 placeholder-[#7d7c78] focus:outline-none"
                />
                <span className="absolute left-3 top-2.5 text-xs text-[#7d7c78]">🔍</span>
              </div>

              {/* Create Club Button (Only inside Club section) */}
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-[#81b64c] hover:bg-[#92c55b] text-white font-bold text-xs px-4 py-2.5 rounded-xl transition shadow flex items-center gap-1.5 flex-shrink-0 cursor-pointer"
              >
                <span>+</span>
                <span>Create Club</span>
              </button>
            </div>
          </div>

          {/* Clubs Grid */}
          {loadingClubs ? (
            <div className="flex items-center justify-center py-16 gap-3 text-[#8c8b88]">
              <div className="w-6 h-6 border-2 border-[#81b64c]/30 border-t-[#81b64c] rounded-full animate-spin"></div>
              <span>Loading clubs...</span>
            </div>
          ) : filteredClubs.length === 0 ? (
            <div className="bg-[#21201d] border border-[#2d2a26] rounded-2xl p-12 text-center">
              <span className="text-4xl mb-3 block">🏛️</span>
              <h3 className="text-lg font-bold text-white mb-1">No Clubs Found</h3>
              <p className="text-xs text-[#8c8b88] max-w-sm mx-auto mb-5">
                {clubFilter === 'my'
                  ? "You haven't joined or created any clubs yet."
                  : "No clubs match your search query."}
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-[#81b64c] hover:bg-[#92c55b] text-white font-bold text-xs px-5 py-2.5 rounded-xl transition shadow cursor-pointer"
              >
                + Create the First Club
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredClubs.map((club) => {
                const isMember = club.members?.some(m => m.username === user?.username);
                const isOwner = club.owner?.username === user?.username;

                return (
                  <div
                    key={club.id}
                    className="bg-[#21201d] border border-[#2d2a26] hover:border-white/20 rounded-2xl p-5 flex flex-col justify-between gap-4 transition shadow-lg group"
                  >
                    {/* Club Header Info */}
                    <div className="flex items-start gap-3.5">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-emerald-600/20 to-lime-500/20 border border-emerald-500/30 flex items-center justify-center text-2xl flex-shrink-0 shadow-inner">
                        {club.icon || '💻'}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="text-base font-bold text-white group-hover:text-[#81b64c] transition truncate">
                            {club.name}
                          </h3>
                          <span className="text-[10px] font-bold bg-[#2b2926] text-[#81b64c] px-2 py-0.5 rounded border border-white/5 flex-shrink-0">
                            {club.membersCount} {club.membersCount === 1 ? 'member' : 'members'}
                          </span>
                        </div>

                        <div className="text-[11px] text-[#8c8b88] mt-0.5 flex items-center gap-2">
                          <span>📍 {club.location}</span>
                          <span>•</span>
                          <span>Leader: <strong className="text-white">@{club.owner?.username}</strong></span>
                        </div>

                        <p className="text-xs text-[#a09e99] mt-2 line-clamp-2 leading-relaxed">
                          {club.description}
                        </p>
                      </div>
                    </div>

                    {/* Club Actions */}
                    <div className="pt-3 border-t border-[#2d2a26] flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {isOwner ? (
                          <span className="text-[10px] font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
                            👑 Owner
                          </span>
                        ) : isMember ? (
                          <span className="text-[10px] font-bold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded border border-emerald-400/20">
                            ✓ Joined
                          </span>
                        ) : null}
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Manage Members (Owner/Admin only) */}
                        {isOwner && (
                          <button
                            onClick={() => openManageModal(club)}
                            className="bg-[#2b2926] hover:bg-[#383531] text-white text-xs font-bold px-3.5 py-1.5 rounded-lg border border-white/10 transition cursor-pointer"
                          >
                            Manage Members
                          </button>
                        )}

                        {/* Join / Leave */}
                        {isOwner ? null : isMember ? (
                          <button
                            onClick={() => handleLeaveClub(club.id)}
                            className="bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-semibold px-3 py-1.5 rounded-lg border border-red-500/20 transition cursor-pointer"
                          >
                            Leave
                          </button>
                        ) : (
                          <button
                            onClick={() => handleJoinClub(club.id)}
                            className="bg-[#81b64c] hover:bg-[#92c55b] text-white text-xs font-bold px-4 py-1.5 rounded-lg transition shadow cursor-pointer"
                          >
                            Join Club
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* CREATE CLUB MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#24221f] border border-white/15 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl animate-in zoom-in duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
              <div className="flex items-center gap-2">
                <span className="text-xl">🏛️</span>
                <h3 className="text-lg font-extrabold text-white">Create New Coding Club</h3>
              </div>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  searchParams.delete('create');
                  setSearchParams(searchParams);
                }}
                className="text-white/50 hover:text-white text-base p-1"
              >
                ✕
              </button>
            </div>

            {createError && (
              <div className="bg-red-500/15 border border-red-500/30 text-red-400 text-xs p-3 rounded-xl mb-4">
                {createError}
              </div>
            )}

            <form onSubmit={handleCreateClub} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#8c8b88] mb-1">
                  Club Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. REC Banda Algorithm Guild"
                  value={newClubName}
                  onChange={(e) => setNewClubName(e.target.value)}
                  className="w-full bg-[#1b1a18] border border-white/10 focus:border-[#81b64c] text-white text-xs px-3.5 py-2.5 rounded-xl focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#8c8b88] mb-1">
                    Club Icon Emoji
                  </label>
                  <select
                    value={newClubIcon}
                    onChange={(e) => setNewClubIcon(e.target.value)}
                    className="w-full bg-[#1b1a18] border border-white/10 text-white text-xs px-3 py-2.5 rounded-xl focus:outline-none"
                  >
                    <option value="💻">💻 Laptop / Coding</option>
                    <option value="⚡">⚡ Lightning</option>
                    <option value="⚔️">⚔️ Swords / Battle</option>
                    <option value="🚀">🚀 Rocket</option>
                    <option value="🧠">🧠 Brain / Algorithmic</option>
                    <option value="🏆">🏆 Trophy</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#8c8b88] mb-1">
                    Location / College
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. REC Banda, India"
                    value={newClubLocation}
                    onChange={(e) => setNewClubLocation(e.target.value)}
                    className="w-full bg-[#1b1a18] border border-white/10 focus:border-[#81b64c] text-white text-xs px-3.5 py-2.5 rounded-xl focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#8c8b88] mb-1">
                  Club Description
                </label>
                <textarea
                  placeholder="Tell other coders what your club is about..."
                  value={newClubDesc}
                  onChange={(e) => setNewClubDesc(e.target.value)}
                  rows="3"
                  className="w-full bg-[#1b1a18] border border-white/10 focus:border-[#81b64c] text-white text-xs p-3 rounded-xl focus:outline-none resize-none"
                ></textarea>
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 bg-[#2b2926] text-white text-xs font-semibold py-2.5 rounded-xl border border-white/10 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createSubmitting}
                  className="flex-1 bg-[#81b64c] hover:bg-[#92c55b] text-white text-xs font-bold py-2.5 rounded-xl transition shadow disabled:opacity-50"
                >
                  {createSubmitting ? 'Creating...' : 'Create Club'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MANAGE CLUB MEMBERS MODAL */}
      {managingClub && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#24221f] border border-white/15 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl animate-in zoom-in duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">{managingClub.icon || '💻'}</span>
                <div>
                  <h3 className="text-lg font-extrabold text-white">{managingClub.name}</h3>
                  <p className="text-xs text-[#8c8b88]">Member Management ({managingClub.membersCount} members)</p>
                </div>
              </div>
              <button
                onClick={() => setManagingClub(null)}
                className="text-white/50 hover:text-white text-base p-1"
              >
                ✕
              </button>
            </div>

            {manageError && (
              <div className="bg-red-500/15 border border-red-500/30 text-red-400 text-xs p-3 rounded-xl mb-3">
                {manageError}
              </div>
            )}
            {manageSuccess && (
              <div className="bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs p-3 rounded-xl mb-3">
                {manageSuccess}
              </div>
            )}

            {/* Add Member Form */}
            <form onSubmit={handleAddMember} className="flex gap-2 mb-5">
              <input
                type="text"
                placeholder="Enter coder username to add..."
                value={memberUsernameToAdd}
                onChange={(e) => setMemberUsernameToAdd(e.target.value)}
                className="flex-1 bg-[#1b1a18] border border-white/10 focus:border-[#81b64c] text-white text-xs px-3.5 py-2 rounded-xl focus:outline-none"
              />
              <button
                type="submit"
                disabled={manageSubmitting}
                className="bg-[#81b64c] hover:bg-[#92c55b] text-white text-xs font-bold px-4 py-2 rounded-xl transition shadow disabled:opacity-50"
              >
                + Add Member
              </button>
            </form>

            {/* Members List */}
            <div className="max-h-60 overflow-y-auto divide-y divide-[#2d2a26] border border-white/5 rounded-xl bg-[#1b1a18] p-2 mb-5">
              {managingClub.members?.map((m) => {
                const isOwner = m.role === 'owner' || m.userId === managingClub.owner?._id || m.userId === managingClub.owner;

                return (
                  <div key={m.userId || m.username} className="p-2.5 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-[#81b64c] text-white text-xs font-bold flex items-center justify-center">
                        {m.username?.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-bold text-white truncate">
                          {m.displayName || m.username}
                        </span>
                        <span className="text-[10px] text-[#8c8b88]">
                          @{m.username} • {isOwner ? '👑 Owner' : 'Member'}
                        </span>
                      </div>
                    </div>

                    {!isOwner && (
                      <button
                        onClick={() => handleRemoveMember(m.userId)}
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10 px-2 py-1 rounded text-xs font-semibold transition"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-white/10">
              <button
                onClick={handleDeleteClub}
                className="text-xs text-red-400 hover:text-red-300 font-semibold hover:underline"
              >
                Delete Club Permanently
              </button>

              <button
                onClick={() => setManagingClub(null)}
                className="bg-[#2b2926] hover:bg-[#383531] text-white text-xs font-bold px-4 py-2 rounded-xl border border-white/10 transition"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
