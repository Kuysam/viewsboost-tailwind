// src/lib/youtube-caching/getUploadsPlaylistId.ts

import { getAPIKey } from '../youtube/apiKeyManager';

export async function getUploadsPlaylistId(channelId: string) {
  // Channel IDs should start with UC
  if (!/^UC/.test(channelId)) {
    console.error('Invalid channel ID:', channelId);
    throw new Error('Invalid channel ID: ' + channelId);
  }

  const apiKey = getAPIKey();
  const url = `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${channelId}&key=${apiKey}`;
  try {
    const res = await fetch(url);

    if (!res.ok) {
      const errorBody = await res.json();
      console.error('YouTube API Error:', errorBody);
      throw new Error(
        `YouTube API error ${res.status}: ${errorBody?.error?.message || res.statusText}`
      );
    }

    const json = await res.json();
    const uploadsPlaylistId = json?.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;

    if (!uploadsPlaylistId) {
      throw new Error('Failed to find uploads playlist for channel: ' + channelId);
    }

    return uploadsPlaylistId;
  } catch (err) {
    console.error('Failed to fetch uploads playlist ID:', err);
    throw err;
  }
}
