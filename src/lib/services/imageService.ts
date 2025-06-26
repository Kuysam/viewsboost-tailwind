// Image service for optimizing and testing image loading
// Provides URL optimization and image load testing functionality

export interface ImageLoadResult {
  success: boolean;
  url: string;
  width?: number;
  height?: number;
  error?: string;
}

export class ImageService {
  /**
   * Get optimized image URL with width, height, and quality parameters
   */
  static getOptimizedImageUrl(
    originalUrl: string, 
    width: number = 800, 
    height: number = 600, 
    quality: 'low' | 'medium' | 'high' = 'medium'
  ): string {
    if (!originalUrl) {
      return '';
    }

    // If it's a local image or already optimized, return as-is
    if (originalUrl.startsWith('/') || originalUrl.startsWith('./')) {
      return originalUrl;
    }

    // For external URLs, try to optimize based on the service
    try {
      const url = new URL(originalUrl);
      
      // Unsplash optimization
      if (url.hostname.includes('unsplash.com') || url.hostname.includes('images.unsplash.com')) {
        const baseUrl = originalUrl.split('?')[0];
        const qualityMap = { low: 50, medium: 75, high: 90 };
        return `${baseUrl}?w=${width}&h=${height}&q=${qualityMap[quality]}&fit=crop&crop=entropy`;
      }
      
      // Pexels optimization
      if (url.hostname.includes('pexels.com') || url.hostname.includes('images.pexels.com')) {
        const baseUrl = originalUrl.split('?')[0];
        return `${baseUrl}?w=${width}&h=${height}&auto=compress&cs=tinysrgb`;
      }
      
      // Pixabay optimization
      if (url.hostname.includes('pixabay.com')) {
        // Pixabay uses different URL structure, try to maintain original
        return originalUrl;
      }
      
      // For other URLs, return as-is
      return originalUrl;
      
    } catch (error) {
      console.warn('Failed to optimize image URL:', originalUrl, error);
      return originalUrl;
    }
  }

  /**
   * Test if an image URL loads successfully
   */
  static async testImageLoad(url: string): Promise<ImageLoadResult> {
    if (!url) {
      return {
        success: false,
        url,
        error: 'No URL provided'
      };
    }

    return new Promise((resolve) => {
      const img = new Image();
      const timeout = setTimeout(() => {
        resolve({
          success: false,
          url,
          error: 'Image load timeout'
        });
      }, 5000); // 5 second timeout

      img.onload = () => {
        clearTimeout(timeout);
        resolve({
          success: true,
          url,
          width: img.naturalWidth,
          height: img.naturalHeight
        });
      };

      img.onerror = () => {
        clearTimeout(timeout);
        resolve({
          success: false,
          url,
          error: 'Image failed to load'
        });
      };

      // Set crossOrigin to avoid CORS issues
      img.crossOrigin = 'anonymous';
      img.src = url;
    });
  }

  /**
   * Preload multiple images
   */
  static async preloadImages(urls: string[]): Promise<ImageLoadResult[]> {
    const promises = urls.map(url => this.testImageLoad(url));
    return Promise.all(promises);
  }

  /**
   * Get fallback image URL if original fails
   */
  static getFallbackImageUrl(width: number = 800, height: number = 600): string {
    return `data:image/svg+xml,${encodeURIComponent(`
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#1a1a1a"/>
        <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="16" fill="#666" text-anchor="middle" dominant-baseline="middle">
          Image not available
        </text>
      </svg>
    `)}`;
  }
} 