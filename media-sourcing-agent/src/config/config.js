import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

export const config = {
  // API Configuration
  apis: {
    pexels: {
      apiKey: process.env.PEXELS_API_KEY,
      baseUrl: 'https://api.pexels.com/v1',
      videoBaseUrl: 'https://api.pexels.com/videos',
      rateLimit: parseInt(process.env.PEXELS_RATE_LIMIT) || 200,
      perPage: 80 // Pexels max per page
    },
    unsplash: {
      accessKey: process.env.UNSPLASH_ACCESS_KEY,
      secretKey: process.env.UNSPLASH_SECRET_KEY,
      baseUrl: 'https://api.unsplash.com',
      rateLimit: parseInt(process.env.UNSPLASH_RATE_LIMIT) || 50,
      perPage: 30 // Unsplash max per page
    }
  },

  // Storage Configuration
  storage: {
    downloadsPath: process.env.DOWNLOADS_PATH || './downloads',
    imagesPath: process.env.IMAGES_PATH || './downloads/images',
    videosPath: process.env.VIDEOS_PATH || './downloads/videos',
    tempPath: process.env.TEMP_PATH || './downloads/temp',
    processedPath: process.env.PROCESSED_PATH || './downloads/processed',
    logsPath: process.env.LOGS_PATH || './logs'
  },

  // Media Processing Configuration
  media: {
    maxImageSize: parseInt(process.env.MAX_IMAGE_SIZE) || 5242880, // 5MB
    maxVideoSize: parseInt(process.env.MAX_VIDEO_SIZE) || 104857600, // 100MB
    supportedImageFormats: (process.env.SUPPORTED_IMAGE_FORMATS || 'jpg,jpeg,png,webp').split(','),
    supportedVideoFormats: (process.env.SUPPORTED_VIDEO_FORMATS || 'mp4,mov,avi').split(',')
  },

  // Rate Limiting Configuration
  rateLimiting: {
    concurrentDownloads: parseInt(process.env.CONCURRENT_DOWNLOADS) || 5,
    requestDelay: parseInt(process.env.REQUEST_DELAY) || 1000
  },

  // Queue Configuration
  queue: {
    concurrency: parseInt(process.env.QUEUE_CONCURRENCY) || 3,
    retryAttempts: parseInt(process.env.QUEUE_RETRY_ATTEMPTS) || 3,
    retryDelay: parseInt(process.env.QUEUE_RETRY_DELAY) || 2000
  },

  // Logging Configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    fileSize: parseInt(process.env.LOG_FILE_SIZE) || 10485760, // 10MB
    maxFiles: parseInt(process.env.LOG_MAX_FILES) || 5
  }
};

export default config;