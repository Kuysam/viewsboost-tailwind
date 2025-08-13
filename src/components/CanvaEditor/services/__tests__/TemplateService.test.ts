// Simple test runner for template deduplication
import { TemplateMeta } from '../../CanvaEditor';

// Mock implementation for testing without external dependencies
class TestTemplateDeduplicator {
  private templates: Map<string, TemplateMeta> = new Map();
  private readonly PHASH_THRESHOLD = 10;

  private slugify(str: string): string {
    return str
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/[\s-]+/g, '-');
  }

  private generateCanonicalKey(template: TemplateMeta): string {
    const titleSlug = this.slugify(template.title);
    const authorSlug = this.slugify(template.author || 'unknown');
    return `${titleSlug}:${authorSlug}`;
  }

  private hammingDistance(hash1: string, hash2: string): number {
    if (hash1.length !== hash2.length) return Infinity;
    let distance = 0;
    for (let i = 0; i < hash1.length; i++) {
      if (hash1[i] !== hash2[i]) distance++;
    }
    return distance;
  }

  private isDuplicateByHash(newTemplate: TemplateMeta): TemplateMeta | null {
    if (!newTemplate.phash) return null;
    
    for (const existing of this.templates.values()) {
      if (existing.phash && 
          this.hammingDistance(newTemplate.phash, existing.phash) <= this.PHASH_THRESHOLD) {
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
      thumbnail: existing.thumbnail || newTemplate.thumbnail,
      author: existing.author || newTemplate.author,
      payload: { ...newTemplate.payload, ...existing.payload }
    };
  }

  addTemplate(template: TemplateMeta): TemplateMeta {
    const duplicateByHash = this.isDuplicateByHash(template);
    if (duplicateByHash) {
      const merged = this.mergeTemplateMetadata(duplicateByHash, template);
      this.templates.set(duplicateByHash.id, merged);
      return merged;
    }

    const duplicateBySignature = this.isDuplicateBySignature(template);
    if (duplicateBySignature) {
      const merged = this.mergeTemplateMetadata(duplicateBySignature, template);
      this.templates.set(duplicateBySignature.id, merged);
      return merged;
    }

    this.templates.set(template.id, template);
    return template;
  }

  getTemplates(): TemplateMeta[] {
    return Array.from(this.templates.values());
  }

  clear(): void {
    this.templates.clear();
  }
}

// Test cases
export function runDeduplicationTests(): { passed: number; failed: number; results: string[] } {
  const results: string[] = [];
  let passed = 0;
  let failed = 0;

  function test(name: string, testFn: () => boolean): void {
    try {
      const result = testFn();
      if (result) {
        results.push(`✓ ${name}`);
        passed++;
      } else {
        results.push(`✗ ${name}`);
        failed++;
      }
    } catch (error) {
      results.push(`✗ ${name} (Error: ${error})`);
      failed++;
    }
  }

  // Test 1: No duplicate when templates are different
  test('Should not dedupe different templates', () => {
    const deduper = new TestTemplateDeduplicator();
    
    const template1: TemplateMeta = {
      id: 'test-1',
      title: 'Template One',
      category: 'test',
      author: 'Author A',
      phash: 'hash123',
      layerSignatureHash: 'sig123',
      source: 'local',
      payload: {}
    };
    
    const template2: TemplateMeta = {
      id: 'test-2',
      title: 'Template Two',
      category: 'test',
      author: 'Author B',
      phash: 'hash456',
      layerSignatureHash: 'sig456',
      source: 'local',
      payload: {}
    };
    
    deduper.addTemplate(template1);
    deduper.addTemplate(template2);
    
    return deduper.getTemplates().length === 2;
  });

  // Test 2: Dedupe by identical perceptual hash
  test('Should dedupe by identical perceptual hash', () => {
    const deduper = new TestTemplateDeduplicator();
    
    const template1: TemplateMeta = {
      id: 'test-1',
      title: 'Template One',
      category: 'test',
      author: 'Author A',
      phash: 'hash123',
      layerSignatureHash: 'sig123',
      source: 'local',
      payload: { data: 'original' }
    };
    
    const template2: TemplateMeta = {
      id: 'test-2',
      title: 'Template Two Different Title',
      category: 'test',
      author: 'Author B',
      phash: 'hash123', // Same hash
      layerSignatureHash: 'sig456',
      source: 'api',
      payload: { data: 'duplicate', extra: 'field' }
    };
    
    deduper.addTemplate(template1);
    const result = deduper.addTemplate(template2);
    
    const templates = deduper.getTemplates();
    return templates.length === 1 && result.id === 'test-1' && result.payload.data === 'original';
  });

  // Test 3: Dedupe by canonical key + layer signature
  test('Should dedupe by canonical key and layer signature', () => {
    const deduper = new TestTemplateDeduplicator();
    
    const template1: TemplateMeta = {
      id: 'test-1',
      title: 'Modern Template',
      category: 'test',
      author: 'Design Team',
      layerSignatureHash: 'sig123',
      source: 'local',
      payload: { data: 'original' }
    };
    
    const template2: TemplateMeta = {
      id: 'test-2',
      title: 'Modern Template', // Same title
      category: 'test',
      author: 'Design Team', // Same author
      layerSignatureHash: 'sig123', // Same layer signature
      source: 'api',
      payload: { data: 'duplicate' }
    };
    
    deduper.addTemplate(template1);
    deduper.addTemplate(template2);
    
    const templates = deduper.getTemplates();
    return templates.length === 1;
  });

  // Test 4: Merge metadata properly
  test('Should merge metadata from richer source', () => {
    const deduper = new TestTemplateDeduplicator();
    
    const template1: TemplateMeta = {
      id: 'test-1',
      title: 'Template',
      category: 'test',
      author: 'Author A',
      thumbnail: 'thumb1.jpg',
      phash: 'hash123',
      source: 'local',
      payload: { original: 'data' }
    };
    
    const template2: TemplateMeta = {
      id: 'test-2',
      title: 'Template Different',
      category: 'test',
      phash: 'hash123', // Same hash - triggers dedup
      source: 'api',
      payload: { additional: 'info' }
    };
    
    deduper.addTemplate(template1);
    const result = deduper.addTemplate(template2);
    
    return result.thumbnail === 'thumb1.jpg' && 
           result.payload.original === 'data' && 
           result.payload.additional === 'info';
  });

  return { passed, failed, results };
}

// Export for use in component
export default runDeduplicationTests;