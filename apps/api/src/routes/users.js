import express from 'express';
import User from '../models/User.js';
import ExternalProfile from '../models/ExternalProfile.js';
import Battle from '../models/Battle.js';
import Friendship from '../models/Friendship.js';
import Club from '../models/Club.js';
import RatingHistory from '../models/RatingHistory.js';
import Problem from '../models/Problem.js';
import Submission from '../models/Submission.js';
import { protect } from '../middleware/authMiddleware.js';
import { isUserOnline } from '../socket.js';

const formatTimeAgo = (date) => {
  if (!date) return 'Offline';
  const diffMs = Date.now() - new Date(date).getTime();
  if (diffMs < 0 || isNaN(diffMs)) return 'Offline';
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDays = Math.floor(diffHr / 24);
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const router = express.Router();

// @route   GET /api/users/leaderboard
// @desc    Get leaderboard ranked by rating (blitz, rapid, bullet) or problems solved
// @access  Public
router.get('/leaderboard', async (req, res) => {
  try {
    const sortBy = (req.query.sortBy || req.query.format || 'blitz').toLowerCase();
    const query = (req.query.q || req.query.search || '').trim();
    const limit = Math.min(parseInt(req.query.limit) || 100, 300);

    const filter = {
      isBot: { $ne: true },
      role: { $ne: 'BOT' },
      username: { 
        $not: /bot|stockfish|computer|deepcoder|^test_|^tester_|^testuser|^dp_tester|^social_tester|^resign_user|^tourney|^tourneyhero|^coder_alice|^coder_bob|^coder_\d+|^u_\d+/i 
      },
      email: { 
        $not: /@example\.com|@test\.com|@bot\.local|@dummy\.com/i 
      }
    };
    if (query) {
      filter.$and = [
        {
          $or: [
            { username: { $regex: query, $options: 'i' } },
            { displayName: { $regex: query, $options: 'i' } }
          ]
        }
      ];
    }

    const users = await User.find(filter)
      .select('username displayName avatar bio ratings role country countryFlag location organization createdAt lastActive updatedAt')
      .lean();

    // Unique accepted problems solved count per user
    const solvedAgg = await Submission.aggregate([
      { $match: { status: 'ACCEPTED' } },
      { $group: { _id: { userId: '$userId', problemId: '$problemId' } } },
      { $group: { _id: '$_id.userId', count: { $sum: 1 } } }
    ]);

    const solvedMap = new Map();
    solvedAgg.forEach(item => {
      if (item._id) {
        solvedMap.set(item._id.toString(), item.count);
      }
    });

    const userList = users.map(u => {
      const uId = u._id.toString();
      const solvedCount = solvedMap.get(uId) || 0;
      const blitz = u.ratings?.blitz ?? 1500;
      const rapid = u.ratings?.rapid ?? 1500;
      const bullet = u.ratings?.bullet ?? 1500;
      const classical = u.ratings?.classical ?? 1500;
      return {
        ...u,
        ratings: {
          blitz,
          rapid,
          bullet,
          classical
        },
        solvedCount
      };
    });

    // Sort according to requested metric
    userList.sort((a, b) => {
      if (sortBy === 'solved') {
        if (b.solvedCount !== a.solvedCount) {
          return b.solvedCount - a.solvedCount;
        }
        return (b.ratings?.blitz || 1500) - (a.ratings?.blitz || 1500);
      } else if (sortBy === 'rapid') {
        if ((b.ratings?.rapid || 1500) !== (a.ratings?.rapid || 1500)) {
          return (b.ratings?.rapid || 1500) - (a.ratings?.rapid || 1500);
        }
        return b.solvedCount - a.solvedCount;
      } else if (sortBy === 'bullet') {
        if ((b.ratings?.bullet || 1500) !== (a.ratings?.bullet || 1500)) {
          return (b.ratings?.bullet || 1500) - (a.ratings?.bullet || 1500);
        }
        return b.solvedCount - a.solvedCount;
      } else {
        // default blitz
        if ((b.ratings?.blitz || 1500) !== (a.ratings?.blitz || 1500)) {
          return (b.ratings?.blitz || 1500) - (a.ratings?.blitz || 1500);
        }
        return b.solvedCount - a.solvedCount;
      }
    });

    const rankedUsers = userList.slice(0, limit).map((u, idx) => {
      const online = isUserOnline(u.username);
      return {
        ...u,
        rank: idx + 1,
        isOnline: online,
        lastOnline: online ? 'Active now' : formatTimeAgo(u.lastActive || u.updatedAt || u.createdAt)
      };
    });

    res.json(rankedUsers);
  } catch (error) {
    console.error('Leaderboard fetch error:', error);
    res.status(500).json({ message: 'Server error fetching leaderboard' });
  }
});

// @route   GET /api/users/search
// @desc    Search for users with match relevance scoring and profile details
// @access  Public
router.get('/search', async (req, res) => {
  try {
    const query = (req.query.q || req.query.query || '').trim();
    if (!query) {
      return res.json([]);
    }

    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const filter = {
      isBot: { $ne: true },
      role: { $ne: 'BOT' },
      username: { 
        $not: /bot|stockfish|computer|deepcoder|^test_|^tester_|^testuser|^dp_tester|^social_tester|^resign_user|^tourney|^tourneyhero|^coder_alice|^coder_bob|^coder_\d+|^u_\d+/i 
      },
      email: { 
        $not: /@example\.com|@test\.com|@bot\.local|@dummy\.com/i 
      },
      $or: [
        { username: { $regex: escapedQuery, $options: 'i' } },
        { displayName: { $regex: escapedQuery, $options: 'i' } }
      ]
    };

    const users = await User.find(filter)
      .select('username displayName ratings avatar role createdAt countryFlag bio streak lastActive updatedAt')
      .limit(30)
      .lean();

    const qLower = query.toLowerCase();

    // Sort by best match relevance
    const rankedUsers = users.map(u => {
      const uName = (u.username || '').toLowerCase();
      const dName = (u.displayName || '').toLowerCase();
      let matchScore = 0;

      if (uName === qLower) matchScore += 100;
      else if (dName === qLower) matchScore += 90;
      else if (uName.startsWith(qLower)) matchScore += 70;
      else if (dName.startsWith(qLower)) matchScore += 60;
      else if (uName.includes(qLower)) matchScore += 40;
      else if (dName.includes(qLower)) matchScore += 30;
      else matchScore += 10;

      // Small bonus for rating
      const rating = (u.ratings?.blitz || 1500);
      matchScore += Math.min(20, Math.floor(rating / 100));

      const online = isUserOnline(u.username);
      return {
        ...u,
        matchScore,
        isOnline: online,
        lastOnline: online ? 'Active now' : formatTimeAgo(u.lastActive || u.updatedAt || u.createdAt)
      };
    });

    rankedUsers.sort((a, b) => b.matchScore - a.matchScore);

    res.json(rankedUsers);
  } catch (error) {
    console.error('User search error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

const formatUserProfile = async (user, externalProfiles) => {
  const userObj = user.toObject ? user.toObject() : { ...user };
  delete userObj.password;

  // Platform Problem totals
  const totalProblems = await Problem.countDocuments({ status: 'ACTIVE' });
  const totalEasy = await Problem.countDocuments({ status: 'ACTIVE', difficulty: 'Easy' });
  const totalMedium = await Problem.countDocuments({ status: 'ACTIVE', difficulty: 'Medium' });
  const totalHard = await Problem.countDocuments({ status: 'ACTIVE', difficulty: 'Hard' });

  // User's Real Problem Submissions
  const userSubmissions = await Submission.find({ userId: user._id })
    .populate('problemId', 'title slug difficulty tags points')
    .sort({ createdAt: -1 });

  const solvedProblemMap = new Map();
  const attemptedProblemMap = new Map();

  userSubmissions.forEach(sub => {
    if (!sub.problemId || !sub.problemId.slug) return;
    const pSlug = sub.problemId.slug;
    const p = sub.problemId;

    if (sub.status === 'ACCEPTED') {
      if (!solvedProblemMap.has(pSlug)) {
        solvedProblemMap.set(pSlug, {
          id: p._id ? p._id.toString() : pSlug,
          title: p.title,
          slug: p.slug,
          difficulty: p.difficulty || 'Easy',
          tags: p.tags || [],
          points: p.points || (p.difficulty === 'Easy' ? 3 : p.difficulty === 'Medium' ? 5 : 10),
          language: sub.language || 'cpp',
          runtime: sub.runtime || 40,
          memory: sub.memory || 14.2,
          solvedAt: sub.createdAt,
          code: sub.code
        });
      }
    } else {
      if (!attemptedProblemMap.has(pSlug)) {
        attemptedProblemMap.set(pSlug, {
          id: p._id ? p._id.toString() : pSlug,
          title: p.title,
          slug: p.slug,
          difficulty: p.difficulty || 'Easy',
          tags: p.tags || [],
          points: p.points || 3,
          language: sub.language || 'cpp',
          lastAttemptAt: sub.createdAt
        });
      }
    }
  });

  let solvedEasy = 0;
  let solvedMedium = 0;
  let solvedHard = 0;

  solvedProblemMap.forEach(p => {
    const diff = p.difficulty?.toLowerCase();
    if (diff === 'easy') solvedEasy++;
    else if (diff === 'medium') solvedMedium++;
    else if (diff === 'hard') solvedHard++;
  });

  let attemptingCount = 0;
  const attemptingProblems = [];
  attemptedProblemMap.forEach((p, pSlug) => {
    if (!solvedProblemMap.has(pSlug)) {
      attemptingCount++;
      attemptingProblems.push(p);
    }
  });

  const solvedList = Array.from(solvedProblemMap.values());
  solvedList.sort((a, b) => new Date(b.solvedAt) - new Date(a.solvedAt));

  const solvedStats = {
    totalSolved: solvedList.length,
    totalProblems: totalProblems || 375,
    easy: { solved: solvedEasy, total: totalEasy || 195 },
    medium: { solved: solvedMedium, total: totalMedium || 138 },
    hard: { solved: solvedHard, total: totalHard || 42 },
    attempting: attemptingCount,
    attemptingProblems: attemptingProblems.slice(0, 10)
  };

  // Real friends count from database
  const friendsCount = await Friendship.countDocuments({
    $or: [
      { requesterId: user._id, status: 'ACCEPTED' },
      { recipientId: user._id, status: 'ACCEPTED' }
    ]
  });

  // Real completed matches from database
  const realBattles = await Battle.find({
    'players.userId': user._id,
    status: 'COMPLETED'
  }).sort({ createdAt: -1 }).limit(30);

  // Dynamic Real-time Daily Streak Calculation from all actual accepted submissions, completed battles, and active sessions
  const activityDates = new Set();
  const registerActivityDate = (rawDate) => {
    if (!rawDate) return;
    try {
      const d = new Date(rawDate);
      if (isNaN(d.getTime())) return;
      // UTC calendar date string
      activityDates.add(d.toISOString().split('T')[0]);
      // Local server calendar date string
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      activityDates.add(`${y}-${m}-${day}`);
    } catch {}
  };

  userSubmissions.forEach(sub => {
    if ((sub.status || '').toUpperCase() === 'ACCEPTED' && sub.createdAt) {
      registerActivityDate(sub.createdAt);
    }
  });

  realBattles.forEach(b => {
    if (b.createdAt) {
      registerActivityDate(b.createdAt);
    }
  });

  if (user.lastActive) {
    registerActivityDate(user.lastActive);
  }

  const hasActivityOnDate = (dateObj) => {
    try {
      const utc = dateObj.toISOString().split('T')[0];
      const y = dateObj.getFullYear();
      const m = String(dateObj.getMonth() + 1).padStart(2, '0');
      const day = String(dateObj.getDate()).padStart(2, '0');
      const local = `${y}-${m}-${day}`;
      return activityDates.has(utc) || activityDates.has(local);
    } catch {
      return false;
    }
  };

  const now = new Date();
  const yesterday = new Date(now.getTime() - 86400000);

  let dynamicDailyStreak = 0;
  if (hasActivityOnDate(now) || hasActivityOnDate(yesterday)) {
    let checkDate = hasActivityOnDate(now) ? new Date(now) : new Date(yesterday);
    while (true) {
      if (hasActivityOnDate(checkDate)) {
        dynamicDailyStreak++;
        checkDate = new Date(checkDate.getTime() - 86400000);
      } else {
        break;
      }
    }
  }

  // Effective streak is the maximum of dynamic consecutive days, stored DB streak, or at least 1 if user has solved any problem
  const effectiveStreak = Math.max(
    dynamicDailyStreak,
    userObj.streak || 0,
    (solvedProblemMap.size > 0 ? 1 : 0)
  );

  // Sync to database if DB value is outdated
  if (user.streak !== effectiveStreak) {
    User.updateOne({ _id: user._id }, { $set: { streak: effectiveStreak } }).catch(() => {});
  }

  const matchHistory = realBattles.map(b => {
    const userPlayer = (b.players && b.players.find(p => p.userId && p.userId.toString() === user._id.toString())) || (b.players && b.players[0]) || {};
    const isWin = b.winnerId && b.winnerId.toString() === user._id.toString();
    const isDraw = b.isDraw || userPlayer.score === 0.5;
    const userScore = isDraw ? 0.5 : (isWin ? 1 : 0);
    const opponentScore = isDraw ? 0.5 : (isWin ? 0 : 1);

    // Only rated games against real humans allow rating increase or decrease!
    const isBot = !b.opponentName || ['bot', 'stockfish', 'computer', 'algo_expert', 'deep_recursion', 'matrix_solver', 'ai_'].some(k => b.opponentName.toLowerCase().includes(k));
    const isRated = b.isRated === true && !isBot;

    const changeNum = isRated ? (userPlayer.ratingChange !== undefined ? userPlayer.ratingChange : (isWin ? 16 : isDraw ? 0 : -12)) : 0;
    const changeStr = isRated ? (changeNum > 0 ? `+${changeNum}` : `${changeNum}`) : '+0';

    const pTitle = b.problemTitle || 'Two Sum';
    const cleanTitle = pTitle.split(':')[0].trim();
    const pSlug = cleanTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'two-sum';
    const solvedMatch = solvedProblemMap.get(pSlug) || 
      Array.from(solvedProblemMap.values()).find(sp => 
        sp.slug === pSlug ||
        pTitle.toLowerCase().includes(sp.title?.toLowerCase()) ||
        sp.title?.toLowerCase().includes(cleanTitle.toLowerCase())
      );
    
    const userSubMatch = solvedMatch ? null : userSubmissions.find(s => 
      s.problemId?.slug === pSlug || 
      pTitle.toLowerCase().includes(s.problemId?.title?.toLowerCase() || '') ||
      (s.problemId?.title && cleanTitle.toLowerCase().includes(s.problemId.title.toLowerCase()))
    );

    const matchCode = solvedMatch?.code || userSubMatch?.code || '';
    const matchLang = solvedMatch?.language || userSubMatch?.language || 'cpp';
    const matchDiff = solvedMatch?.difficulty || userSubMatch?.problemId?.difficulty || 'Easy';
    const matchRuntime = solvedMatch?.runtime || userSubMatch?.runtime || 40;
    const matchMemory = solvedMatch?.memory || userSubMatch?.memory || 14.2;

    return {
      id: b._id.toString(),
      mode: b.mode || 'Blitz',
      timeControl: b.timeControlStr || '3 min',
      problemTitle: pTitle,
      title: pTitle,
      slug: solvedMatch?.slug || userSubMatch?.problemId?.slug || pSlug,
      difficulty: matchDiff,
      code: matchCode,
      language: matchLang,
      runtime: matchRuntime,
      memory: matchMemory,
      isRated,
      opponent: {
        username: b.opponentName || 'BOT',
        rating: b.opponentRating || 1500,
        flag: b.opponentFlag || (isBot ? '🤖' : (userObj.countryFlag || '')),
        avatar: (b.opponentName && !isBot) ? b.opponentName.charAt(0).toUpperCase() : '🤖'
      },
      userResult: userScore,
      opponentResult: opponentScore,
      resultType: isDraw ? 'draw' : (isWin ? 'win' : 'loss'),
      testAccuracy: b.testAccuracy || '100%',
      moves: b.moves || 28,
      date: new Date(b.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      ratingChange: changeStr
    };
  });

  const maxRating = Math.max(
    userObj.ratings?.bullet || 1500,
    userObj.ratings?.blitz || 1500,
    userObj.ratings?.rapid || 1500,
    userObj.ratings?.classical || 1500
  );

  let league = 'Gold League';
  if (maxRating >= 2000) league = 'Legend League';
  else if (maxRating >= 1800) league = 'Master League';
  else if (maxRating >= 1650) league = 'Diamond League';
  else if (maxRating >= 1500) league = 'Gold League';
  else league = 'Silver League';

  const bulletGain = (userObj.ratings?.bullet || 1500) - 1500;
  const blitzGain = (userObj.ratings?.blitz || 1500) - 1500;
  const rapidGain = (userObj.ratings?.rapid || 1500) - 1500;

  // Real rating history points per mode
  const ratingHistories = await RatingHistory.find({ userId: user._id }).sort({ createdAt: 1 });
  const ratingCurves = {
    rapid: [],
    blitz: [],
    bullet: []
  };

  ratingHistories.forEach(rh => {
    const m = rh.mode?.toLowerCase();
    if (ratingCurves[m]) {
      ratingCurves[m].push(rh.newRating);
    }
  });

  // If no RatingHistory documents yet but realBattles exist, reconstruct trajectory chronologically
  if (ratingCurves.rapid.length === 0 && ratingCurves.blitz.length === 0 && ratingCurves.bullet.length === 0 && realBattles.length > 0) {
    const chrono = [...realBattles].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    let curRapid = 1500;
    let curBlitz = 1500;
    let curBullet = 1500;
    chrono.forEach(b => {
      const isBot = !b.opponentName || ['bot', 'stockfish', 'computer', 'algo_expert', 'deep_recursion', 'matrix_solver', 'ai_'].some(k => b.opponentName.toLowerCase().includes(k));
      const isRated = b.isRated === true && !isBot;
      if (!isRated) return; // Non-rated matches do not alter ratings!

      const m = b.mode?.toLowerCase() || 'blitz';
      const userP = (b.players && b.players.find(p => p.userId && p.userId.toString() === user._id.toString())) || (b.players && b.players[0]) || {};
      const isWin = b.winnerId && b.winnerId.toString() === user._id.toString();
      const isDraw = b.isDraw || userP.score === 0.5;
      const chg = userP.ratingChange !== undefined ? userP.ratingChange : (isWin ? 16 : isDraw ? 0 : -12);
      if (m === 'rapid') { curRapid += chg; ratingCurves.rapid.push(curRapid); }
      else if (m === 'bullet') { curBullet += chg; ratingCurves.bullet.push(curBullet); }
      else { curBlitz += chg; ratingCurves.blitz.push(curBlitz); }
    });
  }

  // Real per-mode statistics (Rapid, Blitz, Bullet, Classical)
  const modes = ['rapid', 'blitz', 'bullet', 'classical'];
  const modeStats = {};

  modes.forEach(m => {
    const curR = userObj.ratings?.[m] || 1500;
    const matches = matchHistory.filter(match => match.mode?.toLowerCase() === m);
    const total = matches.length;
    const wins = matches.filter(match => match.resultType === 'win').length;
    const losses = matches.filter(match => match.resultType === 'loss').length;
    const draws = matches.filter(match => match.resultType === 'draw').length;

    const curve = ratingCurves[m] || [];
    const allPts = [1500, ...curve];

    // When 0 contests in that format: keep minimum and maximum rating default 1500!
    const bestRating = total > 0 ? Math.max(...allPts, curR) : 1500;
    const lowestRating = total > 0 ? Math.min(...allPts, curR) : 1500;

    const winRate = total > 0 ? Math.round((wins / total) * 100) : 0;
    const drawRate = total > 0 ? Math.round((draws / total) * 100) : 0;
    const lossRate = total > 0 ? Math.max(0, 100 - winRate - drawRate) : 0;

    modeStats[m] = {
      currentRating: curR,
      bestRating,
      lowestRating,
      totalPlayed: total,
      wins,
      losses,
      draws,
      winRate,
      drawRate,
      lossRate
    };
  });

  // Real clubs user belongs to or created
  const realClubs = await Club.find({
    $or: [
      { owner: user._id },
      { 'members.user': user._id }
    ]
  });

  let clubsList = [];
  if (realClubs && realClubs.length > 0) {
    clubsList = realClubs.map(c => {
      const memberRecord = c.members?.find(m => m.user && m.user.toString() === user._id.toString());
      const isOwner = c.owner ? c.owner.toString() === user._id.toString() : false;
      return {
        id: c._id.toString(),
        slug: c.slug,
        name: c.name,
        description: c.description,
        members: c.members?.length || 1,
        role: isOwner ? 'owner' : (memberRecord?.role || 'member'),
        icon: c.icon || '💻',
        location: c.location || 'Global',
        isOwner
      };
    });
  } else {
    const defaultClub = await Club.findOne({ slug: 'rec-banda-coding-club' });
    if (defaultClub) {
      const isOwner = defaultClub.owner ? defaultClub.owner.toString() === user._id.toString() : false;
      clubsList = [{
        id: defaultClub._id.toString(),
        slug: defaultClub.slug,
        name: defaultClub.name,
        description: defaultClub.description,
        members: defaultClub.members?.length || 1,
        role: isOwner ? 'owner' : 'member',
        icon: defaultClub.icon || '💻',
        location: defaultClub.location || 'REC Banda, India',
        isOwner
      }];
    }
  }

  return {
    user: {
      ...userObj,
      displayName: userObj.displayName || userObj.username,
      avatar: userObj.avatar || '',
      bio: userObj.bio || '',
      about: userObj.bio || '',
      country: userObj.country || '',
      countryFlag: userObj.countryFlag || '',
      location: userObj.location || '',
      organization: userObj.organization || '',
      streak: effectiveStreak,
      league,
      leagueRank: 17,
      friendsCount,
      viewsCount: userObj.profileViews || 0,
      isOnline: isUserOnline(userObj.username),
      lastOnline: isUserOnline(userObj.username) ? 'Active now' : formatTimeAgo(userObj.lastActive || userObj.updatedAt || userObj.createdAt),
      joinedDate: userObj.createdAt ? new Date(userObj.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Sep 11, 2026',
      ratings: {
        bullet: userObj.ratings?.bullet || 1500,
        blitz: userObj.ratings?.blitz || 1500,
        rapid: userObj.ratings?.rapid || 1500,
        classical: userObj.ratings?.classical || 1500
      },
      ratingGains: {
        bullet: bulletGain >= 0 ? `+${bulletGain}` : `${bulletGain}`,
        blitz: blitzGain >= 0 ? `+${blitzGain}` : `${blitzGain}`,
        rapid: rapidGain >= 0 ? `+${rapidGain}` : `${rapidGain}`
      },
      ratingCurves,
      modeStats,
      preferredTheme: {
        title: `${userObj.displayName || userObj.username}'s Theme`,
        language: 'C++20 / Python 3',
        editor: 'One Dark Pro',
        font: 'JetBrains Mono'
      },
      clubs: clubsList,
      awardsCount: realBattles.length > 0 ? Math.min(286, 10 + realBattles.length * 5) : 0,
      awards: [
        { id: 'streak-master', name: 'Hot Streak', desc: 'Active solver', icon: '🔥', color: '#f59e0b' },
        { id: 'speed-demon', name: 'Speed Demon', desc: 'Fast problem solver', icon: '⚡', color: '#ef4444' }
      ],
      solvedStats,
      recentSolved: solvedList.slice(0, 30),
      allSolvedProblems: solvedList,
      socialLinks: userObj.socialLinks || {
        github: '',
        linkedin: '',
        leetcode: '',
        codeforces: '',
        website: '',
        other: '',
        custom: []
      }
    },
    socialLinks: userObj.socialLinks || {
      github: '',
      linkedin: '',
      leetcode: '',
      codeforces: '',
      website: '',
      other: '',
      custom: []
    },
    solvedStats,
    recentSolved: solvedList.slice(0, 30),
    allSolvedProblems: solvedList,
    externalProfiles,
    matchHistory,
    totalGames: matchHistory.length,
    modeStats
  };
};

// @route   POST /api/users/friend-request/:username
// @desc    Send or accept friend request
// @access  Private
router.post('/friend-request/:username', protect, async (req, res) => {
  try {
    const targetUsername = (req.params.username || '').toLowerCase().trim();
    if (
      targetUsername.includes('bot') ||
      targetUsername.includes('stockfish') ||
      targetUsername.includes('computer') ||
      targetUsername.includes('deepcoder')
    ) {
      return res.status(400).json({ message: 'Bots cannot be added as friends.' });
    }

    const targetUser = await User.findOne({ username: targetUsername });
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (targetUser.isBot || targetUser.role === 'BOT') {
      return res.status(400).json({ message: 'Bots cannot be added as friends.' });
    }

    if (targetUser._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot add yourself as a friend' });
    }

    let friendship = await Friendship.findOne({
      $or: [
        { requesterId: req.user._id, recipientId: targetUser._id },
        { requesterId: targetUser._id, recipientId: req.user._id }
      ]
    });

    if (friendship) {
      friendship.status = 'ACCEPTED';
      await friendship.save();
    } else {
      friendship = await Friendship.create({
        requesterId: req.user._id,
        recipientId: targetUser._id,
        status: 'ACCEPTED'
      });
    }

    const friendsCount = await Friendship.countDocuments({
      $or: [
        { requesterId: targetUser._id, status: 'ACCEPTED' },
        { recipientId: targetUser._id, status: 'ACCEPTED' }
      ]
    });

    res.json({
      success: true,
      message: `Friend added successfully!`,
      friendsCount
    });
  } catch (error) {
    console.error('Friend request error:', error);
    res.status(500).json({ message: 'Server error adding friend' });
  }
});

// @route   GET /api/users/:username/friends
// @desc    Get all accepted friends of a user with online status
// @access  Public
router.get('/:username/friends', async (req, res) => {
  try {
    const username = (req.params.username || '').toLowerCase().trim();
    const targetUser = await User.findOne({ username });
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    const friendships = await Friendship.find({
      $or: [
        { requesterId: targetUser._id, status: 'ACCEPTED' },
        { recipientId: targetUser._id, status: 'ACCEPTED' }
      ]
    }).populate('requesterId', 'username displayName avatar ratings solvedProblemsCount tier badge country')
      .populate('recipientId', 'username displayName avatar ratings solvedProblemsCount tier badge country');

    const friends = friendships.map(f => {
      const isRequester = f.requesterId && f.requesterId._id.toString() === targetUser._id.toString();
      const friendObj = isRequester ? f.recipientId : f.requesterId;
      if (!friendObj) return null;
      if (friendObj.isBot || friendObj.role === 'BOT') return null;

      const friendUsernameClean = (friendObj.username || '').toLowerCase().trim();
      if (friendUsernameClean.includes('bot') || friendUsernameClean.includes('stockfish') || friendUsernameClean.includes('deepcoder')) return null;
      const isOnline = isUserOnline(friendUsernameClean);

      return {
        _id: friendObj._id,
        username: friendObj.username,
        displayName: friendObj.displayName || friendObj.username,
        avatar: friendObj.avatar || '',
        ratings: friendObj.ratings || { blitz: 1500, rapid: 1500, bullet: 1500 },
        solvedProblemsCount: friendObj.solvedProblemsCount || 0,
        country: friendObj.country || 'Global',
        tier: friendObj.tier || 'Novice',
        badge: friendObj.badge || 'Coder',
        isOnline,
        friendshipId: f._id,
        friendsSince: f.createdAt
      };
    }).filter(Boolean);

    res.json({
      success: true,
      friends,
      totalCount: friends.length
    });
  } catch (error) {
    console.error('Error fetching friends list:', error);
    res.status(500).json({ message: 'Server error loading friends' });
  }
});

// @route   DELETE /api/users/friend/:username
// @desc    Remove a friend
// @access  Private
router.delete('/friend/:username', protect, async (req, res) => {
  try {
    const targetUser = await User.findOne({ username: req.params.username.toLowerCase().trim() });
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    await Friendship.deleteMany({
      $or: [
        { requesterId: req.user._id, recipientId: targetUser._id },
        { requesterId: targetUser._id, recipientId: req.user._id }
      ]
    });

    res.json({
      success: true,
      message: `Friend removed successfully.`
    });
  } catch (error) {
    console.error('Error removing friend:', error);
    res.status(500).json({ message: 'Server error removing friend' });
  }
});

// @route   GET /api/users/me
// @desc    Get current user profile
// @access  Private
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const externalProfiles = await ExternalProfile.find({ userId: user._id })
      .sort({ displayOrder: 1 });

    const formatted = await formatUserProfile(user, externalProfiles);
    res.json(formatted);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/users/profile
// @desc    Update current user's profile (location, about/bio, dp/avatar, displayName, organization)
// @access  Private
router.put('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { displayName, location, bio, about, avatar, organization, country, countryFlag, socialLinks } = req.body;

    if (displayName !== undefined) user.displayName = displayName.trim();
    if (location !== undefined) user.location = location.trim();
    if (bio !== undefined || about !== undefined) {
      user.bio = (bio !== undefined ? bio : about).trim();
    }
    if (avatar !== undefined) user.avatar = avatar;
    if (organization !== undefined) user.organization = organization.trim();
    if (country !== undefined) user.country = country.trim();
    if (countryFlag !== undefined) user.countryFlag = countryFlag.trim();
    if (socialLinks !== undefined && typeof socialLinks === 'object') {
      user.socialLinks = {
        github: (socialLinks.github || '').trim(),
        linkedin: (socialLinks.linkedin || '').trim(),
        leetcode: (socialLinks.leetcode || '').trim(),
        codeforces: (socialLinks.codeforces || '').trim(),
        website: (socialLinks.website || '').trim(),
        other: (socialLinks.other || '').trim(),
        custom: Array.isArray(socialLinks.custom)
          ? socialLinks.custom
              .filter(c => c && (c.url || '').trim())
              .map(c => ({
                label: (c.label || '').trim(),
                url: (c.url || '').trim()
              }))
          : []
      };
    }

    await user.save();

    const externalProfiles = await ExternalProfile.find({ userId: user._id })
      .sort({ displayOrder: 1 });

    const formatted = await formatUserProfile(user, externalProfiles);
    res.json({
      message: 'Profile updated successfully',
      ...formatted
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ message: 'Server error updating profile', error: error.message });
  }
});

// @route   GET /api/users/:username
// @desc    Get public profile by username
// @access  Public
router.get('/:username', async (req, res) => {
  try {
    const usernameParam = req.params.username ? req.params.username.toLowerCase().trim() : '';
    if (!usernameParam || usernameParam === 'null' || usernameParam === 'undefined') {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = await User.findOne({ username: usernameParam })
      .select('-password -email');
      
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Increment profile views dynamically
    user.profileViews = (user.profileViews || 0) + 1;
    await user.save();

    const externalProfiles = await ExternalProfile.find({ userId: user._id, isVisible: true })
      .sort({ displayOrder: 1 });

    const formatted = await formatUserProfile(user, externalProfiles);
    res.json(formatted);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/users/external-profiles
// @desc    Add or update external profile
// @access  Private
router.post('/external-profiles', protect, async (req, res) => {
  try {
    const { platform, username, profileUrl, displayOrder, isVisible } = req.body;

    const newProfile = await ExternalProfile.create({
      userId: req.user._id,
      platform,
      username,
      profileUrl,
      displayOrder: displayOrder || 0,
      isVisible: isVisible !== undefined ? isVisible : true
    });

    res.status(201).json(newProfile);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/users/external-profiles/:id
// @desc    Delete external profile
// @access  Private
router.delete('/external-profiles/:id', protect, async (req, res) => {
  try {
    const profile = await ExternalProfile.findOne({ _id: req.params.id, userId: req.user._id });
    
    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    await profile.deleteOne();
    res.json({ message: 'Profile removed' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
