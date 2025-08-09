import axios from 'axios';
import { config } from '../config/config.js';

export class UnsplashClient {
  constructor() {
    this.accessKey = config.apis.unsplash.accessKey;
    this.secretKey = config.apis.unsplash.secretKey;
    this.baseUrl = config.apis.unsplash.baseUrl;
    this.rateLimit = config.apis.unsplash.rateLimit;
    this.perPage = config.apis.unsplash.perPage;
    
    if (!this.accessKey) {
      throw new Error('Unsplash access key is required');
    }

    this.client = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Authorization': `Client-ID ${this.accessKey}`,
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

  async searchPhotos(query, options = {}) {
    await this.checkRateLimit();
    
    const params = {
      query,
      page: options.page || 1,
      per_page: Math.min(options.perPage || 10, this.perPage),
      order_by: options.orderBy || 'relevant',
      collections: options.collections || undefined,
      content_filter: options.contentFilter || 'low',
      color: options.color || undefined,
      orientation: options.orientation || undefined
    };

    try {
      const response = await this.client.get('/search/photos', { params });
      this.requestCount++;
      
      return {
        results: response.data.results.map(photo => ({
          id: photo.id,
          createdAt: photo.created_at,
          updatedAt: photo.updated_at,
          width: photo.width,
          height: photo.height,
          color: photo.color,
          blurHash: photo.blur_hash,
          downloads: photo.downloads,
          likes: photo.likes,
          description: photo.description,
          altDescription: photo.alt_description,
          urls: {
            raw: photo.urls.raw,
            full: photo.urls.full,
            regular: photo.urls.regular,
            small: photo.urls.small,
            thumb: photo.urls.thumb,
            smallS3: photo.urls.small_s3
          },
          links: photo.links,
          user: {
            id: photo.user.id,
            username: photo.user.username,
            name: photo.user.name,
            firstName: photo.user.first_name,
            lastName: photo.user.last_name,
            instagramUsername: photo.user.instagram_username,
            twitterUsername: photo.user.twitter_username,
            portfolioUrl: photo.user.portfolio_url,
            bio: photo.user.bio,
            location: photo.user.location,
            totalLikes: photo.user.total_likes,
            totalPhotos: photo.user.total_photos,
            totalCollections: photo.user.total_collections,
            profileImage: photo.user.profile_image,
            links: photo.user.links
          },
          tags: photo.tags || [],
          sponsorship: photo.sponsorship
        })),
        total: response.data.total,
        totalPages: response.data.total_pages
      };
    } catch (error) {
      throw new Error(`Unsplash search failed: ${error.response?.data?.errors?.join(', ') || error.message}`);
    }
  }

  async getRandomPhotos(options = {}) {
    await this.checkRateLimit();
    
    const params = {
      collections: options.collections || undefined,
      topics: options.topics || undefined,
      username: options.username || undefined,
      query: options.query || undefined,
      orientation: options.orientation || undefined,
      content_filter: options.contentFilter || 'low',
      count: Math.min(options.count || 1, 30) // Unsplash max is 30
    };

    try {
      const response = await this.client.get('/photos/random', { params });
      this.requestCount++;
      
      const photos = Array.isArray(response.data) ? response.data : [response.data];
      
      return photos.map(photo => ({
        id: photo.id,
        createdAt: photo.created_at,
        updatedAt: photo.updated_at,
        width: photo.width,
        height: photo.height,
        color: photo.color,
        blurHash: photo.blur_hash,
        downloads: photo.downloads,
        likes: photo.likes,
        description: photo.description,
        altDescription: photo.alt_description,
        urls: photo.urls,
        links: photo.links,
        user: photo.user,
        exif: photo.exif,
        location: photo.location,
        tags: photo.tags || []
      }));
    } catch (error) {
      throw new Error(`Unsplash random photos failed: ${error.response?.data?.errors?.join(', ') || error.message}`);
    }
  }

  async getPhotoById(id) {
    await this.checkRateLimit();
    
    try {
      const response = await this.client.get(`/photos/${id}`);
      this.requestCount++;
      
      return response.data;
    } catch (error) {
      throw new Error(`Unsplash get photo by ID failed: ${error.response?.data?.errors?.join(', ') || error.message}`);
    }
  }

  async downloadPhoto(id) {
    await this.checkRateLimit();
    
    try {
      const response = await this.client.get(`/photos/${id}/download`);
      this.requestCount++;
      
      return response.data;
    } catch (error) {
      throw new Error(`Unsplash download photo failed: ${error.response?.data?.errors?.join(', ') || error.message}`);
    }
  }

  async searchCollections(query, options = {}) {
    await this.checkRateLimit();
    
    const params = {
      query,
      page: options.page || 1,
      per_page: Math.min(options.perPage || 10, this.perPage)
    };

    try {
      const response = await this.client.get('/search/collections', { params });
      this.requestCount++;
      
      return {
        results: response.data.results.map(collection => ({
          id: collection.id,
          title: collection.title,
          description: collection.description,
          publishedAt: collection.published_at,
          lastCollectedAt: collection.last_collected_at,
          updatedAt: collection.updated_at,
          totalPhotos: collection.total_photos,
          private: collection.private,
          shareKey: collection.share_key,
          tags: collection.tags || [],
          coverPhoto: collection.cover_photo,
          previewPhotos: collection.preview_photos || [],
          user: collection.user,
          links: collection.links
        })),
        total: response.data.total,
        totalPages: response.data.total_pages
      };
    } catch (error) {
      throw new Error(`Unsplash search collections failed: ${error.response?.data?.errors?.join(', ') || error.message}`);
    }
  }

  async getCollectionPhotos(id, options = {}) {
    await this.checkRateLimit();
    
    const params = {
      page: options.page || 1,
      per_page: Math.min(options.perPage || 10, this.perPage),
      orientation: options.orientation || undefined
    };

    try {
      const response = await this.client.get(`/collections/${id}/photos`, { params });
      this.requestCount++;
      
      return response.data.map(photo => ({
        id: photo.id,
        createdAt: photo.created_at,
        updatedAt: photo.updated_at,
        width: photo.width,
        height: photo.height,
        color: photo.color,
        blurHash: photo.blur_hash,
        likes: photo.likes,
        description: photo.description,
        altDescription: photo.alt_description,
        urls: photo.urls,
        links: photo.links,
        user: photo.user
      }));
    } catch (error) {
      throw new Error(`Unsplash get collection photos failed: ${error.response?.data?.errors?.join(', ') || error.message}`);
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