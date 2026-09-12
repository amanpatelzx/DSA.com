import { useState } from 'react';
import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Sidebar() {
  const { user, isLoggedIn, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(() => localStorage.getItem('dsa_sidebar_collapsed') === 'true');

  const toggleSidebar = () => {
    setIsCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('dsa_sidebar_collapsed', String(next));
      return next;
    });
  };

  const handleInterceptNav = (e, path) => {
    if (window.__DSA_ACTIVE_BATTLE__?.isRunning) {
      e.preventDefault();
      e.stopPropagation();
      window.__DSA_ACTIVE_BATTLE__.promptResign(path);
      return true;
    }
    return false;
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      const targetPath = `/search?q=${encodeURIComponent(searchQuery.trim())}`;
      if (window.__DSA_ACTIVE_BATTLE__?.isRunning) {
        window.__DSA_ACTIVE_BATTLE__.promptResign(targetPath);
        return;
      }
      navigate(targetPath);
      setSearchOpen(false);
      setSearchQuery('');
    }
  };

  const navLinks = [
    {
      label: 'Challenge',
      path: '/',
      iconColor: 'text-[#81b64c]',
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19.5 4.5l-3 3-1.5-1.5 3-3a1.5 1.5 0 012.12 0l-.62.62v.88zm-5.62 4.12l-7.38 7.38-1.5-1.5 7.38-7.38 1.5 1.5zm-8.88 8.88l-1.5 1.5v3.5h3.5l1.5-1.5-3.5-3.5zm14.5-9l-2-2-1.5 1.5 2 2 1.5-1.5z" />
          <path d="M4.5 4.5l3 3 1.5-1.5-3-3a1.5 1.5 0 00-2.12 0l.62.62v.88zm5.62 4.12l7.38 7.38 1.5-1.5-7.38-7.38-1.5 1.5zm8.88 8.88l1.5 1.5v3.5h-3.5l-1.5-1.5 3.5-3.5z" opacity="0.6" />
        </svg>
      )
    },
    {
      label: 'Profile',
      path: user?.username ? `/${user.username}` : '/profile',
      iconColor: 'text-yellow-500',
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
        </svg>
      )
    },
    {
      label: 'Watch',
      path: '/watch',
      iconColor: 'text-red-500',
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M21 3H3c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h5v2h8v-2h5c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 14H3V5h18v12zm-11-2l6-4-6-4v8z" />
        </svg>
      )
    },
    {
      label: 'Learn',
      path: '/learn',
      iconColor: 'text-[#81b64c]',
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3zM5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82z" />
        </svg>
      )
    },
    {
      label: 'Train',
      path: '/training',
      iconColor: 'text-[#81b64c]',
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M20.57 14.86L22 13.43 20.57 12 17 15.57 8.43 7 12 3.43 10.57 2 9.14 3.43 7.71 2 5.57 4.14 4.14 2.71 2.71 4.14l1.43 1.43L2 7.71l1.43 1.43L2 10.57 3.43 12 7 8.43 15.57 17 12 20.57 13.43 22l1.43-1.43 1.43 1.43 2.14-2.14 1.43 1.43 1.43-1.43-1.43-1.43 1.43-1.43z" />
        </svg>
      )
    },
    {
      label: 'Community',
      path: '/community',
      iconColor: 'text-[#81b64c]',
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
        </svg>
      )
    },
    ...(user?.role === 'ADMIN' ? [{
      label: 'Admin',
      path: '/admin',
      iconColor: 'text-purple-400',
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z" />
        </svg>
      )
    }] : [])
  ];

  return (
    <>
      {/* Mobile Header Bar */}
      <div className="md:hidden bg-[#1e1d1a] border-b border-white/10 px-4 py-3 flex items-center justify-between z-50">
        <Link to="/" onClick={(e) => handleInterceptNav(e, '/')} className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-emerald-600 to-green-400 flex items-center justify-center font-bold text-white shadow-md">
            <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="16 18 22 12 16 6" />
              <polyline points="8 6 2 12 8 18" />
            </svg>
          </div>
          <span className="font-extrabold text-white text-lg tracking-tight">DSA<span className="text-[#81b64c]">Battle</span></span>
        </Link>

        <div className="flex items-center gap-2">
          {isLoggedIn ? (
            <Link 
              to={user?.username ? `/${user.username}` : '/profile'} 
              onClick={(e) => handleInterceptNav(e, user?.username ? `/${user.username}` : '/profile')}
              className="flex items-center gap-2 bg-[#2b2926] px-3 py-1.5 rounded-lg border border-white/10 text-xs font-semibold text-white"
            >
              <span className="w-5 h-5 rounded-full bg-[#81b64c] text-white flex items-center justify-center text-[10px] font-bold">
                {user?.username ? user.username.charAt(0).toUpperCase() : 'U'}
              </span>
              <span>{user?.username}</span>
            </Link>
          ) : (
            <Link to="/login" onClick={(e) => handleInterceptNav(e, '/login')} className="bg-[#81b64c] text-white text-xs font-bold px-3 py-1.5 rounded-lg">
              Log In
            </Link>
          )}

          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-white/70 hover:text-white"
            aria-label="Toggle Navigation"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Desktop & Expanded Mobile Sidebar */}
      <aside className={`
        fixed md:sticky top-0 left-0 h-screen ${isCollapsed ? 'md:w-16' : 'md:w-48'} w-48 bg-[#1e1d1a] border-r border-[#2d2a26] flex flex-col justify-between z-40 transition-all duration-200 ease-in-out
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Top: Branding & Main Navigation */}
        <div className="flex flex-col flex-1 overflow-y-auto min-h-0">
          {/* Brand Logo & Collapse Toggle */}
          <div className={`pt-4 pb-3 border-b border-white/5 transition-all ${isCollapsed ? 'px-2 flex flex-col items-center gap-2' : 'px-4 flex items-center justify-between'}`}>
            <Link to="/" onClick={(e) => handleInterceptNav(e, '/')} className="flex items-center gap-2 group min-w-0" title="DSA.com Arena">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-emerald-600 via-[#81b64c] to-lime-400 flex items-center justify-center shadow-lg group-hover:scale-105 transition shrink-0">
                <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="16 18 22 12 16 6" />
                  <polyline points="8 6 2 12 8 18" />
                </svg>
              </div>
              {!isCollapsed && (
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center font-extrabold text-white text-base tracking-tight leading-none truncate">
                    DSA<span className="text-[#81b64c]">.com</span>
                  </div>
                  <span className="text-[10px] text-white/40 font-semibold tracking-wider uppercase mt-0.5">Arena</span>
                </div>
              )}
            </Link>

            {/* Sidebar Toggle Button */}
            <button
              type="button"
              onClick={toggleSidebar}
              title={isCollapsed ? "Expand sidebar" : "Collapse sidebar (Save space)"}
              className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-[#2b2926] transition cursor-pointer shrink-0"
              aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {isCollapsed ? (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                </svg>
              )}
            </button>
          </div>

          {/* Nav List */}
          <nav className="px-2 py-2.5 flex flex-col gap-1">
            {navLinks.map(link => {
              const isProfile = link.label === 'Profile';
              const isChallenge = link.label === 'Challenge';
              const isActive = isProfile
                ? (location.pathname.startsWith('/profile') || (user?.username && (location.pathname === `/${user.username}` || location.pathname === `/${user.username}/`)))
                : isChallenge
                  ? location.pathname === '/'
                  : location.pathname.startsWith(link.path);

              return (
                <NavLink
                  key={link.label}
                  to={link.path}
                  title={isCollapsed ? link.label : undefined}
                  onClick={(e) => {
                    if (handleInterceptNav(e, link.path)) return;
                    setMobileMenuOpen(false);
                  }}
                  className={`
                    flex items-center rounded-xl text-sm font-semibold transition-all relative group
                    ${isCollapsed ? 'justify-center py-2.5 px-0' : 'gap-3 px-3 py-2.5'}
                    ${isActive
                      ? 'bg-[#2b2926] text-white shadow-sm'
                      : 'text-[#c3c2bf] hover:bg-[#2b2926]/70 hover:text-white'}
                  `}
                >
                  <span className={`${link.iconColor || 'text-[#81b64c]'} shrink-0 flex items-center justify-center`}>
                    {link.icon}
                  </span>
                  {!isCollapsed && <span className="truncate">{link.label}</span>}

                  {/* Floating Tooltip when collapsed */}
                  {isCollapsed && (
                    <div className="absolute left-full ml-2 px-2.5 py-1 bg-[#262421] text-white text-xs rounded-lg border border-white/10 opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap shadow-xl font-medium">
                      {link.label}
                    </div>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Bottom Section: Search, Auth & Footer */}
        <div className={`border-t border-[#2d2a26] flex flex-col gap-2.5 bg-[#1b1917] ${isCollapsed ? 'p-2' : 'p-3'}`}>
          {/* Quick Search Trigger */}
          {isCollapsed ? (
            <button
              type="button"
              onClick={() => {
                setIsCollapsed(false);
                setSearchOpen(true);
              }}
              title="Search players..."
              className="flex items-center justify-center py-2.5 rounded-xl text-[#9e9d9a] hover:text-white hover:bg-[#2b2926] transition cursor-pointer relative group"
            >
              <svg className="w-4 h-4 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <div className="absolute left-full ml-2 px-2.5 py-1 bg-[#262421] text-white text-xs rounded-lg border border-white/10 opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap shadow-xl font-medium">
                Search
              </div>
            </button>
          ) : searchOpen ? (
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search players..."
                autoFocus
                className="w-full bg-[#2b2926] text-white text-xs px-3 py-2 rounded-lg border border-white/15 focus:outline-none focus:border-[#81b64c]"
              />
              <button
                type="button"
                onClick={() => setSearchOpen(false)}
                className="absolute right-2 top-2 text-white/40 hover:text-white text-xs"
              >
                ✕
              </button>
            </form>
          ) : (
            <button
              onClick={() => setSearchOpen(true)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-[#9e9d9a] hover:text-white hover:bg-[#2b2926] transition text-left"
            >
              <svg className="w-4 h-4 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span>Search</span>
            </button>
          )}

          {/* Auth Section */}
          {isLoggedIn ? (
            isCollapsed ? (
              <div className="flex flex-col items-center gap-2 py-1">
                <Link 
                  to={user?.username ? `/${user.username}` : '/profile'} 
                  onClick={(e) => handleInterceptNav(e, user?.username ? `/${user.username}` : '/profile')}
                  title={`${user?.displayName || user?.username} (⚡ ${user?.ratings?.blitz ?? 1500})`}
                  className="relative group"
                >
                  <div className="w-9 h-9 rounded-xl bg-[#81b64c] text-white font-extrabold flex items-center justify-center text-xs shadow-md overflow-hidden ring-2 ring-transparent group-hover:ring-[#81b64c]/40 transition">
                    {user?.avatar ? (
                      <img src={user.avatar} alt={user?.username || 'User'} className="w-full h-full object-cover" />
                    ) : (
                      user?.username ? user.username.charAt(0).toUpperCase() : 'U'
                    )}
                  </div>
                  <div className="absolute left-full ml-2 px-2.5 py-1 bg-[#262421] text-white text-xs rounded-lg border border-white/10 opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap shadow-xl">
                    <div className="font-bold">{user?.displayName || user?.username}</div>
                    <div className="text-[10px] text-yellow-400 font-mono">⚡ {user?.ratings?.blitz ?? 1500}</div>
                  </div>
                </Link>
                <button
                  onClick={(e) => {
                    if (handleInterceptNav(e, '/login')) return;
                    logout();
                    navigate('/login');
                  }}
                  title="Log Out"
                  className="w-7 h-7 flex items-center justify-center rounded-lg text-danger/80 hover:text-danger hover:bg-danger/10 transition cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-1.5 bg-[#262421] p-2.5 rounded-xl border border-white/5">
                <Link 
                  to={user?.username ? `/${user.username}` : '/profile'} 
                  onClick={(e) => handleInterceptNav(e, user?.username ? `/${user.username}` : '/profile')}
                  className="flex items-center gap-2.5 group"
                >
                  <div className="w-8 h-8 rounded-lg bg-[#81b64c] text-white font-extrabold flex items-center justify-center text-xs shadow-md overflow-hidden shrink-0">
                    {user?.avatar ? (
                      <img src={user.avatar} alt={user?.username || 'User'} className="w-full h-full object-cover" />
                    ) : (
                      user?.username ? user.username.charAt(0).toUpperCase() : 'U'
                    )}
                  </div>
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="text-xs font-bold text-white truncate group-hover:text-[#81b64c] transition">
                      {user?.displayName || user?.username}
                    </span>
                    <span className="text-[10px] text-yellow-400 font-mono font-bold flex items-center gap-1">
                      <span>⚡</span>
                      <span>{user?.ratings?.blitz ?? 1500}</span>
                    </span>
                  </div>
                </Link>
                <button
                  onClick={(e) => {
                    if (handleInterceptNav(e, '/login')) return;
                    logout();
                    navigate('/login');
                  }}
                  className="text-[11px] font-semibold text-danger/80 hover:text-danger mt-1 text-left px-1 py-0.5 hover:bg-danger/10 rounded transition cursor-pointer"
                >
                  Log Out
                </button>
              </div>
            )
          ) : (
            isCollapsed ? (
              <div className="flex flex-col items-center gap-2 py-1">
                <Link
                  to="/login"
                  onClick={(e) => handleInterceptNav(e, '/login')}
                  title="Log In"
                  className="w-9 h-9 rounded-xl bg-[#81b64c] hover:bg-[#92c55b] text-white flex items-center justify-center transition shadow-md"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                </Link>
              </div>
            ) : (
              <div className="flex flex-col gap-1.5">
                <Link
                  to="/signup"
                  onClick={(e) => handleInterceptNav(e, '/signup')}
                  className="w-full bg-[#81b64c] hover:bg-[#92c55b] text-white text-center font-bold text-xs py-2.5 rounded-lg shadow-md transition transform active:scale-95"
                >
                  Sign Up
                </Link>
                <Link
                  to="/login"
                  onClick={(e) => handleInterceptNav(e, '/login')}
                  className="w-full bg-[#363431] hover:bg-[#45423e] text-white text-center font-bold text-xs py-2 rounded-lg transition"
                >
                  Log In
                </Link>
              </div>
            )
          )}

          {/* Utilities */}
          {isCollapsed ? (
            <div className="flex items-center justify-center pt-1">
              <Link 
                to="/training" 
                onClick={(e) => handleInterceptNav(e, '/training')} 
                title="Help & Training"
                className="w-7 h-7 flex items-center justify-center text-xs text-[#7d7c78] hover:text-white rounded-lg hover:bg-white/5 transition"
              >
                ?
              </Link>
            </div>
          ) : (
            <div className="flex items-center justify-between text-[11px] text-[#7d7c78] pt-1 px-1">
              <Link to="/training" onClick={(e) => handleInterceptNav(e, '/training')} className="hover:text-white transition flex items-center gap-1">
                <span>?</span>
                <span>Help</span>
              </Link>
              <span className="hover:text-white transition cursor-pointer flex items-center gap-1">
                <span>文A</span>
                <span>English</span>
              </span>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
