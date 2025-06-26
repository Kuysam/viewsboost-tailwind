import { db } from '../firebase';
import {
  collection,
  doc,
  updateDoc,
  getDocs,
  writeBatch,
  serverTimestamp,
  query,
  where,
  orderBy,
  getDoc,
  deleteDoc,
  addDoc
} from 'firebase/firestore';

export interface Template {
  id: string;
  title: string;
  category: string;
  desc: string;
  icon: string;
  preview: string;
  videoSource?: string;
  platform?: string;
  quality?: string;
  tags?: string[];
  useVideoPreview?: boolean;
  processedDate?: string;
  originalFilename?: string;
  generatedBy?: string;
  lastModified?: any;
  modifiedBy?: string;
  [key: string]: any;
}

export interface CategoryUpdateResult {
  success: boolean;
  templateId: string;
  oldCategory: string;
  newCategory: string;
  timestamp: string;
  error?: string;
  source?: string;
}

export class TemplateService {
  /**
   * Update a template's category with optimistic updates
   */
  static async updateTemplateCategory(
    templateId: string,
    newCategory: string,
    adminUser: string = 'admin'
  ): Promise<CategoryUpdateResult> {
    try {
      const templateRef = doc(db, 'templates', templateId);
      
      // Get current template data to track old category
      const templateSnap = await getDoc(templateRef);
      if (!templateSnap.exists()) {
        throw new Error('Template not found');
      }
      
      const currentData = templateSnap.data();
      const oldCategory = currentData.category;
      
      // Update the template with new category
      await updateDoc(templateRef, {
        category: newCategory,
        lastModified: serverTimestamp(),
        modifiedBy: adminUser,
        categoryChangedAt: serverTimestamp(),
        previousCategory: oldCategory
      });

      return {
        success: true,
        templateId,
        oldCategory,
        newCategory,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error updating template category:', error);
      return {
        success: false,
        templateId,
        oldCategory: '',
        newCategory,
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Create a new template in Firestore
   */
  static async createTemplate(
    templateData: Omit<Template, 'id'>,
    adminUser: string = 'admin'
  ): Promise<CategoryUpdateResult> {
    try {
      const templatesRef = collection(db, 'templates');
      
      // Prepare template data for Firestore
      const firestoreData = {
        ...templateData,
        lastModified: serverTimestamp(),
        modifiedBy: adminUser,
        createdAt: serverTimestamp(),
        createdBy: adminUser
      };

      // Clean up undefined values that Firebase doesn't accept
      Object.keys(firestoreData).forEach(key => {
        if (firestoreData[key] === undefined) {
          delete firestoreData[key];
          console.warn(`⚠️ [TemplateService] Removed undefined field '${key}' before Firestore creation`);
        }
      });

      // Validate required fields
      if (!firestoreData.title || !firestoreData.category) {
        throw new Error('Missing required fields: title and category are required');
      }

      console.log(`📤 [TemplateService] Creating template with fields:`, Object.keys(firestoreData));

      // Create new document
      const docRef = await addDoc(templatesRef, firestoreData);

      return {
        success: true,
        templateId: docRef.id,
        oldCategory: '',
        newCategory: templateData.category,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error creating template:', error);
      return {
        success: false,
        templateId: '',
        oldCategory: '',
        newCategory: templateData.category || '',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Bulk update multiple templates' categories
   */
  static async bulkUpdateCategories(
    updates: Array<{ templateId: string; newCategory: string }>,
    adminUser: string = 'admin'
  ): Promise<CategoryUpdateResult[]> {
    const results: CategoryUpdateResult[] = [];
    const batch = writeBatch(db);
    let batchCount = 0;

    for (const update of updates) {
      try {
        const templateRef = doc(db, 'templates', update.templateId);
        
        // Get current data to track old category
        const templateSnap = await getDoc(templateRef);
        if (!templateSnap.exists()) {
          results.push({
            success: false,
            templateId: update.templateId,
            oldCategory: '',
            newCategory: update.newCategory,
            timestamp: new Date().toISOString(),
            error: 'Template not found'
          });
          continue;
        }
        
        const currentData = templateSnap.data();
        const oldCategory = currentData.category;
        
        batch.update(templateRef, {
          category: update.newCategory,
          lastModified: serverTimestamp(),
          modifiedBy: adminUser,
          categoryChangedAt: serverTimestamp(),
          previousCategory: oldCategory
        });

        results.push({
          success: true,
          templateId: update.templateId,
          oldCategory,
          newCategory: update.newCategory,
          timestamp: new Date().toISOString()
        });

        batchCount++;

        // Firestore batch limit is 500 operations
        if (batchCount >= 450) {
          await batch.commit();
          batchCount = 0;
        }
      } catch (error) {
        results.push({
          success: false,
          templateId: update.templateId,
          oldCategory: '',
          newCategory: update.newCategory,
          timestamp: new Date().toISOString(),
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    // Commit remaining updates
    if (batchCount > 0) {
      await batch.commit();
    }

    return results;
  }

  /**
   * Get all unique categories from templates
   */
  static async getAllCategories(): Promise<string[]> {
    try {
      const templatesRef = collection(db, 'templates');
      const snapshot = await getDocs(templatesRef);
      
      const categories = new Set<string>();
      snapshot.docs.forEach(doc => {
        const category = doc.data().category;
        if (category && typeof category === 'string' && category.trim()) {
          categories.add(category.trim());
        }
      });
      
      return Array.from(categories).sort();
    } catch (error) {
      console.error('Error fetching categories:', error);
      return [];
    }
  }

  /**
   * Delete a template from Firestore
   */
  static async deleteTemplate(templateId: string): Promise<void> {
    try {
      const templateRef = doc(db, 'templates', templateId);
      
      // Check if template exists before deletion
      const templateSnap = await getDoc(templateRef);
      if (!templateSnap.exists()) {
        throw new Error('Template not found');
      }
      
      await deleteDoc(templateRef);
      console.log(`✅ [TemplateService] Successfully deleted template: ${templateId}`);
    } catch (error) {
      console.error('❌ [TemplateService] Error deleting template:', error);
      throw error;
    }
  }

  /**
   * Get templates by category
   */
  static async getTemplatesByCategory(category: string): Promise<Template[]> {
    try {
      const templatesRef = collection(db, 'templates');
      const q = query(
        templatesRef,
        where('category', '==', category),
        orderBy('lastModified', 'desc')
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Template[];
    } catch (error) {
      console.error('Error fetching templates by category:', error);
      return [];
    }
  }

  /**
   * Get category statistics
   */
  static async getCategoryStats(): Promise<Record<string, number>> {
    try {
      const templatesRef = collection(db, 'templates');
      const snapshot = await getDocs(templatesRef);
      
      const stats: Record<string, number> = {};
      snapshot.docs.forEach(doc => {
        const category = doc.data().category || 'Uncategorized';
        stats[category] = (stats[category] || 0) + 1;
      });
      
      return stats;
    } catch (error) {
      console.error('Error fetching category stats:', error);
      return {};
    }
  }

  /**
   * Search templates across all categories
   */
  static async searchTemplates(searchTerm: string): Promise<Template[]> {
    try {
      const templatesRef = collection(db, 'templates');
      const snapshot = await getDocs(templatesRef);
      
      const searchLower = searchTerm.toLowerCase();
      const matchingTemplates = snapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        .filter(template => 
          template.title?.toLowerCase().includes(searchLower) ||
          template.category?.toLowerCase().includes(searchLower) ||
          template.desc?.toLowerCase().includes(searchLower) ||
          template.tags?.some((tag: string) => tag.toLowerCase().includes(searchLower))
        ) as Template[];
      
      return matchingTemplates;
    } catch (error) {
      console.error('Error searching templates:', error);
      return [];
    }
  }
}

export default TemplateService; 