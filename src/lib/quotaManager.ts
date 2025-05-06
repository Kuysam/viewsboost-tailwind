import { db } from './firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  limit,
  Timestamp,
  serverTimestamp
} from 'firebase/firestore';

export interface QuotaData {
  timestamp: Timestamp;
  quotaUsed: number;
  quotaRemaining: number;
  totalQuota: number;
  lastUpdated: Timestamp;
  updatedBy: string;
}

const QUOTA_COLLECTION = 'quotaUsage';
const TOTAL_QUOTA = 10000; // Total available quota

export const quotaManager = {
  // Subscribe to quota updates
  subscribeToQuotaUpdates: (callback: (data: QuotaData[]) => void) => {
    const quotaRef = collection(db, QUOTA_COLLECTION);
    const quotaQuery = query(
      quotaRef,
      orderBy('timestamp', 'desc'),
      limit(24) // Last 24 hours of data
    );

    return onSnapshot(quotaQuery, (snapshot) => {
      const quotaData: QuotaData[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data() as QuotaData;
        quotaData.push(data);
      });
      callback(quotaData.reverse()); // Reverse to show oldest first
    }, (error) => {
      console.error('Error fetching quota data:', error);
    });
  },

  // Log new quota usage
  logQuotaUsage: async (used: number, adminEmail: string) => {
    try {
      const now = Timestamp.now();
      const docId = now.toDate().getTime().toString();

      const quotaData: QuotaData = {
        timestamp: now,
        quotaUsed: used,
        quotaRemaining: TOTAL_QUOTA - used,
        totalQuota: TOTAL_QUOTA,
        lastUpdated: Timestamp.fromDate(new Date()),
        updatedBy: adminEmail
      };

      await setDoc(doc(db, QUOTA_COLLECTION, docId), {
        ...quotaData,
        lastUpdated: serverTimestamp() // Use server timestamp for accuracy
      });

      return quotaData;
    } catch (error) {
      console.error('Error logging quota usage:', error);
      throw error;
    }
  },

  // Get total quota
  getTotalQuota: () => TOTAL_QUOTA,

  // Calculate remaining quota
  calculateRemaining: (used: number) => TOTAL_QUOTA - used
}; 