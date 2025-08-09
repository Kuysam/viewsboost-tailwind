import { PexelsClient } from '../clients/PexelsClient.js';
import { UnsplashClient } from '../clients/UnsplashClient.js';
import { MediaDownloadManager } from '../utils/MediaDownloadManager.js';
import { MetadataTracker } from '../utils/MetadataTracker.js';
import { Logger } from '../utils/Logger.js';
import { RateLimitManager } from '../utils/RateLimitManager.js';
import { MediaValidator } from '../utils/MediaValidator.js';

export class MediaSourcingAgent {
  constructor(options = {}) {
    this.logger = new Logger('MediaSourcingAgent');
    this.pexelsClient = new PexelsClient();
    this.unsplashClient = new UnsplashClient();
    this.downloadManager = new MediaDownloadManager(this.logger);
    this.metadataTracker = new MetadataTracker(this.logger);
    this.rateLimitManager = new RateLimitManager(this.logger);
    this.mediaValidator = new MediaValidator();
    
    this.defaultOptions = {
      autoDownload: false,
      maxResults: 50,
      imageFormats: ['jpg', 'png', 'webp'],
      videoFormats: ['mp4'],
      downloadQuality: 'high',
      includeMetadata: true
    };
    
    this.options = { ...this.defaultOptions, ...options };
    this.logger.info('MediaSourcingAgent initialized');
  }

  async searchImages(query, sources = ['pexels', 'unsplash'], options = {}) {
    const searchOptions = { ...this.options, ...options };
    const results = {
      query,
      sources: [],
      totalResults: 0,
      images: [],
      metadata: {
        searchedAt: new Date().toISOString(),
        sources: sources,
        options: searchOptions
      }
    };

    this.logger.info(`Searching images for: "${query}" from sources: ${sources.join(', ')}`);

    try {
      // Search Pexels
      if (sources.includes('pexels')) {
        try {
          const pexelsResults = await this.pexelsClient.searchImages(query, {
            perPage: Math.min(searchOptions.maxResults, 80),
            orientation: searchOptions.orientation,
            size: searchOptions.size,
            color: searchOptions.color
          });

          const processedImages = pexelsResults.photos.map(photo => ({
            id: `pexels_${photo.id}`,
            source: 'pexels',
            sourceId: photo.id,
            url: photo.url,
            downloadUrl: this.selectImageUrl(photo.src, searchOptions.downloadQuality),
            photographer: photo.photographer,
            photographerUrl: photo.photographer_url,
            description: photo.alt || '',
            tags: [],
            dimensions: {
              width: photo.width,
              height: photo.height
            },
            avgColor: photo.avg_color,
            aspectRatio: photo.width / photo.height,
            orientation: photo.width > photo.height ? 'landscape' : photo.height > photo.width ? 'portrait' : 'square',
            metadata: {
              searchQuery: query,
              alt: photo.alt
            }
          }));

          results.sources.push({
            name: 'pexels',
            found: pexelsResults.photos.length,
            totalAvailable: pexelsResults.totalResults
          });
          
          results.images.push(...processedImages);
          this.logger.info(`Found ${pexelsResults.photos.length} images from Pexels`);

        } catch (error) {
          this.logger.error(`Pexels search failed: ${error.message}`);
          results.sources.push({
            name: 'pexels',
            error: error.message,
            found: 0
          });
        }
      }

      // Search Unsplash
      if (sources.includes('unsplash')) {
        try {
          const unsplashResults = await this.unsplashClient.searchPhotos(query, {
            perPage: Math.min(searchOptions.maxResults, 30),
            orientation: searchOptions.orientation,
            color: searchOptions.color
          });

          const processedImages = unsplashResults.results.map(photo => ({
            id: `unsplash_${photo.id}`,
            source: 'unsplash',
            sourceId: photo.id,
            url: photo.links.html,
            downloadUrl: this.selectUnsplashImageUrl(photo.urls, searchOptions.downloadQuality),
            photographer: photo.user.name,
            photographerUrl: photo.user.links.html,
            description: photo.description || photo.altDescription || '',
            tags: photo.tags.map(tag => tag.title || tag),
            dimensions: {
              width: photo.width,
              height: photo.height
            },
            avgColor: photo.color,
            aspectRatio: photo.width / photo.height,
            orientation: photo.width > photo.height ? 'landscape' : photo.height > photo.width ? 'portrait' : 'square',
            likes: photo.likes,
            downloads: photo.downloads,
            metadata: {
              searchQuery: query,
              createdAt: photo.createdAt,
              updatedAt: photo.updatedAt,
              blurHash: photo.blurHash,
              user: photo.user
            }
          }));

          results.sources.push({
            name: 'unsplash',
            found: unsplashResults.results.length,
            totalAvailable: unsplashResults.total
          });
          
          results.images.push(...processedImages);
          this.logger.info(`Found ${unsplashResults.results.length} images from Unsplash`);

        } catch (error) {
          this.logger.error(`Unsplash search failed: ${error.message}`);
          results.sources.push({
            name: 'unsplash',
            error: error.message,
            found: 0
          });
        }
      }

      results.totalResults = results.images.length;

      // Auto-download if requested
      if (searchOptions.autoDownload && results.images.length > 0) {
        const downloadLimit = Math.min(results.images.length, searchOptions.maxDownloads || 10);
        const imagesToDownload = results.images.slice(0, downloadLimit);
        
        this.logger.info(`Auto-downloading ${downloadLimit} images`);
        const downloadResults = await this.downloadImages(imagesToDownload);
        results.downloads = downloadResults;
      }

      return results;

    } catch (error) {
      this.logger.error(`Image search failed: ${error.message}`);
      throw error;
    }
  }

  async searchVideos(query, sources = ['pexels'], options = {}) {
    const searchOptions = { ...this.options, ...options };
    const results = {
      query,
      sources: [],
      totalResults: 0,
      videos: [],
      metadata: {
        searchedAt: new Date().toISOString(),
        sources: sources,
        options: searchOptions
      }
    };

    this.logger.info(`Searching videos for: "${query}" from sources: ${sources.join(', ')}`);

    try {
      // Search Pexels Videos
      if (sources.includes('pexels')) {
        try {
          const pexelsResults = await this.pexelsClient.searchVideos(query, {
            perPage: Math.min(searchOptions.maxResults, 80),
            orientation: searchOptions.orientation,
            size: searchOptions.size
          });

          const processedVideos = pexelsResults.videos.map(video => ({
            id: `pexels_video_${video.id}`,
            source: 'pexels',
            sourceId: video.id,
            url: video.url,
            duration: video.duration,
            dimensions: {
              width: video.width,
              height: video.height
            },
            creator: video.user.name,
            creatorUrl: video.user.url,
            description: '',
            tags: [],
            aspectRatio: video.width / video.height,
            orientation: video.width > video.height ? 'landscape' : video.height > video.width ? 'portrait' : 'square',
            videoFiles: video.videoFiles.map(file => ({
              id: file.id,
              quality: file.quality,
              fileType: file.fileType,
              width: file.width,
              height: file.height,
              link: file.link
            })),
            thumbnails: video.videoPictures.map(pic => pic.picture),
            metadata: {
              searchQuery: query,
              user: video.user,
              videoPictures: video.videoPictures
            }
          }));

          results.sources.push({
            name: 'pexels',
            found: pexelsResults.videos.length,
            totalAvailable: pexelsResults.totalResults
          });
          
          results.videos.push(...processedVideos);
          this.logger.info(`Found ${pexelsResults.videos.length} videos from Pexels`);

        } catch (error) {
          this.logger.error(`Pexels video search failed: ${error.message}`);
          results.sources.push({
            name: 'pexels',
            error: error.message,
            found: 0
          });
        }
      }

      results.totalResults = results.videos.length;

      // Auto-download if requested
      if (searchOptions.autoDownload && results.videos.length > 0) {
        const downloadLimit = Math.min(results.videos.length, searchOptions.maxDownloads || 5);
        const videosToDownload = results.videos.slice(0, downloadLimit);
        
        this.logger.info(`Auto-downloading ${downloadLimit} videos`);
        const downloadResults = await this.downloadVideos(videosToDownload);
        results.downloads = downloadResults;
      }

      return results;

    } catch (error) {
      this.logger.error(`Video search failed: ${error.message}`);
      throw error;
    }
  }

  async downloadImages(images, options = {}) {
    this.logger.info(`Starting download of ${images.length} images`);
    
    const downloadItems = images.map(image => ({
      type: 'image',
      url: image.downloadUrl,
      metadata: {
        source: image.source,
        sourceId: image.sourceId,
        originalUrl: image.url,
        photographer: image.photographer,
        photographerUrl: image.photographerUrl,
        description: image.description,
        tags: image.tags,
        searchQuery: image.metadata?.searchQuery,
        dimensions: image.dimensions,
        likes: image.likes,
        downloads: image.downloads
      },
      options: {
        prefix: `${image.source}_image`,
        ...options
      }
    }));

    const results = await this.downloadManager.downloadBatch(downloadItems, options);
    
    // Update metadata tracker
    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      const originalImage = images[i];
      
      if (result.success) {
        const fileId = this.metadataTracker.generateFileId(originalImage.downloadUrl, originalImage.source);
        await this.metadataTracker.addImageMetadata(fileId, {
          ...result.metadata,
          ...downloadItems[i].metadata,
          filename: result.filename,
          path: result.path,
          size: result.size,
          dimensions: result.dimensions,
          format: result.format
        });
      }
    }

    return results;
  }

  async downloadVideos(videos, options = {}) {
    this.logger.info(`Starting download of ${videos.length} videos`);
    
    const downloadItems = videos.map(video => {
      // Select best quality video file
      const videoFile = this.selectVideoFile(video.videoFiles, options.quality || 'high');
      
      return {
        type: 'video',
        url: videoFile.link,
        metadata: {
          source: video.source,
          sourceId: video.sourceId,
          originalUrl: video.url,
          creator: video.creator,
          creatorUrl: video.creatorUrl,
          description: video.description,
          tags: video.tags,
          searchQuery: video.metadata?.searchQuery,
          duration: video.duration,
          dimensions: video.dimensions,
          quality: videoFile.quality,
          format: videoFile.fileType
        },
        options: {
          prefix: `${video.source}_video`,
          extension: this.getVideoExtension(videoFile.fileType),
          ...options
        }
      };
    });

    const results = await this.downloadManager.downloadBatch(downloadItems, options);
    
    // Update metadata tracker
    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      const originalVideo = videos[i];
      
      if (result.success) {
        const fileId = this.metadataTracker.generateFileId(downloadItems[i].url, originalVideo.source);
        await this.metadataTracker.addVideoMetadata(fileId, {
          ...result.metadata,
          ...downloadItems[i].metadata,
          filename: result.filename,
          path: result.path,
          size: result.size
        });
      }
    }

    return results;
  }

  selectImageUrl(srcObject, quality = 'high') {
    switch (quality) {
      case 'original':
        return srcObject.original;
      case 'high':
        return srcObject.large2x || srcObject.large || srcObject.original;
      case 'medium':
        return srcObject.medium || srcObject.large || srcObject.original;
      case 'low':
        return srcObject.small || srcObject.medium || srcObject.original;
      default:
        return srcObject.large || srcObject.original;
    }
  }

  selectUnsplashImageUrl(urlsObject, quality = 'high') {
    switch (quality) {
      case 'original':
        return urlsObject.raw;
      case 'high':
        return urlsObject.full || urlsObject.regular || urlsObject.raw;
      case 'medium':
        return urlsObject.regular || urlsObject.small || urlsObject.raw;
      case 'low':
        return urlsObject.small || urlsObject.thumb || urlsObject.raw;
      default:
        return urlsObject.regular || urlsObject.raw;
    }
  }

  selectVideoFile(videoFiles, quality = 'high') {
    // Sort by quality preference
    const qualityOrder = ['uhd', 'hd', 'sd'];
    const targetIndex = qualityOrder.indexOf(quality);
    
    if (targetIndex !== -1) {
      // Try to find exact quality match
      for (let i = targetIndex; i < qualityOrder.length; i++) {
        const file = videoFiles.find(f => f.quality === qualityOrder[i]);
        if (file) return file;
      }
    }
    
    // Fallback to highest quality available
    const hdFile = videoFiles.find(f => f.quality === 'hd');
    if (hdFile) return hdFile;
    
    return videoFiles[0] || null;
  }

  getVideoExtension(fileType) {
    const typeMap = {
      'video/mp4': 'mp4',
      'video/quicktime': 'mov',
      'video/x-msvideo': 'avi'
    };
    
    return typeMap[fileType] || 'mp4';
  }

  async getStats() {
    return await this.metadataTracker.getStatistics();
  }

  async searchLocalMedia(query, filters = {}) {
    return await this.metadataTracker.searchMetadata(query, filters);
  }

  async getRateLimitStatus() {
    return {
      pexels: this.pexelsClient.getRateLimitStatus(),
      unsplash: this.unsplashClient.getRateLimitStatus()
    };
  }

  async getQueueStatus() {
    return this.downloadManager.getQueueStatus();
  }
}