import { useEffect, useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useSocket } from '../context/SocketContext';
import { fetchRandomBattleProblems } from '../utils/problemSelector';

export default function Search() {
  const navigate = useNavigate();
  const { sendChallenge } = useSocket();
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const handleChallenge = async (targetUsername) => {
    const [randomSlug] = await fetchRandomBattleProblems({ mode: 'Blitz', count: 1 });
    sendChallenge({
      toUsername: targetUsername,
      mode: 'Blitz',
      timeControl: '3 + 0',
      isRated: true,
      problemsCount: 1,
      problemList: [randomSlug || 'two-sum'],
      durationSeconds: 180
    });
  };

  useEffect(() => {
    const fetchUsers = async () => {
      if (!query) {
        setUsers([]);
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const res = await axios.get(`http://localhost:5000/api/users/search?q=${encodeURIComponent(query)}`);
        setUsers(res.data);
      } catch (err) {
        console.error('Error fetching users', err);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, [query]);

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto">
      <h2 className="text-2xl font-extrabold text-white mb-6">
        Search Results for "{query}"
      </h2>
      
      {loading ? (
        <div className="flex items-center gap-3 text-[#8c8b88] py-8">
          <div className="w-5 h-5 border-2 border-[#81b64c]/30 border-t-[#81b64c] rounded-full animate-spin"></div>
          <span>Searching players...</span>
        </div>
      ) : users.length === 0 ? (
        <div className="bg-[#21201d] border border-[#2d2a26] rounded-2xl p-8 text-center text-[#8c8b88]">
          <span className="text-3xl mb-2 block">🔍</span>
          <p className="font-medium text-white">No players found</p>
          <p className="text-xs mt-1">Try searching for a different username or display name.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {users.map(user => (
            <div key={user._id} className="bg-[#21201d] border border-[#2d2a26] hover:border-white/15 rounded-xl p-4 flex items-center justify-between transition shadow-md">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-[#81b64c] text-white font-extrabold flex items-center justify-center text-sm shadow">
                  {user.username.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">
                    {user.displayName || user.username} <span className="text-[#8c8b88] font-normal text-xs">@{user.username}</span>
                  </h3>
                  <div className="flex gap-3.5 mt-1 text-xs">
                    <span className="text-danger font-semibold">Bullet: {user.ratings?.bullet ?? 1500}</span>
                    <span className="text-yellow-400 font-semibold">Blitz: {user.ratings?.blitz ?? 1500}</span>
                    <span className="text-[#81b64c] font-semibold">Rapid: {user.ratings?.rapid ?? 1500}</span>
                    <span className="text-purple-400 font-semibold">Classical: {user.ratings?.classical ?? 1500}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  type="button"
                  onClick={() => handleChallenge(user.username)}
                  className="bg-[#81b64c] hover:bg-[#92c55b] text-white px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-sm cursor-pointer"
                >
                  Challenge
                </button>
                <Link 
                  to={`/profile/${user.username}`} 
                  className="bg-[#2b2926] hover:bg-[#363431] border border-white/10 px-3 py-1.5 rounded-lg text-xs font-bold text-white transition"
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
