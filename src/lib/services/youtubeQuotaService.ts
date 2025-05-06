import { db } from '../firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  onSnapshot,
  Timestamp,
  serverTimestamp 
} from 'firebase/firestore';

interface QuotaUsage {
  apiKey: string;
  quotaUsed: number;
  quotaRemaining: number;
  timestamp: Timestamp;
  operations: {
    search?: number;
    videos?: number;
    comments?: number;
    [key: string]: number | undefined;
  };
}

const DAILY_QUOTA_LIMIT = 10000;
const ALERT_THRESHOLD = 0.8; // 80% of quota

export const youtubeQuotaService = {
  // Track new API usage
  trackApiUsage: async (
    apiKey: string, 
    operation: string, 
    cost: number
  ) => {
    const today = new Date().toISOString().split('T')[0];
    const usageRef = doc(db, 'youtubeQuota', `${apiKey}_${today}`);
    
    const docSnap = await getDoc(usageRef);
    const currentUsage = docSnap.exists() ? docSnap.data() : null;
    
    const newQuotaUsed = (currentUsage?.quotaUsed || 0) + cost;
    const newQuotaRemaining = DAILY_QUOTA_LIMIT - newQuotaUsed;

    const operations = {
      ...(currentUsage?.operations || {}),
      [operation]: (currentUsage?.operations?.[operation] || 0) + cost
    };

    await setDoc(usageRef, {
      apiKey,
      quotaUsed: newQuotaUsed,
      quotaRemaining: newQuotaRemaining,
      timestamp: serverTimestamp(),
      operations,
      lastUpdated: serverTimestamp()
    }, { merge: true });

    // Check if we should trigger an alert
    if (newQuotaUsed / DAILY_QUOTA_LIMIT >= ALERT_THRESHOLD) {
      await this.createQuotaAlert(apiKey, newQuotaUsed, newQuotaRemaining);
    }
  },

  // Create quota alert
  createQuotaAlert: async (apiKey: string, used: number, remaining: number) => {
    const alertRef = doc(collection(db, 'quotaAlerts'));
    await setDoc(alertRef, {
      apiKey,
      quotaUsed: used,
      quotaRemaining: remaining,
      timestamp: serverTimestamp(),
      status: 'unread'
    });
  },

  // Subscribe to quota updates
  subscribeToQuotaUpdates: (callback: (data: QuotaUsage[]) => void) => {
    const today = new Date().toISOString().split('T')[0];
    const quotaRef = collection(db, 'youtubeQuota');
    const q = query(
      quotaRef,
      where('timestamp', '>=', today),
      orderBy('timestamp', 'desc')
    );

    return onSnapshot(q, (snapshot) => {
      const usage = snapshot.docs.map(doc => doc.data() as QuotaUsage);
      callback(usage);
    });
  },

  // Get historical usage
  getHistoricalUsage: async (days: number = 7) => {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const quotaRef = collection(db, 'youtubeQuota');
    const q = query(
      quotaRef,
      where('timestamp', '>=', startDate),
      orderBy('timestamp', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as QuotaUsage);
  }
}; 