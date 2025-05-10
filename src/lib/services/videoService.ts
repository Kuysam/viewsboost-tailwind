// src/lib/services/videoService.ts
import { getUploadsPlaylistId, getPlaylistVideos, getVideoDurations } from '../youtube';
import { auth } from '../firebase';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { logger } from '../logger';
import { handleAPIError } from '../errorHandling';

export interface Video {
  id: string;
  title: string;
  thumbnail: string;
  duration: number;
}

export async function getVideos(): Promise<Video[]> {
  try {
    logger.info('Fetching videos for current user');

    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Allow both viewers _or_ creators
    const viewerRef  = doc(db, 'viewers',  user.uid);
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
    const creatorIds = creatorsSnapshot.docs.map(d => d.id);

    // Gather all videos (no duration yet)
    const allVideos: Omit<Video, 'duration'>[] = [];
    for (const creatorId of creatorIds) {
      try {
        const cSnap = await getDoc(doc(db, 'creators', creatorId));
        if (!cSnap.exists()) continue;
        const channelId = cSnap.data().channelUrl as string;
        if (!channelId) continue;
        const uploadsPlaylistId = await getUploadsPlaylistId(channelId);
        const vids = await getPlaylistVideos(uploadsPlaylistId);
        allVideos.push(...vids);
      } catch (err: unknown) {
        logger.error(`Error fetching videos for creator ${creatorId}:`, err);
      }
    }

    // Fetch durations (in 50‑ID chunks) and merge
    let durationMap: Record<string, number> = {};
    try {
      durationMap = await getVideoDurations(allVideos.map(v => v.id));
    } catch (err: unknown) {
      logger.error('Failed to fetch video durations, defaulting to long durations:', err);
    }

    const videosWithDuration: Video[] = allVideos.map(v => ({
      ...v,
      duration: durationMap[v.id] ?? Number.MAX_SAFE_INTEGER,
    }));

    return videosWithDuration;

  } catch (error: unknown) {
    logger.error('Error fetching videos:', error);
    throw handleAPIError(error);
  }
}

/**
 * Fetch a single video's metadata by ID.
 * Currently returns a placeholder if not in Firestore.
 */
export async function getVideoById(id: string): Promise<Video> {
  // Try Firestore first
  try {
    const docRef = doc(db, 'videos', id);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data() as Omit<Video, 'id'>;
      return { id, ...data };
    }
  } catch (err) {
    logger.error(`Error fetching video ${id} from Firestore:`, err);
  }

  // Fallback to placeholder
  return {
    id,
    title: 'Unknown Title',
    thumbnail: `https://img.youtube.com/vi/${id}/hqdefault.jpg`,
    duration: 0,
  };
}
