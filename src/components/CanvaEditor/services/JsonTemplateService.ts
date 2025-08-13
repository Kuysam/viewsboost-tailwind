import { fabric } from 'fabric';
import { embeddedTemplates, getEmbeddedTemplate } from './JsonTemplateData';

export interface JsonTemplate {
  id: string;
  name: string;
  category: string;
  jsonPath: string;
  thumbnail?: string;
  fabricData?: any;
  width: number;
  height: number;
}

export class JsonTemplateService {
  private static instance: JsonTemplateService;
  private templates: JsonTemplate[] = [];
  private fabricDataCache = new Map<string, any>();

  static getInstance(): JsonTemplateService {
    if (!JsonTemplateService.instance) {
      JsonTemplateService.instance = new JsonTemplateService();
    }
    return JsonTemplateService.instance;
  }

  constructor() {
    this.loadTemplateRegistry();
  }

  // Load all JSON templates from public folder
  private loadTemplateRegistry(): void {
    const templateFiles = [
      'ads', 'birthday', 'branding', 'business', 'commerce_promo', 'docs',
      'events_personal', 'facebook', 'fashion', 'food', 'instagram', 'linkedin',
      'print', 'sale', 'shorts_video', 'social', 'thumbnails', 'tiktok',
      'twitch', 'twitter_x', 'web_content', 'youtube'
    ];

    this.templates = templateFiles.map((fileName, index) => ({
      id: `json-template-${fileName}`,
      name: this.formatTemplateName(fileName),
      category: this.getCategoryFromFileName(fileName),
      jsonPath: `/templates/json/${fileName}.json`,
      width: 1152,
      height: 768,
    }));

    console.log(`[JsonTemplateService] Loaded ${this.templates.length} JSON templates`);
  }

  // Format filename to readable name
  private formatTemplateName(fileName: string): string {
    return fileName
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (l) => l.toUpperCase());
  }

  // Map filename to category
  private getCategoryFromFileName(fileName: string): string {
    const categoryMap: Record<string, string> = {
      'ads': 'Marketing/Promotional',
      'birthday': 'Events/Personal',
      'branding': 'Marketing/Promotional',
      'business': 'Business',
      'commerce_promo': 'Marketing/Promotional',
      'docs': 'Documents',
      'events_personal': 'Events/Personal',
      'facebook': 'Social Media Posts',
      'fashion': 'Fashion',
      'food': 'Food',
      'instagram': 'Social Media Posts',
      'linkedin': 'Social Media Posts',
      'print': 'Print',
      'sale': 'Marketing/Promotional',
      'shorts_video': 'Shorts',
      'social': 'Social Media Posts',
      'thumbnails': 'Thumbnails',
      'tiktok': 'Social Media Posts',
      'twitch': 'Social Media Posts',
      'twitter_x': 'Social Media Posts',
      'web_content': 'Web/Content',
      'youtube': 'Thumbnails',
    };

    return categoryMap[fileName] || 'General';
  }

  // Get all available templates
  async getTemplates(): Promise<JsonTemplate[]> {
    console.log(`[JsonTemplateService] Returning ${this.templates.length} templates`);
    
    // Generate thumbnails if not already done
    for (const template of this.templates) {
      if (!template.thumbnail) {
        try {
          template.thumbnail = await this.generateThumbnail(template);
        } catch (error) {
          console.warn(`[JsonTemplateService] Failed to generate thumbnail for ${template.name}:`, error);
          template.thumbnail = this.generatePlaceholderThumbnail(template);
        }
      }
    }

    return this.templates;
  }

  // Get templates by category
  async getTemplatesByCategory(category: string): Promise<JsonTemplate[]> {
    const allTemplates = await this.getTemplates();
    return allTemplates.filter(template => 
      template.category.toLowerCase() === category.toLowerCase()
    );
  }

  // Load fabric.js data for a template
  async loadFabricData(template: JsonTemplate): Promise<any> {
    // Check cache first
    if (this.fabricDataCache.has(template.id)) {
      return this.fabricDataCache.get(template.id);
    }

    // First try embedded data
    const templateKey = this.getTemplateKey(template.id);
    if (templateKey) {
      const embeddedData = getEmbeddedTemplate(templateKey);
      if (embeddedData) {
        console.log(`[JsonTemplateService] Using embedded data for ${template.name}`);
        this.fabricDataCache.set(template.id, embeddedData);
        return embeddedData;
      }
    }

    // Fallback to HTTP request
    try {
      const response = await fetch(template.jsonPath);
      if (!response.ok) {
        throw new Error(`Failed to load template: ${response.statusText}`);
      }

      const fabricData = await response.json();
      
      // Cache the data
      this.fabricDataCache.set(template.id, fabricData);
      
      console.log(`[JsonTemplateService] Loaded fabric data via HTTP for ${template.name}`);
      return fabricData;
    } catch (error) {
      console.error(`[JsonTemplateService] Error loading ${template.name}:`, error);
      
      // Final fallback - try to use any embedded template
      const fallbackKeys = Object.keys(embeddedTemplates);
      if (fallbackKeys.length > 0) {
        console.log(`[JsonTemplateService] Using fallback template for ${template.name}`);
        return embeddedTemplates[fallbackKeys[0]];
      }
      
      return null;
    }
  }

  // Apply template to canvas
  async applyTemplateToCanvas(canvas: fabric.Canvas, template: JsonTemplate): Promise<boolean> {
    try {
      const fabricData = await this.loadFabricData(template);
      if (!fabricData) {
        console.error('[JsonTemplateService] No fabric data available for template:', template.name);
        return false;
      }

      // Clear existing canvas
      canvas.clear();

      // Set canvas dimensions
      canvas.setWidth(fabricData.width || 1152);
      canvas.setHeight(fabricData.height || 768);

      // Load from JSON
      return new Promise((resolve) => {
        canvas.loadFromJSON(fabricData, () => {
          canvas.renderAll();
          console.log(`[JsonTemplateService] Successfully applied template: ${template.name}`);
          resolve(true);
        });
      });
    } catch (error) {
      console.error('[JsonTemplateService] Error applying template to canvas:', error);
      return false;
    }
  }

  // Generate thumbnail for template
  private async generateThumbnail(template: JsonTemplate): Promise<string> {
    // First, try to use pre-generated SVG thumbnail
    const templateKey = this.getTemplateKey(template.id);
    if (templateKey) {
      const svgThumbnail = `/templates/json/thumbnails/${templateKey}.svg`;
      // Check if the SVG exists (we'll assume it does since we generated them)
      return svgThumbnail;
    }

    // Fallback to dynamic generation if needed
    try {
      const tempCanvas = new fabric.Canvas(document.createElement('canvas'), {
        width: 300,
        height: 200,
      });

      const fabricData = await this.loadFabricData(template);
      if (!fabricData) {
        return this.generatePlaceholderThumbnail(template);
      }

      return new Promise((resolve) => {
        tempCanvas.loadFromJSON(fabricData, () => {
          const scale = Math.min(300 / fabricData.width, 200 / fabricData.height);
          tempCanvas.setZoom(scale);
          
          const thumbnailDataUrl = tempCanvas.toDataURL({
            format: 'png',
            quality: 0.8,
            multiplier: 1
          });

          tempCanvas.dispose();
          resolve(thumbnailDataUrl);
        });
      });
    } catch (error) {
      console.error('[JsonTemplateService] Error generating thumbnail:', error);
      return this.generatePlaceholderThumbnail(template);
    }
  }

  // Extract template key from ID
  private getTemplateKey(templateId: string): string | null {
    const match = templateId.match(/json-template-(.+)/);
    return match ? match[1] : null;
  }

  // Generate placeholder thumbnail
  private generatePlaceholderThumbnail(template: JsonTemplate): string {
    const canvas = document.createElement('canvas');
    canvas.width = 300;
    canvas.height = 200;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      // Background gradient based on category
      const gradient = ctx.createLinearGradient(0, 0, 300, 200);
      const categoryColors = this.getCategoryColors(template.category);
      gradient.addColorStop(0, categoryColors.start);
      gradient.addColorStop(1, categoryColors.end);
      
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 300, 200);

      // Template name
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 16px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(template.name, 150, 100);

      // Category badge
      ctx.fillStyle = 'rgba(255,255,255,0.2)';
      ctx.fillRect(10, 10, ctx.measureText(template.category).width + 20, 24);
      ctx.fillStyle = '#ffffff';
      ctx.font = '12px Inter, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(template.category, 20, 26);
    }

    return canvas.toDataURL();
  }

  // Get colors for category-based gradients
  private getCategoryColors(category: string): { start: string; end: string } {
    const colorMap: Record<string, { start: string; end: string }> = {
      'Marketing/Promotional': { start: '#ef4444', end: '#f97316' },
      'Social Media Posts': { start: '#0ea5e9', end: '#111827' },
      'Thumbnails': { start: '#111827', end: '#1f2937' },
      'Shorts': { start: '#ef4444', end: '#f97316' },
      'Business': { start: '#059669', end: '#047857' },
      'Documents': { start: '#6366f1', end: '#4f46e5' },
      'Events/Personal': { start: '#ec4899', end: '#be185d' },
      'Fashion': { start: '#8b5cf6', end: '#7c3aed' },
      'Food': { start: '#f59e0b', end: '#d97706' },
    };

    return colorMap[category] || { start: '#6b7280', end: '#4b5563' };
  }

  // Get template by ID
  async getTemplateById(id: string): Promise<JsonTemplate | null> {
    const templates = await this.getTemplates();
    return templates.find(template => template.id === id) || null;
  }

  // Search templates
  async searchTemplates(query: string): Promise<JsonTemplate[]> {
    const templates = await this.getTemplates();
    const lowerQuery = query.toLowerCase();
    
    return templates.filter(template =>
      template.name.toLowerCase().includes(lowerQuery) ||
      template.category.toLowerCase().includes(lowerQuery)
    );
  }

  // Get template statistics
  getStats(): {
    totalTemplates: number;
    categoryCounts: Record<string, number>;
    cacheSize: number;
  } {
    const categoryCounts: Record<string, number> = {};
    
    this.templates.forEach(template => {
      categoryCounts[template.category] = (categoryCounts[template.category] || 0) + 1;
    });

    return {
      totalTemplates: this.templates.length,
      categoryCounts,
      cacheSize: this.fabricDataCache.size
    };
  }

  // Clear cache
  clearCache(): void {
    this.fabricDataCache.clear();
    console.log('[JsonTemplateService] Cache cleared');
  }
}

// Export singleton instance
export const jsonTemplateService = JsonTemplateService.getInstance();