import React, { useState, useRef, useEffect } from "react";
import { db } from "../lib/firebase";
import { collection, addDoc, getDocs, deleteDoc } from "firebase/firestore";
import { externalApiService } from '../lib/services/externalApiService';

// Enhanced Enterprise Template Importer
// Features: Smart queue management, adjustable batch sizes, auto-save remaining templates, resume capability

interface Template {
  title: string;
  category: string;
  prompt: string;
  imageUrl?: string;
  videoType?: string;
  platform?: string;
  description?: string;
  [key: string]: any;
}

interface ImportQueue {
  id: string;
  templates: Template[];
  processed: number;
  total: number;
  status: 'pending' | 'processing' | 'paused' | 'completed' | 'failed';
  createdAt: string;
  lastUpdated: string;
  batchSize: number;
}

interface TemplateImporterProps {
  onImport?: () => void;
}

// Enhanced Platform detection utility - FIXED PRIORITY ORDER & COMPREHENSIVE COVERAGE
const detectTemplatePlatform = (template: Template): string => {
  // 🚨 PRIORITY 1: Check explicit platform field FIRST (most reliable)
  if (template.platform) {
    return template.platform;
  }
  if (template.source) {
    return template.source;
  }

  // PRIORITY 2: Enhanced URL-based detection with comprehensive platform coverage
  const previewUrl = template.preview || template.imageUrl || template.sourceUrl || '';
  const description = template.desc || template.description || '';
  const title = template.title || '';
  
  // Major design platforms (comprehensive domain coverage)
  if (previewUrl.includes('canva.com') || previewUrl.includes('static.canva.com')) return 'Canva';
  if (previewUrl.includes('adobe.com') || previewUrl.includes('express.adobe.com') || previewUrl.includes('stock.adobe.com')) return 'Adobe';
  if (previewUrl.includes('figma.com')) return 'Figma';
  if (previewUrl.includes('sketch.com')) return 'Sketch';
  
  // Stock photo platforms
  if (previewUrl.includes('unsplash.com')) return 'Unsplash';
  if (previewUrl.includes('pexels.com')) return 'Pexels';
  if (previewUrl.includes('pixabay.com')) return 'Pixabay';
  if (previewUrl.includes('freepik.com')) return 'Freepik';
  if (previewUrl.includes('shutterstock.com')) return 'Shutterstock';
  if (previewUrl.includes('getty')) return 'Getty Images';
  
  // Other design tools (PREVIOUSLY MISSING!)
  if (previewUrl.includes('vista.com') || previewUrl.includes('create.vista.com')) return 'VistaCreate';
  if (previewUrl.includes('fotor.com')) return 'Fotor';
  if (previewUrl.includes('snappa.com')) return 'Snappa';
  if (previewUrl.includes('pixlr.com')) return 'Pixlr';
  if (previewUrl.includes('visme.co')) return 'Visme';
  if (previewUrl.includes('designwizard.com')) return 'Design Wizard';
  if (previewUrl.includes('postermywall.com')) return 'PosterMyWall';
  if (previewUrl.includes('getstencil.com')) return 'Stencil';
  if (previewUrl.includes('slidesgo.com')) return 'Slidesgo';
  if (previewUrl.includes('slidescarnival.com')) return 'SlidesCarnival';
  if (previewUrl.includes('envato.com') || previewUrl.includes('elements.envato.com')) return 'Envato Elements';
  if (previewUrl.includes('slidemodel.com')) return 'SlideModel';
  if (previewUrl.includes('graphicriver.net')) return 'GraphicRiver';
  if (previewUrl.includes('flexclip.com')) return 'FlexClip';
  if (previewUrl.includes('animoto.com')) return 'Animoto';
  if (previewUrl.includes('kapwing.com')) return 'Kapwing';
  if (previewUrl.includes('placeit.net')) return 'Placeit';
  if (previewUrl.includes('dribbble.com')) return 'Dribbble';
  
  // PRIORITY 3: Content-based detection (fallback)
  const contentLower = `${description} ${title}`.toLowerCase();
  if (contentLower.includes('canva')) return 'Canva';
  if (contentLower.includes('adobe')) return 'Adobe';
  if (contentLower.includes('figma')) return 'Figma';
  if (contentLower.includes('unsplash')) return 'Unsplash';
  if (contentLower.includes('pexels')) return 'Pexels';
  if (contentLower.includes('pixabay')) return 'Pixabay';
  if (contentLower.includes('freepik')) return 'Freepik';
  if (contentLower.includes('vista')) return 'VistaCreate';
  
  // PRIORITY 4: Intelligent fallback for example URLs (handles test data)
  if (previewUrl.includes('example.com')) {
    if (previewUrl.includes('/canva/')) return 'Canva';
    if (previewUrl.includes('/figma/')) return 'Figma';
    if (previewUrl.includes('/adobe/')) return 'Adobe';
    if (previewUrl.includes('/sketch/')) return 'Sketch';
    if (previewUrl.includes('/vista/')) return 'VistaCreate';
  }
  
  // Default fallback with better labeling
  return 'Unknown Source';
};

const TemplateImporter: React.FC<TemplateImporterProps> = ({ onImport }) => {
  // Core state
  const [importing, setImporting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  
  // Enhanced enterprise features
  const [importQueue, setImportQueue] = useState<ImportQueue[]>([]);
  const [currentQueueId, setCurrentQueueId] = useState<string | null>(null);
  const [batchSize, setBatchSize] = useState(50); // Adjustable: 50 → 5000+ for enterprise
  const [progress, setProgress] = useState({ current: 0, total: 0, percentage: 0 });
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  
  // Performance tracking
  const [importStats, setImportStats] = useState({
    totalImported: 0,
    totalSkipped: 0,
    duplicatesFound: 0,
    failedImports: 0,
    averageTimePerTemplate: 0
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load saved queues on component mount
  useEffect(() => {
    loadSavedQueues();
  }, []);

  // Save queue to localStorage (enterprise feature)
  const saveQueueToStorage = (queue: ImportQueue) => {
    try {
      const savedQueues = JSON.parse(localStorage.getItem('templateImportQueues') || '[]');
      const existingIndex = savedQueues.findIndex((q: ImportQueue) => q.id === queue.id);
      
      if (existingIndex >= 0) {
        savedQueues[existingIndex] = queue;
      } else {
        savedQueues.push(queue);
      }
      
      localStorage.setItem('templateImportQueues', JSON.stringify(savedQueues));
      setMessage(`✅ Queue saved! ${queue.total - queue.processed} templates ready for later import.`);
    } catch (error) {
      console.error('Failed to save queue:', error);
    }
  };

  // Load saved queues from localStorage
  const loadSavedQueues = () => {
    try {
      const savedQueues = JSON.parse(localStorage.getItem('templateImportQueues') || '[]');
      setImportQueue(savedQueues);
    } catch (error) {
      console.error('Failed to load saved queues:', error);
    }
  };

  // Create new import queue
  const createImportQueue = (templates: Template[], batchSize: number): ImportQueue => {
    const queueId = `queue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    return {
      id: queueId,
      templates,
      processed: 0,
      total: templates.length,
      status: 'pending',
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      batchSize
    };
  };

  // Enhanced duplicate detection (from memory)
  const detectDuplicates = async (newTemplates: Template[]): Promise<{ unique: Template[], duplicates: Template[] }> => {
    try {
      const existingTemplates = await getDocs(collection(db, "templates"));
      const existingIdentifiers = new Set<string>();
      
      existingTemplates.forEach(doc => {
        const template = doc.data();
        const identifier = `${template.title?.toLowerCase() || ''}::${template.category?.toLowerCase() || ''}`;
        existingIdentifiers.add(identifier);
      });

      const unique: Template[] = [];
      const duplicates: Template[] = [];

      newTemplates.forEach(template => {
        const identifier = `${template.title?.toLowerCase() || ''}::${template.category?.toLowerCase() || ''}`;
        if (existingIdentifiers.has(identifier)) {
          duplicates.push(template);
        } else {
          unique.push(template);
          existingIdentifiers.add(identifier);
        }
      });

      return { unique, duplicates };
    } catch (error) {
      console.error('Error detecting duplicates:', error);
      return { unique: newTemplates, duplicates: [] };
    }
  };

  // Platform distribution analysis and bias detection
  const analyzePlatformDistribution = (templates: Template[]): { 
    distribution: Record<string, number>, 
    biasWarning: boolean, 
    dominantPlatform: string | null 
  } => {
    const platformCounts: Record<string, number> = {};
    
    templates.forEach(template => {
      const platform = detectTemplatePlatform(template);
      platformCounts[platform] = (platformCounts[platform] || 0) + 1;
    });

    const totalTemplates = templates.length;
    let dominantPlatform: string | null = null;
    let maxPercentage = 0;

    // Check for platform bias (if any platform > 80% of total)
    Object.entries(platformCounts).forEach(([platform, count]) => {
      const percentage = (count / totalTemplates) * 100;
      if (percentage > maxPercentage) {
        maxPercentage = percentage;
        dominantPlatform = platform;
      }
    });

    const biasWarning = maxPercentage > 80 && totalTemplates > 10;

    return {
      distribution: platformCounts,
      biasWarning,
      dominantPlatform: biasWarning ? dominantPlatform : null
    };
  };

  // Enhanced import with queue management
  const importTemplatesWithQueue = async (queue: ImportQueue) => {
    setImporting(true);
    setCurrentQueueId(queue.id);
    setError("");
    
    const startTime = Date.now();
    let currentBatch = 0;
    const totalBatches = Math.ceil((queue.total - queue.processed) / queue.batchSize);
    
    try {
      // Update queue status
      queue.status = 'processing';
      queue.lastUpdated = new Date().toISOString();
      saveQueueToStorage(queue);
      
      const remainingTemplates = queue.templates.slice(queue.processed);
      
      for (let i = 0; i < remainingTemplates.length && !isPaused; i += queue.batchSize) {
        currentBatch++;
        const batch = remainingTemplates.slice(i, Math.min(i + queue.batchSize, remainingTemplates.length));
        
        setMessage(`🚀 Processing batch ${currentBatch}/${totalBatches} (${batch.length} templates)...`);
        
        // Process each template in the batch
        for (let j = 0; j < batch.length && !isPaused; j++) {
          const template = batch[j];
          const currentIndex = queue.processed + i + j + 1;
          
          setProgress({
            current: currentIndex,
            total: queue.total,
            percentage: Math.round((currentIndex / queue.total) * 100)
          });
          
          try {
            // Detect platform from template data
            const detectedPlatform = detectTemplatePlatform(template);
            
            await addDoc(collection(db, "templates"), {
              ...template,
              importedAt: new Date().toISOString(),
              importBatch: queue.id,
              detectedPlatform: detectedPlatform,
              source: template.source || detectedPlatform || 'Unknown'
            });
            
            setImportStats(prev => ({
              ...prev,
              totalImported: prev.totalImported + 1
            }));
            
          } catch (error) {
            console.error(`Failed to import template: ${template.title}`, error);
            setImportStats(prev => ({
              ...prev,
              failedImports: prev.failedImports + 1
            }));
          }
          
          // Update queue progress
          queue.processed = currentIndex;
          queue.lastUpdated = new Date().toISOString();
          
          // Auto-save progress every 10 templates
          if (currentIndex % 10 === 0) {
            saveQueueToStorage(queue);
          }
          
          // Small delay to prevent overwhelming the database
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        // Check if paused between batches
        if (isPaused) {
          queue.status = 'paused';
          saveQueueToStorage(queue);
          setMessage(`⏸️ Import paused. Progress saved. ${queue.total - queue.processed} templates remaining.`);
          break;
        }
        
        // Batch completion message
        setMessage(`✅ Batch ${currentBatch}/${totalBatches} completed! ${queue.total - queue.processed} remaining...`);
      }
      
      if (!isPaused && queue.processed >= queue.total) {
        // Import completed
        queue.status = 'completed';
        queue.lastUpdated = new Date().toISOString();
        
        const endTime = Date.now();
        const totalTime = (endTime - startTime) / 1000;
        const avgTimePerTemplate = totalTime / queue.total;
        
        setImportStats(prev => ({
          ...prev,
          averageTimePerTemplate: avgTimePerTemplate
        }));
        
        setMessage(`🎉 Import completed! ${queue.total} templates imported in ${totalTime.toFixed(1)}s`);
        
        // Track platform analytics for completed import
        try {
          const platformCounts: { [key: string]: number } = {};
          const categories: string[] = [];
          
          queue.templates.forEach(template => {
            const platform = detectTemplatePlatform(template);
            platformCounts[platform] = (platformCounts[platform] || 0) + 1;
            if (template.category && !categories.includes(template.category)) {
              categories.push(template.category);
            }
          });
          
          // Update analytics for each platform detected
          for (const [platform, count] of Object.entries(platformCounts)) {
            if (platform !== 'Manual Import') {
              // Import the analytics service dynamically to avoid circular imports
              const { templateAnalyticsService } = await import('../lib/services/templateAnalyticsService');
              
              await templateAnalyticsService.trackTemplateImport(
                platform,
                platform === 'Unsplash' ? 'https://unsplash.com' :
                platform === 'Pexels' ? 'https://pexels.com' :
                platform === 'Pixabay' ? 'https://pixabay.com' :
                platform === 'Freepik' ? 'https://freepik.com' :
                platform === 'Canva' ? 'https://canva.com' :
                platform === 'Adobe Stock' ? 'https://stock.adobe.com' :
                `https://${platform.toLowerCase().replace(' ', '')}.com`,
                count,
                categories,
                'admin',
                'success'
              );
            }
          }
          
          setMessage(prev => prev + ` | Platform tracking: ${Object.entries(platformCounts).map(([p, c]) => `${p}: ${c}`).join(', ')}`);
        } catch (error) {
          console.error('Failed to track platform analytics:', error);
        }
        
        // Remove completed queue from storage
        const savedQueues = JSON.parse(localStorage.getItem('templateImportQueues') || '[]');
        const filteredQueues = savedQueues.filter((q: ImportQueue) => q.id !== queue.id);
        localStorage.setItem('templateImportQueues', JSON.stringify(filteredQueues));
        setImportQueue(filteredQueues);
      }
      
    } catch (error) {
      console.error('Import failed:', error);
      queue.status = 'failed';
      saveQueueToStorage(queue);
      setError(`Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setImporting(false);
      setCurrentQueueId(null);
      setIsPaused(false);
    }
  };

  // Enhanced file upload with smart batching
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError("");
    setMessage("📁 Reading file...");

    try {
      const fileContent = await file.text();
      const parsedTemplates: Template[] = JSON.parse(fileContent);

      if (!Array.isArray(parsedTemplates)) {
        throw new Error("File must contain an array of templates");
      }

      setMessage("🔍 Checking for duplicates...");
      const { unique, duplicates } = await detectDuplicates(parsedTemplates);
      
      if (duplicates.length > 0) {
        setMessage(`⚠️ Found ${duplicates.length} duplicates. ${unique.length} new templates ready to import.`);
        setImportStats(prev => ({ 
          ...prev, 
          duplicatesFound: duplicates.length
        }));
      }

      if (unique.length === 0) {
        setMessage("ℹ️ No new templates to import (all are duplicates).");
        return;
      }

      // Analyze platform distribution and warn about bias
      const platformAnalysis = analyzePlatformDistribution(unique);
      if (platformAnalysis.biasWarning && platformAnalysis.dominantPlatform) {
        const percentage = Math.round((platformAnalysis.distribution[platformAnalysis.dominantPlatform] / unique.length) * 100);
        setMessage(prev => `${prev} ⚠️ PLATFORM BIAS DETECTED: ${percentage}% of templates are from ${platformAnalysis.dominantPlatform}. Consider importing from more diverse sources.`);
      }

      // Smart batch size handling
      if (unique.length > batchSize) {
        setMessage(`📊 Large import detected: ${unique.length} templates. Creating queue with batch size ${batchSize}...`);
        
        const newQueue = createImportQueue(unique, batchSize);
        saveQueueToStorage(newQueue);
        setImportQueue(prev => [...prev, newQueue]);
        
        setMessage(`✅ Queue created! Will import ${batchSize} templates now, saving ${unique.length - batchSize} for later.`);
        
        if (autoSaveEnabled) {
          // Start importing the first batch automatically
          await importTemplatesWithQueue(newQueue);
        }
      } else {
        // Small batch - import directly
        const newQueue = createImportQueue(unique, unique.length);
        await importTemplatesWithQueue(newQueue);
      }

    } catch (error) {
      console.error("Error processing file:", error);
      setError(`Failed to process file: ${error instanceof Error ? error.message : 'Invalid file format'}`);
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Resume import from queue
  const resumeImport = async (queueId: string) => {
    const queue = importQueue.find(q => q.id === queueId);
    if (!queue) return;
    
    setMessage(`🔄 Resuming import from template ${queue.processed + 1}...`);
    await importTemplatesWithQueue(queue);
  };

  // Pause current import
  const pauseImport = () => {
    setIsPaused(true);
    setMessage("⏸️ Pausing import after current template...");
  };

  // Delete queue
  const deleteQueue = (queueId: string) => {
    setImportQueue(prev => prev.filter(q => q.id !== queueId));
    localStorage.setItem('templateImportQueues', JSON.stringify(importQueue.filter(q => q.id !== queueId)));
  };

  // Clear all templates from database
  const clearAllTemplates = async () => {
    if (!confirm("Are you sure you want to delete ALL templates from Firestore? This cannot be undone!")) {
      return;
    }
    
    setMessage("Clearing all templates...");
    setError("");
    setImporting(true);
    
    try {
      const colRef = collection(db, "templates");
      const snapshot = await getDocs(colRef);
      
      if (snapshot.empty) {
        setMessage("✅ No templates found in Firestore to delete.");
        setImporting(false);
        return;
      }
      
      let deleteCount = 0;
      for (const doc of snapshot.docs) {
        await deleteDoc(doc.ref);
        deleteCount++;
      }
      
      setMessage(`✅ Deleted ${deleteCount} templates from Firestore.`);
      
      // Reset statistics
      setImportStats({
        totalImported: 0,
        totalSkipped: 0,
        duplicatesFound: 0,
        failedImports: 0,
        averageTimePerTemplate: 0
      });
      
    } catch (err: any) {
      setError(`❌ Error clearing templates: ${err.message}`);
    }
    setImporting(false);
  };

  // Import from /public/templates/templates_with_previews.json automatically
  const importFromTemplatesJson = async () => {
    setMessage("");
    setError("");
    setImporting(true);
    
    try {
      const response = await fetch("/templates/templates_with_previews.json");
      if (!response.ok) throw new Error("Could not fetch templates_with_previews.json file");
      
      const allTemplates = await response.json();
      if (!Array.isArray(allTemplates)) {
        setError("❌ Error: File JSON must be an array of templates.");
        setImporting(false);
        return;
      }
      
      if (allTemplates.length < 1) {
        setError('⚠️ Warning: No templates found in the file.');
        setImporting(false);
        return;
      }

      setMessage(`Found ${allTemplates.length} templates. Creating import queue...`);
      
      // Create import queue with the templates
      const queue = createImportQueue(allTemplates, batchSize);
      setImportQueue(prev => [...prev, queue]);
      saveQueueToStorage(queue);
      
      setMessage(`✅ Created import queue with ${allTemplates.length} templates. Ready to import!`);
      
      // Auto-start the import
      setTimeout(() => {
        importTemplatesWithQueue(queue);
      }, 1000);
      
    } catch (err: any) {
      setError(`❌ Error: ${err.message}`);
      setImporting(false);
    }
  };

  // Quick test import with sample templates
  const quickTestImport = async () => {
    setMessage("");
    setError("");
    setImporting(true);
    
    try {
      const testTemplates = [
        // Canva templates (explicit platform)
        { title: "Canva Business Card", category: "Business", prompt: "Professional business card", platform: "Canva", preview: "https://static.canva.com/preview1.jpg", description: "Modern business card design" },
        { title: "Canva Social Post", category: "Social Media", prompt: "Instagram post template", platform: "Canva", preview: "https://static.canva.com/preview2.jpg", description: "Eye-catching social media content" },
        // Adobe templates (explicit platform)
        { title: "Adobe Express Flyer", category: "Marketing", prompt: "Promotional flyer design", platform: "Adobe Express", preview: "https://express.adobe.com/preview1.jpg", description: "Professional marketing flyer" },
        { title: "Adobe Creative Suite", category: "Design", prompt: "Complete design kit", platform: "Adobe", preview: "https://adobe.com/preview2.jpg", description: "Comprehensive design resources" },
        // Figma templates (explicit platform)
        { title: "Figma UI Kit", category: "Design", prompt: "Complete UI kit", platform: "Figma", preview: "https://figma.com/preview1.jpg", description: "Comprehensive UI components" },
        { title: "Figma Wireframe", category: "UX", prompt: "App wireframe template", platform: "Figma", preview: "https://figma.com/preview2.jpg", description: "Mobile app wireframe kit" },
        // VistaCreate templates (explicit platform)
        { title: "VistaCreate Banner", category: "Marketing", prompt: "Web banner design", platform: "VistaCreate", preview: "https://create.vista.com/preview1.jpg", description: "Professional web banner" },
        { title: "VistaCreate Logo", category: "Branding", prompt: "Logo design template", platform: "VistaCreate", preview: "https://create.vista.com/preview2.jpg", description: "Modern logo template" },
        // Mixed platforms for comparison (some will still detect as Unsplash due to preview URLs)
        { title: "Mixed Template 1", category: "Mixed", prompt: "Template with Unsplash preview", preview: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d", description: "This will detect as Unsplash due to URL" },
        { title: "Mixed Template 2", category: "Mixed", prompt: "Unknown source template", description: "This will show as Unknown Source" },
        // Pexels templates (URL detection)
        { title: "Pexels Photo", category: "Photography", prompt: "Stock photo template", preview: "https://images.pexels.com/test-photo.jpg", description: "Stock photography template" },
        { title: "Freepik Vector", category: "Graphics", prompt: "Vector illustration", preview: "https://freepik.com/test-vector.jpg", description: "Vector graphics template" }
      ];
      
      setMessage(`Creating test import queue with ${testTemplates.length} sample templates...`);
      
      // Create import queue with the test templates
      const queue = createImportQueue(testTemplates, Math.min(testTemplates.length, batchSize));
      setImportQueue(prev => [...prev, queue]);
      saveQueueToStorage(queue);
      
      // Show platform distribution analysis
      const platformAnalysis = analyzePlatformDistribution(testTemplates);
      const platformSummary = Object.entries(platformAnalysis.distribution)
        .map(([platform, count]) => `${platform}: ${count}`)
        .join(', ');
      
      setMessage(`✅ Created balanced test import queue! Platform distribution: ${platformSummary}${
        platformAnalysis.biasWarning ? ' ⚠️ BIAS DETECTED' : ' ✅ WELL-BALANCED'
      }. Starting import...`);
      
      // Auto-start the import
      setTimeout(() => {
        importTemplatesWithQueue(queue);
      }, 1000);
      
    } catch (err: any) {
      setError(`❌ Error: ${err.message}`);
      setImporting(false);
    }
  };

  // NEW: Unlimited Multi-Platform Import from External APIs
  const importUnlimitedFromAllSources = async () => {
    setMessage("");
    setError("");
    setImporting(true);
    
    try {
      // Expanded search terms for truly unlimited import
      const searchQueries = [
        // Business & Professional
        'business', 'corporate', 'professional', 'office', 'meeting', 'presentation',
        'strategy', 'leadership', 'teamwork', 'finance', 'startup', 'entrepreneur',
        'conference', 'networking', 'handshake', 'success', 'growth', 'innovation',
        
        // Technology & Digital
        'technology', 'digital', 'computer', 'software', 'coding', 'programming',
        'data', 'analytics', 'artificial intelligence', 'blockchain', 'cybersecurity',
        'cloud computing', 'mobile app', 'web development', 'tech startup', 'gadgets',
        
        // Design & Creative
        'design', 'creative', 'graphic design', 'typography', 'layout', 'illustration',
        'vector', 'abstract', 'minimalist', 'modern', 'colorful', 'artistic',
        'ui design', 'ux design', 'web design', 'logo design', 'branding', 'identity',
        
        // Marketing & Advertising
        'marketing', 'advertising', 'promotion', 'campaign', 'brand', 'social media',
        'content marketing', 'digital marketing', 'email marketing', 'seo', 'advertising banner',
        'product launch', 'sales', 'customer', 'audience', 'engagement', 'conversion',
        
        // Visual Content Types
        'banner', 'flyer', 'poster', 'card', 'brochure', 'infographic', 'template',
        'background', 'pattern', 'texture', 'frame', 'border', 'icon', 'symbol',
        'presentation slide', 'social media post', 'cover photo', 'header', 'hero image',
        
        // Lifestyle & People
        'lifestyle', 'people', 'portrait', 'team', 'collaboration', 'communication',
        'happiness', 'success', 'achievement', 'diversity', 'workplace', 'remote work',
        'work from home', 'productivity', 'balance', 'wellness', 'health', 'fitness',
        
        // Photography & Visual
        'photography', 'photo', 'image', 'visual', 'aesthetic', 'beautiful',
        'elegant', 'sophisticated', 'clean', 'fresh', 'bright', 'vibrant',
        'natural', 'organic', 'geometric', 'architectural', 'landscape', 'urban',
        
        // Industry Specific
        'education', 'healthcare', 'finance', 'retail', 'hospitality', 'construction',
        'real estate', 'automotive', 'food', 'fashion', 'travel', 'sports',
        'entertainment', 'music', 'art', 'culture', 'science', 'research'
      ];
      
      const categories = [
        'Business', 'Marketing', 'Design', 'Social Media', 'Technology',
        'Photography', 'Graphics', 'Branding', 'Presentation', 'Creative',
        'Education', 'Healthcare', 'Finance', 'Lifestyle', 'Professional'
      ];
      
      setMessage(`🚀 Starting TRULY UNLIMITED import from ALL sources (Pexels, Pixabay, Unsplash)...`);
      setMessage(prev => `${prev}\n📊 Will search ${searchQueries.length} different terms across all platforms`);
      
      const allTemplates: any[] = [];
      let totalSearches = 0;
      let successfulSearches = 0;
      let platformStats = { pexels: 0, pixabay: 0, unsplash: 0 };
      
      // Search ALL terms, not just first 15 - truly unlimited
      for (let i = 0; i < searchQueries.length; i++) {
        const query = searchQueries[i];
        const category = categories[i % categories.length];
        
        try {
          setMessage(prev => `${prev.split('\n')[0]}\n🔍 Searching "${query}" (${i + 1}/${searchQueries.length})...`);
          
          const searchResult = await externalApiService.searchAllPlatforms(query, category);
          
          // Track platform results
          if (searchResult.debugInfo?.pexels?.results > 0) platformStats.pexels += searchResult.debugInfo.pexels.results;
          if (searchResult.debugInfo?.pixabay?.results > 0) platformStats.pixabay += searchResult.debugInfo.pixabay.results;
          if (searchResult.debugInfo?.unsplash?.results > 0) platformStats.unsplash += searchResult.debugInfo.unsplash.results;
          
          const templates = searchResult.results.map(template => ({
            title: template.title,
            category: template.category,
            prompt: template.description,
            preview: template.preview,
            imageUrl: template.preview,
            platform: template.platform,
            description: template.description,
            tags: template.tags?.join(', ') || '',
            author: template.author || '',
            license: template.license || '',
            sourceUrl: template.sourceUrl || '',
            importedFrom: 'external_api',
            searchQuery: query
          }));
          
          allTemplates.push(...templates);
          totalSearches++;
          
          if (searchResult.results.length > 0) {
            successfulSearches++;
          }
          
          // Enhanced progress reporting
          const debugMsg = `Pexels: ${searchResult.debugInfo?.pexels?.results || 0}, Pixabay: ${searchResult.debugInfo?.pixabay?.results || 0}, Unsplash: ${searchResult.debugInfo?.unsplash?.results || 0}`;
          setMessage(prev => `${prev.split('\n')[0]}\n✅ Search ${i + 1}/${searchQueries.length}: "${query}" → ${templates.length} templates (${debugMsg})\n📊 Running Total: ${allTemplates.length} templates | Platform Stats: Pexels: ${platformStats.pexels}, Pixabay: ${platformStats.pixabay}, Unsplash: ${platformStats.unsplash}`);
          
          // Reduced delay for faster processing while respecting rate limits
          await new Promise(resolve => setTimeout(resolve, 800));
          
        } catch (error) {
          console.error(`Search failed for "${query}":`, error);
          setMessage(prev => `${prev}\n❌ Search failed for "${query}": ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
      
      if (allTemplates.length === 0) {
        setError(`❌ No templates found from external sources after ${totalSearches} searches. 
        Platform Stats: Pexels: ${platformStats.pexels}, Pixabay: ${platformStats.pixabay}, Unsplash: ${platformStats.unsplash}
        Check API keys and internet connection.`);
        setImporting(false);
        return;
      }
      
      // Enhanced duplicate removal within the imported set
      const uniqueTemplates = allTemplates.filter((template, index, array) => 
        array.findIndex(t => 
          t.title.toLowerCase().trim() === template.title.toLowerCase().trim() && 
          t.platform === template.platform
        ) === index
      );
      
      setMessage(`📊 UNLIMITED SEARCH COMPLETE!\n` +
        `🔍 Performed ${totalSearches} searches (${successfulSearches} successful)\n` +
        `📈 Found ${allTemplates.length} total templates, filtered to ${uniqueTemplates.length} unique templates\n` +
        `🎯 Platform Breakdown: Pexels: ${platformStats.pexels}, Pixabay: ${platformStats.pixabay}, Unsplash: ${platformStats.unsplash}`);
      
      // Analyze platform distribution
      const platformAnalysis = analyzePlatformDistribution(uniqueTemplates);
      const platformSummary = Object.entries(platformAnalysis.distribution)
        .map(([platform, count]) => `${platform}: ${count}`)
        .join(', ');
      
      setMessage(prev => `${prev}\n✅ Final Platform Distribution: ${platformSummary}${
        platformAnalysis.biasWarning ? ' ⚠️ BIAS DETECTED' : ' ✅ WELL-BALANCED'
      }`);
      
      // Show API key status if only one platform is working
      const workingPlatforms = Object.values(platformStats).filter(count => count > 0).length;
      if (workingPlatforms === 1) {
        setMessage(prev => `${prev}\n⚠️ WARNING: Only 1 platform returned results. Check API keys:\n` +
          `Pexels: ${import.meta.env.VITE_PEXELS_API_KEY ? '✅ Set' : '❌ Missing'}\n` +
          `Pixabay: ${import.meta.env.VITE_PIXABAY_API_KEY ? '✅ Set' : '❌ Missing'}\n` +
          `Unsplash: ${import.meta.env.VITE_UNSPLASH_ACCESS_KEY ? '✅ Set' : '❌ Missing'}`);
      }
      
      // Create unlimited import queue
      const queue = createImportQueue(uniqueTemplates, batchSize);
      setImportQueue(prev => [...prev, queue]);
      saveQueueToStorage(queue);
      
      setMessage(prev => `${prev}\n🚀 Created TRULY UNLIMITED import queue with ${uniqueTemplates.length} templates from multiple sources! Starting import...`);
      
      // Auto-start the import
      setTimeout(() => {
        importTemplatesWithQueue(queue);
      }, 2000);
      
    } catch (err: any) {
      setError(`❌ Error: ${err.message}`);
      setImporting(false);
    }
  };

  // API Keys Test Function
  const testApiKeys = () => {
    const pexelsKey = import.meta.env.VITE_PEXELS_API_KEY;
    const pixabayKey = import.meta.env.VITE_PIXABAY_API_KEY;
    const unsplashKey = import.meta.env.VITE_UNSPLASH_ACCESS_KEY;
    
    console.log('🔑 API Keys Status:');
    console.log(`  Pexels: ${pexelsKey ? '✅ Set (' + pexelsKey.substring(0, 10) + '...)' : '❌ Missing'}`);
    console.log(`  Pixabay: ${pixabayKey ? '✅ Set (' + pixabayKey.substring(0, 10) + '...)' : '❌ Missing'}`);
    console.log(`  Unsplash: ${unsplashKey ? '✅ Set (' + unsplashKey.substring(0, 10) + '...)' : '❌ Missing'}`);
    
    setMessage(`🔑 API Keys: Pexels ${pexelsKey ? '✅' : '❌'}, Pixabay ${pixabayKey ? '✅' : '❌'}, Unsplash ${unsplashKey ? '✅' : '❌'}`);
  };

  // NEW: Quick Multi-Platform Import (smaller test batch)
  const quickMultiPlatformImport = async () => {
    setMessage("");
    setError("");
    setImporting(true);
    
    try {
      setMessage(`🔍 Quick search across Pexels, Pixabay, and Unsplash...`);
      
      const searchQueries = ['technology', 'business', 'design', 'creative', 'modern'];
      const allTemplates: any[] = [];
      
      for (const query of searchQueries) {
                 try {
           const searchResult = await externalApiService.searchAllPlatforms(query, 'Mixed');
           
           // Enhanced debug info display
           const debugMsg = `Pexels(${searchResult.debugInfo?.pexels?.results || 0}), Pixabay(${searchResult.debugInfo?.pixabay?.results || 0}), Unsplash(${searchResult.debugInfo?.unsplash?.results || 0})`;
           console.log(`🐛 Quick search "${query}": ${debugMsg}`);
           
           // Take first 4 results from each search to keep it manageable
           const templates = searchResult.results.slice(0, 4).map(template => ({
            title: template.title,
            category: template.category,
            prompt: template.description,
            preview: template.preview,
            imageUrl: template.preview,
            platform: template.platform,
            description: template.description,
            searchQuery: query
          }));
          
          allTemplates.push(...templates);
          await new Promise(resolve => setTimeout(resolve, 500)); // Quick delay
        } catch (error) {
          console.error(`Quick search failed for "${query}":`, error);
        }
      }
      
      if (allTemplates.length === 0) {
        setError('❌ No templates found. Check API keys.');
        setImporting(false);
        return;
      }
      
      // Analyze platform distribution
      const platformAnalysis = analyzePlatformDistribution(allTemplates);
      const platformSummary = Object.entries(platformAnalysis.distribution)
        .map(([platform, count]) => `${platform}: ${count}`)
        .join(', ');
      
      setMessage(`✅ Quick multi-platform import ready! Platform distribution: ${platformSummary}`);
      
      // Create import queue
      const queue = createImportQueue(allTemplates, Math.min(allTemplates.length, batchSize));
      setImportQueue(prev => [...prev, queue]);
      saveQueueToStorage(queue);
      
      setMessage(`🚀 Created quick multi-platform queue with ${allTemplates.length} templates! Starting import...`);
      
      // Auto-start the import
      setTimeout(() => {
        importTemplatesWithQueue(queue);
      }, 1000);
      
    } catch (err: any) {
      setError(`❌ Error: ${err.message}`);
      setImporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400">
            🚀 Enterprise Template Importer
          </h1>
          <p className="text-xl text-gray-300">
            Smart batching • Auto-save • Resume capability • Duplicate detection
          </p>
        </div>

        {/* Settings Panel */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 mb-8 border border-gray-700">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            ⚙️ Import Settings
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-gray-300 mb-2">Batch Size</label>
              <select 
                value={batchSize} 
                onChange={(e) => setBatchSize(Number(e.target.value))}
                className="w-full p-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-purple-500"
              >
                <option value={10}>10 (Testing)</option>
                <option value={25}>25 (Small)</option>
                <option value={50}>50 (Free Plan)</option>
                <option value={100}>100 (Pro)</option>
                <option value={500}>500 (Business)</option>
                <option value={1000}>1000 (Enterprise)</option>
                <option value={5000}>5000 (Enterprise Plus)</option>
              </select>
            </div>
            
            <div>
              <label className="block text-gray-300 mb-2">Auto-Save Mode</label>
              <button
                onClick={() => setAutoSaveEnabled(!autoSaveEnabled)}
                className={`w-full p-3 rounded-lg border transition-all ${
                  autoSaveEnabled 
                    ? 'bg-green-600 border-green-500 text-white' 
                    : 'bg-gray-700 border-gray-600 text-gray-300'
                }`}
              >
                {autoSaveEnabled ? '✅ Enabled' : '❌ Disabled'}
              </button>
            </div>
            
            <div>
              <label className="block text-gray-300 mb-2">Current Status</label>
              <div className={`w-full p-3 rounded-lg border text-center ${
                importing 
                  ? 'bg-yellow-600 border-yellow-500 text-white' 
                  : 'bg-gray-700 border-gray-600 text-gray-300'
              }`}>
                {importing ? '🔄 Processing...' : '✅ Ready'}
              </div>
            </div>
          </div>
        </div>

        {/* Progress Display */}
        {importing && (
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 mb-8 border border-gray-700">
            <h3 className="text-xl font-bold text-white mb-4">📊 Import Progress</h3>
            
            <div className="mb-4">
              <div className="flex justify-between text-gray-300 mb-2">
                <span>Template {progress.current} of {progress.total}</span>
                <span>{progress.percentage}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${progress.percentage}%` }}
                ></div>
              </div>
            </div>
            
            <div className="flex gap-4">
              {!isPaused ? (
                <button
                  onClick={pauseImport}
                  className="px-6 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors"
                >
                  ⏸️ Pause Import
                </button>
              ) : (
                <span className="px-6 py-2 bg-yellow-600 text-white rounded-lg">
                  ⏸️ Pausing...
                </span>
              )}
            </div>
          </div>
        )}

        {/* Import Statistics */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 mb-8 border border-gray-700">
          <h3 className="text-xl font-bold text-white mb-4">📈 Import Statistics</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">{importStats.totalImported}</div>
              <div className="text-gray-300">Imported</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-400">{importStats.duplicatesFound}</div>
              <div className="text-gray-300">Duplicates</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-400">{importStats.failedImports}</div>
              <div className="text-gray-300">Failed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">{importQueue.length}</div>
              <div className="text-gray-300">Queued</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-400">
                {importStats.averageTimePerTemplate.toFixed(2)}s
              </div>
              <div className="text-gray-300">Avg/Template</div>
            </div>
          </div>
        </div>

        {/* File Upload */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 mb-8 border border-gray-700">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            📁 Upload Templates
          </h2>
          
          <div className="space-y-6">
            <div>
              <label className="block text-gray-300 mb-3">Select JSON file with templates:</label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileChange}
                disabled={importing}
                className="w-full p-4 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-purple-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-purple-600 file:text-white hover:file:bg-purple-700"
              />
            </div>
          </div>
        </div>

        {/* Quick Import Options */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 mb-8 border border-gray-700">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            ⚡ Multi-Platform Import Options
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={importUnlimitedFromAllSources}
              disabled={importing}
              className="p-6 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-500 hover:to-blue-500 text-white rounded-xl font-bold text-lg shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex flex-col items-center gap-3"
            >
              <div className="text-3xl">🌐</div>
              <div>TRULY UNLIMITED Multi-Platform Import</div>
              <div className="text-sm font-normal opacity-90">
                Import 1000+ templates from Pexels, Pixabay & Unsplash
              </div>
            </button>
            
            <button
              onClick={quickMultiPlatformImport}
              disabled={importing}
              className="p-6 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-xl font-bold text-lg shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex flex-col items-center gap-3"
            >
              <div className="text-3xl">⚡</div>
              <div>Quick Multi-Platform Test</div>
              <div className="text-sm font-normal opacity-90">
                Import ~20 templates from all sources for testing
              </div>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <button
              onClick={importFromTemplatesJson}
              disabled={importing}
              className="p-4 bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-500 hover:to-orange-500 text-white rounded-lg font-semibold shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3"
            >
              <div className="text-2xl">🎨</div>
              <div>
                <div>Legacy: Import Local Templates</div>
                <div className="text-xs opacity-80">templates_with_previews.json (mostly Unsplash)</div>
              </div>
            </button>
            
            <button
              onClick={quickTestImport}
              disabled={importing}
              className="p-4 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-500 hover:to-gray-600 text-white rounded-lg font-semibold shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3"
            >
              <div className="text-2xl">🧪</div>
              <div>
                <div>Sample Templates</div>
                <div className="text-xs opacity-80">12 test templates for development</div>
              </div>
            </button>
          </div>
          
          <div className="mt-6 p-4 bg-green-600/20 border border-green-500 rounded-lg">
            <p className="text-green-200 text-sm">
              🚀 <strong>NEW Multi-Platform Import:</strong> Automatically searches and imports from Pexels, Pixabay, and Unsplash APIs. 
              No more platform bias - get balanced content from all sources!
            </p>
          </div>
          
          <div className="mt-4 p-4 bg-blue-600/20 border border-blue-500 rounded-lg flex justify-between items-center">
            <p className="text-blue-200 text-sm">
              💡 <strong>Truly Unlimited:</strong> The green button performs 90+ searches across multiple platforms and can import 1000+ templates. 
              Perfect for populating your database with diverse, high-quality content from all sources.
            </p>
            <button
              onClick={testApiKeys}
              className="ml-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-semibold"
            >
              🔑 Test API Keys
            </button>
          </div>
        </div>

        {/* Queue Management */}
        {importQueue.length > 0 && (
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 mb-8 border border-gray-700">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              📋 Import Queue Management
            </h2>
            
            <div className="space-y-4">
              {importQueue.map((queue) => (
                <div key={queue.id} className="bg-gray-700 rounded-lg p-4 border border-gray-600">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="text-lg font-semibold text-white">Queue {queue.id.slice(-8)}</h3>
                      <p className="text-gray-300">
                        Progress: {queue.processed}/{queue.total} templates
                      </p>
                      <p className="text-gray-400 text-sm">
                        Created: {new Date(queue.createdAt).toLocaleString()}
                      </p>
                    </div>
                    
                    <div className="flex gap-2">
                      {queue.status === 'paused' && (
                        <button
                          onClick={() => resumeImport(queue.id)}
                          disabled={importing}
                          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50"
                        >
                          ▶️ Resume
                        </button>
                      )}
                      
                      {queue.status === 'pending' && (
                        <button
                          onClick={() => importTemplatesWithQueue(queue)}
                          disabled={importing}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
                        >
                          🚀 Start
                        </button>
                      )}
                      
                      <button
                        onClick={() => deleteQueue(queue.id)}
                        disabled={importing && currentQueueId === queue.id}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50"
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className={`px-3 py-1 rounded-full text-sm ${
                      queue.status === 'completed' ? 'bg-green-600 text-white' :
                      queue.status === 'processing' ? 'bg-yellow-600 text-white' :
                      queue.status === 'paused' ? 'bg-orange-600 text-white' :
                      queue.status === 'failed' ? 'bg-red-600 text-white' :
                      'bg-gray-600 text-white'
                    }`}>
                      {queue.status}
                    </span>
                    
                    <div className="w-1/2 bg-gray-600 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all"
                        style={{ width: `${(queue.processed / queue.total) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Admin Actions */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 mb-8 border border-gray-700">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            🔧 Admin Actions
          </h2>
          
          <div className="flex gap-4">
            <button
              onClick={clearAllTemplates}
              disabled={importing}
              className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              🗑️ Clear All Templates
            </button>
          </div>
        </div>

        {/* Messages */}
        {message && (
          <div className="bg-blue-600/20 border border-blue-500 rounded-lg p-4 mb-6">
            <p className="text-blue-200">{message}</p>
          </div>
        )}

        {error && (
          <div className="bg-red-600/20 border border-red-500 rounded-lg p-4 mb-6">
            <p className="text-red-200">{error}</p>
          </div>
        )}

        {/* Usage Instructions */}
        <div className="bg-gray-800/30 backdrop-blur-sm rounded-2xl p-8 border border-gray-700">
          <h2 className="text-2xl font-bold text-white mb-6">📚 Enterprise Features Guide</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-gray-300">
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">🚀 Smart Batching</h3>
              <ul className="space-y-2">
                <li>• Automatically handles large imports</li>
                <li>• Adjustable batch sizes (50 → 5000+)</li>
                <li>• Prevents API overload</li>
                <li>• Enterprise scaling ready</li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">💾 Auto-Save & Resume</h3>
              <ul className="space-y-2">
                <li>• Saves progress automatically</li>
                <li>• Resume from where you left off</li>
                <li>• Never lose import progress</li>
                <li>• Perfect for large datasets</li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">🔍 Smart Duplicate Detection</h3>
              <ul className="space-y-2">
                <li>• Prevents database bloat</li>
                <li>• Title + Category matching</li>
                <li>• Shows duplicate statistics</li>
                <li>• Imports only new templates</li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">📊 Queue Management</h3>
              <ul className="space-y-2">
                <li>• Multiple import queues</li>
                <li>• Pause/resume capability</li>
                <li>• Progress tracking</li>
                <li>• Batch statistics</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TemplateImporter;
