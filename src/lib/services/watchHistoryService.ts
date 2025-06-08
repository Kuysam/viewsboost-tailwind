import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase';

export interface WatchEntry {
  progress: number;
  watchedAt: any; // Firestore timestamp
  lastPosition: number; // Last position in seconds
  totalWatched: number; // Total time watched in seconds
}

/**
 * Records a watch entry for a given user and video.
 * Now uses an object map to avoid serverTimestamp() inside arrays.
 */
export async function recordWatchProgress(
  userId: string,
  videoId: string,
  progress: number,
  currentTime: number,
  totalWatched: number
) {
  const ref = doc(db, 'userWatchHistory', userId);
  const snap = await getDoc(ref);

  const newEntry: WatchEntry = {
    progress,
    watchedAt: serverTimestamp(),
    lastPosition: currentTime,
    totalWatched,
  };

  if (!snap.exists()) {
    await setDoc(ref, {
      entries: {
        [videoId]: newEntry,
      },
    });
  } else {
    await updateDoc(ref, {
      [`entries.${videoId}`]: newEntry,
    });
  }
}
