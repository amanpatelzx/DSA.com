import express from 'express';

const router = express.Router();

const CHANNEL_ID = 'UCso5CZnRZ0n6W-Zht_brDAQ';
const CHANNEL_HANDLE = '@ArcaneAman';
const CHANNEL_NAME = 'Arcane Aman';
const CHANNEL_URL = 'https://www.youtube.com/@ArcaneAman';

// Static default playlists matching exact user screenshots
const DEFAULT_PLAYLISTS = [
  {
    id: 'leetcode',
    title: 'Leetcode Contest',
    platform: 'LeetCode',
    updatedText: 'Updated 5 days ago',
    visibility: 'Public',
    bannerThumb: 'https://img.youtube.com/vi/-4Vi9TOoH8k/hqdefault.jpg',
    playlistUrl: 'https://www.youtube.com/@ArcaneAman/playlists',
    videos: [
      {
        id: '-4Vi9TOoH8k',
        title: 'Weekly Contest 518 (live solving Q 1, 2, & 4) | Got 2k rank | DSA | Knight',
        shortTitle: 'Weekly Contest 518 (live solving ...',
        duration: '1:32:43',
        published: 'Sep 6, 2026',
        views: '1.2K',
        youtubeUrl: 'https://www.youtube.com/watch?v=-4Vi9TOoH8k',
        embedUrl: 'https://www.youtube.com/embed/-4Vi9TOoH8k',
        thumbnail: 'https://img.youtube.com/vi/-4Vi9TOoH8k/mqdefault.jpg',
        practiceSlug: 'two-sum',
        practiceTitle: 'Two Sum'
      },
      {
        id: 'dkCR8PYcwic',
        title: 'Weekly Contest 517 (live solving Q 1, 2, 3 & 4) | Got 1.3k rank',
        shortTitle: 'Weekly Contest 517 (live solving ...',
        duration: '1:19:01',
        published: 'Aug 30, 2026',
        views: '1.8K',
        youtubeUrl: 'https://www.youtube.com/watch?v=dkCR8PYcwic',
        embedUrl: 'https://www.youtube.com/embed/dkCR8PYcwic',
        thumbnail: 'https://img.youtube.com/vi/dkCR8PYcwic/mqdefault.jpg',
        practiceSlug: 'valid-parentheses',
        practiceTitle: 'Valid Parentheses'
      },
      {
        id: '4khQDZVg1fU',
        title: 'Biweekly Contest 190 (live solving Q 1, 2, & 3) | Got 3.7k rank',
        shortTitle: 'Biweekly Contest 190 (live solving ...',
        duration: '1:12:11',
        published: 'Aug 29, 2026',
        views: '2.1K',
        youtubeUrl: 'https://www.youtube.com/watch?v=4khQDZVg1fU',
        embedUrl: 'https://www.youtube.com/embed/4khQDZVg1fU',
        thumbnail: 'https://img.youtube.com/vi/4khQDZVg1fU/mqdefault.jpg',
        practiceSlug: 'lru-cache',
        practiceTitle: 'LRU Cache'
      },
      {
        id: 'zwZbp_sOAe8',
        title: 'Weekly Contest 516 (live solving Q 1, 2, & 3) | Got 2k rank',
        shortTitle: 'Weekly Contest 516 (live solving ...',
        duration: '1:05:40',
        published: 'Aug 23, 2026',
        views: '1.5K',
        youtubeUrl: 'https://www.youtube.com/watch?v=zwZbp_sOAe8',
        embedUrl: 'https://www.youtube.com/embed/zwZbp_sOAe8',
        thumbnail: 'https://img.youtube.com/vi/zwZbp_sOAe8/mqdefault.jpg',
        practiceSlug: 'best-time-to-buy-and-sell-stock',
        practiceTitle: 'Best Time to Buy and Sell Stock'
      }
    ]
  },
  {
    id: 'codeforces',
    title: 'Codeforces Contest',
    platform: 'Codeforces',
    updatedText: 'Updated yesterday',
    visibility: 'Public',
    bannerThumb: 'https://img.youtube.com/vi/cGz1b0-MFas/hqdefault.jpg',
    playlistUrl: 'https://www.youtube.com/@ArcaneAman/playlists',
    videos: [
      {
        id: 'cGz1b0-MFas',
        title: 'Educational Codeforces Round 194 ( -61 😒) | live solving (Q 1, 2 )',
        shortTitle: 'Educational Codeforces Round 194 (live solving ...',
        duration: '48:22',
        published: 'Sep 9, 2026',
        views: '950',
        youtubeUrl: 'https://www.youtube.com/watch?v=cGz1b0-MFas',
        embedUrl: 'https://www.youtube.com/embed/cGz1b0-MFas',
        thumbnail: 'https://img.youtube.com/vi/cGz1b0-MFas/mqdefault.jpg',
        practiceSlug: 'trapping-rain-water',
        practiceTitle: 'Trapping Rain Water'
      }
    ]
  },
  {
    id: 'codechef',
    title: 'Codechef contest',
    platform: 'CodeChef',
    updatedText: 'Updated yesterday',
    visibility: 'Public',
    bannerThumb: 'https://img.youtube.com/vi/vHGDBkp_3L0/hqdefault.jpg',
    playlistUrl: 'https://www.youtube.com/@ArcaneAman/playlists',
    videos: [
      {
        id: 'vHGDBkp_3L0',
        title: 'Codechef Starters 255 | got 1400 rank | live solving ( Q1, 2, 3, 4 & 6)',
        shortTitle: 'Codechef Starters 255 (live solving ...',
        duration: '52:15',
        published: 'Sep 9, 2026',
        views: '1.4K',
        youtubeUrl: 'https://www.youtube.com/watch?v=vHGDBkp_3L0',
        embedUrl: 'https://www.youtube.com/embed/vHGDBkp_3L0',
        thumbnail: 'https://img.youtube.com/vi/vHGDBkp_3L0/mqdefault.jpg',
        practiceSlug: 'merge-k-sorted-lists',
        practiceTitle: 'Merge K Sorted Lists'
      }
    ]
  }
];

// @route   GET /api/watch/playlists
// @desc    Fetch channel playlists and live YouTube videos
// @access  Public
router.get('/playlists', async (req, res) => {
  try {
    // Attempt live RSS feed fetch from YouTube to sync new uploads dynamically
    const feedRes = await fetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${CHANNEL_ID}`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
      signal: AbortSignal.timeout(3500)
    });

    if (feedRes.ok) {
      const xml = await feedRes.text();
      const entries = xml.split('<entry>');
      const liveVideos = [];

      for (let i = 1; i < entries.length; i++) {
        const entry = entries[i];
        const videoId = entry.match(/<yt:videoId>([^<]+)<\/yt:videoId>/)?.[1];
        let title = entry.match(/<title>([^<]+)<\/title>/)?.[1] || '';
        title = title.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
        const published = entry.match(/<published>([^<]+)<\/published>/)?.[1];

        if (videoId && title) {
          liveVideos.push({
            id: videoId,
            title,
            published: published ? new Date(published).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recent',
            youtubeUrl: `https://www.youtube.com/watch?v=${videoId}`,
            embedUrl: `https://www.youtube.com/embed/${videoId}`,
            thumbnail: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`
          });
        }
      }

      // If live videos fetched, group them cleanly
      if (liveVideos.length > 0) {
        const leetcodeVideos = liveVideos.filter(v => /leetcode|weekly|biweekly/i.test(v.title));
        const codeforcesVideos = liveVideos.filter(v => /codeforces|cf/i.test(v.title));
        const codechefVideos = liveVideos.filter(v => /codechef|starters/i.test(v.title));

        const dynamicPlaylists = [
          {
            ...DEFAULT_PLAYLISTS[0],
            videos: leetcodeVideos.length > 0 ? leetcodeVideos.map((lv, i) => ({
              ...DEFAULT_PLAYLISTS[0].videos[i],
              ...lv,
              duration: DEFAULT_PLAYLISTS[0].videos[i]?.duration || '1:15:00',
              shortTitle: lv.title.slice(0, 35) + '...'
            })) : DEFAULT_PLAYLISTS[0].videos
          },
          {
            ...DEFAULT_PLAYLISTS[1],
            videos: codeforcesVideos.length > 0 ? codeforcesVideos.map((cv, i) => ({
              ...DEFAULT_PLAYLISTS[1].videos[i],
              ...cv,
              duration: DEFAULT_PLAYLISTS[1].videos[i]?.duration || '48:22',
              shortTitle: cv.title.slice(0, 35) + '...'
            })) : DEFAULT_PLAYLISTS[1].videos
          },
          {
            ...DEFAULT_PLAYLISTS[2],
            videos: codechefVideos.length > 0 ? codechefVideos.map((cfv, i) => ({
              ...DEFAULT_PLAYLISTS[2].videos[i],
              ...cfv,
              duration: DEFAULT_PLAYLISTS[2].videos[i]?.duration || '52:15',
              shortTitle: cfv.title.slice(0, 35) + '...'
            })) : DEFAULT_PLAYLISTS[2].videos
          }
        ];

        return res.json({
          success: true,
          channel: {
            name: CHANNEL_NAME,
            handle: CHANNEL_HANDLE,
            url: CHANNEL_URL,
            subscribeUrl: `${CHANNEL_URL}?sub_confirmation=1`
          },
          playlists: dynamicPlaylists
        });
      }
    }
  } catch (err) {
    console.warn('Live YouTube RSS fetch warning, using curated fallback:', err.message);
  }

  // Fallback to default playlist data
  res.json({
    success: true,
    channel: {
      name: CHANNEL_NAME,
      handle: CHANNEL_HANDLE,
      url: CHANNEL_URL,
      subscribeUrl: `${CHANNEL_URL}?sub_confirmation=1`
    },
    playlists: DEFAULT_PLAYLISTS
  });
});

export default router;
