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

interface VideoStats {
  videoId: string;
  title: string;
  creatorId: string;
  creatorName: string;
  views: number;
  watchTime: number;
  averageRetention: number;
  likes: number;
  thumbnail: string;
  createdAt: Timestamp;
}

interface ChannelStats {
  creatorId: string;
  creatorName: string;
  totalViews: number;
  totalWatchTime: number;
  subscriberCount: number;
  videoCount: number;
  averageRetention: number;
  profilePic: string;
}

interface RetentionData {
  timestamp: Timestamp;
  sessionDuration: number;
  completionRate: number;
  bounceRate: number;
}

export const contentAnalyticsService = {
  // Get trending videos
  getTrendingVideos: async (timeRange: 'day' | 'week' | 'month' = 'day'): Promise<VideoStats[]> => {
    const videosRef = collection(db, 'videoStats');
    const startDate = new Date();
    
    if (timeRange === 'week') startDate.setDate(startDate.getDate() - 7);
    if (timeRange === 'month') startDate.setDate(startDate.getDate() - 30);

    const q = query(
      videosRef,
      where('createdAt', '>=', startDate),
      orderBy('views', 'desc'),
      limit(10)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      videoId: doc.id,
      ...doc.data()
    })) as VideoStats[];
  },

  // Get top channels
  getTopChannels: async (): Promise<ChannelStats[]> => {
    const channelsRef = collection(db, 'channelStats');
    const q = query(
      channelsRef,
      orderBy('totalViews', 'desc'),
      limit(10)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      creatorId: doc.id,
      ...doc.data()
    })) as ChannelStats[];
  },

  // Get retention analytics
  getRetentionAnalytics: async (days: number = 7): Promise<RetentionData[]> => {
    const retentionRef = collection(db, 'retentionStats');
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const q = query(
      retentionRef,
      where('timestamp', '>=', startDate),
      orderBy('timestamp', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data()) as RetentionData[];
  }
}; 