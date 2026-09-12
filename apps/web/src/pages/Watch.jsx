import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

export default function Watch() {
  const [channelInfo, setChannelInfo] = useState({
    name: 'Arcane Aman',
    handle: '@ArcaneAman',
    url: 'https://www.youtube.com/@ArcaneAman',
    subscribeUrl: 'https://www.youtube.com/@ArcaneAman?sub_confirmation=1'
  });
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);

  // Selected playlist & active video
  const [activePlaylistIndex, setActivePlaylistIndex] = useState(0);
  const [activeVideoIndex, setActiveVideoIndex] = useState(0);

  const playerRef = useRef(null);

  // Fetch playlists from API (which dynamically checks Arcane Aman channel RSS)
  useEffect(() => {
    const fetchWatchData = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/watch/playlists');
        if (res.data?.playlists && res.data.playlists.length > 0) {
          setPlaylists(res.data.playlists);
          if (res.data.channel) {
            setChannelInfo(res.data.channel);
          }
        }
      } catch (err) {
        console.error('Failed to load watch playlists:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchWatchData();
  }, []);

  const activePlaylist = playlists[activePlaylistIndex] || null;
  const activeVideo = activePlaylist?.videos?.[activeVideoIndex] || activePlaylist?.videos?.[0] || null;

  const handleSelectPlaylist = (pIndex) => {
    setActivePlaylistIndex(pIndex);
    setActiveVideoIndex(0);
    if (playerRef.current) {
      playerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleSelectVideo = (vIndex) => {
    setActiveVideoIndex(vIndex);
    if (playerRef.current) {
      playerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-4">
        <div className="w-10 h-10 border-4 border-red-500/20 border-t-red-600 rounded-full animate-spin"></div>
        <p className="text-white/60 text-sm font-medium">Fetching videos from @ArcaneAman...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-[#c3c2bf] flex flex-col">
      {/* SIMPLE & CLEAN CHANNEL HEADER */}
      <div className="bg-[#181818] border-b border-[#282828] px-4 sm:px-6 lg:px-8 py-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          
          {/* Channel Identity */}
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-red-600 via-rose-500 to-amber-500 p-0.5 shadow-md flex-shrink-0">
              <div className="w-full h-full rounded-full bg-[#212121] flex items-center justify-center font-extrabold text-white text-lg">
                A
              </div>
            </div>

            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold text-white">
                  {channelInfo.name}
                </h1>
                <span className="bg-red-600/20 text-red-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-red-500/30">
                  YouTube Channel
                </span>
              </div>
              <a
                href={channelInfo.url}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-[#aaaaaa] hover:text-white transition font-mono"
              >
                {channelInfo.handle} • Competitive Programming & Contests
              </a>
            </div>
          </div>

          {/* Direct Actions: Visit Channel & Subscribe */}
          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <a
              href={channelInfo.url}
              target="_blank"
              rel="noreferrer"
              className="flex-1 sm:flex-initial bg-[#272727] hover:bg-[#383838] text-white text-xs font-semibold px-4 py-2.5 rounded-xl border border-white/10 transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>Visit Official Channel</span>
              <span>↗</span>
            </a>

            <a
              href={channelInfo.subscribeUrl}
              target="_blank"
              rel="noreferrer"
              className="flex-1 sm:flex-initial bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
              </svg>
              <span>Subscribe</span>
            </a>
          </div>
        </div>
      </div>

      {/* MAIN CONTAINER */}
      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-8">
        
        {/* ACTIVE VIDEO PLAYER & PLAYLIST QUEUE DRAWER (EXACTLY MATCHING SCREENSHOT 2) */}
        {activeVideo && activePlaylist && (
          <div ref={playerRef} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* LEFT: Video Player & Controls (8 cols on lg) */}
            <div className="lg:col-span-8 flex flex-col gap-3">
              {/* Responsive 16:9 Video Container */}
              <div className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl border border-[#272727]">
                <iframe
                  src={`https://www.youtube-nocookie.com/embed/${activeVideo.id}?autoplay=1&rel=0&modestbranding=1`}
                  title={activeVideo.title}
                  className="w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>

              {/* Video Title & Actions Bar */}
              <div className="flex flex-col gap-3 mt-1">
                <h2 className="text-base sm:text-lg font-bold text-white leading-snug">
                  {activeVideo.title}
                </h2>

                <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#282828]">
                  <div className="flex items-center gap-2 text-xs text-[#aaaaaa]">
                    <span className="font-semibold text-white">{activePlaylist.title}</span>
                    <span>•</span>
                    <span>{activeVideo.views || '1.2K views'}</span>
                    <span>•</span>
                    <span>{activeVideo.published}</span>
                  </div>

                  {/* BOTH OPTIONS: Watch on website vs Go on official YT channel */}
                  <div className="flex items-center gap-2">
                    <span className="bg-[#272727] text-[#81b64c] text-xs font-bold px-3 py-1.5 rounded-lg border border-white/5 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#81b64c] animate-pulse"></span>
                      <span>Watching on Website</span>
                    </span>

                    <a
                      href={activeVideo.youtubeUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-3.5 py-1.5 rounded-lg shadow transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>Watch on YouTube</span>
                      <span>↗</span>
                    </a>

                    {activeVideo.practiceSlug && (
                      <Link
                        to={`/problem/${activeVideo.practiceSlug}`}
                        className="bg-[#81b64c] hover:bg-[#92c55b] text-white text-xs font-bold px-3.5 py-1.5 rounded-lg transition flex items-center gap-1 shadow"
                      >
                        <span>⚔️</span>
                        <span>Solve in Arena</span>
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT: Playlist Queue Drawer (4 cols on lg, matching Screenshot 2) */}
            <div className="lg:col-span-4 bg-[#1f1f1f] border border-[#2d2a26] rounded-2xl overflow-hidden shadow-2xl flex flex-col">
              {/* Drawer Header */}
              <div className="p-4 border-b border-[#2d2a26] bg-[#242424] flex items-center justify-between">
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white">
                    {activePlaylist.title}
                  </h3>
                  <div className="text-xs text-[#aaaaaa] mt-0.5">
                    {channelInfo.name} - {activeVideoIndex + 1} / {activePlaylist.videos.length}
                  </div>
                </div>

                {/* Shuffle / Repeat decorative controls */}
                <div className="flex items-center gap-2 text-white/60">
                  <span className="text-sm cursor-pointer hover:text-white" title="Loop Playlist">
                    🔁
                  </span>
                  <span className="text-sm cursor-pointer hover:text-white" title="Shuffle Playlist">
                    🔀
                  </span>
                </div>
              </div>

              {/* Playlist Video Items List */}
              <div className="max-h-[480px] overflow-y-auto divide-y divide-[#282828]">
                {activePlaylist.videos.map((vid, idx) => {
                  const isCurrent = idx === activeVideoIndex;

                  return (
                    <div
                      key={vid.id}
                      onClick={() => handleSelectVideo(idx)}
                      className={`p-3 flex items-center gap-3 cursor-pointer transition ${
                        isCurrent
                          ? 'bg-[#382a1e] border-l-4 border-[#81b64c]'
                          : 'hover:bg-[#282828]'
                      }`}
                    >
                      {/* Video Number or Playing Icon */}
                      <div className="w-4 text-center text-xs font-bold text-white/50 flex-shrink-0">
                        {isCurrent ? <span className="text-[#81b64c]">▶</span> : idx + 1}
                      </div>

                      {/* Video Thumbnail with Duration */}
                      <div className="relative w-28 aspect-video bg-[#121212] rounded-lg overflow-hidden flex-shrink-0 border border-white/5">
                        <img
                          src={vid.thumbnail}
                          alt={vid.title}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                        <span className="absolute bottom-1 right-1 bg-black/80 text-white text-[9px] font-mono px-1 rounded">
                          {vid.duration}
                        </span>
                      </div>

                      {/* Video Info */}
                      <div className="flex-1 min-w-0">
                        <h4 className={`text-xs font-semibold line-clamp-2 leading-snug ${
                          isCurrent ? 'text-white font-bold' : 'text-[#dcdcdc]'
                        }`}>
                          {vid.title}
                        </h4>
                        <div className="text-[11px] text-[#888888] mt-1">
                          {channelInfo.name}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* PLAYLIST CARDS ROW (MATCHING SCREENSHOT 1) */}
        <div className="pt-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white">
                Contest Playlists
              </h3>
              <p className="text-xs text-[#888888]">
                Select a contest series to watch walkthroughs on the website or jump directly to YouTube
              </p>
            </div>

            <a
              href="https://www.youtube.com/@ArcaneAman/playlists"
              target="_blank"
              rel="noreferrer"
              className="text-xs font-semibold text-[#81b64c] hover:underline flex items-center gap-1"
            >
              <span>View All on YouTube</span>
              <span>↗</span>
            </a>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {playlists.map((playlist, pIdx) => {
              const isSelected = pIdx === activePlaylistIndex;

              return (
                <div
                  key={playlist.id}
                  onClick={() => handleSelectPlaylist(pIdx)}
                  className={`bg-[#181818] border rounded-2xl overflow-hidden cursor-pointer transition-all transform hover:-translate-y-1 group shadow-lg ${
                    isSelected ? 'border-[#81b64c] ring-1 ring-[#81b64c]' : 'border-[#282828] hover:border-white/20'
                  }`}
                >
                  {/* Playlist Card Thumbnail with YouTube Stack Style (Matching Screenshot 1) */}
                  <div className="relative w-full aspect-video bg-[#121212] overflow-hidden">
                    <img
                      src={playlist.bannerThumb || playlist.videos?.[0]?.thumbnail}
                      alt={playlist.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />

                    {/* Playlist Badge: e.g. "≡ 4 videos" / "≡ 1 video" */}
                    <div className="absolute bottom-2 right-2 bg-black/85 backdrop-blur-sm text-white text-xs font-bold px-2.5 py-1 rounded-lg border border-white/10 flex items-center gap-1.5 shadow">
                      <span>≡</span>
                      <span>{playlist.videos.length} {playlist.videos.length === 1 ? 'video' : 'videos'}</span>
                    </div>

                    {/* Active Indicator */}
                    {isSelected && (
                      <div className="absolute top-2 left-2 bg-[#81b64c] text-white text-[10px] font-bold px-2 py-0.5 rounded shadow">
                        ✓ Selected
                      </div>
                    )}
                  </div>

                  {/* Playlist Details */}
                  <div className="p-4 flex flex-col justify-between gap-3">
                    <div>
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm sm:text-base font-bold text-white group-hover:text-[#81b64c] transition">
                          {playlist.title}
                        </h4>
                        <span className="text-white/40 text-sm">⋮</span>
                      </div>
                      
                      <div className="text-xs text-[#888888] mt-1">
                        {playlist.visibility} • {playlist.updatedText}
                      </div>
                    </div>

                    {/* Actions: Watch Here vs View on YouTube */}
                    <div className="pt-2 border-t border-[#252525] flex items-center justify-between text-xs">
                      <span className="font-semibold text-[#81b64c] group-hover:underline">
                        ▶ Watch on website
                      </span>

                      <a
                        href={playlist.playlistUrl}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-[#aaaaaa] hover:text-white hover:underline flex items-center gap-1"
                      >
                        <span>View full playlist</span>
                        <span>↗</span>
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
