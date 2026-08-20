const { searchYoutubeVideo } = require('../services/youtubeService');

// GET /api/video/search?query=<search term>
const getVideoId = async (req, res) => {
  try {
    const { query } = req.query;

    if (!query || !query.trim()) {
      return res.status(400).json({ message: 'query parameter is required.' });
    }

    const videoId = await searchYoutubeVideo(query.trim());

    if (!videoId) {
      return res.status(404).json({ message: 'No video results found for the given query.' });
    }

    return res.status(200).json({ videoId });
  } catch (error) {
    console.error('[videoController] getVideoId failed:', error.message);
    return res.status(500).json({ message: error.message });
  }
};

module.exports = { getVideoId };
