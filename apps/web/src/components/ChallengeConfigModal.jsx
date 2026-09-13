import React, { useState, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import { fetchRandomBattleProblems } from '../utils/problemSelector';

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
    badge: 'Custom',
    pointsDesc: 'Custom Duration & Difficulty',
    description: 'Customize duration, questions count, and difficulty',
    isCustom: true
  }
];

const parseSeconds = (tcStr) => {
  if (!tcStr) return 600;
  const sStr = String(tcStr).trim();
  const mMatch = sStr.match(/^(\d+)\s*(?:min|m)/i);
  if (mMatch) return parseInt(mMatch[1], 10) * 60;
  const sMatch = sStr.match(/^(\d+)\s*(?:sec|s)/i);
  if (sMatch) return parseInt(sMatch[1], 10);
  const plusMatch = sStr.match(/^(\d+)\s*\+\s*(\d+)/);
  if (plusMatch) return parseInt(plusMatch[1], 10) * 60;
  const numMatch = sStr.match(/^(\d+)/);
  if (numMatch) return parseInt(numMatch[1], 10) * 60;
  return 600;
};

export default function ChallengeConfigModal({ target, isOpen, onClose }) {
  const { sendChallenge } = useSocket();

  const [isChallengeRated, setIsChallengeRated] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('bullet');
  const [selectedOptionId, setSelectedOptionId] = useState('bullet_1');

  // Custom configuration states
  const [customTime, setCustomTime] = useState('15');
  const [customProblems, setCustomProblems] = useState(1);
  const [customDifficulty, setCustomDifficulty] = useState('medium');

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && target) {
      const initCatId = (typeof target === 'object' && target?.initialMode)
        ? String(target.initialMode).toLowerCase()
        : 'bullet';
      const matchedCat = CHALLENGE_CATEGORIES.find(c => c.id === initCatId) || CHALLENGE_CATEGORIES[0];
      setSelectedCategory(matchedCat.id);
      if (matchedCat.options && matchedCat.options[0]) {
        setSelectedOptionId(matchedCat.options[0].id);
      }
      setIsChallengeRated(true);
    }
  }, [isOpen, target]);

  if (!isOpen || !target) return null;

  const targetUsername = typeof target === 'string' ? target : (target?.username || '');
  const targetDisplayName = typeof target === 'object' ? (target?.displayName || target?.username || '') : target;

  const currentCat = CHALLENGE_CATEGORIES.find(c => c.id === selectedCategory) || CHALLENGE_CATEGORIES[0];
  const activeSelectedOpt = currentCat.options?.find(o => o.id === selectedOptionId) || currentCat.options?.[0];

  const handleSend = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      let mode, timeControl, problemsCount, difficulty, durationSeconds;

      if (currentCat.isCustom) {
        mode = 'Custom';
        timeControl = `${customTime} + 0`;
        problemsCount = customProblems;
        difficulty = customDifficulty;
        durationSeconds = parseInt(customTime, 10) * 60;
      } else {
        const opt = activeSelectedOpt || currentCat.options[0];
        mode = opt.mode || currentCat.name;
        timeControl = opt.timeControl || `${opt.time} + 0`;
        problemsCount = opt.problems || 1;
        difficulty = '';
        durationSeconds = parseSeconds(timeControl);
      }

      // Fetch random problem slugs for battle
      const randomSlugs = await fetchRandomBattleProblems({
        mode,
        difficulty,
        count: problemsCount
      });

      sendChallenge({
        toUsername: targetUsername,
        mode,
        timeControl,
        isRated: isChallengeRated,
        problemsCount,
        difficulty,
        problemList: randomSlugs && randomSlugs.length > 0 ? randomSlugs : ['two-sum'],
        durationSeconds
      });

      onClose();
    } catch (err) {
      console.error('Failed to send challenge:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-[#24221f] border border-white/15 rounded-3xl p-5 sm:p-7 max-w-xl w-full shadow-2xl animate-in zoom-in duration-150 relative">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold text-lg">
              ⚡
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-white flex items-center gap-1.5">
                <span>Challenge Online</span>
                {targetUsername && (
                  <span className="text-xs bg-[#81b64c]/20 text-[#81b64c] border border-[#81b64c]/30 px-2 py-0.5 rounded-full font-mono">
                    @{targetUsername}
                  </span>
                )}
              </h3>
              <p className="text-xs text-[#8c8b88]">
                {targetUsername ? `Select your preferred format & match type to challenge @${targetUsername}` : 'Select your preferred format & match type to find an opponent'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
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

        {/* CATEGORY DETAILS BANNER */}
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

        {/* CATEGORY BODY: STANDARD 3 OPTIONS vs CUSTOM */}
        {currentCat.isCustom ? (
          <div className="bg-[#1b1a18] border border-white/10 rounded-2xl p-4 mb-5 space-y-3.5 text-xs">
            <div>
              <label className="text-[#8c8b88] font-bold block mb-1.5">Match Duration (Minutes):</label>
              <div className="grid grid-cols-4 gap-2">
                {['5', '10', '15', '20', '30', '45', '60'].map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setCustomTime(t)}
                    className={`py-2 px-2.5 rounded-xl font-bold font-mono transition text-xs cursor-pointer ${
                      customTime === t
                        ? 'bg-[#81b64c] text-white shadow'
                        : 'bg-[#262421] text-white/70 hover:text-white hover:bg-[#322f2b] border border-white/5'
                    }`}
                  >
                    {t} min
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[#8c8b88] font-bold block mb-1.5">Questions Count:</label>
              <div className="grid grid-cols-3 gap-2">
                {[1, 2, 3].map(cnt => (
                  <button
                    key={cnt}
                    type="button"
                    onClick={() => setCustomProblems(cnt)}
                    className={`py-2 px-2.5 rounded-xl font-bold transition text-xs cursor-pointer ${
                      customProblems === cnt
                        ? 'bg-[#81b64c] text-white shadow'
                        : 'bg-[#262421] text-white/70 hover:text-white hover:bg-[#322f2b] border border-white/5'
                    }`}
                  >
                    {cnt} {cnt === 1 ? 'Problem' : 'Problems'}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[#8c8b88] font-bold block mb-1.5">Problem Difficulty:</label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { id: 'easy', label: 'Easy', color: 'text-emerald-400' },
                  { id: 'medium', label: 'Medium', color: 'text-amber-400' },
                  { id: 'hard', label: 'Hard', color: 'text-rose-400' },
                  { id: 'mixed', label: 'Mixed', color: 'text-purple-400' }
                ].map(d => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => setCustomDifficulty(d.id)}
                    className={`py-2 px-2.5 rounded-xl font-bold transition text-xs cursor-pointer ${
                      customDifficulty === d.id
                        ? 'bg-[#81b64c] text-white shadow'
                        : 'bg-[#262421] text-white/70 hover:text-white hover:bg-[#322f2b] border border-white/5'
                    }`}
                  >
                    <span className={customDifficulty === d.id ? 'text-white' : d.color}>{d.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* 3 Standard Options */
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
        )}

        {/* Footer Bar with Send Challenge Action */}
        <div className="bg-[#1b1a18] p-3.5 sm:p-4 rounded-2xl border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 text-[#8c8b88] text-center sm:text-left">
            <span>Selected:</span>
            <div className="flex items-center gap-1.5 font-bold text-white flex-wrap justify-center sm:justify-start">
              <strong className="text-white">{currentCat.name}</strong>
              <span className="text-white/40">•</span>
              <span className="text-[#81b64c] bg-[#81b64c]/10 border border-[#81b64c]/20 px-2 py-0.5 rounded font-mono font-bold">
                ⚡ {currentCat.isCustom ? `${customTime} min` : (activeSelectedOpt?.time || currentCat.options[0].time)}
              </span>
              <span className="text-white/40">•</span>
              <span>
                {currentCat.isCustom ? customProblems : (activeSelectedOpt?.problems || 1)}{' '}
                {(currentCat.isCustom ? customProblems : (activeSelectedOpt?.problems || 1)) === 1 ? 'Problem' : 'Problems'}
              </span>
              <span className="text-white/40">•</span>
              <span className={isChallengeRated ? 'text-amber-400' : 'text-white/70'}>
                {isChallengeRated ? '🏆 Rated' : '🎮 Non-Rated'}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSend}
            disabled={isSubmitting}
            className="w-full sm:w-auto bg-[#81b64c] hover:bg-[#92c55b] text-white font-black text-sm sm:text-base px-6 sm:px-8 py-3 sm:py-3.5 rounded-xl transition shadow-lg hover:shadow-emerald-500/25 cursor-pointer flex items-center justify-center gap-2 transform hover:-translate-y-0.5 active:translate-y-0 shrink-0 group disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <span className="animate-spin text-base">🔄</span>
                <span>Preparing Match...</span>
              </>
            ) : (
              <>
                <span className="text-base group-hover:scale-110 transition">⚔️</span>
                <span>Send Challenge</span>
                <span className="text-sm font-bold group-hover:translate-x-1 transition">→</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
