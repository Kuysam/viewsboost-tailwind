// src/lib/services/videoService.ts

import { getUploadsPlaylistId } from '../youtube-caching/getUploadsPlaylistId';
import { getPlaylistVideos } from '../youtube-caching/getPlaylistVideos';
import { getVideoDurations } from '../youtube-caching/getVideoDurations';
import { auth, db } from '../firebase';
import {
  doc,
  getDoc,
  collection,
  getDocs,
  setDoc,
  query,
  orderBy,
  limit,
  where,
  Timestamp,
} from 'firebase/firestore';
import { logger } from '../logger';
import { handleAPIError } from '../errorHandling';

// 🔷 Video metadata interface
export interface Video {
  id: string;
  title: string;
  thumbnail: string;
  duration: number;
  type: 'short' | 'live' | 'video';
}

function getVideoType(details: any): 'short' | 'live' | 'video' {
  const duration = details.duration || 0;
  const title = (details.title || '').toLowerCase();
  const isShort = duration < 60 && (title.includes('short') || (details.height > details.width));
  if (isShort) return 'short';
  if (details.liveBroadcastContent === 'live' || details.liveStreamingDetails) return 'live';
  return 'video';
}

// 🔹 Get all public videos from all creators
export async function getVideos(): Promise<Video[]> {
  try {
    logger.info('Fetching videos for current user');
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    // Check viewer or creator
    const viewerRef = doc(db, 'viewers', user.uid);
    const creatorRef = doc(db, 'creators', user.uid);
    const [viewerSnap, creatorSnap] = await Promise.all([
      getDoc(viewerRef),
      getDoc(creatorRef),
    ]);
    if (!viewerSnap.exists() && !creatorSnap.exists()) {
      throw new Error('User profile not found');
    }

    // Fetch all creators
    const creatorsSnapshot = await getDocs(collection(db, 'creators'));
    const creatorIds = creatorsSnapshot.docs.map((d) => d.id);

    // Gather videos from each creator
    const allVideos: Omit<Video, 'duration'>[] = [];
    for (const creatorId of creatorIds) {
      try {
        const cSnap = await getDoc(doc(db, 'creators', creatorId));
        if (!cSnap.exists()) continue;

        const channelId = cSnap.data().channelId as string;
        if (!channelId) continue;

        const uploadsPlaylistId = await getUploadsPlaylistId(channelId);
        const vids = await getPlaylistVideos(uploadsPlaylistId);
        allVideos.push(...vids);
      } catch (err) {
        logger.error(`Error fetching videos for creator ${creatorId}:`, err);
      }
    }

    // Fetch video durations
    let durationMap: Record<string, number> = {};
    try {
      durationMap = await getVideoDurations(allVideos.map((v) => v.id));
    } catch (err) {
      logger.error(
        'Failed to fetch video durations, defaulting to long durations:',
        err
      );
    }

    return allVideos.map((v) => ({
      ...v,
      duration: durationMap[v.id] ?? Number.MAX_SAFE_INTEGER,
      type: getVideoType(v),
    }));
  } catch (error) {
    logger.error('Error fetching videos:', error);
    throw handleAPIError(error);
  }
}

// 🔹 Fetch YouTube metadata fallback
async function fetchYouTubeMetadata(id: string): Promise<Omit<Video, 'id'> | null> {
  try {
    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${id}&key=${import.meta.env.VITE_YT_API_KEY}`
    );
    const data = await res.json();
    const item = data.items?.[0];
    if (!item) return null;
    const title = item.snippet.title;
    const thumbnail = item.snippet.thumbnails?.high?.url;
    const durationIso = item.contentDetails.duration;
    const match = durationIso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    const h = +match?.[1] || 0,
      m = +match?.[2] || 0,
      s = +match?.[3] || 0;
    const duration = h * 3600 + m * 60 + s;
    // Determine type for fallback
    const type = getVideoType({ title, duration });
    return { title, thumbnail, duration, type };
  } catch (err) {
    logger.error('YT metadata fallback failed:', err);
    return null;
  }
}

// 🔹 Get video by ID
export async function getVideoById(id: string): Promise<Video> {
  try {
    const docRef = doc(db, 'videos', id);
    const snap = await getDoc(docRef);
    let data: Omit<Video, 'id'> | null = null;
    if (snap.exists()) {
      data = snap.data() as Omit<Video, 'id'>;
      // If title is missing or is 'Unknown Title', fetch from YouTube
      if (!data.title || data.title === 'Unknown Title') {
        const yt = await fetchYouTubeMetadata(id);
        if (yt) {
          await setDoc(docRef, {
            title: yt.title,
            thumbnail: yt.thumbnail,
            duration: yt.duration,
          }, { merge: true });
          return { id, ...yt };
        }
      } else {
        return { id, ...data };
      }
    }

    // 🔁 Fallback to YouTube API if not in Firestore
    const yt = await fetchYouTubeMetadata(id);
    if (yt) {
      await setDoc(docRef, {
        title: yt.title,
        thumbnail: yt.thumbnail,
        duration: yt.duration,
      });
      return { id, ...yt };
    }
  } catch (err) {
    logger.error(`Error fetching video ${id}:`, err);
  }

  return {
    id,
    title: 'Unknown Title',
    thumbnail: `https://img.youtube.com/vi/${id}/hqdefault.jpg`,
    duration: 0,
    type: 'video',
  };
}

// 🔹 Continue Watching videos (per user)
export async function getContinueWatching(userId: string): Promise<Video[]> {
  try {
    const docRef = doc(db, 'userWatchHistory', userId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return [];

    return (docSnap.data().videos as Video[]) || [];
  } catch (err) {
    logger.error(
      `Failed to get continue watching videos for ${userId}:`,
      err
    );
    return [];
  }
}

// 🔹 Daily Playlist (personalized)
export async function getDailyPlaylist(userId: string): Promise<Video[]> {
  try {
    const docRef = doc(db, 'userPlaylists', userId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return [];

    return (docSnap.data().daily as Video[]) || [];
  } catch (err) {
    logger.error(`Failed to get daily playlist for ${userId}:`, err);
    return [];
  }
}

// 🔹 Live Videos (from Firestore)
export async function getLiveVideos(): Promise<Video[]> {
  try {
    const colRef = collection(db, 'liveVideos');
    const snap = await getDocs(colRef);
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Video) }));
  } catch (err) {
    logger.error('Failed to fetch live videos:', err);
    return [];
  }
}

export async function getTrendingVideos(days = 1, max = 10): Promise<Video[]> {
  const since = new Date();
  since.setDate(since.getDate() - days);
  const q = query(
    collection(db, 'videos'),
    where('lastViewed', '>=', Timestamp.fromDate(since)),
    orderBy('lastViewed', 'desc'),
    orderBy('views', 'desc'),
    limit(max)
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => {
    const rest = d.data();
    return { ...rest, id: d.id } as Video;
  });
}
