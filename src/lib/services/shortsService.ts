// src/lib/services/shortsService.ts

import { db, auth } from '../firebase';
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  collection,
  addDoc,
  serverTimestamp,
  onSnapshot,
  deleteField,
  query,
  orderBy,
  getDocs,
  where,
} from 'firebase/firestore';
import { logger } from '../logger';

// --- Fetch all Shorts from Firestore ---
export async function getAllShorts() {
  try {
    const q = query(collection(db, 'videos'), where('type', '==', 'short'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (err) {
    logger.error("Shorts fetch failed:", err);
    return [];
  }
}

// --- Like or Unlike a Short (toggle) ---
export async function toggleShortLike(videoId: string) {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');
  const docRef = doc(db, 'videoLikes', videoId);
  const snap = await getDoc(docRef);

  if (snap.exists() && snap.data()[user.uid]) {
    // Unlike
    await updateDoc(docRef, { [user.uid]: deleteField() });
  } else {
    // Like
    await setDoc(docRef, { [user.uid]: true }, { merge: true });
  }
}

// --- Listen for like count and if current user liked (real-time) ---
export function listenShortLikes(
  videoId: string,
  cb: (count: number, liked: boolean) => void
) {
  return onSnapshot(doc(db, 'videoLikes', videoId), (docSnap) => {
    const user = auth.currentUser;
    const data = docSnap.exists() ? docSnap.data() : {};
    cb(Object.keys(data).length, !!(user?.uid && data[user.uid]));
  });
}

// --- Add a comment to a Short ---
export async function addShortComment(videoId: string, text: string) {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');
  const commentsCol = collection(db, 'videoComments', videoId, 'comments');
  await addDoc(commentsCol, {
    userId: user.uid,
    text,
    createdAt: serverTimestamp(),
  });
}

// --- Listen for comments on a Short (real-time, newest first) ---
export function listenShortComments(
  videoId: string,
  cb: (comments: any[]) => void
) {
  const commentsCol = collection(db, 'videoComments', videoId, 'comments');
  const q = query(commentsCol, orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
}

// --- Get all likes for analytics (optional helper) ---
export async function getShortLikes(videoId: string): Promise<string[]> {
  try {
    const snap = await getDoc(doc(db, 'videoLikes', videoId));
    return snap.exists() ? Object.keys(snap.data() || {}) : [];
  } catch (err) {
    logger.error("Get likes failed:", err);
    return [];
  }
}

// --- Get all comments for a Short (not real-time) ---
export async function getShortComments(videoId: string): Promise<any[]> {
  try {
    const commentsCol = collection(db, 'videoComments', videoId, 'comments');
    const q = query(commentsCol, orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (err) {
    logger.error("Get comments failed:", err);
    return [];
  }
}
