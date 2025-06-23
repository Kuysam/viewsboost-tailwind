// src/pages/AdminPanel.tsx

import { useEffect, useState } from "react";
import { db } from "../lib/firebase";
import { collection, getDocs, doc, getDoc, setDoc, deleteDoc, updateDoc, addDoc } from "firebase/firestore";
import { getApiKeyList } from "../lib/youtube/apiKeyManager";
import { getAllChannelVideos, getUploadsPlaylistId } from "../lib/youtube";
import TemplateImporter from "./TemplateImporter";
import { logoutUser } from "../lib/auth";
import { useNavigate } from "react-router-dom";
import { templateAnalyticsService } from "../lib/services/templateAnalyticsService";
import { activityMonitoringService } from "../lib/services/activityMonitoringService";
import { youtubeQuotaService } from "../lib/services/youtubeQuotaService";
import { reanalyzePlatformData, analyzePlatformBias } from "../utils/platformReanalysisScript";
import { externalApiService } from "../lib/services/externalApiService";

type QuotaStats = {
  [key: string]: {
    used?: number;
    errors?: number;
    [key: string]: any;
  };
};

export default function AdminPanel() {
  const [users, setUsers] = useState<any[]>([]);
  const [creators, setCreators] = useState<any[]>([]);
  const [quota, setQuota] = useState<QuotaStats>({});
  const [videos, setVideos] = useState<any[]>([]);
  const [ingesting, setIngesting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [ingestMsg, setIngestMsg] = useState("");
  const [done, setDone] = useState(false);
  const [templates, setTemplates] = useState<any[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(true);
  const [previewTemplate, setPreviewTemplate] = useState<any | null>(null);
  const [showImporterModal, setShowImporterModal] = useState(false);
  
  // New analytics states
  const [activeTab, setActiveTab] = useState<'overview' | 'analytics' | 'templates' | 'activity' | 'errors'>('overview');
  const [templateSources, setTemplateSources] = useState<any[]>([]);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [systemErrors, setSystemErrors] = useState<any[]>([]);
  const [engagementMetrics, setEngagementMetrics] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [externalSearchTerm, setExternalSearchTerm] = useState("");
  const [externalSearchResults, setExternalSearchResults] = useState<any[]>([]);
  const [filterType, setFilterType] = useState<'all' | 'users' | 'creators' | 'templates'>('all');
  const [bulkSelectedTemplates, setBulkSelectedTemplates] = useState<Set<string>>(new Set());
  const [categoryDistribution, setCategoryDistribution] = useState<any[]>([]);
  const [quotaHistory, setQuotaHistory] = useState<any[]>([]);
  const [realTimeActivities, setRealTimeActivities] = useState<any[]>([]);
  const [platformStats, setPlatformStats] = useState<any[]>([]);
  const [message, setMessage] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState<Set<string>>(new Set(['Pexels', 'Pixabay', 'Unsplash']));
  
  const navigate = useNavigate();

  async function handleLogout() {
    await logoutUser();
    navigate("/sign-in");
  }

  async function fetchTemplates() {
    setTemplatesLoading(true);
    const snap = await getDocs(collection(db, "templates"));
    setTemplates(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    setTemplatesLoading(false);
  }

  async function fetchAnalyticsData() {
    try {
      // Fetch template analytics
      const sources = await templateAnalyticsService.getTemplateSourcesAnalytics();
      setTemplateSources(sources);

      const categoryDist = await templateAnalyticsService.getCategoryDistribution();
      setCategoryDistribution(categoryDist);

      // Fetch activity data
      const activities = await activityMonitoringService.getRecentActivities();
      setRecentActivities(activities);

      const engagement = await activityMonitoringService.getEngagementMetrics();
      setEngagementMetrics(engagement);

      const errors = await activityMonitoringService.getSystemErrors();
      setSystemErrors(errors);

      // Fetch quota history
      const quotaHist = await youtubeQuotaService.getHistoricalUsage(7);
      setQuotaHistory(quotaHist);

      // Fetch platform statistics
      await fetchPlatformStats();
    } catch (error) {
      console.error('Error fetching analytics data:', error);
    }
  }

  async function fetchPlatformStats() {
    try {
      // Get all templates to calculate live counts per platform
      const templatesSnap = await getDocs(collection(db, "templates"));
      const allTemplates = templatesSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

      // Get template sources from analytics service
      const sources = await templateAnalyticsService.getTemplateSourcesAnalytics();

      // Calculate live template counts per platform
      const platformData = sources.map(source => {
        // Count live templates from this platform/source using enhanced detection
        const liveTemplates = allTemplates.filter(template => {
          // Enhanced matching using new fields
          return template.detectedPlatform === source.sourceName ||
                 template.source === source.sourceName ||
                 template.platform === source.sourceName ||
                 (template.preview && template.preview.includes(source.sourceUrl?.replace('https://', '').replace('http://', '') || ''));
        });

        return {
          platformName: source.sourceName,
          sourceUrl: source.sourceUrl,
          lastImport: source.lastImported,
          totalImports: source.totalImports,
          liveTemplates: liveTemplates.length,
          status: source.status,
          categories: source.categories || []
        };
      });

      // Add platforms that have templates but no source tracking yet
      const knownPlatforms = new Set(platformData.map(p => p.platformName));
      
      // Check for Unsplash templates specifically (enhanced detection)
      const unsplashTemplates = allTemplates.filter(template => 
        template.detectedPlatform === 'Unsplash' ||
        template.source === 'Unsplash' ||
        template.platform === 'Unsplash' ||
        template.preview?.includes('unsplash.com')
      );

      if (unsplashTemplates.length > 0 && !knownPlatforms.has('Unsplash')) {
        platformData.push({
          platformName: 'Unsplash',
          sourceUrl: 'https://unsplash.com',
          lastImport: null,
          totalImports: 0,
          liveTemplates: unsplashTemplates.length,
          status: 'active',
          categories: [...new Set(unsplashTemplates.map(t => t.category).filter(Boolean))]
        });
      }

      // Check for other common platforms
      const platforms = [
        { name: 'Pexels', domain: 'pexels.com' },
        { name: 'Pixabay', domain: 'pixabay.com' },
        { name: 'Freepik', domain: 'freepik.com' },
        { name: 'Canva', domain: 'canva.com' },
        { name: 'Adobe Stock', domain: 'stock.adobe.com' }
      ];

      platforms.forEach(platform => {
        if (!knownPlatforms.has(platform.name)) {
          const platformTemplates = allTemplates.filter(template => 
            template.detectedPlatform === platform.name ||
            template.source === platform.name ||
            template.platform === platform.name ||
            template.preview?.includes(platform.domain)
          );

          if (platformTemplates.length > 0) {
            platformData.push({
              platformName: platform.name,
              sourceUrl: `https://${platform.domain}`,
              lastImport: null,
              totalImports: 0,
              liveTemplates: platformTemplates.length,
              status: 'active',
              categories: [...new Set(platformTemplates.map(t => t.category).filter(Boolean))]
            });
          }
        }
      });

      // Sort by live template count descending
      platformData.sort((a, b) => b.liveTemplates - a.liveTemplates);
      
      setPlatformStats(platformData);
    } catch (error) {
      console.error('Error fetching platform stats:', error);
    }
  }

  useEffect(() => {
    getDocs(collection(db, "users")).then((snap) =>
      setUsers(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
    getDocs(collection(db, "creators")).then((snap) =>
      setCreators(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
    getDocs(collection(db, "videos")).then((snap) =>
      setVideos(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );

    const today = new Date().toISOString().slice(0, 10);
    getDoc(doc(db, "quotaUsage", today)).then((snap) => {
      setQuota(snap.exists() ? (snap.data().keys || {}) : {});
    });

    fetchTemplates();
    fetchAnalyticsData();

    // Set up real-time activity monitoring
    const unsubscribe = activityMonitoringService.subscribeToActivities((activities) => {
      setRealTimeActivities(activities);
    });

    return () => unsubscribe();
  }, []);

  const handleIngest = async () => {
    setIngesting(true);
    setDone(false);
    setIngestMsg("Counting creators...");
    setProgress(0);

    try {
      const creatorsSnap = await getDocs(collection(db, "creators"));
      const creatorList = creatorsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
      if (!creatorList.length) throw new Error("No creators found.");

      let totalCreators = creatorList.length;
      let creatorCount = 0;
      let totalVideos = 0;
      let processedVideos = 0;

      for (const creator of creatorList) {
        if (!creator.channelId) {
          creatorCount++;
          setIngestMsg(`Skipping creator without channelId (${creator.id})...`);
          setProgress(Math.round((creatorCount / totalCreators) * 100));
          continue;
        }
        setIngestMsg(`Fetching videos for: ${creator.channelId} (${creatorCount + 1}/${totalCreators})`);
        const uploadsPlaylistId = await getUploadsPlaylistId(creator.channelId);
        const videosList = await getAllChannelVideos(uploadsPlaylistId);
        totalVideos += videosList.length;

        let doneForCreator = 0;
        for (const video of videosList) {
          const type = video.duration <= 240 ? "short" : "video";
          const docRef = doc(db, "videos", video.id);
          await setDoc(docRef, {
            ...video,
            youtubeId: video.id, // Always store the real YouTube ID!
            type,
            creatorId: creator.id,
            lastSynced: new Date().toISOString(),
          }, { merge: true });

          processedVideos++;
          doneForCreator++;
          const creatorWeight = 0.2;
          const videoWeight = 0.8;
          const creatorProgress = creatorWeight * ((creatorCount + doneForCreator / videosList.length) / totalCreators);
          const videoProgress = videoWeight * (processedVideos / (totalVideos || 1));
          setProgress(Math.round((creatorProgress + videoProgress) * 100));
        }
        creatorCount++;
        setProgress(Math.round((creatorCount / totalCreators) * 100));
      }
      setProgress(100);
      setIngestMsg("✅ All videos ingested! Shorts & Dashboard will update now.");
      setDone(true);
    } catch (e) {
      setIngesting(false);
      setDone(false);
      setIngestMsg("❌ Ingestion failed. See console for details.");
      return;
    }
    setIngesting(false);
    setDone(true);
  };

  function handleImportResult() {
    fetchTemplates();
    fetchAnalyticsData();
    setShowImporterModal(false);
  }

  // Enhanced refresh function to update platform stats
  const handleRefreshAll = async () => {
    await fetchTemplates();
    await fetchAnalyticsData();
  };

  // ENHANCED Retroactive platform detection using new algorithm  
  const handleAnalyzeExistingTemplates = async () => {
    if (!confirm("🚨 PLATFORM BIAS FIX: This will re-analyze ALL templates with the improved algorithm that prioritizes explicit platform data over preview URLs. Continue?")) {
      return;
    }

    setMessage("🔍 Starting comprehensive platform re-analysis with FIXED algorithm...");
    
    try {
      // First show current bias analysis
      const biasAnalysis = await analyzePlatformBias();
      setMessage(`📊 Current bias: ${biasAnalysis.biasWarning ? `⚠️ ${biasAnalysis.dominantPlatform} (${biasAnalysis.biasPercentage.toFixed(1)}%)` : '✅ Balanced'} | Starting re-analysis...`);
      
      // Run full re-analysis using the utility script
      const results = await reanalyzePlatformData();
      
      const platformSummary = Object.entries(results.platformDistribution)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([platform, count]) => `${platform}: ${count}`)
        .join(', ');
      
      setMessage(`✅ PLATFORM RE-ANALYSIS COMPLETE!
📈 Processed: ${results.totalProcessed} templates
🔄 Updated: ${results.updated} (with improved detection)
➡️ Unchanged: ${results.unchanged}
🏷️ Top platforms: ${platformSummary}
${results.errors.length > 0 ? `❌ Errors: ${results.errors.length}` : '✅ No errors'}`);
      
      // Refresh all stats to show new data
      await fetchPlatformStats();
      await fetchAnalyticsData();
      await fetchTemplates();
      
    } catch (error) {
      console.error('Error during platform re-analysis:', error);
      setMessage(`❌ Re-analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // External API search functionality with platform selection
  const handleExternalApiSearch = async () => {
    if (!externalSearchTerm.trim()) {
      setMessage("⚠️ Please enter a search term for external APIs");
      return;
    }

    if (selectedPlatforms.size === 0) {
      setMessage("⚠️ Please select at least one platform to search");
      return;
    }

    const selectedPlatformsArray = Array.from(selectedPlatforms);
    setMessage(`🔍 Searching ${selectedPlatformsArray.join(', ')} for: "${externalSearchTerm}"...`);
    
    try {
      // Search only selected platforms
      const searchPromises = [];
      if (selectedPlatforms.has('Pexels')) {
        searchPromises.push(externalApiService.searchPexels(externalSearchTerm));
      }
      if (selectedPlatforms.has('Pixabay')) {
        searchPromises.push(externalApiService.searchPixabay(externalSearchTerm));
      }
      if (selectedPlatforms.has('Unsplash')) {
        searchPromises.push(externalApiService.searchUnsplash(externalSearchTerm));
      }

      const results = await Promise.all(searchPromises);
      const allResults = results.flat();

      // Calculate platform distribution
      const platformDistribution: Record<string, number> = {};
      allResults.forEach(result => {
        platformDistribution[result.platform] = (platformDistribution[result.platform] || 0) + 1;
      });

      // Shuffle results to avoid platform bias
      const shuffledResults = allResults.sort(() => Math.random() - 0.5);

      setExternalSearchResults(shuffledResults);
      
      const platformSummary = Object.entries(platformDistribution)
        .map(([platform, count]) => `${platform}: ${count}`)
        .join(', ');
      
      setMessage(`✅ Found ${allResults.length} results from ${selectedPlatformsArray.join(', ')}! Distribution: ${platformSummary}`);
    } catch (error) {
      console.error("External API search error:", error);
      setMessage(`❌ External API search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Import templates from external APIs
  const handleImportFromExternalApis = async (limit: number = 20) => {
    if (externalSearchResults.length === 0) {
      setMessage("⚠️ No external search results to import. Search first!");
      return;
    }

    if (!confirm(`Import up to ${limit} templates from external APIs? This will add them to your database.`)) {
      return;
    }

    setMessage(`📥 Importing ${Math.min(limit, externalSearchResults.length)} templates from external APIs...`);
    
    try {
      const templatesToImport = externalSearchResults.slice(0, limit);
      let importedCount = 0;
      const platformBreakdown: Record<string, number> = {};

      for (const externalTemplate of templatesToImport) {
        try {
          // Convert external template to ViewsBoost format
          const viewsBoostTemplate = {
            title: externalTemplate.title,
            category: externalTemplate.category,
            prompt: externalTemplate.description,
            preview: externalTemplate.preview,
            imageUrl: externalTemplate.preview,
            platform: externalTemplate.platform,
            source: externalTemplate.platform,
            description: externalTemplate.description,
            tags: externalTemplate.tags || [],
            author: externalTemplate.author,
            license: externalTemplate.license,
            sourceUrl: externalTemplate.sourceUrl,
            importedAt: new Date().toISOString(),
            importedFrom: 'external_api',
            externalId: externalTemplate.id,
            createdAt: new Date()
          };

          // Save to Firestore
          await addDoc(collection(db, "templates"), viewsBoostTemplate);
          
          importedCount++;
          platformBreakdown[externalTemplate.platform] = 
            (platformBreakdown[externalTemplate.platform] || 0) + 1;

        } catch (error) {
          console.error(`Failed to import template ${externalTemplate.id}:`, error);
        }
      }

      const platformSummary = Object.entries(platformBreakdown)
        .map(([platform, count]) => `${platform}: ${count}`)
        .join(', ');

      setMessage(`✅ Successfully imported ${importedCount} templates! Platform breakdown: ${platformSummary}`);
      
      // Refresh templates
      fetchTemplates();
      
    } catch (error) {
      console.error("External API import error:", error);
      setMessage(`❌ External API import failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Bulk template operations
  const handleBulkDelete = async () => {
    if (bulkSelectedTemplates.size === 0) return;
    if (!confirm(`Delete ${bulkSelectedTemplates.size} selected templates?`)) return;

    for (const templateId of bulkSelectedTemplates) {
      await deleteDoc(doc(db, "templates", templateId));
    }
    
    setBulkSelectedTemplates(new Set());
    fetchTemplates();
  };

  const handleBulkApprove = async () => {
    if (bulkSelectedTemplates.size === 0) return;

    for (const templateId of bulkSelectedTemplates) {
      await updateDoc(doc(db, "templates", templateId), {
        approved: true,
        approvedAt: new Date().toISOString(),
        approvedBy: 'admin'
      });
    }
    
    setBulkSelectedTemplates(new Set());
    fetchTemplates();
  };

  // Filter functions
  const getFilteredData = () => {
    const searchLower = searchTerm.toLowerCase();
    
    switch (filterType) {
      case 'users':
        return users.filter(user => 
          user.email?.toLowerCase().includes(searchLower) ||
          user.displayName?.toLowerCase().includes(searchLower)
        );
      case 'creators':
        return creators.filter(creator =>
          creator.id?.toLowerCase().includes(searchLower) ||
          creator.channelId?.toLowerCase().includes(searchLower)
        );
      case 'templates':
        return templates.filter(template =>
          template.title?.toLowerCase().includes(searchLower) ||
          template.category?.toLowerCase().includes(searchLower)
        );
      default:
        return { users, creators, templates };
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverviewTab();
      case 'analytics':
        return renderAnalyticsTab();
      case 'templates':
        return renderTemplatesTab();
      case 'activity':
        return renderActivityTab();
      case 'errors':
        return renderErrorsTab();
      default:
        return renderOverviewTab();
    }
  };

  const renderOverviewTab = () => (
    <div className="space-y-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <div className="bg-gradient-to-br from-purple-900/30 to-blue-900/30 backdrop-blur-sm border border-purple-500/20 rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-300 text-sm font-semibold">Templates</p>
              <p className="text-3xl font-bold text-white">{templates.length}</p>
            </div>
            <div className="text-4xl">🎨</div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-blue-900/30 to-cyan-900/30 backdrop-blur-sm border border-blue-500/20 rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-300 text-sm font-semibold">Users</p>
              <p className="text-3xl font-bold text-white">{users.length}</p>
            </div>
            <div className="text-4xl">👥</div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-900/30 to-emerald-900/30 backdrop-blur-sm border border-green-500/20 rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-300 text-sm font-semibold">Creators</p>
              <p className="text-3xl font-bold text-white">{creators.length}</p>
            </div>
            <div className="text-4xl">⭐</div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-900/30 to-red-900/30 backdrop-blur-sm border border-orange-500/20 rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-300 text-sm font-semibold">Videos</p>
              <p className="text-3xl font-bold text-white">{videos.length}</p>
            </div>
            <div className="text-4xl">🎬</div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-cyan-900/30 to-teal-900/30 backdrop-blur-sm border border-cyan-500/20 rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-cyan-300 text-sm font-semibold">Platforms</p>
              <p className="text-3xl font-bold text-white">{platformStats.length}</p>
              <p className="text-xs text-gray-400 mt-1">
                {platformStats.reduce((sum, p) => sum + p.liveTemplates, 0)} live templates
              </p>
            </div>
            <div className="text-4xl">🏗️</div>
          </div>
        </div>
      </div>

      {/* Platform Quick Stats */}
      <div className="bg-gradient-to-br from-cyan-900/30 to-teal-900/30 backdrop-blur-sm border border-cyan-500/20 rounded-2xl p-6">
        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          🏗️ Top Platforms by Template Count
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {platformStats.slice(0, 6).map((platform, index) => (
            <div key={index} className="bg-black/30 rounded-lg p-4 flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-bold text-cyan-300">{platform.platformName}</h4>
                  <span className={`w-2 h-2 rounded-full ${
                    platform.status === 'active' ? 'bg-green-500' : 'bg-red-500'
                  }`} />
                </div>
                <div className="text-sm text-gray-400">
                  {platform.liveTemplates} live templates
                </div>
                <div className="text-xs text-gray-500">
                  Last import: {platform.lastImport?.toDate ? 
                    platform.lastImport.toDate().toLocaleDateString() : 
                    'Not tracked'
                  }
                </div>
              </div>
              <div className="text-2xl font-bold text-white bg-cyan-600/20 px-3 py-2 rounded-lg">
                {platform.liveTemplates}
              </div>
            </div>
          ))}
        </div>
        {platformStats.length === 0 && (
          <div className="text-center py-4">
            <p className="text-gray-400">Platform data will appear here after templates are imported</p>
          </div>
        )}
      </div>

      {/* Real-time Activity Feed */}
      <div className="bg-gradient-to-br from-gray-900/30 to-gray-800/30 backdrop-blur-sm border border-gray-700/20 rounded-2xl p-6">
        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          🔴 Live Activity Feed
        </h3>
        <div className="max-h-60 overflow-y-auto space-y-2">
          {realTimeActivities.slice(0, 10).map((activity, index) => (
            <div key={index} className="bg-black/30 rounded-lg p-3 flex items-center justify-between">
              <div>
                <span className="text-white font-medium">{activity.userEmail}</span>
                <span className="text-gray-400 ml-2">{activity.action}</span>
                <p className="text-sm text-gray-500">{activity.details}</p>
              </div>
              <span className="text-xs text-gray-400">
                {activity.timestamp?.toDate?.()?.toLocaleTimeString() || 'Now'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Data Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Users */}
        <div className="bg-gradient-to-br from-blue-900/20 to-cyan-900/20 backdrop-blur-sm border border-blue-500/20 rounded-2xl p-6">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            👥 Users ({users.length})
          </h3>
          <div className="max-h-60 overflow-auto space-y-2">
            {users.map((u) => (
              <div key={u.id} className="bg-black/30 rounded-lg p-3">
                <div className="font-semibold text-blue-300 text-sm">{u.id}</div>
                <div className="text-xs text-gray-400">{u.email || u.displayName || "No email"}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Creators */}
        <div className="bg-gradient-to-br from-green-900/20 to-emerald-900/20 backdrop-blur-sm border border-green-500/20 rounded-2xl p-6">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            ⭐ Creators ({creators.length})
          </h3>
          <div className="max-h-60 overflow-auto space-y-2">
            {creators.map((c) => (
              <div key={c.id} className="bg-black/30 rounded-lg p-3">
                <div className="font-semibold text-green-300 text-sm">{c.id}</div>
                <div className="text-xs text-gray-400">{c.channelId || "No channel"}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Videos */}
        <div className="bg-gradient-to-br from-orange-900/20 to-red-900/20 backdrop-blur-sm border border-orange-500/20 rounded-2xl p-6">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            🎬 Videos ({videos.length})
          </h3>
          <div className="max-h-60 overflow-auto space-y-2">
            {videos.map((v) => (
              <div key={v.id} className="bg-black/30 rounded-lg p-3">
                <div className="font-semibold text-orange-300 text-sm line-clamp-1">{v.title || "No title"}</div>
                <div className="text-xs text-gray-400">{v.duration ?? "?"}s duration</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderAnalyticsTab = () => (
    <div className="space-y-8">
      {/* Platform Overview - Live Template Counts */}
      <div className="bg-gradient-to-br from-cyan-900/30 to-teal-900/30 backdrop-blur-sm border border-cyan-500/20 rounded-2xl p-6">
        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          🏗️ Platform Overview - Live Template Distribution
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {platformStats.map((platform, index) => (
            <div key={index} className="bg-black/30 rounded-lg p-4 border-l-4 border-cyan-400">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-bold text-cyan-300 text-lg">{platform.platformName}</h4>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  platform.status === 'active' ? 'bg-green-600 text-white' :
                  platform.status === 'error' ? 'bg-red-600 text-white' :
                  'bg-gray-600 text-white'
                }`}>
                  {platform.status}
                </span>
              </div>
              
              <div className="space-y-2 mb-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Live Templates:</span>
                  <span className="text-xl font-bold text-white bg-cyan-600/20 px-2 py-1 rounded">
                    {platform.liveTemplates}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Total Imports:</span>
                  <span className="text-sm text-cyan-300 font-semibold">{platform.totalImports}</span>
                </div>
              </div>

              <div className="text-xs text-gray-500 mb-2">
                <div className="truncate" title={platform.sourceUrl}>
                  🌐 {platform.sourceUrl}
                </div>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">Last Import:</span>
                <span className="text-gray-400">
                  {platform.lastImport?.toDate ? 
                    platform.lastImport.toDate().toLocaleDateString() : 
                    'Not tracked'
                  }
                </span>
              </div>

              {platform.categories && platform.categories.length > 0 && (
                <div className="mt-2 text-xs">
                  <span className="text-gray-500">Categories: </span>
                  <span className="text-gray-400">{platform.categories.slice(0, 2).join(', ')}</span>
                  {platform.categories.length > 2 && (
                    <span className="text-gray-500"> +{platform.categories.length - 2} more</span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
        
        {platformStats.length === 0 && (
          <div className="text-center py-8">
            <div className="text-4xl mb-2">📊</div>
            <p className="text-gray-400">Platform statistics will appear here after templates are imported</p>
          </div>
        )}
      </div>

      {/* Template Sources Analytics */}
      <div className="bg-gradient-to-br from-purple-900/30 to-blue-900/30 backdrop-blur-sm border border-purple-500/20 rounded-2xl p-6">
        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          🌐 Template Sources Analytics
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templateSources.map((source, index) => (
            <div key={index} className="bg-black/30 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-white">{source.sourceName}</h4>
                <span className={`px-2 py-1 rounded-full text-xs ${
                  source.status === 'active' ? 'bg-green-600 text-white' :
                  source.status === 'error' ? 'bg-red-600 text-white' :
                  'bg-gray-600 text-white'
                }`}>
                  {source.status}
                </span>
              </div>
              <p className="text-sm text-gray-400 mb-2">{source.sourceUrl}</p>
              <div className="flex justify-between text-sm">
                <span className="text-purple-300">Templates: {source.templateCount}</span>
                <span className="text-blue-300">Imports: {source.totalImports}</span>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Last: {source.lastImported?.toDate?.()?.toLocaleDateString() || 'Never'}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Category Distribution Chart */}
      <div className="bg-gradient-to-br from-green-900/30 to-emerald-900/30 backdrop-blur-sm border border-green-500/20 rounded-2xl p-6">
        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          📊 Category Distribution
        </h3>
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {categoryDistribution.map((cat, index) => (
            <div key={index} className="flex items-center justify-between bg-black/30 rounded-lg p-3">
              <span className="text-white font-medium">{cat.category}</span>
              <div className="flex items-center gap-2">
                <div className="w-24 bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-green-400 to-emerald-500 h-2 rounded-full"
                    style={{ 
                      width: `${Math.min((cat.count / Math.max(...categoryDistribution.map(c => c.count))) * 100, 100)}%` 
                    }}
                  />
                </div>
                <span className="text-green-300 font-semibold">{cat.count}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* User Engagement Metrics */}
      <div className="bg-gradient-to-br from-orange-900/30 to-red-900/30 backdrop-blur-sm border border-orange-500/20 rounded-2xl p-6">
        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          🎯 Top Engaged Users
        </h3>
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {engagementMetrics.map((user, index) => (
            <div key={index} className="bg-black/30 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white font-medium">{user.userEmail || user.userId}</span>
                <span className="text-orange-300 font-bold">{user.engagementScore} pts</span>
              </div>
              <div className="grid grid-cols-4 gap-2 text-xs text-gray-400">
                <span>Views: {user.totalViews || 0}</span>
                <span>Uploads: {user.totalUploads || 0}</span>
                <span>Shares: {user.totalShares || 0}</span>
                <span>Downloads: {user.totalDownloads || 0}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderTemplatesTab = () => (
    <div className="space-y-6">
      {/* Search and Filter Controls */}
      <div className="bg-gradient-to-br from-gray-900/30 to-gray-800/30 backdrop-blur-sm border border-gray-700/20 rounded-2xl p-6">
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div className="flex gap-4 items-center">
            <input
              type="text"
              placeholder="Search templates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-4 py-2 bg-black/30 text-white rounded-lg border border-gray-600 focus:border-purple-500 focus:outline-none"
            />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="px-4 py-2 bg-black/30 text-white rounded-lg border border-gray-600 focus:border-purple-500 focus:outline-none"
            >
              <option value="all">All Items</option>
              <option value="templates">Templates Only</option>
              <option value="users">Users Only</option>
              <option value="creators">Creators Only</option>
            </select>
          </div>
          
          {/* Bulk Actions */}
          {bulkSelectedTemplates.size > 0 && (
            <div className="flex gap-2">
              <button
                onClick={handleBulkApprove}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium"
              >
                ✓ Approve ({bulkSelectedTemplates.size})
              </button>
              <button
                onClick={handleBulkDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium"
              >
                🗑️ Delete ({bulkSelectedTemplates.size})
              </button>
                         </div>
           )}

           {/* Analysis Message Display */}
           {message && (
             <div className="mt-6 max-w-4xl mx-auto">
               <div className="bg-black/30 backdrop-blur-sm rounded-2xl p-4 border border-cyan-500/20">
                 <p className="text-cyan-300 text-center">{message}</p>
               </div>
             </div>
           )}
         </div>
       </div>

      {/* External API Integration Section */}
      <div className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 backdrop-blur-sm border border-purple-500/20 rounded-2xl p-6">
        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          🔍 Multi-Platform Template Discovery
          <span className="text-xs bg-purple-600 px-2 py-1 rounded-full">NEW</span>
        </h3>
        
        <div className="space-y-4">
          {/* Platform Selection */}
          <div className="bg-black/30 rounded-lg p-4">
            <h4 className="text-sm font-medium text-purple-300 mb-3 flex items-center gap-2">
              🎯 Select Platforms to Search
              <span className="text-xs bg-purple-600/30 px-2 py-1 rounded-full">
                {selectedPlatforms.size} selected
              </span>
            </h4>
            <div className="flex gap-4 flex-wrap">
              {['Pexels', 'Pixabay', 'Unsplash'].map(platform => (
                <label key={platform} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedPlatforms.has(platform)}
                    onChange={(e) => {
                      const newSelected = new Set(selectedPlatforms);
                      if (e.target.checked) {
                        newSelected.add(platform);
                      } else {
                        newSelected.delete(platform);
                      }
                      setSelectedPlatforms(newSelected);
                    }}
                    className="rounded border-gray-600 bg-black/30 text-purple-600 focus:ring-purple-500"
                  />
                  <span className={`text-sm flex items-center gap-1 ${
                    selectedPlatforms.has(platform) ? 'text-white' : 'text-gray-400'
                  }`}>
                    <span className={`w-2 h-2 rounded-full ${
                      platform === 'Pexels' ? 'bg-green-500' :
                      platform === 'Pixabay' ? 'bg-blue-500' :
                      platform === 'Unsplash' ? 'bg-orange-500' :
                      'bg-gray-500'
                    }`} />
                    {platform}
                  </span>
                </label>
              ))}
            </div>
            <div className="mt-2 flex gap-2">
              <button
                onClick={() => setSelectedPlatforms(new Set(['Pexels', 'Pixabay', 'Unsplash']))}
                className="text-xs px-3 py-1 bg-purple-600/30 hover:bg-purple-600/50 text-purple-300 rounded transition-colors"
              >
                Select All
              </button>
              <button
                onClick={() => setSelectedPlatforms(new Set())}
                className="text-xs px-3 py-1 bg-gray-600/30 hover:bg-gray-600/50 text-gray-300 rounded transition-colors"
              >
                Clear All
              </button>
            </div>
          </div>

          {/* Search Input and Controls */}
          <div className="flex gap-4 items-center">
            <input
              type="text"
              placeholder={`Search ${Array.from(selectedPlatforms).join(', ') || 'external APIs'}...`}
              value={externalSearchTerm}
              onChange={(e) => setExternalSearchTerm(e.target.value)}
              className="flex-1 px-4 py-2 bg-black/30 text-white rounded-lg border border-purple-600 focus:border-purple-400 focus:outline-none"
            />
            <button
              onClick={handleExternalApiSearch}
              disabled={!externalSearchTerm.trim() || selectedPlatforms.size === 0}
              className="px-6 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
            >
              🔍 Search Selected
            </button>
          </div>

          {/* External Search Results */}
          {externalSearchResults.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-purple-300">
                  Found {externalSearchResults.length} results across platforms
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleImportFromExternalApis(10)}
                    className="px-4 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm font-medium"
                  >
                    📥 Import 10
                  </button>
                  <button
                    onClick={() => handleImportFromExternalApis(20)}
                    className="px-4 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium"
                  >
                    📥 Import 20
                  </button>
                  <button
                    onClick={() => setExternalSearchResults([])}
                    className="px-4 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded text-sm font-medium"
                  >
                    ✕ Clear
                  </button>
                </div>
              </div>

              {/* Results Preview Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 max-h-80 overflow-y-auto">
                {externalSearchResults.slice(0, 12).map((result, index) => (
                  <div key={index} className="bg-black/30 rounded-lg overflow-hidden">
                    <img
                      src={result.preview}
                      alt={result.title}
                      className="w-full h-20 object-cover"
                    />
                    <div className="p-2">
                      <div className="flex items-center gap-1 mb-1">
                        <span className={`w-2 h-2 rounded-full ${
                          result.platform === 'Pexels' ? 'bg-green-500' :
                          result.platform === 'Pixabay' ? 'bg-blue-500' :
                          result.platform === 'Unsplash' ? 'bg-orange-500' :
                          'bg-gray-500'
                        }`} />
                        <span className="text-xs text-gray-400">{result.platform}</span>
                      </div>
                      <p className="text-xs text-white line-clamp-2">{result.title}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Platform Distribution Chart */}
          {externalSearchResults.length > 0 && (
            <div className="bg-black/30 rounded-lg p-4">
              <h4 className="text-sm font-medium text-purple-300 mb-2">Platform Distribution</h4>
              <div className="space-y-2">
                {Object.entries(
                  externalSearchResults.reduce((acc, result) => {
                    acc[result.platform] = (acc[result.platform] || 0) + 1;
                    return acc;
                  }, {} as Record<string, number>)
                ).map(([platform, count]) => {
                  const percentage = (count / externalSearchResults.length) * 100;
                  return (
                    <div key={platform} className="flex items-center gap-3">
                      <span className="text-xs text-gray-400 w-16">{platform}</span>
                      <div className="flex-1 bg-gray-700 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            platform === 'Pexels' ? 'bg-green-500' :
                            platform === 'Pixabay' ? 'bg-blue-500' :
                            platform === 'Unsplash' ? 'bg-orange-500' :
                            'bg-gray-500'
                          }`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-400 w-12">{count} ({percentage.toFixed(0)}%)</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {templates
          .filter(tpl => 
            filterType !== 'templates' || 
            tpl.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            tpl.category?.toLowerCase().includes(searchTerm.toLowerCase())
          )
          .map((tpl) => (
            <div
              key={tpl.id}
              className="group bg-gradient-to-br from-gray-900/50 to-gray-800/50 backdrop-blur-sm border border-gray-700/50 hover:border-yellow-400/50 rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-yellow-400/10"
            >
              <div className="relative">
                <input
                  type="checkbox"
                  checked={bulkSelectedTemplates.has(tpl.id)}
                  onChange={(e) => {
                    const newSelected = new Set(bulkSelectedTemplates);
                    if (e.target.checked) {
                      newSelected.add(tpl.id);
                    } else {
                      newSelected.delete(tpl.id);
                    }
                    setBulkSelectedTemplates(newSelected);
                  }}
                  className="absolute top-2 left-2 z-10"
                />
                <img
                  src={tpl.preview}
                  alt={tpl.title}
                  className="w-full h-40 object-cover group-hover:scale-110 transition-transform duration-300"
                  onClick={() => setPreviewTemplate(tpl)}
                />
              </div>
              <div className="p-4" onClick={() => setPreviewTemplate(tpl)}>
                <div className="flex items-start gap-2 mb-2">
                  <span className="text-2xl flex-shrink-0">{tpl.icon}</span>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-bold text-white text-sm line-clamp-1 group-hover:text-yellow-400 transition-colors">
                      {tpl.title}
                    </h4>
                    <p className="text-xs text-purple-300/80 mb-1">{tpl.category}</p>
                    <p className="text-xs text-gray-400 line-clamp-2">{tpl.desc}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
      </div>
    </div>
  );

  const renderActivityTab = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-blue-900/30 to-cyan-900/30 backdrop-blur-sm border border-blue-500/20 rounded-2xl p-6">
        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          📊 Recent User Activities
        </h3>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {recentActivities.map((activity, index) => (
            <div key={index} className="bg-black/30 rounded-lg p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${
                  activity.action === 'upload' ? 'bg-green-500' :
                  activity.action === 'view' ? 'bg-blue-500' :
                  activity.action === 'share' ? 'bg-purple-500' :
                  activity.action === 'download' ? 'bg-yellow-500' :
                  'bg-gray-500'
                }`} />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-white font-medium">{activity.userEmail}</span>
                    <span className="text-gray-400">•</span>
                    <span className="text-cyan-300">{activity.action}</span>
                  </div>
                  <p className="text-sm text-gray-400">{activity.details}</p>
                </div>
              </div>
              <div className="text-right text-xs text-gray-500">
                <div>{activity.platform}</div>
                <div>{activity.timestamp?.toDate?.()?.toLocaleString() || 'Unknown'}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderErrorsTab = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-red-900/30 to-pink-900/30 backdrop-blur-sm border border-red-500/20 rounded-2xl p-6">
        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          🚨 System Errors & Monitoring
        </h3>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {systemErrors.map((error, index) => (
            <div key={index} className={`rounded-lg p-4 border-l-4 ${
              error.severity === 'critical' ? 'bg-red-900/30 border-red-500' :
              error.severity === 'high' ? 'bg-orange-900/30 border-orange-500' :
              error.severity === 'medium' ? 'bg-yellow-900/30 border-yellow-500' :
              'bg-gray-900/30 border-gray-500'
            }`}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      error.severity === 'critical' ? 'bg-red-600 text-white' :
                      error.severity === 'high' ? 'bg-orange-600 text-white' :
                      error.severity === 'medium' ? 'bg-yellow-600 text-black' :
                      'bg-gray-600 text-white'
                    }`}>
                      {error.severity.toUpperCase()}
                    </span>
                    <span className="text-gray-400 text-xs">{error.errorType}</span>
                    <span className="text-gray-500 text-xs">•</span>
                    <span className="text-gray-500 text-xs">{error.source}</span>
                  </div>
                  <h4 className="text-white font-medium mb-1">{error.errorMessage}</h4>
                  <p className="text-gray-400 text-sm">
                    {error.timestamp?.toDate?.()?.toLocaleString() || 'Unknown time'}
                  </p>
                </div>
                <button
                  onClick={async () => {
                    await updateDoc(doc(db, 'systemErrors', error.errorId), { resolved: true });
                    fetchAnalyticsData();
                  }}
                  className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm"
                >
                  Resolve
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* API Quota Visualization */}
      <div className="bg-gradient-to-br from-indigo-900/30 to-purple-900/30 backdrop-blur-sm border border-indigo-500/20 rounded-2xl p-6">
        <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
          🔑 API Key Quota Usage
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {getApiKeyList().map((k: string, i: number) => (
            <div key={k} className="bg-black/30 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <span className="text-indigo-300 text-sm font-semibold">Key #{i + 1}</span>
                <span className="text-2xl">🔐</span>
              </div>
              <div className="text-xs text-gray-400 break-all mb-4 font-mono bg-black/40 p-2 rounded">
                {k.substring(0, 20)}...
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-sm">Used:</span>
                  <span className="text-white font-semibold">{quota[k]?.used ?? 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-sm">Errors:</span>
                  <span className="text-red-400 font-semibold">{quota[k]?.errors ?? 0}</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all ${
                      (quota[k]?.used ?? 0) > 8000 ? 'bg-red-500' :
                      (quota[k]?.used ?? 0) > 6000 ? 'bg-yellow-500' :
                      'bg-green-500'
                    }`}
                    style={{ width: `${Math.min(((quota[k]?.used ?? 0) / 10000) * 100, 100)}%` }}
                  />
                </div>
                <div className="text-xs text-gray-500 text-center">
                  {Math.round(((quota[k]?.used ?? 0) / 10000) * 100)}% of daily limit
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-purple-900/20 via-blue-900/20 to-purple-900/20 border-b border-purple-500/20">
        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Title and Logout */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 bg-clip-text text-transparent">
                Enhanced Admin Dashboard
              </h1>
              <p className="text-gray-400 mt-2">Advanced analytics and monitoring for ViewsBoost</p>
            </div>
            <button
              onClick={handleLogout}
              className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold py-3 px-6 rounded-xl shadow-lg hover:shadow-red-500/20 transition-all duration-300 transform hover:scale-105"
            >
              🚪 Logout
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex flex-wrap gap-2 mb-6">
            {[
              { key: 'overview', label: 'Overview', icon: '📊' },
              { key: 'analytics', label: 'Analytics', icon: '📈' },
              { key: 'templates', label: 'Templates', icon: '🎨' },
              { key: 'activity', label: 'Activity', icon: '🔄' },
              { key: 'errors', label: 'Errors', icon: '🚨' }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                  activeTab === tab.key
                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg'
                    : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50'
                }`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>

          {/* Action Buttons Row - Preserved from original */}
          <div className="flex flex-wrap gap-4 justify-center items-center">
            <button
              onClick={handleIngest}
              disabled={ingesting}
              className="bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 hover:from-orange-600 hover:via-red-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 px-8 rounded-xl shadow-lg hover:shadow-orange-500/20 transition-all duration-300 transform hover:scale-105 flex items-center gap-2"
            >
              {ingesting ? (
                <>🚀 Ingesting Videos...</>
              ) : (
                <>📥 Ingest All Creator Videos</>
              )}
            </button>
            
            <button
              onClick={handleRefreshAll}
              className="bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-black font-bold py-4 px-8 rounded-xl shadow-lg hover:shadow-yellow-500/20 transition-all duration-300 transform hover:scale-105 flex items-center gap-2"
            >
              🔄 Refresh All Data
            </button>

            <button
              onClick={() => setShowImporterModal(true)}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold py-4 px-8 rounded-xl shadow-lg hover:shadow-blue-500/20 transition-all duration-300 transform hover:scale-105 flex items-center gap-2"
            >
              📋 Template Importer
            </button>

                         <a
               href="/template-importer"
               target="_blank"
               rel="noopener noreferrer"
               className="bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white font-bold py-4 px-8 rounded-xl shadow-lg hover:shadow-indigo-500/20 transition-all duration-300 transform hover:scale-105 flex items-center gap-2 no-underline"
             >
               🔗 Open Importer (New Tab)
             </a>

             <button
               onClick={handleAnalyzeExistingTemplates}
               className="bg-gradient-to-r from-cyan-500 to-teal-600 hover:from-cyan-600 hover:to-teal-700 text-white font-bold py-4 px-8 rounded-xl shadow-lg hover:shadow-cyan-500/20 transition-all duration-300 transform hover:scale-105 flex items-center gap-2"
             >
               🔍 Analyze Platforms
             </button>
          </div>

          {/* Progress Section - Preserved from original */}
          {(ingesting || progress === 100) && (
            <div className="mt-8 max-w-2xl mx-auto">
              <div className="bg-black/30 backdrop-blur-sm rounded-2xl p-6 border border-purple-500/20">
                <div className="relative h-4 bg-gray-800 rounded-full overflow-hidden mb-4">
                  <div
                    className="h-full bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 transition-all duration-500 ease-out rounded-full"
                    style={{ width: `${progress}%` }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-pulse" />
                </div>
                {ingestMsg && (
                  <div className="text-center">
                    {progress === 100 ? (
                      <span className="text-green-400 font-semibold text-lg">
                        🎉 {ingestMsg} 🎉
                      </span>
                    ) : (
                      <span className="text-gray-300">{ingestMsg}</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {renderTabContent()}
      </div>

      {/* Template Preview Modal - Preserved from original */}
      {previewTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="bg-gradient-to-br from-gray-900 to-black border border-purple-500/30 rounded-3xl shadow-2xl max-w-lg w-full relative overflow-hidden">
            <button
              className="absolute top-4 right-4 z-10 bg-black/50 hover:bg-red-500/80 text-white rounded-full w-10 h-10 flex items-center justify-center text-xl font-bold transition-all duration-200"
              onClick={() => setPreviewTemplate(null)}
            >
              ×
            </button>
            <img
              src={previewTemplate.preview}
              alt={previewTemplate.title}
              className="w-full h-64 object-cover"
            />
            <div className="p-6">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-3xl">{previewTemplate.icon}</span>
                <h3 className="font-bold text-white text-xl">{previewTemplate.title}</h3>
              </div>
              <div className="inline-block bg-purple-500/20 text-purple-300 text-sm px-3 py-1 rounded-full mb-3">
                {previewTemplate.category}
              </div>
              <p className="text-gray-300 leading-relaxed">{previewTemplate.desc}</p>
            </div>
          </div>
        </div>
      )}

      {/* Template Importer Modal - Preserved from original */}
      {showImporterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
          <div className="bg-gradient-to-br from-gray-900 to-black border border-purple-500/30 rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto relative">
            <button
              className="absolute top-4 right-4 z-10 bg-black/50 hover:bg-red-500/80 text-white rounded-full w-10 h-10 flex items-center justify-center text-xl font-bold transition-all duration-200"
              onClick={() => setShowImporterModal(false)}
            >
              ×
            </button>
            <div className="p-8">
              <h2 className="text-3xl font-bold text-white mb-6 text-center">Template Importer</h2>
              <TemplateImporter onImport={handleImportResult} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
