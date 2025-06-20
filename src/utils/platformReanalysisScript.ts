// Platform Re-analysis Script for Fixing Historical Data
// Run this to update existing templates with improved platform detection

import { getDocs, updateDoc, doc, collection } from 'firebase/firestore';
import { db } from '../lib/firebase';

// Same enhanced platform detection logic as in TemplateImporter
const detectTemplatePlatform = (template: any): string => {
  // PRIORITY 1: Check explicit platform field FIRST (most reliable)
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

export const reanalyzePlatformData = async (): Promise<{
  totalProcessed: number;
  updated: number;
  unchanged: number;
  platformDistribution: Record<string, number>;
  errors: string[];
}> => {
  console.log('🔍 Starting platform re-analysis of existing templates...');
  
  const results = {
    totalProcessed: 0,
    updated: 0,
    unchanged: 0,
    platformDistribution: {} as Record<string, number>,
    errors: [] as string[]
  };

  try {
    // Get all templates from Firestore
    const templatesSnapshot = await getDocs(collection(db, 'templates'));
    results.totalProcessed = templatesSnapshot.size;
    
    console.log(`📊 Found ${results.totalProcessed} templates to analyze`);
    
    const updatePromises: Promise<void>[] = [];
    
    templatesSnapshot.forEach((docSnapshot) => {
      const template = docSnapshot.data();
      const docId = docSnapshot.id;
      
      // Re-detect platform using improved algorithm
      const newPlatform = detectTemplatePlatform(template);
      const oldPlatform = template.detectedPlatform || template.source || 'Unknown';
      
      // Track platform distribution
      results.platformDistribution[newPlatform] = (results.platformDistribution[newPlatform] || 0) + 1;
      
      // Update if platform changed
      if (newPlatform !== oldPlatform) {
        results.updated++;
        
        const updatePromise = updateDoc(doc(db, 'templates', docId), {
          detectedPlatform: newPlatform,
          platformReanalyzedAt: new Date().toISOString(),
          previousPlatform: oldPlatform
        }).catch((error) => {
          results.errors.push(`Failed to update ${docId}: ${error.message}`);
        });
        
        updatePromises.push(updatePromise);
      } else {
        results.unchanged++;
      }
    });
    
    // Wait for all updates to complete
    await Promise.all(updatePromises);
    
    console.log('✅ Platform re-analysis complete!');
    console.log(`📈 Results: ${results.updated} updated, ${results.unchanged} unchanged`);
    console.log('🏷️ New platform distribution:', results.platformDistribution);
    
    if (results.errors.length > 0) {
      console.error('❌ Errors encountered:', results.errors);
    }
    
    return results;
    
  } catch (error) {
    console.error('💥 Fatal error during re-analysis:', error);
    results.errors.push(`Fatal error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return results;
  }
};

// Analyze bias in current data (read-only)
export const analyzePlatformBias = async (): Promise<{
  totalTemplates: number;
  platformDistribution: Record<string, number>;
  biasWarning: boolean;
  dominantPlatform: string | null;
  biasPercentage: number;
}> => {
  console.log('📊 Analyzing platform bias in current database...');
  
  try {
    const templatesSnapshot = await getDocs(collection(db, 'templates'));
    const platformCounts: Record<string, number> = {};
    let totalTemplates = 0;
    
    templatesSnapshot.forEach((docSnapshot) => {
      const template = docSnapshot.data();
      const platform = detectTemplatePlatform(template);
      platformCounts[platform] = (platformCounts[platform] || 0) + 1;
      totalTemplates++;
    });
    
    // Find dominant platform
    let dominantPlatform: string | null = null;
    let maxCount = 0;
    let biasPercentage = 0;
    
    Object.entries(platformCounts).forEach(([platform, count]) => {
      if (count > maxCount) {
        maxCount = count;
        dominantPlatform = platform;
        biasPercentage = (count / totalTemplates) * 100;
      }
    });
    
    const biasWarning = biasPercentage > 80 && totalTemplates > 10;
    
    return {
      totalTemplates,
      platformDistribution: platformCounts,
      biasWarning,
      dominantPlatform: biasWarning ? dominantPlatform : null,
      biasPercentage
    };
    
  } catch (error) {
    console.error('💥 Error analyzing platform bias:', error);
    return {
      totalTemplates: 0,
      platformDistribution: {},
      biasWarning: false,
      dominantPlatform: null,
      biasPercentage: 0
    };
  }
};

// Usage examples:
// 
// // Analyze current bias (read-only)
// const biasAnalysis = await analyzePlatformBias();
// console.log(`Bias detected: ${biasAnalysis.biasWarning}`, biasAnalysis);
//
// // Re-analyze and update all templates
// const reanalysisResults = await reanalyzePlatformData();
// console.log('Re-analysis complete:', reanalysisResults); 