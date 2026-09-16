import { useEffect, useState, useRef } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useSocket } from '../context/SocketContext';
import { fetchRandomBattleProblems } from '../utils/problemSelector';

export default function Search() {
  const navigate = useNavigate();
  const { sendChallenge, openDirectChallenge, isUserOnline } = useSocket();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const [searchTerm, setSearchTerm] = useState(initialQuery);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeMode, setActiveMode] = useState('Blitz');

  const handleChallenge = (targetUsername) => {
    if (openDirectChallenge) {
      openDirectChallenge(targetUsername, activeMode);
    }
  };

  useEffect(() => {
    const q = searchTerm.trim();
    if (!q) {
      setUsers([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/users/search?q=${encodeURIComponent(q)}`);
        setUsers(Array.isArray(res.data) ? res.data : []);
        // Update URL search params silently
        setSearchParams({ q }, { replace: true });
      } catch (err) {
        console.error('Error fetching users', err);
        setUsers([]);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-4xl mx-auto space-y-6">
      {/* Search Header & Interactive Search Bar */}
      <div className="bg-[#21201d] border border-[#2d2a26] rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute -top-16 -right-16 w-48 h-48 bg-[#81b64c]/10 blur-3xl rounded-full pointer-events-none" />

        <div className="flex flex-col gap-2 mb-5">
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <span>🔍</span>
            <span>Search Friends & Coders</span>
          </h1>
          <p className="text-xs sm:text-sm text-[#8c8b88]">
            Find friends, inspect matching profiles, and challenge players to real-time 1v1 coding duels.
          </p>
        </div>

        {/* Input Bar */}
        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Type friend's name, username, or keyword..."
            autoFocus
            className="w-full bg-[#181715] text-white text-sm sm:text-base px-4 py-3.5 pl-11 pr-10 rounded-2xl border border-white/15 focus:border-[#81b64c] focus:outline-none transition shadow-inner placeholder-white/30"
          />
          <span className="absolute left-4 top-3.5 sm:top-4 text-base text-white/40">
            🔍
          </span>
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute right-3.5 top-3.5 text-xs text-white/40 hover:text-white transition cursor-pointer p-1"
            >
              ✕
            </button>
          )}
        </div>

        {/* Mode Selector for Quick Challenges */}
        <div className="flex items-center gap-2 mt-4 text-xs font-bold text-white/60">
          <span className="text-[11px] uppercase tracking-wider text-white/40">Challenge Format:</span>
          {['Blitz', 'Rapid', 'Bullet'].map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setActiveMode(m)}
              className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                activeMode === m
                  ? 'bg-[#81b64c] text-white shadow-sm'
                  : 'bg-[#2b2926] text-white/60 hover:text-white'
              }`}
            >
              {m === 'Blitz' ? '⚡ Blitz' : m === 'Rapid' ? '⏱️ Rapid' : '🚀 Bullet'}
            </button>
          ))}
        </div>
      </div>

      {/* Search Results Summary */}
      {searchTerm.trim() && (
        <div className="flex items-center justify-between text-xs text-[#8c8b88] px-1">
          <span>
            {loading
              ? 'Finding best matching coders...'
              : `Found ${users.length} matching ${users.length === 1 ? 'profile' : 'profiles'} for "${searchTerm}"`}
          </span>
        </div>
      )}

      {/* Results Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-[#8c8b88]">
          <div className="w-8 h-8 border-3 border-[#81b64c]/30 border-t-[#81b64c] rounded-full animate-spin"></div>
          <span className="text-xs font-semibold">Matching player profiles...</span>
        </div>
      ) : !searchTerm.trim() ? (
        <div className="bg-[#21201d] border border-[#2d2a26] rounded-3xl p-12 text-center text-[#8c8b88] shadow-lg">
          <span className="text-4xl mb-3 block">👥</span>
          <h3 className="text-base font-bold text-white mb-1">Find your friends on DSA.com</h3>
          <p className="text-xs max-w-md mx-auto leading-relaxed">
            Search for your friends by their name or username to view their stats, test accuracy, and challenge them to 1v1 battles.
          </p>
        </div>
      ) : users.length === 0 ? (
        <div className="bg-[#21201d] border border-[#2d2a26] rounded-3xl p-10 text-center text-[#8c8b88] shadow-lg">
          <span className="text-3xl mb-2 block">🔍</span>
          <h3 className="font-bold text-white text-base">No players found matching "{searchTerm}"</h3>
          <p className="text-xs mt-1 max-w-sm mx-auto">
            Check the spelling or try searching for another name or username.
          </p>
        </div>
      ) : (
        <div className="grid gap-3.5">
          {users.map((u, idx) => (
            <div
              key={u._id || u.username}
              className="bg-[#21201d] border border-[#2d2a26] hover:border-[#81b64c]/40 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition shadow-md group"
            >
              {/* Profile Icon + Info */}
              <div className="flex items-center gap-4 min-w-0">
                {/* Profile Icon with Online Status */}
                <div className="relative shrink-0">
                  {u.avatar ? (
                    <img
                      src={u.avatar}
                      alt={u.username}
                      className="w-12 h-12 rounded-2xl object-cover border border-white/10 shadow-sm"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 via-green-500 to-lime-400 text-white font-black text-lg flex items-center justify-center shadow-md">
                      {(u.displayName || u.username).charAt(0).toUpperCase()}
                    </div>
                  )}
                  {(() => {
                    const isCoderOnline = (typeof isUserOnline === 'function' ? isUserOnline(u.username) : u.isOnline);
                    return (
                      <span
                        title={isCoderOnline ? 'Online Now' : 'Offline'}
                        className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-[#21201d] transition-colors duration-200 ${
                          isCoderOnline
                            ? 'bg-emerald-500 ring-2 ring-emerald-500/30'
                            : 'bg-[#5c5a57]'
                        }`}
                      />
                    );
                  })()}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Link
                      to={`/${u.username}`}
                      className="font-extrabold text-white text-base hover:text-[#81b64c] transition truncate"
                    >
                      {u.displayName || u.username}
                    </Link>
                    <span className="text-xs text-[#8c8b88] font-mono">@{u.username}</span>
                    {u.countryFlag && <span className="text-xs">{u.countryFlag}</span>}
                    {idx === 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold font-mono">
                        Best Match
                      </span>
                    )}
                  </div>

                  {/* Rating pills */}
                  <div className="flex flex-wrap items-center gap-2 mt-2 text-xs font-mono">
                    <span className="bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 px-2 py-0.5 rounded-md font-bold">
                      ⚡ Blitz: {u.ratings?.blitz ?? 1500}
                    </span>
                    <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-md font-bold">
                      ⏱️ Rapid: {u.ratings?.rapid ?? 1500}
                    </span>
                    <span className="bg-orange-500/10 text-orange-400 border border-orange-500/20 px-2 py-0.5 rounded-md font-bold">
                      🚀 Bullet: {u.ratings?.bullet ?? 1500}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-white/5">
                <button
                  type="button"
                  onClick={() => handleChallenge(u.username)}
                  className="flex-1 sm:flex-initial bg-[#81b64c] hover:bg-[#92c55b] text-black font-black px-4 py-2 rounded-xl text-xs transition shadow-md shadow-[#81b64c]/20 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>⚔️</span>
                  <span>Challenge</span>
                </button>
                <Link
                  to={`/${u.username}`}
                  className="flex-1 sm:flex-initial bg-[#2b2926] hover:bg-[#363431] border border-white/10 px-4 py-2 rounded-xl text-xs font-bold text-white transition text-center"
                >
                  Profile
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

