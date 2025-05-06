import { db } from '../firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  onSnapshot, 
  increment, 
  serverTimestamp 
} from 'firebase/firestore';

export const userStatsService = {
  // Track new login
  trackLogin: async () => {
    const today = new Date().toISOString().split('T')[0];
    const statsRef = doc(db, 'userStats', today);
    
    await setDoc(statsRef, {
      loginCount: increment(1),
      lastUpdated: serverTimestamp()
    }, { merge: true });
  },

  // Subscribe to user stats
  subscribeToStats: (callback: (data: any) => void) => {
    const statsRef = collection(db, 'userStats');
    
    return onSnapshot(statsRef, (snapshot) => {
      const stats: { [key: string]: number } = {};
      snapshot.forEach((doc) => {
        stats[doc.id] = doc.data().loginCount || 0;
      });
      callback(stats);
    });
  }
}; 