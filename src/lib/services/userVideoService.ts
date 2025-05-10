import { db } from '../firebase';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';

// CONTINUE WATCHING
export async function getContinueWatching(userId: string) {
  const docRef = doc(db, 'userWatchHistory', userId);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) return [];
  return docSnap.data().videos || [];
}

// DAILY PLAYLIST
export async function getDailyPlaylist(userId: string) {
  const docRef = doc(db, 'userPlaylists', userId);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) return [];
  return docSnap.data().daily || [];
}

// LIVE VIDEOS
export async function getLiveVideos() {
  const colRef = collection(db, 'liveVideos');
  const snap = await getDocs(colRef);
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}
