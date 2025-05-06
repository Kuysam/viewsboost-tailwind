import { getUploadsPlaylistId, getPlaylistVideos } from '../youtube';
import { auth } from '../firebase';
import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { logger } from '../logger';
import { handleAPIError } from '../errorHandling';
import { withRetry } from '../retryLogic';

export interface Video {
  id: string;
  title: string;
  thumbnail: string;
}

export async function getVideos(): Promise<Video[]> {
  try {
    logger.info('Fetching videos for current user');
    
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Get user's profile from Firestore
    const viewerDoc = await getDoc(doc(db, 'viewers', user.uid));
    if (!viewerDoc.exists()) {
      throw new Error('User profile not found');
    }

    // Get all creator documents
    const creatorsSnapshot = await getDocs(collection(db, 'creators'));
    const creatorIds = creatorsSnapshot.docs.map(doc => doc.id);
    
    // Get videos from all creators
    const allVideos: Video[] = [];
    for (const creatorId of creatorIds) {
      try {
        const creatorDoc = await getDoc(doc(db, 'creators', creatorId));
        if (creatorDoc.exists()) {
          const channelId = creatorDoc.data().channelId;
          if (channelId) {
            const uploadsPlaylistId = await getUploadsPlaylistId(channelId);
            const videos = await getPlaylistVideos(uploadsPlaylistId);
            allVideos.push(...videos);
          }
        }
      } catch (err) {
        logger.error(`Error fetching videos for creator ${creatorId}:`, err);
        // Continue with next creator if one fails
        continue;
      }
    }
    
    return allVideos;
  } catch (error) {
    logger.error('Error fetching videos:', error);
    throw handleAPIError(error);
  }
}

export async function getVideoById(id: string) {
  // Replace this with your actual video fetching logic
  // Example: fetch from Firestore, YouTube API, or your backend
  // Here is a placeholder:
  return {
    id,
    title: "Sample Video Title", // Replace with real title
    thumbnail: "https://img.youtube.com/vi/" + id + "/hqdefault.jpg", // Replace with real thumbnail if needed
  };
} 