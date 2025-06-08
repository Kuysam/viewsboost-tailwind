// src/lib/youtube.ts
import axios from 'axios';
import { handleAPIError, APIError, ErrorMessages } from './errorHandling';
import { rateLimiters, withRateLimit } from './rateLimiter';
import { withRetry } from './retryLogic';
import { logger } from './logger';

// Load all available API keys
const API_KEYS = [
  import.meta.env?.VITE_YT_API_KEY_1 || process.env.VITE_YT_API_KEY_1,
  import.meta.env?.VITE_YT_API_KEY_2 || process.env.VITE_YT_API_KEY_2,
  import.meta.env?.VITE_YT_API_KEY_3 || process.env.VITE_YT_API_KEY_3,
  import.meta.env?.VITE_YT_API_KEY_4 || process.env.VITE_YT_API_KEY_4,
].filter(Boolean);

// ✅ Export this constant so other files can import it
export const BASE_URL = import.meta.env?.VITE_YOUTUBE_API_BASE_URL || process.env.VITE_YOUTUBE_API_BASE_URL;

let currentKeyIndex = 0;

export function getNextApiKey() {
  const key = API_KEYS[currentKeyIndex];
  currentKeyIndex = (currentKeyIndex + 1) % API_KEYS.length;
  return key;
}

if (!API_KEYS.length || !BASE_URL) {
  console.error('❌ Missing YouTube API Keys or BASE_URL.');
}

// -----------------------------------------------
// Channel Details
export async function getChannelDetails(channelId: string) {
  logger.info(`Fetching channel details for ${channelId}`);
  return withRetry(async () =>
    withRateLimit(rateLimiters.channels, async () => {
      try {
        const url = `${BASE_URL}/channels?part=snippet,statistics&id=${channelId}&key=${getNextApiKey()}`;
        const res = await fetch(url);
        if (!res.ok) throw new APIError('Failed to fetch channel details', res.status);
        const data = await res.json();
        const item = data.items?.[0];
        if (!item) throw new APIError(ErrorMessages.NOT_FOUND, 404);
        return {
          id: item.id,
          title: item.snippet.title,
          subscriberCount: +item.statistics.subscriberCount,
          viewCount: +item.statistics.viewCount,
        };
      } catch (error) {
        throw handleAPIError(error);
      }
    }, 1)
  );
}

// -----------------------------------------------
// Playlist ID
export async function getUploadsPlaylistId(channelId: string): Promise<string> {
  logger.info(`Fetching uploads playlist ID for ${channelId}`);
  return withRetry(async () =>
    withRateLimit(rateLimiters.channels, async () => {
      try {
        const url = `${BASE_URL}/channels?part=contentDetails&id=${channelId}&key=${getNextApiKey()}`;
        const res = await fetch(url);
        if (!res.ok) throw new APIError('Failed to fetch channel contentDetails', res.status);
        const data = await res.json();
        const item = data.items?.[0];
        if (!item) throw new APIError(ErrorMessages.NOT_FOUND, 404);
        return item.contentDetails.relatedPlaylists.uploads;
      } catch (error) {
        throw handleAPIError(error);
      }
    }, 1)
  );
}

// -----------------------------------------------
// Playlist Videos
export async function getPlaylistVideos(playlistId: string, pageToken = '') {
  logger.info(`Fetching videos for playlist ${playlistId}`, { pageToken });
  return withRetry(async () =>
    withRateLimit(rateLimiters.videos, async () => {
      try {
        const params = new URLSearchParams({
          part: 'snippet',
          playlistId,
          maxResults: '50',
          key: getNextApiKey(),
        });
        if (pageToken) params.set('pageToken', pageToken);
        const res = await fetch(`${BASE_URL}/playlistItems?${params.toString()}`);
        if (!res.ok) throw new APIError('Failed to fetch playlist videos', res.status);
        const data = await res.json();
        return data.items.map((item: any) => ({
          id: item.snippet.resourceId.videoId,
          title: item.snippet.title,
          thumbnail: item.snippet.thumbnails.medium.url,
        }));
      } catch (error) {
        throw handleAPIError(error);
      }
    }, 1)
  );
}

// -----------------------------------------------
// Comments
interface Comment {
  id: string;
  author: string;
  text: string;
  publishedAt: string;
}

export const getVideoComments = async (videoId: string): Promise<Comment[]> => {
  logger.info(`Fetching comments for video ${videoId}`);
  return withRetry(async () =>
    withRateLimit(rateLimiters.comments, async () => {
      try {
        const res = await axios.get(`${BASE_URL}/commentThreads`, {
          params: {
            part: 'snippet',
            videoId,
            key: getNextApiKey(),
            maxResults: 50,
            order: 'relevance',
          },
        });
        return res.data.items.map((item: any) => ({
          id: item.id,
          author: item.snippet.topLevelComment.snippet.authorDisplayName,
          text: item.snippet.topLevelComment.snippet.textDisplay,
          publishedAt: item.snippet.topLevelComment.snippet.publishedAt,
        }));
      } catch (error) {
        throw handleAPIError(error);
      }
    }, 1)
  );
};

// -----------------------------------------------
// Post Comment
export const postComment = async (
  videoId: string,
  commentText: string,
  accessToken: string
): Promise<void> => {
  logger.info(`Posting comment to video ${videoId}`);
  return withRetry(async () =>
    withRateLimit(rateLimiters.comments, async () => {
      try {
        await axios.post(
          `${BASE_URL}/commentThreads`,
          {
            snippet: {
              videoId,
              topLevelComment: {
                snippet: { textOriginal: commentText },
              },
            },
          },
          {
            params: {
              part: 'snippet',
              key: getNextApiKey(),
            },
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
          }
        );
      } catch (error) {
        throw handleAPIError(error);
      }
    }, 1)
  );
};

// -----------------------------------------------
// Video Durations
function parseISODuration(duration: string): number {
  const regex = /PT(?:(\\d+)H)?(?:(\\d+)M)?(?:(\\d+)S)?/;
  const matches = duration.match(regex);
  const hours = parseInt(matches?.[1] || '0', 10);
  const minutes = parseInt(matches?.[2] || '0', 10);
  const seconds = parseInt(matches?.[3] || '0', 10);
  return hours * 3600 + minutes * 60 + seconds;
}

export async function getVideoDurations(videoIds: string[]): Promise<Record<string, number>> {
  const durations: Record<string, number> = {};
  const chunks = [];
  for (let i = 0; i < videoIds.length; i += 50) {
    chunks.push(videoIds.slice(i, i + 50));
  }

  for (const chunk of chunks) {
    const res = await fetch(
      `${BASE_URL}/videos?part=contentDetails&id=${chunk.join(',')}&key=${getNextApiKey()}`
    );
    const json = await res.json();
    for (const item of json.items || []) {
      durations[item.id] = parseISODuration(item.contentDetails.duration);
    }
  }

  return durations;
}
export { rateLimiters, withRateLimit, withRetry };


