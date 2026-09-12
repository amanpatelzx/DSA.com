import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Header() {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const { user, isLoggedIn, logout } = useAuth();

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="border-b border-white/10 bg-surface px-6 py-4 flex items-center justify-between">
      <Link to="/" className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
        DSA Battle
      </Link>
      
      {isLoggedIn && (
        <form onSubmit={handleSearch} className="flex-1 max-w-md mx-8">
          <input 
            type="text" 
            placeholder="Search players..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-background border border-white/10 rounded-full px-4 py-2 text-sm focus:outline-none focus:border-primary transition"
          />
        </form>
      )}

      <nav className="flex gap-4 items-center ml-auto">
        {isLoggedIn ? (
          <>
            <Link 
              to="/profile" 
              className="flex items-center gap-2 text-textMuted hover:text-white transition px-3 py-1.5 rounded-lg hover:bg-white/5"
            >
              <div className="w-7 h-7 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center text-xs font-bold text-primary overflow-hidden">
                {user?.avatar ? (
                  <img src={user.avatar} alt={user?.username || 'User'} className="w-full h-full object-cover" />
                ) : (
                  user?.username ? user.username.charAt(0).toUpperCase() : 'U'
                )}
              </div>
              <span>{user?.displayName || user?.username || 'My Profile'}</span>
            </Link>
            <button 
              onClick={handleLogout} 
              className="text-danger hover:text-red-400 font-medium px-3 py-1.5 rounded-lg hover:bg-danger/10 transition cursor-pointer"
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link 
              to="/login" 
              className="text-textMuted hover:text-white font-medium px-4 py-2 rounded-lg hover:bg-white/5 transition"
            >
              Login
            </Link>
            <Link 
              to="/signup" 
              className="bg-primary hover:bg-blue-600 px-5 py-2 rounded-lg font-semibold text-white transition shadow-lg shadow-primary/25"
            >
              Sign Up
            </Link>
          </>
        )}
      </nav>
    </header>
  );
}
