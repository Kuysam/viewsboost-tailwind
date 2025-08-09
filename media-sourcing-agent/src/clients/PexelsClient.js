import axios from 'axios';
import { config } from '../config/config.js';

export class PexelsClient {
  constructor() {
    this.apiKey = config.apis.pexels.apiKey;
    this.baseUrl = config.apis.pexels.baseUrl;
    this.videoBaseUrl = config.apis.pexels.videoBaseUrl;
    this.rateLimit = config.apis.pexels.rateLimit;
    this.perPage = config.apis.pexels.perPage;
    
    if (!this.apiKey) {
      throw new Error('Pexels API key is required');
    }

    this.client = axios.create({
      headers: {
        'Authorization': this.apiKey,
        'User-Agent': 'MediaSourcingAgent/1.0'
      }
    });

    this.requestCount = 0;
    this.resetTime = Date.now() + 3600000; // Reset every hour
  }

  async checkRateLimit() {
    if (Date.now() > this.resetTime) {
      this.requestCount = 0;
      this.resetTime = Date.now() + 3600000;
    }

    if (this.requestCount >= this.rateLimit) {
      const waitTime = this.resetTime - Date.now();
      throw new Error(`Rate limit exceeded. Reset in ${Math.ceil(waitTime / 1000)} seconds`);
    }
  }

  async searchImages(query, options = {}) {
    await this.checkRateLimit();
    
    const params = {
      query,
      per_page: Math.min(options.perPage || 15, this.perPage),
      page: options.page || 1,
      orientation: options.orientation || 'all',
      size: options.size || 'all',
      color: options.color || undefined,
      locale: options.locale || 'en-US'
    };

    try {
      const response = await this.client.get(`${this.baseUrl}/search`, { params });
      this.requestCount++;
      
      return {
        photos: response.data.photos.map(photo => ({
          id: photo.id,
          url: photo.url,
          photographer: photo.photographer,
          photographerUrl: photo.photographer_url,
          avgColor: photo.avg_color,
          src: {
            original: photo.src.original,
            large2x: photo.src.large2x,
            large: photo.src.large,
            medium: photo.src.medium,
            small: photo.src.small,
            portrait: photo.src.portrait,
            landscape: photo.src.landscape,
            tiny: photo.src.tiny
          },
          width: photo.width,
          height: photo.height,
          alt: photo.alt
        })),
        totalResults: response.data.total_results,
        page: response.data.page,
        perPage: response.data.per_page,
        nextPage: response.data.next_page
      };
    } catch (error) {
      throw new Error(`Pexels image search failed: ${error.response?.data?.error || error.message}`);
    }
  }

  async searchVideos(query, options = {}) {
    await this.checkRateLimit();
    
    const params = {
      query,
      per_page: Math.min(options.perPage || 15, this.perPage),
      page: options.page || 1,
      orientation: options.orientation || 'all',
      size: options.size || 'all',
      locale: options.locale || 'en-US'
    };

    try {
      const response = await this.client.get(`${this.videoBaseUrl}/search`, { params });
      this.requestCount++;
      
      return {
        videos: response.data.videos.map(video => ({
          id: video.id,
          url: video.url,
          duration: video.duration,
          width: video.width,
          height: video.height,
          user: {
            id: video.user.id,
            name: video.user.name,
            url: video.user.url
          },
          videoFiles: video.video_files.map(file => ({
            id: file.id,
            quality: file.quality,
            fileType: file.file_type,
            width: file.width,
            height: file.height,
            link: file.link
          })),
          videoPictures: video.video_pictures.map(picture => ({
            id: picture.id,
            picture: picture.picture,
            nr: picture.nr
          }))
        })),
        totalResults: response.data.total_results,
        page: response.data.page,
        perPage: response.data.per_page,
        nextPage: response.data.next_page
      };
    } catch (error) {
      throw new Error(`Pexels video search failed: ${error.response?.data?.error || error.message}`);
    }
  }

  async getCuratedImages(options = {}) {
    await this.checkRateLimit();
    
    const params = {
      per_page: Math.min(options.perPage || 15, this.perPage),
      page: options.page || 1
    };

    try {
      const response = await this.client.get(`${this.baseUrl}/curated`, { params });
      this.requestCount++;
      
      return {
        photos: response.data.photos.map(photo => ({
          id: photo.id,
          url: photo.url,
          photographer: photo.photographer,
          photographerUrl: photo.photographer_url,
          avgColor: photo.avg_color,
          src: photo.src,
          width: photo.width,
          height: photo.height,
          alt: photo.alt
        })),
        page: response.data.page,
        perPage: response.data.per_page,
        nextPage: response.data.next_page
      };
    } catch (error) {
      throw new Error(`Pexels curated images failed: ${error.response?.data?.error || error.message}`);
    }
  }

  async getPopularVideos(options = {}) {
    await this.checkRateLimit();
    
    const params = {
      per_page: Math.min(options.perPage || 15, this.perPage),
      page: options.page || 1
    };

    try {
      const response = await this.client.get(`${this.videoBaseUrl}/popular`, { params });
      this.requestCount++;
      
      return {
        videos: response.data.videos.map(video => ({
          id: video.id,
          url: video.url,
          duration: video.duration,
          width: video.width,
          height: video.height,
          user: video.user,
          videoFiles: video.video_files,
          videoPictures: video.video_pictures
        })),
        page: response.data.page,
        perPage: response.data.per_page,
        nextPage: response.data.next_page
      };
    } catch (error) {
      throw new Error(`Pexels popular videos failed: ${error.response?.data?.error || error.message}`);
    }
  }

  async getImageById(id) {
    await this.checkRateLimit();
    
    try {
      const response = await this.client.get(`${this.baseUrl}/photos/${id}`);
      this.requestCount++;
      
      return response.data;
    } catch (error) {
      throw new Error(`Pexels get image by ID failed: ${error.response?.data?.error || error.message}`);
    }
  }

  async getVideoById(id) {
    await this.checkRateLimit();
    
    try {
      const response = await this.client.get(`${this.videoBaseUrl}/videos/${id}`);
      this.requestCount++;
      
      return response.data;
    } catch (error) {
      throw new Error(`Pexels get video by ID failed: ${error.response?.data?.error || error.message}`);
    }
  }

  getRateLimitStatus() {
    return {
      requestCount: this.requestCount,
      limit: this.rateLimit,
      remaining: this.rateLimit - this.requestCount,
      resetTime: this.resetTime
    };
  }
}