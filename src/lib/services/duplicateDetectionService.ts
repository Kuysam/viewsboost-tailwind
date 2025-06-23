// Enhanced Duplicate Detection Service for ViewsBoost Templates
// Provides intelligent duplicate detection using multiple strategies

import { db } from '../firebase';
import { collection, getDocs, doc, updateDoc, deleteDoc, writeBatch } from 'firebase/firestore';

interface Template {
  id?: string;
  title: string;
  category: string;
  preview?: string;
  description?: string;
  platform?: string;
  source?: string;
  usageScore?: number;
  createdAt?: any;
  [key: string]: any;
}

interface DuplicateDetectionResult {
  duplicates: Template[][];
  potentialDuplicates: Template[][];
  totalDuplicates: number;
  safeToDuplicate: Template[];
  stats: {
    totalTemplates: number;
    duplicateGroups: number;
    templatesMarkedForCleanup: number;
    spaceFreed: number;
  };
}

interface DuplicateCleanupOptions {
  preserveHighestUsage: boolean;
  preserveNewest: boolean;
  createBackup: boolean;
  batchSize: number;
}

class DuplicateDetectionService {
  private readonly SIMILARITY_THRESHOLD = 0.85;
  private readonly EXACT_MATCH_THRESHOLD = 0.95;

  // Generate signature for duplicate detection
  private generateTemplateSignature(template: Template): string {
    const normalizedTitle = template.title?.toLowerCase().trim() || '';
    const normalizedCategory = template.category?.toLowerCase().trim() || '';
    const previewUrl = template.preview || '';
    
    // Extract domain from preview URL for platform consistency
    const domain = previewUrl.match(/https?:\/\/([^\/]+)/)?.[1] || '';
    
    return `${normalizedTitle}::${normalizedCategory}::${domain}`;
  }

  // Calculate similarity between two templates
  private calculateSimilarity(template1: Template, template2: Template): number {
    const sig1 = this.generateTemplateSignature(template1);
    const sig2 = this.generateTemplateSignature(template2);
    
    if (sig1 === sig2) return 1.0; // Exact match
    
    // Check title similarity
    const title1 = template1.title?.toLowerCase() || '';
    const title2 = template2.title?.toLowerCase() || '';
    const titleSimilarity = this.stringSimilarity(title1, title2);
    
    // Check category match
    const categoryMatch = template1.category?.toLowerCase() === template2.category?.toLowerCase() ? 1 : 0;
    
    // Check preview URL similarity (same domain)
    const domain1 = template1.preview?.match(/https?:\/\/([^\/]+)/)?.[1] || '';
    const domain2 = template2.preview?.match(/https?:\/\/([^\/]+)/)?.[1] || '';
    const domainMatch = domain1 && domain2 && domain1 === domain2 ? 1 : 0;
    
    // Weighted similarity score
    return (titleSimilarity * 0.6) + (categoryMatch * 0.3) + (domainMatch * 0.1);
  }

  // String similarity using Jaccard index
  private stringSimilarity(str1: string, str2: string): number {
    if (str1 === str2) return 1;
    if (!str1 || !str2) return 0;
    
    const set1 = new Set(str1.split(/\s+/));
    const set2 = new Set(str2.split(/\s+/));
    
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    
    return intersection.size / union.size;
  }

  // Detect duplicates in template collection
  async detectDuplicates(): Promise<DuplicateDetectionResult> {
    try {
      console.log('🔍 Starting duplicate detection...');
      
      const templatesSnap = await getDocs(collection(db, 'templates'));
      const templates: Template[] = templatesSnap.docs.map(doc => ({
        id: doc.id,
        title: doc.data().title || '',
        category: doc.data().category || '',
        ...doc.data()
      } as Template));

      console.log(`📊 Analyzing ${templates.length} templates for duplicates...`);

      const duplicateGroups: Template[][] = [];
      const potentialDuplicates: Template[][] = [];
      const processed = new Set<string>();

      for (let i = 0; i < templates.length; i++) {
        const template1 = templates[i];
        if (processed.has(template1.id!)) continue;

        const exactMatches: Template[] = [template1];
        const similarMatches: Template[] = [];

        for (let j = i + 1; j < templates.length; j++) {
          const template2 = templates[j];
          if (processed.has(template2.id!)) continue;

          const similarity = this.calculateSimilarity(template1, template2);

          if (similarity >= this.EXACT_MATCH_THRESHOLD) {
            exactMatches.push(template2);
            processed.add(template2.id!);
          } else if (similarity >= this.SIMILARITY_THRESHOLD) {
            similarMatches.push(template2);
          }
        }

        if (exactMatches.length > 1) {
          duplicateGroups.push(exactMatches);
          exactMatches.forEach(t => processed.add(t.id!));
        }

        if (similarMatches.length > 0) {
          potentialDuplicates.push([template1, ...similarMatches]);
        }
      }

      const totalDuplicates = duplicateGroups.reduce((sum, group) => sum + group.length - 1, 0);
      
      console.log(`✅ Detection complete: ${duplicateGroups.length} duplicate groups, ${totalDuplicates} duplicates found`);

      return {
        duplicates: duplicateGroups,
        potentialDuplicates,
        totalDuplicates,
        safeToDuplicate: duplicateGroups.flat(),
        stats: {
          totalTemplates: templates.length,
          duplicateGroups: duplicateGroups.length,
          templatesMarkedForCleanup: totalDuplicates,
          spaceFreed: totalDuplicates * 0.1 // Estimate space saved in MB
        }
      };
    } catch (error) {
      console.error('❌ Error detecting duplicates:', error);
      throw error;
    }
  }

  // Create backup before cleanup
  async createBackup(templates: Template[]): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupName = `templates-backup-${timestamp}.json`;
    
    const backup = {
      created: new Date().toISOString(),
      templateCount: templates.length,
      templates: templates
    };

    // Store in localStorage for browser-based backup
    const backupData = JSON.stringify(backup, null, 2);
    localStorage.setItem(`backup_${timestamp}`, backupData);
    
    // Create downloadable file
    const blob = new Blob([backupData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = backupName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    console.log(`✅ Backup created: ${backupName}`);
    return backupName;
  }

  // Smart cleanup preserving valuable templates
  async cleanupDuplicates(
    duplicateGroups: Template[][],
    options: DuplicateCleanupOptions = {
      preserveHighestUsage: true,
      preserveNewest: true,
      createBackup: true,
      batchSize: 50
    }
  ): Promise<{
    cleaned: number;
    preserved: number;
    backupFile?: string;
    errors: string[];
  }> {
    try {
      console.log('🧹 Starting duplicate cleanup...');
      
      let backupFile: string | undefined;
      
      // Create backup if requested
      if (options.createBackup) {
        const allTemplates = duplicateGroups.flat();
        backupFile = await this.createBackup(allTemplates);
      }

      const toDelete: string[] = [];
      const errors: string[] = [];

      // Process each duplicate group
      for (const group of duplicateGroups) {
        if (group.length <= 1) continue;

        // Sort to determine which template to preserve
        const sorted = [...group].sort((a, b) => {
          // Prefer higher usage score
          if (options.preserveHighestUsage) {
            const usageA = a.usageScore || 0;
            const usageB = b.usageScore || 0;
            if (usageA !== usageB) return usageB - usageA;
          }

          // Prefer newer templates
          if (options.preserveNewest) {
            const dateA = a.createdAt?.toDate?.() || new Date(0);
            const dateB = b.createdAt?.toDate?.() || new Date(0);
            return dateB.getTime() - dateA.getTime();
          }

          return 0;
        });

        // Preserve the first (best) template, mark others for deletion
        const [preserve, ...deleteList] = sorted;
        toDelete.push(...deleteList.map(t => t.id!).filter(Boolean));
        
        console.log(`📌 Preserving: "${preserve.title}" (usage: ${preserve.usageScore || 0})`);
        console.log(`🗑️  Deleting ${deleteList.length} duplicates`);
      }

      // Batch delete operations
      let cleaned = 0;
      const batch = writeBatch(db);
      
      for (let i = 0; i < toDelete.length; i++) {
        if (i > 0 && i % options.batchSize === 0) {
          // Commit current batch
          await batch.commit();
          console.log(`✅ Batch ${Math.floor(i / options.batchSize)} committed`);
        }

        try {
          const docRef = doc(db, 'templates', toDelete[i]);
          batch.delete(docRef);
          cleaned++;
        } catch (error) {
          errors.push(`Failed to delete template ${toDelete[i]}: ${error}`);
        }
      }

      // Commit final batch
      if (toDelete.length % options.batchSize !== 0) {
        await batch.commit();
      }

      const preserved = duplicateGroups.length;

      console.log(`✅ Cleanup complete: ${cleaned} deleted, ${preserved} preserved`);

      return {
        cleaned,
        preserved,
        backupFile,
        errors
      };
    } catch (error) {
      console.error('❌ Error during cleanup:', error);
      throw error;
    }
  }

  // Prevent duplicates during import
  async preventDuplicateDuringImport(newTemplate: Template): Promise<boolean> {
    try {
      const existingTemplates = await getDocs(collection(db, 'templates'));
      const signature = this.generateTemplateSignature(newTemplate);

      for (const doc of existingTemplates.docs) {
        const existing = {
          title: doc.data().title || '',
          category: doc.data().category || '',
          ...doc.data()
        } as Template;
        const existingSignature = this.generateTemplateSignature(existing);
        
        if (signature === existingSignature) {
          console.log(`🚫 Duplicate prevented: "${newTemplate.title}"`);
          return false; // Duplicate found
        }
      }

      return true; // No duplicate, safe to import
    } catch (error) {
      console.error('❌ Error checking for duplicates:', error);
      return true; // Allow import on error
    }
  }

  // Get cleanup statistics
  async getCleanupStats(): Promise<{
    totalTemplates: number;
    estimatedDuplicates: number;
    potentialSpaceSaved: number;
    lastCleanup?: string;
  }> {
    try {
      const detection = await this.detectDuplicates();
      
      return {
        totalTemplates: detection.stats.totalTemplates,
        estimatedDuplicates: detection.totalDuplicates,
        potentialSpaceSaved: detection.stats.spaceFreed,
        lastCleanup: localStorage.getItem('lastDuplicateCleanup') || undefined
      };
    } catch (error) {
      console.error('❌ Error getting cleanup stats:', error);
      return {
        totalTemplates: 0,
        estimatedDuplicates: 0,
        potentialSpaceSaved: 0
      };
    }
  }
}

export const duplicateDetectionService = new DuplicateDetectionService();
export type { Template, DuplicateDetectionResult, DuplicateCleanupOptions };