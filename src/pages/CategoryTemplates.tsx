import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Search as SearchIcon, Download, Share, X } from "lucide-react";
import { useTemplates } from "../lib/useTemplates";
import { ImageService } from "../lib/services/imageService";
import { useVideoPreview } from "../components/VideoPreviewExtractor";
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
  const { templates, loading } = useTemplates(decodedCategory);

  // Add force Firestore reload function
  const forceFirestoreReload = () => {
    console.log(`🔄 [CategoryTemplates] Forcing cache invalidation for "${decodedCategory}"...`);
    window.dispatchEvent(new CustomEvent('templatesUpdated', { 
      detail: { 
        source: 'manual-reload', 
        timestamp: Date.now(),
        categories: [decodedCategory]
      } 
    }));
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

  // Get video source based on template type (supports Envato premium videos)
  function getVideoSource(template: any) {
    // If template has a videoSource (Envato premium), use it directly
    if (template.videoSource) {
      return template.videoSource;
    }
    
    if (template.category === 'TikTok Video') {
      if (template.title?.includes('Dance')) return '/videos/video1.mp4';
      if (template.title?.includes('Workout') || template.title?.includes('Fitness')) return '/videos/video2.mp4';
      if (template.title?.includes('Recipe') || template.title?.includes('Food')) return '/videos/video3.mp4';
      if (template.title?.includes('Comedy')) return '/videos/video4.mp4';
      if (template.title?.includes('Travel')) return '/videos/video5.mp4';
      return '/videos/video6.mp4'; // Default for other TikTok templates
    } else if (template.category === 'YouTube Video') {
      // Map YouTube templates to dedicated videos
      if (template.title?.includes('Gaming') || template.title?.includes('Neon')) return '/videos/youtube/gaming-neon.mp4';
      if (template.title?.includes('Tutorial') || template.title?.includes('Clean')) return '/videos/youtube/tutorial-clean.mp4';
      if (template.title?.includes('Reaction') || template.title?.includes('Shocked')) return '/videos/youtube/reaction-shocked.mp4';
      if (template.title?.includes('Tech') || template.title?.includes('Sleek')) return '/videos/youtube/tech-sleek.mp4';
      if (template.title?.includes('Cooking') || template.title?.includes('Recipe')) return '/videos/youtube/cooking-appetizing.mp4';
      if (template.title?.includes('Fitness') || template.title?.includes('Workout')) return '/videos/youtube/fitness-motivational.mp4';
      if (template.title?.includes('News') || template.title?.includes('Breaking')) return '/videos/youtube/news-breaking.mp4';
      if (template.title?.includes('Lifestyle') || template.title?.includes('Vlog')) return '/videos/youtube/lifestyle-cozy.mp4';
      if (template.title?.includes('Music') || template.title?.includes('Artistic')) return '/videos/youtube/music-artistic.mp4';
      if (template.title?.includes('Comedy') || template.title?.includes('Funny')) return '/videos/youtube/comedy-funny.mp4';
      return '/videos/youtube/gaming-neon.mp4'; // Default for other YouTube templates
    }
    return null;
  }

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

    // Toggle video play/pause
    const toggleVideoPlayback = (e: React.MouseEvent) => {
      e.stopPropagation(); // Prevent card click
      if (videoRef) {
        if (isVideoPlaying) {
          videoRef.pause();
        } else {
          videoRef.play();
        }
        setIsVideoPlaying(!isVideoPlaying);
      }
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

    return (
      <div
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
        onClick={() => setPreviewTemplate(template)}
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
          <div className="absolute inset-0 w-full h-full rounded-2xl overflow-hidden" style={{ zIndex: 1 }}>
            <video
              ref={setVideoRef}
              src={videoSource}
              className="w-full h-full object-cover"
              loop
              muted
              playsInline
              onPlay={() => setIsVideoPlaying(true)}
              onPause={() => setIsVideoPlaying(false)}
              onEnded={() => setIsVideoPlaying(false)}
            />
            
            {/* Video controls overlay */}
            <div 
              className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 hover:opacity-100 transition-opacity"
              onClick={toggleVideoPlayback}
            >
              <button className="bg-black/60 hover:bg-black/80 text-white p-3 rounded-full transition-colors">
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
            <div className={`absolute top-2 left-2 text-white px-2 py-1 rounded text-xs font-bold flex items-center gap-1 ${
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
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-2xl text-yellow-400">Loading templates...</div>
          </div>
        ) : filteredTemplates.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="text-6xl mb-4 opacity-50">{getCategoryIcon(decodedCategory)}</div>
            <h2 className="text-3xl font-bold text-gray-300 mb-2">
              {searchQuery ? "No matching templates found" : "No templates available"}
            </h2>
            <p className="text-lg text-gray-400">
              {searchQuery 
                ? `Try adjusting your search for "${searchQuery}"` 
                : `Import templates for the "${decodedCategory}" category to see them here.`
              }
            </p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="mt-4 px-6 py-2 bg-yellow-400 text-black rounded-lg font-semibold hover:bg-yellow-300 transition"
              >
                Clear Search
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Category Header */}
            <div className="mb-8">
              <div className={`inline-flex items-center gap-3 px-6 py-3 rounded-full text-white font-bold text-lg bg-gradient-to-r ${getCategoryColor(decodedCategory)} shadow-lg`}>
                <span className="text-2xl">{getCategoryIcon(decodedCategory)}</span>
                {decodedCategory} Templates
              </div>
            </div>

            {/* Templates Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {filteredTemplates.map((template, index) => (
                <TemplateCard key={template.id || `${template.title}-${index}`} template={template} />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Template Preview Modal */}
      <TemplatePreviewModal
        open={!!previewTemplate}
        template={previewTemplate}
        onClose={() => setPreviewTemplate(null)}
      />
    </div>
  );
}

export default CategoryTemplates; 