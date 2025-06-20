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
  serverTimestamp 
} from 'firebase/firestore';

interface TemplateSource {
  sourceName: string;
  sourceUrl: string;
  templateCount: number;
  lastImported: Timestamp;
  totalImports: number;
  categories: string[];
  status: 'active' | 'inactive' | 'error';
}

interface TemplateUsage {
  templateId: string;
  templateTitle: string;
  category: string;
  usageCount: number;
  lastUsed: Timestamp;
  popularityScore: number;
}

interface ImportHistory {
  timestamp: Timestamp;
  sourceName: string;
  templatesImported: number;
  adminUser: string;
  status: 'success' | 'partial' | 'failed';
  errorDetails?: string;
}

export const templateAnalyticsService = {
  // Track template import from source
  trackTemplateImport: async (
    sourceName: string,
    sourceUrl: string,
    templatesCount: number,
    categories: string[],
    adminUser: string,
    status: 'success' | 'partial' | 'failed' = 'success',
    errorDetails?: string
  ) => {
    // Update source statistics
    const sourceRef = doc(db, 'templateSources', sourceName);
    await setDoc(sourceRef, {
      sourceName,
      sourceUrl,
      templateCount: increment(templatesCount),
      lastImported: serverTimestamp(),
      totalImports: increment(1),
      categories: [...new Set(categories)],
      status: status === 'success' ? 'active' : 'error'
    }, { merge: true });

    // Record import history
    const historyRef = doc(collection(db, 'templateImportHistory'));
    await setDoc(historyRef, {
      timestamp: serverTimestamp(),
      sourceName,
      templatesImported: templatesCount,
      adminUser,
      status,
      errorDetails: errorDetails || null
    });
  },

  // Track template usage
  trackTemplateUsage: async (templateId: string, templateTitle: string, category: string) => {
    const usageRef = doc(db, 'templateUsage', templateId);
    await setDoc(usageRef, {
      templateId,
      templateTitle,
      category,
      usageCount: increment(1),
      lastUsed: serverTimestamp(),
      popularityScore: increment(1)
    }, { merge: true });
  },

  // Get template sources analytics
  getTemplateSourcesAnalytics: async (): Promise<TemplateSource[]> => {
    const sourcesRef = collection(db, 'templateSources');
    const q = query(sourcesRef, orderBy('totalImports', 'desc'));
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      ...doc.data()
    })) as TemplateSource[];
  },

  // Get popular templates
  getPopularTemplates: async (limitCount: number = 20): Promise<TemplateUsage[]> => {
    const usageRef = collection(db, 'templateUsage');
    const q = query(usageRef, orderBy('usageCount', 'desc'), limit(limitCount));
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data()) as TemplateUsage[];
  },

  // Get import history
  getImportHistory: async (limitCount: number = 50): Promise<ImportHistory[]> => {
    const historyRef = collection(db, 'templateImportHistory');
    const q = query(historyRef, orderBy('timestamp', 'desc'), limit(limitCount));
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data()) as ImportHistory[];
  },

  // Get daily template stats
  getDailyTemplateStats: async (days: number = 7) => {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const historyRef = collection(db, 'templateImportHistory');
    const q = query(
      historyRef,
      where('timestamp', '>=', Timestamp.fromDate(startDate)),
      orderBy('timestamp', 'desc')
    );
    
    const snapshot = await getDocs(q);
    const dailyStats: { [date: string]: { imports: number; templates: number } } = {};
    
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      const date = data.timestamp.toDate().toISOString().split('T')[0];
      
      if (!dailyStats[date]) {
        dailyStats[date] = { imports: 0, templates: 0 };
      }
      
      dailyStats[date].imports += 1;
      dailyStats[date].templates += data.templatesImported || 0;
    });
    
    return dailyStats;
  },

  // Get category distribution
  getCategoryDistribution: async () => {
    const templatesRef = collection(db, 'templates');
    const snapshot = await getDocs(templatesRef);
    
    const categoryCount: { [category: string]: number } = {};
    
    snapshot.docs.forEach(doc => {
      const category = doc.data().category || 'Uncategorized';
      categoryCount[category] = (categoryCount[category] || 0) + 1;
    });
    
    return Object.entries(categoryCount)
      .sort(([,a], [,b]) => b - a)
      .map(([category, count]) => ({ category, count }));
  }
}; 