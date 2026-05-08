const axios = require('axios');

const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';

exports.searchVideos = async (req, res) => {
  try {
    const { q, maxResults = 12 } = req.query;

    if (!q) return res.status(400).json({ message: 'Search query required' });

    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) {
      // Return mock data if no API key configured
      return res.json({ videos: getMockVideos(q), mock: true });
    }

    const searchQuery = `${q} tutorial for beginners`;

    const response = await axios.get(`${YOUTUBE_API_BASE}/search`, {
      params: {
        part: 'snippet',
        q: searchQuery,
        maxResults: parseInt(maxResults),
        type: 'video',
        videoCategoryId: '27', // Education category
        relevanceLanguage: 'en',
        key: apiKey
      }
    });

    const videos = response.data.items.map(item => ({
      id: item.id.videoId,
      title: item.snippet.title,
      description: item.snippet.description,
      channelName: item.snippet.channelTitle,
      thumbnail: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.medium?.url,
      publishedAt: item.snippet.publishedAt,
      embedUrl: `https://www.youtube.com/embed/${item.id.videoId}`
    }));

    res.json({ videos, query: q });
  } catch (err) {
    console.error('YouTube search error:', err.response?.data || err.message);
    if (err.response?.status === 403) {
      return res.status(403).json({ message: 'YouTube API quota exceeded. Please try again later.' });
    }
    res.status(500).json({ message: 'Error searching videos' });
  }
};

exports.getVideoDetails = async (req, res) => {
  try {
    const { videoId } = req.params;
    const apiKey = process.env.YOUTUBE_API_KEY;

    if (!apiKey) {
      return res.json({
        video: {
          id: videoId,
          embedUrl: `https://www.youtube.com/embed/${videoId}`,
          title: 'Video Player',
          channelName: 'YouTube'
        }
      });
    }

    const response = await axios.get(`${YOUTUBE_API_BASE}/videos`, {
      params: {
        part: 'snippet,statistics',
        id: videoId,
        key: apiKey
      }
    });

    const item = response.data.items[0];
    if (!item) return res.status(404).json({ message: 'Video not found' });

    res.json({
      video: {
        id: videoId,
        title: item.snippet.title,
        description: item.snippet.description,
        channelName: item.snippet.channelTitle,
        thumbnail: item.snippet.thumbnails.maxres?.url || item.snippet.thumbnails.high?.url,
        publishedAt: item.snippet.publishedAt,
        viewCount: item.statistics.viewCount,
        likeCount: item.statistics.likeCount,
        embedUrl: `https://www.youtube.com/embed/${videoId}`
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching video details' });
  }
};

// Mock data when API key is not set
function getMockVideos(query) {
  const topics = {
    python: [
      { id: '_uQrJ0TkZlc', title: 'Python Tutorial - Python Full Course for Beginners', channelName: 'Programming with Mosh' },
      { id: 'rfscVS0vtbw', title: 'Learn Python in 5 Hours (FULL COURSE)', channelName: 'Tech With Tim' },
    ],
    react: [
      { id: 'w7ejDZ8SWv8', title: 'React JS Full Course for Beginners', channelName: 'Traversy Media' },
      { id: 'bMknfKXIFA8', title: 'React Course - Beginner\'s Tutorial', channelName: 'freeCodeCamp.org' },
    ],
    default: [
      { id: 'dQw4w9WgXcQ', title: `Learn ${query} - Complete Tutorial`, channelName: 'Dev Academy' },
      { id: 'rfscVS0vtbw', title: `${query} for Beginners`, channelName: 'CodeWithMe' },
    ]
  };

  const videos = topics[query.toLowerCase()] || topics.default;
  return videos.map(v => ({
    ...v,
    description: `Learn ${query} from scratch with this comprehensive tutorial.`,
    thumbnail: `https://img.youtube.com/vi/${v.id}/hqdefault.jpg`,
    publishedAt: new Date().toISOString(),
    embedUrl: `https://www.youtube.com/embed/${v.id}`
  }));
}
