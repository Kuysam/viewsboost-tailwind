import { db } from '../firebase';
import { 
  collection, 
  query, 
  orderBy, 
  limit, 
  getDocs,
  Timestamp,
  setDoc,
  doc 
} from 'firebase/firestore';
import packageJson from '../../../package.json';

interface ErrorLog {
  timestamp: Timestamp;
  error: string;
  stackTrace: string;
  userId?: string;
  path: string;
  browserInfo: string;
}

interface FeatureUsage {
  featureId: string;
  name: string;
  usageCount: number;
  lastUsed: Timestamp;
}

interface VersionInfo {
  version: string;
  timestamp: Timestamp;
  activeUsers: number;
  environment: string;
}

interface SystemStatus {
  status: 'healthy' | 'warning' | 'critical';
  lastChecked: Timestamp;
  message?: string;
}

export const platformHealthService = {
  // Initialize collections if they don't exist
  initializeCollections: async () => {
    try {
      const collections = ['errorLogs', 'featureUsage', 'versionUsage', 'systemStatus'];
      
      for (const collectionName of collections) {
        const dummyDoc = doc(collection(db, collectionName), 'init');
        await setDoc(dummyDoc, {
          initialized: true,
          timestamp: Timestamp.now()
        }, { merge: true });
      }
    } catch (error) {
      console.error('Error initializing collections:', error);
    }
  },

  // Get current app version
  getCurrentVersion: () => {
    return {
      version: packageJson.version || '1.0.0',
      environment: import.meta.env.MODE || 'development',
      lastUpdated: new Date().toISOString()
    };
  },

  // Get system status
  getSystemStatus: async (): Promise<SystemStatus> => {
    try {
      const statusRef = collection(db, 'systemStatus');
      const q = query(statusRef, orderBy('timestamp', 'desc'), limit(1));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        return {
          status: 'healthy',
          lastChecked: Timestamp.now(),
          message: 'System is operating normally'
        };
      }

      return snapshot.docs[0].data() as SystemStatus;
    } catch (error) {
      return {
        status: 'warning',
        lastChecked: Timestamp.now(),
        message: 'Unable to fetch system status'
      };
    }
  },

  // Get recent error logs with fallback
  getRecentErrors: async (limitCount: number = 50): Promise<ErrorLog[]> => {
    try {
      const logsRef = collection(db, 'errorLogs');
      const q = query(
        logsRef,
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          timestamp: data.timestamp || Timestamp.now(),
          error: data.error || 'Unknown error',
          stackTrace: data.stackTrace || '',
          userId: data.userId,
          path: data.path || '',
          browserInfo: data.browserInfo || ''
        } as ErrorLog;
      });
    } catch (error) {
      return [];
    }
  },

  // Get feature usage statistics with fallback
  getFeatureUsageStats: async (): Promise<FeatureUsage[]> => {
    try {
      const featureRef = collection(db, 'featureUsage');
      const q = query(
        featureRef,
        orderBy('usageCount', 'desc')
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          featureId: data.featureId || doc.id,
          name: data.name || 'Unknown Feature',
          usageCount: data.usageCount || 0,
          lastUsed: data.lastUsed || Timestamp.now()
        } as FeatureUsage;
      });
    } catch (error) {
      return [];
    }
  },

  // Get version distribution with fallback
  getVersionDistribution: async (): Promise<VersionInfo[]> => {
    try {
      const versionsRef = collection(db, 'versionUsage');
      const q = query(
        versionsRef,
        orderBy('timestamp', 'desc'),
        limit(10)
      );

      const snapshot = await getDocs(q);
      if (snapshot.empty) {
        return [{
          version: packageJson.version || '1.0.0',
          timestamp: Timestamp.now(),
          activeUsers: 1,
          environment: import.meta.env.MODE || 'development'
        }];
      }

      return snapshot.docs.map(doc => ({
        ...doc.data()
      })) as VersionInfo[];
    } catch (error) {
      return [{
        version: packageJson.version || '1.0.0',
        timestamp: Timestamp.now(),
        activeUsers: 1,
        environment: import.meta.env.MODE || 'development'
      }];
    }
  },

  // Get platform health overview with fallback data
  getPlatformHealth: async () => {
    try {
      // Initialize collections if needed
      await platformHealthService.initializeCollections();

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const [errors, features, versions, systemStatus] = await Promise.all([
        platformHealthService.getRecentErrors(10),
        platformHealthService.getFeatureUsageStats(),
        platformHealthService.getVersionDistribution(),
        platformHealthService.getSystemStatus()
      ]);

      return {
        systemStatus,
        recentErrors: errors,
        topFeatures: features.slice(0, 5),
        errorCount24h: errors.filter(error => 
          error.timestamp.toDate() >= today
        ).length,
        versionInfo: versions,
        currentVersion: platformHealthService.getCurrentVersion(),
        performanceMetrics: {
          responseTime: Math.random() * 100 + 50, // Example metric
          errorRate: Math.random() * 2, // Example metric
          activeUsers: Math.floor(Math.random() * 100 + 50) // Example metric
        }
      };
    } catch (error) {
      console.error('Error fetching platform health data:', error);
      
      // Return fallback data
      return {
        systemStatus: {
          status: 'warning',
          lastChecked: Timestamp.now(),
          message: 'System status unavailable'
        },
        recentErrors: [],
        topFeatures: [],
        errorCount24h: 0,
        versionInfo: [{
          version: packageJson.version || '1.0.0',
          timestamp: Timestamp.now(),
          activeUsers: 1,
          environment: import.meta.env.MODE || 'development'
        }],
        currentVersion: platformHealthService.getCurrentVersion(),
        performanceMetrics: {
          responseTime: 100,
          errorRate: 0,
          activeUsers: 1
        }
      };
    }
  }
}; 