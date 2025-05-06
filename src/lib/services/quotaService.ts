import { db } from '../firebase';
import { 
  collection, 
  query, 
  orderBy, 
  limit, 
  onSnapshot,
  addDoc,
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore';

export interface QuotaData {
  timestamp: Timestamp;
  quotaUsed: number;
  quotaRemaining: number;
  totalQuota: number;
  updatedBy: string;
}

const QUOTA_COLLECTION = 'quotaUsage';
const TOTAL_QUOTA = 10000;

export const quotaService = {
  // Subscribe to quota updates
  subscribeToQuota: (callback: (data: QuotaData[]) => void) => {
    const quotaRef = collection(db, QUOTA_COLLECTION);
    const quotaQuery = query(
      quotaRef,
      orderBy('timestamp', 'desc'),
      limit(24) // Last 24 hours
    );

    return onSnapshot(quotaQuery, (snapshot) => {
      const quotaData: QuotaData[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data() as QuotaData;
        quotaData.push({
          ...data,
          timestamp: data.timestamp as Timestamp
        });
      });
      callback(quotaData.reverse()); // Reverse to show oldest first
    });
  },

  // Add new quota usage entry
  addQuotaEntry: async (quotaUsed: number, adminEmail: string) => {
    try {
      const entry = {
        timestamp: serverTimestamp(),
        quotaUsed,
        quotaRemaining: TOTAL_QUOTA - quotaUsed,
        totalQuota: TOTAL_QUOTA,
        updatedBy: adminEmail
      };

      await addDoc(collection(db, QUOTA_COLLECTION), entry);
      return true;
    } catch (error) {
      console.error('Error adding quota entry:', error);
      return false;
    }
  },

  // Get total quota
  getTotalQuota: () => TOTAL_QUOTA
}; 