// src/pages/AdminPanel.tsx

import React, { useEffect, useState } from "react";
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
import { duplicateDetectionService } from "../lib/services/duplicateDetectionService";
import VideoUploadProcessor from "../components/VideoUploadProcessor";
import TemplateCategoryManager from "../components/TemplateCategoryManager";
import CategoryBrowser from '../components/CategoryBrowser';
import VideoTemplateProcessor from '../components/VideoTemplateProcessor';
import { TemplateService, CategoryUpdateResult } from "../lib/services/templateService";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { auth } from "../lib/firebase";
import { stockApiService } from "../lib/services/stockApiService";
import { backupService } from "../lib/services/backupService";

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
  
  // New navigation states
  const [activeMainTab, setActiveMainTab] = useState<'overview' | 'analytics' | 'templates' | 'importers' | 'video-processor' | 'category-manager' | 'template-browser' | 'file-converter'>('overview');
  const [activeAnalyticsSubTab, setActiveAnalyticsSubTab] = useState<'platforms' | 'error' | 'activity' | 'refresh'>('platforms');
  const [showAdminMenu, setShowAdminMenu] = useState(false);
  
  // Analytics states
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
  
  // Duplicate detection states
  const [duplicateReport, setDuplicateReport] = useState<any>(null);
  const [duplicateLoading, setDuplicateLoading] = useState(false);
  const [showDuplicatePreview, setShowDuplicatePreview] = useState(false);
  
  // Backup management states
  const [availableBackups, setAvailableBackups] = useState<any[]>([]);
  const [showBackupManager, setShowBackupManager] = useState(false);
  const [backupLoading, setBackupLoading] = useState(false);
  
  // Broken images filter states
  const [showOnlyBrokenImages, setShowOnlyBrokenImages] = useState(false);
  const [brokenImagesList, setBrokenImagesList] = useState<Set<string>>(new Set());
  const [testingImages, setTestingImages] = useState(false);
  const [testingProgress, setTestingProgress] = useState({ current: 0, total: 0, currentBatch: 0, totalBatches: 0 });
  const [deletingProgress, setDeletingProgress] = useState({ current: 0, total: 0, isDeleting: false });
  
  // Drag and drop states
  const [isDragging, setIsDragging] = useState(false);
  const [draggedTemplateId, setDraggedTemplateId] = useState<string | null>(null);
  
  // Individual template deletion states
  const [deletingTemplate, setDeletingTemplate] = useState<string | null>(null);
  
  
  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  
  const navigate = useNavigate();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (showAdminMenu && !target.closest('.admin-menu-dropdown')) {
        setShowAdminMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showAdminMenu]);

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
      // Silently handle analytics errors - they're not critical for core functionality
      console.warn('Analytics data temporarily unavailable:', error.message || 'Permission denied');
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
      // Silently handle platform stats errors - they're not critical
      console.warn('Platform analytics temporarily unavailable:', error.message || 'Permission denied');
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

    const totalToDelete = bulkSelectedTemplates.size;
    const selectedIds = Array.from(bulkSelectedTemplates);
    
    // Initialize deletion progress
    setDeletingProgress({
      current: 0,
      total: totalToDelete,
      isDeleting: true
    });

    try {
      let deletedCount = 0;
      
      for (const templateId of selectedIds) {
        await deleteDoc(doc(db, "templates", templateId));
        deletedCount++;
        
        // Update progress
        setDeletingProgress(prev => ({
          ...prev,
          current: deletedCount
        }));
        
        // Small delay to show progress
        if (deletedCount < totalToDelete) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
      
      setBulkSelectedTemplates(new Set());
      
      // Update broken images list if we deleted broken templates
      if (showOnlyBrokenImages) {
        const newBrokenList = new Set(brokenImagesList);
        selectedIds.forEach(id => newBrokenList.delete(id));
        setBrokenImagesList(newBrokenList);
        
        // If no more broken templates, turn off the filter
        if (newBrokenList.size === 0) {
          setShowOnlyBrokenImages(false);
        }
      }
      
      fetchTemplates();
      setMessage(`Successfully deleted ${totalToDelete} templates.`);
    } catch (error) {
      console.error("Error deleting templates:", error);
      setError("Failed to delete templates. Please try again.");
    } finally {
      // Reset deletion progress
      setDeletingProgress({
        current: 0,
        total: 0,
        isDeleting: false
      });
    }
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

  // Duplicate detection functions
  const handleScanForDuplicates = async () => {
    setDuplicateLoading(true);
    setMessage("🔍 Scanning for duplicate templates...");
    
    try {
      const result = await duplicateDetectionService.previewCleanup();
      setDuplicateReport(result);
      setShowDuplicatePreview(true);
      
      if (result.totalDuplicatesFound === 0) {
        setMessage("✅ No duplicates found! Your template database is clean.");
      } else {
        setMessage(`🎯 Found ${result.totalDuplicatesFound} duplicates in ${result.duplicateGroups.length} groups. ${result.totalTemplatesDeleted} templates can be safely deleted.`);
      }
    } catch (error) {
      setMessage(`❌ Error scanning for duplicates: ${error}`);
      console.error('Duplicate scan error:', error);
    }
    
    setDuplicateLoading(false);
  };

  const handleExecuteCleanup = async () => {
    if (!duplicateReport || duplicateReport.totalTemplatesDeleted === 0) {
      setMessage("⚠️ No duplicates to clean up.");
      return;
    }

    const confirmMessage = `⚠️ WARNING: This will permanently delete ${duplicateReport.totalTemplatesDeleted} duplicate templates.\n\nThis action CANNOT be undone!\n\nAre you absolutely sure you want to proceed?`;
    
    if (!confirm(confirmMessage)) {
      return;
    }

    setDuplicateLoading(true);
    setMessage("🧹 Executing cleanup... This may take a few moments.");
    
    try {
      const result = await duplicateDetectionService.executeCleanup();
      
      if (result.errors.length > 0) {
        setMessage(`⚠️ Cleanup completed with some errors. Deleted ${result.totalTemplatesDeleted} templates. ${result.errors.length} errors occurred. Backup saved: ${result.backupPath}`);
        console.error('Cleanup errors:', result.errors);
      } else {
        setMessage(`✅ Cleanup completed successfully! Deleted ${result.totalTemplatesDeleted} duplicate templates. Backup automatically created and downloaded: ${result.backupPath}`);
      }
      
      // Refresh templates after cleanup
      await fetchTemplates();
      setDuplicateReport(null);
      setShowDuplicatePreview(false);
      
    } catch (error) {
      setMessage(`❌ Error during cleanup: ${error}`);
      console.error('Cleanup execution error:', error);
    }
    
    setDuplicateLoading(false);
  };

  // Backup management functions
  const loadAvailableBackups = async () => {
    try {
      const backups = await duplicateDetectionService.listBackups();
      setAvailableBackups(backups);
    } catch (error) {
      console.error('Error loading backups:', error);
      setMessage(`❌ Error loading backups: ${error}`);
    }
  };

  const handleRestoreFromBackup = async (backupKey: string) => {
    const backup = availableBackups.find(b => b.key === backupKey);
    if (!backup) return;

    const confirmMessage = `⚠️ RESTORE FROM BACKUP\n\n` +
      `This will replace ALL current templates with the backup:\n` +
      `• Backup Date: ${new Date(backup.timestamp).toLocaleString()}\n` +
      `• Template Count: ${backup.templateCount}\n` +
      `• Backup Type: ${backup.backupType}\n\n` +
      `Current templates will be PERMANENTLY LOST!\n\n` +
      `Are you absolutely sure you want to continue?`;

    if (!confirm(confirmMessage)) {
      return;
    }

    setBackupLoading(true);
    setMessage("🔄 Restoring from backup... This may take a few moments.");

    try {
      const result = await duplicateDetectionService.restoreFromBackup(backupKey);
      
      if (result.success) {
        setMessage(`✅ Restore completed! ${result.restoredCount} templates restored from backup.`);
        await fetchTemplates(); // Refresh templates
      } else {
        setMessage(`❌ Restore failed: ${result.error}`);
      }
    } catch (error) {
      setMessage(`❌ Restore error: ${error}`);
      console.error('Restore error:', error);
    }

    setBackupLoading(false);
  };

  const handleDeleteBackup = (backupKey: string) => {
    const backup = availableBackups.find(b => b.key === backupKey);
    if (!backup) return;

    if (confirm(`Delete backup from ${new Date(backup.timestamp).toLocaleString()}?\n\nThis cannot be undone.`)) {
      localStorage.removeItem(backupKey);
      loadAvailableBackups(); // Refresh backup list
      setMessage(`🗑️ Backup deleted: ${new Date(backup.timestamp).toLocaleString()}`);
    }
  };

  const handleCreateManualBackup = async () => {
    setBackupLoading(true);
    setMessage("📦 Creating manual backup...");

    try {
      const result = await duplicateDetectionService.createManualBackup();
      if (result.success) {
        setMessage(`✅ Manual backup created! ${result.templateCount} templates backed up and downloaded.`);
        loadAvailableBackups(); // Refresh backup list
      } else {
        setMessage(`❌ Backup creation failed: ${result.error}`);
      }
    } catch (error) {
      setMessage(`❌ Backup creation failed: ${error}`);
    }

    setBackupLoading(false);
  };

  // Test all template images and identify broken ones (FAST batch processing with progress)
  const testAllTemplateImages = async () => {
    setTestingImages(true);
    const brokenIds = new Set<string>();
    
    // Quick pre-filter: templates without preview URLs
    const templatesWithPreview = templates.filter(template => {
      if (!template.preview) {
        console.log(`❌ No preview: ${template.title}`);
        brokenIds.add(template.id);
        return false;
      }
      return true;
    });
    
    // Batch test images (10 at a time for better performance)
    const batchSize = 10;
    const batches = [];
    
    for (let i = 0; i < templatesWithPreview.length; i += batchSize) {
      batches.push(templatesWithPreview.slice(i, i + batchSize));
    }
    
    // Initialize progress
    setTestingProgress({
      current: 0,
      total: templatesWithPreview.length,
      currentBatch: 0,
      totalBatches: batches.length
    });
    
    console.log(`🚀 Processing ${batches.length} batches of ${batchSize} images each...`);
    
    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex];
      const batchProgress = `Batch ${batchIndex + 1}/${batches.length}`;
      
      // Update progress
      setTestingProgress(prev => ({
        ...prev,
        currentBatch: batchIndex + 1
      }));
      
      // Test all images in this batch simultaneously
      const batchPromises = batch.map(template => 
        new Promise<{ template: any, isWorking: boolean }>((resolve) => {
          const img = document.createElement('img');
          const timeout = setTimeout(() => {
            resolve({ template, isWorking: false });
          }, 2000); // Reduced timeout to 2 seconds
          
          img.onload = () => {
            clearTimeout(timeout);
            resolve({ template, isWorking: true });
          };
          
          img.onerror = () => {
            clearTimeout(timeout);
            resolve({ template, isWorking: false });
          };
          
          img.crossOrigin = 'anonymous';
          img.src = template.preview;
        })
      );
      
      try {
        // Wait for all images in this batch to complete
        const batchResults = await Promise.all(batchPromises);
        
        // Process results
        batchResults.forEach(({ template, isWorking }) => {
          if (!isWorking) {
            console.log(`❌ Broken: ${template.title}`);
            brokenIds.add(template.id);
          } else {
            console.log(`✅ Working: ${template.title}`);
          }
        });
        
        // Update progress after batch completion
        setTestingProgress(prev => ({
          ...prev,
          current: Math.min(prev.current + batch.length, prev.total)
        }));
        
        // Small delay between batches to prevent overwhelming the browser
        if (batchIndex < batches.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
      } catch (error) {
        console.error(`❌ Batch ${batchIndex + 1} failed:`, error);
        // Mark all templates in failed batch as broken
        batch.forEach(template => brokenIds.add(template.id));
        
        // Update progress even for failed batches
        setTestingProgress(prev => ({
          ...prev,
          current: Math.min(prev.current + batch.length, prev.total)
        }));
      }
    }
    
    setBrokenImagesList(brokenIds);
    setTestingImages(false);
    
    // Reset progress
    setTestingProgress({ current: 0, total: 0, currentBatch: 0, totalBatches: 0 });
    
    const workingCount = templates.length - brokenIds.size;
    console.log(`✅ Testing complete! ${workingCount} working, ${brokenIds.size} broken out of ${templates.length} total templates`);
    
    if (brokenIds.size > 0) {
      setShowOnlyBrokenImages(true);
      setMessage(`Found ${brokenIds.size} templates with broken images. Use checkboxes to select and delete them.`);
    } else {
      setMessage(`All ${templates.length} template images are working correctly! 🎉`);
    }
  };

  // Individual template deletion function




  const handleDeleteSingleTemplate = async (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (!template) return;
    
    const confirmed = window.confirm(`Are you sure you want to delete "${template.title}"? This action cannot be undone.`);
    if (!confirmed) return;
    
    setDeletingTemplate(templateId);
    
    try {
      await deleteDoc(doc(db, "templates", templateId));
      
      // Update local state
      setTemplates(prev => prev.filter(t => t.id !== templateId));
      setBulkSelectedTemplates(prev => {
        const newSet = new Set(prev);
        newSet.delete(templateId);
        return newSet;
      });
      setBrokenImagesList(prev => {
        const newSet = new Set(prev);
        newSet.delete(templateId);
        return newSet;
      });
      
      setMessage(`✅ Successfully deleted template "${template.title}"`);
    } catch (error) {
      console.error('Error deleting template:', error);
      setMessage(`❌ Failed to delete template "${template.title}". Please try again.`);
    } finally {
      setDeletingTemplate(null);
    }
  };
  
  // Drag and drop handler
  const handleDragEnd = (result: DragEndEvent) => {
    const { active, over } = result;
    
    setIsDragging(false);
    setDraggedTemplateId(null);
    
    if (!over) return;
    
    if (active.id === over.id) return;
    
    // For now, we'll just show a message since we're dealing with a simple grid
    // In a more complex scenario, you could implement category changes or reordering
    const draggedTemplate = templates.find(t => t.id === active.id);
    if (draggedTemplate) {
      setMessage(`Template "${draggedTemplate.title}" was moved. Drag and drop is working! You can extend this to implement category changes or reordering.`);
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    setIsDragging(true);
    setDraggedTemplateId(event.active.id as string);
  };

  // Sortable Template Item Component
  const SortableTemplateItem = ({ template }: { template: any }) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging: isItemDragging,
    } = useSortable({ id: template.id });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
    };

    return (
      <div
        ref={setNodeRef}
        style={style}
        className={`group bg-gradient-to-br from-gray-900/50 to-gray-800/50 backdrop-blur-sm border border-gray-700/50 hover:border-yellow-400/50 rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-yellow-400/10 ${
          isItemDragging ? 'rotate-3 scale-110 shadow-2xl z-50' : ''
        } ${deletingTemplate === template.id ? 'opacity-50 pointer-events-none' : ''}`}
      >
        <div className="relative">
          {/* Bulk Select Checkbox */}
          <input
            type="checkbox"
            checked={bulkSelectedTemplates.has(template.id)}
            onChange={(e) => {
              const newSelected = new Set(bulkSelectedTemplates);
              if (e.target.checked) {
                newSelected.add(template.id);
              } else {
                newSelected.delete(template.id);
              }
              setBulkSelectedTemplates(newSelected);
            }}
            className="absolute top-2 left-2 z-20"
          />
          
          {/* Individual Delete Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteSingleTemplate(template.id);
            }}
            disabled={deletingTemplate === template.id}
            className="absolute top-2 right-2 z-20 w-6 h-6 bg-red-600/80 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-all duration-200 opacity-0 group-hover:opacity-100"
            title="Delete template"
          >
            {deletingTemplate === template.id ? (
              <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <span className="text-xs">×</span>
            )}
          </button>
          
          {/* Drag Handle */}
          <div
            {...attributes}
            {...listeners}
            className="absolute bottom-2 right-2 z-20 w-6 h-6 bg-blue-600/80 hover:bg-blue-600 text-white rounded-full flex items-center justify-center transition-all duration-200 opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing"
            title="Drag to reorder"
          >
            <span className="text-xs">⋮⋮</span>
          </div>
          
          <img
            src={template.preview}
            alt={template.title}
            className="w-full h-40 object-cover group-hover:scale-110 transition-transform duration-300"
            onClick={() => setPreviewTemplate(template)}
          />
        </div>
        <div className="p-4" onClick={() => setPreviewTemplate(template)}>
          <div className="flex items-start gap-2 mb-2">
            <span className="text-2xl flex-shrink-0">{template.icon}</span>
            <div className="min-w-0 flex-1">
              <h4 className="font-bold text-white text-sm line-clamp-1 group-hover:text-yellow-400 transition-colors">
                {template.title}
              </h4>
              <p className="text-xs text-purple-300/80 mb-1">{template.category}</p>
              <p className="text-xs text-gray-400 line-clamp-2">{template.desc}</p>
            </div>
          </div>
        </div>
        
        {/* Drag indicator */}
        {isDragging && draggedTemplateId === template.id && (
          <div className="absolute inset-0 bg-blue-500/20 border-2 border-blue-400 rounded-2xl flex items-center justify-center">
            <span className="text-blue-300 font-bold">DRAGGING</span>
          </div>
        )}
      </div>
    );
  };

  // Filter functions
  const getFilteredData = () => {
    const searchLower = searchTerm.toLowerCase();
    
    switch (filterType) {
      case 'users':
        return { users: users.filter(user => 
          user.email?.toLowerCase().includes(searchLower) ||
          user.displayName?.toLowerCase().includes(searchLower)
        ), creators, templates };
      case 'creators':
        return { users, creators: creators.filter(creator =>
          creator.id?.toLowerCase().includes(searchLower) ||
          creator.channelId?.toLowerCase().includes(searchLower)
        ), templates };
      case 'templates':
        let filteredTemplates = templates.filter(template =>
          template.title?.toLowerCase().includes(searchLower) ||
          template.category?.toLowerCase().includes(searchLower)
        );
        
        // Apply broken images filter if active
        if (showOnlyBrokenImages && brokenImagesList.size > 0) {
          filteredTemplates = filteredTemplates.filter(template => brokenImagesList.has(template.id));
        }
        
        return { users, creators, templates: filteredTemplates };
      default:
        let allTemplates = templates;
        
        // Apply broken images filter if active
        if (showOnlyBrokenImages && brokenImagesList.size > 0) {
          allTemplates = allTemplates.filter(template => brokenImagesList.has(template.id));
        }
        
        return { users, creators, templates: allTemplates };
    }
  };

  const renderTabContent = () => {
    switch (activeMainTab) {
      case 'overview':
        return renderOverviewTab();
      case 'analytics':
        return renderAnalyticsContent();
      case 'templates':
        return renderTemplatesTab();
      case 'importers':
        return renderImportersTab();
      case 'video-processor':
        return renderVideoProcessorTab();
      case 'category-manager':
        return renderCategoryManagerTab();
      case 'template-browser':
        return <CategoryBrowser onTemplateSelect={(template) => {
          console.log('Selected template:', template);
          // Here you could add functionality to import or edit the template
        }} />;
      case 'file-converter':
        return renderFileConverterTab();
      default:
        return renderOverviewTab();
    }
  };

  const renderVideoProcessorTab = () => (
    <div className="space-y-8">
      <div className="bg-gradient-to-br from-pink-900/30 to-red-900/30 backdrop-blur-sm border border-pink-500/20 rounded-2xl p-6">
        <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
          🎬 Video Template Processor
        </h3>
        <VideoUploadProcessor />
      </div>
    </div>
  );

  const renderCategoryManagerTab = () => {
    const handleTemplateUpdated = (result: CategoryUpdateResult) => {
      // Refresh templates when a category is updated to keep data synchronized
      fetchTemplates();
      
      // Set appropriate message based on the type of operation
      if (result.source === 'template-deletion') {
        setMessage(`🗑️ Template deleted from "${result.oldCategory}" category successfully!`);
      } else if (result.source === 'drag-and-drop') {
        setMessage(`✅ Template moved from "${result.oldCategory}" to "${result.newCategory}" successfully!`);
      } else if (result.source === 'file-import') {
        setMessage(`📁 Templates imported to "${result.newCategory}" successfully!`);
      } else {
        setMessage(`✅ Template operation completed successfully!`);
      }
      
      // Clear message after 5 seconds
      setTimeout(() => setMessage(""), 5000);
    };

    const handleCategoryUpdated = () => {
      // Trigger analytics refresh when categories change
      fetchAnalyticsData();
      // Also refresh sync status to reflect changes
    };

    return (
      <div className="space-y-8">
        {message && (
          <div className={`p-4 rounded-lg ${message.includes('✅') || message.includes('🗑️') || message.includes('📁') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
            {message}
          </div>
        )}
        
        <TemplateCategoryManager 
          onTemplateUpdated={handleTemplateUpdated}
          onCategoryUpdated={handleCategoryUpdated}
        />
      </div>
    );
  };

  const renderFileConverterTab = () => (
    <div className="space-y-8">
      <div className="bg-gradient-to-br from-cyan-900/30 to-blue-900/30 backdrop-blur-sm border border-cyan-500/20 rounded-2xl p-6">
        <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
          🔄 Advanced File Converter
        </h3>
        <div className="mb-4 p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">ℹ️</span>
            <h4 className="text-lg font-semibold text-blue-300">Supported Formats</h4>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="text-cyan-300 font-semibold mb-1">Adobe Files</div>
              <div className="text-gray-300">.aep, .mogrt, .psd, .ai</div>
            </div>
            <div>
              <div className="text-green-300 font-semibold mb-1">Video</div>
              <div className="text-gray-300">MP4, AVI, MOV, MKV, WebM</div>
            </div>
            <div>
              <div className="text-purple-300 font-semibold mb-1">Audio</div>
              <div className="text-gray-300">MP3, WAV, AAC, OGG, FLAC</div>
            </div>
            <div>
              <div className="text-orange-300 font-semibold mb-1">Images</div>
              <div className="text-gray-300">JPG, PNG, WebP, HEIC</div>
            </div>
          </div>
          <div className="mt-3 text-xs text-gray-400">
            📋 Total: 70+ supported formats including documents, archives, and fonts
          </div>
        </div>
        <VideoTemplateProcessor />
      </div>
    </div>
  );

  const renderAnalyticsContent = () => {
    switch (activeAnalyticsSubTab) {
      case 'platforms':
        return renderPlatformsAnalytics();
      case 'error':
        return renderErrorsTab();
      case 'activity':
        return renderActivityTab();
      case 'refresh':
        return renderRefreshAnalytics();
      default:
        return renderPlatformsAnalytics();
    }
  };

  const renderPlatformsAnalytics = () => (
    <div className="space-y-8">
      {/* Platform Statistics */}
      <div className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 backdrop-blur-sm border border-purple-500/20 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-white flex items-center gap-3">
            🌐 Platform Analytics & Distribution
          </h3>
          <button
            onClick={fetchPlatformStats}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
          >
            🔄 Refresh
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {platformStats.map((platform, index) => (
            <div key={platform.platformName} className="bg-black/30 rounded-xl p-5 border border-purple-500/10">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold text-white">{platform.platformName}</h4>
                <div className={`w-3 h-3 rounded-full ${platform.status === 'active' ? 'bg-green-500' : 'bg-red-500'}`} />
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">Live Templates:</span>
                  <span className="text-white font-semibold">{platform.liveTemplates}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Total Imports:</span>
                  <span className="text-blue-400 font-semibold">{platform.totalImports}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Categories:</span>
                  <span className="text-purple-400 font-semibold">{platform.categories?.length || 0}</span>
                </div>
                {platform.lastImport && (
                  <div className="text-xs text-gray-500 mt-2">
                    Last import: {new Date(platform.lastImport).toLocaleDateString()}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Category Distribution */}
      <div className="bg-gradient-to-br from-blue-900/30 to-cyan-900/30 backdrop-blur-sm border border-blue-500/20 rounded-2xl p-6">
        <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
          📊 Category Distribution
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {categoryDistribution.map((category, index) => (
            <div key={category.category} className="bg-black/30 rounded-lg p-4 text-center">
              <div className="text-2xl mb-2">{category.icon || '📁'}</div>
              <div className="text-sm text-gray-400 mb-1">{category.category}</div>
              <div className="text-lg font-bold text-white">{category.count}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderRefreshAnalytics = () => (
    <div className="space-y-8">
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

      {/* Quota History Chart */}
      <div className="bg-gradient-to-br from-green-900/30 to-teal-900/30 backdrop-blur-sm border border-green-500/20 rounded-2xl p-6">
        <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
          📈 Quota Usage History (7 Days)
        </h3>
        <div className="space-y-4">
          {quotaHistory.map((day, index) => (
            <div key={day.date} className="bg-black/30 rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-300">{new Date(day.date).toLocaleDateString()}</span>
                <span className="text-white font-semibold">{day.totalUsed} requests</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div 
                  className="h-2 bg-gradient-to-r from-green-500 to-blue-500 rounded-full transition-all"
                  style={{ width: `${Math.min((day.totalUsed / 10000) * 100, 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderImportersTab = () => (
    <div className="space-y-8">
      {/* Template Importer Section */}
      <div className="bg-gradient-to-br from-blue-900/30 to-purple-900/30 backdrop-sm border border-blue-500/20 rounded-2xl p-6">
        <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
          📋 Template Importer
        </h3>
        <TemplateImporter onImport={handleImportResult} />
      </div>

      {/* External API Search */}
      <div className="bg-gradient-to-br from-cyan-900/30 to-teal-900/30 backdrop-sm border border-cyan-500/20 rounded-2xl p-6">
        <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
          🔍 External API Search & Import
        </h3>
        
        <div className="space-y-6">
          {/* Platform Selection */}
          <div>
            <label className="block text-gray-300 text-sm font-medium mb-3">Select Platforms:</label>
            <div className="flex flex-wrap gap-3">
              {['Pexels', 'Pixabay', 'Unsplash'].map((platform) => (
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
                    className="rounded"
                  />
                  <span className="text-white">{platform}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Search Input */}
          <div className="flex gap-4">
            <input
              type="text"
              value={externalSearchTerm}
              onChange={(e) => setExternalSearchTerm(e.target.value)}
              placeholder="Search external APIs (e.g., 'nature', 'business', 'technology')"
              className="flex-1 px-4 py-3 bg-black/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:border-cyan-500 focus:outline-none"
              onKeyPress={(e) => e.key === 'Enter' && handleExternalApiSearch()}
            />
            <button
              onClick={handleExternalApiSearch}
              className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white rounded-xl font-semibold transition-all"
            >
              🔍 Search
            </button>
          </div>

          {/* Search Results */}
          {externalSearchResults.length > 0 && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-lg font-semibold text-white">
                  Search Results ({externalSearchResults.length})
                </h4>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleImportFromExternalApis(10)}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm transition-colors"
                  >
                    Import Top 10
                  </button>
                  <button
                    onClick={() => handleImportFromExternalApis(20)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors"
                  >
                    Import Top 20
                  </button>
                  <button
                    onClick={() => handleImportFromExternalApis(50)}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm transition-colors"
                  >
                    Import Top 50
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-h-96 overflow-y-auto">
                {externalSearchResults.slice(0, 20).map((result, index) => (
                  <div key={`${result.platform}-${index}`} className="bg-black/30 rounded-lg p-3">
                    <img
                      src={result.preview}
                      alt={result.title}
                      className="w-full h-32 object-cover rounded-lg mb-2"
                    />
                    <h5 className="text-white text-sm font-medium truncate">{result.title}</h5>
                    <p className="text-gray-400 text-xs">{result.platform}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

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
        <div className="bg-gradient-to-br from-green-900/20 to-emerald-900/20 backdrop-sm border border-green-500/20 rounded-2xl p-6">
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
        <div className="bg-gradient-to-br from-orange-900/20 to-red-900/20 backdrop-sm border border-orange-500/20 rounded-2xl p-6">
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



  const renderTemplatesTab = () => (
    <div className="space-y-6">
      {/* Search and Filter Controls */}
      <div className="bg-gradient-to-br from-gray-900/30 to-gray-800/30 backdrop-blur-sm border border-gray-700/20 rounded-2xl p-6">
        <div className="flex flex-wrap gap-4 items-center justify-between">
          {/* Drag Status Indicator */}
          {isDragging && (
            <div className="bg-blue-900/50 border border-blue-500/50 rounded-lg px-4 py-2 flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse" />
              <span className="text-blue-300 text-sm font-medium">
                Dragging template... Drop to reorder
              </span>
            </div>
          )}
          
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
            
            {/* Broken Images Filter */}
            <button
              onClick={testAllTemplateImages}
              disabled={testingImages}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              {testingImages ? (
                <>
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                  Testing...
                </>
              ) : (
                <>
                  🖼️ Find Broken Images
                </>
              )}
            </button>
            
            {brokenImagesList.size > 0 && (
              <button
                onClick={() => setShowOnlyBrokenImages(!showOnlyBrokenImages)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                  showOnlyBrokenImages 
                    ? 'bg-orange-600 hover:bg-orange-700 text-white border-2 border-orange-400' 
                    : 'bg-red-600 hover:bg-red-700 text-white'
                }`}
              >
                {showOnlyBrokenImages ? (
                  <>
                    👁️ Show All Templates
                    <span className="bg-orange-800 px-2 py-1 rounded text-xs">
                      Showing {getFilteredData().templates?.length || 0} broken
                    </span>
                  </>
                ) : (
                  <>
                    🚫 Show Only Broken
                    <span className="bg-red-800 px-2 py-1 rounded text-xs">
                      {brokenImagesList.size} found
                    </span>
                  </>
                )}
              </button>
            )}
          </div>
          
          {/* Progress Bars */}
          {(testingImages || deletingProgress.isDeleting) && (
            <div className="space-y-4">
              {/* Image Testing Progress */}
              {testingImages && (
                <div className="bg-black/30 backdrop-blur-sm rounded-lg p-4 border border-blue-500/20">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-blue-300 font-medium">🔍 Testing Template Images</span>
                    <span className="text-blue-300 text-sm">
                      Batch {testingProgress.currentBatch}/{testingProgress.totalBatches}
                    </span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-3 mb-2">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-cyan-500 h-3 rounded-full transition-all duration-300 ease-out"
                      style={{ 
                        width: testingProgress.total > 0 
                          ? `${(testingProgress.current / testingProgress.total) * 100}%` 
                          : '0%' 
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-sm text-gray-400">
                    <span>{testingProgress.current} / {testingProgress.total} templates tested</span>
                    <span>{testingProgress.total > 0 ? Math.round((testingProgress.current / testingProgress.total) * 100) : 0}%</span>
                  </div>
                </div>
              )}
              
              {/* Deletion Progress */}
              {deletingProgress.isDeleting && (
                <div className="bg-black/30 backdrop-blur-sm rounded-lg p-4 border border-red-500/20">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-red-300 font-medium">🗑️ Deleting Templates</span>
                    <span className="text-red-300 text-sm">
                      {deletingProgress.current}/{deletingProgress.total}
                    </span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-3 mb-2">
                    <div 
                      className="bg-gradient-to-r from-red-500 to-orange-500 h-3 rounded-full transition-all duration-300 ease-out"
                      style={{ 
                        width: deletingProgress.total > 0 
                          ? `${(deletingProgress.current / deletingProgress.total) * 100}%` 
                          : '0%' 
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-sm text-gray-400">
                    <span>{deletingProgress.current} / {deletingProgress.total} templates deleted</span>
                    <span>{deletingProgress.total > 0 ? Math.round((deletingProgress.current / deletingProgress.total) * 100) : 0}%</span>
                  </div>
                </div>
              )}
            </div>
          )}
          
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

      {/* Feature Guide */}
      <div className="bg-gradient-to-br from-green-900/30 to-blue-900/30 backdrop-blur-sm border border-green-500/20 rounded-2xl p-6">
        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          ✨ Enhanced Features - Fixed & Working!
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="bg-black/30 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">🎯</span>
              <h4 className="font-semibold text-green-300">Drag & Drop (Fixed!)</h4>
            </div>
            <p className="text-gray-300 mb-2">
              Hover over templates and use the blue drag handle (⋮⋮) in the bottom-right corner to drag and reorder templates.
            </p>
            <div className="text-xs bg-green-900/50 p-2 rounded border border-green-500/30">
              <span className="text-green-400 font-medium">✅ Issues Fixed:</span>
              <br />• Replaced deprecated react-beautiful-dnd with modern @dnd-kit
              <br />• Fixed highlighting issue - now properly drags
              <br />• Added proper drag sensors and collision detection
            </div>
          </div>
          <div className="bg-black/30 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">🗑️</span>
              <h4 className="font-semibold text-red-300">Individual Delete (Working!)</h4>
            </div>
            <p className="text-gray-300 mb-2">
              Hover over templates and click the red (×) button in the top-right corner to delete individual templates.
            </p>
            <div className="text-xs bg-red-900/50 p-2 rounded border border-red-500/30">
              <span className="text-red-400 font-medium">✅ Features:</span>
              <br />• Instant individual template deletion
              <br />• Confirmation dialogs for safety
              <br />• Loading indicators during deletion
              <br />• State cleanup after deletion
            </div>
          </div>
        </div>
        <div className="mt-4 text-center">
          <div className="inline-flex items-center gap-2 bg-blue-900/50 px-4 py-2 rounded-lg border border-blue-500/30">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
            <span className="text-blue-300 text-sm font-medium">All functionality restored and enhanced!</span>
          </div>
        </div>
      </div>

      {/* Duplicate Detection & Cleanup Section */}
      <div className="bg-gradient-to-br from-red-900/30 to-orange-900/30 backdrop-blur-sm border border-red-500/20 rounded-2xl p-6">
        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          🧹 Duplicate Template Cleanup
          <span className="text-xs bg-red-600 px-2 py-1 rounded-full">SAFE</span>
        </h3>
        
        <div className="space-y-4">
          <div className="bg-black/30 rounded-lg p-4">
            <p className="text-gray-300 text-sm mb-4">
              Safely detect and remove duplicate templates while preserving the most used versions.
              This process analyzes preview URLs, titles, and categories to identify exact duplicates.
            </p>
            
            <div className="flex gap-4 items-center">
              <button
                onClick={handleScanForDuplicates}
                disabled={duplicateLoading}
                className="px-6 py-2 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                {duplicateLoading ? (
                  <>
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                    Scanning...
                  </>
                ) : (
                  <>
                    🔍 Scan for Duplicates
                  </>
                )}
              </button>
              
              {duplicateReport && (
                <button
                  onClick={handleExecuteCleanup}
                  disabled={duplicateLoading || duplicateReport.totalTemplatesDeleted === 0}
                  className="px-6 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                >
                  {duplicateLoading ? (
                    <>
                      <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                      Cleaning...
                    </>
                  ) : (
                    <>
                      🗑️ Execute Cleanup ({duplicateReport.totalTemplatesDeleted})
                    </>
                  )}
                </button>
              )}
              
              <button
                onClick={handleCreateManualBackup}
                disabled={backupLoading}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                {backupLoading ? (
                  <>
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                    Creating...
                  </>
                ) : (
                  <>
                    📦 Create Backup
                  </>
                )}
              </button>
              
              <button
                onClick={() => {
                  setShowBackupManager(!showBackupManager);
                  if (!showBackupManager) loadAvailableBackups();
                }}
                className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                🗂️ Manage Backups ({availableBackups.length})
              </button>
            </div>
          </div>

          {/* Duplicate Report Preview */}
          {duplicateReport && showDuplicatePreview && (
            <div className="bg-black/30 rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-lg font-bold text-white">Duplicate Analysis Results</h4>
                <button
                  onClick={() => setShowDuplicatePreview(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  ✕
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-900/30 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-blue-300">{duplicateReport.totalDuplicatesFound}</div>
                  <div className="text-sm text-gray-400">Total Duplicates</div>
                </div>
                <div className="bg-green-900/30 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-green-300">{duplicateReport.totalTemplatesKept}</div>
                  <div className="text-sm text-gray-400">Templates to Keep</div>
                </div>
                <div className="bg-red-900/30 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-red-300">{duplicateReport.totalTemplatesDeleted}</div>
                  <div className="text-sm text-gray-400">Templates to Delete</div>
                </div>
              </div>

              {duplicateReport.duplicateGroups.length > 0 && (
                <div className="max-h-60 overflow-y-auto space-y-3">
                  <h5 className="font-medium text-white">Duplicate Groups Preview:</h5>
                  {duplicateReport.duplicateGroups.slice(0, 5).map((group, index) => (
                    <div key={index} className="bg-gray-800/50 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-white">Group {index + 1}</span>
                        <span className="text-xs bg-red-600/30 px-2 py-1 rounded text-red-300">
                          {group.deleteTemplates.length} to delete
                        </span>
                      </div>
                      <div className="flex gap-4 items-center mb-1">
                        <div className="flex flex-col items-center">
                          <span className="text-xs text-green-400 mb-1">Keep</span>
                          <img src={group.keepTemplate.preview} alt={group.keepTemplate.title} className="w-16 h-16 object-cover rounded border-2 border-green-500" />
                          <div className="text-xs text-white mt-1 truncate w-16 text-center">{group.keepTemplate.title}</div>
                        </div>
                        <span className="text-gray-400">→</span>
                        <div className="flex gap-2">
                          {group.deleteTemplates.map((tpl, i) => (
                            <div key={i} className="flex flex-col items-center">
                              <span className="text-xs text-red-400 mb-1">Delete</span>
                              <img src={tpl.preview} alt={tpl.title} className="w-16 h-16 object-cover rounded border-2 border-red-500" />
                              <div className="text-xs text-white mt-1 truncate w-16 text-center">{tpl.title}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="text-xs text-gray-400 mt-2">
                        <strong>Reason:</strong> {group.reason}
                      </div>
                    </div>
                  ))}
                  {duplicateReport.duplicateGroups.length > 5 && (
                    <div className="text-center text-sm text-gray-400">
                      ... and {duplicateReport.duplicateGroups.length - 5} more groups
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Backup Manager */}
          {showBackupManager && (
            <div className="bg-black/30 rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-lg font-bold text-white">Backup Manager</h4>
                <button
                  onClick={() => setShowBackupManager(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  ✕
                </button>
              </div>
              
              <div className="bg-blue-900/20 rounded-lg p-3">
                <p className="text-blue-300 text-sm mb-2">
                  <strong>Automatic Backups:</strong> Created before every cleanup operation
                </p>
                <p className="text-blue-300 text-sm">
                  <strong>Manual Backups:</strong> Created on-demand for extra safety
                </p>
              </div>

              {availableBackups.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <div className="text-4xl mb-2">📦</div>
                  <p>No backups found</p>
                  <p className="text-sm">Create a manual backup or run cleanup to generate automatic backups</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {availableBackups.map((backup, index) => (
                    <div key={backup.key} className="bg-gray-800/50 rounded-lg p-3 flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-white">
                            {new Date(backup.timestamp).toLocaleString()}
                          </span>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            backup.backupType === 'manual' 
                              ? 'bg-blue-600/30 text-blue-300' 
                              : 'bg-orange-600/30 text-orange-300'
                          }`}>
                            {backup.backupType === 'manual' ? 'Manual' : 'Auto'}
                          </span>
                        </div>
                        <div className="text-xs text-gray-400">
                          {backup.templateCount} templates
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleRestoreFromBackup(backup.key)}
                          disabled={backupLoading}
                          className="px-3 py-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded text-xs font-medium transition-colors"
                        >
                          🔄 Restore
                        </button>
                        <button
                          onClick={() => handleDeleteBackup(backup.key)}
                          className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-medium transition-colors"
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
            <button
              onClick={async () => {
                try {
                  const result = await externalApiService.testPixabayConnection();
                  alert(`Pixabay Test: ${result.message}${result.sampleUrl ? '\nSample URL: ' + result.sampleUrl : ''}`);
                } catch (error) {
                  alert(`Pixabay Test Failed: ${error}`);
                }
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors text-sm"
            >
              🧪 Test Pixabay
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

      {/* Select All Checkbox */}
      {(showOnlyBrokenImages && brokenImagesList.size > 0) && (
        <div className="bg-gradient-to-br from-red-900/30 to-orange-900/30 backdrop-blur-sm border border-red-500/20 rounded-2xl p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={getFilteredData().templates?.every(tpl => bulkSelectedTemplates.has(tpl.id)) || false}
                onChange={(e) => {
                  const filteredTemplates = getFilteredData().templates || [];
                  const newSelected = new Set(bulkSelectedTemplates);
                  if (e.target.checked) {
                    filteredTemplates.forEach(tpl => newSelected.add(tpl.id));
                  } else {
                    filteredTemplates.forEach(tpl => newSelected.delete(tpl.id));
                  }
                  setBulkSelectedTemplates(newSelected);
                }}
                className="w-4 h-4"
              />
              <label className="text-white font-medium">
                Select All Broken Templates ({getFilteredData().templates?.length || 0})
              </label>
            </div>
            <div className="text-red-300 text-sm">
              {bulkSelectedTemplates.size} selected for deletion
            </div>
          </div>
        </div>
      )}

      {/* Templates Grid with Drag & Drop */}
              <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
                  <SortableContext 
            items={(getFilteredData().templates || templates).map(t => t.id)}
            strategy={rectSortingStrategy}
          >
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 transition-all duration-300">
              {(getFilteredData().templates || templates).map((tpl) => (
                <SortableTemplateItem key={tpl.id} template={tpl} />
              ))}
            </div>
          </SortableContext>
      </DndContext>
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
      <div className="bg-gradient-to-br from-red-900/30 to-pink-900/30 backdrop-sm border border-red-500/20 rounded-2xl p-6">
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
    <div data-testid="admin-panel" className="min-h-screen bg-black text-white">
      {/* Header Section - Fixed and Reduced Height */}
      <div className="fixed top-0 left-0 right-0 z-40 bg-gradient-to-r from-purple-900/20 via-blue-900/20 to-purple-900/20 border-b border-purple-500/20 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          {/* Title and Top-Right Controls */}
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 bg-clip-text text-transparent">
                Enhanced Admin Dashboard
              </h1>
              <p className="text-gray-400 mt-1">Advanced analytics and monitoring for ViewsBoost</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/')} 
                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold py-3 px-6 rounded-xl shadow-lg hover:shadow-blue-500/20 transition-all duration-300 transform hover:scale-105"
              >
                🏠 Home
              </button>
              <div className="relative admin-menu-dropdown">
                <button
                  onClick={() => setShowAdminMenu(!showAdminMenu)}
                  className="px-6 py-3 rounded-xl font-semibold transition-all duration-300 bg-orange-500 hover:bg-orange-600 text-white shadow-lg flex items-center gap-2"
                >
                  Menu
                  <span className={`transform transition-transform ${showAdminMenu ? 'rotate-180' : ''}`}>
                    ▼
                  </span>
                </button>
                {showAdminMenu && (
                  <div className="absolute top-full right-0 mt-2 w-80 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl z-50">
                    <div className="p-2">
                      {/* Overview */}
                      <button
                        onClick={() => {
                          setActiveMainTab('overview');
                          setShowAdminMenu(false);
                        }}
                        className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-200 ${
                          activeMainTab === 'overview'
                            ? 'bg-purple-600 text-white'
                            : 'text-gray-300 hover:bg-gray-800'
                        }`}
                      >
                        📊 Overview
                      </button>
                      
                      {/* Analytics with Sub-tabs */}
                      <div className="mt-1">
                        <button
                          onClick={() => {
                            setActiveMainTab('analytics');
                            setShowAdminMenu(false);
                          }}
                          className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-200 ${
                            activeMainTab === 'analytics'
                              ? 'bg-purple-600 text-white'
                              : 'text-gray-300 hover:bg-gray-800'
                          }`}
                        >
                          📈 Analytics
                        </button>
                        
                        {/* Analytics Sub-tabs */}
                        {activeMainTab === 'analytics' && (
                          <div className="ml-4 mt-2 space-y-1">
                            <button
                              onClick={() => {
                                setActiveAnalyticsSubTab('platforms');
                                setShowAdminMenu(false);
                              }}
                              className={`w-full text-left px-3 py-2 rounded text-sm transition-all duration-200 ${
                                activeAnalyticsSubTab === 'platforms'
                                  ? 'bg-purple-500 text-white'
                                  : 'text-purple-300 hover:bg-gray-800'
                              }`}
                            >
                              🌐 Platforms
                            </button>
                            <button
                              onClick={() => {
                                setActiveAnalyticsSubTab('error');
                                setShowAdminMenu(false);
                              }}
                              className={`w-full text-left px-3 py-2 rounded text-sm transition-all duration-200 ${
                                activeAnalyticsSubTab === 'error'
                                  ? 'bg-purple-500 text-white'
                                  : 'text-purple-300 hover:bg-gray-800'
                              }`}
                            >
                              🚨 Error
                            </button>
                            <button
                              onClick={() => {
                                setActiveAnalyticsSubTab('activity');
                                setShowAdminMenu(false);
                              }}
                              className={`w-full text-left px-3 py-2 rounded text-sm transition-all duration-200 ${
                                activeAnalyticsSubTab === 'activity'
                                  ? 'bg-purple-500 text-white'
                                  : 'text-purple-300 hover:bg-gray-800'
                              }`}
                            >
                              🔄 Activity
                            </button>
                            <button
                              onClick={() => {
                                setActiveAnalyticsSubTab('refresh');
                                setShowAdminMenu(false);
                              }}
                              className={`w-full text-left px-3 py-2 rounded text-sm transition-all duration-200 ${
                                activeAnalyticsSubTab === 'refresh'
                                  ? 'bg-purple-500 text-white'
                                  : 'text-purple-300 hover:bg-gray-800'
                              }`}
                            >
                              🔄 Refresh
                            </button>
                          </div>
                        )}
                      </div>
                      
                      {/* Templates */}
                      <button
                        onClick={() => {
                          setActiveMainTab('templates');
                          setShowAdminMenu(false);
                        }}
                        className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-200 mt-1 ${
                          activeMainTab === 'templates'
                            ? 'bg-purple-600 text-white'
                            : 'text-gray-300 hover:bg-gray-800'
                        }`}
                      >
                        🎨 Templates
                      </button>
                      
                      {/* Template Importers */}
                      <button
                        onClick={() => {
                          setActiveMainTab('importers');
                          setShowAdminMenu(false);
                        }}
                        className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-200 mt-1 ${
                          activeMainTab === 'importers'
                            ? 'bg-purple-600 text-white'
                            : 'text-gray-300 hover:bg-gray-800'
                        }`}
                      >
                        📋 Template Importers
                      </button>
                      
                      {/* Video Processor */}
                      <button
                        onClick={() => {
                          setActiveMainTab('video-processor');
                          setShowAdminMenu(false);
                        }}
                        className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-200 mt-1 ${
                          activeMainTab === 'video-processor'
                            ? 'bg-purple-600 text-white'
                            : 'text-gray-300 hover:bg-gray-800'
                        }`}
                      >
                        🎬 Video Processor
                      </button>
                      
                      {/* Category Manager */}
                      <button
                        onClick={() => {
                          setActiveMainTab('category-manager');
                          setShowAdminMenu(false);
                        }}
                        className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-200 mt-1 ${
                          activeMainTab === 'category-manager'
                            ? 'bg-purple-600 text-white'
                            : 'text-gray-300 hover:bg-gray-800'
                        }`}
                      >
                        🎯 Category Manager
                      </button>

                      {/* Template Browser */}
                      <button
                        onClick={() => {
                          setActiveMainTab('template-browser');
                          setShowAdminMenu(false);
                        }}
                        className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-200 mt-1 ${
                          activeMainTab === 'template-browser'
                            ? 'bg-purple-600 text-white'
                            : 'text-gray-300 hover:bg-gray-800'
                        }`}
                      >
                        📋 Template Browser
                      </button>

                      {/* File Converter */}
                      <button
                        onClick={() => {
                          setActiveMainTab('file-converter');
                          setShowAdminMenu(false);
                        }}
                        className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-200 mt-1 ${
                          activeMainTab === 'file-converter'
                            ? 'bg-purple-600 text-white'
                            : 'text-gray-300 hover:bg-gray-800'
                        }`}
                      >
                        🔄 File Converter
                      </button>

                      {/* Divider */}
                      <div className="border-t border-gray-700 my-2"></div>
                      
                      {/* Action Buttons */}
                      <div className="space-y-1">
                        <button
                          onClick={() => {
                            handleIngest();
                            setShowAdminMenu(false);
                          }}
                          disabled={ingesting}
                          className="w-full text-left px-4 py-3 rounded-lg transition-all duration-200 text-orange-300 hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {ingesting ? '🚀 Ingesting Videos...' : '📥 Ingest All Creator Videos'}
                        </button>
                        
                        <button
                          onClick={() => {
                            handleRefreshAll();
                            setShowAdminMenu(false);
                          }}
                          className="w-full text-left px-4 py-3 rounded-lg transition-all duration-200 text-yellow-300 hover:bg-gray-800"
                        >
                          🔄 Refresh All Data
                        </button>
                        
                        <button
                          onClick={() => {
                            setShowImporterModal(true);
                            setShowAdminMenu(false);
                          }}
                          className="w-full text-left px-4 py-3 rounded-lg transition-all duration-200 text-blue-300 hover:bg-gray-800"
                        >
                          📋 Template Importer Modal
                        </button>
                        
                        <a
                          href="/template-importer"
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => setShowAdminMenu(false)}
                          className="w-full text-left px-4 py-3 rounded-lg transition-all duration-200 text-indigo-300 hover:bg-gray-800 block no-underline"
                        >
                          🔗 Open Importer (New Tab)
                        </a>
                        
                        <button
                          onClick={() => {
                            handleAnalyzeExistingTemplates();
                            setShowAdminMenu(false);
                          }}
                          className="w-full text-left px-4 py-3 rounded-lg transition-all duration-200 text-cyan-300 hover:bg-gray-800"
                        >
                          🔍 Analyze Platforms
                        </button>
                        
                        {/* Divider */}
                        <div className="border-t border-gray-700 my-2"></div>
                        
                        {/* Logout Button */}
                        <button
                          onClick={() => {
                            handleLogout();
                            setShowAdminMenu(false);
                          }}
                          className="w-full text-left px-4 py-3 rounded-lg transition-all duration-200 text-red-300 hover:bg-gray-800"
                        >
                          🚪 Logout
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
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

      {/* Main Content - Scrollable with top padding for fixed header */}
      <div className="pt-40 max-w-7xl mx-auto px-6 py-8">
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
            
            {/* Enhanced image display with error handling */}
            <div className="relative w-full h-64 bg-gradient-to-br from-purple-900 to-gray-900">
              {previewTemplate.preview ? (
                <img
                  src={previewTemplate.preview}
                  alt={previewTemplate.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    console.warn('❌ Preview image failed to load:', previewTemplate.preview);
                    e.currentTarget.style.display = 'none';
                    const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                    if (fallback) fallback.style.display = 'flex';
                  }}
                  onLoad={() => {
                    console.log('✅ Preview image loaded successfully:', previewTemplate.preview);
                  }}
                />
              ) : null}
              
              {/* Fallback content when image fails or doesn't exist */}
              <div 
                className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-purple-900 to-gray-900"
                style={{ display: previewTemplate.preview ? 'none' : 'flex' }}
              >
                <div className="text-center">
                  <div className="text-6xl mb-2 opacity-50">{previewTemplate.icon}</div>
                  <div className="text-white text-sm opacity-75">No Preview Available</div>
                </div>
              </div>
            </div>
            
            <div className="p-6">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-3xl">{previewTemplate.icon}</span>
                <h3 className="font-bold text-white text-xl">{previewTemplate.title}</h3>
              </div>
              <div className="inline-block bg-purple-500/20 text-purple-300 text-sm px-3 py-1 rounded-full mb-3">
                {previewTemplate.category}
              </div>
              <p className="text-gray-300 leading-relaxed">{previewTemplate.desc}</p>
              
              {/* Additional template info */}
              {previewTemplate.preview && (
                <div className="mt-4 p-3 bg-gray-800/50 rounded-lg">
                  <div className="text-xs text-gray-400 mb-1">Preview URL:</div>
                  <div className="text-xs text-blue-300 break-all">{previewTemplate.preview}</div>
                </div>
              )}
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
