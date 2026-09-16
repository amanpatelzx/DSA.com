import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import API_BASE_URL from '../config/api';
import ChallengeConfigModal from '../components/ChallengeConfigModal';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { user, isLoggedIn } = useAuth();
  const navigate = useNavigate();

  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsernames, setOnlineUsernames] = useState(new Set());

  // Challenge States
  const [incomingChallenge, setIncomingChallenge] = useState(null);
  const [outgoingChallenge, setOutgoingChallenge] = useState(null);
  const [declineNotification, setDeclineNotification] = useState(null);
  const [errorNotification, setErrorNotification] = useState(null);

  // Direct Challenge Modal State (Image 2 format & match type picker)
  const [directChallengeTarget, setDirectChallengeTarget] = useState(null);

  const openDirectChallenge = useCallback((target, initialMode) => {
    if (!target) return;
    if (typeof target === 'string') {
      setDirectChallengeTarget({ username: target, initialMode });
    } else {
      setDirectChallengeTarget({ ...target, initialMode: initialMode || target.initialMode });
    }
  }, []);

  const closeDirectChallenge = useCallback(() => {
    setDirectChallengeTarget(null);
  }, []);

  // Incoming challenge countdown timer (35 seconds)
  const [incomingTimeLeft, setIncomingTimeLeft] = useState(35);
  const incomingTimerRef = useRef(null);

  // Play pleasant challenge alert sound via Web Audio API
  const playChallengeNotificationSound = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      // Note 1 (C5 - 523Hz)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(523.25, ctx.currentTime);
      gain1.gain.setValueAtTime(0.2, ctx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(ctx.currentTime);
      osc1.stop(ctx.currentTime + 0.35);

      // Note 2 (E5 - 659Hz)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(659.25, ctx.currentTime + 0.15);
      gain2.gain.setValueAtTime(0.25, ctx.currentTime + 0.15);
      gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.55);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(ctx.currentTime + 0.15);
      osc2.stop(ctx.currentTime + 0.55);
    } catch {}
  };

  // Play decline / cancellation tone
  const playDeclineSound = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(140, ctx.currentTime + 0.25);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.25);
    } catch {}
  };

  // Initialize and maintain single global Socket connection
  useEffect(() => {
    const socket = io(API_BASE_URL, {
      transports: ['websocket', 'polling']
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      if (user?.username) {
        socket.emit('presence:online', {
          userId: user._id || user.id,
          username: user.username,
          rating: user.ratings?.blitz || 1500,
          avatar: user.avatar || ''
        });
      }
      socket.emit('open_challenges:get');
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    // 1. Incoming battle challenge from a friend or player
    socket.on('challenge:incoming', (data) => {
      setIncomingChallenge(data);
      setIncomingTimeLeft(35);
      playChallengeNotificationSound();
    });

    // 2. Outgoing battle challenge acknowledged by server
    socket.on('challenge:waiting', (data) => {
      setOutgoingChallenge(data);
    });

    // 3. Friend declined or challenge timed out
    socket.on('challenge:declined', (data) => {
      setOutgoingChallenge(null);
      setDeclineNotification(data);
      playDeclineSound();
    });

    // 4. Challenger cancelled the challenge
    socket.on('challenge:cancelled', () => {
      setIncomingChallenge(null);
    });

    // 5. Challenge accepted: Both players synchronously launch into the match!
    socket.on('challenge:started', (data) => {
      setIncomingChallenge(null);
      setOutgoingChallenge(null);
      if (data?.url) {
        navigate(data.url);
      }
    });

    // 6. Generic challenge error (e.g. user offline)
    socket.on('challenge:error', (data) => {
      setOutgoingChallenge(null);
      setErrorNotification(data);
    });

    // 7. Global Open Challenges Lobby updates
    socket.on('open_challenges:update', (challenges) => {
      setOpenChallenges(challenges || []);
    });

    // 8. Real-time online presence roster
    socket.on('presence:online_list', (list) => {
      if (Array.isArray(list)) {
        setOnlineUsernames(new Set(list.map(u => String(u).toLowerCase().trim())));
      }
    });

    socket.on('presence:update', (data) => {
      if (!data?.username) return;
      const u = String(data.username).toLowerCase().trim();
      setOnlineUsernames((prev) => {
        const next = new Set(prev);
        if (data.status === 'ONLINE') {
          next.add(u);
        } else if (data.status === 'OFFLINE') {
          next.delete(u);
        }
        return next;
      });
    });

    return () => {
      socket.disconnect();
    };
  }, [navigate]);

  // Keep presence updated whenever user logs in or profile changes
  useEffect(() => {
    if (socketRef.current && isConnected && user?.username) {
      socketRef.current.emit('presence:online', {
        userId: user._id || user.id,
        username: user.username,
        rating: user.ratings?.blitz || 1500,
        avatar: user.avatar || ''
      });
    }
  }, [user, isConnected]);

  // Incoming challenge timer ticker
  useEffect(() => {
    if (!incomingChallenge) {
      if (incomingTimerRef.current) clearInterval(incomingTimerRef.current);
      return;
    }

    incomingTimerRef.current = setInterval(() => {
      setIncomingTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(incomingTimerRef.current);
          // Auto-decline when timer expires
          if (socketRef.current && incomingChallenge?.challengeId) {
            socketRef.current.emit('challenge:decline', { challengeId: incomingChallenge.challengeId });
          }
          setIncomingChallenge(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(incomingTimerRef.current);
  }, [incomingChallenge]);

  // Real-time helper to check if a specific user is currently active/online
  const isUserOnline = useCallback((targetUsername) => {
    if (!targetUsername) return false;
    const clean = String(targetUsername).toLowerCase().trim();
    if (user?.username && user.username.toLowerCase().trim() === clean && isConnected) {
      return true;
    }
    return onlineUsernames.has(clean);
  }, [user, isConnected, onlineUsernames]);

  // Open Challenges Lobby State
  const [openChallenges, setOpenChallenges] = useState([]);

  // Send a battle challenge to a real person by username
  const sendChallenge = useCallback(({ toUsername, mode, timeControl, isRated, problemsCount, difficulty, problemList, durationSeconds }) => {
    if (!socketRef.current) {
      setErrorNotification({ message: 'Real-time connection not established. Please refresh.' });
      return;
    }
    if (!isLoggedIn || !user) {
      setErrorNotification({ message: 'Please log in to challenge friends.' });
      return;
    }
    if (!toUsername || !toUsername.trim()) {
      setErrorNotification({ message: 'Please enter a valid friend username.' });
      return;
    }

    socketRef.current.emit('challenge:send', {
      toUsername: toUsername.trim(),
      mode: mode || 'Bullet',
      timeControl: timeControl || '10 + 0',
      isRated: isRated !== undefined ? isRated : true,
      problemsCount: problemsCount || 1,
      difficulty: difficulty || '',
      problemList: problemList || ['two-sum'],
      durationSeconds: durationSeconds || 600
    });
  }, [isLoggedIn, user]);

  // Create an open / global challenge on the public lobby
  const createOpenChallenge = useCallback(({ mode, timeControl, time, isRated, problemsCount, difficulty, problemList, durationSeconds }) => {
    if (!socketRef.current) {
      setErrorNotification({ message: 'Real-time connection not established. Please refresh.' });
      return;
    }
    if (!isLoggedIn || !user) {
      setErrorNotification({ message: 'Please log in to create an open challenge.' });
      return;
    }

    socketRef.current.emit('open_challenge:create', {
      mode: mode || 'Bullet',
      timeControl: timeControl || time || '10 + 0',
      time: time || timeControl || '10 min',
      isRated: isRated !== undefined ? isRated : true,
      problemsCount: problemsCount || 1,
      difficulty: difficulty || '',
      problemList: problemList || ['two-sum'],
      durationSeconds: durationSeconds || 600
    });
  }, [isLoggedIn, user]);

  // Accept an open challenge from the lobby
  const acceptOpenChallenge = useCallback((challengeId) => {
    if (!socketRef.current || !challengeId) return;
    if (!isLoggedIn || !user) {
      setErrorNotification({ message: 'Please log in to accept a challenge.' });
      return;
    }
    socketRef.current.emit('open_challenge:accept', { challengeId });
  }, [isLoggedIn, user]);

  // Cancel an open challenge
  const cancelOpenChallenge = useCallback((challengeId) => {
    if (!socketRef.current || !challengeId) return;
    socketRef.current.emit('open_challenge:cancel', { challengeId });
  }, []);

  // Accept incoming challenge
  const acceptChallenge = useCallback((challengeId) => {
    if (!socketRef.current || !challengeId) return;
    socketRef.current.emit('challenge:accept', { challengeId });
  }, []);

  // Decline incoming challenge
  const declineChallenge = useCallback((challengeId) => {
    if (!socketRef.current || !challengeId) return;
    socketRef.current.emit('challenge:decline', { challengeId });
    setIncomingChallenge(null);
  }, []);

  // Cancel outgoing challenge
  const cancelChallenge = useCallback((challengeId) => {
    if (!socketRef.current || !challengeId) return;
    socketRef.current.emit('challenge:cancel', { challengeId });
    setOutgoingChallenge(null);
  }, []);

  return (
    <SocketContext.Provider
      value={{
        socket: socketRef.current,
        isConnected,
        onlineUsernames,
        isUserOnline,
        sendChallenge,
        acceptChallenge,
        declineChallenge,
        cancelChallenge,
        incomingChallenge,
        outgoingChallenge,
        openChallenges,
        createOpenChallenge,
        acceptOpenChallenge,
        cancelOpenChallenge,
        openDirectChallenge,
        closeDirectChallenge
      }}
    >
      {children}

      {/* 1. GLOBAL INCOMING CHALLENGE POPUP (Appears anywhere on the site for recipient) */}
      {incomingChallenge && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-[#24221f] border-2 border-[#81b64c]/80 rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl relative overflow-hidden text-white">
            
            {/* Header with glowing badge */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-[#81b64c]/20 border border-[#81b64c]/40 text-[#81b64c] flex items-center justify-center text-xl animate-bounce">
                  ⚔️
                </div>
                <div>
                  <h3 className="text-base font-black tracking-tight text-white flex items-center gap-2">
                    <span>Duel Challenge!</span>
                    <span className="text-[10px] bg-[#81b64c]/20 text-[#81b64c] border border-[#81b64c]/30 px-2 py-0.5 rounded-full font-mono font-bold">
                      1v1 Battle
                    </span>
                  </h3>
                  <p className="text-xs text-[#8c8b88]">A real player wants to battle you in code!</p>
                </div>
              </div>

              {/* Countdown timer pill */}
              <div className="flex items-center gap-1 font-mono text-xs px-2.5 py-1 rounded-full bg-[#1b1a18] border border-white/10 text-amber-400 font-bold">
                <span>⏱️</span>
                <span>{incomingTimeLeft}s</span>
              </div>
            </div>

            {/* Challenger Profile Card */}
            <div className="bg-[#1b1a18] p-4 rounded-2xl border border-white/10 mb-4 flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#81b64c] to-[#456b23] flex items-center justify-center text-white font-black text-lg shadow-md shrink-0">
                {incomingChallenge.challenger?.username ? incomingChallenge.challenger.username.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-sm text-white truncate">
                    {incomingChallenge.challenger?.username}
                  </span>
                  <span className="text-xs font-mono font-bold text-yellow-400">
                    ({incomingChallenge.challenger?.rating || 1500})
                  </span>
                </div>
                <div className="text-[11px] text-[#8c8b88] mt-0.5 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>Online now & challenged you</span>
                </div>
              </div>
            </div>

            {/* Challenge Match Specs */}
            <div className="bg-[#1b1a18] p-3.5 rounded-2xl border border-white/10 mb-5 space-y-2 text-xs">
              <div className="flex items-center justify-between text-white/80">
                <span className="text-[#8c8b88]">Category & Mode:</span>
                <span className="font-bold text-white flex items-center gap-1">
                  <span>⚡</span>
                  <span>{incomingChallenge.config?.mode}</span>
                </span>
              </div>
              <div className="flex items-center justify-between text-white/80">
                <span className="text-[#8c8b88]">Time Control:</span>
                <span className="font-mono font-bold text-[#81b64c]">
                  {incomingChallenge.config?.timeControl}
                </span>
              </div>
              <div className="flex items-center justify-between text-white/80">
                <span className="text-[#8c8b88]">Problems:</span>
                <span className="font-bold text-white">
                  {incomingChallenge.config?.problemsCount || 1} Problem{incomingChallenge.config?.problemsCount > 1 ? 's' : ''}
                </span>
              </div>
              <div className="flex items-center justify-between border-t border-white/5 pt-2">
                <span className="text-[#8c8b88]">Match Type:</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  incomingChallenge.config?.isRated
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                }`}>
                  {incomingChallenge.config?.isRated ? '🏆 Rated (+ / - Elo)' : '🎮 Non-Rated (Practice)'}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => declineChallenge(incomingChallenge.challengeId)}
                className="py-3 px-4 rounded-xl bg-[#2e2c28] hover:bg-[#3d3a35] text-white/80 hover:text-white text-xs font-extrabold border border-white/10 transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>✕</span>
                <span>Decline</span>
              </button>
              <button
                type="button"
                onClick={() => acceptChallenge(incomingChallenge.challengeId)}
                className="py-3 px-4 rounded-xl bg-[#81b64c] hover:bg-[#92c55b] text-white text-xs font-black shadow-lg shadow-[#81b64c]/20 transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>✓</span>
                <span>Accept Battle</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. OUTGOING CHALLENGE WAITING MODAL (Shown to challenger while waiting for friend) */}
      {outgoingChallenge && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-[#24221f] border border-white/15 rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl text-white text-center">
            {/* Animated Pulsing Icon */}
            <div className="w-16 h-16 rounded-full bg-[#81b64c]/15 border-2 border-[#81b64c] flex items-center justify-center text-2xl mx-auto mb-4 relative">
              <span className="animate-pulse">🤝</span>
              <div className="absolute inset-0 rounded-full border border-[#81b64c] animate-ping opacity-30"></div>
            </div>

            <h3 className="text-lg font-black text-white mb-1">
              Waiting for Response...
            </h3>
            <p className="text-xs text-[#8c8b88] mb-4">
              Challenge request sent to <strong className="text-white font-bold">{outgoingChallenge.targetUsername}</strong>
            </p>

            {/* Challenge Details summary */}
            <div className="bg-[#1b1a18] p-3.5 rounded-2xl border border-white/10 mb-5 text-xs text-left space-y-2 font-mono">
              <div className="flex items-center justify-between">
                <span className="text-[#8c8b88] font-sans">Mode:</span>
                <span className="font-bold text-white">{outgoingChallenge.config?.mode}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#8c8b88] font-sans">Time:</span>
                <span className="font-bold text-[#81b64c]">{outgoingChallenge.config?.timeControl}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#8c8b88] font-sans">Status:</span>
                <span className="font-bold text-amber-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping"></span>
                  <span>Awaiting acceptance</span>
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => cancelChallenge(outgoingChallenge.challengeId)}
              className="w-full py-2.5 px-4 rounded-xl bg-[#2e2c28] hover:bg-[#3d3a35] text-white/70 hover:text-white text-xs font-bold border border-white/10 transition cursor-pointer"
            >
              Cancel Challenge Request
            </button>
          </div>
        </div>
      )}

      {/* 3. CHALLENGE DECLINED / REJECTED NOTIFICATION POPUP */}
      {declineNotification && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-[#24221f] border border-rose-500/40 rounded-3xl p-6 sm:p-7 max-w-sm w-full shadow-2xl text-center text-white">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center text-2xl mx-auto mb-3.5">
              ✕
            </div>
            <h3 className="text-base font-black text-white mb-1">
              Challenge Declined
            </h3>
            <p className="text-xs text-[#8c8b88] mb-5 leading-relaxed">
              {declineNotification.message || `${declineNotification.targetUsername || 'The player'} declined your duel request.`}
            </p>
            <button
              type="button"
              onClick={() => setDeclineNotification(null)}
              className="w-full py-2.5 px-4 rounded-xl bg-[#2e2c28] hover:bg-[#3d3a35] text-white text-xs font-bold border border-white/10 transition cursor-pointer"
            >
              Got it
            </button>
          </div>
        </div>
      )}

      {/* 4. USER OFFLINE / GENERIC CHALLENGE ERROR NOTIFICATION */}
      {errorNotification && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-[#24221f] border border-amber-500/40 rounded-3xl p-6 sm:p-7 max-w-sm w-full shadow-2xl text-center text-white">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center text-2xl mx-auto mb-3.5">
              {errorNotification.isOffline ? '👤' : '⚠️'}
            </div>
            <h3 className="text-base font-black text-white mb-1">
              {errorNotification.isOffline ? 'Player Offline' : 'Notice'}
            </h3>
            <p className="text-xs text-[#8c8b88] mb-5 leading-relaxed">
              {errorNotification.message}
            </p>
            <button
              type="button"
              onClick={() => setErrorNotification(null)}
              className="w-full py-2.5 px-4 rounded-xl bg-[#2e2c28] hover:bg-[#3d3a35] text-white text-xs font-bold border border-white/10 transition cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* 5. DIRECT CHALLENGE CONFIGURATION MODAL (Image 2: 5 categories, rated toggle, option cards) */}
      <ChallengeConfigModal
        target={directChallengeTarget}
        isOpen={Boolean(directChallengeTarget)}
        onClose={closeDirectChallenge}
      />
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}
