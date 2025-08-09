import fs from 'fs-extra';
import path from 'path';
import crypto from 'crypto';
import { config } from '../config/config.js';

export class MetadataTracker {
  constructor(logger) {
    this.logger = logger;
    this.metadataFile = path.join(config.storage.downloadsPath, 'metadata.json');
    this.metadata = new Map();
    this.loadMetadata();
  }

  async loadMetadata() {
    try {
      if (await fs.pathExists(this.metadataFile)) {
        const data = await fs.readJson(this.metadataFile);
        this.metadata = new Map(Object.entries(data));
        this.logger.info(`Loaded ${this.metadata.size} metadata entries`);
      }
    } catch (error) {
      this.logger.error(`Failed to load metadata: ${error.message}`);
      this.metadata = new Map();
    }
  }

  async saveMetadata() {
    try {
      const data = Object.fromEntries(this.metadata);
      await fs.writeJson(this.metadataFile, data, { spaces: 2 });
      this.logger.debug(`Saved ${this.metadata.size} metadata entries`);
    } catch (error) {
      this.logger.error(`Failed to save metadata: ${error.message}`);
    }
  }

  generateFileId(url, source) {
    return crypto.createHash('sha256').update(`${source}:${url}`).digest('hex');
  }

  async addImageMetadata(fileId, data) {
    const metadata = {
      type: 'image',
      id: fileId,
      source: data.source || 'unknown',
      originalUrl: data.originalUrl,
      filename: data.filename,
      path: data.path,
      size: data.size,
      dimensions: data.dimensions,
      format: data.format,
      downloadedAt: data.downloadedAt || new Date().toISOString(),
      tags: data.tags || [],
      description: data.description || '',
      photographer: data.photographer || '',
      photographerUrl: data.photographerUrl || '',
      license: data.license || '',
      color: data.color || '',
      orientation: this.getOrientation(data.dimensions),
      aspectRatio: this.calculateAspectRatio(data.dimensions),
      searchQuery: data.searchQuery || '',
      category: data.category || 'uncategorized',
      collections: data.collections || [],
      likes: data.likes || 0,
      downloads: data.downloads || 0,
      views: data.views || 0,
      lastAccessed: new Date().toISOString(),
      usage: {
        downloaded: true,
        used: false,
        projects: []
      },
      processing: {
        resized: false,
        compressed: false,
        converted: false,
        originalDimensions: data.dimensions
      }
    };

    this.metadata.set(fileId, metadata);
    await this.saveMetadata();
    this.logger.debug(`Added image metadata for: ${data.filename}`);
    
    return metadata;
  }

  async addVideoMetadata(fileId, data) {
    const metadata = {
      type: 'video',
      id: fileId,
      source: data.source || 'unknown',
      originalUrl: data.originalUrl,
      filename: data.filename,
      path: data.path,
      size: data.size,
      duration: data.duration || 0,
      dimensions: data.dimensions || { width: 0, height: 0 },
      format: data.format || 'mp4',
      downloadedAt: data.downloadedAt || new Date().toISOString(),
      tags: data.tags || [],
      description: data.description || '',
      creator: data.creator || '',
      creatorUrl: data.creatorUrl || '',
      license: data.license || '',
      orientation: this.getOrientation(data.dimensions),
      aspectRatio: this.calculateAspectRatio(data.dimensions),
      searchQuery: data.searchQuery || '',
      category: data.category || 'uncategorized',
      collections: data.collections || [],
      likes: data.likes || 0,
      downloads: data.downloads || 0,
      views: data.views || 0,
      lastAccessed: new Date().toISOString(),
      quality: data.quality || 'hd',
      frameRate: data.frameRate || 0,
      bitRate: data.bitRate || 0,
      usage: {
        downloaded: true,
        used: false,
        projects: []
      },
      processing: {
        compressed: false,
        converted: false,
        thumbnailGenerated: false,
        originalDimensions: data.dimensions
      }
    };

    this.metadata.set(fileId, metadata);
    await this.saveMetadata();
    this.logger.debug(`Added video metadata for: ${data.filename}`);
    
    return metadata;
  }

  async updateMetadata(fileId, updates) {
    const existing = this.metadata.get(fileId);
    if (!existing) {
      throw new Error(`Metadata not found for file ID: ${fileId}`);
    }

    const updated = {
      ...existing,
      ...updates,
      lastModified: new Date().toISOString()
    };

    this.metadata.set(fileId, updated);
    await this.saveMetadata();
    this.logger.debug(`Updated metadata for: ${fileId}`);
    
    return updated;
  }

  async getMetadata(fileId) {
    const metadata = this.metadata.get(fileId);
    if (metadata) {
      // Update last accessed
      metadata.lastAccessed = new Date().toISOString();
      this.metadata.set(fileId, metadata);
    }
    return metadata;
  }

  async searchMetadata(query, filters = {}) {
    const results = [];
    
    for (const [fileId, metadata] of this.metadata) {
      let matches = true;

      // Text search in description, tags, filename
      if (query) {
        const searchText = `${metadata.description} ${metadata.tags.join(' ')} ${metadata.filename}`.toLowerCase();
        matches = matches && searchText.includes(query.toLowerCase());
      }

      // Apply filters
      if (filters.type && metadata.type !== filters.type) {
        matches = false;
      }

      if (filters.source && metadata.source !== filters.source) {
        matches = false;
      }

      if (filters.category && metadata.category !== filters.category) {
        matches = false;
      }

      if (filters.orientation && metadata.orientation !== filters.orientation) {
        matches = false;
      }

      if (filters.minSize && metadata.size < filters.minSize) {
        matches = false;
      }

      if (filters.maxSize && metadata.size > filters.maxSize) {
        matches = false;
      }

      if (filters.dateFrom) {
        const downloadDate = new Date(metadata.downloadedAt);
        const fromDate = new Date(filters.dateFrom);
        if (downloadDate < fromDate) {
          matches = false;
        }
      }

      if (filters.dateTo) {
        const downloadDate = new Date(metadata.downloadedAt);
        const toDate = new Date(filters.dateTo);
        if (downloadDate > toDate) {
          matches = false;
        }
      }

      if (matches) {
        results.push(metadata);
      }
    }

    return results.sort((a, b) => new Date(b.downloadedAt) - new Date(a.downloadedAt));
  }

  async getStatistics() {
    const stats = {
      totalFiles: this.metadata.size,
      images: 0,
      videos: 0,
      totalSize: 0,
      sources: {},
      categories: {},
      orientations: {},
      formats: {},
      dateRange: {
        oldest: null,
        newest: null
      }
    };

    for (const metadata of this.metadata.values()) {
      // Type counts
      if (metadata.type === 'image') {
        stats.images++;
      } else if (metadata.type === 'video') {
        stats.videos++;
      }

      // Total size
      stats.totalSize += metadata.size || 0;

      // Sources
      stats.sources[metadata.source] = (stats.sources[metadata.source] || 0) + 1;

      // Categories
      stats.categories[metadata.category] = (stats.categories[metadata.category] || 0) + 1;

      // Orientations
      stats.orientations[metadata.orientation] = (stats.orientations[metadata.orientation] || 0) + 1;

      // Formats
      stats.formats[metadata.format] = (stats.formats[metadata.format] || 0) + 1;

      // Date range
      const downloadDate = new Date(metadata.downloadedAt);
      if (!stats.dateRange.oldest || downloadDate < new Date(stats.dateRange.oldest)) {
        stats.dateRange.oldest = metadata.downloadedAt;
      }
      if (!stats.dateRange.newest || downloadDate > new Date(stats.dateRange.newest)) {
        stats.dateRange.newest = metadata.downloadedAt;
      }
    }

    return stats;
  }

  async markAsUsed(fileId, projectName) {
    const metadata = this.metadata.get(fileId);
    if (!metadata) {
      throw new Error(`Metadata not found for file ID: ${fileId}`);
    }

    metadata.usage.used = true;
    if (!metadata.usage.projects.includes(projectName)) {
      metadata.usage.projects.push(projectName);
    }
    metadata.lastUsed = new Date().toISOString();

    this.metadata.set(fileId, metadata);
    await this.saveMetadata();
  }

  async deleteMetadata(fileId) {
    const deleted = this.metadata.delete(fileId);
    if (deleted) {
      await this.saveMetadata();
      this.logger.debug(`Deleted metadata for: ${fileId}`);
    }
    return deleted;
  }

  async cleanupOrphanedMetadata() {
    const orphaned = [];
    
    for (const [fileId, metadata] of this.metadata) {
      const fileExists = await fs.pathExists(metadata.path);
      if (!fileExists) {
        orphaned.push(fileId);
      }
    }

    for (const fileId of orphaned) {
      await this.deleteMetadata(fileId);
    }

    this.logger.info(`Cleaned up ${orphaned.length} orphaned metadata entries`);
    return orphaned.length;
  }

  getOrientation(dimensions) {
    if (!dimensions || !dimensions.width || !dimensions.height) {
      return 'unknown';
    }
    
    if (dimensions.width > dimensions.height) {
      return 'landscape';
    } else if (dimensions.height > dimensions.width) {
      return 'portrait';
    } else {
      return 'square';
    }
  }

  calculateAspectRatio(dimensions) {
    if (!dimensions || !dimensions.width || !dimensions.height) {
      return 0;
    }
    
    return parseFloat((dimensions.width / dimensions.height).toFixed(2));
  }

  async exportMetadata(format = 'json') {
    const data = Object.fromEntries(this.metadata);
    
    if (format === 'json') {
      const exportPath = path.join(config.storage.downloadsPath, `metadata_export_${Date.now()}.json`);
      await fs.writeJson(exportPath, data, { spaces: 2 });
      return exportPath;
    } else if (format === 'csv') {
      const exportPath = path.join(config.storage.downloadsPath, `metadata_export_${Date.now()}.csv`);
      // Convert to CSV format
      const csvHeaders = ['id', 'type', 'source', 'filename', 'size', 'downloadedAt', 'tags', 'category'];
      const csvRows = [csvHeaders.join(',')];
      
      for (const metadata of Object.values(data)) {
        const row = [
          metadata.id,
          metadata.type,
          metadata.source,
          metadata.filename,
          metadata.size,
          metadata.downloadedAt,
          metadata.tags.join(';'),
          metadata.category
        ];
        csvRows.push(row.join(','));
      }
      
      await fs.writeFile(exportPath, csvRows.join('\n'));
      return exportPath;
    }
    
    throw new Error(`Unsupported export format: ${format}`);
  }
}