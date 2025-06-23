// src/lib/services/videoService.ts

import { db } from '../firebase';
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
import { getAllChannelVideos, getUploadsPlaylistId } from '../youtube';

export interface Video {
  id: string;
  title: string;
  thumbnail: string;
  duration: number;
  type: 'short' | 'video';
  creatorId?: string;
  lastSynced?: string;
}

// Fetch all videos from Firestore (for UI/dashboard/feed)
export async function getVideos(): Promise<Video[]> {
  try {
    const snap = await getDocs(collection(db, 'videos'));
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Video));
  } catch (err) {
    logger.error('Error fetching videos:', err);
    return [];
  }
}

export async function getTrendingVideos(days = 1, max = 10): Promise<Video[]> {
  try {
    const since = new Date();
    since.setDate(since.getDate() - days);
    const qTrending = query(
      collection(db, 'videos'),
      where('lastViewed', '>=', Timestamp.fromDate(since)),
      orderBy('lastViewed', 'desc'),
      orderBy('views', 'desc'),
      limit(max)
    );
    const snap = await getDocs(qTrending);
    return snap.docs.map(d => ({ ...d.data(), id: d.id } as Video));
  } catch (err) {
    logger.error('Failed to get trending videos:', err);
    return [];
  }
}

export async function getVideoById(id: string): Promise<Video> {
  try {
    const docRef = doc(db, 'videos', id);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return { ...(snap.data() as Video), id };
    }
    logger.warn(`Video ${id} not found in Firestore.`);
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

export async function getContinueWatching(userId: string): Promise<Video[]> {
  try {
    const docRef = doc(db, 'userWatchHistory', userId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return [];
    return (docSnap.data().videos as Video[]) || [];
  } catch (err) {
    logger.error(`Failed to get continue watching videos for ${userId}:`, err);
    return [];
  }
}

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

export async function getLiveVideos(): Promise<Video[]> {
  try {
    const colRef = collection(db, 'videos');
    const qLive = query(colRef, where('type', '==', 'live'));
    const snap = await getDocs(qLive);
    return snap.docs.map((d) => ({ ...(d.data() as Video), id: d.id }));
  } catch (err) {
    logger.error('Failed to fetch live videos:', err);
    return [];
  }
}

// Ingest ALL creators' YouTube videos into Firestore (admin/cron only)
export async function ingestAllCreatorsVideosToFirestore() {
  try {
    const creatorsSnapshot = await getDocs(collection(db, 'creators'));
    const creators = creatorsSnapshot.docs.map(d => ({
      id: d.id,
      ...d.data(),
    })) as Array<{ id: string; channelId?: string; [key: string]: any }>;

    for (const creator of creators) {
      if (!creator.channelId) continue;
      const uploadsPlaylistId = await getUploadsPlaylistId(creator.channelId);
      const videos = await getAllChannelVideos(uploadsPlaylistId);

      for (const video of videos) {
        const type = video.duration <= 240 ? 'short' : 'video';
        const docRef = doc(db, 'videos', video.id);
        await setDoc(docRef, {
          ...video,
          type,
          creatorId: creator.id,
          lastSynced: new Date().toISOString(),
        }, { merge: true });
      }
    }
    logger.info('Ingestion complete!');
  } catch (error) {
    logger.error('Error ingesting all creators videos:', error);
    throw handleAPIError(error);
  }
}
