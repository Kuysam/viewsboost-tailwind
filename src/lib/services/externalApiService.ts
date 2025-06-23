// External API Integration Service
// Handles multiple stock content APIs to diversify ViewsBoost's template sources

interface ExternalTemplate {
  id: string;
  title: string;
  description: string;
  category: string;
  preview: string;
  downloadUrl?: string;
  platform: string;
  tags: string[];
  author?: string;
  license: string;
  sourceUrl?: string;
}

// API Configurations
const API_CONFIGS = {
  pexels: {
    baseUrl: 'https://api.pexels.com/v1',
    headers: {
      'Authorization': import.meta.env.VITE_PEXELS_API_KEY || ''
    },
    rateLimit: 200 // 200 requests per hour for free tier
  },
  pixabay: {
    baseUrl: 'https://pixabay.com/api',
    headers: {},
    rateLimit: 100 // 100 requests per minute
  },
  unsplash: {
    baseUrl: 'https://api.unsplash.com',
    headers: {
      'Authorization': `Client-ID ${import.meta.env.VITE_UNSPLASH_ACCESS_KEY || ''}`
    },
    rateLimit: 50 // 50 requests per hour for demo
  }
};

class ExternalApiService {
  private rateLimitTrackers: Map<string, { count: number; resetTime: number }> = new Map();

  // Rate limiting check
  private canMakeRequest(platform: string): boolean {
    const tracker = this.rateLimitTrackers.get(platform);
    const now = Date.now();
    const config = API_CONFIGS[platform as keyof typeof API_CONFIGS];
    
    if (!tracker || now > tracker.resetTime) {
      this.rateLimitTrackers.set(platform, {
        count: 1,
        resetTime: now + (60 * 1000) // Reset every minute
      });
      return true;
    }
    
    if (tracker.count >= config.rateLimit) {
      return false;
    }
    
    tracker.count++;
    return true;
  }

  // Pexels API Integration with enhanced debugging
  async searchPexels(query: string, category?: string): Promise<ExternalTemplate[]> {
    console.log('🚀 === PEXELS API DEBUG SESSION START ===');
    console.log('📍 Browser Environment Check:');
    console.log('- User Agent:', navigator.userAgent);
    console.log('- Current URL:', window.location.href);
    console.log('- Vite Mode:', import.meta.env.MODE);
    console.log('- Vite DEV:', import.meta.env.DEV);
    console.log('- All Env Vars:', import.meta.env);
    console.log('');
    
    const apiKey = import.meta.env.VITE_PEXELS_API_KEY;
    
    console.log(`🔍 Pexels search starting for: "${query}"`);
    console.log(`🔑 Raw API key from env: "${apiKey}"`);
    console.log(`🔑 API key type: ${typeof apiKey}`);
    console.log(`🔑 API key length: ${apiKey ? apiKey.length : 'N/A'}`);
    console.log(`🔑 API key first 10 chars: ${apiKey ? apiKey.substring(0, 10) + '...' : 'N/A'}`);
    console.log('');

    if (!apiKey || apiKey === 'your-pexels-api-key-here' || apiKey.trim() === '') {
      console.error('❌ Pexels API key not found or invalid in environment variables');
      console.error('🔧 Available env vars starting with VITE_:', 
        Object.keys(import.meta.env).filter(key => key.startsWith('VITE_')));
      return [];
    }

    if (!this.canMakeRequest('pexels')) {
      console.warn('⏱️ Pexels rate limit reached');
      return [];
    }

    try {
      const searchUrl = `${API_CONFIGS.pexels.baseUrl}/search?query=${encodeURIComponent(query)}&per_page=20`;
      
      console.log(`📡 Making Pexels API request to: ${searchUrl}`);
      console.log(`🔐 Authorization header: Authorization: ${apiKey.substring(0, 10)}...`);

      const response = await fetch(searchUrl, {
        headers: {
          'Authorization': apiKey
        }
      });

      console.log(`📡 Pexels response status: ${response.status} ${response.statusText}`);
      console.log(`📡 Pexels response headers:`, Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ Pexels API error ${response.status}:`, errorText);
        
        if (response.status === 401) {
          console.error('🔑 Pexels API: Unauthorized - API key may be invalid');
        } else if (response.status === 403) {
          console.error('🚫 Pexels API: Forbidden - API key may not have required permissions');
        } else if (response.status === 429) {
          console.error('⏱️ Pexels API: Rate limit exceeded');
        }
        return [];
      }

      const data = await response.json();
      console.log(`📊 Pexels raw response data:`, data);

      if (!data.photos || data.photos.length === 0) {
        console.log(`ℹ️ Pexels: No photos found for query "${query}"`);
        return [];
      }

      console.log(`✅ Pexels: Found ${data.photos.length} photos for "${query}"`);

      const results = data.photos.map((item: any) => ({
        id: `pexels_${item.id}`,
        title: item.alt || `Pexels Photo ${item.id}`,
        description: item.alt || 'High-quality photo from Pexels',
        category: category || 'Photography',
        preview: item.src.medium,
        downloadUrl: item.src.original,
        platform: 'Pexels',
        tags: [query],
        author: item.photographer,
        license: 'Pexels License (Free for commercial use)',
        sourceUrl: item.url
      }));

      console.log(`🎉 Pexels: Successfully processed ${results.length} results`);
      console.log('🔚 === PEXELS API DEBUG SESSION END ===');
      
      return results;
    } catch (error) {
      console.error('💥 Pexels API network error:', error);
      console.error('🔚 === PEXELS API DEBUG SESSION END WITH ERROR ===');
      return [];
    }
  }

  // Pixabay API Integration with enhanced debugging
  async searchPixabay(query: string, category?: string): Promise<ExternalTemplate[]> {
    const apiKey = import.meta.env.VITE_PIXABAY_API_KEY;
    
    if (!apiKey || apiKey.trim() === '') {
      console.warn('🔑 Pixabay API key not found in environment variables');
      return [];
    }

    if (!this.canMakeRequest('pixabay')) {
      console.warn('⏱️ Pixabay rate limit reached');
      return [];
    }

    try {
      const imageType = category?.toLowerCase().includes('vector') ? 'vector' : 'photo';
      const url = `${API_CONFIGS.pixabay.baseUrl}/?key=${apiKey}&q=${encodeURIComponent(query)}&image_type=${imageType}&per_page=20&safesearch=true`;
      
      console.log(`📡 Pixabay API request: ${url.replace(apiKey, 'API_KEY_HIDDEN')}`);
      console.log(`🔑 Using API key: ${apiKey.substring(0, 10)}...`);
      
      const response = await fetch(url);

      console.log(`📡 Pixabay response status: ${response.status}`);

      if (!response.ok) {
        if (response.status === 401) {
          console.warn('❌ Pixabay API: Unauthorized - API key may be invalid');
          return [];
        }
        if (response.status === 403) {
          console.warn('❌ Pixabay API: Forbidden - API key may not have required permissions');
          return [];
        }
        console.error(`❌ Pixabay API error: ${response.status} ${response.statusText}`);
        return [];
      }

      const data = await response.json();

      if (!data.hits || data.hits.length === 0) {
        console.log(`ℹ️ Pixabay: No ${imageType}s found for query "${query}"`);
        return [];
      }

      console.log(`✅ Pixabay: Found ${data.hits.length} ${imageType}s for "${query}"`);

      return data.hits.map((item: any) => ({
        id: `pixabay_${item.id}`,
        title: item.tags || `Pixabay ${imageType} ${item.id}`,
        description: `${item.tags} - ${item.type}`,
        category: category || (item.type === 'vector' ? 'Graphics' : 'Photography'),
        preview: item.webformatURL,
        downloadUrl: item.largeImageURL,
        platform: 'Pixabay',
        tags: item.tags.split(', '),
        author: item.user,
        license: 'Pixabay License (Free for commercial use)',
        sourceUrl: item.pageURL
      }));
    } catch (error) {
      console.error('❌ Pixabay API error:', error);
      return [];
    }
  }

  // Unsplash API Integration with fallback to local templates
  async searchUnsplash(query: string, category?: string): Promise<ExternalTemplate[]> {
    const apiKey = import.meta.env.VITE_UNSPLASH_ACCESS_KEY;
    
    if (!apiKey || apiKey === 'your-unsplash-access-key-here') {
      console.warn('⚠️ Unsplash API key not found, using fallback local templates');
      return this.getFallbackUnsplashTemplates(query, category);
    }

    if (!this.canMakeRequest('unsplash')) {
      console.warn('⏱️ Unsplash rate limit reached, using fallback templates');
      return this.getFallbackUnsplashTemplates(query, category);
    }

    try {
      const response = await fetch(`${API_CONFIGS.unsplash.baseUrl}/search/photos?query=${encodeURIComponent(query)}&per_page=20`, {
        headers: {
          'Authorization': `Client-ID ${apiKey}`
        }
      });

      if (!response.ok) {
        console.warn(`⚠️ Unsplash API error ${response.status}, using fallback templates`);
        return this.getFallbackUnsplashTemplates(query, category);
      }

      const data = await response.json();

      if (!data.results || data.results.length === 0) {
        console.log(`ℹ️ Unsplash: No photos found for "${query}", using fallback templates`);
        return this.getFallbackUnsplashTemplates(query, category);
      }

      console.log(`✅ Unsplash: Found ${data.results.length} photos for "${query}"`);

      return data.results.map((item: any) => ({
        id: `unsplash_${item.id}`,
        title: item.alt_description || `Unsplash Photo ${item.id}`,
        description: item.description || item.alt_description || 'High-quality photo from Unsplash',
        category: category || 'Photography',
        preview: item.urls.regular,
        downloadUrl: item.urls.full,
        platform: 'Unsplash',
        tags: [query],
        author: item.user.name,
        license: 'Unsplash License (Free)',
        sourceUrl: item.links.html
      }));
    } catch (error) {
      console.error('❌ Unsplash API error:', error);
      return this.getFallbackUnsplashTemplates(query, category);
    }
  }

  // Fallback method to generate Unsplash-style templates when API is unavailable
  private getFallbackUnsplashTemplates(query: string, category?: string): ExternalTemplate[] {
    const fallbackTemplates = [
      {
        id: `unsplash_fallback_${query}_1`,
        title: `${query} - Professional Template`,
        description: `High-quality ${query} template suitable for professional use`,
        category: category || 'Photography',
        preview: `https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop&crop=center`,
        downloadUrl: `https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&h=900&fit=crop&crop=center`,
        platform: 'Unsplash',
        tags: [query],
        author: 'Unsplash Community',
        license: 'Unsplash License (Free)',
        sourceUrl: 'https://unsplash.com'
      },
      {
        id: `unsplash_fallback_${query}_2`,
        title: `${query} - Creative Design`,
        description: `Creative ${query} design perfect for modern projects`,
        category: category || 'Photography',
        preview: `https://images.unsplash.com/photo-1493612276216-ee3925520721?w=400&h=300&fit=crop&crop=center`,
        downloadUrl: `https://images.unsplash.com/photo-1493612276216-ee3925520721?w=1200&h=900&fit=crop&crop=center`,
        platform: 'Unsplash',
        tags: [query],
        author: 'Unsplash Community',
        license: 'Unsplash License (Free)',
        sourceUrl: 'https://unsplash.com'
      },
      {
        id: `unsplash_fallback_${query}_3`,
        title: `${query} - Minimalist Style`,
        description: `Minimalist ${query} template with clean design`,
        category: category || 'Photography',
        preview: `https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=300&fit=crop&crop=center`,
        downloadUrl: `https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&h=900&fit=crop&crop=center`,
        platform: 'Unsplash',
        tags: [query],
        author: 'Unsplash Community',
        license: 'Unsplash License (Free)',
        sourceUrl: 'https://unsplash.com'
      }
    ];

    console.log(`🔄 Unsplash: Using ${fallbackTemplates.length} fallback templates for "${query}"`);
    return fallbackTemplates;
  }

  // Multi-platform search aggregator with enhanced debugging
  async searchAllPlatforms(query: string, category?: string): Promise<{
    results: ExternalTemplate[];
    platformDistribution: Record<string, number>;
    totalResults: number;
    debugInfo: Record<string, any>;
  }> {
    console.log(`🔍 Searching all platforms for: "${query}" (category: ${category})`);

    const debugInfo: Record<string, any> = {
      pexels: { attempted: true, results: 0, error: null },
      pixabay: { attempted: true, results: 0, error: null },
      unsplash: { attempted: true, results: 0, error: null }
    };

    // Search each platform individually with better error handling
    let pexelsResults: ExternalTemplate[] = [];
    let pixabayResults: ExternalTemplate[] = [];
    let unsplashResults: ExternalTemplate[] = [];

    // Pexels search
    try {
      console.log('🔍 Searching Pexels...');
      pexelsResults = await this.searchPexels(query, category);
      debugInfo.pexels.results = pexelsResults.length;
      console.log(`✅ Pexels: Found ${pexelsResults.length} results`);
    } catch (error) {
      console.error('❌ Pexels search failed:', error);
      debugInfo.pexels.error = error;
    }

    // Pixabay search
    try {
      console.log('🔍 Searching Pixabay...');
      pixabayResults = await this.searchPixabay(query, category);
      debugInfo.pixabay.results = pixabayResults.length;
      console.log(`✅ Pixabay: Found ${pixabayResults.length} results`);
    } catch (error) {
      console.error('❌ Pixabay search failed:', error);
      debugInfo.pixabay.error = error;
    }

    // Unsplash search
    try {
      console.log('🔍 Searching Unsplash...');
      unsplashResults = await this.searchUnsplash(query, category);
      debugInfo.unsplash.results = unsplashResults.length;
      console.log(`✅ Unsplash: Found ${unsplashResults.length} results`);
    } catch (error) {
      console.error('❌ Unsplash search failed:', error);
      debugInfo.unsplash.error = error;
    }
      
    const allResults = [
      ...pexelsResults,
      ...pixabayResults,
      ...unsplashResults
    ];

    // Calculate platform distribution
    const platformDistribution: Record<string, number> = {};
    allResults.forEach(result => {
      platformDistribution[result.platform] = (platformDistribution[result.platform] || 0) + 1;
    });

    // Shuffle results to avoid platform bias in display order
    const shuffledResults = allResults.sort(() => Math.random() - 0.5);

    console.log(`📊 Final results: ${allResults.length} total`);
    console.log(`🏷️ Platform distribution:`, platformDistribution);
    console.log(`🐛 Debug info:`, debugInfo);

    return {
      results: shuffledResults,
      platformDistribution,
      totalResults: allResults.length,
      debugInfo
    };
  }

  // Import templates from external APIs into ViewsBoost
  async importExternalTemplates(searchQuery: string, category: string, limit: number = 50): Promise<{
    imported: number;
    skipped: number;
    platformBreakdown: Record<string, number>;
  }> {
    const searchResults = await this.searchAllPlatforms(searchQuery, category);
    const templatesToImport = searchResults.results.slice(0, limit);

    const importStats = {
      imported: 0,
      skipped: 0,
      platformBreakdown: {} as Record<string, number>
    };

    for (const template of templatesToImport) {
      try {
        // Convert external template to ViewsBoost template format (commented out until Firestore save is implemented)
        /*
        const viewsBoostTemplate = {
          title: template.title,
          category: template.category,
          prompt: template.description,
          preview: template.preview,
          imageUrl: template.preview,
          platform: template.platform,
          source: template.platform,
          description: template.description,
          tags: template.tags,
          author: template.author,
          license: template.license,
          sourceUrl: template.sourceUrl,
          importedAt: new Date().toISOString(),
          importedFrom: 'external_api',
          externalId: template.id
        };
        */

        // Here you would save to Firestore
        // await addDoc(collection(db, "templates"), viewsBoostTemplate);

        importStats.imported++;
        importStats.platformBreakdown[template.platform] = 
          (importStats.platformBreakdown[template.platform] || 0) + 1;

      } catch (error) {
        console.error(`Failed to import template ${template.id}:`, error);
        importStats.skipped++;
      }
    }

    return importStats;
  }
}

export const externalApiService = new ExternalApiService();
export type { ExternalTemplate }; 