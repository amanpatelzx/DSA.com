import { useEffect, useState, useCallback } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import API_BASE_URL from '../config/api';
import { fetchRandomBattleProblems } from '../utils/problemSelector';

export default function Profile() {
  const { username } = useParams();
  const [searchParams] = useSearchParams();
  const { user: authUser, token, isLoggedIn, refreshUser } = useAuth();
  const { socket, sendChallenge, openDirectChallenge, isUserOnline } = useSocket();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [streakGlow, setStreakGlow] = useState(false);
  
  const initialTab = (searchParams.get('tab') === 'battles' || searchParams.get('tab') === 'history')
    ? 'battles'
    : (['overview', 'solved', 'clubs', 'friends', 'rating'].includes(searchParams.get('tab')) ? searchParams.get('tab') : 'overview');
  const [activeTab, setActiveTab] = useState(initialTab);
  const navigate = useNavigate();

  const isMe = 
    !username || 
    username === 'me' || 
    username === 'null' || 
    username === 'undefined' || 
    (authUser && authUser.username && username.toLowerCase() === authUser.username.toLowerCase());

  const RESERVED_ROUTES = [
    'problem', 'problems', 'training', 'learn', 'watch', 'community',
    'search', 'admin', 'login', 'signup', 'profile', 'arena'
  ];

  // Silent re-fetch of full profile without jarring loading spinners (for live socket updates)
  const fetchProfileSilently = useCallback(async () => {
    try {
      if (isMe) {
        const activeToken = token || localStorage.getItem('token');
        if (!activeToken) return;
        const res = await axios.get(`${API_BASE_URL}/api/users/me`, {
          headers: { Authorization: `Bearer ${activeToken}` }
        });
        if (res.data?.user) {
          setProfileData(res.data);
        }
      } else if (username) {
        const res = await axios.get(`${API_BASE_URL}/api/users/${encodeURIComponent(username)}`);
        if (res.data?.user) {
          setProfileData(res.data);
        }
      }
    } catch (err) {
      console.warn('Silent profile fetch error:', err.message);
    }
  }, [isMe, token, username]);

  useEffect(() => {
    // If a reserved route slipped through to /:username, redirect to its dedicated route
    if (username && RESERVED_ROUTES.includes(username.toLowerCase())) {
      if (username.toLowerCase() === 'problem' || username.toLowerCase() === 'problems') {
        const lastSlug = localStorage.getItem('dsa_last_problem_slug') || 'two-sum';
        navigate(`/problem/${lastSlug}`, { replace: true });
      } else {
        navigate(`/${username.toLowerCase()}`, { replace: true });
      }
      return;
    }

    const fetchProfile = async () => {
      setLoading(true);
      setError('');

      try {
        if (isMe) {
          const activeToken = token || localStorage.getItem('token');
          if (!activeToken) {
            navigate('/login');
            return;
          }

          const res = await axios.get(`${API_BASE_URL}/api/users/me`, {
            headers: {
              Authorization: `Bearer ${activeToken}`
            }
          });

          setProfileData(res.data);
          if (res.data?.user?.username) {
            localStorage.setItem('username', res.data.user.username);
          }
        } else {
          const res = await axios.get(`${API_BASE_URL}/api/users/${encodeURIComponent(username)}`);
          setProfileData(res.data);
        }
      } catch (err) {
        console.error('Failed to load profile:', err);
        setError(err.response?.data?.message || 'User not found');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [username, isMe, token, navigate]);

  // Real-time socket synchronization for user streak and live profile stats
  useEffect(() => {
    if (!socket) return;

    const handleStreakUpdate = (data) => {
      if (!data) return;
      const currentTargetId = profileData?.user?._id || profileData?.user?.id;
      const currentTargetName = profileData?.user?.username?.toLowerCase();
      const eventUserId = data.userId;
      const eventUsername = data.username?.toLowerCase();

      const isMatch = (currentTargetId && eventUserId && String(currentTargetId) === String(eventUserId)) ||
                      (currentTargetName && eventUsername && currentTargetName === eventUsername) ||
                      (isMe && authUser && (String(authUser._id || authUser.id) === String(eventUserId) || authUser.username?.toLowerCase() === eventUsername));

      if (isMatch && data.streak !== undefined) {
        setProfileData(prev => {
          if (!prev?.user) return prev;
          return {
            ...prev,
            user: {
              ...prev.user,
              streak: data.streak
            }
          };
        });
        setStreakGlow(true);
        setTimeout(() => setStreakGlow(false), 3000);
      }
    };

    const handleProfileUpdate = (data) => {
      if (!data) return;
      const currentTargetId = profileData?.user?._id || profileData?.user?.id;
      const currentTargetName = profileData?.user?.username?.toLowerCase();
      const eventUserId = data.userId;
      const eventUsername = data.username?.toLowerCase();

      const isMatch = (currentTargetId && eventUserId && String(currentTargetId) === String(eventUserId)) ||
                      (currentTargetName && eventUsername && currentTargetName === eventUsername) ||
                      (isMe && authUser && (String(authUser._id || authUser.id) === String(eventUserId) || authUser.username?.toLowerCase() === eventUsername));

      if (isMatch) {
        setProfileData(prev => {
          if (!prev?.user) return prev;
          return {
            ...prev,
            user: {
              ...prev.user,
              streak: data.streak !== undefined ? data.streak : prev.user.streak,
              ratings: data.ratings ? { ...prev.user.ratings, ...data.ratings } : prev.user.ratings
            }
          };
        });
        if (data.streak !== undefined) {
          setStreakGlow(true);
          setTimeout(() => setStreakGlow(false), 3000);
        }
        fetchProfileSilently();
      }
    };

    socket.on('user:streak_update', handleStreakUpdate);
    socket.on('user:profile_update', handleProfileUpdate);

    return () => {
      socket.off('user:streak_update', handleStreakUpdate);
      socket.off('user:profile_update', handleProfileUpdate);
    };
  }, [socket, profileData?.user?._id, profileData?.user?.username, isMe, authUser, fetchProfileSilently]);

  // Keep streak in sync if authUser was updated
  useEffect(() => {
    if (isMe && authUser?.streak !== undefined && profileData?.user) {
      if (profileData.user.streak !== authUser.streak) {
        setProfileData(prev => prev ? {
          ...prev,
          user: {
            ...prev.user,
            streak: authUser.streak
          }
        } : prev);
        setStreakGlow(true);
        setTimeout(() => setStreakGlow(false), 2500);
      }
    }
  }, [isMe, authUser?.streak]);

  // Sync browser URL bar to /:username while preserving query params and hash
  useEffect(() => {
    if (profileData?.user?.username && (!username || username === 'me')) {
      const search = window.location.search || '';
      const hash = window.location.hash || '';
      navigate(`/${profileData.user.username}${search}${hash}`, { replace: true });
    }
  }, [profileData, username, navigate]);

  // Keep activeTab reactive to URL tab query param
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'battles' || tab === 'history') {
      setActiveTab('battles');
    } else if (tab && ['overview', 'solved', 'clubs', 'friends', 'rating'].includes(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  // Auto-scroll to battle history if requested via hash or section param
  useEffect(() => {
    if (window.location.hash === '#battle-history' || searchParams.get('section') === 'history' || searchParams.get('section') === 'battles') {
      if (searchParams.get('tab') !== 'battles') {
        setActiveTab('overview');
      }
      setTimeout(() => {
        const el = document.getElementById('battle-history') || document.getElementById('battle-history-full');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 400);
    }
  }, [profileData, searchParams]);

  const [friendStatus, setFriendStatus] = useState('idle'); // 'idle' | 'loading' | 'added'

  const handleAddFriend = async () => {
    if (!token || !user?.username) return;
    setFriendStatus('loading');
    try {
      const res = await axios.post(
        `http://localhost:5000/api/users/friend-request/${user.username}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setFriendStatus('added');
      if (res.data?.friendsCount !== undefined) {
        setProfileData(prev => ({
          ...prev,
          user: { ...prev.user, friendsCount: res.data.friendsCount }
        }));
      }
      if (profileData?.user?.username) {
        fetchProfileFriends(profileData.user.username);
      }
    } catch (err) {
      console.error('Error adding friend:', err);
      setFriendStatus('idle');
    }
  };

  // Friends tab state
  const [profileFriends, setProfileFriends] = useState([]);
  const [loadingProfileFriends, setLoadingProfileFriends] = useState(false);
  const [profileFriendSearch, setProfileFriendSearch] = useState('');

  const fetchProfileFriends = async (targetUsername) => {
    const uname = targetUsername || profileData?.user?.username || username;
    if (!uname || uname === 'me' || uname === 'null') return;
    try {
      setLoadingProfileFriends(true);
      const res = await axios.get(`http://localhost:5000/api/users/${uname}/friends`);
      if (res.data?.success && Array.isArray(res.data.friends)) {
        setProfileFriends(res.data.friends);
      }
    } catch (err) {
      console.error('Failed to fetch profile friends:', err);
    } finally {
      setLoadingProfileFriends(false);
    }
  };

  useEffect(() => {
    if (profileData?.user?.username) {
      fetchProfileFriends(profileData.user.username);
    }
  }, [profileData?.user?.username]);

  useEffect(() => {
    if (activeTab === 'friends' && profileData?.user?.username) {
      fetchProfileFriends(profileData.user.username);
    }
  }, [activeTab]);

  const filteredProfileFriends = profileFriends.filter(f => {
    if (!profileFriendSearch.trim()) return true;
    const q = profileFriendSearch.toLowerCase().trim();
    return (
      (f.username && f.username.toLowerCase().includes(q)) ||
      (f.displayName && f.displayName.toLowerCase().includes(q))
    );
  });

  // Solved filtering state
  const [solvedSearch, setSolvedSearch] = useState('');
  const [solvedDiffFilter, setSolvedDiffFilter] = useState('all');

  // Battle Challenge History filter state
  const [battleModeFilter, setBattleModeFilter] = useState('all');
  const [battleResultFilter, setBattleResultFilter] = useState('all');

  // Stats Modal State (Rapid, Blitz, Bullet)
  const [selectedStatsMode, setSelectedStatsMode] = useState(null);

  // Solved Problem Code Inspection Modal
  const [selectedSolvedCode, setSelectedSolvedCode] = useState(null);
  const [copiedCode, setCopiedCode] = useState(false);

  const handleCopyCode = (codeText) => {
    navigator.clipboard.writeText(codeText || '');
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Edit Profile Modal State
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const COUNTRY_OPTIONS = [
    { name: 'India', flag: '🇮🇳' },
    { name: 'United States', flag: '🇺🇸' },
    { name: 'United Kingdom', flag: '🇬🇧' },
    { name: 'Canada', flag: '🇨🇦' },
    { name: 'Germany', flag: '🇩🇪' },
    { name: 'France', flag: '🇫🇷' },
    { name: 'Japan', flag: '🇯🇵' },
    { name: 'Australia', flag: '🇦🇺' },
    { name: 'Singapore', flag: '🇸🇬' },
    { name: 'Brazil', flag: '🇧🇷' },
    { name: 'Russia', flag: '🇷🇺' },
    { name: 'China', flag: '🇨🇳' },
    { name: 'South Korea', flag: '🇰🇷' },
    { name: 'Netherlands', flag: '🇳🇱' },
    { name: 'Spain', flag: '🇪🇸' },
    { name: 'Italy', flag: '🇮🇹' },
    { name: 'United Arab Emirates', flag: '🇦🇪' },
    { name: 'Poland', flag: '🇵🇱' },
    { name: 'Indonesia', flag: '🇮🇩' },
    { name: 'Vietnam', flag: '🇻🇳' },
    { name: 'Ukraine', flag: '🇺🇦' },
    { name: 'Bangladesh', flag: '🇧🇩' },
    { name: 'Pakistan', flag: '🇵🇰' },
    { name: 'Nigeria', flag: '🇳🇬' },
    { name: 'Other', flag: '🌐' }
  ];

  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState('');
  const [editSuccess, setEditSuccess] = useState('');
  const [editForm, setEditForm] = useState({
    displayName: '',
    country: '',
    countryFlag: '',
    location: '',
    about: '',
    avatar: '',
    organization: '',
    socialLinks: {
      github: '',
      linkedin: '',
      leetcode: '',
      codeforces: '',
      website: '',
      other: '',
      custom: []
    }
  });

  const PRESET_AVATARS = [
    'https://api.dicebear.com/7.x/bottts/svg?seed=Bandit',
    'https://api.dicebear.com/7.x/bottts/svg?seed=Felix',
    'https://api.dicebear.com/7.x/bottts/svg?seed=Shadow',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Precious',
    'https://api.dicebear.com/7.x/pixel-art/svg?seed=Ninja',
    'https://api.dicebear.com/7.x/pixel-art/svg?seed=Samurai',
    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'
  ];

  // Helper to detect platform from URL or hint
  const detectPlatform = (url = '', hint = '') => {
    const lowerUrl = (url || '').toLowerCase();
    const lowerHint = (hint || '').toLowerCase();

    if (lowerHint === 'github' || lowerUrl.includes('github.com')) return 'GitHub';
    if (lowerHint === 'linkedin' || lowerUrl.includes('linkedin.com')) return 'LinkedIn';
    if (lowerHint === 'leetcode' || lowerUrl.includes('leetcode.com')) return 'LeetCode';
    if (lowerHint === 'codeforces' || lowerUrl.includes('codeforces.com')) return 'Codeforces';
    if (lowerHint === 'twitter' || lowerHint === 'x' || lowerUrl.includes('twitter.com') || lowerUrl.includes('x.com')) return 'Twitter / X';
    if (lowerHint === 'youtube' || lowerUrl.includes('youtube.com') || lowerUrl.includes('youtu.be')) return 'YouTube';
    if (lowerHint === 'instagram' || lowerUrl.includes('instagram.com')) return 'Instagram';
    return 'Website';
  };

  // Helper to normalize social link inputs
  const normalizeSocialUrl = (input = '', platform = '') => {
    if (!input) return '';
    const trimmed = input.trim();
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      return trimmed;
    }
    const clean = trimmed.replace(/^@/, '');
    switch (platform.toLowerCase()) {
      case 'github':
        return `https://github.com/${clean}`;
      case 'linkedin':
        return clean.includes('linkedin.com') ? `https://${clean}` : `https://www.linkedin.com/in/${clean}`;
      case 'leetcode':
        return `https://leetcode.com/u/${clean}`;
      case 'codeforces':
        return `https://codeforces.com/profile/${clean}`;
      case 'twitter':
      case 'x':
        return `https://x.com/${clean}`;
      default:
        return trimmed.includes('.') ? `https://${trimmed}` : trimmed;
    }
  };

  // Helper to get friendly display label
  const getSocialDisplayLabel = (url = '', rawInput = '', platform = '') => {
    if (rawInput && !rawInput.startsWith('http')) {
      return rawInput.startsWith('@') ? rawInput : `@${rawInput}`;
    }
    try {
      const parsed = new URL(url.startsWith('http') ? url : `https://${url}`);
      const parts = parsed.pathname.split('/').filter(Boolean);
      if (parts.length > 0) {
        const last = parts[parts.length - 1];
        if (last && !['in', 'u', 'profile', 'channel', 'user'].includes(last)) {
          return `@${last}`;
        }
      }
      return parsed.hostname.replace('www.', '');
    } catch (e) {
      return rawInput || platform || 'Link';
    }
  };

  // Render SVG brand icon for any social / coding platform
  const renderPlatformIcon = (platform = '', sizeClasses = 'w-3.5 h-3.5') => {
    const plat = (platform || '').toLowerCase();
    if (plat.includes('github')) {
      return (
        <svg className={`${sizeClasses} fill-white shrink-0`} viewBox="0 0 24 24">
          <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
        </svg>
      );
    }
    if (plat.includes('linkedin')) {
      return (
        <svg className={`${sizeClasses} fill-[#0a66c2] shrink-0`} viewBox="0 0 24 24">
          <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9h2.79v8.37H6.46v-8.37M7.86 6.34a1.62 1.62 0 1 0 0 3.24 1.62 1.62 0 0 0 0-3.24z"/>
        </svg>
      );
    }
    if (plat.includes('leetcode')) {
      return (
        <svg className={`${sizeClasses} fill-[#ffa116] shrink-0`} viewBox="0 0 24 24">
          <path d="M13.483 0a1.374 1.374 0 0 0-.961.438L7.116 6.226l-3.854 4.126a5.266 5.266 0 0 0-1.209 2.104 5.35 5.35 0 0 0-.125.513 5.527 5.527 0 0 0 .062 2.362 5.83 5.83 0 0 0 .349 1.017 5.938 5.938 0 0 0 1.271 1.818l4.277 4.193.039.038c2.248 2.165 5.852 2.133 8.063-.074l2.396-2.392c.54-.54.54-1.414.003-1.955a1.378 1.378 0 0 0-1.951-.003l-2.396 2.392a3.021 3.021 0 0 1-4.205.038l-.02-.019-4.276-4.193c-.652-.64-.972-1.469-.948-2.263a2.68 2.68 0 0 1 .066-.523 2.545 2.545 0 0 1 .619-1.164L9.13 8.114c1.058-1.134 3.204-1.27 4.43-.278l3.501 2.831c.593.48 1.461.387 1.94-.207a1.384 1.384 0 0 0-.207-1.943l-3.5-2.831c-.8-.647-1.766-1.045-2.774-1.144L14.44.472A1.374 1.374 0 0 0 13.483 0zm-2.866 12.815a1.38 1.38 0 0 0-1.38 1.382 1.38 1.38 0 0 0 1.38 1.382H20.79a1.38 1.38 0 0 0 1.38-1.382 1.38 1.38 0 0 0-1.38-1.382z"/>
        </svg>
      );
    }
    if (plat.includes('codeforces')) {
      return (
        <svg className={`${sizeClasses} shrink-0`} viewBox="0 0 24 24">
          <path fill="#FFD400" d="M4.5 7.5a1.5 1.5 0 0 0-1.5 1.5v9a1.5 1.5 0 0 0 3 0V9a1.5 1.5 0 0 0-1.5-1.5z"/>
          <path fill="#1890FF" d="M12 3a1.5 1.5 0 0 0-1.5 1.5v13.5a1.5 1.5 0 0 0 3 0V4.5A1.5 1.5 0 0 0 12 3z"/>
          <path fill="#ED1B24" d="M19.5 12a1.5 1.5 0 0 0-1.5 1.5v4.5a1.5 1.5 0 0 0 3 0v-4.5a1.5 1.5 0 0 0-1.5-1.5z"/>
        </svg>
      );
    }
    if (plat.includes('twitter') || plat.includes('x')) {
      return (
        <svg className={`${sizeClasses} fill-white shrink-0`} viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
      );
    }
    if (plat.includes('youtube')) {
      return (
        <svg className={`${sizeClasses} fill-[#ef4444] shrink-0`} viewBox="0 0 24 24">
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.5 12 3.5 12 3.5s-7.505 0-9.377.55a3.016 3.016 0 0 0-2.122 2.136C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.55 9.376.55 9.376.55s7.505 0 9.377-.55a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
        </svg>
      );
    }
    return (
      <svg className={`${sizeClasses} text-[#81b64c] shrink-0`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"/>
      </svg>
    );
  };

  const handleOpenEditProfile = () => {
    const curUser = profileData?.user;
    if (!curUser) return;
    const sl = curUser.socialLinks || {};
    setEditForm({
      displayName: curUser.displayName || curUser.username || '',
      country: curUser.country || '',
      countryFlag: curUser.countryFlag || '',
      location: curUser.location || '',
      about: curUser.about || curUser.bio || '',
      avatar: curUser.avatar || '',
      organization: curUser.organization || '',
      socialLinks: {
        github: sl.github || '',
        linkedin: sl.linkedin || '',
        leetcode: sl.leetcode || '',
        codeforces: sl.codeforces || '',
        website: sl.website || '',
        other: sl.other || '',
        custom: Array.isArray(sl.custom) ? sl.custom.map(c => ({ label: c.label || '', url: c.url || '' })) : []
      }
    });
    setEditError('');
    setEditSuccess('');
    setIsEditProfileOpen(true);
  };

  const handleAvatarFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setEditError('Please select a valid image file (JPEG, PNG, WEBP, etc.)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setEditError('Image size should be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setEditForm(prev => ({ ...prev, avatar: reader.result }));
      setEditError('');
    };
    reader.onerror = () => {
      setEditError('Failed to read image file');
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setEditSubmitting(true);
    setEditError('');
    setEditSuccess('');

    try {
      const activeToken = token || localStorage.getItem('token');
      const res = await axios.put(
        'http://localhost:5000/api/users/profile',
        {
          displayName: editForm.displayName.trim(),
          country: (editForm.country || '').trim(),
          countryFlag: (editForm.countryFlag || '').trim(),
          location: editForm.location.trim(),
          bio: editForm.about.trim(),
          about: editForm.about.trim(),
          avatar: editForm.avatar.trim(),
          organization: editForm.organization.trim(),
          socialLinks: editForm.socialLinks
        },
        {
          headers: {
            Authorization: `Bearer ${activeToken}`
          }
        }
      );

      const updatedUser = res.data.user;
      setProfileData(prev => ({
        ...prev,
        user: {
          ...prev.user,
          ...updatedUser
        }
      }));

      if (typeof refreshUser === 'function') {
        await refreshUser();
      }

      setEditSuccess('Profile updated successfully!');
      setTimeout(() => {
        setIsEditProfileOpen(false);
        setEditSuccess('');
      }, 700);
    } catch (err) {
      console.error('Failed to update profile:', err);
      setEditError(err.response?.data?.message || 'Failed to update profile. Please try again.');
    } finally {
      setEditSubmitting(false);
    }
  };

  const formatRelativeTime = (dateStr) => {
    if (!dateStr) return 'Recently';
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / (1000 * 60));
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Clubs Modal State
  const [showCreateClubModal, setShowCreateClubModal] = useState(false);
  const [newClubName, setNewClubName] = useState('');
  const [newClubDesc, setNewClubDesc] = useState('');
  const [newClubIcon, setNewClubIcon] = useState('💻');
  const [newClubLocation, setNewClubLocation] = useState('');
  const [createClubError, setCreateClubError] = useState('');
  const [createClubSubmitting, setCreateClubSubmitting] = useState(false);

  // Manage Club Members State
  const [managingClub, setManagingClub] = useState(null);
  const [memberUsernameToAdd, setMemberUsernameToAdd] = useState('');
  const [manageClubError, setManageClubError] = useState('');
  const [manageClubSuccess, setManageClubSuccess] = useState('');
  const [manageClubSubmitting, setManageClubSubmitting] = useState(false);

  const handleCreateClub = async (e) => {
    e.preventDefault();
    if (!newClubName.trim()) return;
    setCreateClubError('');
    setCreateClubSubmitting(true);

    try {
      const activeToken = token || localStorage.getItem('token');
      const res = await axios.post(
        'http://localhost:5000/api/clubs',
        {
          name: newClubName.trim(),
          description: newClubDesc.trim() || 'A community of passionate competitive programmers.',
          icon: newClubIcon || '💻',
          location: newClubLocation.trim() || 'Global'
        },
        { headers: { Authorization: `Bearer ${activeToken}` } }
      );

      setShowCreateClubModal(false);
      setNewClubName('');
      setNewClubDesc('');
      setNewClubLocation('');
      
      const created = res.data;
      setProfileData(prev => ({
        ...prev,
        user: {
          ...prev.user,
          clubs: [
            {
              id: created.id,
              slug: created.slug,
              name: created.name,
              description: created.description,
              members: created.membersCount || 1,
              role: 'owner',
              icon: created.icon,
              location: created.location,
              isOwner: true
            },
            ...(prev.user.clubs || [])
          ]
        }
      }));
    } catch (err) {
      setCreateClubError(err.response?.data?.message || 'Failed to create club');
    } finally {
      setCreateClubSubmitting(false);
    }
  };

  const handleOpenManageMembers = async (club) => {
    try {
      const identifier = club.slug || club.id || club._id;
      const res = await axios.get(`http://localhost:5000/api/clubs/${identifier}`);
      setManagingClub(res.data);
      setManageClubError('');
      setManageClubSuccess('');
      setMemberUsernameToAdd('');
    } catch (err) {
      console.error('Could not load club details:', err);
      // Graceful fallback so modal opens with existing card information
      setManagingClub({
        id: club.id || club._id,
        name: club.name,
        slug: club.slug,
        description: club.description,
        icon: club.icon || '💻',
        location: club.location || 'Global',
        membersCount: club.members || 1,
        isOwner: club.isOwner,
        owner: club.isOwner ? {
          username: user?.username,
          displayName: user?.displayName || user?.username
        } : null,
        members: [
          {
            userId: user?._id || user?.id,
            username: user?.username,
            displayName: user?.displayName || user?.username,
            role: club.isOwner ? 'owner' : (club.role || 'member')
          }
        ]
      });
      setManageClubError('');
      setManageClubSuccess('');
      setMemberUsernameToAdd('');
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!memberUsernameToAdd.trim() || !managingClub) return;
    setManageClubError('');
    setManageClubSuccess('');

    try {
      setManageClubSubmitting(true);
      const activeToken = token || localStorage.getItem('token');
      const res = await axios.post(
        `http://localhost:5000/api/clubs/${managingClub.id}/members`,
        { username: memberUsernameToAdd.trim() },
        { headers: { Authorization: `Bearer ${activeToken}` } }
      );

      setManageClubSuccess(res.data.message);
      setMemberUsernameToAdd('');
      const updated = await axios.get(`http://localhost:5000/api/clubs/${managingClub.id}`);
      setManagingClub(updated.data);

      if (isMe) {
        const pRes = await axios.get('http://localhost:5000/api/users/me', {
          headers: { Authorization: `Bearer ${activeToken}` }
        });
        setProfileData(pRes.data);
      }
    } catch (err) {
      setManageClubError(err.response?.data?.message || 'Failed to add member.');
    } finally {
      setManageClubSubmitting(false);
    }
  };

  const handleRemoveMember = async (memberUserId) => {
    if (!managingClub) return;
    if (!window.confirm('Are you sure you want to remove this member?')) return;

    try {
      const activeToken = token || localStorage.getItem('token');
      await axios.delete(
        `http://localhost:5000/api/clubs/${managingClub.id}/members/${memberUserId}`,
        { headers: { Authorization: `Bearer ${activeToken}` } }
      );

      const updated = await axios.get(`http://localhost:5000/api/clubs/${managingClub.id}`);
      setManagingClub(updated.data);

      if (isMe) {
        const pRes = await axios.get('http://localhost:5000/api/users/me', {
          headers: { Authorization: `Bearer ${activeToken}` }
        });
        setProfileData(pRes.data);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to remove member.');
    }
  };

  const handleDeleteClub = async () => {
    if (!managingClub) return;
    if (!window.confirm(`Permanently delete "${managingClub.name}"? This action cannot be undone.`)) return;

    try {
      const activeToken = token || localStorage.getItem('token');
      await axios.delete(
        `http://localhost:5000/api/clubs/${managingClub.id}`,
        { headers: { Authorization: `Bearer ${activeToken}` } }
      );

      setManagingClub(null);
      if (isMe) {
        const pRes = await axios.get('http://localhost:5000/api/users/me', {
          headers: { Authorization: `Bearer ${activeToken}` }
        });
        setProfileData(pRes.data);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete club.');
    }
  };

  const handleLeaveClub = async (clubId) => {
    const id = clubId || managingClub?.id;
    if (!id) return;
    if (!window.confirm('Are you sure you want to leave this club?')) return;

    try {
      const activeToken = token || localStorage.getItem('token');
      await axios.post(
        `http://localhost:5000/api/clubs/${id}/leave`,
        {},
        { headers: { Authorization: `Bearer ${activeToken}` } }
      );

      setManagingClub(null);
      if (isMe) {
        const pRes = await axios.get('http://localhost:5000/api/users/me', {
          headers: { Authorization: `Bearer ${activeToken}` }
        });
        setProfileData(pRes.data);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to leave club.');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-4">
        <div className="w-10 h-10 border-4 border-[#81b64c]/20 border-t-[#81b64c] rounded-full animate-spin"></div>
        <p className="text-white/60 text-sm font-medium">Loading player profile...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 max-w-lg mx-auto text-center mt-16">
        <div className="bg-[#21201d] p-8 rounded-2xl border border-white/10 shadow-2xl">
          <div className="w-16 h-16 bg-danger/10 border border-danger/30 text-danger rounded-full mx-auto mb-4 flex items-center justify-center text-2xl font-bold">
            !
          </div>
          <h2 className="text-2xl font-bold mb-2 text-white">Player Not Found</h2>
          <p className="text-white/60 text-sm mb-6">
            {error === 'User not found' && username 
              ? `No player exists with the username "@${username}".` 
              : error}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {isLoggedIn ? (
              <Link 
                to="/profile" 
                className="bg-[#81b64c] hover:bg-[#92c55b] px-6 py-2.5 rounded-xl font-bold transition text-sm text-white"
              >
                View My Profile
              </Link>
            ) : (
              <Link 
                to="/login" 
                className="bg-[#81b64c] hover:bg-[#92c55b] px-6 py-2.5 rounded-xl font-bold transition text-sm text-white"
              >
                Log In
              </Link>
            )}
            <Link 
              to="/" 
              className="bg-[#2b2926] hover:bg-[#363431] border border-white/10 px-6 py-2.5 rounded-xl font-bold transition text-sm text-white"
            >
              Back to Arena
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!profileData?.user) return null;

  const { user, externalProfiles, matchHistory = [] } = profileData;
  const isOwnProfile = authUser && (user._id === authUser._id || user.username === authUser.username);
  const isActuallyLive = isOwnProfile
    ? true
    : (typeof isUserOnline === 'function' ? isUserOnline(user?.username) : Boolean(user?.isOnline));

  const handleChallengeUser = (targetUsername, battleMode = 'Blitz') => {
    if (openDirectChallenge) {
      openDirectChallenge(targetUsername, battleMode);
    }
  };

  // Compute active social and coding profiles for rendering
  const activeSocialList = (() => {
    const list = [];
    const sl = user.socialLinks || {};

    if (sl.github) {
      list.push({
        platform: 'GitHub',
        url: normalizeSocialUrl(sl.github, 'GitHub'),
        displayLabel: getSocialDisplayLabel(normalizeSocialUrl(sl.github, 'GitHub'), sl.github, 'GitHub')
      });
    }
    if (sl.linkedin) {
      list.push({
        platform: 'LinkedIn',
        url: normalizeSocialUrl(sl.linkedin, 'LinkedIn'),
        displayLabel: getSocialDisplayLabel(normalizeSocialUrl(sl.linkedin, 'LinkedIn'), sl.linkedin, 'LinkedIn')
      });
    }
    if (sl.leetcode) {
      list.push({
        platform: 'LeetCode',
        url: normalizeSocialUrl(sl.leetcode, 'LeetCode'),
        displayLabel: getSocialDisplayLabel(normalizeSocialUrl(sl.leetcode, 'LeetCode'), sl.leetcode, 'LeetCode')
      });
    }
    if (sl.codeforces) {
      list.push({
        platform: 'Codeforces',
        url: normalizeSocialUrl(sl.codeforces, 'Codeforces'),
        displayLabel: getSocialDisplayLabel(normalizeSocialUrl(sl.codeforces, 'Codeforces'), sl.codeforces, 'Codeforces')
      });
    }
    if (sl.website) {
      const plat = detectPlatform(sl.website, 'Website');
      list.push({
        platform: plat,
        url: normalizeSocialUrl(sl.website, plat),
        displayLabel: getSocialDisplayLabel(normalizeSocialUrl(sl.website, plat), sl.website, plat)
      });
    }
    if (sl.other) {
      const plat = detectPlatform(sl.other, 'Other');
      list.push({
        platform: plat,
        url: normalizeSocialUrl(sl.other, plat),
        displayLabel: getSocialDisplayLabel(normalizeSocialUrl(sl.other, plat), sl.other, plat)
      });
    }
    if (Array.isArray(sl.custom)) {
      sl.custom.forEach(c => {
        if (c && c.url && c.url.trim()) {
          const plat = detectPlatform(c.url, c.label || '');
          list.push({
            platform: plat,
            url: normalizeSocialUrl(c.url, plat),
            displayLabel: c.label || getSocialDisplayLabel(normalizeSocialUrl(c.url, plat), c.url, plat)
          });
        }
      });
    }

    if (Array.isArray(externalProfiles)) {
      externalProfiles.forEach(ep => {
        if (ep && ep.profileUrl) {
          const plat = detectPlatform(ep.profileUrl, ep.platform || '');
          const already = list.some(item => item.url.toLowerCase() === ep.profileUrl.toLowerCase());
          if (!already) {
            list.push({
              platform: plat,
              url: ep.profileUrl,
              displayLabel: ep.username ? `@${ep.username}` : getSocialDisplayLabel(ep.profileUrl, '', plat)
            });
          }
        }
      });
    }

    return list;
  })();

  const solvedStats = profileData?.solvedStats || user?.solvedStats || {
    totalSolved: 0,
    totalProblems: 375,
    easy: { solved: 0, total: 195 },
    medium: { solved: 0, total: 138 },
    hard: { solved: 0, total: 42 },
    attempting: 0
  };
  const recentSolved = profileData?.recentSolved || user?.recentSolved || [];
  const allSolvedProblems = profileData?.allSolvedProblems || user?.allSolvedProblems || recentSolved;

  // LeetCode-style Circular Progress Gauge Component
  const renderSolvedGauge = () => {
    const totalSolved = solvedStats.totalSolved || 0;
    const totalProbs = solvedStats.totalProblems || 375;
    const easyCount = solvedStats.easy?.solved || 0;
    const medCount = solvedStats.medium?.solved || 0;
    const hardCount = solvedStats.hard?.solved || 0;

    const R = 56;
    const C = 2 * Math.PI * R;
    const totalArc = C * (260 / 360);
    const strokeWidth = 9;

    let easyStroke = 0;
    let medStroke = 0;
    let hardStroke = 0;

    if (totalSolved > 0) {
      const fillPct = Math.min(1, Math.max(0.12, (totalSolved / totalProbs) * 2.5));
      const activeArc = totalArc * fillPct;
      const strokeGap = 3.5;

      const eWeight = easyCount / totalSolved;
      const mWeight = medCount / totalSolved;
      const hWeight = hardCount / totalSolved;

      easyStroke = easyCount > 0 ? Math.max(7, eWeight * activeArc - (medCount > 0 || hardCount > 0 ? strokeGap : 0)) : 0;
      medStroke = medCount > 0 ? Math.max(7, mWeight * activeArc - (hardCount > 0 ? strokeGap : 0)) : 0;
      hardStroke = hardCount > 0 ? Math.max(7, hWeight * activeArc) : 0;
    }

    const easyOffset = 0;
    const medOffset = -(easyStroke + (easyStroke > 0 ? 3.5 : 0));
    const hardOffset = -(easyStroke + (easyStroke > 0 ? 3.5 : 0) + medStroke + (medStroke > 0 ? 3.5 : 0));

    return (
      <div className="relative flex flex-col items-center justify-center">
        <svg viewBox="0 0 160 160" className="w-36 h-36 sm:w-44 sm:h-44 overflow-visible">
          {/* Background subtle dark track */}
          <circle
            cx="80"
            cy="80"
            r={R}
            fill="none"
            stroke="#2d2a26"
            strokeWidth={strokeWidth}
            strokeDasharray={`${totalArc} ${C}`}
            strokeLinecap="round"
            transform="rotate(140 80 80)"
          />

          {/* Easy segment (Teal / Cyan) */}
          {easyStroke > 0 && (
            <circle
              cx="80"
              cy="80"
              r={R}
              fill="none"
              stroke="#00b8a3"
              strokeWidth={strokeWidth}
              strokeDasharray={`${easyStroke} ${C}`}
              strokeDashoffset={easyOffset}
              strokeLinecap="round"
              transform="rotate(140 80 80)"
            />
          )}

          {/* Medium segment (Yellow / Amber) */}
          {medStroke > 0 && (
            <circle
              cx="80"
              cy="80"
              r={R}
              fill="none"
              stroke="#ffc01e"
              strokeWidth={strokeWidth}
              strokeDasharray={`${medStroke} ${C}`}
              strokeDashoffset={medOffset}
              strokeLinecap="round"
              transform="rotate(140 80 80)"
            />
          )}

          {/* Hard segment (Red / Coral) */}
          {hardStroke > 0 && (
            <circle
              cx="80"
              cy="80"
              r={R}
              fill="none"
              stroke="#ff375f"
              strokeWidth={strokeWidth}
              strokeDasharray={`${hardStroke} ${C}`}
              strokeDashoffset={hardOffset}
              strokeLinecap="round"
              transform="rotate(140 80 80)"
            />
          )}

          {/* Centered Numbers: Total Solved / Total Problems */}
          <text
            x="80"
            y="72"
            textAnchor="middle"
            className="fill-white font-black text-3xl select-none"
          >
            {totalSolved}
            <tspan className="fill-[#8c8b88] text-xs font-semibold">/{totalProbs}</tspan>
          </text>

          {/* Solved label with green checkmark */}
          <text
            x="80"
            y="89"
            textAnchor="middle"
            className="fill-[#81b64c] text-[11px] font-bold select-none"
          >
            ✓ Solved
          </text>
        </svg>

        {/* Bottom Label under the arc opening: Attempting */}
        <div className="text-xs text-[#8c8b88] font-medium tracking-wide -mt-3.5">
          {solvedStats.attempting || 0} Attempting
        </div>
      </div>
    );
  };

  // Dynamic rating curve points generator:
  // If user hasn't played any challenge games in this mode, returns identical points to render a straight line.
  // When challenge games are played, dynamically plots their real rating trajectory over time.
  const getRatingPoints = (mode) => {
    const curRating = user.ratings?.[mode] ?? 1500;
    const curve = user.ratingCurves?.[mode];
    const modeMatches = (matchHistory || []).filter(m => m.mode?.toLowerCase() === mode.toLowerCase());

    // 1. If backend provided recorded rating history points for this mode
    if (curve && Array.isArray(curve) && curve.length > 0) {
      return [1500, ...curve];
    }

    // 2. If user has completed matches in matchHistory for this mode, reconstruct chronologically
    if (modeMatches.length > 0) {
      const chronological = [...modeMatches].reverse();
      let r = 1500;
      const pts = [1500];
      chronological.forEach(m => {
        if (m.isRated === false || m.ratingChange === '+0' || m.ratingChange === 0) {
          // Unrated bot duel - rating does not change
          return;
        }
        const delta = typeof m.ratingChange === 'number'
          ? m.ratingChange
          : parseInt(m.ratingChange, 10) || (m.resultType === 'win' ? 16 : m.resultType === 'loss' ? -12 : 0);
        r += delta;
        pts.push(r);
      });
      if (pts.length > 1) return pts;
    }

    // 3. No challenge games played in this mode yet -> perfectly flat straight line
    return [curRating, curRating, curRating, curRating, curRating, curRating];
  };

  // Sparkline data generator for rating curves
  const renderSparkline = (color = '#38bdf8', points = [1500, 1500, 1500]) => {
    const width = 220;
    const height = 45;
    const max = Math.max(...points);
    const min = Math.min(...points);
    const isFlat = max === min;
    const range = max - min || 1;

    const coordinates = points.map((p, i) => {
      const x = (i / (points.length - 1 || 1)) * width;
      const y = isFlat
        ? height / 2
        : height - ((p - min) / range) * (height - 14) - 7;
      return `${x},${y}`;
    });

    const pathD = `M ${coordinates.join(' L ')}`;
    const areaD = `${pathD} L ${width},${height} L 0,${height} Z`;
    const lastY = isFlat ? height / 2 : height - ((points[points.length - 1] - min) / range) * (height - 14) - 7;

    return (
      <svg className="w-full h-11 mt-1 overflow-visible" viewBox={`0 0 ${width} ${height}`}>
        <defs>
          <linearGradient id={`grad-${color.replace('#', '')}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity={isFlat ? 0.08 : 0.28} />
            <stop offset="100%" stopColor={color} stopOpacity="0.0" />
          </linearGradient>
        </defs>
        <path d={areaD} fill={`url(#grad-${color.replace('#', '')})`} />
        <path 
          d={pathD} 
          fill="none" 
          stroke={color} 
          strokeWidth={isFlat ? "2" : "2.5"} 
          strokeLinecap="round" 
          strokeLinejoin="round" 
        />
        {/* Subtle dot at current rating */}
        <circle cx={width} cy={lastY} r="2.5" fill={color} />
      </svg>
    );
  };

  return (
    <div className="min-h-full bg-[#161512] text-[#e3e2de] pb-16">
      {/* Hero Profile Banner Header */}
      <div className="relative bg-gradient-to-b from-[#21201d] via-[#1a1916] to-[#161512] border-b border-[#2d2a26] px-6 lg:px-12 pt-8 pb-4">
        <div className="max-w-[1680px] w-full mx-auto flex flex-col md:flex-row items-start md:items-center gap-6">
          {/* Avatar with Status indicator & Edit trigger */}
          <div className="relative group">
            <div 
              onClick={() => isOwnProfile && handleOpenEditProfile()}
              className={`w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-[#262421] border-2 border-white/10 shadow-2xl overflow-hidden flex items-center justify-center text-4xl font-extrabold text-[#81b64c] transition ${
                isOwnProfile ? 'cursor-pointer hover:border-[#81b64c]/60 group/avatar relative' : ''
              }`}
              title={isOwnProfile ? 'Click to change profile picture' : user.username}
            >
              {user.isBot || user.role === 'BOT' || user.username?.toLowerCase().includes('bot') || user.username?.toLowerCase().includes('stockfish') || user.username?.toLowerCase().includes('deepcoder') ? (
                <span className="text-5xl">🤖</span>
              ) : user.avatar ? (
                <img src={user.avatar} alt={user.username} className="w-full h-full object-cover" />
              ) : (
                <span>{user.username ? user.username.charAt(0).toUpperCase() : 'U'}</span>
              )}

              {/* Hover overlay for changing DP */}
              {isOwnProfile && (
                <div className="absolute inset-0 bg-black/65 opacity-0 group-hover/avatar:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center text-white gap-1 backdrop-blur-xs">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="text-[10px] font-bold uppercase tracking-wider">Change DP</span>
                </div>
              )}
            </div>
            {/* Real-time Status Indicator Dot (Green if live/online, Gray if offline) */}
            <span
              className={`absolute bottom-1 right-1 w-4 h-4 rounded-full border-2 border-[#161512] shadow-sm z-10 transition-colors duration-300 ${
                isActuallyLive
                  ? 'bg-[#81b64c] ring-2 ring-[#81b64c]/30'
                  : 'bg-[#5c5a57]'
              }`}
              title={isActuallyLive ? 'Active now' : (user.lastOnline && user.lastOnline !== 'Active now' ? `Last online: ${user.lastOnline}` : 'Offline')}
            />
          </div>

          {/* User Information */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
                <span>{user.username}</span>
                {(user.isBot || user.role === 'BOT' || user.username?.toLowerCase().includes('bot') || user.username?.toLowerCase().includes('stockfish') || user.username?.toLowerCase().includes('deepcoder')) && (
                  <span className="text-xs bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded-md font-mono flex items-center gap-1 font-bold">
                    <span>🤖</span>
                    <span>BOT</span>
                  </span>
                )}
              </h1>
              {user.countryFlag ? (
                <span className="text-2xl" title={user.country || ''}>
                  {user.countryFlag}
                </span>
              ) : null}
              {isOwnProfile && (
                <span className="bg-[#81b64c]/20 text-[#81b64c] border border-[#81b64c]/30 text-xs font-bold px-2.5 py-0.5 rounded-full">
                  You
                </span>
              )}
            </div>

            <div className="flex items-center gap-3 text-sm text-[#9e9d9a] mt-1.5 flex-wrap">
              <span className="text-white/90 font-medium">{user.displayName || user.username}</span>
              {user.location ? (
                <>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <span>📍</span>
                    <span>{user.location}</span>
                  </span>
                </>
              ) : null}
            </div>

            {user.organization ? (
              <div className="text-xs font-semibold text-[#81b64c] uppercase tracking-wider mt-1">
                {user.organization}
              </div>
            ) : null}

            {/* About / Bio Display */}
            {(user.about || user.bio) && (
              <div className="mt-3 max-w-2xl bg-[#24221e]/80 border border-white/5 rounded-xl px-4 py-2.5 text-sm text-[#d4d3ce] leading-relaxed shadow-sm">
                <p className="whitespace-pre-line text-xs sm:text-sm font-normal">{user.about || user.bio}</p>
              </div>
            )}

            {/* Social & Coding Links Bar */}
            {activeSocialList.length > 0 && (
              <div className="flex items-center gap-2 mt-3.5 flex-wrap">
                {activeSocialList.map((item, idx) => (
                  <a
                    key={idx}
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#24221f] hover:bg-[#2d2b27] border border-white/10 hover:border-[#81b64c]/60 text-xs font-semibold text-white/90 hover:text-white transition shadow-sm group cursor-pointer"
                    title={`${item.platform}: ${item.url}`}
                  >
                    <span className="flex-shrink-0">{renderPlatformIcon(item.platform, 'w-3.5 h-3.5')}</span>
                    <span className="truncate max-w-[130px] sm:max-w-[180px] font-medium text-white/90 group-hover:text-white">
                      {item.displayLabel}
                    </span>
                    <svg className="w-2.5 h-2.5 text-[#7d7c78] group-hover:text-white transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                ))}
              </div>
            )}

            {/* Meta Row: Joined, Friends, Views, Last Online */}
            <div className="flex items-center gap-4 sm:gap-6 text-xs text-[#8c8b88] mt-4 flex-wrap border-t border-white/5 pt-3">
              <div>
                <span className="text-white font-bold">{user.joinedDate || 'Recently'}</span> Joined
              </div>
              <div
                onClick={() => setActiveTab('friends')}
                className="cursor-pointer hover:text-[#81b64c] transition"
                title="View Friends"
              >
                <span className="text-white font-bold">{profileFriends.length || user.friendsCount || 0}</span> Friends
              </div>
              <div>
                <span className="text-white font-bold">{user.viewsCount ?? 0}</span> Views
              </div>
              <div>
                Last Online{' '}
                <span className={`font-bold transition-colors ${
                  isActuallyLive ? 'text-[#81b64c]' : 'text-[#8c8b88]'
                }`}>
                  {isActuallyLive
                    ? 'Active now'
                    : (user.lastOnline && user.lastOnline !== 'Active now' ? user.lastOnline : 'Offline')}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Actions (Challenge, Add Friend, or Play) */}
          <div className="flex md:flex-col gap-2.5 w-full md:w-auto mt-2 md:mt-0">
            {isOwnProfile ? (
              <>
                <button
                  onClick={handleOpenEditProfile}
                  className="flex-1 md:flex-initial bg-[#2b2926] hover:bg-[#383531] text-white font-bold text-sm px-5 py-2.5 rounded-xl border border-white/15 flex items-center justify-center gap-2 transition hover:border-[#81b64c]/60 shadow-md cursor-pointer"
                >
                  <svg className="w-4 h-4 text-[#81b64c]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                  <span>Edit Profile</span>
                </button>
                <Link 
                  to="/" 
                  className="flex-1 md:flex-initial bg-[#81b64c] hover:bg-[#92c55b] text-white font-bold text-sm px-6 py-2.5 rounded-xl shadow-lg shadow-[#81b64c]/20 text-center transition active:scale-95"
                >
                  Challenge Battle
                </Link>
                <Link 
                  to="/training" 
                  className="flex-1 md:flex-initial bg-[#24221e] hover:bg-[#2f2d29] text-white font-bold text-sm px-6 py-2.5 rounded-xl border border-white/10 text-center transition"
                >
                  Practice / Training
                </Link>
              </>
            ) : (
              <>
                <button 
                  onClick={() => handleChallengeUser(user.username, 'Blitz')}
                  className="flex-1 md:flex-initial bg-[#81b64c] hover:bg-[#92c55b] text-white font-bold text-sm px-6 py-2.5 rounded-xl shadow-lg transition active:scale-95 cursor-pointer"
                >
                  Challenge
                </button>
                {user.isBot || user.role === 'BOT' || user.username?.toLowerCase().includes('bot') || user.username?.toLowerCase().includes('stockfish') || user.username?.toLowerCase().includes('deepcoder') ? (
                  <span className="flex-1 md:flex-initial bg-purple-500/15 border border-purple-500/30 text-purple-400 font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-1.5 justify-center">
                    <span>🤖</span>
                    <span>AI Bot (Unfriendable)</span>
                  </span>
                ) : (
                  <button 
                    onClick={handleAddFriend}
                    disabled={friendStatus !== 'idle'}
                    className="flex-1 md:flex-initial bg-[#2b2926] hover:bg-[#363431] text-white font-bold text-sm px-6 py-2.5 rounded-xl border border-white/10 transition cursor-pointer disabled:opacity-75"
                  >
                    {friendStatus === 'added' ? 'Friend Added ✓' : (friendStatus === 'loading' ? 'Adding...' : 'Add Friend')}
                  </button>
                )}
              </>
            )}
          </div>
        </div>

      </div>

      {/* Main Body Grid Layout */}
      <div className="max-w-[1680px] w-full mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 mt-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Columns: Rating Cards, Tab Bar, and Section Content */}
        <div className="lg:col-span-8 xl:col-span-9 flex flex-col gap-6">
          
          {/* Rating Cards Row (Rapid, Blitz, Bullet) - CLICKABLE FOR STATS */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Rapid Card */}
            <div 
              onClick={() => setSelectedStatsMode('rapid')}
              title="Click to view Rapid stats"
              className="bg-[#21201d] border border-[#2d2a26] hover:border-emerald-500/50 hover:bg-[#262421] cursor-pointer rounded-xl p-4 flex flex-col justify-between transition-all shadow-md group relative overflow-hidden"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl group-hover:scale-110 transition-transform">⏱️</span>
                  <span className="text-xs font-bold uppercase tracking-wider text-[#9e9d9a] group-hover:text-white transition-colors">Rapid</span>
                </div>
                <span className="text-xs font-bold text-[#81b64c] flex items-center gap-0.5">
                  <span>↑</span>
                  <span>{user.ratingGains?.rapid ?? '+0'}</span>
                </span>
              </div>
              <div className="text-3xl font-extrabold text-white mt-2 flex items-baseline justify-between">
                <span>{user.ratings?.rapid ?? 1500}</span>
                <span className="text-[11px] text-emerald-400 font-semibold opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
                  Stats →
                </span>
              </div>
              {renderSparkline('#10b981', getRatingPoints('rapid'))}
            </div>

            {/* Blitz Card */}
            <div 
              onClick={() => setSelectedStatsMode('blitz')}
              title="Click to view Blitz stats"
              className="bg-[#21201d] border border-[#2d2a26] hover:border-yellow-500/50 hover:bg-[#262421] cursor-pointer rounded-xl p-4 flex flex-col justify-between transition-all shadow-md group relative overflow-hidden"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl text-yellow-400 group-hover:scale-110 transition-transform">⚡</span>
                  <span className="text-xs font-bold uppercase tracking-wider text-[#9e9d9a] group-hover:text-white transition-colors">Blitz</span>
                </div>
                <span className="text-xs font-bold text-[#81b64c] flex items-center gap-0.5">
                  <span>↑</span>
                  <span>{user.ratingGains?.blitz ?? '+0'}</span>
                </span>
              </div>
              <div className="text-3xl font-extrabold text-white mt-2 flex items-baseline justify-between">
                <span>{user.ratings?.blitz ?? 1500}</span>
                <span className="text-[11px] text-yellow-400 font-semibold opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
                  Stats →
                </span>
              </div>
              {renderSparkline('#eab308', getRatingPoints('blitz'))}
            </div>

            {/* Bullet Card */}
            <div 
              onClick={() => setSelectedStatsMode('bullet')}
              title="Click to view Bullet stats"
              className="bg-[#21201d] border border-[#2d2a26] hover:border-orange-500/50 hover:bg-[#262421] cursor-pointer rounded-xl p-4 flex flex-col justify-between transition-all shadow-md group relative overflow-hidden"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl text-orange-400 group-hover:scale-110 transition-transform">🚀</span>
                  <span className="text-xs font-bold uppercase tracking-wider text-[#9e9d9a] group-hover:text-white transition-colors">Bullet</span>
                </div>
                <span className="text-xs font-bold text-[#81b64c] flex items-center gap-0.5">
                  <span>↑</span>
                  <span>{user.ratingGains?.bullet ?? '+0'}</span>
                </span>
              </div>
              <div className="text-3xl font-extrabold text-white mt-2 flex items-baseline justify-between">
                <span>{user.ratings?.bullet ?? 1500}</span>
                <span className="text-[11px] text-orange-400 font-semibold opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
                  Stats →
                </span>
              </div>
              {renderSparkline('#f97316', getRatingPoints('bullet'))}
            </div>
          </div>

          {/* LeetCode-style Problem Solving Progress Widget (Down the Rating Section) */}
          <div className="bg-[#21201d] border border-[#2d2a26] rounded-2xl p-5 sm:p-6 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6">
            {/* Left: Circular / Arc Progress Gauge matching screenshot */}
            <div className="flex-1 flex justify-center w-full">
              {renderSolvedGauge()}
            </div>

            {/* Right: Stack of 3 Difficulty Stats (Easy, Med., Hard) */}
            <div className="flex flex-row sm:flex-col gap-2.5 w-full sm:w-56">
              {/* Easy */}
              <div className="flex-1 bg-[#262421] border border-white/5 rounded-xl px-4 py-3 flex flex-col justify-center shadow-sm hover:border-teal-500/30 transition">
                <div className="text-[#00b8a3] font-bold text-xs tracking-wide">Easy</div>
                <div className="text-white font-extrabold text-base sm:text-lg mt-0.5 flex items-baseline gap-1">
                  <span>{solvedStats.easy?.solved || 0}</span>
                  <span className="text-[#8c8b88] text-xs font-semibold">/{solvedStats.easy?.total || 195}</span>
                </div>
              </div>

              {/* Med. */}
              <div className="flex-1 bg-[#262421] border border-white/5 rounded-xl px-4 py-3 flex flex-col justify-center shadow-sm hover:border-yellow-500/30 transition">
                <div className="text-[#ffc01e] font-bold text-xs tracking-wide">Med.</div>
                <div className="text-white font-extrabold text-base sm:text-lg mt-0.5 flex items-baseline gap-1">
                  <span>{solvedStats.medium?.solved || 0}</span>
                  <span className="text-[#8c8b88] text-xs font-semibold">/{solvedStats.medium?.total || 138}</span>
                </div>
              </div>

              {/* Hard */}
              <div className="flex-1 bg-[#262421] border border-white/5 rounded-xl px-4 py-3 flex flex-col justify-center shadow-sm hover:border-red-500/30 transition">
                <div className="text-[#ff375f] font-bold text-xs tracking-wide">Hard</div>
                <div className="text-white font-extrabold text-base sm:text-lg mt-0.5 flex items-baseline gap-1">
                  <span>{solvedStats.hard?.solved || 0}</span>
                  <span className="text-[#8c8b88] text-xs font-semibold">/{solvedStats.hard?.total || 42}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Tab Navigation Menu (Overview, Battle Challenge History, Solved Problems, Clubs) */}
          <div className="flex items-center gap-6 sm:gap-8 border-b border-[#2d2a26] text-sm font-semibold overflow-x-auto scrollbar-none">
            <button
              onClick={() => setActiveTab('overview')}
              className={`pb-3 transition relative cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'overview'
                  ? 'text-white font-bold'
                  : 'text-[#8c8b88] hover:text-white'
              }`}
            >
              <span>Overview</span>
              {activeTab === 'overview' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#81b64c] rounded-full"></div>
              )}
            </button>

            <button
              onClick={() => setActiveTab('battles')}
              className={`pb-3 transition relative cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'battles'
                  ? 'text-white font-bold'
                  : 'text-[#8c8b88] hover:text-white'
              }`}
            >
              <span>Battle Challenge History</span>
              <span className="text-[10px] bg-[#2b2926] text-amber-400 px-2 py-0.5 rounded-full border border-white/5 font-bold">
                {matchHistory.length}
              </span>
              {activeTab === 'battles' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#81b64c] rounded-full"></div>
              )}
            </button>

            <button
              onClick={() => setActiveTab('solved')}
              className={`pb-3 transition relative cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'solved'
                  ? 'text-white font-bold'
                  : 'text-[#8c8b88] hover:text-white'
              }`}
            >
              <span>Solved Problems</span>
              <span className="text-[10px] bg-[#2b2926] text-emerald-400 px-2 py-0.5 rounded-full border border-white/5 font-bold">
                {solvedStats.totalSolved || 0}
              </span>
              {activeTab === 'solved' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#81b64c] rounded-full"></div>
              )}
            </button>

            <button
              onClick={() => setActiveTab('friends')}
              className={`pb-3 transition relative cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'friends'
                  ? 'text-white font-bold'
                  : 'text-[#8c8b88] hover:text-white'
              }`}
            >
              <span>Freind</span>
              <span className="text-[10px] bg-[#2b2926] text-blue-400 px-2 py-0.5 rounded-full border border-white/5 font-bold">
                {profileFriends.length}
              </span>
              {activeTab === 'friends' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#81b64c] rounded-full"></div>
              )}
            </button>

            <button
              onClick={() => setActiveTab('clubs')}
              className={`pb-3 transition relative cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'clubs'
                  ? 'text-white font-bold'
                  : 'text-[#8c8b88] hover:text-white'
              }`}
            >
              <span>Clubs</span>
              <span className="text-[10px] bg-[#2b2926] text-[#81b64c] px-2 py-0.5 rounded-full border border-white/5 font-bold">
                {user.clubs?.length || 0}
              </span>
              {activeTab === 'clubs' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#81b64c] rounded-full"></div>
              )}
            </button>
          </div>

          {/* TAB CONTENT */}
          {activeTab === 'overview' ? (
            <>
              {/* Recently Solved Challenges Card */}
              <div className="bg-[#21201d] border border-[#2d2a26] rounded-2xl overflow-hidden shadow-xl">
                <div className="p-4 sm:p-5 border-b border-[#2d2a26] flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
                      <span>Recently Solved</span>
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                        ✓ {solvedStats.totalSolved} Solved
                      </span>
                    </h2>
                    <p className="text-xs text-[#8c8b88] mt-0.5">
                      Problems conquered in Training Ground and Arena Matches.
                    </p>
                  </div>

                  {recentSolved.length > 0 && (
                    <Link 
                      to="/training" 
                      className="text-xs font-bold text-[#81b64c] hover:text-[#92c55b] transition flex items-center gap-1"
                    >
                      <span>Explore Problem Set ({solvedStats.totalProblems})</span>
                      <span>→</span>
                    </Link>
                  )}
                </div>

                {recentSolved.length === 0 ? (
                  <div className="py-12 px-4 text-center text-[#7d7c78] text-sm flex flex-col items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-[#262421] border border-white/5 flex items-center justify-center text-2xl mb-3">
                      🎯
                    </div>
                    <p className="font-bold text-white mb-1">No problems solved yet</p>
                    <p className="text-xs text-[#7d7c78] max-w-xs mb-4">
                      {isOwnProfile
                        ? 'Jump into the Training Ground to solve canonical LeetCode challenges and build your problem solving record.'
                        : `@${user.username} has not solved any problems yet.`}
                    </p>
                    {isOwnProfile && (
                      <Link 
                        to="/training" 
                        className="bg-[#81b64c] hover:bg-[#92c55b] text-white text-xs font-bold px-5 py-2.5 rounded-xl transition shadow-md flex items-center gap-1.5"
                      >
                        <span>Solve Your First Challenge</span>
                        <span>→</span>
                      </Link>
                    )}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs sm:text-sm">
                      <thead>
                        <tr className="border-b border-[#2d2a26] text-[#7d7c78] uppercase text-[11px] tracking-wider bg-[#1c1b18]/50">
                          <th className="py-3 px-4">Problem</th>
                          <th className="py-3 px-4">Difficulty</th>
                          <th className="py-3 px-4">Language</th>
                          <th className="py-3 px-4">Runtime</th>
                          <th className="py-3 px-4 text-right">Solved</th>
                          <th className="py-3 px-4 text-right">Solution</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#262421]">
                        {recentSolved.slice(0, 5).map((p, idx) => (
                          <tr key={p.slug || idx} className="hover:bg-[#262421]/60 transition group">
                            {/* Problem Title & Link */}
                            <td className="py-3.5 px-4 font-semibold text-white">
                              <Link 
                                to={`/problem/${p.slug}`}
                                className="hover:text-[#81b64c] transition flex items-center gap-1.5"
                              >
                                <span className="text-[#81b64c]">✓</span>
                                <span>{p.title}</span>
                              </Link>
                              <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                                {p.tags?.slice(0, 3).map(tag => (
                                  <span key={tag} className="text-[10px] bg-[#2b2926] text-[#8c8b88] px-1.5 py-0.5 rounded font-mono">
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            </td>

                            {/* Difficulty */}
                            <td className="py-3.5 px-4">
                              <span className={`px-2 py-0.5 rounded-md text-xs font-bold inline-block ${
                                p.difficulty?.toLowerCase() === 'easy' ? 'text-teal-400 bg-teal-400/10 border border-teal-400/20' :
                                p.difficulty?.toLowerCase() === 'medium' ? 'text-amber-400 bg-amber-400/10 border border-amber-400/20' :
                                'text-rose-500 bg-rose-500/10 border border-rose-500/20'
                              }`}>
                                {p.difficulty === 'Medium' ? 'Med.' : p.difficulty}
                              </span>
                            </td>

                            {/* Language */}
                            <td className="py-3.5 px-4 font-mono text-xs text-[#c3c2bf]">
                              <span className="px-2 py-0.5 rounded bg-[#2b2926] border border-white/5">
                                {p.language === 'cpp' ? 'C++20' : p.language === 'python' ? 'Python 3' : p.language || 'C++'}
                              </span>
                            </td>

                            {/* Runtime */}
                            <td className="py-3.5 px-4 text-xs text-[#8c8b88]">
                              <span>{p.runtime ? `${p.runtime} ms` : '40 ms'}</span>
                              <span className="mx-1">•</span>
                              <span>{p.memory ? `${p.memory} MB` : '14 MB'}</span>
                            </td>

                            {/* Solved Time */}
                            <td className="py-3.5 px-4 text-right text-xs text-[#8c8b88] whitespace-nowrap">
                              {formatRelativeTime(p.solvedAt)}
                            </td>

                            {/* Action Button: View Solution Code */}
                            <td className="py-3.5 px-4 text-right">
                              {p.code ? (
                                <button
                                  onClick={() => setSelectedSolvedCode(p)}
                                  className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white/5 hover:bg-white/10 text-[#8c8b88] hover:text-white border border-white/10 transition cursor-pointer"
                                >
                                  View Code
                                </button>
                              ) : (
                                <Link
                                  to={`/problem/${p.slug}`}
                                  className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#81b64c]/10 text-[#81b64c] hover:bg-[#81b64c]/20 border border-[#81b64c]/20 transition"
                                >
                                  Practice
                                </Link>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Battle Challenge History Section */}
              <div id="battle-history" className="bg-[#21201d] border border-[#2d2a26] rounded-2xl overflow-hidden shadow-xl scroll-mt-24">
                <div className="p-4 sm:p-5 border-b border-[#2d2a26] flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
                      <span>⚔️ Battle Challenge History</span>
                      <span className="text-xs font-normal text-[#8c8b88]">
                        ({matchHistory.length})
                      </span>
                    </h2>
                    <p className="text-xs text-[#8c8b88] mt-0.5">
                      Head-to-head algorithm duels fought in the arena.
                    </p>
                  </div>
                  {matchHistory.length > 0 && (
                    <button 
                      onClick={() => setActiveTab('battles')}
                      className="text-xs font-bold text-[#81b64c] hover:text-[#92c55b] transition flex items-center gap-1 cursor-pointer"
                    >
                      <span>View All Battles ({matchHistory.length})</span>
                      <span>→</span>
                    </button>
                  )}
                </div>

              {/* Game History Table or Empty State */}
              {matchHistory.length === 0 ? (
                <div className="py-12 px-4 text-center text-[#7d7c78] text-sm flex flex-col items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-[#262421] border border-white/5 flex items-center justify-center text-2xl mb-3">
                    ⚔️
                  </div>
                  <p className="font-bold text-white mb-1">No completed matches yet</p>
                  <p className="text-xs text-[#7d7c78] max-w-xs mb-4">
                    Queue up for Quick Pairing or complete your first DSA challenge to build your real match record.
                  </p>
                  <Link to="/" className="bg-[#81b64c] hover:bg-[#92c55b] text-white text-xs font-bold px-5 py-2.5 rounded-xl transition shadow-md">
                    Challenge Your First Match
                  </Link>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead>
                      <tr className="border-b border-[#2d2a26] text-[#7d7c78] uppercase text-[11px] tracking-wider">
                        <th className="py-3 px-4">Mode</th>
                        <th className="py-3 px-4">Players</th>
                        <th className="py-3 px-4 text-center">Result</th>
                        <th className="py-3 px-4 text-center">Solution</th>
                        <th className="py-3 px-4 text-right">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#262421]">
                      {matchHistory.slice(0, 5).map((m) => (
                        <tr key={m.id} className="hover:bg-[#262421]/60 transition">
                          {/* Mode Column */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <div className="flex flex-col">
                              <span className="text-white font-bold flex items-center gap-1">
                                <span>⚡</span>
                                <span>{m.mode}</span>
                              </span>
                              <span className="text-[11px] text-[#7d7c78]">{m.timeControl}</span>
                            </div>
                          </td>

                          {/* Players Column (Opponent vs User) */}
                          <td className="py-3.5 px-4">
                            <div className="flex flex-col gap-1">
                              {/* Opponent */}
                              <div className="flex items-center gap-2">
                                <span className="w-4 h-4 rounded bg-[#363431] text-[10px] font-bold text-white/70 flex items-center justify-center">
                                  {m.opponent.avatar || 'O'}
                                </span>
                                <span className="text-[#c3c2bf] font-medium">
                                  {m.opponent.username}
                                </span>
                                {(m.isRated === false || ['bot', 'stockfish', 'computer', 'algo_expert', 'deep_recursion', 'matrix_solver', 'ai_'].some(k => m.opponent.username?.toLowerCase().includes(k))) && (
                                  <span className="text-[9px] bg-white/10 text-white/60 px-1 py-0.2 rounded font-mono uppercase">
                                    BOT
                                  </span>
                                )}
                                <span className="text-[#7d7c78] text-xs">
                                  ({m.opponent.rating})
                                </span>
                                <span>{m.opponent.flag}</span>
                              </div>

                              {/* Current User */}
                              <div className="flex items-center gap-2">
                                <span className="w-4 h-4 rounded bg-[#81b64c] text-[10px] font-bold text-white flex items-center justify-center">
                                  {user.username.charAt(0).toUpperCase()}
                                </span>
                                <span className="text-white font-bold">
                                  {user.username}
                                </span>
                                <span className="text-[#7d7c78] text-xs">
                                  ({user.ratings?.blitz ?? 1500})
                                </span>
                                {user.countryFlag && <span>{user.countryFlag}</span>}
                              </div>
                            </div>
                          </td>

                          {/* Result Column (1 / 0 / 1/2) */}
                          <td className="py-3.5 px-4 text-center whitespace-nowrap">
                            <div className="inline-flex items-center gap-1.5 font-bold">
                              <div className="flex flex-col text-xs leading-none">
                                <span className="text-[#9e9d9a]">{m.opponentResult}</span>
                                <span className="text-white font-extrabold">{m.userResult}</span>
                              </div>
                              {m.resultType === 'win' ? (
                                <span className="w-4 h-4 rounded bg-[#81b64c] text-white text-[10px] font-bold flex items-center justify-center">
                                  +
                                </span>
                              ) : m.resultType === 'loss' ? (
                                <span className="w-4 h-4 rounded bg-danger text-white text-[10px] font-bold flex items-center justify-center">
                                  -
                                </span>
                              ) : (
                                <span className="w-4 h-4 rounded bg-white/20 text-white text-[10px] font-bold flex items-center justify-center">
                                  =
                                </span>
                              )}
                              {m.isRated === false || m.ratingChange === '+0' || m.ratingChange === '0' ? (
                                <span className="text-[10px] bg-blue-500/15 text-blue-400 border border-blue-500/30 px-1.5 py-0.5 rounded font-mono">
                                  Casual
                                </span>
                              ) : null}
                            </div>
                          </td>

                          {/* Solution Action: View Code */}
                          <td className="py-3.5 px-4 text-center whitespace-nowrap">
                            <button 
                              type="button"
                              onClick={() => setSelectedSolvedCode({
                                title: m.problemTitle || m.title || 'Two Sum',
                                slug: m.slug || (m.problemTitle ? m.problemTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') : 'two-sum'),
                                difficulty: m.difficulty || 'Easy',
                                code: m.code || `// Solution for ${m.problemTitle || 'Challenge'}\n#include <vector>\n#include <unordered_map>\n\nclass Solution {\npublic:\n    std::vector<int> twoSum(std::vector<int>& nums, int target) {\n        std::unordered_map<int, int> mp;\n        for (int i = 0; i < nums.size(); ++i) {\n            int comp = target - nums[i];\n            if (mp.count(comp)) return {mp[comp], i};\n            mp[nums[i]] = i;\n        }\n        return {};\n    }\n};`,
                                language: m.language || 'cpp',
                                runtime: m.runtime || 40,
                                memory: m.memory || 14.2,
                                solvedAt: m.date || new Date().toISOString(),
                                isBattle: true,
                                mode: m.mode
                              })}
                              className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white/5 hover:bg-white/10 text-[#8c8b88] hover:text-white border border-white/10 transition cursor-pointer"
                            >
                              View Code
                            </button>
                          </td>

                          {/* Date */}
                          <td className="py-3.5 px-4 text-right text-xs text-[#7d7c78] whitespace-nowrap">
                            {m.date}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
          ) : activeTab === 'battles' ? (
            /* Battle Challenge History Dedicated Full Section */
            <div id="battle-history-full" className="bg-[#21201d] border border-[#2d2a26] rounded-2xl p-5 sm:p-6 shadow-xl flex flex-col gap-6 scroll-mt-24">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#2d2a26]">
                <div>
                  <h2 className="text-xl font-extrabold text-white flex items-center gap-2.5">
                    <span>⚔️ Battle Challenge History</span>
                    <span className="text-xs font-bold px-3 py-1 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30">
                      {matchHistory.length} Matches Completed
                    </span>
                  </h2>
                  <p className="text-xs text-[#8c8b88] mt-1">
                    Complete match history of DSA battles and rating duels played by @{user.username}.
                  </p>
                </div>

                {isOwnProfile ? (
                  <Link
                    to="/"
                    className="bg-[#81b64c] hover:bg-[#92c55b] text-white text-xs font-bold px-4 py-2.5 rounded-xl transition shadow flex items-center gap-1.5 self-start sm:self-auto"
                  >
                    <span>Play Next Battle</span>
                    <span>→</span>
                  </Link>
                ) : (
                  <button
                    onClick={() => handleChallengeUser(user.username, 'Blitz')}
                    className="bg-[#81b64c] hover:bg-[#92c55b] text-white text-xs font-bold px-4 py-2.5 rounded-xl transition shadow flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
                  >
                    <span>⚔️ Challenge Player</span>
                  </button>
                )}
              </div>

              {/* Match Stats Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-[#1b1917] border border-white/5 rounded-xl p-3.5 text-center">
                  <span className="text-[11px] text-[#8c8b88] uppercase font-bold block">Total Matches</span>
                  <span className="text-xl font-extrabold text-white mt-1 block">
                    {matchHistory.length}
                  </span>
                </div>
                <div className="bg-[#1b1917] border border-emerald-500/20 rounded-xl p-3.5 text-center">
                  <span className="text-[11px] text-emerald-400 uppercase font-bold block">Wins</span>
                  <span className="text-xl font-extrabold text-emerald-400 mt-1 block">
                    {matchHistory.filter(m => m.resultType === 'win').length}
                  </span>
                </div>
                <div className="bg-[#1b1917] border border-red-500/20 rounded-xl p-3.5 text-center">
                  <span className="text-[11px] text-rose-400 uppercase font-bold block">Losses</span>
                  <span className="text-xl font-extrabold text-rose-400 mt-1 block">
                    {matchHistory.filter(m => m.resultType === 'loss').length}
                  </span>
                </div>
                <div className="bg-[#1b1917] border border-white/10 rounded-xl p-3.5 text-center">
                  <span className="text-[11px] text-[#8c8b88] uppercase font-bold block">Draws</span>
                  <span className="text-xl font-extrabold text-white mt-1 block">
                    {matchHistory.filter(m => m.resultType === 'draw').length}
                  </span>
                </div>
              </div>

              {/* Mode & Result Filters */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                {/* Mode Filter */}
                <div className="flex items-center gap-1.5 overflow-x-auto">
                  <span className="text-xs text-[#8c8b88] font-bold mr-1">Mode:</span>
                  {['all', 'rapid', 'blitz', 'bullet'].map(m => (
                    <button
                      key={m}
                      onClick={() => setBattleModeFilter(m)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition capitalize cursor-pointer whitespace-nowrap ${
                        battleModeFilter === m
                          ? 'bg-[#81b64c] text-white'
                          : 'bg-[#1b1917] text-[#8c8b88] hover:text-white border border-[#2d2a26]'
                      }`}
                    >
                      {m === 'all' ? 'All Modes' : m}
                    </button>
                  ))}
                </div>

                {/* Result Filter */}
                <div className="flex items-center gap-1.5 overflow-x-auto">
                  <span className="text-xs text-[#8c8b88] font-bold mr-1">Result:</span>
                  {['all', 'win', 'loss', 'draw'].map(r => (
                    <button
                      key={r}
                      onClick={() => setBattleResultFilter(r)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition capitalize cursor-pointer whitespace-nowrap ${
                        battleResultFilter === r
                          ? 'bg-[#81b64c] text-white'
                          : 'bg-[#1b1917] text-[#8c8b88] hover:text-white border border-[#2d2a26]'
                      }`}
                    >
                      {r === 'all' ? 'All Results' : r === 'win' ? 'Wins' : r === 'loss' ? 'Losses' : 'Draws'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Full Matches Table */}
              {matchHistory.filter(m => {
                const matchMode = battleModeFilter === 'all' || m.mode?.toLowerCase() === battleModeFilter.toLowerCase();
                const matchResult = battleResultFilter === 'all' || m.resultType?.toLowerCase() === battleResultFilter.toLowerCase();
                return matchMode && matchResult;
              }).length === 0 ? (
                <div className="py-12 px-4 text-center text-[#7d7c78] text-sm flex flex-col items-center justify-center bg-[#1b1917] rounded-xl border border-[#2d2a26]">
                  <div className="w-12 h-12 rounded-full bg-[#262421] border border-white/5 flex items-center justify-center text-2xl mb-3">
                    ⚔️
                  </div>
                  <p className="font-bold text-white mb-1">No Matches Found</p>
                  <p className="text-xs text-[#7d7c78] max-w-xs mb-4">
                    {matchHistory.length === 0 
                      ? "No completed battle matches recorded yet." 
                      : "No matches correspond to the selected filters."}
                  </p>
                  {(battleModeFilter !== 'all' || battleResultFilter !== 'all') && (
                    <button
                      onClick={() => { setBattleModeFilter('all'); setBattleResultFilter('all'); }}
                      className="text-xs font-bold text-[#81b64c] hover:underline"
                    >
                      Reset Filters
                    </button>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto border border-[#2d2a26] rounded-xl bg-[#1b1917]">
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead>
                      <tr className="border-b border-[#2d2a26] text-[#7d7c78] uppercase text-[11px] tracking-wider bg-[#161512]/60">
                        <th className="py-3 px-4">Mode</th>
                        <th className="py-3 px-4">Players</th>
                        <th className="py-3 px-4 text-center">Score / Delta</th>
                        <th className="py-3 px-4 text-center">Solution</th>
                        <th className="py-3 px-4 text-right">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#262421]">
                      {matchHistory.filter(m => {
                        const matchMode = battleModeFilter === 'all' || m.mode?.toLowerCase() === battleModeFilter.toLowerCase();
                        const matchResult = battleResultFilter === 'all' || m.resultType?.toLowerCase() === battleResultFilter.toLowerCase();
                        return matchMode && matchResult;
                      }).map((m) => (
                        <tr key={m.id} className="hover:bg-[#262421]/60 transition">
                          {/* Mode Column */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <div className="flex flex-col">
                              <span className="text-white font-bold flex items-center gap-1">
                                <span>{m.mode?.toLowerCase() === 'rapid' ? '⏱️' : m.mode?.toLowerCase() === 'bullet' ? '🚀' : '⚡'}</span>
                                <span>{m.mode}</span>
                              </span>
                              <span className="text-[11px] text-[#7d7c78]">{m.timeControl}</span>
                            </div>
                          </td>

                          {/* Players Column (Opponent vs User) */}
                          <td className="py-3.5 px-4">
                            <div className="flex flex-col gap-1">
                              {/* Opponent */}
                              <div className="flex items-center gap-2">
                                <span className="w-4 h-4 rounded bg-[#363431] text-[10px] font-bold text-white/70 flex items-center justify-center">
                                  {m.opponent.avatar || 'O'}
                                </span>
                                <span className="text-[#c3c2bf] font-medium">
                                  {m.opponent.username}
                                </span>
                                {(m.isRated === false || ['bot', 'stockfish', 'computer', 'algo_expert', 'deep_recursion', 'matrix_solver', 'ai_'].some(k => m.opponent.username?.toLowerCase().includes(k))) && (
                                  <span className="text-[9px] bg-white/10 text-white/60 px-1 py-0.2 rounded font-mono uppercase">
                                    BOT
                                  </span>
                                )}
                                <span className="text-[#7d7c78] text-xs">
                                  ({m.opponent.rating})
                                </span>
                                <span>{m.opponent.flag}</span>
                              </div>

                              {/* Current User */}
                              <div className="flex items-center gap-2">
                                <span className="w-4 h-4 rounded bg-[#81b64c] text-[10px] font-bold text-white flex items-center justify-center">
                                  {user.username.charAt(0).toUpperCase()}
                                </span>
                                <span className="text-white font-bold">
                                  {user.username}
                                </span>
                                <span className="text-[#7d7c78] text-xs">
                                  ({user.ratings?.blitz ?? 1500})
                                </span>
                                {user.countryFlag && <span>{user.countryFlag}</span>}
                              </div>
                            </div>
                          </td>

                          {/* Result Column (1 / 0 / 1/2) */}
                          <td className="py-3.5 px-4 text-center whitespace-nowrap">
                            <div className="inline-flex items-center gap-2 font-bold">
                              <div className="flex flex-col text-xs leading-none">
                                <span className="text-[#9e9d9a]">{m.opponentResult}</span>
                                <span className="text-white font-extrabold">{m.userResult}</span>
                              </div>
                              {m.resultType === 'win' ? (
                                <span className="px-2 py-0.5 rounded bg-[#81b64c]/20 text-[#81b64c] border border-[#81b64c]/30 text-xs font-bold flex items-center gap-0.5">
                                  <span>+Win</span>
                                </span>
                              ) : m.resultType === 'loss' ? (
                                <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-bold flex items-center gap-0.5">
                                  <span>-Loss</span>
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded bg-white/10 text-white/70 border border-white/20 text-xs font-bold flex items-center gap-0.5">
                                  <span>=Draw</span>
                                </span>
                              )}
                              {m.isRated === false || m.ratingChange === '+0' || m.ratingChange === '0' ? (
                                <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-blue-500/15 text-blue-400 border border-blue-500/30">
                                  Unrated (Bot)
                                </span>
                              ) : (
                                <span className={`text-xs font-bold ${m.ratingChange?.startsWith('+') ? 'text-[#81b64c]' : 'text-rose-400'}`}>
                                  {m.ratingChange}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Solution Action: View Code */}
                          <td className="py-3.5 px-4 text-center whitespace-nowrap">
                            <button 
                              type="button"
                              onClick={() => setSelectedSolvedCode({
                                title: m.problemTitle || m.title || 'Two Sum',
                                slug: m.slug || (m.problemTitle ? m.problemTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') : 'two-sum'),
                                difficulty: m.difficulty || 'Easy',
                                code: m.code || `// Solution for ${m.problemTitle || 'Challenge'}\n#include <vector>\n#include <unordered_map>\n\nclass Solution {\npublic:\n    std::vector<int> twoSum(std::vector<int>& nums, int target) {\n        std::unordered_map<int, int> mp;\n        for (int i = 0; i < nums.size(); ++i) {\n            int comp = target - nums[i];\n            if (mp.count(comp)) return {mp[comp], i};\n            mp[nums[i]] = i;\n        }\n        return {};\n    }\n};`,
                                language: m.language || 'cpp',
                                runtime: m.runtime || 40,
                                memory: m.memory || 14.2,
                                solvedAt: m.date || new Date().toISOString(),
                                isBattle: true,
                                mode: m.mode
                              })}
                              className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white/5 hover:bg-white/10 text-[#8c8b88] hover:text-white border border-white/10 transition cursor-pointer"
                            >
                              View Code
                            </button>
                          </td>

                          {/* Date */}
                          <td className="py-3.5 px-4 text-right text-xs text-[#7d7c78] whitespace-nowrap">
                            {m.date}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : activeTab === 'solved' ? (
            /* Solved Problems Dedicated Full Section */
            <div className="bg-[#21201d] border border-[#2d2a26] rounded-2xl p-5 sm:p-6 shadow-xl flex flex-col gap-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#2d2a26]">
                <div>
                  <h2 className="text-xl font-extrabold text-white flex items-center gap-2.5">
                    <span>🏆 Solved Challenges</span>
                    <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                      {solvedStats.totalSolved} / {solvedStats.totalProblems} Completed
                    </span>
                  </h2>
                  <p className="text-xs text-[#8c8b88] mt-1">
                    Complete list of algorithmic problems solved by @{user.username} across all categories.
                  </p>
                </div>

                <Link
                  to="/training"
                  className="bg-[#81b64c] hover:bg-[#92c55b] text-white text-xs font-bold px-4 py-2.5 rounded-xl transition shadow flex items-center gap-1.5 self-start sm:self-auto"
                >
                  <span>Practice More</span>
                  <span>→</span>
                </Link>
              </div>

              {/* Progress Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-[#1b1917] border border-teal-500/20 rounded-xl p-4 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#00b8a3] uppercase tracking-wider">Easy</span>
                    <span className="text-xs text-[#8c8b88]">
                      {Math.round(((solvedStats.easy?.solved || 0) / (solvedStats.easy?.total || 1)) * 100)}%
                    </span>
                  </div>
                  <div className="text-2xl font-extrabold text-white my-1">
                    {solvedStats.easy?.solved || 0}
                    <span className="text-xs text-[#8c8b88] font-normal"> / {solvedStats.easy?.total || 195}</span>
                  </div>
                  <div className="h-1.5 w-full bg-[#262421] rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-[#00b8a3] rounded-full transition-all"
                      style={{ width: `${Math.min(100, ((solvedStats.easy?.solved || 0) / (solvedStats.easy?.total || 1)) * 100)}%` }}
                    />
                  </div>
                </div>

                <div className="bg-[#1b1917] border border-amber-500/20 rounded-xl p-4 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#ffc01e] uppercase tracking-wider">Medium</span>
                    <span className="text-xs text-[#8c8b88]">
                      {Math.round(((solvedStats.medium?.solved || 0) / (solvedStats.medium?.total || 1)) * 100)}%
                    </span>
                  </div>
                  <div className="text-2xl font-extrabold text-white my-1">
                    {solvedStats.medium?.solved || 0}
                    <span className="text-xs text-[#8c8b88] font-normal"> / {solvedStats.medium?.total || 138}</span>
                  </div>
                  <div className="h-1.5 w-full bg-[#262421] rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-[#ffc01e] rounded-full transition-all"
                      style={{ width: `${Math.min(100, ((solvedStats.medium?.solved || 0) / (solvedStats.medium?.total || 1)) * 100)}%` }}
                    />
                  </div>
                </div>

                <div className="bg-[#1b1917] border border-red-500/20 rounded-xl p-4 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#ff375f] uppercase tracking-wider">Hard</span>
                    <span className="text-xs text-[#8c8b88]">
                      {Math.round(((solvedStats.hard?.solved || 0) / (solvedStats.hard?.total || 1)) * 100)}%
                    </span>
                  </div>
                  <div className="text-2xl font-extrabold text-white my-1">
                    {solvedStats.hard?.solved || 0}
                    <span className="text-xs text-[#8c8b88] font-normal"> / {solvedStats.hard?.total || 42}</span>
                  </div>
                  <div className="h-1.5 w-full bg-[#262421] rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-[#ff375f] rounded-full transition-all"
                      style={{ width: `${Math.min(100, ((solvedStats.hard?.solved || 0) / (solvedStats.hard?.total || 1)) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Search & Filter Bar */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                <div className="relative w-full sm:w-80">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[#8c8b88]">🔍</span>
                  <input
                    type="text"
                    value={solvedSearch}
                    onChange={(e) => setSolvedSearch(e.target.value)}
                    placeholder="Filter by title or tag..."
                    className="w-full bg-[#1b1917] border border-[#2d2a26] rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-[#8c8b88] focus:outline-none focus:border-[#81b64c]"
                  />
                  {solvedSearch && (
                    <button
                      onClick={() => setSolvedSearch('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#8c8b88] hover:text-white"
                    >
                      ✕
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
                  {['all', 'easy', 'medium', 'hard'].map(f => (
                    <button
                      key={f}
                      onClick={() => setSolvedDiffFilter(f)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition capitalize cursor-pointer whitespace-nowrap ${
                        solvedDiffFilter === f
                          ? 'bg-[#81b64c] text-white'
                          : 'bg-[#1b1917] text-[#8c8b88] hover:text-white border border-[#2d2a26]'
                      }`}
                    >
                      {f === 'all' ? `All (${allSolvedProblems.length})` : f}
                    </button>
                  ))}
                </div>
              </div>

              {/* Table of Solved Problems */}
              {allSolvedProblems.filter(p => {
                const matchSearch = !solvedSearch || 
                  p.title?.toLowerCase().includes(solvedSearch.toLowerCase()) ||
                  p.tags?.some(t => t.toLowerCase().includes(solvedSearch.toLowerCase()));
                const matchDiff = solvedDiffFilter === 'all' || 
                  p.difficulty?.toLowerCase() === solvedDiffFilter.toLowerCase();
                return matchSearch && matchDiff;
              }).length === 0 ? (
                <div className="py-12 text-center text-[#8c8b88] bg-[#1b1917] rounded-xl border border-[#2d2a26]">
                  <span className="text-3xl mb-2 block">🎯</span>
                  <p className="font-bold text-white mb-1">No Solved Problems Found</p>
                  <p className="text-xs mb-3">
                    {allSolvedProblems.length === 0 
                      ? "User hasn't solved any problems yet." 
                      : "No problems match your current search or difficulty filter."}
                  </p>
                  {solvedSearch && (
                    <button
                      onClick={() => { setSolvedSearch(''); setSolvedDiffFilter('all'); }}
                      className="text-xs font-bold text-[#81b64c] hover:underline"
                    >
                      Clear Filters
                    </button>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto border border-[#2d2a26] rounded-xl bg-[#1b1917]">
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead>
                      <tr className="border-b border-[#2d2a26] text-[#7d7c78] uppercase text-[11px] tracking-wider bg-[#161512]/60">
                        <th className="py-3 px-4 w-12">#</th>
                        <th className="py-3 px-4">Title</th>
                        <th className="py-3 px-4">Difficulty</th>
                        <th className="py-3 px-4">Language</th>
                        <th className="py-3 px-4">Runtime / Mem</th>
                        <th className="py-3 px-4 text-right">Solved</th>
                        <th className="py-3 px-4 text-right">Solution</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#262421]">
                      {allSolvedProblems.filter(p => {
                        const matchSearch = !solvedSearch || 
                          p.title?.toLowerCase().includes(solvedSearch.toLowerCase()) ||
                          p.tags?.some(t => t.toLowerCase().includes(solvedSearch.toLowerCase()));
                        const matchDiff = solvedDiffFilter === 'all' || 
                          p.difficulty?.toLowerCase() === solvedDiffFilter.toLowerCase();
                        return matchSearch && matchDiff;
                      }).map((p, idx) => (
                        <tr key={p.slug || idx} className="hover:bg-[#262421]/60 transition group">
                          <td className="py-3.5 px-4 text-[#8c8b88] font-mono text-xs">
                            {idx + 1}
                          </td>
                          <td className="py-3.5 px-4 font-semibold text-white">
                            <Link 
                              to={`/problem/${p.slug}`}
                              className="hover:text-[#81b64c] transition flex items-center gap-1.5"
                            >
                              <span className="text-[#81b64c]">✓</span>
                              <span>{p.title}</span>
                            </Link>
                            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                              {p.tags?.slice(0, 3).map(tag => (
                                <span key={tag} className="text-[10px] bg-[#262421] text-[#8c8b88] px-1.5 py-0.5 rounded font-mono border border-white/5">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className={`px-2 py-0.5 rounded-md text-xs font-bold inline-block ${
                              p.difficulty?.toLowerCase() === 'easy' ? 'text-teal-400 bg-teal-400/10 border border-teal-400/20' :
                              p.difficulty?.toLowerCase() === 'medium' ? 'text-amber-400 bg-amber-400/10 border border-amber-400/20' :
                              'text-rose-500 bg-rose-500/10 border border-rose-500/20'
                            }`}>
                              {p.difficulty === 'Medium' ? 'Med.' : p.difficulty}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-mono text-xs text-[#c3c2bf]">
                            <span className="px-2 py-0.5 rounded bg-[#262421] border border-white/5">
                              {p.language === 'cpp' ? 'C++20' : p.language === 'python' ? 'Python 3' : p.language || 'C++'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-xs text-[#8c8b88]">
                            <span>{p.runtime ? `${p.runtime} ms` : '40 ms'}</span>
                            <span className="mx-1">•</span>
                            <span>{p.memory ? `${p.memory} MB` : '14 MB'}</span>
                          </td>
                          <td className="py-3.5 px-4 text-right text-xs text-[#8c8b88] whitespace-nowrap">
                            {formatRelativeTime(p.solvedAt)}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            {p.code ? (
                              <button
                                onClick={() => setSelectedSolvedCode(p)}
                                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#81b64c]/15 text-[#81b64c] hover:bg-[#81b64c]/25 border border-[#81b64c]/30 transition cursor-pointer"
                              >
                                View Code
                              </button>
                            ) : (
                              <Link
                                to={`/problem/${p.slug}`}
                                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/5 hover:bg-white/10 text-[#8c8b88] hover:text-white border border-white/10 transition"
                              >
                                Solve
                              </Link>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : activeTab === 'friends' ? (
            /* Friends Dedicated Full Section */
            <div className="bg-[#21201d] border border-[#2d2a26] rounded-2xl p-5 sm:p-6 shadow-xl flex flex-col gap-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#2d2a26]">
                <div>
                  <h2 className="text-xl font-extrabold text-white flex items-center gap-2.5">
                    <span>👥 {isOwnProfile ? 'My Friends' : `@${user.username}'s Friends`}</span>
                    <span className="text-xs font-bold px-3 py-1 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/30">
                      {profileFriends.length} Friends
                    </span>
                    {profileFriends.some(f => f.isOnline) && (
                      <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                        <span>{profileFriends.filter(f => f.isOnline).length} Online Now</span>
                      </span>
                    )}
                  </h2>
                  <p className="text-xs text-[#8c8b88] mt-1">
                    {isOwnProfile
                      ? 'Challenge your friends to a live 1v1 battle or view their ratings and statistics.'
                      : `Users connected as friends with @${user.username}. You can challenge them to a live duel!`}
                  </p>
                </div>

                {/* Friend Search Input */}
                <div className="relative w-full sm:w-64">
                  <input
                    type="text"
                    value={profileFriendSearch}
                    onChange={(e) => setProfileFriendSearch(e.target.value)}
                    placeholder="Search friends..."
                    className="w-full bg-[#1b1917] border border-[#2d2a26] focus:border-[#81b64c] text-white text-xs px-3.5 py-2.5 rounded-xl pl-9 placeholder-[#7d7c78] focus:outline-none transition"
                  />
                  <span className="absolute left-3 top-2.5 text-xs text-[#7d7c78]">🔍</span>
                  {profileFriendSearch && (
                    <button
                      onClick={() => setProfileFriendSearch('')}
                      className="absolute right-3 top-2.5 text-xs text-[#7d7c78] hover:text-white"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              {/* Friends Content */}
              {loadingProfileFriends ? (
                <div className="flex items-center justify-center py-16 gap-3 text-[#8c8b88]">
                  <div className="w-6 h-6 border-2 border-[#81b64c]/30 border-t-[#81b64c] rounded-full animate-spin"></div>
                  <span>Loading friends...</span>
                </div>
              ) : filteredProfileFriends.length === 0 ? (
                <div className="text-center py-12 text-[#8c8b88] flex flex-col items-center gap-3">
                  <span className="text-4xl">👥</span>
                  <p className="font-bold text-white">
                    {profileFriendSearch ? `No friends match "${profileFriendSearch}"` : 'No Friends Yet'}
                  </p>
                  <p className="text-xs max-w-sm">
                    {profileFriendSearch
                      ? 'Try another search keyword.'
                      : isOwnProfile
                      ? 'Connect with players in the community to battle together and track standings.'
                      : `@${user.username} hasn't added any friends yet.`}
                  </p>
                  {isOwnProfile && !profileFriendSearch && (
                    <Link
                      to="/community"
                      className="mt-2 bg-[#81b64c] hover:bg-[#92c55b] text-white text-xs font-bold px-4 py-2 rounded-xl transition shadow"
                    >
                      Explore Community
                    </Link>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredProfileFriends.map(friend => {
                    const isSelf = authUser && (friend.username === authUser.username || friend._id === authUser._id);

                    return (
                      <div
                        key={friend._id || friend.username}
                        className="bg-[#1b1917] border border-[#2d2a26] hover:border-[#81b64c]/40 rounded-2xl p-4 transition duration-200 shadow-md flex flex-col justify-between gap-4 group"
                      >
                        {/* Top: Avatar, Online Status, Username */}
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
                            {/* Online status indicator */}
                            {(() => {
                              const isFriendLive = isSelf || (typeof isUserOnline === 'function' ? isUserOnline(friend.username) : friend.isOnline);
                              return (
                                <span
                                  title={isFriendLive ? 'Online Now' : 'Offline'}
                                  className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-[#1b1917] transition-colors duration-200 ${
                                    isFriendLive
                                      ? 'bg-emerald-500 ring-2 ring-emerald-500/30'
                                      : 'bg-[#5c5a57]'
                                  }`}
                                />
                              );
                            })()}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <Link
                                to={`/${friend.username}`}
                                className="font-bold text-white hover:text-[#81b64c] transition truncate text-sm"
                              >
                                {friend.displayName || friend.username}
                              </Link>
                              {(() => {
                                const isFriendLive = isSelf || (typeof isUserOnline === 'function' ? isUserOnline(friend.username) : friend.isOnline);
                                return isFriendLive ? (
                                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 whitespace-nowrap">
                                    Online
                                  </span>
                                ) : (
                                  <span className="text-[10px] text-[#7d7c78] bg-white/5 px-1.5 py-0.5 rounded border border-white/5 whitespace-nowrap">
                                    Offline
                                  </span>
                                );
                              })()}
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-[#8c8b88] mt-0.5">
                              <span className="truncate">@{friend.username}</span>
                              <span>•</span>
                              <span>{friend.country || 'Global'}</span>
                            </div>
                          </div>
                        </div>

                        {/* Middle: Stats grid */}
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

                        {/* Bottom: Action buttons */}
                        <div className="flex items-center gap-2 pt-1">
                          <Link
                            to={`/${friend.username}`}
                            className="flex-1 text-center bg-[#2b2926] hover:bg-[#383531] text-[#c9c8c5] hover:text-white border border-white/10 text-xs font-semibold py-2 rounded-xl transition"
                          >
                            Profile
                          </Link>
                          {isSelf ? (
                            <span className="flex-1 text-center bg-white/5 text-[#7d7c78] text-xs font-semibold py-2 rounded-xl border border-white/5">
                              You
                            </span>
                          ) : (
                            <button
                              onClick={() => handleChallengeUser(friend.username, 'Blitz')}
                              className="flex-1 bg-[#81b64c] hover:bg-[#92c55b] text-white text-xs font-bold py-2 rounded-xl transition shadow flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                              <span>⚔️ Challenge</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            /* Clubs Management Section */
            <div className="bg-[#21201d] border border-[#2d2a26] rounded-2xl p-5 sm:p-6 shadow-xl flex flex-col gap-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#2d2a26]">
                <div>
                  <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
                    <span>🏛️ Coding Clubs</span>
                    <span className="text-xs font-normal text-[#8c8b88]">({user.clubs?.length || 0})</span>
                  </h2>
                  <p className="text-xs text-[#8c8b88] mt-0.5">Clubs you belong to or manage in the arena</p>
                </div>

                {isOwnProfile && (
                  <button
                    onClick={() => setShowCreateClubModal(true)}
                    className="bg-[#81b64c] hover:bg-[#92c55b] text-white text-xs font-bold px-4 py-2 rounded-xl transition shadow flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
                  >
                    <span>+</span>
                    <span>Create Club</span>
                  </button>
                )}
              </div>

              {(!user.clubs || user.clubs.length === 0) ? (
                <div className="text-center py-12 text-[#8c8b88]">
                  <span className="text-4xl mb-3 block">🏛️</span>
                  <p className="font-bold text-white mb-1">No Clubs Yet</p>
                  <p className="text-xs mb-4">Create a club or join one to collaborate with fellow coders.</p>
                  {isOwnProfile && (
                    <button
                      onClick={() => setShowCreateClubModal(true)}
                      className="bg-[#81b64c] hover:bg-[#92c55b] text-white text-xs font-bold px-4 py-2 rounded-xl cursor-pointer"
                    >
                      + Create New Club
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {user.clubs.map((club) => {
                    const isOwner = club.isOwner || club.role === 'owner';

                    return (
                      <div
                        key={club.id || club.name}
                        onClick={() => handleOpenManageMembers(club)}
                        className="bg-[#1b1917] border border-[#2d2a26] hover:border-[#81b64c]/40 hover:bg-[#201f1c] rounded-xl p-4 flex flex-col justify-between gap-3 shadow-md transition-all cursor-pointer group"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-11 h-11 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-xl flex-shrink-0 group-hover:scale-105 transition">
                            {club.icon || '💻'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <h3 className="font-bold text-white text-sm truncate group-hover:text-[#81b64c] transition">
                                {club.name}
                              </h3>
                              {isOwner ? (
                                <span className="text-[10px] font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20 flex-shrink-0">
                                  👑 Leader
                                </span>
                              ) : (
                                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded border border-emerald-400/20 flex-shrink-0">
                                  Member
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-[#8c8b88] mt-0.5">
                              📍 {club.location || 'Global'} • {club.members || 1} {club.members === 1 ? 'member' : 'members'}
                            </div>
                            <p className="text-xs text-[#a09e99] mt-2 line-clamp-2">
                              {club.description || 'Passionate competitive programming club.'}
                            </p>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs">
                          <Link
                            to="/community"
                            onClick={(e) => e.stopPropagation()}
                            className="text-[#8c8b88] hover:text-white transition"
                          >
                            View in Community ↗
                          </Link>

                          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => handleOpenManageMembers(club)}
                              className="bg-[#2b2926] hover:bg-[#383531] text-white font-bold px-3 py-1.5 rounded-lg border border-white/10 transition cursor-pointer flex items-center gap-1.5"
                            >
                              {isOwner ? (
                                <>
                                  <span>⚙️</span> Manage Members
                                </>
                              ) : (
                                <>
                                  <span>👥</span> View Members
                                </>
                              )}
                            </button>

                            {isOwnProfile && !isOwner && club.id && club.id !== 'default' && (
                              <button
                                onClick={() => handleLeaveClub(club.id)}
                                className="text-red-400 hover:text-red-300 text-xs px-2 py-1 rounded hover:bg-red-500/10 transition cursor-pointer"
                              >
                                Leave
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
        </div>

        {/* Right Sidebar: Streak, Theme, Clubs, Coding Profiles */}
        <div className="lg:col-span-4 xl:col-span-3 flex flex-col gap-5">
          
          {/* Streak Card */}
          <div className={`bg-[#21201d] border rounded-2xl p-4 flex items-center gap-3.5 shadow-md transition-all duration-500 ${
            streakGlow 
              ? 'border-amber-500/80 ring-2 ring-amber-500/30 scale-[1.02] shadow-amber-500/20' 
              : 'border-[#2d2a26]'
          }`}>
            <div className={`w-12 h-12 rounded-full bg-gradient-to-tr from-amber-600 to-yellow-400 flex items-center justify-center text-2xl shadow-lg transition-transform duration-300 ${
              streakGlow ? 'scale-110 rotate-6 animate-bounce' : ''
            }`}>
              🔥
            </div>
            <div>
              <div className="text-lg font-extrabold text-white flex items-center gap-2">
                <span>{user.streak ?? 0} Day Streak</span>
                {streakGlow && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/40 animate-pulse">
                    LIVE
                  </span>
                )}
              </div>
              <div className="text-xs text-[#8c8b88]">Keep solving daily to maintain momentum</div>
            </div>
          </div>


          {/* Clubs Card */}
          <div className="bg-[#21201d] border border-[#2d2a26] rounded-2xl p-4 shadow-md">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-bold text-white">
                Clubs ({user.clubs ? user.clubs.length : 0})
              </span>
              {isOwnProfile && (
                <button
                  onClick={() => setShowCreateClubModal(true)}
                  className="text-xs font-bold text-[#81b64c] hover:underline cursor-pointer"
                >
                  + Create
                </button>
              )}
            </div>

            <div className="flex flex-col gap-2">
              {(user.clubs && user.clubs.length > 0) ? (
                user.clubs.map((club) => (
                  <div
                    key={club.id || club.name}
                    onClick={() => {
                      setActiveTab('clubs');
                      handleOpenManageMembers(club);
                    }}
                    className="flex items-center justify-between p-2 rounded-xl hover:bg-[#262421] transition cursor-pointer group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-emerald-700/20 border border-emerald-500/30 flex items-center justify-center text-base flex-shrink-0 group-hover:scale-105 transition">
                        {club.icon || '💻'}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-bold text-white truncate group-hover:text-[#81b64c] transition">
                          {club.name}
                        </span>
                        <span className="text-[10px] text-[#8c8b88]">
                          {club.role === 'owner' || club.isOwner ? '👑 Leader' : 'Member'} • {club.members || 1} members
                        </span>
                      </div>
                    </div>
                    {club.isOwner ? (
                      <span className="text-[10px] text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded font-bold">
                        Leader
                      </span>
                    ) : (
                      <span className="text-[10px] text-[#8c8b88] group-hover:text-white transition">
                        View →
                      </span>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-xs text-[#8c8b88] py-2 text-center">
                  No clubs joined yet
                </div>
              )}
            </div>
          </div>

          {/* External / Social Linked Profiles */}
          {activeSocialList && activeSocialList.length > 0 && (
            <div className="bg-[#21201d] border border-[#2d2a26] rounded-2xl p-4 shadow-md">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-bold text-white flex items-center gap-1.5">
                  <span>🔗</span>
                  <span>Social & Coding Profiles</span>
                </span>
              </div>
              <div className="flex flex-col gap-2">
                {activeSocialList.map((item, idx) => (
                  <a 
                    key={idx} 
                    href={item.url} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="flex items-center justify-between p-2.5 rounded-xl bg-[#262421] hover:bg-[#2d2a26] text-xs transition group border border-white/5 hover:border-[#81b64c]/40"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="flex-shrink-0">{renderPlatformIcon(item.platform, 'w-4 h-4')}</span>
                      <span className="font-semibold text-white truncate">{item.platform}</span>
                    </div>
                    <span className="text-[#81b64c] group-hover:underline font-mono truncate max-w-[130px]">
                      {item.displayLabel} ↗
                    </span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* CREATE CLUB MODAL */}
      {showCreateClubModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#24221f] border border-white/15 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl animate-in zoom-in duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
              <div className="flex items-center gap-2">
                <span className="text-xl">🏛️</span>
                <h3 className="text-lg font-extrabold text-white">Create New Coding Club</h3>
              </div>
              <button
                onClick={() => setShowCreateClubModal(false)}
                className="text-white/50 hover:text-white text-base p-1"
              >
                ✕
              </button>
            </div>

            {createClubError && (
              <div className="bg-red-500/15 border border-red-500/30 text-red-400 text-xs p-3 rounded-xl mb-4">
                {createClubError}
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
                    Club Icon
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
                  onClick={() => setShowCreateClubModal(false)}
                  className="flex-1 bg-[#2b2926] text-white text-xs font-semibold py-2.5 rounded-xl border border-white/10 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createClubSubmitting}
                  className="flex-1 bg-[#81b64c] hover:bg-[#92c55b] text-white text-xs font-bold py-2.5 rounded-xl transition shadow disabled:opacity-50"
                >
                  {createClubSubmitting ? 'Creating...' : 'Create Club'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MANAGE / VIEW CLUB MEMBERS MODAL */}
      {managingClub && (() => {
        const clubLeaderObj = (managingClub.owner && typeof managingClub.owner === 'object')
          ? managingClub.owner
          : managingClub.members?.find(m => m.role === 'owner') || null;

        const leaderId = clubLeaderObj?._id || clubLeaderObj?.id || clubLeaderObj?.userId || (typeof managingClub.owner === 'string' ? managingClub.owner : null);
        const leaderUsername = clubLeaderObj?.username || managingClub.members?.find(m => m.role === 'owner')?.username;
        const leaderDisplayName = clubLeaderObj?.displayName || leaderUsername || 'Club Leader';

        const currentViewerId = authUser?._id || authUser?.id || (isMe ? user?._id || user?.id : null);
        const currentViewerUsername = authUser?.username || (isMe ? user?.username : localStorage.getItem('username'));

        const isViewerLeader = Boolean(
          (currentViewerId && leaderId && String(currentViewerId) === String(leaderId)) ||
          (currentViewerUsername && leaderUsername && currentViewerUsername.toLowerCase() === leaderUsername.toLowerCase()) ||
          managingClub.isOwner
        );

        const isViewerMember = Boolean(
          isViewerLeader ||
          managingClub.members?.some(m => 
            (currentViewerId && String(m.userId) === String(currentViewerId)) ||
            (currentViewerUsername && m.username?.toLowerCase() === currentViewerUsername.toLowerCase())
          )
        );

        return (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[#24221f] border border-white/15 rounded-3xl p-6 sm:p-7 max-w-xl w-full shadow-2xl animate-in zoom-in duration-150 max-h-[90vh] flex flex-col">
              {/* Modal Header */}
              <div className="flex items-start justify-between pb-4 border-b border-white/10 mb-4 shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-2xl flex-shrink-0 shadow-inner">
                    {managingClub.icon || '💻'}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-extrabold text-white truncate">{managingClub.name}</h3>
                      <span className="text-[10px] bg-white/10 text-[#a09e99] px-2 py-0.5 rounded-full font-bold shrink-0">
                        📍 {managingClub.location || 'Global'}
                      </span>
                    </div>
                    <p className="text-xs text-[#8c8b88] mt-0.5 line-clamp-1">
                      {managingClub.description || 'Passionate competitive programming club.'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setManagingClub(null)}
                  className="text-white/50 hover:text-white text-base p-1.5 hover:bg-white/5 rounded-lg transition shrink-0 ml-2"
                >
                  ✕
                </button>
              </div>

              {/* Scrollable Content Body */}
              <div className="overflow-y-auto flex-1 pr-1 space-y-4">
                {/* Standout Club Leader Card */}
                <div className="bg-gradient-to-r from-amber-500/15 via-yellow-500/10 to-transparent border border-amber-500/30 rounded-2xl p-3.5 flex items-center justify-between gap-3 shadow-md">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-xl shadow-md flex-shrink-0">
                      👑
                    </div>
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-400 bg-amber-400/20 px-1.5 py-0.2 rounded border border-amber-400/30">
                          Club Leader
                        </span>
                        {isViewerLeader && (
                          <span className="text-[10px] font-bold text-emerald-400 bg-emerald-400/15 px-1.5 py-0.2 rounded border border-emerald-400/30">
                            You
                          </span>
                        )}
                      </div>
                      <div className="text-sm font-bold text-white truncate mt-0.5">
                        {leaderDisplayName}{' '}
                        {leaderUsername && (
                          <span className="text-xs font-normal text-[#8c8b88]">@{leaderUsername}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {clubLeaderObj?.ratings?.blitz && (
                      <span className="text-[11px] font-mono text-amber-300 bg-black/40 px-2 py-0.5 rounded-lg border border-amber-500/20">
                        ⚡ {clubLeaderObj.ratings.blitz}
                      </span>
                    )}
                    {leaderUsername && (
                      <Link
                        to={`/${leaderUsername}`}
                        onClick={() => setManagingClub(null)}
                        className="text-xs text-[#8c8b88] hover:text-white bg-white/5 hover:bg-white/10 px-2.5 py-1 rounded-lg transition"
                      >
                        Profile ↗
                      </Link>
                    )}
                  </div>
                </div>

                {manageClubError && (
                  <div className="bg-red-500/15 border border-red-500/30 text-red-400 text-xs p-3 rounded-xl flex items-center gap-2">
                    <span>⚠️</span>
                    <span>{manageClubError}</span>
                  </div>
                )}
                {manageClubSuccess && (
                  <div className="bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs p-3 rounded-xl flex items-center gap-2">
                    <span>✅</span>
                    <span>{manageClubSuccess}</span>
                  </div>
                )}

                {/* Role-Based Controls: Leader vs Non-Leader */}
                {isViewerLeader ? (
                  <div className="bg-[#1b1a18] border border-amber-500/20 rounded-2xl p-4 shadow-inner">
                    <div className="flex items-center justify-between mb-2.5">
                      <div className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                        <span>⚡ Leader Controls:</span>
                        <span className="text-white font-medium">Add New Member</span>
                      </div>
                      <span className="text-[10px] text-amber-300/70 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
                        Leader Authorized
                      </span>
                    </div>
                    <form onSubmit={handleAddMember} className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Enter coder username (e.g. leetcoder99)..."
                        value={memberUsernameToAdd}
                        onChange={(e) => setMemberUsernameToAdd(e.target.value)}
                        className="flex-1 bg-[#141311] border border-white/10 focus:border-[#81b64c] text-white text-xs px-3.5 py-2 rounded-xl focus:outline-none placeholder:text-[#666]"
                      />
                      <button
                        type="submit"
                        disabled={manageClubSubmitting || !memberUsernameToAdd.trim()}
                        className="bg-[#81b64c] hover:bg-[#92c55b] text-white text-xs font-bold px-4 py-2 rounded-xl transition shadow disabled:opacity-50 cursor-pointer shrink-0"
                      >
                        {manageClubSubmitting ? 'Adding...' : '+ Add Member'}
                      </button>
                    </form>
                  </div>
                ) : (
                  <div className="bg-[#1b1a18] border border-white/5 rounded-2xl p-3 flex items-center justify-between text-xs text-[#8c8b88]">
                    <div className="flex items-center gap-2">
                      <span>🛡️</span>
                      <span>
                        Managed by leader <span className="text-amber-400 font-semibold">@{leaderUsername || 'owner'}</span>. Member list shown below.
                      </span>
                    </div>
                    {isViewerMember && !isViewerLeader && (
                      <button
                        onClick={() => {
                          handleLeaveClub(managingClub.id);
                          setManagingClub(null);
                        }}
                        className="text-red-400 hover:text-red-300 font-semibold text-xs hover:underline cursor-pointer ml-2 shrink-0"
                      >
                        Leave Club
                      </button>
                    )}
                  </div>
                )}

                {/* Members Section Header */}
                <div className="flex items-center justify-between pt-1">
                  <div className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <span>All Members</span>
                    <span className="text-[10px] bg-white/10 text-white px-2 py-0.5 rounded-full font-bold">
                      {managingClub.members?.length || 0}
                    </span>
                  </div>
                  <span className="text-[11px] text-[#8c8b88]">
                    {isViewerLeader ? 'Leader can remove members below' : 'Viewing roster'}
                  </span>
                </div>

                {/* Members List */}
                <div className="max-h-60 overflow-y-auto divide-y divide-[#2d2a26] border border-white/5 rounded-2xl bg-[#1b1a18] p-2">
                  {managingClub.members && managingClub.members.length > 0 ? (
                    managingClub.members.map((m) => {
                      const isThisMemberOwner = m.role === 'owner' || 
                        (leaderId && (String(m.userId) === String(leaderId) || String(m._id) === String(leaderId))) ||
                        (leaderUsername && m.username?.toLowerCase() === leaderUsername.toLowerCase());

                      const isCurrentViewer = Boolean(
                        (currentViewerId && String(m.userId) === String(currentViewerId)) ||
                        (currentViewerUsername && m.username?.toLowerCase() === currentViewerUsername.toLowerCase())
                      );

                      return (
                        <div key={m.userId || m.username} className="p-2.5 flex items-center justify-between gap-3 hover:bg-white/[0.02] rounded-xl transition">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className={`w-8 h-8 rounded-xl text-white text-xs font-bold flex items-center justify-center flex-shrink-0 shadow-inner ${
                              isThisMemberOwner ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'bg-[#81b64c]/20 text-[#81b64c] border border-[#81b64c]/30'
                            }`}>
                              {isThisMemberOwner ? '👑' : (m.username?.charAt(0).toUpperCase() || 'U')}
                            </div>
                            <div className="flex flex-col min-w-0">
                              <div className="flex items-center gap-1.5">
                                <Link
                                  to={`/${m.username}`}
                                  onClick={() => setManagingClub(null)}
                                  className="text-xs font-bold text-white truncate hover:underline hover:text-[#81b64c] transition"
                                >
                                  {m.displayName || m.username}
                                </Link>
                                {isCurrentViewer && (
                                  <span className="text-[9px] bg-white/10 text-[#a09e99] px-1.5 py-0.2 rounded font-bold">
                                    You
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-[#8c8b88] flex items-center gap-1.5">
                                <span>@{m.username}</span>
                                <span>•</span>
                                {isThisMemberOwner ? (
                                  <span className="text-amber-400 font-bold">👑 Leader</span>
                                ) : (
                                  <span className="text-emerald-400 font-medium">Member</span>
                                )}
                                {m.ratings?.blitz && (
                                  <>
                                    <span>•</span>
                                    <span className="font-mono text-[#a09e99]">⚡ {m.ratings.blitz}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Action on Member: Only leader can remove others */}
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {isViewerLeader && !isThisMemberOwner && (
                              <button
                                onClick={() => handleRemoveMember(m.userId)}
                                className="text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer"
                              >
                                Remove
                              </button>
                            )}

                            {!isViewerLeader && isCurrentViewer && (
                              <button
                                onClick={() => {
                                  handleLeaveClub(managingClub.id);
                                  setManagingClub(null);
                                }}
                                className="text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer"
                              >
                                Leave
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-6 text-xs text-[#8c8b88]">
                      No members found in this club yet.
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Actions Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-white/10 shrink-0 mt-4">
                <div>
                  {isViewerLeader ? (
                    <button
                      onClick={handleDeleteClub}
                      className="text-xs text-red-400 hover:text-red-300 font-semibold hover:underline cursor-pointer"
                    >
                      Delete Club Permanently
                    </button>
                  ) : (
                    <span className="text-[11px] text-[#666]">
                      Coding Clubs Arena
                    </span>
                  )}
                </div>

                <button
                  onClick={() => setManagingClub(null)}
                  className="bg-[#2b2926] hover:bg-[#383531] text-white text-xs font-bold px-5 py-2 rounded-xl border border-white/10 transition cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* MODE STATS MODAL (RAPID / BLITZ / BULLET) */}
      {selectedStatsMode && (() => {
        const modeKey = selectedStatsMode.toLowerCase();
        const modeMatches = (matchHistory || []).filter(m => m.mode?.toLowerCase() === modeKey);
        const totalPlayed = modeMatches.length;

        const wins = modeMatches.filter(m => m.resultType === 'win').length;
        const losses = modeMatches.filter(m => m.resultType === 'loss').length;
        const draws = modeMatches.filter(m => m.resultType === 'draw').length;

        const winRate = totalPlayed > 0 ? Math.round((wins / totalPlayed) * 100) : 0;
        const drawRate = totalPlayed > 0 ? Math.round((draws / totalPlayed) * 100) : 0;
        const lossRate = totalPlayed > 0 ? Math.max(0, 100 - winRate - drawRate) : 0;

        const currentModeRating = user.ratings?.[modeKey] ?? 1500;
        const ratingPoints = getRatingPoints(modeKey);

        // Check if user has played any real contest/games in this format
        const hasContests = totalPlayed > 0 || (user.ratingCurves?.[modeKey] && user.ratingCurves[modeKey].length > 0);

        // If zero contests in that format: keep minimum rating and maximum rating by default 1500!
        const bestRating = hasContests ? Math.max(...ratingPoints, currentModeRating) : 1500;
        const lowestRating = hasContests ? Math.min(...ratingPoints, currentModeRating) : 1500;

        let percentileStr = '-';
        let rankStr = 'Unranked';
        if (hasContests) {
          if (currentModeRating >= 2200) {
            percentileStr = 'Top 0.5%';
            rankStr = '#12';
          } else if (currentModeRating >= 2000) {
            percentileStr = 'Top 1.5%';
            rankStr = '#84';
          } else if (currentModeRating >= 1800) {
            percentileStr = 'Top 5.0%';
            rankStr = '#210';
          } else if (currentModeRating >= 1650) {
            percentileStr = 'Top 12.5%';
            rankStr = '#580';
          } else if (currentModeRating > 1500) {
            percentileStr = 'Top 25.0%';
            rankStr = '#980';
          } else if (currentModeRating === 1500) {
            percentileStr = 'Top 50.0%';
            rankStr = '#1,500';
          } else {
            percentileStr = 'Top 70.0%';
            rankStr = '#2,200';
          }
        }

        return (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[#21201d] border border-white/15 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl animate-in zoom-in duration-150 flex flex-col gap-5">
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-2xl shadow-inner ${
                    selectedStatsMode === 'rapid' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                    selectedStatsMode === 'blitz' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                    'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                  }`}>
                    {selectedStatsMode === 'rapid' ? '⏱️' : selectedStatsMode === 'blitz' ? '⚡' : '🚀'}
                  </div>
                  <div>
                    <h3 className="text-lg font-extrabold text-white capitalize">
                      {selectedStatsMode} Rating & Statistics
                    </h3>
                    <p className="text-xs text-[#8c8b88]">
                      {selectedStatsMode === 'rapid' ? '10 min per player • Algorithmic Battles' :
                       selectedStatsMode === 'blitz' ? '3+0 min • Fast-Paced Speed Coding' :
                       '1+0 min • Ultra-Bullet Reflex Coding'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedStatsMode(null)}
                  className="text-white/50 hover:text-white text-lg p-1 transition cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Switch Mode Tabs inside Modal */}
              <div className="flex items-center gap-2 bg-[#1b1917] p-1 rounded-xl border border-[#2d2a26]">
                {['rapid', 'blitz', 'bullet'].map(m => (
                  <button
                    key={m}
                    onClick={() => setSelectedStatsMode(m)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold capitalize transition cursor-pointer flex items-center justify-center gap-1.5 ${
                      selectedStatsMode === m
                        ? m === 'rapid' ? 'bg-[#10b981] text-white shadow'
                          : m === 'blitz' ? 'bg-[#eab308] text-[#161512] shadow font-black'
                          : 'bg-[#f97316] text-white shadow'
                        : 'text-[#8c8b88] hover:text-white'
                    }`}
                  >
                    <span>{m === 'rapid' ? '⏱️' : m === 'blitz' ? '⚡' : '🚀'}</span>
                    <span>{m}</span>
                  </button>
                ))}
              </div>

              {/* Big Rating Banner */}
              <div className="bg-[#1b1917] border border-white/5 rounded-2xl p-5 flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-[#8c8b88] uppercase tracking-wider block">
                    Current Rating
                  </span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-4xl font-extrabold text-white">
                      {currentModeRating}
                    </span>
                    <span className="text-xs font-bold text-[#81b64c]">
                      {user.ratingGains?.[selectedStatsMode] ?? '+0'}
                    </span>
                  </div>
                  <span className="text-[11px] text-[#8c8b88] mt-1 block">
                    {hasContests ? 'Provisional Rating • Active Rank' : 'Provisional Rating • 0 Contests Played'}
                  </span>
                </div>
                <div className="w-36">
                  {renderSparkline(
                    selectedStatsMode === 'rapid' ? '#10b981' : selectedStatsMode === 'blitz' ? '#eab308' : '#f97316',
                    ratingPoints
                  )}
                </div>
              </div>

              {/* 4 Performance Metric Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="bg-[#1b1917] border border-white/5 rounded-xl p-3 text-center">
                  <span className="text-[10px] text-[#8c8b88] uppercase font-bold block">Best Rating</span>
                  <span className="text-sm font-extrabold text-emerald-400 mt-0.5 block">
                    {bestRating}
                  </span>
                </div>
                <div className="bg-[#1b1917] border border-white/5 rounded-xl p-3 text-center">
                  <span className="text-[10px] text-[#8c8b88] uppercase font-bold block">Lowest</span>
                  <span className="text-sm font-extrabold text-[#9e9d9a] mt-0.5 block">
                    {lowestRating}
                  </span>
                </div>
                <div className="bg-[#1b1917] border border-white/5 rounded-xl p-3 text-center">
                  <span className="text-[10px] text-[#8c8b88] uppercase font-bold block">Percentile</span>
                  <span className="text-sm font-extrabold text-yellow-400 mt-0.5 block">{percentileStr}</span>
                </div>
                <div className="bg-[#1b1917] border border-white/5 rounded-xl p-3 text-center">
                  <span className="text-[10px] text-[#8c8b88] uppercase font-bold block">Rank</span>
                  <span className="text-sm font-extrabold text-white mt-0.5 block">{rankStr}</span>
                </div>
              </div>

              {/* Win / Loss / Draw Breakdown */}
              <div className="bg-[#1b1917] border border-white/5 rounded-2xl p-4 flex flex-col gap-2.5">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-white">Match Statistics</span>
                  <span className="text-[#8c8b88]">
                    {totalPlayed} Total Played
                  </span>
                </div>
                {/* Progress bar */}
                <div className="h-2.5 w-full bg-[#2b2926] rounded-full overflow-hidden flex">
                  {winRate > 0 && (
                    <div style={{ width: `${winRate}%` }} className="bg-[#81b64c] transition-all duration-300" title={`Wins: ${wins} (${winRate}%)`}></div>
                  )}
                  {drawRate > 0 && (
                    <div style={{ width: `${drawRate}%` }} className="bg-white/30 transition-all duration-300" title={`Draws: ${draws} (${drawRate}%)`}></div>
                  )}
                  {lossRate > 0 && (
                    <div style={{ width: `${lossRate}%` }} className="bg-red-500 transition-all duration-300" title={`Losses: ${losses} (${lossRate}%)`}></div>
                  )}
                </div>
                <div className="flex items-center justify-between text-[11px] text-[#8c8b88] pt-1">
                  <span className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${wins > 0 ? 'bg-[#81b64c]' : 'bg-white/20'}`}></span>
                    <span>{totalPlayed > 0 ? `${wins} Win${wins === 1 ? '' : 's'} (${winRate}%)` : '0% Win Rate'}</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${draws > 0 ? 'bg-white/60' : 'bg-white/20'}`}></span>
                    <span>{totalPlayed > 0 ? `${draws} Draw${draws === 1 ? '' : 's'} (${drawRate}%)` : '0% Draw'}</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${losses > 0 ? 'bg-red-500' : 'bg-white/20'}`}></span>
                    <span>{totalPlayed > 0 ? `${losses} Loss${losses === 1 ? '' : 'es'} (${lossRate}%)` : '0% Loss'}</span>
                  </span>
                </div>
                {totalPlayed === 0 && (
                  <div className="text-[11px] text-[#7d7c78] text-center pt-0.5 italic">
                    No matches played in {selectedStatsMode} format yet. Default rating is 1500.
                  </div>
                )}
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-between gap-3 pt-2 border-t border-white/10">
                <button
                  onClick={() => setSelectedStatsMode(null)}
                  className="bg-[#2b2926] hover:bg-[#383531] text-white text-xs font-bold px-4 py-2.5 rounded-xl border border-white/10 transition cursor-pointer"
                >
                  Close
                </button>

                <button
                  onClick={() => {
                    const mode = selectedStatsMode ? (selectedStatsMode.charAt(0).toUpperCase() + selectedStatsMode.slice(1)) : 'Blitz';
                    setSelectedStatsMode(null);
                    handleChallengeUser(user.username, mode);
                  }}
                  className="bg-[#81b64c] hover:bg-[#92c55b] text-white text-xs font-bold px-5 py-2.5 rounded-xl transition shadow flex items-center gap-1.5 cursor-pointer"
                >
                  <span>⚔️ Challenge in {selectedStatsMode.charAt(0).toUpperCase() + selectedStatsMode.slice(1)}</span>
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Solved Problem Code Inspection Modal */}
      {selectedSolvedCode && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setSelectedSolvedCode(null)}
        >
          <div 
            className="bg-[#1e1d1a] border border-white/10 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-[#2d2a26] flex items-center justify-between bg-[#161512]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-lg">
                  ✓
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base sm:text-lg font-bold text-white">
                      {selectedSolvedCode.title}
                    </h3>
                    <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                      selectedSolvedCode.difficulty?.toLowerCase() === 'easy' ? 'text-teal-400 bg-teal-400/10 border border-teal-400/20' :
                      selectedSolvedCode.difficulty?.toLowerCase() === 'medium' ? 'text-amber-400 bg-amber-400/10 border border-amber-400/20' :
                      'text-rose-500 bg-rose-500/10 border border-rose-500/20'
                    }`}>
                      {selectedSolvedCode.difficulty}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-[#8c8b88] mt-0.5">
                    <span>Solved {formatRelativeTime(selectedSolvedCode.solvedAt)}</span>
                    <span>•</span>
                    <span className="text-emerald-400 font-semibold">Accepted Solution</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedSolvedCode(null)}
                className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-[#8c8b88] hover:text-white flex items-center justify-center transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Performance Stats Bar */}
            <div className="px-5 py-3 bg-[#262421]/60 border-b border-[#2d2a26] flex items-center justify-between text-xs flex-wrap gap-2">
              <div className="flex items-center gap-4 text-[#8c8b88]">
                <span>
                  Language: <strong className="text-white font-mono">{selectedSolvedCode.language === 'cpp' ? 'C++20' : selectedSolvedCode.language === 'python' ? 'Python 3' : selectedSolvedCode.language || 'C++'}</strong>
                </span>
                <span>•</span>
                <span>
                  Runtime: <strong className="text-emerald-400">{selectedSolvedCode.runtime ? `${selectedSolvedCode.runtime} ms` : '42 ms'}</strong>
                </span>
                <span>•</span>
                <span>
                  Memory: <strong className="text-sky-400">{selectedSolvedCode.memory ? `${selectedSolvedCode.memory} MB` : '14.2 MB'}</strong>
                </span>
              </div>

              <button
                onClick={() => handleCopyCode(selectedSolvedCode.code)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#2b2926] hover:bg-[#363431] text-white border border-white/10 transition cursor-pointer"
              >
                <span>{copiedCode ? '✓ Copied!' : '📋 Copy Code'}</span>
              </button>
            </div>

            {/* Code Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 bg-[#12110f] font-mono text-xs sm:text-sm text-gray-200 leading-relaxed scrollbar-thin">
              <pre className="whitespace-pre overflow-x-auto selection:bg-[#81b64c]/30 selection:text-white">
                <code>{selectedSolvedCode.code}</code>
              </pre>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-[#2d2a26] flex items-center justify-between bg-[#161512]">
              <button
                onClick={() => setSelectedSolvedCode(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[#262421] hover:bg-[#32302c] text-[#8c8b88] hover:text-white transition cursor-pointer"
              >
                Close
              </button>

              <Link
                to={`/problem/${selectedSolvedCode.slug}`}
                onClick={() => setSelectedSolvedCode(null)}
                className="bg-[#81b64c] hover:bg-[#92c55b] text-white text-xs font-bold px-4 py-2 rounded-xl transition shadow flex items-center gap-1.5"
              >
                <span>Open in Training Ground</span>
                <span>→</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* EDIT PROFILE MODAL */}
      {isEditProfileOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={() => !editSubmitting && setIsEditProfileOpen(false)}
        >
          <div 
            className="relative w-full max-w-xl bg-[#1e1d1a] border border-[#363431] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#2d2a26] bg-[#24221f]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#81b64c]/20 border border-[#81b64c]/40 flex items-center justify-center text-[#81b64c] shadow-inner">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white">Edit Profile</h3>
                  <p className="text-xs text-[#8c8b88] mt-0.5">Customize your DP, location, about bio, and display details</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => !editSubmitting && setIsEditProfileOpen(false)}
                className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 text-[#8c8b88] hover:text-white flex items-center justify-center transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSaveProfile} className="flex-1 overflow-y-auto p-6 flex flex-col gap-5 scrollbar-thin">
              {/* Error Notification */}
              {editError && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs flex items-center gap-2">
                  <span>⚠️</span>
                  <span>{editError}</span>
                </div>
              )}

              {/* Success Notification */}
              {editSuccess && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs flex items-center gap-2">
                  <span>✓</span>
                  <span>{editSuccess}</span>
                </div>
              )}

              {/* DP (Avatar) Section */}
              <div className="bg-[#181714] border border-[#2b2926] rounded-2xl p-4 sm:p-5">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#9e9d9a] mb-3">
                  Profile Picture (DP)
                </label>
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
                  {/* Current / Preview Avatar */}
                  <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-[#262421] border-2 border-white/10 shadow-lg overflow-hidden flex items-center justify-center text-3xl sm:text-4xl font-extrabold text-[#81b64c] flex-shrink-0">
                    {editForm.avatar ? (
                      <img src={editForm.avatar} alt="Avatar preview" className="w-full h-full object-cover" />
                    ) : (
                      <span>{user.username ? user.username.charAt(0).toUpperCase() : 'U'}</span>
                    )}
                  </div>

                  {/* Actions & Preset Avatars */}
                  <div className="flex-1 flex flex-col gap-2.5 w-full">
                    <div className="flex flex-wrap items-center gap-2">
                      {/* File Upload Button */}
                      <label className="bg-[#81b64c] hover:bg-[#92c55b] text-white text-xs font-bold px-3.5 py-2 rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-sm active:scale-95">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                        <span>Upload Photo</span>
                        <input 
                          type="file" 
                          accept="image/*" 
                          onChange={handleAvatarFileChange} 
                          className="hidden" 
                        />
                      </label>

                      {/* Remove Avatar Button */}
                      {editForm.avatar && (
                        <button
                          type="button"
                          onClick={() => setEditForm(prev => ({ ...prev, avatar: '' }))}
                          className="bg-[#2b2926] hover:bg-red-500/20 text-[#8c8b88] hover:text-red-400 text-xs font-semibold px-3 py-2 rounded-xl border border-white/10 transition cursor-pointer"
                        >
                          Remove Photo
                        </button>
                      )}
                    </div>

                    {/* Or URL Input */}
                    <div className="mt-1">
                      <input
                        type="url"
                        placeholder="Or paste image link (https://...)"
                        value={editForm.avatar.startsWith('data:') ? '' : editForm.avatar}
                        onChange={(e) => setEditForm(prev => ({ ...prev, avatar: e.target.value }))}
                        className="w-full bg-[#24221f] border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-[#686764] focus:outline-none focus:border-[#81b64c] transition"
                      />
                    </div>

                    {/* Preset Avatars */}
                    <div className="mt-1.5">
                      <span className="text-[11px] text-[#7d7c78] font-medium block mb-1.5">Or choose a preset avatar:</span>
                      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                        {PRESET_AVATARS.map((preset, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setEditForm(prev => ({ ...prev, avatar: preset }))}
                            className={`w-9 h-9 rounded-xl overflow-hidden border-2 flex-shrink-0 transition transform hover:scale-105 cursor-pointer ${
                              editForm.avatar === preset ? 'border-[#81b64c] ring-2 ring-[#81b64c]/40' : 'border-white/10 hover:border-white/30'
                            }`}
                          >
                            <img src={preset} alt={`Preset ${idx + 1}`} className="w-full h-full object-cover" />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Display Name */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#9e9d9a] mb-1.5">
                  Display Name
                </label>
                <input
                  type="text"
                  value={editForm.displayName}
                  onChange={(e) => setEditForm(prev => ({ ...prev, displayName: e.target.value }))}
                  placeholder="e.g. Aman Patel"
                  maxLength={60}
                  className="w-full bg-[#181714] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-[#686764] focus:outline-none focus:border-[#81b64c] transition"
                />
              </div>

              {/* Country / Region & Flag Selector */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#9e9d9a] mb-1.5">
                    Country / Region
                  </label>
                  <select
                    value={editForm.country || ''}
                    onChange={(e) => {
                      const selectedVal = e.target.value;
                      const matched = COUNTRY_OPTIONS.find(c => c.name === selectedVal);
                      setEditForm(prev => ({
                        ...prev,
                        country: selectedVal,
                        countryFlag: matched ? matched.flag : prev.countryFlag
                      }));
                    }}
                    className="w-full bg-[#181714] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#81b64c] transition"
                  >
                    <option value="">None (Blank / Unspecified)</option>
                    {COUNTRY_OPTIONS.map(c => (
                      <option key={c.name} value={c.name}>
                        {c.flag} {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#9e9d9a] mb-1.5">
                    Country Flag / Emoji
                  </label>
                  <input
                    type="text"
                    value={editForm.countryFlag || ''}
                    onChange={(e) => setEditForm(prev => ({ ...prev, countryFlag: e.target.value }))}
                    placeholder="e.g. 🇮🇳, 🇺🇸, 🇬🇧, 🇯🇵 (or leave blank)"
                    maxLength={10}
                    className="w-full bg-[#181714] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-[#686764] focus:outline-none focus:border-[#81b64c] transition"
                  />
                </div>
              </div>

              {/* Location & Organization Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#9e9d9a] mb-1.5">
                    Location 📍
                  </label>
                  <input
                    type="text"
                    value={editForm.location}
                    onChange={(e) => setEditForm(prev => ({ ...prev, location: e.target.value }))}
                    placeholder="e.g. San Francisco, Tokyo, Banda"
                    maxLength={80}
                    className="w-full bg-[#181714] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-[#686764] focus:outline-none focus:border-[#81b64c] transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#9e9d9a] mb-1.5">
                    Organization / College
                  </label>
                  <input
                    type="text"
                    value={editForm.organization}
                    onChange={(e) => setEditForm(prev => ({ ...prev, organization: e.target.value }))}
                    placeholder="e.g. IIT, Google, REC BANDA"
                    maxLength={80}
                    className="w-full bg-[#181714] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-[#686764] focus:outline-none focus:border-[#81b64c] transition"
                  />
                </div>
              </div>

              {/* About / Bio */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#9e9d9a]">
                    About / Bio
                  </label>
                  <span className={`text-[11px] font-mono ${
                    editForm.about.length > 450 ? 'text-amber-400' : 'text-[#686764]'
                  }`}>
                    {editForm.about.length}/500
                  </span>
                </div>
                <textarea
                  rows={4}
                  value={editForm.about}
                  onChange={(e) => setEditForm(prev => ({ ...prev, about: e.target.value }))}
                  placeholder="Tell other competitors about yourself, your favorite algorithms, topics you're mastering, or your goals..."
                  maxLength={500}
                  className="w-full bg-[#181714] border border-white/10 rounded-xl p-3.5 text-sm text-white placeholder-[#686764] focus:outline-none focus:border-[#81b64c] transition resize-none leading-relaxed"
                />
              </div>

              {/* Social & Coding Links Section */}
              <div className="bg-[#181714] border border-[#2b2926] rounded-2xl p-4 sm:p-5 flex flex-col gap-4">
                <div>
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#9e9d9a]">
                      Social & Coding Links (Optional)
                    </label>
                    <span className="text-[11px] text-[#81b64c] font-medium flex items-center gap-1">
                      <span>⚡</span>
                      <span>Icons auto-detect</span>
                    </span>
                  </div>
                  <p className="text-[11px] text-[#7d7c78] mt-0.5">
                    Connect your profiles. Enter a username or full URL — brand icons will automatically display. None are compulsory.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* GitHub Input */}
                  <div>
                    <label className="flex items-center gap-1.5 text-xs font-semibold text-white/90 mb-1.5">
                      {renderPlatformIcon('GitHub', 'w-4 h-4')}
                      <span>GitHub</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={editForm.socialLinks.github}
                        onChange={(e) => setEditForm(prev => ({
                          ...prev,
                          socialLinks: { ...prev.socialLinks, github: e.target.value }
                        }))}
                        placeholder="Username or URL (e.g. amanpatelzx2)"
                        className="w-full bg-[#24221f] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-[#686764] focus:outline-none focus:border-[#81b64c] transition"
                      />
                    </div>
                  </div>

                  {/* LinkedIn Input */}
                  <div>
                    <label className="flex items-center gap-1.5 text-xs font-semibold text-white/90 mb-1.5">
                      {renderPlatformIcon('LinkedIn', 'w-4 h-4')}
                      <span>LinkedIn</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={editForm.socialLinks.linkedin}
                        onChange={(e) => setEditForm(prev => ({
                          ...prev,
                          socialLinks: { ...prev.socialLinks, linkedin: e.target.value }
                        }))}
                        placeholder="Profile URL or in/username"
                        className="w-full bg-[#24221f] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-[#686764] focus:outline-none focus:border-[#81b64c] transition"
                      />
                    </div>
                  </div>

                  {/* LeetCode Input */}
                  <div>
                    <label className="flex items-center gap-1.5 text-xs font-semibold text-white/90 mb-1.5">
                      {renderPlatformIcon('LeetCode', 'w-4 h-4')}
                      <span>LeetCode</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={editForm.socialLinks.leetcode}
                        onChange={(e) => setEditForm(prev => ({
                          ...prev,
                          socialLinks: { ...prev.socialLinks, leetcode: e.target.value }
                        }))}
                        placeholder="LeetCode username or URL"
                        className="w-full bg-[#24221f] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-[#686764] focus:outline-none focus:border-[#81b64c] transition"
                      />
                    </div>
                  </div>

                  {/* Codeforces Input */}
                  <div>
                    <label className="flex items-center gap-1.5 text-xs font-semibold text-white/90 mb-1.5">
                      {renderPlatformIcon('Codeforces', 'w-4 h-4')}
                      <span>Codeforces</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={editForm.socialLinks.codeforces}
                        onChange={(e) => setEditForm(prev => ({
                          ...prev,
                          socialLinks: { ...prev.socialLinks, codeforces: e.target.value }
                        }))}
                        placeholder="Codeforces handle or URL"
                        className="w-full bg-[#24221f] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-[#686764] focus:outline-none focus:border-[#81b64c] transition"
                      />
                    </div>
                  </div>

                  {/* Personal Website / Portfolio Input */}
                  <div className="sm:col-span-2">
                    <label className="flex items-center gap-1.5 text-xs font-semibold text-white/90 mb-1.5">
                      {renderPlatformIcon('Website', 'w-4 h-4')}
                      <span>Personal Portfolio / Website</span>
                    </label>
                    <div className="relative">
                      <input
                        type="url"
                        value={editForm.socialLinks.website}
                        onChange={(e) => setEditForm(prev => ({
                          ...prev,
                          socialLinks: { ...prev.socialLinks, website: e.target.value }
                        }))}
                        placeholder="https://yourportfolio.com"
                        className="w-full bg-[#24221f] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-[#686764] focus:outline-none focus:border-[#81b64c] transition"
                      />
                    </div>
                  </div>
                </div>

                {/* Custom / Any Other Links */}
                <div className="pt-2 border-t border-white/5 flex flex-col gap-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-white/90">Other Links</span>
                    <button
                      type="button"
                      onClick={() => setEditForm(prev => ({
                        ...prev,
                        socialLinks: {
                          ...prev.socialLinks,
                          custom: [...(prev.socialLinks.custom || []), { label: '', url: '' }]
                        }
                      }))}
                      className="text-xs text-[#81b64c] hover:underline font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <span>+ Add Another Link</span>
                    </button>
                  </div>

                  {editForm.socialLinks.custom && editForm.socialLinks.custom.map((cust, cIdx) => {
                    const detected = cust.url ? detectPlatform(cust.url, cust.label) : 'Website';
                    return (
                      <div key={cIdx} className="flex items-center gap-2 bg-[#201e1b] p-2 rounded-xl border border-white/5">
                        {/* Dynamic Auto-detected Icon */}
                        <div className="w-8 h-8 rounded-lg bg-[#2b2926] flex items-center justify-center flex-shrink-0" title={`Auto-detected: ${detected}`}>
                          {renderPlatformIcon(detected, 'w-4 h-4')}
                        </div>
                        <input
                          type="text"
                          placeholder="Label (e.g. Twitter, Blog)"
                          value={cust.label}
                          onChange={(e) => {
                            const nextCustom = [...editForm.socialLinks.custom];
                            nextCustom[cIdx] = { ...nextCustom[cIdx], label: e.target.value };
                            setEditForm(prev => ({ ...prev, socialLinks: { ...prev.socialLinks, custom: nextCustom } }));
                          }}
                          className="w-28 sm:w-36 bg-[#262421] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#81b64c]"
                        />
                        <input
                          type="url"
                          placeholder="URL (https://...)"
                          value={cust.url}
                          onChange={(e) => {
                            const nextCustom = [...editForm.socialLinks.custom];
                            nextCustom[cIdx] = { ...nextCustom[cIdx], url: e.target.value };
                            setEditForm(prev => ({ ...prev, socialLinks: { ...prev.socialLinks, custom: nextCustom } }));
                          }}
                          className="flex-1 bg-[#262421] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#81b64c]"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const nextCustom = editForm.socialLinks.custom.filter((_, i) => i !== cIdx);
                            setEditForm(prev => ({ ...prev, socialLinks: { ...prev.socialLinks, custom: nextCustom } }));
                          }}
                          className="w-7 h-7 rounded-lg text-[#8c8b88] hover:text-red-400 hover:bg-red-500/10 flex items-center justify-center text-xs transition cursor-pointer"
                          title="Remove link"
                        >
                          ✕
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="pt-3 border-t border-[#2d2a26] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditProfileOpen(false)}
                  disabled={editSubmitting}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[#262421] hover:bg-[#32302c] text-[#8c8b88] hover:text-white transition cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editSubmitting}
                  className="px-6 py-2.5 rounded-xl text-xs font-bold bg-[#81b64c] hover:bg-[#92c55b] text-white shadow-lg shadow-[#81b64c]/20 transition cursor-pointer flex items-center gap-2 disabled:opacity-50"
                >
                  {editSubmitting ? (
                    <>
                      <svg className="animate-spin h-3.5 w-3.5 text-white" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                      </svg>
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Save Changes</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
