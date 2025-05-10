// src/lib/services/youtube.ts
import { handleAPIError, APIError, ErrorMessages } from './errorHandling';
import { rateLimiters, withRateLimit } from './rateLimiter';
import { withRetry } from './retryLogic';
import { logger } from './logger';

// Load multiple keys from env or fallback
const API_KEYS = [
  import.meta.env.VITE_YT_API_KEY_1,
  import.meta.env.VITE_YT_API_KEY_2,
  import.meta.env.VITE_YT_API_KEY_3,
  import.meta.env.VITE_YT_API_KEY_4,
].filter(Boolean) as string[];

const BASE_URL = import.meta.env.VITE_YOUTUBE_API_BASE_URL || 'https://www.googleapis.com/youtube/v3';

// Start at a random key each run to spread usage
let currentKeyIndex = Math.floor(Math.random() * API_KEYS.length);

function rotateKey() {
  currentKeyIndex = (currentKeyIndex + 1) % API_KEYS.length;
}
function getApiKey() {
  const key = API_KEYS[currentKeyIndex];
  rotateKey();
  return key;
}

// In‑memory cache
const cache = new Map<string, any>();
function getCached(key: string) {
  return cache.get(key);
}
function setCached(key: string, value: any, ttl: number = 60 * 1000) {
  cache.set(key, value);
  setTimeout(() => cache.delete(key), ttl);
}

// --- Channel Details ---
export async function getChannelDetails(channelId: string) {
  const cacheKey = `channel-${channelId}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  logger.info(`Fetching channel details for ${channelId}`);
  return withRetry(() =>
    withRateLimit(rateLimiters.channels, async () => {
      try {
        const url = `${BASE_URL}/channels?part=snippet,statistics&id=${channelId}&key=${getApiKey()}`;
        const res = await fetch(url);
        if (!res.ok) throw new APIError('Failed to fetch channel details', res.status);
        const data = await res.json();
        const item = data.items?.[0];
        if (!item) throw new APIError(ErrorMessages.NOT_FOUND, 404);

        const details = {
          id: item.id,
          title: item.snippet.title,
          subscriberCount: +item.statistics.subscriberCount,
          viewCount: +item.statistics.viewCount,
        };
        setCached(cacheKey, details);
        return details;
      } catch (err: unknown) {
        throw handleAPIError(err);
      }
    })
  );
}

// --- Uploads Playlist ID ---
export async function getUploadsPlaylistId(channelId: string): Promise<string> {
  const cacheKey = `uploads-${channelId}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  logger.info(`Fetching uploads playlist for channel ${channelId}`);
  return withRetry(() =>
    withRateLimit(rateLimiters.channels, async () => {
      try {
        const url = `${BASE_URL}/channels?part=contentDetails&id=${channelId}&key=${getApiKey()}`;
        const res = await fetch(url);
        if (!res.ok) throw new APIError('Failed to fetch playlist', res.status);
        const data = await res.json();
        const playlistId = data.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
        if (!playlistId) throw new APIError(ErrorMessages.NOT_FOUND, 404);
        setCached(cacheKey, playlistId);
        return playlistId;
      } catch (err: unknown) {
        throw handleAPIError(err);
      }
    })
  );
}

// --- Playlist Videos ---
export async function getPlaylistVideos(
  playlistId: string,
  pageToken = ''
): Promise<{ id: string; title: string; thumbnail: string }[]> {
  const cacheKey = `videos-${playlistId}-${pageToken}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  return withRetry(() =>
    withRateLimit(rateLimiters.videos, async () => {
      try {
        const params = new URLSearchParams({
          part: 'snippet',
          playlistId,
          maxResults: '50',
          key: getApiKey(),
        });
        if (pageToken) params.set('pageToken', pageToken);
        const url = `${BASE_URL}/playlistItems?${params}`;
        const res = await fetch(url);
        if (!res.ok) throw new APIError('Failed to fetch playlist videos', res.status);
        const data = await res.json();
        const videos = data.items.map((item: any) => ({
          id: item.snippet.resourceId.videoId,
          title: item.snippet.title,
          thumbnail: item.snippet.thumbnails.medium.url,
        }));
        setCached(cacheKey, videos);
        return videos;
      } catch (err: unknown) {
        throw handleAPIError(err);
      }
    })
  );
}

// --- Video Statistics ---
export async function getYouTubeVideoStats(videoId: string): Promise<number | null> {
  const cacheKey = `stats-${videoId}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const url = `${BASE_URL}/videos?part=statistics&id=${videoId}&key=${getApiKey()}`;
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error('Failed to fetch video stats');
  const data = await res.json();
  const viewCount = data.items?.[0]?.statistics?.viewCount ?? null;
  setCached(cacheKey, viewCount);
  return viewCount;
}

// --- Get Comments ---
export async function getYouTubeComments(videoId: string, accessToken: string) {
  if (!accessToken) return [];
  const url = `${BASE_URL}/commentThreads?part=snippet&videoId=${videoId}&maxResults=10`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
    },
  });
  if (!res.ok) throw new Error('Failed to fetch comments');
  const data = await res.json();
  return data.items.map((item: any) => ({
    id: item.id,
    author: item.snippet.topLevelComment.snippet.authorDisplayName,
    text: item.snippet.topLevelComment.snippet.textDisplay,
    publishedAt: item.snippet.topLevelComment.snippet.publishedAt,
  }));
}

// --- Get YouTube Live Video from Channel ---
export async function getLiveVideoIdFromChannel(channelId: string): Promise<string | null> {
  const cacheKey = `live-${channelId}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const url = `${BASE_URL}/search?part=snippet&channelId=${channelId}&eventType=live&type=video&key=${getApiKey()}`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = await res.json();
  const video = data.items?.[0];
  const videoId = video?.id?.videoId || null;
  setCached(cacheKey, videoId);
  return videoId;
}

// --- Video Durations with Chunking ---
/**
 * Given a list of video IDs, fetch durations in 50‑ID chunks.
 * Logs errors and continues; returns map of id → seconds.
 */
export async function getVideoDurations(
  videoIds: string[]
): Promise<Record<string, number>> {
  const durations: Record<string, number> = {};
  if (videoIds.length === 0) return durations;

  // ISO8601 parser: PT#H#M#S
  const toSeconds = (iso: string) => {
    const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)!;
    const hours   = parseInt(match[1] || '0', 10);
    const minutes = parseInt(match[2] || '0', 10);
    const seconds = parseInt(match[3] || '0', 10);
    return hours * 3600 + minutes * 60 + seconds;
  };

  const chunkSize = 50;
  for (let i = 0; i < videoIds.length; i += chunkSize) {
    const batch = videoIds.slice(i, i + chunkSize);
    const idsParam = batch.join(',');
    try {
      const url = `${BASE_URL}/videos?part=contentDetails&id=${idsParam}&key=${getApiKey()}`;
      const res = await fetch(url);
      if (!res.ok) {
        logger.error(`Failed to fetch durations for: ${idsParam}`, `Status ${res.status}`);
        continue;
      }
      const data = await res.json();
      for (const item of data.items || []) {
        durations[item.id] = toSeconds(item.contentDetails.duration);
      }
    } catch (err: unknown) {
      logger.error('Error fetching duration chunk:', err);
    }
  }

  return durations;
}
