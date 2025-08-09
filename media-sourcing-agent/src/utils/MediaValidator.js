import fs from 'fs-extra';
import path from 'path';
import sharp from 'sharp';
import mime from 'mime-types';
import { config } from '../config/config.js';

export class MediaValidator {
  constructor() {
    this.supportedImageFormats = config.media.supportedImageFormats;
    this.supportedVideoFormats = config.media.supportedVideoFormats;
    this.maxImageSize = config.media.maxImageSize;
    this.maxVideoSize = config.media.maxVideoSize;
  }

  // URL Validation
  isValidUrl(url) {
    try {
      const urlObj = new URL(url);
      return ['http:', 'https:'].includes(urlObj.protocol);
    } catch {
      return false;
    }
  }

  isImageUrl(url) {
    if (!this.isValidUrl(url)) return false;
    
    const urlPath = new URL(url).pathname.toLowerCase();
    const extension = path.extname(urlPath).substring(1);
    
    return this.supportedImageFormats.includes(extension) ||
           url.toLowerCase().includes('image') ||
           this.hasImageMimePattern(url);
  }

  isVideoUrl(url) {
    if (!this.isValidUrl(url)) return false;
    
    const urlPath = new URL(url).pathname.toLowerCase();
    const extension = path.extname(urlPath).substring(1);
    
    return this.supportedVideoFormats.includes(extension) ||
           url.toLowerCase().includes('video') ||
           this.hasVideoMimePattern(url);
  }

  hasImageMimePattern(url) {
    const imageMimePatterns = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/webp',
      'image/gif', 'image/svg', 'image/bmp', 'image/tiff'
    ];
    
    return imageMimePatterns.some(pattern => url.toLowerCase().includes(pattern));
  }

  hasVideoMimePattern(url) {
    const videoMimePatterns = [
      'video/mp4', 'video/avi', 'video/mov', 'video/wmv',
      'video/flv', 'video/webm', 'video/mkv'
    ];
    
    return videoMimePatterns.some(pattern => url.toLowerCase().includes(pattern));
  }

  // File Validation
  async validateImageFile(filePath) {
    const result = {
      valid: false,
      format: null,
      dimensions: null,
      size: 0,
      errors: []
    };

    try {
      // Check if file exists
      if (!await fs.pathExists(filePath)) {
        result.errors.push('File does not exist');
        return result;
      }

      // Check file size
      const stats = await fs.stat(filePath);
      result.size = stats.size;

      if (stats.size === 0) {
        result.errors.push('File is empty');
        return result;
      }

      if (stats.size > this.maxImageSize) {
        result.errors.push(`File too large: ${stats.size} bytes (max: ${this.maxImageSize})`);
        return result;
      }

      // Validate using Sharp
      const image = sharp(filePath);
      const metadata = await image.metadata();

      result.format = metadata.format;
      result.dimensions = {
        width: metadata.width,
        height: metadata.height
      };

      // Check format support
      if (!this.supportedImageFormats.includes(metadata.format)) {
        result.errors.push(`Unsupported format: ${metadata.format}`);
        return result;
      }

      // Check dimensions
      if (!metadata.width || !metadata.height) {
        result.errors.push('Invalid image dimensions');
        return result;
      }

      if (metadata.width < 1 || metadata.height < 1) {
        result.errors.push('Image dimensions too small');
        return result;
      }

      // Additional format-specific validations
      await this.validateImageFormat(image, metadata, result);

      result.valid = result.errors.length === 0;
      return result;

    } catch (error) {
      result.errors.push(`Validation error: ${error.message}`);
      return result;
    }
  }

  async validateImageFormat(image, metadata, result) {
    try {
      switch (metadata.format) {
        case 'jpeg':
          // Check for JPEG corruption
          const jpegBuffer = await image.jpeg().toBuffer();
          if (jpegBuffer.length === 0) {
            result.errors.push('JPEG file appears to be corrupted');
          }
          break;

        case 'png':
          // Check PNG integrity
          const pngBuffer = await image.png().toBuffer();
          if (pngBuffer.length === 0) {
            result.errors.push('PNG file appears to be corrupted');
          }
          break;

        case 'webp':
          // Check WebP support and integrity
          const webpBuffer = await image.webp().toBuffer();
          if (webpBuffer.length === 0) {
            result.errors.push('WebP file appears to be corrupted');
          }
          break;
      }
    } catch (error) {
      result.errors.push(`Format validation failed: ${error.message}`);
    }
  }

  async validateVideoFile(filePath) {
    const result = {
      valid: false,
      format: null,
      size: 0,
      errors: []
    };

    try {
      // Check if file exists
      if (!await fs.pathExists(filePath)) {
        result.errors.push('File does not exist');
        return result;
      }

      // Check file size
      const stats = await fs.stat(filePath);
      result.size = stats.size;

      if (stats.size === 0) {
        result.errors.push('File is empty');
        return result;
      }

      if (stats.size > this.maxVideoSize) {
        result.errors.push(`File too large: ${stats.size} bytes (max: ${this.maxVideoSize})`);
        return result;
      }

      // Check file extension
      const extension = path.extname(filePath).toLowerCase().substring(1);
      if (!this.supportedVideoFormats.includes(extension)) {
        result.errors.push(`Unsupported video format: ${extension}`);
        return result;
      }

      result.format = extension;

      // Basic video validation (without ffmpeg dependency)
      await this.validateVideoBasic(filePath, result);

      result.valid = result.errors.length === 0;
      return result;

    } catch (error) {
      result.errors.push(`Validation error: ${error.message}`);
      return result;
    }
  }

  async validateVideoBasic(filePath, result) {
    try {
      // Read first few bytes to check for video file signatures
      const buffer = Buffer.alloc(32);
      const fd = await fs.open(filePath, 'r');
      await fd.read(buffer, 0, 32, 0);
      await fd.close();

      const hex = buffer.toString('hex').toLowerCase();
      
      // Check for common video file signatures
      const videoSignatures = {
        mp4: ['00000018667479704d534e56', '0000001c667479704d534e56', '66747970'],
        avi: ['52494646', '41564920'],
        mov: ['00000014667479707174', '66747970'],
        webm: ['1a45dfa3'],
        mkv: ['1a45dfa3']
      };

      let signatureFound = false;
      for (const [format, signatures] of Object.entries(videoSignatures)) {
        for (const signature of signatures) {
          if (hex.includes(signature)) {
            signatureFound = true;
            break;
          }
        }
        if (signatureFound) break;
      }

      if (!signatureFound) {
        result.errors.push('File does not appear to be a valid video file');
      }

    } catch (error) {
      result.errors.push(`Basic video validation failed: ${error.message}`);
    }
  }

  // Content Type Validation
  validateContentType(contentType, expectedType) {
    if (!contentType) {
      return { valid: false, error: 'Content-Type header missing' };
    }

    const type = contentType.toLowerCase().split(';')[0]; // Remove charset info

    if (expectedType === 'image') {
      const validImageTypes = [
        'image/jpeg', 'image/jpg', 'image/png', 'image/webp',
        'image/gif', 'image/svg+xml', 'image/bmp', 'image/tiff'
      ];
      
      if (validImageTypes.includes(type)) {
        return { valid: true };
      }
      
      return { valid: false, error: `Invalid image content type: ${type}` };
    }

    if (expectedType === 'video') {
      const validVideoTypes = [
        'video/mp4', 'video/avi', 'video/quicktime', 'video/x-msvideo',
        'video/webm', 'video/ogg', 'video/3gpp', 'video/x-flv'
      ];
      
      if (validVideoTypes.includes(type)) {
        return { valid: true };
      }
      
      return { valid: false, error: `Invalid video content type: ${type}` };
    }

    return { valid: false, error: `Unknown expected type: ${expectedType}` };
  }

  // Dimension Validation
  validateImageDimensions(width, height, requirements = {}) {
    const errors = [];

    if (!width || !height) {
      errors.push('Invalid dimensions: width and height must be provided');
      return { valid: false, errors };
    }

    if (width < 1 || height < 1) {
      errors.push('Dimensions must be greater than 0');
    }

    if (requirements.minWidth && width < requirements.minWidth) {
      errors.push(`Width too small: ${width} (minimum: ${requirements.minWidth})`);
    }

    if (requirements.maxWidth && width > requirements.maxWidth) {
      errors.push(`Width too large: ${width} (maximum: ${requirements.maxWidth})`);
    }

    if (requirements.minHeight && height < requirements.minHeight) {
      errors.push(`Height too small: ${height} (minimum: ${requirements.minHeight})`);
    }

    if (requirements.maxHeight && height > requirements.maxHeight) {
      errors.push(`Height too large: ${height} (maximum: ${requirements.maxHeight})`);
    }

    if (requirements.aspectRatio) {
      const actualRatio = width / height;
      const expectedRatio = requirements.aspectRatio;
      const tolerance = requirements.aspectRatioTolerance || 0.1;
      
      if (Math.abs(actualRatio - expectedRatio) > tolerance) {
        errors.push(`Aspect ratio mismatch: ${actualRatio.toFixed(2)} (expected: ${expectedRatio})`);
      }
    }

    if (requirements.orientation) {
      const actualOrientation = width > height ? 'landscape' : width < height ? 'portrait' : 'square';
      if (actualOrientation !== requirements.orientation) {
        errors.push(`Wrong orientation: ${actualOrientation} (expected: ${requirements.orientation})`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      dimensions: { width, height },
      aspectRatio: width / height,
      orientation: width > height ? 'landscape' : width < height ? 'portrait' : 'square'
    };
  }

  // Batch Validation
  async validateImageBatch(filePaths, options = {}) {
    const results = [];
    const batchSize = options.batchSize || 10;
    
    for (let i = 0; i < filePaths.length; i += batchSize) {
      const batch = filePaths.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(async (filePath) => {
          try {
            const result = await this.validateImageFile(filePath);
            return { filePath, ...result };
          } catch (error) {
            return {
              filePath,
              valid: false,
              errors: [error.message]
            };
          }
        })
      );
      
      results.push(...batchResults);
    }
    
    return results;
  }

  // Utility Methods
  getFileFormat(filePath) {
    const extension = path.extname(filePath).toLowerCase().substring(1);
    return extension;
  }

  isSupportedImageFormat(format) {
    return this.supportedImageFormats.includes(format.toLowerCase());
  }

  isSupportedVideoFormat(format) {
    return this.supportedVideoFormats.includes(format.toLowerCase());
  }

  getMimeType(filePath) {
    return mime.lookup(filePath) || 'application/octet-stream';
  }

  // Security Validation
  validateFilename(filename) {
    const errors = [];
    
    if (!filename || filename.trim() === '') {
      errors.push('Filename cannot be empty');
    }
    
    // Check for dangerous characters
    const dangerousChars = ['..', '/', '\\', ':', '*', '?', '"', '<', '>', '|'];
    for (const char of dangerousChars) {
      if (filename.includes(char)) {
        errors.push(`Filename contains dangerous character: ${char}`);
      }
    }
    
    // Check length
    if (filename.length > 255) {
      errors.push('Filename too long (max 255 characters)');
    }
    
    // Check for reserved names (Windows)
    const reservedNames = ['CON', 'PRN', 'AUX', 'NUL', 'COM1', 'COM2', 'COM3', 'COM4', 'COM5', 'COM6', 'COM7', 'COM8', 'COM9', 'LPT1', 'LPT2', 'LPT3', 'LPT4', 'LPT5', 'LPT6', 'LPT7', 'LPT8', 'LPT9'];
    const nameWithoutExtension = path.parse(filename).name.toUpperCase();
    
    if (reservedNames.includes(nameWithoutExtension)) {
      errors.push(`Filename uses reserved name: ${nameWithoutExtension}`);
    }
    
    return {
      valid: errors.length === 0,
      errors,
      sanitized: this.sanitizeFilename(filename)
    };
  }

  sanitizeFilename(filename) {
    return filename
      .replace(/[\/\\:*?"<>|]/g, '_') // Replace dangerous chars
      .replace(/\.+/g, '.') // Replace multiple dots
      .replace(/^\./, '_') // Don't start with dot
      .slice(0, 255); // Limit length
  }
}