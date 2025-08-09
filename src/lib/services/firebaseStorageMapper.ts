// Firebase Storage ↔ Template Mapping Service
// Maps template titles to actual Firebase Storage file names

import { FIREBASE_STORAGE_MAPPINGS } from '../../../suggested-firebase-mappings';

export class FirebaseStorageMapper {
  
  /**
   * Convert template title to expected filename format
   * Based on the pattern used in scripts/update-firestore-template-videos.cjs
   */
  static titleToFilename(title: string, extension: string = '.mp4'): string {
    if (!title) return '';
    
    return title
      .replace(/\s+/g, '') // Remove spaces
      .toLowerCase() + extension;
  }

  /**
   * Advanced title normalization for complex template names
   */
  static normalizeTitle(title: string): string {
    if (!title) return '';
    
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '') // Remove all non-alphanumeric characters
      .trim();
  }

  /**
   * Generate Firebase Storage public URL for a template
   * ✅ FIXED: Using correct bucket name viewsboostv2.firebasestorage.app
   */
  static generateStorageUrl(title: string, fileType: 'video' | 'image' = 'video'): string {
    if (!title) return '';
    
    const bucketName = 'viewsboostv2.firebasestorage.app'; // ✅ CORRECTED BUCKET NAME
    let folder = '';
    let extension = '';
    
    switch (fileType) {
      case 'video':
        folder = 'Templates%2FVideo%2F';
        extension = '.mp4';
        break;
      case 'image':
        folder = 'Templates%2FImages%2F';
        extension = '.jpg';
        break;
    }
    
    const filename = this.titleToFilename(title, extension);
    const encodedFilename = encodeURIComponent(filename);
    
    return `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${folder}${encodedFilename}?alt=media`;
  }

  /**
   * EMERGENCY FALLBACK: Use placeholder images when no files exist
   * This prevents the app from breaking while we fix the file structure
   */
  static getEmergencyFallbacks(): Record<string, { video?: string, image?: string }> {
    return {
      // Use publicly available placeholder images
      'default': {
        image: 'https://via.placeholder.com/1920x1080/333/fff?text=Template+Preview',
      },
      'tiktok6': {
        image: 'https://via.placeholder.com/1080x1920/ff6b6b/fff?text=TikTok+Video',
      },
      'vlogger': {
        image: 'https://via.placeholder.com/1920x1080/4ecdc4/fff?text=Vlogger+Stream',
      },
      'business': {
        image: 'https://via.placeholder.com/1920x1080/45b7d1/fff?text=Business+Template',
      },
    };
  }

  /**
   * Get exact filename mappings based on Firebase extraction report
   * ✅ AUTO-GENERATED: From firebase-data-extraction-report.json
   */
  static getKnownFileMappings(): Record<string, { video?: string, image?: string }> {
    // ✅ AUTO-GENERATED: Import all 67 verified Firebase Storage mappings
    return FIREBASE_STORAGE_MAPPINGS;
  }

  /**
   * Generate multiple possible URLs for a template
   * ✅ FIXED: Uses correct bucket name
   */
  static generatePossibleUrls(title: string): { video: string[], image: string[] } {
    if (!title) return { video: [], image: [] };
    
    const bucketName = 'viewsboostv2.firebasestorage.app'; // ✅ CORRECTED BUCKET NAME
    const baseTitle = title.toLowerCase();
    
    // Different filename variations to try
    const variations = [
      baseTitle.replace(/\s+/g, ''), // "tiktok6"
      baseTitle.replace(/\s+/g, '_'), // "tiktok_6"
      baseTitle.replace(/\s+/g, '-'), // "tiktok-6"
      baseTitle, // "tiktok 6"
      title, // Original case
    ];

    const videoUrls = [];
    const imageUrls = [];

    // Video extensions to try
    const videoExtensions = ['.mp4', '.mov', '.webm', '.avi'];
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp'];

    for (const variation of variations) {
      // Video URLs
      for (const ext of videoExtensions) {
        const filename = variation + ext;
        const encodedFilename = encodeURIComponent(filename);
        videoUrls.push(`https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/Templates%2FVideo%2F${encodedFilename}?alt=media`);
      }

      // Image URLs
      for (const ext of imageExtensions) {
        const filename = variation + ext;
        const encodedFilename = encodeURIComponent(filename);
        imageUrls.push(`https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/Templates%2FImages%2F${encodedFilename}?alt=media`);
      }
    }

    return { video: videoUrls, image: imageUrls };
  }

  /**
   * Test if a URL exists and is accessible
   */
  static async testUrl(url: string): Promise<boolean> {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      return response.ok;
    } catch (error) {
      // Silently fail to prevent console spam
      return false;
    }
  }

  /**
   * Find the first working URL from a list of possibilities
   */
  static async findWorkingUrl(urls: string[]): Promise<string | null> {
    for (const url of urls) {
      const works = await this.testUrl(url);
      if (works) {
        console.log('✅ Found working URL:', url);
        return url;
      }
    }
    console.log('❌ No working URLs found from', urls.length, 'possibilities');
    return null;
  }

  /**
   * Get the best possible URL for a template
   * ✅ OPTIMIZED: Prioritize known mappings, avoid HTTP testing, provide immediate placeholders
   */
  static async getBestUrl(title: string, preferVideo: boolean = true): Promise<{ url: string | null, type: 'video' | 'image' | null }> {
    if (!title) return { url: null, type: null };

    console.log('🔍 Finding best URL for template:', title);
    const titleKey = title.toLowerCase().replace(/\s+/g, '');
    
    // ✅ PRIORITY 1: Check known mappings first (no testing, trust the mappings)
    const knownMappings = this.getKnownFileMappings();
    
    if (knownMappings[titleKey]) {
      const mapping = knownMappings[titleKey];
      console.log('✅ Found exact mapping for:', titleKey, mapping);
      
      if (preferVideo && mapping.video) {
        const videoUrl = `https://firebasestorage.googleapis.com/v0/b/viewsboostv2.firebasestorage.app/o/${mapping.video}?alt=media`;
        console.log('📺 Using known video mapping:', videoUrl);
        return { url: videoUrl, type: 'video' };
      }
      if (mapping.image) {
        const imageUrl = `https://firebasestorage.googleapis.com/v0/b/viewsboostv2.firebasestorage.app/o/${mapping.image}?alt=media`;
        console.log('🖼️ Using known image mapping:', imageUrl);
        return { url: imageUrl, type: 'image' };
      }
    }
    
    // ✅ PRIORITY 2: Try common variations without HTTP testing
    const variations = [
      title.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, ''),
      title.toLowerCase().replace(/\s+/g, '_'),
      title.toLowerCase().replace(/\s+/g, '-'),
      title.toLowerCase().substring(0, 10).replace(/\s+/g, '')
    ];
    
    for (const variation of variations) {
      if (knownMappings[variation]) {
        console.log('✅ Found mapping with variation:', variation, knownMappings[variation]);
        const mapping = knownMappings[variation];
        if (preferVideo && mapping.video) {
          const videoUrl = `https://firebasestorage.googleapis.com/v0/b/viewsboostv2.firebasestorage.app/o/${mapping.video}?alt=media`;
          return { url: videoUrl, type: 'video' };
        }
        if (mapping.image) {
          const imageUrl = `https://firebasestorage.googleapis.com/v0/b/viewsboostv2.firebasestorage.app/o/${mapping.image}?alt=media`;
          return { url: imageUrl, type: 'image' };
        }
      }
    }

    // ✅ PRIORITY 3: Return high-quality placeholder immediately (no HTTP testing)
    console.log('🎨 No mapping found, providing high-quality placeholder for:', title);
    const placeholderUrl = this.generateHighQualityPlaceholder(title, preferVideo);
    return { 
      url: placeholderUrl, 
      type: preferVideo ? 'video' : 'image' 
    };
  }

  /**
   * Generate high-quality placeholder for templates without actual files
   */
  static generateHighQualityPlaceholder(title: string, preferVideo: boolean = false): string {
    const encodedTitle = encodeURIComponent(title);
    const backgroundColor = preferVideo ? '1f2937' : '374151'; // Darker for video, lighter for image
    const textColor = 'ffffff';
    const dimensions = preferVideo ? '1080x1920' : '1920x1080'; // Portrait for video, landscape for image
    
    // ✅ Use multiple placeholder services for reliability
    const placeholderServices = [
      `https://placehold.co/${dimensions}/${backgroundColor}/${textColor}?text=${encodedTitle}`,
      `https://picsum.photos/${dimensions.split('x')[0]}/${dimensions.split('x')[1]}?grayscale&blur=1`,
      `https://dummyimage.com/${dimensions}/${backgroundColor}/${textColor}&text=${encodedTitle}`,
    ];
    
    // Return the first service for now, can be made more robust later
    return placeholderServices[0];
  }

  /**
   * Fix template URLs by finding actual working Storage URLs
   */
  static async fixTemplateUrls(template: any): Promise<any> {
    if (!template || !template.title) {
      return template;
    }

    console.log('🔧 Fixing URLs for template:', template.title);

    // Try to find working URLs - prioritize video if template type suggests it should be video
    const preferVideo = template.type === 'video' || 
                       template.title?.toLowerCase().includes('tiktok') ||
                       template.title?.toLowerCase().includes('tikinsta') ||
                       template.title?.toLowerCase().includes('fcb') ||
                       template.category?.toLowerCase().includes('video') ||
                       template.videoSource?.includes('.mp4');
                       
    console.log('🎯 Video preference analysis:', {
      title: template.title,
      type: template.type,
      preferVideo,
      category: template.category
    });
    
    const result = await this.getBestUrl(template.title, preferVideo);

    if (result.url) {
      return {
        ...template,
        videoSource: result.type === 'video' ? result.url : template.videoSource,
        imageUrl: result.type === 'image' ? result.url : template.imageUrl,
        preview: result.url,
        type: result.type
      };
    }

    // No working URL found - return original template
    console.log('⚠️ Could not fix URLs for template:', template.title);
    return template;
  }
}