import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Search as SearchIcon, Download, Share, X } from "lucide-react";
import { useTemplates } from "../lib/useTemplates";
import { ImageService } from "../lib/services/imageService";
import { useVideoPreview } from "../components/VideoPreviewExtractor";
import ModernTemplateGrid from "../components/ModernTemplateGrid";
// @ts-ignore
import TemplatePreviewModal from "../components/TemplatePreviewModal";

function CategoryTemplates() {
  const { category } = useParams<{ category: string }>();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [previewTemplate, setPreviewTemplate] = useState(null);

  // Decode the category parameter (in case it has special characters)
  const decodedCategory = category ? decodeURIComponent(category) : "";
  
  // Fetch templates for this specific category
  // Force Firestore loading to match admin panel data
  const { templates, loading } = useTemplates(decodedCategory);

  // CRITICAL FIX: Force initial Firestore sync to match admin panel
  useEffect(() => {
    console.log('🔄 [CategoryTemplates] Forcing initial Firestore sync to match admin panel');
    window.dispatchEvent(new CustomEvent('templatesUpdated', { 
      detail: { source: 'category-page-init', timestamp: Date.now() } 
    }));
    
    // NAVIGATION GUARD: Prevent accidental navigation to video URLs
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (window.location.pathname.includes('/videos/') && import.meta.env.DEV) {
        console.warn('🚨 [CategoryTemplates] Navigation to video URL detected and prevented!');
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };
    
    const handlePopState = (e: PopStateEvent) => {
      if (window.location.pathname.includes('/videos/')) {
        console.warn('🚨 [CategoryTemplates] Video URL navigation detected, redirecting back');
        e.preventDefault();
        navigate(`/category/${encodeURIComponent(decodedCategory)}`, { replace: true });
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('popstate', handlePopState);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [decodedCategory, navigate]);

  // ENHANCED: Listen for real-time template updates from admin panel
  useEffect(() => {
    const handleTemplateUpdate = (event: any) => {
      const detail = event.detail || {};
      console.log(`🔄 [CategoryTemplates] Received template update event:`, detail);
      
      // Force refresh for this specific category if it matches OR for any creation/deletion
      const shouldRefresh = 
        detail.category === decodedCategory || 
        detail.action === 'delete' || 
        detail.action === 'create' ||
        detail.source?.includes('sync') ||
        detail.comprehensive;
        
      if (shouldRefresh) {
        console.log(`🔄 [CategoryTemplates] Template update affects "${decodedCategory}" - triggering AGGRESSIVE refresh`);
        console.log(`🔄 [CategoryTemplates] Update details:`, {
          action: detail.action,
          source: detail.source,
          category: detail.category,
          templateId: detail.templateId,
          templateCount: detail.templateCount
        });
        
        // Multiple aggressive refresh attempts
        forceFirestoreReload();
        
        // Secondary refresh after delay for Firestore propagation
        setTimeout(() => {
          console.log(`🔄 [CategoryTemplates] Secondary refresh for "${decodedCategory}"`);
          forceFirestoreReload();
        }, 1000);
        
        // Final refresh to ensure everything is synced
        setTimeout(() => {
          console.log(`🔄 [CategoryTemplates] Final refresh for "${decodedCategory}"`);
          forceFirestoreReload();
        }, 2000);
      }
    };

    // Listen for ALL update events with high priority
    const events = [
      'templatesUpdated',
      'templateDeleted', 
      'templateCreated', 
      'templateCacheInvalid', 
      'globalTemplateSync',
      'categoryUpdated'
    ];
    
    events.forEach(eventType => {
      window.addEventListener(eventType, handleTemplateUpdate);
      console.log(`👂 [CategoryTemplates] Listening for ${eventType} events for "${decodedCategory}"`);
    });

    return () => {
      events.forEach(eventType => {
        window.removeEventListener(eventType, handleTemplateUpdate);
      });
    };
  }, [decodedCategory]);

  // Add AGGRESSIVE force Firestore reload function
  const forceFirestoreReload = () => {
    console.log(`🔄 [CategoryTemplates] Forcing AGGRESSIVE cache invalidation for "${decodedCategory}"...`);
    
    const reloadDetail = {
      source: 'categorypage-manual-reload', 
      timestamp: Date.now(),
      categories: [decodedCategory],
      category: decodedCategory,
      action: 'force-reload',
      forceReload: true,
      immediate: true,
      comprehensive: true
    };
    
    // Dispatch multiple events for maximum coverage
    const events = [
      'templatesUpdated',
      'templateCacheInvalid',
      'globalTemplateSync'
    ];
    
    events.forEach(eventType => {
      window.dispatchEvent(new CustomEvent(eventType, { detail: reloadDetail }));
      console.log(`📡 [CategoryTemplates] Dispatched ${eventType} for "${decodedCategory}"`);
    });
  };

  // Add manual Firestore test function for debugging
  const testFirestoreDirectly = async () => {
    console.log(`🔍 [CategoryTemplates] Testing Firestore directly for "${decodedCategory}"...`);
    try {
      const { collection, getDocs } = await import('firebase/firestore');
      const { db } = await import('../lib/firebase');
      
      const snapshot = await getDocs(collection(db, "templates"));
      const firestoreData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const filteredData = firestoreData.filter(doc => 
        doc.category?.toLowerCase() === decodedCategory.toLowerCase()
      );
      
      console.log(`🔍 [CategoryTemplates] Direct Firestore test results:`);
      console.log(`- Total templates in Firestore: ${firestoreData.length}`);
      console.log(`- Templates for "${decodedCategory}": ${filteredData.length}`);
      console.log(`- Template titles:`, filteredData.map(t => t.title));
      
      alert(`Direct Firestore test:\n${firestoreData.length} total templates\n${filteredData.length} templates for "${decodedCategory}"\n\nSee console for details.`);
    } catch (error) {
      console.error(`❌ [CategoryTemplates] Direct Firestore test failed:`, error);
      alert(`Firestore test failed: ${error.message}`);
    }
  };

  // Filter templates based on search query
  const filteredTemplates = templates.filter(template => 
    template.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    template.desc?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  function goBack() {
    // Check if we came from Studio
    const studioContext = localStorage.getItem('studioNavigationContext');
    
    if (studioContext) {
      try {
        const context = JSON.parse(studioContext);
        if (context.fromStudio) {
          // Navigate back to Studio - the Studio component will restore state
          navigate('/studio');
          return;
        }
      } catch (error) {
        console.error('🎯 [DEBUG] Error parsing Studio context:', error);
      }
    }
    
    // Fallback: Use browser back
    navigate(-1);
  }

  function getCategoryIcon(category: string) {
    // Return appropriate emoji based on category
    const categoryLower = category.toLowerCase();
    
    // Video categories
    if (categoryLower.includes("youtube")) return "🎬";
    if (categoryLower.includes("facebook")) return "📘";
    if (categoryLower.includes("twitter")) return "🐦";
    if (categoryLower.includes("linkedin")) return "💼";
    if (categoryLower.includes("viewsboost")) return "⚡";
    if (categoryLower.includes("video")) return "🎥";
    if (categoryLower.includes("intro") || categoryLower.includes("outro")) return "🎭";
    if (categoryLower.includes("podcast")) return "🎙️";
    if (categoryLower.includes("gaming")) return "🎮";
    
    // Shorts categories
    if (categoryLower.includes("reel") || categoryLower.includes("shorts")) return "📱";
    if (categoryLower.includes("tiktok")) return "🎵";
    if (categoryLower.includes("snapchat")) return "👻";
    if (categoryLower.includes("pinterest")) return "📌";
    
    // Content type categories
    if (categoryLower.includes("photo")) return "📸";
    if (categoryLower.includes("post")) return "📝";
    if (categoryLower.includes("carousel")) return "🎠";
    if (categoryLower.includes("thumbnail")) return "🖼️";
    if (categoryLower.includes("cover") || categoryLower.includes("banner")) return "🎨";
    if (categoryLower.includes("profile")) return "👤";
    if (categoryLower.includes("story")) return "📖";
    if (categoryLower.includes("ads")) return "📢";
    
    // Industry categories
    if (categoryLower.includes("business")) return "💼";
    if (categoryLower.includes("marketing")) return "📈";
    if (categoryLower.includes("education")) return "🎓";
    if (categoryLower.includes("health") || categoryLower.includes("fitness")) return "💪";
    if (categoryLower.includes("beauty") || categoryLower.includes("fashion")) return "💄";
    if (categoryLower.includes("food") || categoryLower.includes("cooking")) return "🍳";
    if (categoryLower.includes("music")) return "🎵";
    if (categoryLower.includes("travel")) return "✈️";
    if (categoryLower.includes("automotive")) return "🚗";
    if (categoryLower.includes("real estate")) return "🏠";
    if (categoryLower.includes("finance")) return "💰";
    
    // Default
    return "📄";
  }

  function getCategoryColor(category: string) {
    const categoryLower = category.toLowerCase();
    
    if (categoryLower.includes("video") || categoryLower.includes("youtube")) return "from-yellow-400 to-red-500";
    if (categoryLower.includes("shorts") || categoryLower.includes("reel")) return "from-pink-400 to-purple-500";
    if (categoryLower.includes("photo")) return "from-green-400 to-blue-500";
    if (categoryLower.includes("post")) return "from-purple-400 to-indigo-500";
    if (categoryLower.includes("carousel")) return "from-orange-400 to-red-500";
    if (categoryLower.includes("thumbnail")) return "from-cyan-400 to-blue-500";
    if (categoryLower.includes("cover") || categoryLower.includes("banner")) return "from-rose-400 to-pink-500";
    if (categoryLower.includes("profile")) return "from-emerald-400 to-teal-500";
    
    return "from-gray-400 to-gray-600";
  }

  // Get video source based on template type - NO FALLBACKS
  function getVideoSource(template: any) {
    // Only use real video sources
    if (template.videoSource && (
      template.videoSource.startsWith('http') ||
      template.videoSource.startsWith('blob:')
    )) {
      return template.videoSource;
    }
    // No fallback: return null
    return null;
  }

  // Add helper function for template editor route - ALL ROUTES NOW USE STUDIO
  const getTemplateEditorRoute = (template: any) => {
    // Debug log
    console.log('[ROUTE DEBUG][CategoryTemplates]', { template });

    // All editor routes now point to Studio with template parameter
    const route = `/studio?template=${encodeURIComponent(template.id || template.title)}`;
    console.log('[ROUTE DEBUG][CategoryTemplates] Using Studio route:', route);
    return route;
  };

  function TemplateCard({ template }: { template: any }) {
    const [imageLoaded, setImageLoaded] = useState(false);
    const [imageError, setImageError] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [isValidTemplate, setIsValidTemplate] = useState(true);
    const [isVideoPlaying, setIsVideoPlaying] = useState(false);
    const [videoRef, setVideoRef] = useState<HTMLVideoElement | null>(null);

    // Get video source for preview extraction
    const videoSource = getVideoSource(template);
    
    // Extract video preview if template uses video preview
    const { previewUrl: videoPreviewUrl, isLoading: videoPreviewLoading } = useVideoPreview(
      template.useVideoPreview && videoSource ? videoSource : "", 
      1.5 // Extract frame at 1.5 seconds
    );

    // DEBUG: Log template data for troubleshooting
    React.useEffect(() => {
      if (import.meta.env.DEV) {
        console.log(`🔍 [TemplateCard] Template: "${template.title}"`, {
          id: template.id,
          category: template.category,
          videoSource: template.videoSource,
          preview: template.preview,
          hasVideoSource: Boolean(template.videoSource),
          videoSourceType: template.videoSource ? (
            template.videoSource.includes('firebase') || template.videoSource.includes('storage.googleapis.com') ? 'FIREBASE_STORAGE' :
            template.videoSource.startsWith('blob:') ? 'BLOB_URL' :
            template.videoSource.startsWith('http') ? 'EXTERNAL_URL' :
            template.videoSource.startsWith('/videos/') ? 'LOCAL_VIDEO' :
            'OTHER'
          ) : 'NONE',
          actualVideoSource: videoSource,
          useVideoPreview: template.useVideoPreview,
          platform: template.platform,
          allKeys: Object.keys(template)
        });
      }
    }, [template, videoSource]);

    // Check if HIGH-RESOLUTION image loads successfully
    React.useEffect(() => {
      // Always show Envato Elements templates regardless of image loading
      const isEnvatoTemplate = template.platform === 'Envato Elements' || template.videoSource?.includes('envato-premium');
      
      if (isEnvatoTemplate) {
        setIsValidTemplate(true);
        setShowPreview(true);
        // Still try to load the image for better display
        if (template.preview && !imageError && typeof window !== 'undefined') {
          const highResUrl = ImageService.getOptimizedImageUrl(template.preview, 1200, 900, 'high');
          ImageService.testImageLoad(highResUrl).then(result => {
            if (result.success) {
              setImageLoaded(true);
              } else {
              setImageError(true);
              }
          });
        }
        return;
      }

      if (template.preview && !imageError && typeof window !== 'undefined') {
        // Get high-resolution optimized URL
        const highResUrl = ImageService.getOptimizedImageUrl(template.preview, 1200, 900, 'high');
        
        // Test the high-resolution image
        ImageService.testImageLoad(highResUrl).then(result => {
          if (result.success) {
            setImageLoaded(true);
            setShowPreview(true);
            setIsValidTemplate(true);
            } else {
            setImageError(true);
            setImageLoaded(false);
            setShowPreview(false);
            
            // For ViewsBoost templates, still show them with fallback - don't hide them!
            const isViewsBoostTemplate = template.platform === 'ViewsBoost' || 
                                        template.preview?.startsWith('/') || 
                                        template.category?.includes('ViewsBoost');
            
            if (isViewsBoostTemplate) {
              setIsValidTemplate(true); // Keep ViewsBoost templates visible with fallback
              } else {
              setIsValidTemplate(false); // Hide external templates with broken images
              console.warn('❌ [DEBUG] External template hidden due to image failure:', result.error);
            }
          }
        });
      } else if (!template.preview) {
        // Templates without preview URLs - show ViewsBoost and Envato templates, hide others
        const isViewsBoostTemplate = template.platform === 'ViewsBoost' || template.category?.includes('ViewsBoost');
        setShowPreview(false);
        setIsValidTemplate(isViewsBoostTemplate || isEnvatoTemplate);
      } else {
        // Default case
        setIsValidTemplate(true);
      }
    }, [template.preview, imageError]);

    // Don't render external templates with broken images, but always show ViewsBoost templates
    if (!isValidTemplate) {
      return null;
    }

    // Create background style with video preview, HIGH-RESOLUTION image, or attractive fallback
    const backgroundStyle = template.useVideoPreview && videoPreviewUrl
      ? {
          backgroundImage: `url('${videoPreviewUrl}')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }
      : showPreview && imageLoaded && !imageError
      ? { 
          backgroundImage: `url('${ImageService.getOptimizedImageUrl(template.preview || '', 1200, 900, 'high')}')`, 
          backgroundSize: 'cover', 
          backgroundPosition: 'center', 
          backgroundRepeat: 'no-repeat' 
        }
      : getTikTokFallbackBackground(template);

    // Toggle video play/pause - ENHANCED with better event handling
    const toggleVideoPlayback = (e: React.MouseEvent) => {
      e.stopPropagation(); // Prevent card click
      e.preventDefault(); // Prevent any default behavior
      
      if (import.meta.env.DEV) {
        console.log('🎥 [TemplateCard] Video toggle clicked for:', template.title);
      }
      
      if (videoRef) {
        if (isVideoPlaying) {
          videoRef.pause();
        } else {
          videoRef.play();
        }
        setIsVideoPlaying(!isVideoPlaying);
      }
    };

    // ENHANCED template card click handler - DIRECT EDITOR NAVIGATION
    const handleTemplateClick = (e: React.MouseEvent) => {
      e.preventDefault(); // Prevent any default navigation
      e.stopPropagation(); // Stop event bubbling
      
      // Always store the FULL template object in sessionStorage
      sessionStorage.setItem('selectedTemplate', JSON.stringify(template));
      
      // DIRECT EDITOR NAVIGATION - Get the appropriate editor route
      const editorRoute = getTemplateEditorRoute(template);
      // Navigate directly to the appropriate editor
      navigate(editorRoute);
    };

    // Generate TikTok-specific fallback backgrounds
    function getTikTokFallbackBackground(template: any) {
      if (template.category === 'TikTok Video') {
        // TikTok-themed gradients based on template type
        if (template.title?.includes('Dance')) {
          return { background: 'linear-gradient(135deg, #ff0050 0%, #00f2ea 100%)' }; // TikTok brand colors
        } else if (template.title?.includes('Comedy')) {
          return { background: 'linear-gradient(135deg, #f39c12 0%, #e67e22 100%)' }; // Comedy orange
        } else if (template.title?.includes('Recipe') || template.title?.includes('Food')) {
          return { background: 'linear-gradient(135deg, #ff9500 0%, #ff6b35 100%)' }; // Food orange
        } else if (template.title?.includes('Workout') || template.title?.includes('Fitness')) {
          return { background: 'linear-gradient(135deg, #ff4757 0%, #ff6b6b 100%)' }; // Fitness red
        } else if (template.title?.includes('Fashion') || template.title?.includes('OOTD')) {
          return { background: 'linear-gradient(135deg, #e91e63 0%, #9c27b0 100%)' }; // Fashion pink
        } else if (template.title?.includes('Study') || template.title?.includes('Educational')) {
          return { background: 'linear-gradient(135deg, #3498db 0%, #2ecc71 100%)' }; // Education blue
        } else if (template.title?.includes('Travel')) {
          return { background: 'linear-gradient(135deg, #00bcd4 0%, #ff9800 100%)' }; // Travel cyan
        } else if (template.title?.includes('Pet')) {
          return { background: 'linear-gradient(135deg, #ff6b6b 0%, #4ecdc4 100%)' }; // Pet pink/teal
        } else {
          return { background: 'linear-gradient(135deg, #ff0050 0%, #000000 100%)' }; // Default TikTok
        }
      }
      // Default fallback for non-TikTok templates
      return { background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' };
    }

    // If no video source, show a clear placeholder
    if (!videoSource) {
      return (
        <div className="relative group rounded-2xl p-5 flex flex-col items-center justify-center min-h-[240px] bg-gray-900 text-gray-400 border border-dashed border-gray-600">
          <span className="text-4xl mb-2">🚫</span>
          <div className="text-lg font-bold mb-1">No video available</div>
          <div className="text-sm">This template does not have a valid video source.</div>
        </div>
      );
    }

    return (
      <div
        data-testid="template-card"
        className="relative group rounded-2xl p-5 cursor-pointer transition-all overflow-hidden shadow-lg border border-transparent hover:border-yellow-400 hover:shadow-[0_4px_32px_0_rgba(255,214,10,0.15)] hover:scale-105"
        style={{
          minHeight: 240,
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "flex-end",
          position: "relative",
          ...backgroundStyle
        }}
        onClick={handleTemplateClick}
        tabIndex={0}
        role="button"
      >
        {/* Loading indicator for video preview extraction or HIGH-RES images */}
        {((template.useVideoPreview && videoPreviewLoading) || (template.preview && !imageLoaded && !imageError)) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-800 rounded-2xl">
            <div className="animate-spin text-2xl text-yellow-400">
              {template.useVideoPreview ? '🎬' : '⚡'}
            </div>
            <div className="text-white text-sm mt-2">
              {template.useVideoPreview ? 'Generating video preview...' : 'Loading preview...'}
            </div>
          </div>
        )}

        {/* Video player for TikTok Video and YouTube Video templates */}
        {videoSource && (template.category === 'TikTok Video' || template.category === 'YouTube Video') ? (
          <div className="absolute inset-0 w-full h-full rounded-2xl overflow-hidden pointer-events-none" style={{ zIndex: 1 }}>
            <video
              ref={setVideoRef}
              src={videoSource}
              className="w-full h-full object-cover pointer-events-none"
              loop
              muted
              playsInline
              preload="none"
              onPlay={() => setIsVideoPlaying(true)}
              onPause={() => setIsVideoPlaying(false)}
              onEnded={() => setIsVideoPlaying(false)}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (import.meta.env.DEV) {
                  console.log('🚫 [TemplateCard] Video element click prevented');
                }
              }}
              onContextMenu={(e) => e.preventDefault()}
              onDoubleClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
            />
            
            {/* Video controls overlay */}
            <div 
              className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 hover:opacity-100 transition-opacity pointer-events-auto"
              data-video-controls="true"
              onClick={toggleVideoPlayback}
            >
              <button 
                className="bg-black/60 hover:bg-black/80 text-white p-3 rounded-full transition-colors"
                data-video-controls="true"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  toggleVideoPlayback(e);
                }}
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                }}
              >
                {isVideoPlaying ? (
                  <svg width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                    <path d="M7 6.25v3.5a.25.25 0 0 0 .5 0V6.25a.25.25 0 0 0-.5 0zm2 0v3.5a.25.25 0 0 0 .5 0V6.25a.25.25 0 0 0-.5 0z"/>
                  </svg>
                ) : (
                  <svg width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                    <path d="m11.596 8.697-6.363 3.692c-.54.313-1.233-.066-1.233-.697V4.308c0-.63.692-1.01 1.233-.696l6.363 3.692a.802.802 0 0 1 0 1.393z"/>
                  </svg>
                )}
              </button>
            </div>

            {/* Video indicator */}
            <div className={`absolute top-2 left-2 text-white px-2 py-1 rounded text-xs font-bold flex items-center gap-1 pointer-events-none ${
              template.category === 'TikTok Video' ? 'bg-[#ff0050]' : 'bg-[#ff0000]'
            }`} style={{ zIndex: 3 }}>
              {isVideoPlaying ? '⏸️' : '▶️'} {template.category === 'TikTok Video' ? 'TikTok' : 'YouTube'}
            </div>
          </div>
        ) : (
          /* Show actual preview image when loaded */
          template.preview && imageLoaded && !imageError && (
            <img
              src={ImageService.getOptimizedImageUrl(template.preview || '', 1200, 900, 'high')}
              alt={template.title}
              className="absolute inset-0 w-full h-full object-cover rounded-2xl"
              style={{ zIndex: 1 }}
            />
          )
        )}

        {/* Gradient overlay for text readability */}
        <div className="absolute inset-0 rounded-2xl" style={{background: 'linear-gradient(to top, rgba(0,0,0,0.7) 60%, rgba(0,0,0,0.1) 100%)', zIndex: 2}} />
        
        <div className="text-3xl mb-2 relative text-yellow-400 drop-shadow-[0_2px_8px_#000a]" style={{zIndex: 10}}>
          {template.icon || getCategoryIcon(category || "")}
        </div>
        
        <div className="text-xl font-bold text-white relative drop-shadow-lg" style={{zIndex: 10}}>
          {template.title}
        </div>
        
        <div className="text-md text-white mt-1 mb-2 relative font-medium drop-shadow-md" style={{zIndex: 10}}>
          {template.desc}
        </div>

        {/* High-res preview indicator or video indicator */}
        {template.useVideoPreview && videoPreviewUrl ? (
          <div className="absolute top-3 right-3 bg-purple-500 text-white text-xs px-2 py-1 rounded-full font-bold flex items-center gap-1" style={{zIndex: 10}}>
            🎬 REAL
          </div>
        ) : videoSource && (template.category === 'TikTok Video' || template.category === 'YouTube Video') ? (
          <div className="absolute top-3 right-3 bg-red-500 text-white text-xs px-2 py-1 rounded-full font-bold flex items-center gap-1" style={{zIndex: 10}}>
            🎥 VIDEO
          </div>
        ) : showPreview && imageLoaded && !imageError && (
          <div className="absolute top-3 right-3 bg-green-500 text-white text-xs px-2 py-1 rounded-full font-bold flex items-center gap-1" style={{zIndex: 10}}>
            🔍 HD
          </div>
                 )}
         
         {/* NEW: Video source type indicator */}
         {videoSource && (
           <div className="absolute top-3 left-3 text-white text-xs px-2 py-1 rounded-full font-bold flex items-center gap-1" style={{
             zIndex: 10,
             backgroundColor: videoSource.includes('firebase') || videoSource.includes('storage.googleapis.com') ? '#10b981' : // Green for Firebase
                             videoSource.startsWith('blob:') ? '#8b5cf6' : // Purple for blob
                             videoSource.startsWith('http') ? '#3b82f6' : // Blue for external
                             videoSource.startsWith('/videos/') ? '#f59e0b' : // Orange for local
                             '#6b7280' // Gray for other
           }}>
             {videoSource.includes('firebase') || videoSource.includes('storage.googleapis.com') ? '🔥 FIREBASE' :
              videoSource.startsWith('blob:') ? '🔗 BLOB' :
              videoSource.startsWith('http') ? '🌐 EXTERNAL' :
              videoSource.startsWith('/videos/') ? '📁 LOCAL' :
              '❓ OTHER'}
           </div>
         )}
        {videoSource && (
          <div className="absolute top-3 left-3 text-white text-xs px-2 py-1 rounded-full font-bold flex items-center gap-1" style={{
            zIndex: 10,
            backgroundColor: videoSource.includes('firebase') || videoSource.includes('storage.googleapis.com') ? '#10b981' : // Green for Firebase
                            videoSource.startsWith('blob:') ? '#8b5cf6' : // Purple for blob
                            videoSource.startsWith('http') ? '#3b82f6' : // Blue for external
                            videoSource.startsWith('/videos/') ? '#f59e0b' : // Orange for local
                            '#6b7280' // Gray for other
          }}>
            {videoSource.includes('firebase') || videoSource.includes('storage.googleapis.com') ? '🔥 FIREBASE' :
             videoSource.startsWith('blob:') ? '🔗 BLOB' :
             videoSource.startsWith('http') ? '🌐 EXTERNAL' :
             videoSource.startsWith('/videos/') ? '📁 LOCAL' :
             '❓ OTHER'}
          </div>
        )}
        
        {/* Resolution indicator on hover */}
        <div className="absolute top-3 left-3 bg-black/50 text-white text-xs px-2 py-1 rounded-full font-bold opacity-0 group-hover:opacity-100 transition-opacity" style={{zIndex: 10}}>
          {showPreview && imageLoaded ? '1200×900' : 'Loading...'}
        </div>
        
        <span className="absolute bottom-3 right-4 text-2xl opacity-10 group-hover:opacity-25 transition text-yellow-400" style={{zIndex: 10}}>
          {template.icon || getCategoryIcon(category || "")}
        </span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#17171c] to-[#232438] text-white">

      
      {/* Header */}
      <div className="w-full flex items-center px-6 py-4 bg-black/50 backdrop-blur-md border-b border-[#222]">
        <button
          onClick={goBack}
          className="flex items-center gap-2 px-4 py-2 font-semibold text-yellow-300 bg-[#16171c] hover:bg-[#232436] rounded-lg transition mr-6"
        >
          <ArrowLeft size={20} />
          Back
        </button>
        <button
          onClick={() => navigate('/studio')}
          className="ml-2 px-4 py-2 font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition"
        >
          Back to Studio
        </button>
        
        {import.meta.env.DEV && (
          <>
            <button
              onClick={forceFirestoreReload}
              className="ml-2 px-4 py-2 font-semibold text-white bg-orange-600 hover:bg-orange-700 rounded-lg transition"
            >
              🔄 Force Reload
            </button>
            <button
              onClick={testFirestoreDirectly}
              className="ml-2 px-4 py-2 font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition"
            >
              🔍 Test Firestore
            </button>
          </>
        )}
        
        <div className="flex items-center gap-3">
          <span className="text-4xl">{getCategoryIcon(decodedCategory)}</span>
          <div>
            <h1 className="text-3xl font-bold text-white">{decodedCategory}</h1>
            <p className="text-lg text-gray-300">
              {loading ? "Loading..." : `${filteredTemplates.length} templates available`}
            </p>
          </div>
        </div>
        
        <div className="flex-1" />
        
        <div className="flex items-center gap-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-3 py-2 rounded-xl bg-[#16171c] text-yellow-100 focus:outline-none focus:ring-2 focus:ring-yellow-400 placeholder-yellow-300"
              style={{ minWidth: 250 }}
            />
            <SearchIcon
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-yellow-300 pointer-events-none"
            />
          </div>
          
          <button className="flex items-center gap-2 px-4 py-2 font-bold text-white bg-gradient-to-r from-yellow-400 to-orange-500 rounded-xl shadow hover:scale-105 transition">
            <Download size={18} /> Download All
          </button>
          
          <button className="flex items-center gap-2 px-4 py-2 font-bold text-white bg-gradient-to-r from-red-400 to-pink-500 rounded-xl shadow hover:scale-105 transition">
            <Share size={18} /> Export
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-8">
        <ModernTemplateGrid
          templates={filteredTemplates.map(template => ({
            id: template.id || `${template.title}-${template.category}`,
            title: template.title,
            category: template.category,
            desc: template.desc || template.description,
            preview: template.preview,
            videoSource: getVideoSource(template),
            icon: template.icon,
            platform: template.platform,
            quality: template.quality,
            tags: template.tags || [],
            isPremium: template.isPremium || false,
            isNew: template.isNew || false,
            isTrending: template.isTrending || false,
            likes: template.likes || Math.floor(Math.random() * 1000),
            views: template.views || Math.floor(Math.random() * 10000),
            duration: template.duration || '0:30',
            aspectRatio: template.aspectRatio || (template.category?.toLowerCase().includes('short') ? '9:16' : '16:9'),
            creator: template.creator || { name: 'ViewsBoost', avatar: '/images/viewsboost-logo.png' }
          }))}
          onTemplateSelect={(template) => {
            console.log('🎯 [CategoryTemplates] Template selected:', template);
            const originalTemplate = templates.find(t => t.id === template.id || t.title === template.title);
            console.log('🔍 [CategoryTemplates] Original template found:', originalTemplate);
            if (originalTemplate) {
              // Store the template in sessionStorage for the editor
              sessionStorage.setItem('selectedTemplate', JSON.stringify(originalTemplate));
              const route = getTemplateEditorRoute(originalTemplate);
              console.log('🚀 [CategoryTemplates] Navigating to route:', route);
              navigate(route);
            } else {
              console.error('❌ [CategoryTemplates] Original template not found for:', template);
            }
          }}
          onTemplatePreview={(template) => {
            const originalTemplate = templates.find(t => t.id === template.id || t.title === template.title);
            if (originalTemplate) {
              setPreviewTemplate(originalTemplate);
            }
          }}
          loading={loading}
          category={decodedCategory}
          viewMode="grid"
          showFilters={false} // We already have search in the header
        />
      </div>

      {/* Template Preview Modal */}
      <TemplatePreviewModal
        open={!!previewTemplate}
        template={previewTemplate}
        onClose={() => setPreviewTemplate(null)}
      />
      
      {/* DEBUG: Template Click Test Component (DEV ONLY) */}
      {import.meta.env.DEV && previewTemplate && (
        <div className="fixed bottom-4 right-4 bg-green-900/90 border border-green-400 rounded-lg p-4 text-white text-sm max-w-md z-[10001]">
          <div className="font-bold text-green-400 mb-2">✅ Template Click Test PASSED</div>
          <div>
            <strong>Template:</strong> {previewTemplate.title}<br/>
            <strong>Category:</strong> {previewTemplate.category}<br/>
            <strong>Has Video:</strong> {previewTemplate.videoSource ? 'Yes' : 'No'}<br/>
            <strong>Modal Opened:</strong> Successfully
          </div>
          <button 
            onClick={() => setPreviewTemplate(null)}
            className="mt-2 px-2 py-1 bg-green-600 hover:bg-green-700 rounded text-xs"
          >
            Close Test
          </button>
        </div>
      )}
    </div>
  );
}

export default CategoryTemplates; 