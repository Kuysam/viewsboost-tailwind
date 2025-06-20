import { db } from '../firebase';
import { 
  collection, 
  doc, 
  query, 
  where, 
  orderBy, 
  limit, 
  getDocs,
  setDoc,
  increment,
  Timestamp,
  serverTimestamp,
  onSnapshot 
} from 'firebase/firestore';

interface UserActivity {
  userId: string;
  userEmail: string;
  action: 'login' | 'upload' | 'view' | 'create' | 'share' | 'download';
  details: string;
  timestamp: Timestamp;
  platform: string;
  ip?: string;
  userAgent?: string;
}

interface EngagementMetrics {
  userId: string;
  totalViews: number;
  totalUploads: number;
  totalShares: number;
  totalDownloads: number;
  averageSessionTime: number;
  lastActive: Timestamp;
  engagementScore: number;
}

interface SystemError {
  errorId: string;
  errorType: 'api' | 'scraping' | 'upload' | 'auth' | 'database';
  errorMessage: string;
  timestamp: Timestamp;
  severity: 'low' | 'medium' | 'high' | 'critical';
  source: string;
  stackTrace?: string;
  userId?: string;
  resolved: boolean;
}

interface RewardDistribution {
  userId: string;
  rewardType: 'views' | 'uploads' | 'referral' | 'achievement';
  amount: number;
  currency: 'points' | 'coins' | 'premium_days';
  reason: string;
  timestamp: Timestamp;
  transactionId: string;
}

export const activityMonitoringService = {
  // Track user activity
  trackUserActivity: async (
    userId: string,
    userEmail: string,
    action: UserActivity['action'],
    details: string,
    platform: string = 'web'
  ) => {
    const activityRef = doc(collection(db, 'userActivities'));
    await setDoc(activityRef, {
      userId,
      userEmail,
      action,
      details,
      timestamp: serverTimestamp(),
      platform
    });

    // Update user engagement metrics
    await this.updateEngagementMetrics(userId, action);
  },

  // Update engagement metrics
  updateEngagementMetrics: async (userId: string, action: UserActivity['action']) => {
    const metricsRef = doc(db, 'engagementMetrics', userId);
    const updateData: any = {
      lastActive: serverTimestamp()
    };

    switch (action) {
      case 'view':
        updateData.totalViews = increment(1);
        updateData.engagementScore = increment(1);
        break;
      case 'upload':
        updateData.totalUploads = increment(1);
        updateData.engagementScore = increment(5);
        break;
      case 'share':
        updateData.totalShares = increment(1);
        updateData.engagementScore = increment(3);
        break;
      case 'download':
        updateData.totalDownloads = increment(1);
        updateData.engagementScore = increment(2);
        break;
    }

    await setDoc(metricsRef, updateData, { merge: true });
  },

  // Log system error
  logSystemError: async (
    errorType: SystemError['errorType'],
    errorMessage: string,
    severity: SystemError['severity'],
    source: string,
    stackTrace?: string,
    userId?: string
  ) => {
    const errorRef = doc(collection(db, 'systemErrors'));
    await setDoc(errorRef, {
      errorId: errorRef.id,
      errorType,
      errorMessage,
      timestamp: serverTimestamp(),
      severity,
      source,
      stackTrace: stackTrace || null,
      userId: userId || null,
      resolved: false
    });

    // Create notification for critical errors
    if (severity === 'critical') {
      await this.createErrorNotification(errorRef.id, errorMessage, source);
    }
  },

  // Create error notification
  createErrorNotification: async (errorId: string, errorMessage: string, source: string) => {
    const notificationRef = doc(collection(db, 'adminNotifications'));
    await setDoc(notificationRef, {
      type: 'critical_error',
      title: 'Critical System Error',
      message: `${source}: ${errorMessage}`,
      errorId,
      timestamp: serverTimestamp(),
      read: false,
      priority: 'high'
    });
  },

  // Track reward distribution
  trackRewardDistribution: async (
    userId: string,
    rewardType: RewardDistribution['rewardType'],
    amount: number,
    currency: RewardDistribution['currency'],
    reason: string
  ) => {
    const rewardRef = doc(collection(db, 'rewardDistributions'));
    await setDoc(rewardRef, {
      userId,
      rewardType,
      amount,
      currency,
      reason,
      timestamp: serverTimestamp(),
      transactionId: rewardRef.id
    });
  },

  // Get recent user activities
  getRecentActivities: async (limitCount: number = 50): Promise<UserActivity[]> => {
    const activitiesRef = collection(db, 'userActivities');
    const q = query(activitiesRef, orderBy('timestamp', 'desc'), limit(limitCount));
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data()) as UserActivity[];
  },

  // Get engagement metrics
  getEngagementMetrics: async (limitCount: number = 20): Promise<EngagementMetrics[]> => {
    const metricsRef = collection(db, 'engagementMetrics');
    const q = query(metricsRef, orderBy('engagementScore', 'desc'), limit(limitCount));
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      userId: doc.id,
      ...doc.data()
    })) as EngagementMetrics[];
  },

  // Get system errors
  getSystemErrors: async (resolved: boolean = false, limitCount: number = 100): Promise<SystemError[]> => {
    const errorsRef = collection(db, 'systemErrors');
    const q = query(
      errorsRef,
      where('resolved', '==', resolved),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data()) as SystemError[];
  },

  // Get reward distributions
  getRewardDistributions: async (limitCount: number = 50): Promise<RewardDistribution[]> => {
    const rewardsRef = collection(db, 'rewardDistributions');
    const q = query(rewardsRef, orderBy('timestamp', 'desc'), limit(limitCount));
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data()) as RewardDistribution[];
  },

  // Subscribe to real-time activities
  subscribeToActivities: (callback: (activities: UserActivity[]) => void) => {
    const activitiesRef = collection(db, 'userActivities');
    const q = query(activitiesRef, orderBy('timestamp', 'desc'), limit(20));
    
    return onSnapshot(q, (snapshot) => {
      const activities = snapshot.docs.map(doc => doc.data() as UserActivity);
      callback(activities);
    });
  },

  // Subscribe to error notifications
  subscribeToErrors: (callback: (errors: SystemError[]) => void) => {
    const errorsRef = collection(db, 'systemErrors');
    const q = query(
      errorsRef,
      where('resolved', '==', false),
      orderBy('timestamp', 'desc'),
      limit(10)
    );
    
    return onSnapshot(q, (snapshot) => {
      const errors = snapshot.docs.map(doc => doc.data() as SystemError);
      callback(errors);
    });
  },

  // Get activity analytics
  getActivityAnalytics: async (days: number = 7) => {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const activitiesRef = collection(db, 'userActivities');
    const q = query(
      activitiesRef,
      where('timestamp', '>=', Timestamp.fromDate(startDate)),
      orderBy('timestamp', 'desc')
    );
    
    const snapshot = await getDocs(q);
    const analytics = {
      totalActivities: snapshot.size,
      activityTypes: {} as { [key: string]: number },
      dailyActivities: {} as { [key: string]: number }
    };
    
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      const action = data.action;
      const date = data.timestamp.toDate().toISOString().split('T')[0];
      
      analytics.activityTypes[action] = (analytics.activityTypes[action] || 0) + 1;
      analytics.dailyActivities[date] = (analytics.dailyActivities[date] || 0) + 1;
    });
    
    return analytics;
  }
}; 