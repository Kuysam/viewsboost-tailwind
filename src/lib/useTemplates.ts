// /src/lib/useTemplates.ts
import { useEffect, useState, useCallback } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "./firebase"; // Adjust this path if your firebase config is elsewhere
import { useTemplateUpdates } from "./hooks/useTemplateUpdates";

// --- Developer Note ---
// FIRESTORE-ONLY MODE: This hook now loads templates exclusively from Firestore
// All templates are managed through the Playground/Admin Panel
// No local JSON files are used - clean slate for manual template additions

export function useTemplates(category: string | null = "Business") {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [forceFirestore, setForceFirestore] = useState(false);
  const [lastEventId, setLastEventId] = useState(0);
  
  // Listen for real-time template updates from admin panel
  const { lastUpdateTimestamp } = useTemplateUpdates();

  // Create a memoized fetch function to avoid infinite loops
  const fetchTemplatesFromFirestore = useCallback(async (isForced = false) => {
    console.log(`📁 [useTemplates] Fetching templates for category: ${category}, forced: ${isForced}`);
    setLoading(true);
    
    try {
      console.log(`📁 [useTemplates] FIRESTORE-ONLY MODE: Loading templates from Firestore for "${category}"`);
      
      // Load all templates from Firestore
      const snapshot = await getDocs(collection(db, "templates"));
      let firestoreData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // NORMALIZATION: Remove videoSource from image templates
      firestoreData = firestoreData.map(template => {
        if (template.fileType === 'image' && template.videoSource) {
          const { videoSource, ...rest } = template;
          return rest;
        }
        return template;
      });
      
      console.log(`📁 [useTemplates] Raw Firestore data: ${firestoreData.length} total templates`);
      
      if (firestoreData.length > 0) {
        console.log(`📁 [useTemplates] Available categories:`, [...new Set(firestoreData.map(d => d.category))]);
      }
      
      // ENHANCED: Filter by category with flexible matching
      if (category !== null) {
        const beforeFilter = firestoreData.length;
        
        // COMPREHENSIVE category matching to handle Admin Panel ↔ App UI mismatches
        const createCategoryMatcher = (searchCategory: string) => {
          const search = searchCategory.toLowerCase().trim();
          
                     // COMPREHENSIVE mapping for ALL 92+ categories - covers Admin Panel ↔ Studio UI mismatches
           const categoryMappings: Record<string, string[]> = {
             // === SHORTS CATEGORIES (most problematic) ===
             'instagram reel': ['instagram reels', 'instagram reel', 'instagram-reels', 'instagram-reel'],
             'instagram reels': ['instagram reels', 'instagram reel', 'instagram-reels', 'instagram-reel'],
             'tiktok shorts': ['tiktok video', 'tiktok shorts', 'tiktok-video', 'tiktok-shorts'],
             'tiktok video': ['tiktok video', 'tiktok shorts', 'tiktok-video', 'tiktok-shorts'],
             'facebook reel': ['facebook story', 'facebook reel', 'facebook-story', 'facebook-reel'],
             'facebook story': ['facebook story', 'facebook reel', 'facebook-story', 'facebook-reel'],
             'snapchat shorts': ['snapchat story', 'snapchat shorts', 'snapchat-story', 'snapchat-shorts'],
             'snapchat story': ['snapchat story', 'snapchat shorts', 'snapchat-story', 'snapchat-shorts'],
             
             // === VIDEO CATEGORIES ===
             'youtube video': ['youtube video', 'youtube-video'],
             'facebook video': ['facebook video', 'facebook-video'],
             'instagram video': ['instagram video', 'instagram-video'],
             'linkedin video': ['linkedin video', 'linkedin-video'],
             'twitter video': ['twitter video', 'twitter-video'],
             'viewsboost video': ['viewsboost video', 'viewsboost-video'],
             'vimeo video': ['vimeo video', 'vimeo-video'],
             'training video': ['training video', 'training-video'],
             'product demo': ['product demo', 'product-demo'],
             'testimonial video': ['testimonial video', 'testimonial-video'],
             'tutorial video': ['tutorial video', 'tutorial-video'],
             'webinar video': ['webinar video', 'webinar-video'],
             
             // === SHORTS VARIANTS ===
             'youtube shorts': ['youtube shorts', 'youtube short', 'youtube-shorts', 'youtube-short'],
             'pinterest video pin': ['pinterest idea pin', 'pinterest video pin', 'pinterest-idea-pin', 'pinterest-video-pin'],
             'pinterest idea pin': ['pinterest idea pin', 'pinterest video pin', 'pinterest-idea-pin', 'pinterest-video-pin'],
             'viewsboost shorts': ['viewsboost shorts', 'viewsboost short', 'viewsboost-shorts', 'viewsboost-short'],
             'linkedin story': ['linkedin story', 'linkedin-story'],
             
             // === PHOTO CATEGORIES ===
             'instagram post': ['instagram post', 'instagram posts', 'instagram-post', 'instagram-posts'],
             'facebook post': ['facebook post', 'facebook posts', 'facebook-post', 'facebook-posts'],
             'linkedin post': ['linkedin post', 'linkedin posts', 'linkedin-post', 'linkedin-posts'],
             'twitter post': ['twitter post', 'twitter posts', 'twitter-post', 'twitter-posts'],
             'pinterest pin': ['pinterest pin', 'pinterest pins', 'pinterest-pin', 'pinterest-pins'],
             'product photo': ['product photo', 'product photos', 'product-photo', 'product-photos'],
             'profile picture': ['profile picture', 'profile pictures', 'profile-picture', 'profile-pictures'],
             
             // === POST CATEGORIES ===
             'social media post': ['social media post', 'social media posts', 'social-media-post', 'social-media-posts'],
             'blog post': ['blog post', 'blog posts', 'blog-post', 'blog-posts'],
             'news post': ['news post', 'news posts', 'news-post', 'news-posts'],
             'announcement': ['announcement', 'announcements'],
             'quote post': ['quote post', 'quote posts', 'quote-post', 'quote-posts'],
             'meme post': ['meme post', 'meme posts', 'meme-post', 'meme-posts'],
             'infographic post': ['infographic post', 'infographic posts', 'infographic-post', 'infographic-posts'],
             'carousel post': ['carousel post', 'carousel posts', 'carousel-post', 'carousel-posts'],
             
             // === CAROUSEL CATEGORIES ===
             'instagram carousel': ['instagram carousel', 'instagram carousels', 'instagram-carousel', 'instagram-carousels'],
             'facebook carousel': ['facebook carousel', 'facebook carousels', 'facebook-carousel', 'facebook-carousels'],
             'linkedin carousel': ['linkedin carousel', 'linkedin carousels', 'linkedin-carousel', 'linkedin-carousels'],
             'twitter thread': ['twitter thread', 'twitter threads', 'twitter-thread', 'twitter-threads'],
             'pinterest story pin': ['pinterest story pin', 'pinterest story pins', 'pinterest-story-pin', 'pinterest-story-pins'],
             'product showcase': ['product showcase', 'product showcases', 'product-showcase', 'product-showcases'],
             
             // === THUMBNAIL CATEGORIES ===
             'youtube thumbnail': ['youtube thumbnail', 'youtube thumbnails', 'youtube-thumbnail', 'youtube-thumbnails'],
             'video thumbnail': ['video thumbnail', 'video thumbnails', 'video-thumbnail', 'video-thumbnails'],
             'blog thumbnail': ['blog thumbnail', 'blog thumbnails', 'blog-thumbnail', 'blog-thumbnails'],
             'podcast thumbnail': ['podcast thumbnail', 'podcast thumbnails', 'podcast-thumbnail', 'podcast-thumbnails'],
             'course thumbnail': ['course thumbnail', 'course thumbnails', 'course-thumbnail', 'course-thumbnails'],
             'webinar thumbnail': ['webinar thumbnail', 'webinar thumbnails', 'webinar-thumbnail', 'webinar-thumbnails'],
             'stream thumbnail': ['stream thumbnail', 'stream thumbnails', 'stream-thumbnail', 'stream-thumbnails'],
             
             // === COVER & BANNER CATEGORIES ===
             'facebook cover': ['facebook cover', 'facebook covers', 'facebook-cover', 'facebook-covers'],
             'twitter header': ['twitter header', 'twitter headers', 'twitter-header', 'twitter-headers'],
             'linkedin banner': ['linkedin banner', 'linkedin banners', 'linkedin-banner', 'linkedin-banners'],
             'youtube banner': ['youtube banner', 'youtube banners', 'youtube-banner', 'youtube-banners'],
             'instagram story highlight': ['instagram story highlight', 'instagram story highlights', 'instagram-story-highlight', 'instagram-story-highlights'],
             'pinterest board cover': ['pinterest board cover', 'pinterest board covers', 'pinterest-board-cover', 'pinterest-board-covers'],
             'website header': ['website header', 'website headers', 'website-header', 'website-headers'],
             
             // === STORY CATEGORIES ===
             'instagram story': ['instagram story', 'instagram stories', 'instagram-story', 'instagram-stories'],
             'whatsapp status': ['whatsapp status', 'whatsapp statuses', 'whatsapp-status', 'whatsapp-statuses'],
             'youtube community post': ['youtube community post', 'youtube community posts', 'youtube-community-post', 'youtube-community-posts'],
             
             // === ADS CATEGORIES ===
             'facebook ad': ['facebook ad', 'facebook ads', 'facebook-ad', 'facebook-ads'],
             'instagram ad': ['instagram ad', 'instagram ads', 'instagram-ad', 'instagram-ads'],
             'google ad': ['google ad', 'google ads', 'google-ad', 'google-ads'],
             'linkedin ad': ['linkedin ad', 'linkedin ads', 'linkedin-ad', 'linkedin-ads'],
             'twitter ad': ['twitter ad', 'twitter ads', 'twitter-ad', 'twitter-ads'],
             'pinterest ad': ['pinterest ad', 'pinterest ads', 'pinterest-ad', 'pinterest-ads'],
             'youtube ad': ['youtube ad', 'youtube ads', 'youtube-ad', 'youtube-ads'],
             'display ad': ['display ad', 'display ads', 'display-ad', 'display-ads'],
             
             // === LIVE CATEGORIES ===
             'live stream overlay': ['live stream overlay', 'live stream overlays', 'live-stream-overlay', 'live-stream-overlays'],
             'twitch overlay': ['twitch overlay', 'twitch overlays', 'twitch-overlay', 'twitch-overlays'],
             'youtube live': ['youtube live', 'youtube-live'],
             'facebook live': ['facebook live', 'facebook-live'],
             'instagram live': ['instagram live', 'instagram-live'],
             'linkedin live': ['linkedin live', 'linkedin-live'],
             'stream alert': ['stream alert', 'stream alerts', 'stream-alert', 'stream-alerts'],
             'webcam frame': ['webcam frame', 'webcam frames', 'webcam-frame', 'webcam-frames'],
             
             // === BUSINESS CATEGORIES ===
             'presentation': ['presentation', 'presentations'],
             'report': ['report', 'reports'],
             'proposal': ['proposal', 'proposals'],
             'invoice': ['invoice', 'invoices'],
             'business card': ['business card', 'business cards', 'business-card', 'business-cards'],
             'letterhead': ['letterhead', 'letterheads'],
             'flyer': ['flyer', 'flyers'],
             'brochure': ['brochure', 'brochures'],
             'certificate': ['certificate', 'certificates'],
             
             // === MARKETING CATEGORIES ===
             'marketing': ['marketing', 'promotional'],
             'social media': ['social media', 'social-media'],
             'web design': ['web design', 'web-design'],
             'documents': ['documents', 'document'],
             'education': ['education', 'educational'],
             'events': ['events', 'event'],
             'personal': ['personal', 'personal branding'],
             
             // === GENERIC STUDIO SELECTOR MAPPINGS ===
             'social media posts': ['social media post', 'social media posts', 'social-media-post', 'social-media-posts'],
             'marketing/promotional': ['marketing', 'promotional', 'marketing/promotional'],
             'restaurant': ['restaurant', 'restaurants'],
             'quote/motivational': ['quote', 'motivational', 'quote/motivational', 'quote post', 'motivational post'],
             'business/professional': ['business', 'professional', 'business/professional'],
             'e-commerce': ['e-commerce', 'ecommerce', 'e commerce'],
             'event/announcement': ['event', 'announcement', 'event/announcement'],
             'infographic': ['infographic', 'infographics'],
             'seasonal/holiday': ['seasonal', 'holiday', 'seasonal/holiday'],
             'personal branding': ['personal branding', 'personal-branding', 'personal'],
           };
          
          // Get possible matches for this search category
          const possibleMatches = categoryMappings[search] || [];
          
          // Add automatic plural/singular variants
          const baseName = search.replace(/s$/, ''); // Remove trailing 's'
          const pluralName = search.endsWith('s') ? search : search + 's';
          possibleMatches.push(search, baseName, pluralName);
          
          // Add dash variants
          possibleMatches.push(search.replace(/\s+/g, '-'), baseName.replace(/\s+/g, '-'), pluralName.replace(/\s+/g, '-'));
          
          return [...new Set(possibleMatches)]; // Remove duplicates
        };
        
        const possibleMatches = createCategoryMatcher(category);
        console.log(`📁 [useTemplates] Searching for "${category}" with possible matches:`, possibleMatches);
        
        firestoreData = firestoreData.filter(doc => {
          const docCategory = doc.category || '';
          const docCategoryLower = docCategory.toLowerCase().trim();
          
          // Try multiple matching strategies
          const exactMatch = possibleMatches.some(match => match === docCategoryLower);
          const containsMatch = possibleMatches.some(match => 
            docCategoryLower.includes(match) || match.includes(docCategoryLower)
          );
          
          const isMatch = exactMatch || containsMatch;
          
          if (isMatch) {
            console.log(`✅ [useTemplates] Template "${doc.title}" matched: "${docCategory}" matches "${category}"`);
          }
          
          return isMatch;
        });
        
        console.log(`📁 [useTemplates] COMPREHENSIVE filtering for "${category}": ${beforeFilter} → ${firestoreData.length} templates`);
        
        // Debug: Show what categories were found vs what we're looking for
        if (firestoreData.length === 0) {
          const allCategories = snapshot.docs.map(doc => doc.data().category).filter(Boolean);
          console.log(`❌ [useTemplates] NO MATCHES FOUND! Available categories:`, allCategories);
          console.log(`❌ [useTemplates] Looking for: "${category}" with possible matches:`, possibleMatches);
          
          // Try to find close matches using the same matching logic
          const closeMatches = allCategories.filter(cat => {
            const catLower = cat.toLowerCase().trim();
            return possibleMatches.some(match => 
              catLower.includes(match) || match.includes(catLower)
            );
          });
          
          if (closeMatches.length > 0) {
            console.log(`💡 [useTemplates] Close matches found:`, closeMatches);
          }
        }
      }
      
      // Sort templates by quality
      const sortedTemplates = sortByQuality(firestoreData);
      console.log(`✨ [useTemplates] ${sortedTemplates.length} templates sorted by quality for "${category}"`);
      
      // CRITICAL: Force update even if data seems the same
      setTemplates(sortedTemplates);
      
    } catch (err) {
      console.error('📁 [useTemplates] Firestore fetch failed:', err);
      setTemplates([]); // fallback to empty array
    }
    
    setLoading(false);
  }, [category]);

  // Listen for admin sync events to force Firestore reload
  const handleTemplatesUpdated = useCallback((event: any) => {
      const detail = event.detail || {};
      const eventId = detail.timestamp || Date.now();
      
      console.log('🔄 [useTemplates] Received cache invalidation event:', detail);
      
      // Prevent duplicate processing of the same event
      if (eventId === lastEventId) {
        console.log('🔄 [useTemplates] Skipping duplicate event:', eventId);
        return;
      }
      setLastEventId(eventId);
      
      // Check if this is an immediate/high-priority update
      const isImmediate = detail.immediate || detail.action === 'delete' || detail.action === 'create' || detail.source?.includes('deletion') || detail.source?.includes('sync');
      const isForceReload = detail.forceReload;
      const isCategoryMatch = !detail.category || detail.category === category;
      
      if (isImmediate || isForceReload || isCategoryMatch) {
        console.log('🚨 [useTemplates] IMMEDIATE AGGRESSIVE reload triggered by:', detail.source);
        
        // CRITICAL: For deletion events, immediately remove from current state
        if (detail.action === 'delete' && detail.templateId) {
          console.log('🗑️ [useTemplates] IMMEDIATE template removal from UI:', detail.templateId);
          setTemplates(prevTemplates => {
            const filtered = prevTemplates.filter(template => 
              template.id !== detail.templateId && 
              template.id !== detail.firestoreDocumentId
            );
            console.log(`🗑️ [useTemplates] Removed template from state: ${prevTemplates.length} → ${filtered.length}`);
            return filtered;
          });
        }
        
        // CRITICAL: For creation events, immediately fetch fresh data
        if (detail.action === 'create' || detail.source?.includes('sync')) {
          console.log('📝 [useTemplates] IMMEDIATE template creation/sync - fetching fresh data');
        }
        
        // Force immediate reload from Firestore - SINGLE CALL ONLY
        if (!loading) {
          console.log('🔄 [useTemplates] Executing single reload to prevent loops');
          fetchTemplatesFromFirestore(true);
        } else {
          console.log('🔄 [useTemplates] Skipping reload - already loading');
        }
      }
    }, [lastEventId, forceFirestore, category, loading]);

  useEffect(() => {
    // ENHANCED: Listen for comprehensive list of events - SKIP IN ALL EDITOR PAGES
    const isEditorPage = window.location.pathname.includes('/studio') || 
                        window.location.pathname.includes('/studio') ||
                        window.location.pathname.includes('/editor') ||
                        window.location.pathname.includes('/timeline-test') ||
                        window.location.pathname.includes('/video-processing-test') ||
                        window.location.pathname.includes('/simple-editor') ||
                        window.location.pathname.includes('/studio');
    
    if (isEditorPage) {
      console.log('🚫 [useTemplates] SKIPPING ALL EVENT LISTENERS on editor page to prevent infinite loops:', window.location.pathname);
      return; // Don't add event listeners in editor pages to prevent infinite loops
    }
    
    // ONLY listen to essential template update events to prevent loops
    const events = ['templatesUpdated', 'templateDeleted', 'templateCreated'];
    
    events.forEach(eventType => {
      window.addEventListener(eventType, handleTemplatesUpdated);
    });

    return () => {
      events.forEach(eventType => {
        window.removeEventListener(eventType, handleTemplatesUpdated);
      });
    };
  }, [handleTemplatesUpdated]);

  // Main useEffect for fetching templates - ESSENTIAL FOR INITIAL LOAD
  useEffect(() => {
    console.log('🔄 [useTemplates] Initial fetch for category:', category);
    fetchTemplatesFromFirestore(false);
  }, [category]); // Only category dependency to prevent loops

  // Quality scoring function for premium template prioritization
  const getTemplateQuality = (template: any): number => {
    let score = 0;
    
    // Envato premium templates get highest priority (150 points)
    if (template.platform === 'Envato Elements' || template.videoSource?.includes('envato-premium')) {
      score += 150;
    }
    
    // Local images get high priority (100 points)
    if (template.preview?.startsWith('/images/') || template.preview?.startsWith('/templates/')) {
      score += 100;
    }
    
    // ViewsBoost branded templates get high priority (80 points)
    if (template.platform === 'ViewsBoost' || template.category?.includes('ViewsBoost')) {
      score += 80;
    }
    
    // Custom/manual imports get priority (60 points)
    if (!template.preview?.includes('unsplash.com') && 
        !template.preview?.includes('pexels.com') && 
        !template.preview?.includes('pixabay.com')) {
      score += 60;
    }
    
    // High resolution indicators (20 points)
    if (template.preview?.includes('w=1200') || template.preview?.includes('1920x1080')) {
      score += 20;
    }
    
    // Penalize known low-quality sources
    if (template.preview?.includes('images.unsplash.com')) score -= 30;
    if (template.preview?.includes('images.pexels.com')) score -= 20;
    if (template.preview?.includes('pixabay.com')) score -= 25;
    
    return score;
  };

  // Sort templates by quality
  const sortByQuality = (templates: any[]) => {
    return templates.sort((a, b) => getTemplateQuality(b) - getTemplateQuality(a));
  };

  // Main effect for fetching templates - ALLOW INITIAL FETCH, PREVENT LOOPS
  useEffect(() => {
    console.log('🔄 [useTemplates] Initial fetch for category:', category);
    fetchTemplatesFromFirestore(false);
  }, [category]); // Only category dependency to prevent loops
  
  return { templates, loading };
}
