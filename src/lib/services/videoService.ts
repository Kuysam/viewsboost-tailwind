// src/lib/services/videoService.ts

import { collection, getDocs, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { logger } from '../logger';
import { getUploadsPlaylistId } from '../youtube-caching/getUploadsPlaylistId';
import { getAllChannelVideos } from '../youtube';
import { handleAPIError } from '../errorHandling';

export interface Video {
  id: string;
  title: string;
  thumbnail: string;
  duration: number;
  type: 'short' | 'video';
  channelId?: string;
  publishedAt?: string;
  viewCount?: number;
  description?: string;
  tags?: string[];
  createdAt?: any;
  youtubeId?: string;
  creatorId?: string;
  lastSynced?: string;
  [key: string]: any;
}

interface Creator {
  id: string;
  channelId: string;
  name?: string;
  [key: string]: any;
}

// Fetch all videos from Firestore (for UI/dashboard/feed)
export async function getVideos(): Promise<Video[]> {
  try {
    const snap = await getDocs(collection(db, 'videos'));
    return snap.docs.map((d) => ({
      ...d.data(),
      id: d.id
    } as Video));
  } catch (err) {
    logger.error('Failed to fetch videos:', err);
    return [];
  }
}

export async function getVideosByType(type: 'short' | 'video'): Promise<Video[]> {
  try {
    const allVideos = await getVideos();
    return allVideos.filter(video => video.type === type);
  } catch (err) {
    logger.error(`Failed to fetch ${type}s:`, err);
    return [];
  }
}

export async function getVideoById(id: string): Promise<Video | null> {
  try {
    const snap = await getDoc(doc(db, 'videos', id));
    if (snap.exists()) {
      const data = snap.data() as Omit<Video, 'id'>;
      return {
        id: snap.id,
        ...data
      };
    }
    logger.error(`Video ${id} not found in Firestore.`);
    return null;
  } catch (err) {
    logger.error(`Failed to fetch video ${id}:`, err);
    return null;
  }
}

export async function saveVideo(video: Omit<Video, 'id'>): Promise<void> {
  try {
    await setDoc(doc(db, 'videos', video.youtubeId || ''), {
      ...video,
      lastSynced: new Date().toISOString()
    });
  } catch (err) {
    logger.error('Failed to save video:', err);
  }
}

export async function updateVideo(id: string, updates: Partial<Video>): Promise<void> {
  try {
    await updateDoc(doc(db, 'videos', id), {
      ...updates,
      lastSynced: new Date().toISOString()
    });
  } catch (err) {
    logger.error(`Failed to update video ${id}:`, err);
  }
}

export async function getTrendingVideos(page: number = 1, limit: number = 20): Promise<Video[]> {
  try {
    const snap = await getDocs(collection(db, 'videos'));
    return snap.docs.map((d) => {
      const data = d.data() as Omit<Video, 'id'>;
      return {
        id: d.id,
        ...data
      };
    });
  } catch (err) {
    logger.error('Failed to fetch trending videos:', err);
    return [];
  }
}

export async function syncCreatorVideos(): Promise<void> {
  try {
    const creatorsSnap = await getDocs(collection(db, 'creators'));
    const creators: Creator[] = creatorsSnap.docs.map(d => ({
      id: d.id,
      channelId: d.data().channelId || '',
      ...d.data()
    } as Creator));

    for (const creator of creators) {
      if (!creator.channelId) continue;
      const uploadsPlaylistId = await getUploadsPlaylistId(creator.channelId);
      const videos = await getAllChannelVideos(uploadsPlaylistId);
      
      for (const video of videos) {
        const videoData: Omit<Video, 'id'> = {
          ...video,
          type: video.duration <= 240 ? 'short' : 'video',
          creatorId: creator.id,
          youtubeId: video.id,
          lastSynced: new Date().toISOString()
        };
        await saveVideo(videoData);
      }
    }
  } catch (error) {
    logger.error('Failed to sync creator videos:', error);
  }
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
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Video) }));
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
    }));

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
