/**
 * youtubeService.js
 * Provides a search helper that queries the YouTube Data API v3
 * and returns the videoId of the top result.
 */

const YOUTUBE_SEARCH_URL = 'https://www.googleapis.com/youtube/v3/search';

/**
 * Searches YouTube for the given query and returns the top video's ID.
 * @param {string} query - The search query string.
 * @returns {Promise<string|null>} The videoId of the top result, or null on failure.
 */
async function searchYoutubeVideo(query) {
  try {
    const params = new URLSearchParams({
      q: query,
      part: 'snippet',
      maxResults: '1',
      type: 'video',
      key: process.env.YOUTUBE_API_KEY,
    });

    const response = await fetch(`${YOUTUBE_SEARCH_URL}?${params.toString()}`);

    if (!response.ok) {
      console.error(
        `[youtubeService] API responded with status ${response.status}: ${response.statusText}`
      );
      return null;
    }

    const data = await response.json();

    if (!data.items || data.items.length === 0) {
      console.warn(`[youtubeService] No results found for query: "${query}"`);
      return null;
    }

    return data.items[0].id.videoId ?? null;
  } catch (error) {
    console.error('[youtubeService] searchYoutubeVideo failed:', error.message);
    return null;
  }
}

module.exports = { searchYoutubeVideo };
