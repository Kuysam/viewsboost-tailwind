import { fabric } from 'fabric';
import { addMediaLayer } from '../../../utils/canvasMedia';
import { FirebaseStorageMapper } from '../../../lib/services/firebaseStorageMapper';

// Enhanced media service that integrates with ViewsBoost's existing media infrastructure
export class ViewsBoostMediaService {
  private static instance: ViewsBoostMediaService;
  private mediaCache = new Map<string, { url: string; type: 'image' | 'video'; timestamp: number }>();
  private readonly CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

  static getInstance(): ViewsBoostMediaService {
    if (!ViewsBoostMediaService.instance) {
      ViewsBoostMediaService.instance = new ViewsBoostMediaService();
    }
    return ViewsBoostMediaService.instance;
  }

  // Load image from URL with Firebase Storage fallback
  async loadImage(url: string, title?: string): Promise<fabric.Image | null> {
    try {
      console.log('[ViewsBoostMediaService] Loading image:', url);
      
      // Try direct URL first
      let workingUrl = await this.validateUrl(url);
      
      // If direct URL fails and we have a title, try Firebase Storage
      if (!workingUrl && title) {
        const firebaseResult = await FirebaseStorageMapper.getBestUrl(title, false);
        if (firebaseResult.url && firebaseResult.type === 'image') {
          workingUrl = firebaseResult.url;
          console.log('[ViewsBoostMediaService] Using Firebase Storage image:', workingUrl);
        }
      }

      // If still no working URL, use placeholder
      if (!workingUrl) {
        workingUrl = this.generatePlaceholder(title || 'Image', 'image');
        console.log('[ViewsBoostMediaService] Using placeholder image:', workingUrl);
      }

      return new Promise((resolve) => {
        fabric.Image.fromURL(
          workingUrl!,
          (img) => {
            if (img) {
              console.log('[ViewsBoostMediaService] Successfully loaded image:', workingUrl);
              // Cache successful URL
              this.cacheMedia(title || url, workingUrl!, 'image');
            } else {
              console.warn('[ViewsBoostMediaService] Failed to load image:', workingUrl);
            }
            resolve(img);
          },
          { crossOrigin: 'anonymous' }
        );
      });
    } catch (error) {
      console.error('[ViewsBoostMediaService] Image loading error:', error);
      return null;
    }
  }

  // Load video using existing canvasMedia utility with Firebase Storage integration
  async loadVideo(canvas: fabric.Canvas, url: string, options: {
    title?: string;
    x?: number;
    y?: number;
    width?: number;
    autoplay?: boolean;
    loop?: boolean;
    muted?: boolean;
  } = {}): Promise<boolean> {
    try {
      console.log('[ViewsBoostMediaService] Loading video:', url);
      
      // Try direct URL first
      let workingUrl = await this.validateUrl(url);
      
      // If direct URL fails and we have a title, try Firebase Storage
      if (!workingUrl && options.title) {
        const firebaseResult = await FirebaseStorageMapper.getBestUrl(options.title, true);
        if (firebaseResult.url && firebaseResult.type === 'video') {
          workingUrl = firebaseResult.url;
          console.log('[ViewsBoostMediaService] Using Firebase Storage video:', workingUrl);
        }
      }

      if (!workingUrl) {
        console.warn('[ViewsBoostMediaService] No working video URL found, falling back to image');
        // Try to load as image instead
        if (options.title) {
          const imageResult = await FirebaseStorageMapper.getBestUrl(options.title, false);
          if (imageResult.url) {
            const img = await this.loadImage(imageResult.url, options.title);
            if (img) {
              img.set({
                left: options.x || 0,
                top: options.y || 0,
              });
              if (options.width) {
                img.scaleToWidth(options.width);
              }
              canvas.add(img);
              return true;
            }
          }
        }
        return false;
      }

      // Use existing canvasMedia utility for video loading
      await addMediaLayer(canvas, {
        type: 'video',
        url: workingUrl,
        x: options.x,
        y: options.y,
        w: options.width,
        autoplay: options.autoplay ?? true,
        loop: options.loop ?? true,
        muted: options.muted ?? true
      });

      // Cache successful URL
      this.cacheMedia(options.title || url, workingUrl, 'video');
      console.log('[ViewsBoostMediaService] Successfully loaded video:', workingUrl);
      return true;
    } catch (error) {
      console.error('[ViewsBoostMediaService] Video loading error:', error);
      return false;
    }
  }

  // Add media layer to canvas with intelligent fallback
  async addMediaToCanvas(canvas: fabric.Canvas, mediaConfig: {
    type: 'image' | 'video';
    url?: string;
    title?: string;
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    autoplay?: boolean;
    loop?: boolean;
    muted?: boolean;
  }): Promise<fabric.Object | null> {
    try {
      const { type, url, title, x = 0, y = 0, width, height } = mediaConfig;

      if (type === 'video') {
        const success = await this.loadVideo(canvas, url || '', {
          title,
          x,
          y,
          width,
          autoplay: mediaConfig.autoplay,
          loop: mediaConfig.loop,
          muted: mediaConfig.muted
        });
        
        if (success) {
          // Return the last added object (video)
          const objects = canvas.getObjects();
          return objects[objects.length - 1];
        }
      } else if (type === 'image') {
        const img = await this.loadImage(url || '', title);
        if (img) {
          img.set({ left: x, top: y });
          if (width) img.scaleToWidth(width);
          if (height && !width) img.scaleToHeight(height);
          canvas.add(img);
          return img;
        }
      }

      return null;
    } catch (error) {
      console.error('[ViewsBoostMediaService] Failed to add media to canvas:', error);
      return null;
    }
  }

  // Validate if a URL is accessible
  private async validateUrl(url: string): Promise<string | null> {
    if (!url) return null;
    
    // Check cache first
    const cached = this.getCachedMedia(url);
    if (cached) return cached.url;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      const response = await fetch(url, { 
        method: 'HEAD',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        return url;
      }
    } catch (error) {
      // URL validation failed
    }
    
    return null;
  }

  // Cache media URLs for performance
  private cacheMedia(key: string, url: string, type: 'image' | 'video'): void {
    this.mediaCache.set(key, {
      url,
      type,
      timestamp: Date.now()
    });
  }

  // Get cached media URL if still valid
  private getCachedMedia(key: string): { url: string; type: 'image' | 'video' } | null {
    const cached = this.mediaCache.get(key);
    if (cached && (Date.now() - cached.timestamp) < this.CACHE_DURATION) {
      return cached;
    }
    
    if (cached) {
      this.mediaCache.delete(key); // Remove expired cache
    }
    
    return null;
  }

  // Generate placeholder image/video
  private generatePlaceholder(title: string, type: 'image' | 'video'): string {
    return FirebaseStorageMapper.generateHighQualityPlaceholder(title, type === 'video');
  }

  // Preload media for better performance
  async preloadMedia(mediaList: Array<{ url?: string; title?: string; type: 'image' | 'video' }>): Promise<void> {
    console.log('[ViewsBoostMediaService] Preloading', mediaList.length, 'media items');
    
    const promises = mediaList.map(async (media) => {
      try {
        if (media.url) {
          await this.validateUrl(media.url);
        } else if (media.title) {
          await FirebaseStorageMapper.getBestUrl(media.title, media.type === 'video');
        }
      } catch (error) {
        // Ignore preload errors
      }
    });

    await Promise.allSettled(promises);
    console.log('[ViewsBoostMediaService] Preloading complete');
  }

  // Get media statistics
  getStats(): { cacheSize: number; cacheKeys: string[] } {
    return {
      cacheSize: this.mediaCache.size,
      cacheKeys: Array.from(this.mediaCache.keys())
    };
  }

  // Clear cache
  clearCache(): void {
    this.mediaCache.clear();
    console.log('[ViewsBoostMediaService] Cache cleared');
  }

  // Resolve media URL with all fallback strategies
  async resolveMediaUrl(options: {
    url?: string;
    title?: string;
    type: 'image' | 'video';
  }): Promise<string | null> {
    // 1. Try direct URL
    if (options.url) {
      const directUrl = await this.validateUrl(options.url);
      if (directUrl) return directUrl;
    }

    // 2. Try Firebase Storage with title
    if (options.title) {
      const firebaseResult = await FirebaseStorageMapper.getBestUrl(
        options.title, 
        options.type === 'video'
      );
      if (firebaseResult.url) return firebaseResult.url;
    }

    // 3. Return placeholder
    return this.generatePlaceholder(options.title || 'Media', options.type);
  }
}

// Export singleton instance
export const viewsBoostMediaService = ViewsBoostMediaService.getInstance();