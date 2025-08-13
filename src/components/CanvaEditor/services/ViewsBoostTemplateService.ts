import { TemplateMeta, Layer, Page } from '../CanvaEditor';
import { getTemplates, getCategories, getTemplateById, TemplateManifestItem } from '../../../lib/templates/registry';
import { addMediaLayer } from '../../../utils/canvasMedia';
import { jsonTemplateService, JsonTemplate } from './JsonTemplateService';

// Enhanced template service that integrates with ViewsBoost's existing template system
export class ViewsBoostTemplateService {
  private templates: TemplateMeta[] = [];
  private categories: string[] = [];
  private lastFetch = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.loadTemplates();
  }

  // Load templates from ViewsBoost registry (local + Firebase)
  private async loadTemplates(): Promise<void> {
    try {
      const now = Date.now();
      if (now - this.lastFetch < this.CACHE_DURATION && this.templates.length > 0) {
        return; // Use cached data
      }

      console.log('[ViewsBoostTemplateService] Loading JSON templates only...');
      
      // Get JSON templates from the new library
      const jsonTemplates = await jsonTemplateService.getTemplates();
      console.log(`[ViewsBoostTemplateService] Found ${jsonTemplates.length} JSON templates`);

      // Convert JSON templates to Canva editor format
      const convertedJsonTemplates = await Promise.all(
        jsonTemplates.map(template => this.convertJsonTemplate(template))
      );

      // Use only JSON templates for now (cleaner, no registry conflicts)
      this.templates = convertedJsonTemplates.filter(Boolean) as TemplateMeta[];
      
      // Get JSON template categories
      const jsonCategories = [...new Set(jsonTemplates.map(t => t.category))];
      this.categories = jsonCategories;
      
      this.lastFetch = now;

      console.log(`[ViewsBoostTemplateService] Successfully loaded ${this.templates.length} JSON templates across ${this.categories.length} categories`);
    } catch (error) {
      console.error('[ViewsBoostTemplateService] Failed to load templates:', error);
      // Fallback to local mock templates
      this.loadMockTemplates();
    }
  }

  // Convert ViewsBoost registry template to Canva editor format
  private async convertRegistryTemplate(registryTemplate: TemplateManifestItem): Promise<TemplateMeta | null> {
    try {
      // Load template JSON if available
      let templateData: any = null;
      if (registryTemplate.templatePath) {
        try {
          const response = await fetch(registryTemplate.templatePath);
          if (response.ok) {
            templateData = await response.json();
          }
        } catch (error) {
          console.warn(`[ViewsBoostTemplateService] Failed to load template data for ${registryTemplate.id}:`, error);
        }
      }

      // Generate layer signature for deduplication
      let layerSignatureHash = '';
      let layers: Layer[] = [];

      if (templateData) {
        // Handle different template formats
        if (templateData.studioEditor?.layers) {
          // Studio editor format
          layers = this.convertStudioLayers(templateData.studioEditor.layers);
        } else if (templateData.layers) {
          // Custom layers format
          layers = this.convertCustomLayers(templateData.layers);
        } else if (templateData.objects) {
          // Fabric.js format
          layers = this.convertFabricObjects(templateData.objects);
        }

        layerSignatureHash = this.generateLayerSignatureHash(layers);
      }

      // Parse dimensions
      let dimensions = { width: 1920, height: 1080 };
      if (registryTemplate.size) {
        const match = registryTemplate.size.match(/^(\d+)x(\d+)$/i);
        if (match) {
          dimensions = { width: parseInt(match[1]), height: parseInt(match[2]) };
        }
      }
      if (templateData?.width && templateData?.height) {
        dimensions = { width: templateData.width, height: templateData.height };
      }

      const template: TemplateMeta = {
        id: registryTemplate.id,
        title: registryTemplate.name,
        category: registryTemplate.category.toLowerCase(),
        author: 'ViewsBoost',
        thumbnail: registryTemplate.previewPath,
        phash: this.generatePerceptualHash(registryTemplate.previewPath),
        layerSignatureHash,
        source: 'local',
        payload: {
          pages: [{
            id: 'page-1',
            name: 'Page 1',
            durationMs: 5000,
            layers: layers.map(l => l.id),
            dimensions
          }],
          layers: layers.reduce((acc, layer) => {
            acc[layer.id] = layer;
            return acc;
          }, {} as Record<string, Layer>),
          originalData: templateData // Keep original for ViewsBoostCanvaEditor compatibility
        }
      };

      return template;
    } catch (error) {
      console.error(`[ViewsBoostTemplateService] Error converting template ${registryTemplate.id}:`, error);
      return null;
    }
  }

  // Convert JSON template to Canva editor format
  private async convertJsonTemplate(jsonTemplate: JsonTemplate): Promise<TemplateMeta | null> {
    try {
      console.log(`[ViewsBoostTemplateService] Converting JSON template: ${jsonTemplate.name}`);

      // Load fabric data from JSON template service
      const fabricData = await jsonTemplateService.loadFabricData(jsonTemplate);
      if (!fabricData) {
        console.warn(`[ViewsBoostTemplateService] No fabric data for ${jsonTemplate.name}`);
        return null;
      }

      // Convert fabric.js objects to our layer format
      const layers = this.convertFabricObjects(fabricData.objects || []);
      const layerSignatureHash = this.generateLayerSignatureHash(layers);

      const template: TemplateMeta = {
        id: jsonTemplate.id,
        title: jsonTemplate.name,
        thumbnail: jsonTemplate.thumbnail || await this.generateJsonTemplateThumbnail(jsonTemplate),
        category: jsonTemplate.category,
        source: 'local' as const,
        payload: {
          originalData: {
            type: 'fabric-json',
            data: fabricData,
            source: 'json-library'
          }
        },
        tags: [jsonTemplate.category.toLowerCase().replace(/[^a-z0-9]/g, '')],
        dimensions: {
          width: fabricData.width || jsonTemplate.width,
          height: fabricData.height || jsonTemplate.height
        },
        pages: [{
          id: `${jsonTemplate.id}-page-1`,
          layers: layers,
          background: this.extractBackgroundFromFabric(fabricData.objects)
        }],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        layerSignatureHash
      };

      console.log(`[ViewsBoostTemplateService] Successfully converted JSON template: ${jsonTemplate.name}`);
      return template;
    } catch (error) {
      console.error(`[ViewsBoostTemplateService] Error converting JSON template ${jsonTemplate.id}:`, error);
      return null;
    }
  }

  // Generate thumbnail for JSON template if not available
  private async generateJsonTemplateThumbnail(jsonTemplate: JsonTemplate): Promise<string> {
    // Use JsonTemplateService's thumbnail generation
    return jsonTemplate.thumbnail || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDMwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjMzc0MTUxIi8+Cjx0ZXh0IHg9IjE1MCIgeT0iMTAwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSJ3aGl0ZSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE2Ij5UZW1wbGF0ZTwvdGV4dD4KPC9zdmc+';
  }

  // Extract background from fabric objects
  private extractBackgroundFromFabric(objects: any[]): { type: 'solid' | 'gradient' | 'image'; value: string } {
    // Find the first background object
    const backgroundObj = objects.find(obj => 
      obj.name?.toLowerCase().includes('background') || 
      (obj.left === 0 && obj.top === 0 && obj.selectable === false)
    );

    if (backgroundObj?.fill) {
      if (typeof backgroundObj.fill === 'string') {
        return { type: 'solid', value: backgroundObj.fill };
      } else if (backgroundObj.fill.type === 'linear') {
        // Convert fabric gradient to CSS gradient
        const colorStops = backgroundObj.fill.colorStops || [];
        const gradientColors = colorStops.map((stop: any) => `${stop.color} ${(stop.offset * 100).toFixed(1)}%`).join(', ');
        return { type: 'gradient', value: `linear-gradient(135deg, ${gradientColors})` };
      }
    }

    return { type: 'solid', value: '#ffffff' };
  }

  // Convert studio editor layers to Canva editor format
  private convertStudioLayers(studioLayers: any[]): Layer[] {
    return studioLayers.map((layer, index) => {
      const id = `layer-${Date.now()}-${index}`;
      
      switch (layer.type) {
        case 'text':
          return {
            id,
            type: 'text',
            name: `Text: ${layer.content?.substring(0, 20) || 'Text'}`,
            props: {
              text: layer.content || 'Sample Text',
              left: layer.position?.x || 100,
              top: layer.position?.y || 100,
              fontSize: layer.style?.fontSize || 24,
              fontFamily: layer.style?.fontFamily || 'Arial',
              fill: layer.style?.color || '#000000',
              textAlign: layer.style?.textAlign || 'left'
            }
          };

        case 'image':
          return {
            id,
            type: 'image',
            name: `Image: ${layer.url?.split('/').pop() || 'Image'}`,
            props: {
              src: layer.url || layer.asset,
              left: layer.position?.x || 0,
              top: layer.position?.y || 0,
              width: layer.style?.width || layer.w,
              height: layer.style?.height || layer.h
            }
          };

        case 'video':
          return {
            id,
            type: 'image', // Treat as image layer for now
            name: `Video: ${layer.url?.split('/').pop() || 'Video'}`,
            props: {
              src: layer.url,
              left: layer.position?.x || 0,
              top: layer.position?.y || 0,
              width: layer.w,
              height: layer.h,
              isVideo: true,
              autoplay: layer.autoplay,
              loop: layer.loop,
              muted: layer.muted
            }
          };

        case 'shape':
          return {
            id,
            type: 'shape',
            name: `Shape: ${layer.element || 'Shape'}`,
            props: {
              shapeType: layer.element || 'rectangle',
              left: layer.position?.x || 100,
              top: layer.position?.y || 100,
              width: layer.style?.width || 100,
              height: layer.style?.height || 100,
              fill: layer.style?.fill || '#000000',
              opacity: layer.style?.opacity || 1
            }
          };

        default:
          return {
            id,
            type: 'shape',
            name: `Unknown: ${layer.type}`,
            props: {
              left: layer.position?.x || 0,
              top: layer.position?.y || 0,
              width: 100,
              height: 100,
              fill: '#cccccc'
            }
          };
      }
    });
  }

  // Convert custom layers format
  private convertCustomLayers(customLayers: any[]): Layer[] {
    return customLayers.map((layer, index) => {
      const id = `layer-${Date.now()}-${index}`;
      
      return {
        id,
        type: this.inferLayerType(layer),
        name: layer.name || `Layer ${index + 1}`,
        props: {
          left: layer.x || 0,
          top: layer.y || 0,
          width: layer.w || layer.width || 100,
          height: layer.h || layer.height || 100,
          ...layer
        }
      };
    });
  }

  // Convert Fabric.js objects
  private convertFabricObjects(fabricObjects: any[]): Layer[] {
    return fabricObjects.map((obj, index) => {
      const id = `layer-${Date.now()}-${index}`;
      
      let type: 'text' | 'shape' | 'image' = 'shape';
      let name = `Object ${index + 1}`;
      
      switch (obj.type) {
        case 'textbox':
        case 'text':
        case 'i-text':
          type = 'text';
          name = `Text: ${obj.text?.substring(0, 20) || 'Text'}`;
          break;
        case 'image':
          type = 'image';
          name = `Image ${index + 1}`;
          break;
        case 'rect':
        case 'circle':
        case 'triangle':
        case 'path':
          type = 'shape';
          name = `${obj.type.charAt(0).toUpperCase() + obj.type.slice(1)}`;
          break;
      }

      return {
        id,
        type,
        name,
        props: {
          left: obj.left || 0,
          top: obj.top || 0,
          width: obj.width,
          height: obj.height,
          scaleX: obj.scaleX,
          scaleY: obj.scaleY,
          fill: obj.fill,
          stroke: obj.stroke,
          opacity: obj.opacity,
          text: obj.text,
          fontSize: obj.fontSize,
          fontFamily: obj.fontFamily,
          src: obj.src,
          ...obj
        }
      };
    });
  }

  private inferLayerType(layer: any): 'text' | 'shape' | 'image' {
    if (layer.type === 'text' || layer.text || layer.content) return 'text';
    if (layer.type === 'image' || layer.url || layer.src) return 'image';
    return 'shape';
  }

  // Generate layer signature hash for deduplication
  private generateLayerSignatureHash(layers: Layer[]): string {
    const signature = layers
      .sort((a, b) => a.id.localeCompare(b.id))
      .map(layer => `${layer.type}:${layer.props.left || 0},${layer.props.top || 0}`)
      .join('|');
    return this.simpleHash(signature);
  }

  // Generate perceptual hash (simplified)
  private generatePerceptualHash(imageUrl?: string): string {
    if (!imageUrl) return '';
    return this.simpleHash(imageUrl);
  }

  // Simple hash function
  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString(36);
  }

  // Load mock templates as fallback
  private loadMockTemplates(): void {
    this.templates = [
      {
        id: 'mock-1',
        title: 'Loading Templates...',
        category: 'loading',
        source: 'local',
        payload: { pages: [] }
      }
    ];
    this.categories = ['loading'];
  }

  // Public API methods
  async getTemplates(options?: { category?: string }): Promise<TemplateMeta[]> {
    await this.loadTemplates();
    
    if (options?.category && options.category !== 'all') {
      return this.templates.filter(t => 
        t.category.toLowerCase() === options.category!.toLowerCase()
      );
    }
    
    return this.templates;
  }

  async getCategories(): Promise<string[]> {
    await this.loadTemplates();
    return ['all', ...this.categories];
  }

  async getTemplateById(id: string): Promise<TemplateMeta | null> {
    await this.loadTemplates();
    return this.templates.find(t => t.id === id) || null;
  }

  // Insert template into Fabric.js canvas (for compatibility with existing editor)
  async insertTemplateIntoCanvas(templateId: string, canvas: any): Promise<boolean> {
    try {
      const template = await this.getTemplateById(templateId);
      if (!template?.payload.originalData) return false;

      // Use ViewsBoost's existing template loading system
      const originalData = template.payload.originalData;

      // Clear canvas
      canvas.clear();

      // Handle different formats
      if (originalData.type === 'fabric-json' && originalData.data) {
        // Handle JSON template library templates
        console.log('[ViewsBoostTemplateService] Loading fabric-json template');
        canvas.setWidth(originalData.data.width || 1152);
        canvas.setHeight(originalData.data.height || 768);
        
        return new Promise((resolve) => {
          canvas.loadFromJSON(originalData.data, () => {
            canvas.renderAll();
            console.log('[ViewsBoostTemplateService] Fabric-json template loaded successfully');
            resolve(true);
          });
        });
      } else if (originalData.studioEditor?.layers) {
        // Use existing studioEditor layer loading
        for (const layer of originalData.studioEditor.layers) {
          if (layer.type === 'video' || layer.type === 'image') {
            await addMediaLayer(canvas, {
              type: layer.type,
              url: layer.url || layer.asset,
              x: layer.position?.x,
              y: layer.position?.y,
              w: layer.w,
              autoplay: layer.autoplay,
              loop: layer.loop,
              muted: layer.muted
            });
          }
          // Handle other layer types...
        }
      } else if (originalData.objects) {
        // Load Fabric.js format directly
        canvas.loadFromJSON(originalData, () => {
          canvas.renderAll();
        });
      }

      return true;
    } catch (error) {
      console.error('[ViewsBoostTemplateService] Failed to insert template:', error);
      return false;
    }
  }

  // Apply JSON template directly to canvas
  async applyJsonTemplate(templateId: string, canvas: any): Promise<boolean> {
    try {
      const jsonTemplate = await jsonTemplateService.getTemplateById(templateId);
      if (!jsonTemplate) {
        console.error('[ViewsBoostTemplateService] JSON template not found:', templateId);
        return false;
      }

      console.log('[ViewsBoostTemplateService] Applying JSON template:', jsonTemplate.name);
      return await jsonTemplateService.applyTemplateToCanvas(canvas, jsonTemplate);
    } catch (error) {
      console.error('[ViewsBoostTemplateService] Failed to apply JSON template:', error);
      return false;
    }
  }

  // Force refresh templates from server
  async refreshTemplates(): Promise<void> {
    this.lastFetch = 0;
    this.templates = [];
    this.categories = [];
    await this.loadTemplates();
    
    // Also refresh JSON templates
    jsonTemplateService.clearCache();
  }

  // Get template statistics
  getStats(): { totalTemplates: number; categoriesCount: number; lastFetch: Date } {
    return {
      totalTemplates: this.templates.length,
      categoriesCount: this.categories.length,
      lastFetch: new Date(this.lastFetch)
    };
  }
}

// Singleton instance
export const viewsBoostTemplateService = new ViewsBoostTemplateService();