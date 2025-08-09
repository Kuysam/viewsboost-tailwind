import axios from 'axios';
import fs from 'fs-extra';
import path from 'path';
import sharp from 'sharp';
import crypto from 'crypto';
import mime from 'mime-types';
import PQueue from 'p-queue';
import { config } from '../config/config.js';

export class MediaDownloadManager {
  constructor(logger) {
    this.logger = logger;
    this.downloadQueue = new PQueue({ 
      concurrency: config.queue.concurrency,
      interval: config.rateLimiting.requestDelay,
      intervalCap: 1
    });
    
    this.config = config;
    this.ensureDirectoriesExist();
  }

  async ensureDirectoriesExist() {
    const directories = [
      this.config.storage.downloadsPath,
      this.config.storage.imagesPath,
      this.config.storage.videosPath,
      this.config.storage.tempPath,
      this.config.storage.processedPath
    ];

    for (const dir of directories) {
      await fs.ensureDir(dir);
    }
  }

  generateFilename(url, mediaType, options = {}) {
    const urlHash = crypto.createHash('md5').update(url).digest('hex').substring(0, 8);
    const timestamp = Date.now();
    const extension = options.extension || this.getFileExtension(url);
    const prefix = options.prefix || mediaType;
    
    return `${prefix}_${timestamp}_${urlHash}.${extension}`;
  }

  getFileExtension(url) {
    const urlPath = new URL(url).pathname;
    const extension = path.extname(urlPath).toLowerCase().substring(1);
    return extension || 'jpg';
  }

  async downloadImage(imageUrl, metadata = {}, options = {}) {
    return this.downloadQueue.add(async () => {
      try {
        this.logger.info(`Starting image download: ${imageUrl}`);
        
        // Validate URL
        if (!this.isValidUrl(imageUrl)) {
          throw new Error(`Invalid URL: ${imageUrl}`);
        }

        // Download to temp directory first
        const filename = this.generateFilename(imageUrl, 'image', options);
        const tempPath = path.join(this.config.storage.tempPath, filename);
        const finalPath = path.join(this.config.storage.imagesPath, filename);

        // Download file
        const response = await axios({
          method: 'GET',
          url: imageUrl,
          responseType: 'stream',
          timeout: 30000,
          headers: {
            'User-Agent': 'MediaSourcingAgent/1.0'
          }
        });

        // Check content type
        const contentType = response.headers['content-type'];
        if (!contentType || !contentType.startsWith('image/')) {
          throw new Error(`Invalid content type: ${contentType}`);
        }

        // Check content length
        const contentLength = parseInt(response.headers['content-length'] || '0');
        if (contentLength > this.config.media.maxImageSize) {
          throw new Error(`Image too large: ${contentLength} bytes`);
        }

        // Save to temp file
        const writer = fs.createWriteStream(tempPath);
        response.data.pipe(writer);

        await new Promise((resolve, reject) => {
          writer.on('finish', resolve);
          writer.on('error', reject);
        });

        // Validate and process image
        const imageInfo = await this.validateAndProcessImage(tempPath, finalPath, options);
        
        // Clean up temp file
        await fs.remove(tempPath);

        const result = {
          success: true,
          filename,
          path: finalPath,
          size: imageInfo.size,
          dimensions: {
            width: imageInfo.width,
            height: imageInfo.height
          },
          format: imageInfo.format,
          metadata: {
            ...metadata,
            downloadedAt: new Date().toISOString(),
            originalUrl: imageUrl,
            contentType
          }
        };

        this.logger.info(`Image download completed: ${filename}`);
        return result;

      } catch (error) {
        this.logger.error(`Image download failed: ${error.message}`);
        throw error;
      }
    });
  }

  async downloadVideo(videoUrl, metadata = {}, options = {}) {
    return this.downloadQueue.add(async () => {
      try {
        this.logger.info(`Starting video download: ${videoUrl}`);
        
        // Validate URL
        if (!this.isValidUrl(videoUrl)) {
          throw new Error(`Invalid URL: ${videoUrl}`);
        }

        // Download to temp directory first
        const filename = this.generateFilename(videoUrl, 'video', options);
        const tempPath = path.join(this.config.storage.tempPath, filename);
        const finalPath = path.join(this.config.storage.videosPath, filename);

        // Download file
        const response = await axios({
          method: 'GET',
          url: videoUrl,
          responseType: 'stream',
          timeout: 120000, // 2 minutes for videos
          headers: {
            'User-Agent': 'MediaSourcingAgent/1.0'
          }
        });

        // Check content type
        const contentType = response.headers['content-type'];
        if (!contentType || !contentType.startsWith('video/')) {
          throw new Error(`Invalid content type: ${contentType}`);
        }

        // Check content length
        const contentLength = parseInt(response.headers['content-length'] || '0');
        if (contentLength > this.config.media.maxVideoSize) {
          throw new Error(`Video too large: ${contentLength} bytes`);
        }

        // Save to temp file
        const writer = fs.createWriteStream(tempPath);
        response.data.pipe(writer);

        await new Promise((resolve, reject) => {
          writer.on('finish', resolve);
          writer.on('error', reject);
        });

        // Move to final location (basic validation only for videos)
        await fs.move(tempPath, finalPath);
        const stats = await fs.stat(finalPath);

        const result = {
          success: true,
          filename,
          path: finalPath,
          size: stats.size,
          metadata: {
            ...metadata,
            downloadedAt: new Date().toISOString(),
            originalUrl: videoUrl,
            contentType
          }
        };

        this.logger.info(`Video download completed: ${filename}`);
        return result;

      } catch (error) {
        this.logger.error(`Video download failed: ${error.message}`);
        throw error;
      }
    });
  }

  async validateAndProcessImage(inputPath, outputPath, options = {}) {
    try {
      const image = sharp(inputPath);
      const metadata = await image.metadata();
      
      // Validate format
      if (!this.config.media.supportedImageFormats.includes(metadata.format)) {
        throw new Error(`Unsupported image format: ${metadata.format}`);
      }

      let processedImage = image;

      // Apply processing options
      if (options.resize) {
        const { width, height, fit = 'cover' } = options.resize;
        processedImage = processedImage.resize(width, height, { fit });
      }

      if (options.quality && metadata.format === 'jpeg') {
        processedImage = processedImage.jpeg({ quality: options.quality });
      }

      if (options.format && options.format !== metadata.format) {
        switch (options.format) {
          case 'jpeg':
            processedImage = processedImage.jpeg();
            break;
          case 'png':
            processedImage = processedImage.png();
            break;
          case 'webp':
            processedImage = processedImage.webp();
            break;
        }
      }

      // Save processed image
      await processedImage.toFile(outputPath);
      
      // Get final metadata
      const finalImage = sharp(outputPath);
      const finalMetadata = await finalImage.metadata();
      const stats = await fs.stat(outputPath);

      return {
        width: finalMetadata.width,
        height: finalMetadata.height,
        format: finalMetadata.format,
        size: stats.size
      };

    } catch (error) {
      throw new Error(`Image processing failed: ${error.message}`);
    }
  }

  async downloadBatch(items, options = {}) {
    const results = [];
    const batchSize = options.batchSize || 5;
    
    this.logger.info(`Starting batch download of ${items.length} items`);

    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      const batchPromises = batch.map(async (item) => {
        try {
          if (item.type === 'image') {
            return await this.downloadImage(item.url, item.metadata, item.options);
          } else if (item.type === 'video') {
            return await this.downloadVideo(item.url, item.metadata, item.options);
          }
        } catch (error) {
          return {
            success: false,
            error: error.message,
            url: item.url
          };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
      
      this.logger.info(`Completed batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(items.length / batchSize)}`);
    }

    return results;
  }

  isValidUrl(url) {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  getQueueStatus() {
    return {
      pending: this.downloadQueue.pending,
      size: this.downloadQueue.size,
      isPaused: this.downloadQueue.isPaused
    };
  }

  async pauseQueue() {
    this.downloadQueue.pause();
    this.logger.info('Download queue paused');
  }

  async resumeQueue() {
    this.downloadQueue.start();
    this.logger.info('Download queue resumed');
  }

  async clearQueue() {
    this.downloadQueue.clear();
    this.logger.info('Download queue cleared');
  }
}