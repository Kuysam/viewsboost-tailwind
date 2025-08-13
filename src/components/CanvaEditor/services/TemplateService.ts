import { TemplateMeta, Layer, Page } from '../CanvaEditor';

// Simple hash function for strings
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return hash.toString(36);
}

// Perceptual hash simulation (simplified)
function generatePerceptualHash(imageUrl?: string): string {
  if (!imageUrl) return '';
  // In a real implementation, this would analyze the image
  return simpleHash(imageUrl);
}

// Generate layer signature hash from layer structure
function generateLayerSignatureHash(layers: Layer[]): string {
  const signature = layers
    .sort((a, b) => a.id.localeCompare(b.id))
    .map(layer => `${layer.type}:${layer.props.left || 0},${layer.props.top || 0}`)
    .join('|');
  return simpleHash(signature);
}

// Normalize string for canonical key generation
function slugify(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s-]+/g, '-');
}

// Hamming distance calculation for perceptual hash comparison
function hammingDistance(hash1: string, hash2: string): number {
  if (hash1.length !== hash2.length) return Infinity;
  let distance = 0;
  for (let i = 0; i < hash1.length; i++) {
    if (hash1[i] !== hash2[i]) distance++;
  }
  return distance;
}

// Template deduplication class
class TemplateDeduplicator {
  private templates: Map<string, TemplateMeta> = new Map();
  private readonly PHASH_THRESHOLD = 10;

  private generateCanonicalKey(template: TemplateMeta): string {
    const titleSlug = slugify(template.title);
    const authorSlug = slugify(template.author || 'unknown');
    return `${titleSlug}:${authorSlug}`;
  }

  private isDuplicateByHash(newTemplate: TemplateMeta): TemplateMeta | null {
    if (!newTemplate.phash) return null;
    
    for (const existing of this.templates.values()) {
      if (existing.phash && 
          hammingDistance(newTemplate.phash, existing.phash) <= this.PHASH_THRESHOLD) {
        return existing;
      }
    }
    return null;
  }

  private isDuplicateBySignature(newTemplate: TemplateMeta): TemplateMeta | null {
    const canonicalKey = this.generateCanonicalKey(newTemplate);
    
    for (const existing of this.templates.values()) {
      const existingKey = this.generateCanonicalKey(existing);
      if (canonicalKey === existingKey && 
          newTemplate.layerSignatureHash === existing.layerSignatureHash) {
        return existing;
      }
    }
    return null;
  }

  private mergeTemplateMetadata(existing: TemplateMeta, newTemplate: TemplateMeta): TemplateMeta {
    return {
      ...existing,
      // Prefer richer metadata
      thumbnail: existing.thumbnail || newTemplate.thumbnail,
      author: existing.author || newTemplate.author,
      // Merge payload, preferring existing
      payload: { ...newTemplate.payload, ...existing.payload }
    };
  }

  addTemplate(template: TemplateMeta): TemplateMeta {
    // Check for duplicates by perceptual hash
    const duplicateByHash = this.isDuplicateByHash(template);
    if (duplicateByHash) {
      const merged = this.mergeTemplateMetadata(duplicateByHash, template);
      this.templates.set(duplicateByHash.id, merged);
      return merged;
    }

    // Check for duplicates by canonical key + layer signature
    const duplicateBySignature = this.isDuplicateBySignature(template);
    if (duplicateBySignature) {
      const merged = this.mergeTemplateMetadata(duplicateBySignature, template);
      this.templates.set(duplicateBySignature.id, merged);
      return merged;
    }

    // No duplicate found, add new template
    this.templates.set(template.id, template);
    return template;
  }

  getTemplates(): TemplateMeta[] {
    return Array.from(this.templates.values());
  }

  getTemplatesByCategory(category: string): TemplateMeta[] {
    return this.getTemplates().filter(t => t.category === category);
  }

  getTemplateById(id: string): TemplateMeta | null {
    return this.templates.get(id) || null;
  }

  clear(): void {
    this.templates.clear();
  }
}

// Template Service
export class TemplateService {
  private deduplicator = new TemplateDeduplicator();
  private localTemplates: TemplateMeta[] = [];
  private apiTemplates: TemplateMeta[] = [];

  constructor() {
    this.initializeLocalTemplates();
  }

  private initializeLocalTemplates(): void {
    // Sample local templates with deterministic data
    const localTemplates: TemplateMeta[] = [
      {
        id: 'local-1',
        title: 'Modern Presentation',
        category: 'presentation',
        author: 'Design Team',
        thumbnail: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjE4MCIgdmlld0JveD0iMCAwIDMyMCAxODAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMjAiIGhlaWdodD0iMTgwIiBmaWxsPSIjNEY0NkU1Ii8+Cjx0ZXh0IHg9IjUwIiB5PSI2MCIgZmlsbD0id2hpdGUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIyNCIgZm9udC13ZWlnaHQ9ImJvbGQiPlByZXNlbnRhdGlvbjwvdGV4dD4KPHN2Zz4=',
        source: 'local',
        payload: {
          pages: [{
            id: 'page-1',
            layers: [
              { id: 'layer-1', type: 'text', props: { text: 'Presentation', left: 50, top: 60, fontSize: 24, fill: '#ffffff' } },
              { id: 'layer-2', type: 'shape', props: { left: 50, top: 100, width: 220, height: 60, fill: '#6366f1' } }
            ]
          }]
        }
      },
      {
        id: 'local-2',
        title: 'Social Media Post',
        category: 'social',
        author: 'Creative Studio',
        thumbnail: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjE4MCIgdmlld0JveD0iMCAwIDMyMCAxODAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMjAiIGhlaWdodD0iMTgwIiBmaWxsPSIjRkY2QjZCIi8+Cjx0ZXh0IHg9IjUwIiB5PSI5MCIgZmlsbD0id2hpdGUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIyMCIgZm9udC13ZWlnaHQ9ImJvbGQiPlNvY2lhbCBQb3N0PC90ZXh0Pgo8L3N2Zz4=',
        source: 'local',
        payload: {
          pages: [{
            id: 'page-1',
            layers: [
              { id: 'layer-1', type: 'text', props: { text: 'Social Post', left: 50, top: 90, fontSize: 20, fill: '#ffffff' } },
              { id: 'layer-2', type: 'shape', props: { left: 200, top: 50, width: 80, height: 80, fill: '#ec4899', rx: 40 } }
            ]
          }]
        }
      },
      {
        id: 'local-3',
        title: 'Business Card',
        category: 'business',
        author: 'Pro Designer',
        thumbnail: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjE4MCIgdmlld0JveD0iMCAwIDMyMCAxODAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMjAiIGhlaWdodD0iMTgwIiBmaWxsPSIjMTExODI3Ii8+Cjx0ZXh0IHg9IjUwIiB5PSI3MCIgZmlsbD0iI0Y5RkFGQiIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE4IiBmb250LXdlaWdodD0iYm9sZCI+Sm9obiBEb2U8L3RleHQ+Cjx0ZXh0IHg9IjUwIiB5PSIxMDAiIGZpbGw9IiM5Q0EzQUYiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCI+RGVzaWduZXI8L3RleHQ+CjxyZWN0IHg9IjIwMCIgeT0iNjAiIHdpZHRoPSI4MCIgaGVpZ2h0PSI2MCIgZmlsbD0iIzEwQjk4MSIvPgo8L3N2Zz4=',
        source: 'local',
        payload: {
          pages: [{
            id: 'page-1',
            layers: [
              { id: 'layer-1', type: 'text', props: { text: 'John Doe', left: 50, top: 70, fontSize: 18, fill: '#f9fafb' } },
              { id: 'layer-2', type: 'text', props: { text: 'Designer', left: 50, top: 100, fontSize: 14, fill: '#9ca3af' } },
              { id: 'layer-3', type: 'shape', props: { left: 200, top: 60, width: 80, height: 60, fill: '#10b981' } }
            ]
          }]
        }
      },
      {
        id: 'local-4',
        title: 'Video Thumbnail',
        category: 'video',
        author: 'Video Pro',
        thumbnail: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjE4MCIgdmlld0JveD0iMCAwIDMyMCAxODAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMjAiIGhlaWdodD0iMTgwIiBmaWxsPSIjRUY0NDQ0Ii8+Cjx0ZXh0IHg9IjUwIiB5PSI4MCIgZmlsbD0id2hpdGUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIyMiIgZm9udC13ZWlnaHQ9ImJvbGQiPkFXRVNPTUU8L3RleHQ+Cjx0ZXh0IHg9IjUwIiB5PSIxMTAiIGZpbGw9IndoaXRlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjIiIGZvbnQtd2VpZ2h0PSJib2xkIj5WSURFTzwvdGV4dD4KPHBvbHlnb24gcG9pbnRzPSIyMDAsNjAgMjcwLDkwIDIwMCwxMjAiIGZpbGw9IndoaXRlIi8+Cjwvc3ZnPg==',
        source: 'local',
        payload: {
          pages: [{
            id: 'page-1',
            layers: [
              { id: 'layer-1', type: 'text', props: { text: 'AWESOME', left: 50, top: 80, fontSize: 22, fill: '#ffffff' } },
              { id: 'layer-2', type: 'text', props: { text: 'VIDEO', left: 50, top: 110, fontSize: 22, fill: '#ffffff' } }
            ]
          }]
        }
      },
      {
        id: 'local-5',
        title: 'Instagram Story',
        category: 'social',
        author: 'Social Team',
        thumbnail: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjE4MCIgdmlld0JveD0iMCAwIDMyMCAxODAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxkZWZzPgo8bGluZWFyR3JhZGllbnQgaWQ9ImdyYWRpZW50IiB4MT0iMCUiIHkxPSIwJSIgeDI9IjEwMCUiIHkyPSIxMDAlIj4KPHN0b3Agb2Zmc2V0PSIwJSIgc3R5bGU9InN0b3AtY29sb3I6I0Y1NkM2QyIvPgo8c3RvcCBvZmZzZXQ9IjEwMCUiIHN0eWxlPSJzdG9wLWNvbG9yOiNGQkJGMjQiLz4KPC9saW5lYXJHcmFkaWVudD4KPC9kZWZzPgo8cmVjdCB3aWR0aD0iMzIwIiBoZWlnaHQ9IjE4MCIgZmlsbD0idXJsKCNncmFkaWVudCkiLz4KPHN2Zz4=',
        source: 'local',
        payload: {
          pages: [{
            id: 'page-1',
            layers: [
              { id: 'layer-1', type: 'shape', props: { left: 0, top: 0, width: 320, height: 180, fill: 'linear-gradient(45deg, #f56c6c, #fbbf24)' } }
            ]
          }]
        }
      },
      {
        id: 'local-6',
        title: 'Email Header',
        category: 'marketing',
        author: 'Marketing Team',
        thumbnail: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjE4MCIgdmlld0JveD0iMCAwIDMyMCAxODAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMjAiIGhlaWdodD0iMTgwIiBmaWxsPSIjMzNBOEZGIi8+Cjx0ZXh0IHg9IjUwIiB5PSI3MCIgZmlsbD0id2hpdGUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIyNCIgZm9udC13ZWlnaHQ9ImJvbGQiPk5ld3NsZXR0ZXI8L3RleHQ+Cjx0ZXh0IHg9IjUwIiB5PSIxMDAiIGZpbGw9IndoaXRlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTYiPlN0YXkgdXBkYXRlZDwvdGV4dD4KPC9zdmc+',
        source: 'local',
        payload: {
          pages: [{
            id: 'page-1',
            layers: [
              { id: 'layer-1', type: 'text', props: { text: 'Newsletter', left: 50, top: 70, fontSize: 24, fill: '#ffffff' } },
              { id: 'layer-2', type: 'text', props: { text: 'Stay updated', left: 50, top: 100, fontSize: 16, fill: '#ffffff' } }
            ]
          }]
        }
      }
    ];

    // Generate hashes for local templates
    localTemplates.forEach(template => {
      template.phash = generatePerceptualHash(template.thumbnail);
      if (template.payload.pages?.[0]?.layers) {
        template.layerSignatureHash = generateLayerSignatureHash(template.payload.pages[0].layers);
      }
    });

    this.localTemplates = localTemplates;
  }

  // Get templates with optional category filter
  getTemplates(options?: { category?: string }): TemplateMeta[] {
    // Combine local and API templates in deduplicator
    this.deduplicator.clear();
    
    [...this.localTemplates, ...this.apiTemplates].forEach(template => {
      this.deduplicator.addTemplate(template);
    });

    const templates = this.deduplicator.getTemplates();
    
    if (options?.category) {
      return templates.filter(t => t.category === options.category);
    }
    
    return templates;
  }

  // Get template by ID
  getTemplateById(id: string): TemplateMeta | null {
    const allTemplates = this.getTemplates();
    return allTemplates.find(t => t.id === id) || null;
  }

  // Insert template into document at specified page index
  insertTemplate(pageIndex: number, templateId: string): { success: boolean; message: string } {
    const template = this.getTemplateById(templateId);
    
    if (!template) {
      return { success: false, message: 'Template not found' };
    }

    if (!template.payload.pages?.[0]) {
      return { success: false, message: 'Template has no page data' };
    }

    // This would integrate with the Zustand store to actually insert the template
    // For now, return success
    return { success: true, message: 'Template inserted successfully' };
  }

  // Add API templates (simulated)
  async fetchApiTemplates(): Promise<TemplateMeta[]> {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Mock API templates (some duplicates to test deduplication)
    const apiTemplates: TemplateMeta[] = [
      {
        id: 'api-1',
        title: 'Modern Presentation', // Duplicate title
        category: 'presentation',
        author: 'API Design Team', // Different author
        thumbnail: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjE4MCIgdmlld0JveD0iMCAwIDMyMCAxODAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMjAiIGhlaWdodD0iMTgwIiBmaWxsPSIjNEY0NkU1Ii8+Cjx0ZXh0IHg9IjUwIiB5PSI2MCIgZmlsbD0id2hpdGUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIyNCIgZm9udC13ZWlnaHQ9ImJvbGQiPlByZXNlbnRhdGlvbjwvdGV4dD4KPHN2Zz4=', // Same thumbnail
        source: 'api',
        payload: {
          pages: [{
            id: 'page-1',
            layers: [
              { id: 'layer-1', type: 'text', props: { text: 'Presentation', left: 50, top: 60, fontSize: 24, fill: '#ffffff' } },
              { id: 'layer-2', type: 'shape', props: { left: 50, top: 100, width: 220, height: 60, fill: '#6366f1' } }
            ]
          }]
        }
      },
      {
        id: 'api-2',
        title: 'Premium Banner',
        category: 'marketing',
        author: 'Premium Designer',
        source: 'api',
        payload: {
          pages: [{
            id: 'page-1',
            layers: [
              { id: 'layer-1', type: 'text', props: { text: 'PREMIUM', left: 80, top: 80, fontSize: 28, fill: '#fbbf24' } }
            ]
          }]
        }
      }
    ];

    // Generate hashes for API templates
    apiTemplates.forEach(template => {
      template.phash = generatePerceptualHash(template.thumbnail);
      if (template.payload.pages?.[0]?.layers) {
        template.layerSignatureHash = generateLayerSignatureHash(template.payload.pages[0].layers);
      }
    });

    this.apiTemplates = apiTemplates;
    return apiTemplates;
  }

  // Get available categories
  getCategories(): string[] {
    const allTemplates = this.getTemplates();
    const categories = new Set(allTemplates.map(t => t.category));
    return Array.from(categories).sort();
  }
}

// Export singleton instance
export const templateService = new TemplateService();