import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { getNextApiKey, withRetry, withRateLimit, rateLimiters, BASE_URL } from '../youtube';
import { APIError, ErrorMessages, handleAPIError } from '../errors';

export async function getChannelDetails(channelId: string) {
  console.log(`Fetching channel details for ${channelId}`);

  const cachedRef = doc(db, 'yt_channel_cache', channelId);
  const cachedSnap = await getDoc(cachedRef);

  if (cachedSnap.exists()) {
    console.log(`✅ Using cached channel data for ${channelId}`);
    return cachedSnap.data();
  }

  return withRetry(async () =>
    withRateLimit(rateLimiters.channels, async () => {
      try {
        const url = `${BASE_URL}/channels?part=snippet,statistics&id=${channelId}&key=${getNextApiKey()}`;
        const res = await fetch(url);
        if (!res.ok) throw new APIError('Failed to fetch channel details', res.status);
        const data = await res.json();
        const item = data.items?.[0];
        if (!item) throw new APIError(ErrorMessages.NOT_FOUND, 404);

        const payload = {
          id: item.id,
          title: item.snippet.title,
          subscriberCount: +item.statistics.subscriberCount,
          viewCount: +item.statistics.viewCount,
          fetchedAt: serverTimestamp(),
        };

        await setDoc(cachedRef, payload);
        return payload;
      } catch (error) {
        throw handleAPIError(error);
      }
    }, 1)
  );
}
