import { Server } from 'socket.io';
import Battle from './models/Battle.js';
import User from './models/User.js';
import { selectBattleProblems } from './utils/battleProblemSelector.js';

let io;
const activeUsers = new Map(); // socketId -> userId
const userSockets = new Map(); // usernameLower -> Set<socketId>
const userIdSockets = new Map(); // userId -> Set<socketId>
const socketToUser = new Map(); // socketId -> { userId, username, rating, avatar }
const pendingChallenges = new Map(); // challengeId -> ChallengeData
const matchmakingQueue = []; // Users waiting for a game

// Global Open Challenges Lobby registry: challengeId -> OpenChallengeData
export const openChallenges = new Map();

// Concluded Battles registry: battleId -> { winnerUsername, winnerId, reason, concludedAt }
export const concludedBattles = new Map();

export const isBattleConcluded = (battleId) => {
  if (!battleId) return false;
  return concludedBattles.has(String(battleId));
};

export const markBattleConcluded = (battleId, { winnerUsername, winnerId, reason } = {}) => {
  if (!battleId) return;
  const bId = String(battleId);
  concludedBattles.set(bId, {
    winnerUsername: winnerUsername || 'Opponent',
    winnerId: winnerId || null,
    reason: reason || 'win',
    concludedAt: Date.now()
  });
  if (liveBattles.has(bId)) {
    liveBattles.delete(bId);
    if (io) io.emit('live:top_battle_update', getTopLiveBattle());
  }
};

export const getPublicOpenChallenges = () => {
  return Array.from(openChallenges.values())
    .map(c => ({
      challengeId: c.challengeId,
      creator: c.creator,
      mode: c.mode,
      timeControl: c.timeControl,
      time: c.time,
      problemsCount: c.problemsCount,
      isRated: c.isRated,
      difficulty: c.difficulty,
      createdAt: c.createdAt
    }))
    .sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
};

const clearUserOpenChallenges = (userId, username, excludeChallengeId = null) => {
  let changed = false;
  const usernameLower = (username || '').toLowerCase().trim();
  openChallenges.forEach((chal, cId) => {
    if (cId === excludeChallengeId) return;
    const chalUser = (chal.creator?.username || '').toLowerCase().trim();
    const isSameUser = (userId && chal.creator?.userId && String(userId) === String(chal.creator.userId)) ||
                       (usernameLower && chalUser === usernameLower);
    if (isSameUser) {
      openChallenges.delete(cId);
      changed = true;
    }
  });
  return changed;
};

// Active live battles registry: battleId -> BattleState
export const liveBattles = new Map();
const socketToBattle = new Map(); // socketId -> battleId
export const battleCodeStorage = new Map(); // battleId -> Map<usernameLower, { username, code, language, testsPassed, testsTotal, updatedAt }>

export const isUserOnline = (username) => {
  if (!username) return false;
  const set = userSockets.get(username.toLowerCase().trim());
  return Boolean(set && set.size > 0);
};

export const getOnlineUsernames = () => {
  return Array.from(userSockets.keys()).filter(u => {
    const set = userSockets.get(u);
    return set && set.size > 0;
  });
};

/**
 * Calculates real-time online coders count:
 * Counts unique registered users logged in plus any guest visitor connections.
 * Ensures the value is strictly authentic and never dummy.
 */
export const getOnlineCodersCount = () => {
  const loggedInUsers = getOnlineUsernames();
  let guestSockets = 0;
  if (io && io.sockets && io.sockets.sockets) {
    for (const [sId] of io.sockets.sockets) {
      if (!socketToUser.has(sId)) {
        guestSockets++;
      }
    }
  }
  const total = loggedInUsers.length + guestSockets;
  return Math.max(total, 1);
};

/**
 * Calculates real-time count of active ongoing battles.
 * Automatically cleans up stale matches older than 10 minutes.
 */
export const getRunningBattlesCount = () => {
  const now = Date.now();
  let count = 0;
  for (const [battleId, b] of liveBattles.entries()) {
    if (now - (b.lastActivity || b.startedAt || now) > 600000) {
      liveBattles.delete(battleId);
      continue;
    }
    if (b.status === 'IN_PROGRESS') {
      count++;
    }
  }
  return count;
};

/**
 * Returns platform statistics with zero dummy data:
 * - onlineCoders: strictly real online users/visitors
 * - runningBattles: battles currently in progress
 * - finishedBattles: total matches completed or resigned in DB till today
 */
export const getPlatformStats = async () => {
  const onlineCoders = getOnlineCodersCount();
  const runningBattles = getRunningBattlesCount();
  let finishedBattles = 0;
  try {
    finishedBattles = await Battle.countDocuments({
      status: { $in: ['COMPLETED', 'RESIGNED', 'ABANDONED', 'DRAW'] }
    });
  } catch (err) {
    console.warn('Error counting finished battles:', err.message);
  }
  return {
    onlineCoders,
    runningBattles,
    finishedBattles
  };
};

/**
 * Broadcasts real-time platform statistics to all connected clients
 */
export const broadcastPlatformStats = async () => {
  try {
    if (!io) return;
    const stats = await getPlatformStats();
    io.emit('stats:update', stats);
  } catch (err) {
    console.warn('Platform stats broadcast error:', err.message);
  }
};


/**
 * Returns the currently active live battle with the highest player rating.
 */
export const getTopLiveBattle = () => {
  const now = Date.now();
  // Filter active battles with activity in the last 2 minutes
  const activeList = Array.from(liveBattles.values()).filter(b => {
    return b.status === 'IN_PROGRESS' && (now - (b.lastActivity || b.startedAt) < 120000);
  });

  if (activeList.length === 0) {
    return null;
  }

  // Sort descending by highest player rating
  activeList.sort((a, b) => (b.topRating || 0) - (a.topRating || 0));
  const top = activeList[0];

  const pRating = top.player?.rating || 1500;
  const oRating = top.opponent?.rating || 1500;

  // Show the POV of whoever has the higher rating
  const isPlayerTop = pRating >= oRating;
  const povPlayer = isPlayerTop ? top.player : top.opponent;
  const otherPlayer = isPlayerTop ? top.opponent : top.player;

  return {
    isRealLive: true,
    battleId: top.battleId,
    problemSlug: top.problemSlug,
    problemTitle: top.problemTitle,
    mode: top.mode,
    timeControl: top.timeControl,
    timeLeft: top.timeLeft,
    startedAt: top.startedAt,
    player: povPlayer,
    opponent: otherPlayer,
    topRating: Math.max(pRating, oRating),
    activeCount: activeList.length
  };
};

export const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket) => {
    // Send immediate platform stats & online coders list to connecting socket
    getPlatformStats().then(stats => socket.emit('stats:update', stats)).catch(() => {});
    socket.emit('presence:online_list', getOnlineUsernames());
    broadcastPlatformStats();

    socket.on('presence:get_online', () => {
      socket.emit('presence:online_list', getOnlineUsernames());
    });

    // 1. Presence registration
    socket.on('presence:online', (userData) => {
      if (!userData) return;
      const userId = userData.userId || userData.id || userData._id;
      const usernameRaw = userData.username || '';
      const usernameClean = usernameRaw.toLowerCase().trim();
      if (!usernameClean) return;

      const userRecord = {
        userId,
        username: usernameRaw,
        rating: userData.rating || 1500,
        avatar: userData.avatar || ''
      };

      socketToUser.set(socket.id, userRecord);
      activeUsers.set(socket.id, userId);

      if (!userSockets.has(usernameClean)) {
        userSockets.set(usernameClean, new Set());
      }
      userSockets.get(usernameClean).add(socket.id);

      if (userId) {
        const uIdStr = String(userId);
        if (!userIdSockets.has(uIdStr)) {
          userIdSockets.set(uIdStr, new Set());
        }
        userIdSockets.get(uIdStr).add(socket.id);
      }

      // Keep DB lastActive timestamp up-to-date
      User.updateOne({ username: usernameClean }, { $set: { lastActive: new Date() } }).catch(() => {});

      io.emit('presence:update', { userId, username: usernameRaw, status: 'ONLINE' });
      broadcastPlatformStats();
    });

    // 2. Direct Friend / User Challenge Handling
    socket.on('challenge:send', ({ toUsername, mode, timeControl, isRated, problemsCount, difficulty, problemList, durationSeconds }) => {
      const senderUser = socketToUser.get(socket.id);
      if (!senderUser) {
        socket.emit('challenge:error', { message: 'You must be logged in to challenge another player.' });
        return;
      }

      const targetUsernameClean = (toUsername || '').toLowerCase().trim();
      if (!targetUsernameClean) {
        socket.emit('challenge:error', { message: 'Please provide a valid username to challenge.' });
        return;
      }

      if (targetUsernameClean === senderUser.username.toLowerCase()) {
        socket.emit('challenge:error', { message: 'You cannot challenge yourself to a duel.' });
        return;
      }

      const recipientSockets = userSockets.get(targetUsernameClean);
      if (!recipientSockets || recipientSockets.size === 0) {
        socket.emit('challenge:error', {
          message: `"${toUsername}" is currently offline. Challenges can only be sent to online players.`,
          isOffline: true,
          targetUsername: toUsername
        });
        return;
      }

      const challengeId = `chal_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
      const challengeData = {
        challengeId,
        challenger: {
          socketId: socket.id,
          userId: senderUser.userId,
          username: senderUser.username,
          rating: senderUser.rating || 1500,
          avatar: senderUser.avatar || ''
        },
        targetUsername: toUsername,
        targetSockets: Array.from(recipientSockets),
        config: {
          mode: mode || 'Bullet',
          timeControl: timeControl || '10 + 0',
          isRated: isRated !== undefined ? isRated : true,
          problemsCount: problemsCount || 1,
          difficulty: difficulty || '',
          problemList: Array.isArray(problemList) && problemList.length > 0 ? problemList : ['two-sum'],
          durationSeconds: durationSeconds || 600
        },
        createdAt: Date.now()
      };

      pendingChallenges.set(challengeId, challengeData);

      // Notify challenger that invitation is pending
      socket.emit('challenge:waiting', {
        challengeId,
        targetUsername: toUsername,
        config: challengeData.config
      });

      // Dispatch incoming challenge alert to recipient's active socket(s)
      recipientSockets.forEach(sId => {
        io.to(sId).emit('challenge:incoming', {
          challengeId,
          challenger: challengeData.challenger,
          config: challengeData.config
        });
      });

      // Auto-expire unanswered challenge after 40 seconds
      setTimeout(() => {
        if (pendingChallenges.has(challengeId)) {
          const chal = pendingChallenges.get(challengeId);
          pendingChallenges.delete(challengeId);
          io.to(chal.challenger.socketId).emit('challenge:declined', {
            challengeId,
            targetUsername: toUsername,
            message: `Challenge to "${toUsername}" expired with no response.`
          });
          chal.targetSockets.forEach(sId => {
            io.to(sId).emit('challenge:cancelled', { challengeId, reason: 'timeout' });
          });
        }
      }, 40000);
    });

    socket.on('challenge:accept', async ({ challengeId }) => {
      const challenge = pendingChallenges.get(challengeId);
      if (!challenge) {
        socket.emit('challenge:error', { message: 'This challenge has already expired or was cancelled.' });
        return;
      }

      pendingChallenges.delete(challengeId);

      const acceptingUser = socketToUser.get(socket.id);
      const battleId = `battle_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

      // Dynamically select battle problems on backend so neither player sees them in advance!
      let pList = await selectBattleProblems({
        mode: challenge.config.mode,
        difficulty: challenge.config.difficulty,
        count: challenge.config.problemsCount
      });
      if (!pList || pList.length === 0) {
        pList = ['two-sum'];
      }
      challenge.config.problemList = pList;

      const initialSlug = pList[0] || 'two-sum';
      const ratedParam = challenge.config.isRated ? '1' : '0';
      const probListParam = pList.join(',');

      const opponentDisplayName = acceptingUser?.username || challenge.targetUsername;
      const opponentRating = acceptingUser?.rating || 1500;

      // Clear any active open challenges for both players so they don't linger on the board
      clearUserOpenChallenges(challenge.challenger.userId, challenge.challenger.username);
      if (acceptingUser) {
        clearUserOpenChallenges(acceptingUser.userId, acceptingUser.username);
      }
      io.emit('open_challenges:update', getPublicOpenChallenges());

      // Challenger problem URL (Challenger plays as challenger against opponent)
      const challengerUrl = `/problem/${initialSlug}?battleId=${battleId}&challenge=${encodeURIComponent(challenge.challenger.username)}&opponent=${encodeURIComponent(opponentDisplayName)}&opponentRating=${opponentRating}&mode=${encodeURIComponent(challenge.config.mode)}&time=${encodeURIComponent(challenge.config.timeControl)}&problems=${challenge.config.problemsCount}&problemList=${encodeURIComponent(probListParam)}&rated=${ratedParam}`;

      // Recipient problem URL (Recipient plays as themselves against challenger)
      const recipientUrl = `/problem/${initialSlug}?battleId=${battleId}&challenge=${encodeURIComponent(challenge.challenger.username)}&opponent=${encodeURIComponent(challenge.challenger.username)}&opponentRating=${challenge.challenger.rating}&mode=${encodeURIComponent(challenge.config.mode)}&time=${encodeURIComponent(challenge.config.timeControl)}&problems=${challenge.config.problemsCount}&problemList=${encodeURIComponent(probListParam)}&rated=${ratedParam}`;

      // Emit to Challenger socket
      io.to(challenge.challenger.socketId).emit('challenge:started', {
        battleId,
        url: challengerUrl,
        opponent: {
          username: opponentDisplayName,
          rating: opponentRating
        },
        config: challenge.config
      });

      // Emit to Recipient socket (current socket accepting)
      socket.emit('challenge:started', {
        battleId,
        url: recipientUrl,
        opponent: challenge.challenger,
        config: challenge.config
      });
    });

    socket.on('challenge:decline', ({ challengeId }) => {
      const challenge = pendingChallenges.get(challengeId);
      if (!challenge) return;

      const decliningUser = socketToUser.get(socket.id);
      const declinerName = decliningUser?.username || challenge.targetUsername;

      pendingChallenges.delete(challengeId);

      io.to(challenge.challenger.socketId).emit('challenge:declined', {
        challengeId,
        targetUsername: declinerName,
        message: `${declinerName} declined your battle request.`
      });
    });

    socket.on('challenge:cancel', ({ challengeId }) => {
      const challenge = pendingChallenges.get(challengeId);
      if (!challenge) return;

      pendingChallenges.delete(challengeId);

      challenge.targetSockets.forEach(sId => {
        io.to(sId).emit('challenge:cancelled', {
          challengeId,
          message: `${challenge.challenger.username} cancelled the challenge.`
        });
      });
    });

    // ==========================================
    // 3. GLOBAL OPEN CHALLENGES LOBBY & THEME AUTO-MATCHING
    // ==========================================
    socket.on('open_challenge:create', ({ mode, timeControl, time, isRated, problemsCount, difficulty, problemList, durationSeconds }) => {
      const senderUser = socketToUser.get(socket.id);
      if (!senderUser) {
        socket.emit('challenge:error', { message: 'You must be logged in to create a challenge.' });
        return;
      }

      const senderUsernameLower = (senderUser.username || '').toLowerCase().trim();
      const targetMode = mode || 'Bullet';
      const targetTimeControl = timeControl || time || '10 + 0';
      const targetIsRated = isRated !== undefined ? isRated : true;
      const targetProblemsCount = problemsCount || 1;
      const targetDifficulty = difficulty || '';
      const targetProblemList = Array.isArray(problemList) && problemList.length > 0 ? problemList : ['two-sum'];
      const targetDurationSeconds = durationSeconds || 600;

      // 1. Check for Auto-Match by Same Theme (e.g. same mode and timeControl)
      // "and also if someone other is challenging at same theme as me, eg. bullet 10 minute, then both player battle begin automatically"
      let matchedChallenge = null;
      for (const [cId, existingChal] of openChallenges.entries()) {
        const existingUsernameLower = (existingChal.creator.username || '').toLowerCase().trim();
        // Cannot match with oneself
        if (existingUsernameLower === senderUsernameLower || (senderUser.userId && existingChal.creator.userId && String(senderUser.userId) === String(existingChal.creator.userId))) {
          continue;
        }

        // Check if theme matches: same mode, same time control, and compatible rated preference
        const sameMode = (existingChal.mode || '').toLowerCase() === targetMode.toLowerCase();
        const sameTime = (existingChal.timeControl || '').replace(/\s+/g, '').toLowerCase() === targetTimeControl.replace(/\s+/g, '').toLowerCase();
        const sameRated = Boolean(existingChal.isRated) === Boolean(targetIsRated);

        if (sameMode && sameTime && sameRated) {
          matchedChallenge = existingChal;
          break;
        }
      }

      if (matchedChallenge) {
        // INSTANT THEME AUTO-MATCH!
        openChallenges.delete(matchedChallenge.challengeId);
        clearUserOpenChallenges(senderUser.userId, senderUser.username);
        clearUserOpenChallenges(matchedChallenge.creator.userId, matchedChallenge.creator.username);

        const battleId = `battle_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
        const pList = matchedChallenge.problemList || targetProblemList;
        const initialSlug = pList[0] || 'two-sum';
        const ratedParam = targetIsRated ? '1' : '0';
        const probListParam = pList.join(',');

        // URL for existing challenger (matchedChallenge.creator)
        const chalUrl = `/problem/${initialSlug}?battleId=${battleId}&challenge=${encodeURIComponent(matchedChallenge.creator.username)}&opponent=${encodeURIComponent(senderUser.username)}&opponentRating=${senderUser.rating || 1500}&mode=${encodeURIComponent(targetMode)}&time=${encodeURIComponent(targetTimeControl)}&problems=${targetProblemsCount}&problemList=${encodeURIComponent(probListParam)}&rated=${ratedParam}`;

        // URL for new challenger (senderUser)
        const userUrl = `/problem/${initialSlug}?battleId=${battleId}&challenge=${encodeURIComponent(matchedChallenge.creator.username)}&opponent=${encodeURIComponent(matchedChallenge.creator.username)}&opponentRating=${matchedChallenge.creator.rating || 1500}&mode=${encodeURIComponent(targetMode)}&time=${encodeURIComponent(targetTimeControl)}&problems=${targetProblemsCount}&problemList=${encodeURIComponent(probListParam)}&rated=${ratedParam}`;

        // Notify both players simultaneously
        io.to(matchedChallenge.creator.socketId).emit('challenge:started', {
          battleId,
          url: chalUrl,
          opponent: {
            username: senderUser.username,
            rating: senderUser.rating || 1500
          },
          config: {
            mode: targetMode,
            timeControl: targetTimeControl,
            isRated: targetIsRated,
            problemsCount: targetProblemsCount
          }
        });

        socket.emit('challenge:started', {
          battleId,
          url: userUrl,
          opponent: {
            username: matchedChallenge.creator.username,
            rating: matchedChallenge.creator.rating || 1500
          },
          config: {
            mode: targetMode,
            timeControl: targetTimeControl,
            isRated: targetIsRated,
            problemsCount: targetProblemsCount
          }
        });

        io.emit('open_challenges:update', getPublicOpenChallenges());
        return;
      }

      // No immediate theme match -> Post to Open Challenges Lobby!
      // Cancel any prior open challenge by this user to keep only 1 active challenge per user
      clearUserOpenChallenges(senderUser.userId, senderUser.username);

      const challengeId = `open_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
      const newOpenChallenge = {
        challengeId,
        creator: {
          socketId: socket.id,
          userId: senderUser.userId,
          username: senderUser.username,
          rating: senderUser.rating || 1500,
          avatar: senderUser.avatar || ''
        },
        mode: targetMode,
        timeControl: targetTimeControl,
        time: time || targetTimeControl,
        problemsCount: targetProblemsCount,
        isRated: targetIsRated,
        difficulty: targetDifficulty,
        problemList: targetProblemList,
        durationSeconds: targetDurationSeconds,
        createdAt: Date.now()
      };

      openChallenges.set(challengeId, newOpenChallenge);

      socket.emit('open_challenge:created', {
        challengeId,
        challenge: newOpenChallenge
      });

      io.emit('open_challenges:update', getPublicOpenChallenges());

      // Auto-expire open challenge after 10 minutes if unanswered
      setTimeout(() => {
        if (openChallenges.has(challengeId)) {
          openChallenges.delete(challengeId);
          io.emit('open_challenges:update', getPublicOpenChallenges());
        }
      }, 600000);
    });

    socket.on('open_challenge:accept', async ({ challengeId }) => {
      const acceptingUser = socketToUser.get(socket.id);
      if (!acceptingUser) {
        socket.emit('challenge:error', { message: 'You must be logged in to accept a challenge.' });
        return;
      }

      const challenge = openChallenges.get(challengeId);
      if (!challenge) {
        socket.emit('challenge:error', { message: 'This challenge has already been accepted or cancelled.' });
        return;
      }

      const acceptingUsernameLower = (acceptingUser.username || '').toLowerCase().trim();
      const creatorUsernameLower = (challenge.creator.username || '').toLowerCase().trim();

      if (acceptingUsernameLower === creatorUsernameLower) {
        socket.emit('challenge:error', { message: 'You cannot accept your own challenge.' });
        return;
      }

      // Requirement:
      // "but lets take a sitution i send the challenge then that challenge get listed on there , but if i accept any other challenge , then my challange should get disappear from challange list"
      // Clean up accepting user's own open challenge(s) so their challenge disappears immediately:
      clearUserOpenChallenges(acceptingUser.userId, acceptingUser.username);

      // Remove the accepted challenge
      openChallenges.delete(challengeId);

      const battleId = `battle_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

      // Dynamically select battle problems on backend so neither player sees them in advance!
      let pList = await selectBattleProblems({
        mode: challenge.mode,
        difficulty: challenge.difficulty,
        count: challenge.problemsCount
      });
      if (!pList || pList.length === 0) {
        pList = ['two-sum'];
      }
      challenge.problemList = pList;

      const initialSlug = pList[0] || 'two-sum';
      const ratedParam = challenge.isRated ? '1' : '0';
      const probListParam = pList.join(',');

      // Challenger URL (original creator)
      const creatorUrl = `/problem/${initialSlug}?battleId=${battleId}&challenge=${encodeURIComponent(challenge.creator.username)}&opponent=${encodeURIComponent(acceptingUser.username)}&opponentRating=${acceptingUser.rating || 1500}&mode=${encodeURIComponent(challenge.mode)}&time=${encodeURIComponent(challenge.timeControl)}&problems=${challenge.problemsCount}&problemList=${encodeURIComponent(probListParam)}&rated=${ratedParam}`;

      // Recipient URL (user accepting)
      const acceptorUrl = `/problem/${initialSlug}?battleId=${battleId}&challenge=${encodeURIComponent(challenge.creator.username)}&opponent=${encodeURIComponent(challenge.creator.username)}&opponentRating=${challenge.creator.rating || 1500}&mode=${encodeURIComponent(challenge.mode)}&time=${encodeURIComponent(challenge.timeControl)}&problems=${challenge.problemsCount}&problemList=${encodeURIComponent(probListParam)}&rated=${ratedParam}`;

      // Emit to creator socket
      io.to(challenge.creator.socketId).emit('challenge:started', {
        battleId,
        url: creatorUrl,
        opponent: {
          username: acceptingUser.username,
          rating: acceptingUser.rating || 1500
        },
        config: {
          mode: challenge.mode,
          timeControl: challenge.timeControl,
          isRated: challenge.isRated,
          problemsCount: challenge.problemsCount
        }
      });

      // Emit to accepting socket
      socket.emit('challenge:started', {
        battleId,
        url: acceptorUrl,
        opponent: {
          username: challenge.creator.username,
          rating: challenge.creator.rating || 1500
        },
        config: {
          mode: challenge.mode,
          timeControl: challenge.timeControl,
          isRated: challenge.isRated,
          problemsCount: challenge.problemsCount
        }
      });

      // Broadcast updated open challenges list to all clients
      io.emit('open_challenges:update', getPublicOpenChallenges());
    });

    socket.on('open_challenge:cancel', ({ challengeId }) => {
      if (challengeId && openChallenges.has(challengeId)) {
        openChallenges.delete(challengeId);
        io.emit('open_challenges:update', getPublicOpenChallenges());
      }
    });

    socket.on('open_challenges:get', () => {
      socket.emit('open_challenges:update', getPublicOpenChallenges());
    });

    // 4. Matchmaking Queue
    socket.on('matchmaking:join', ({ mode, timeControl, isRated, userId, rating }) => {
      const potentialMatchIndex = matchmakingQueue.findIndex(p => 
        p.mode === mode && p.timeControl === timeControl && p.userId !== userId
      );

      if (potentialMatchIndex !== -1) {
        const opponent = matchmakingQueue.splice(potentialMatchIndex, 1)[0];
        io.to(socket.id).emit('matchmaking:found', { opponentId: opponent.userId });
        io.to(opponent.socketId).emit('matchmaking:found', { opponentId: userId });
      } else {
        matchmakingQueue.push({ socketId: socket.id, userId, mode, timeControl, isRated, rating, joinedAt: Date.now() });
      }
    });

    socket.on('matchmaking:leave', () => {
      const idx = matchmakingQueue.findIndex(p => p.socketId === socket.id);
      if (idx !== -1) matchmakingQueue.splice(idx, 1);
    });

    // 4. Battle Room Sync & Peer-to-Peer Relay
    socket.on('battle:join', async (battleId) => {
      if (!battleId) return;
      socket.join(battleId);
      socketToBattle.set(socket.id, battleId);

      // If battle already completed, notify joining socket immediately
      if (isBattleConcluded(battleId)) {
        const info = concludedBattles.get(String(battleId));
        const isDrawMatch = info?.reason === 'draw' || info?.reason === 'time_expired' || info?.winnerUsername === 'Draw';
        socket.emit('battle:already_concluded', {
          battleId,
          winnerUsername: info?.winnerUsername || (isDrawMatch ? 'Draw' : 'Opponent'),
          reason: info?.reason || (isDrawMatch ? 'draw' : 'already_completed'),
          isDraw: isDrawMatch
        });
        return;
      }

      try {
        const existingBattle = await Battle.findOne({
          battleId: String(battleId),
          status: { $in: ['COMPLETED', 'RESIGNED'] }
        });
        if (existingBattle) {
          let winName = existingBattle.winnerUsername || '';
          if (!winName && existingBattle.winnerId) {
            const winUser = await User.findById(existingBattle.winnerId).select('username');
            if (winUser) winName = winUser.username;
          }
          if (!winName) winName = existingBattle.opponentName || 'Opponent';
          const isDrawMatch = existingBattle.isDraw || (!existingBattle.winnerId && existingBattle.status === 'COMPLETED');
          markBattleConcluded(battleId, {
            winnerUsername: isDrawMatch ? 'Draw' : winName,
            winnerId: existingBattle.winnerId,
            reason: isDrawMatch ? 'draw' : 'already_completed'
          });
          socket.emit('battle:already_concluded', {
            battleId,
            winnerUsername: isDrawMatch ? 'Draw' : winName,
            reason: isDrawMatch ? 'draw' : 'already_completed',
            isDraw: isDrawMatch
          });
        }
      } catch {}
    });

    // Relay real peer submission updates
    socket.on('battle:submission', ({ battleId, userId, status, passedCount, totalCount }) => {
      if (!battleId) return;
      socket.to(battleId).emit('battle:peer_submission', { userId, status, passedCount, totalCount });
    });

    // Relay real peer code broadcast
    socket.on('battle:code_update', ({ battleId, code, language, timeLeft, testsPassed, testsTotal, username }) => {
      if (!battleId) return;

      const userRecord = socketToUser.get(socket.id);
      const actualUsername = username || userRecord?.username || 'user';
      const userKey = actualUsername.toLowerCase().trim();

      // Store in memory registry for post-game inspection
      if (!battleCodeStorage.has(battleId)) {
        battleCodeStorage.set(battleId, new Map());
      }
      battleCodeStorage.get(battleId).set(userKey, {
        username: actualUsername !== 'user' ? actualUsername : (userRecord?.username || 'You'),
        userId: userRecord?.userId,
        code: code || '',
        language: language || 'cpp',
        testsPassed: testsPassed || 0,
        testsTotal: testsTotal || 3,
        updatedAt: Date.now()
      });

      // Broadcast to opponent in the same battle room
      socket.to(battleId).emit('battle:peer_code', {
        code,
        language,
        timeLeft,
        testsPassed,
        testsTotal,
        senderSocketId: socket.id,
        senderUsername: actualUsername !== 'user' ? actualUsername : userRecord?.username
      });

      // Update live battle registry if top game
      if (liveBattles.has(battleId)) {
        const battle = liveBattles.get(battleId);
        battle.player.code = code;
        if (language) battle.player.language = language;
        if (timeLeft !== undefined) battle.timeLeft = timeLeft;
        if (testsPassed !== undefined) battle.player.testsPassed = testsPassed;
        if (testsTotal !== undefined) battle.player.testsTotal = testsTotal;
        battle.lastActivity = Date.now();

        const top = getTopLiveBattle();
        if (top && top.battleId === battleId) {
          io.emit('live:code_stream', {
            battleId,
            code,
            language: battle.player.language,
            timeLeft: battle.timeLeft,
            testsPassed: battle.player.testsPassed,
            testsTotal: battle.player.testsTotal,
            username: battle.player.username
          });
        }
      }
    });

    // Relay real peer test update
    socket.on('battle:test_update', ({ battleId, testsPassed, testsTotal }) => {
      if (!battleId) return;
      socket.to(battleId).emit('battle:peer_test_update', { testsPassed, testsTotal });

      if (liveBattles.has(battleId)) {
        const battle = liveBattles.get(battleId);
        if (testsPassed !== undefined) battle.player.testsPassed = testsPassed;
        if (testsTotal !== undefined) battle.player.testsTotal = testsTotal;
        battle.lastActivity = Date.now();
        io.emit('live:top_battle_update', getTopLiveBattle());
      }
    });

    // Relay peer victory event and exchange final code
    socket.on('battle:won', async ({ battleId, winnerUsername, finalCode, language, username }) => {
      if (!battleId) return;
      const bId = String(battleId);
      const userRecord = socketToUser.get(socket.id);
      const actualUsername = username || winnerUsername || userRecord?.username || 'user';
      const userKey = actualUsername.toLowerCase().trim();

      if (finalCode) {
        if (!battleCodeStorage.has(bId)) {
          battleCodeStorage.set(bId, new Map());
        }
        battleCodeStorage.get(bId).set(userKey, {
          username: actualUsername !== 'user' ? actualUsername : (userRecord?.username || winnerUsername),
          userId: userRecord?.userId,
          code: finalCode,
          language: language || 'cpp',
          updatedAt: Date.now()
        });
      }

      // If battle already concluded in-memory, reject duplicate victory broadcast!
      if (isBattleConcluded(bId)) {
        const info = concludedBattles.get(bId);
        socket.emit('battle:already_concluded', {
          battleId: bId,
          winnerUsername: info?.winnerUsername || winnerUsername
        });
        return;
      }

      // Check DB in case of server restart or unrated match already completed
      try {
        const existingBattle = await Battle.findOne({
          battleId: bId,
          status: { $in: ['COMPLETED', 'RESIGNED'] }
        });
        if (existingBattle) {
          let winName = existingBattle.winnerUsername || '';
          if (!winName && existingBattle.winnerId) {
            const winUser = await User.findById(existingBattle.winnerId).select('username');
            if (winUser) winName = winUser.username;
          }
          if (!winName) winName = existingBattle.opponentName || 'Opponent';
          markBattleConcluded(bId, {
            winnerUsername: winName,
            winnerId: existingBattle.winnerId,
            reason: 'already_completed'
          });
          socket.emit('battle:already_concluded', {
            battleId: bId,
            winnerUsername: winName
          });
          return;
        }
      } catch {}

      // Mark legitimate first winner in concluded registry
      markBattleConcluded(bId, {
        winnerUsername: actualUsername,
        winnerId: userRecord?.userId,
        reason: 'win'
      });

      // Broadcast victory to opponent
      socket.to(bId).emit('battle:peer_won', {
        winnerUsername: actualUsername,
        finalCode,
        language
      });

      // Leave the battle room so winner never receives any subsequent battle events
      try {
        socket.leave(bId);
      } catch {}
    });

    // Relay peer resignation event so opponent immediately gets "You Won!"
    socket.on('battle:resign', ({ battleId, resignedUsername, winnerUsername }) => {
      if (!battleId) return;
      const userRecord = socketToUser.get(socket.id);
      const actualResignedUsername = resignedUsername || userRecord?.username || 'Opponent';

      if (isBattleConcluded(battleId)) {
        return;
      }

      markBattleConcluded(battleId, {
        winnerUsername: winnerUsername || 'Opponent',
        reason: 'resigned'
      });

      // Broadcast to room so opponent instantly gets 'You Won by resignation'
      io.to(battleId).emit('battle:opponent_resigned', {
        battleId,
        resignedUsername: actualResignedUsername,
        winnerUsername: winnerUsername || 'You'
      });
    });

    // Relay battle draw / time expired event to both peers simultaneously
    socket.on('battle:draw', ({ battleId, reason }) => {
      if (!battleId) return;
      const bId = String(battleId);
      if (isBattleConcluded(bId)) return;

      markBattleConcluded(bId, {
        winnerUsername: 'Draw',
        winnerId: null,
        reason: reason || 'draw'
      });

      io.to(bId).emit('battle:draw', {
        battleId: bId,
        reason: reason || 'draw'
      });
    });

    socket.on('battle:time_expired', ({ battleId }) => {
      if (!battleId) return;
      const bId = String(battleId);
      if (isBattleConcluded(bId)) return;

      markBattleConcluded(bId, {
        winnerUsername: 'Draw',
        winnerId: null,
        reason: 'time_expired'
      });

      io.to(bId).emit('battle:draw', {
        battleId: bId,
        reason: 'time_expired'
      });
    });

    // Request opponent code directly via socket
    socket.on('battle:request_opponent_code', ({ battleId, opponentUsername }) => {
      if (!battleId) return;
      const bMap = battleCodeStorage.get(battleId);
      if (bMap && opponentUsername) {
        const oppData = bMap.get(opponentUsername.toLowerCase().trim());
        if (oppData) {
          socket.emit('battle:opponent_code_response', oppData);
          return;
        }
      }
    });

    // 5. Live Battle Registry for homepage spectator
    socket.on('battle:live_register', async (data) => {
      if (!data || !data.battleId) return;
      const bId = String(data.battleId);

      // If battle already concluded, notify socket immediately and do not register as live
      if (isBattleConcluded(bId)) {
        const info = concludedBattles.get(bId);
        socket.emit('battle:already_concluded', {
          battleId: bId,
          winnerUsername: info?.winnerUsername || 'Opponent'
        });
        return;
      }

      try {
        const existingBattle = await Battle.findOne({
          battleId: bId,
          status: { $in: ['COMPLETED', 'RESIGNED', 'ABANDONED', 'CANCELLED'] }
        });
        if (existingBattle) {
          let winName = existingBattle.winnerUsername || '';
          if (!winName && existingBattle.winnerId) {
            const winUser = await User.findById(existingBattle.winnerId).select('username');
            if (winUser) winName = winUser.username;
          }
          if (!winName) winName = existingBattle.opponentName || 'Opponent';
          markBattleConcluded(bId, {
            winnerUsername: winName,
            winnerId: existingBattle.winnerId,
            reason: 'db_completed'
          });
          socket.emit('battle:already_concluded', {
            battleId: bId,
            winnerUsername: winName
          });
          return;
        }
      } catch (err) {}

      const pRating = data.user?.rating || 1500;
      const oRating = data.opponent?.rating || 1500;
      const topRating = Math.max(pRating, oRating);

      liveBattles.set(data.battleId, {
        battleId: data.battleId,
        problemSlug: data.problemSlug || 'two-sum',
        problemTitle: data.problemTitle || 'Two Sum',
        mode: data.mode || 'Blitz',
        timeControl: data.timeControl || '3 + 0',
        durationSeconds: data.durationSeconds || 180,
        startedAt: Date.now(),
        lastActivity: Date.now(),
        timeLeft: data.timeLeft !== undefined ? data.timeLeft : 180,
        status: 'IN_PROGRESS',
        topRating,
        player: {
          userId: data.user?.id || data.user?._id || 'guest',
          username: data.user?.username || 'You',
          displayName: data.user?.displayName || data.user?.username || 'You',
          rating: pRating,
          code: data.initialCode || '',
          language: data.language || 'cpp',
          testsPassed: 0,
          testsTotal: data.testsTotal || 3
        },
        opponent: {
          userId: data.opponent?.id || 'guest',
          username: data.opponent?.username || 'Opponent',
          displayName: data.opponent?.displayName || data.opponent?.username || 'Opponent',
          rating: oRating,
          code: '',
          language: data.language || 'cpp',
          testsPassed: 0,
          testsTotal: data.testsTotal || 3
        }
      });

      if (data.user?.username) {
        socketToUser.set(socket.id, {
          userId: data.user.id || data.user._id,
          username: data.user.username,
          rating: pRating
        });
      }

      socketToBattle.set(socket.id, data.battleId);
      socket.join(data.battleId);
      io.emit('live:top_battle_update', getTopLiveBattle());
      broadcastPlatformStats();
    });

    socket.on('battle:live_leave', ({ battleId }) => {
      if (battleId && liveBattles.has(battleId)) {
        liveBattles.delete(battleId);
        io.emit('live:top_battle_update', getTopLiveBattle());
        broadcastPlatformStats();
      }
    });

    socket.on('live:get_top_battle', () => {
      socket.emit('live:top_battle_update', getTopLiveBattle());
    });

    socket.on('stats:get', async () => {
      socket.emit('stats:update', await getPlatformStats());
    });

    // 6. Clean disconnection handling
    socket.on('disconnect', () => {
      const userObj = socketToUser.get(socket.id);
      if (userObj) {
        const usernameClean = (userObj.username || '').toLowerCase().trim();
        if (userSockets.has(usernameClean)) {
          userSockets.get(usernameClean).delete(socket.id);
          if (userSockets.get(usernameClean).size === 0) {
            userSockets.delete(usernameClean);
            io.emit('presence:update', { userId: userObj.userId, username: userObj.username, status: 'OFFLINE' });
            User.updateOne({ username: usernameClean }, { $set: { lastActive: new Date() } }).catch(() => {});
          }
        }
        if (userObj.userId) {
          const uIdStr = String(userObj.userId);
          if (userIdSockets.has(uIdStr)) {
            userIdSockets.get(uIdStr).delete(socket.id);
            if (userIdSockets.get(uIdStr).size === 0) {
              userIdSockets.delete(uIdStr);
            }
          }
        }
      }

      socketToUser.delete(socket.id);
      activeUsers.delete(socket.id);

      // Cancel any challenges created by this disconnecting socket
      pendingChallenges.forEach((chal, cId) => {
        if (chal.challenger.socketId === socket.id) {
          chal.targetSockets.forEach(sId => {
            io.to(sId).emit('challenge:cancelled', { challengeId: cId, reason: 'Challenger disconnected' });
          });
          pendingChallenges.delete(cId);
        }
      });

      // Clean up any open challenges created by this disconnecting user
      if (userObj) {
        if (clearUserOpenChallenges(userObj.userId, userObj.username)) {
          io.emit('open_challenges:update', getPublicOpenChallenges());
        }
      }

      const qIdx = matchmakingQueue.findIndex(p => p.socketId === socket.id);
      if (qIdx !== -1) matchmakingQueue.splice(qIdx, 1);

      const bId = socketToBattle.get(socket.id);
      if (bId) {
        socketToBattle.delete(socket.id);
        setTimeout(() => {
          if (liveBattles.has(bId)) {
            const b = liveBattles.get(bId);
            if (Date.now() - (b.lastActivity || 0) > 10000) {
              liveBattles.delete(bId);
              io.emit('live:top_battle_update', getTopLiveBattle());
              broadcastPlatformStats();
            }
          }
        }, 10000);
      }

      broadcastPlatformStats();
    });
  });
};

export const getIO = () => {
  if (!io) throw new Error("Socket.io not initialized");
  return io;
};
