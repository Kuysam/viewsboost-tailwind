import { db } from '../firebase';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  getDocs,
  Timestamp
} from 'firebase/firestore';

interface UserActivity {
  userId: string;
  email: string;
  role: string;
  totalWatchTime: number;
  lastActive: Timestamp;
  loginCount: number;
  videosWatched: number;
}

interface DailyStats {
  date: string;
  newUsers: number;
  totalLogins: number;
  totalWatchTime: number;
  activeUsers: number;
}

export const userAnalyticsService = {
  // Get daily login stats
  getDailyLoginStats: async (days: number = 7): Promise<DailyStats[]> => {
    const stats: DailyStats[] = [];
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const logsRef = collection(db, 'userLogs');
    const q = query(
      logsRef,
      where('timestamp', '>=', Timestamp.fromDate(startDate)),
      orderBy('timestamp', 'desc')
    );

    const snapshot = await getDocs(q);
    // Process and aggregate data by day
    // ... implementation

    return stats;
  },

  // Get new user registrations
  getNewUserStats: async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const usersRef = collection(db, 'users');
    
    // Today's new users
    const todayQuery = query(
      usersRef,
      where('createdAt', '>=', Timestamp.fromDate(today)),
      where('createdAt', '<', Timestamp.fromDate(tomorrow))
    );
    
    // This week's new users
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 7);
    const weekQuery = query(
      usersRef,
      where('createdAt', '>=', Timestamp.fromDate(weekStart))
    );

    const [todaySnap, weekSnap] = await Promise.all([
      getDocs(todayQuery),
      getDocs(weekQuery)
    ]);

    return {
      today: todaySnap.size,
      thisWeek: weekSnap.size
    };
  },

  // Get watch time analytics
  getWatchTimeStats: async () => {
    const watchTimeRef = collection(db, 'watchTime');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 7);

    const todayQuery = query(
      watchTimeRef,
      where('timestamp', '>=', Timestamp.fromDate(today))
    );

    const weekQuery = query(
      watchTimeRef,
      where('timestamp', '>=', Timestamp.fromDate(weekStart))
    );

    const [todaySnap, weekSnap] = await Promise.all([
      getDocs(todayQuery),
      getDocs(weekQuery)
    ]);

    return {
      today: todaySnap.docs.reduce((total, doc) => total + doc.data().duration, 0),
      thisWeek: weekSnap.docs.reduce((total, doc) => total + doc.data().duration, 0)
    };
  },

  // Get top active users
  getTopActiveUsers: async (limit: number = 10): Promise<UserActivity[]> => {
    const usersRef = collection(db, 'userActivity');
    const q = query(
      usersRef,
      orderBy('totalWatchTime', 'desc'),
      limit
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      userId: doc.id,
      ...doc.data()
    })) as UserActivity[];
  }
}; 