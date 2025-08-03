import React from "react";
import { useNavigate } from "react-router-dom";
import { Play, Edit, ExternalLink, X } from "lucide-react";

// Helper function to determine template format and editor route - ALL NOW USE STUDIO
function getTemplateEditorInfo(template: any) {
  if (!template || !template.category) {
    return {
      format: 'standard',
      route: `/studio?template=${encodeURIComponent(template.id || template.title)}`,
      displayFormat: 'Standard Format',
      aspectRatio: '16:9',
      description: 'Regular video or image format'
    };
  }

  // Debug log
  console.log('[ROUTE DEBUG][PreviewModal]', { template });

  // All templates now open in Studio regardless of format
  const route = `/studio?template=${encodeURIComponent(template.id || template.title)}`;
  console.log('[ROUTE DEBUG][PreviewModal] Using Studio route:', route);

  // Determine display format for UI purposes (but all use Studio)
  const category = template.category.toLowerCase();
  
  // Image template check
  const isImageTemplate = template.fileType === 'image' || template.detectedPlatform === 'General';
  if (isImageTemplate) {
    return {
      format: 'original',
      route,
      displayFormat: 'Original Format',
      aspectRatio: template.aspectRatio || 'original',
      description: 'Original image aspect ratio (auto-detected)'
    };
  }

  // Shorts/Reels formats (9:16 vertical)
  const shortsCategories = [
    'instagram reel', 'instagram reels', 'tiktok short', 'tiktok shorts', 
    'tiktok video', 'facebook reel', 'facebook reels', 'youtube short', 
    'youtube shorts', 'snapchat story', 'pinterest story'
  ];
  
  const isShorts = shortsCategories.some(shortsCat => 
    category.includes(shortsCat.replace(' ', '')) || 
    category.includes(shortsCat)
  );
  
  if (isShorts) {
    return {
      format: 'shorts',
      route,
      displayFormat: 'Shorts Format',
      aspectRatio: '9:16',
      description: 'Vertical format for TikTok, Instagram Reels, YouTube Shorts'
    };
  }
  
  // Story formats (9:16 vertical)
  const storyCategories = ['story', 'instagram story', 'facebook story'];
  const isStory = storyCategories.some(storyCat => category.includes(storyCat));
  
  if (isStory) {
    return {
      format: 'story',
      route,
      displayFormat: 'Story Format',
      aspectRatio: '9:16',
      description: 'Vertical format for Instagram/Facebook Stories'
    };
  }
  
  const squareCategories = ['instagram post', 'facebook post', 'post', 'square'];
  const isSquare = squareCategories.some(sqCat => category.includes(sqCat));

  if (isSquare) {
    return {
      format: 'square',
      route,
      displayFormat: 'Square Format',
      aspectRatio: '1:1',
      description: 'Square format for social media posts'
    };
  }

  // Thumbnail formats (16:9 but specialized)
  const thumbnailCategories = ['thumbnail', 'youtube thumbnail'];
  const isThumbnail = thumbnailCategories.some(thumbCat => category.includes(thumbCat));

  if (isThumbnail) {
    return {
      format: 'thumbnail',
      route,
      displayFormat: 'Thumbnail Format',
      aspectRatio: '16:9',
      description: 'Optimized for video thumbnails and previews'
    };
  }

  // Default: Standard video format (16:9)
  return {
    format: 'standard',
    route,
    displayFormat: 'Video Format',
    aspectRatio: '16:9',
    description: 'Standard landscape format for videos and presentations'
  };
}

export default function TemplatePreviewModal({ open, template, onClose }: any) {
  const navigate = useNavigate();
  
  // DEBUG: Log modal state changes
  React.useEffect(() => {
    if (import.meta.env.DEV) {
      if (open && template) {
        console.log('🎭 [TemplatePreviewModal] Modal opened for template:', {
          title: template.title,
          category: template.category,
          id: template.id,
          videoSource: template.videoSource
        });
      } else if (!open) {
        console.log('🎭 [TemplatePreviewModal] Modal closed');
      }
    }
  }, [open, template]);
  
  if (!open || !template) return null;
  
  const editorInfo = getTemplateEditorInfo(template);
  
  const handleOpenEditor = () => {
    if (import.meta.env.DEV) {
      console.log('🎨 [TemplatePreviewModal] Opening editor for:', template.title, 'Route:', editorInfo.route);
    }
    
    // Store template data in sessionStorage for the editor
    sessionStorage.setItem('selectedTemplate', JSON.stringify(template));
    
    // Navigate to the appropriate editor
    navigate(editorInfo.route);
    onClose();
  };
  
  const handleQuickPreview = () => {
    if (import.meta.env.DEV) {
      console.log('👁️ [TemplatePreviewModal] Quick preview for:', template.title, {
        preview: template.preview,
        videoSource: template.videoSource,
        category: template.category
      });
    }
    
    // Always use the videoSource from the template prop
    const getActualVideoSource = (template: any) => {
      if (template.videoSource && (template.videoSource.startsWith('http') || template.videoSource.startsWith('blob:'))) {
        return template.videoSource;
      }
      return null;
    };

    const actualVideoSource = getActualVideoSource(template);

    // If no video source, show a clear placeholder
    if (!actualVideoSource) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[200px] bg-gray-900 text-gray-400 border border-dashed border-gray-600 p-6">
          <span className="text-4xl mb-2">🚫</span>
          <div className="text-lg font-bold mb-1">No video available</div>
          <div className="text-sm">This template does not have a valid video source.</div>
        </div>
      );
    }
    
    // Priority: actual video source, then preview image
    if (actualVideoSource) {
      if (import.meta.env.DEV) {
        console.log('👁️ [TemplatePreviewModal] Opening video source:', actualVideoSource);
      }
      window.open(actualVideoSource, '_blank');
    } else if (template.preview && !template.preview.includes('blob:')) {
      if (import.meta.env.DEV) {
        console.log('👁️ [TemplatePreviewModal] Opening preview image:', template.preview);
      }
      window.open(template.preview, '_blank');
    } else {
      // Fallback: show a placeholder or error message
      if (import.meta.env.DEV) {
        console.warn('👁️ [TemplatePreviewModal] No valid preview source available');
      }
      alert('Preview not available for this template');
    }
  };

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-md"
        onClick={onClose}
      />
      <div className="relative z-10 bg-gradient-to-br from-[#232438] to-[#191a21] rounded-2xl shadow-2xl mx-4 overflow-hidden"
        style={{
          width: '90vw',
          maxWidth: '600px',
          maxHeight: '90vh',
          border: '1.5px solid #292a34'
        }}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-700/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{template.icon || '📄'}</span>
              <div>
                <h2 className="text-xl font-bold text-white">{template.title}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm bg-purple-500/20 text-purple-300 px-2 py-1 rounded-full">
                    {template.category}
                  </span>
                  <span className="text-sm bg-blue-500/20 text-blue-300 px-2 py-1 rounded-full">
                    {editorInfo.displayFormat}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full bg-black/30 text-gray-300 hover:bg-black/50 transition"
            >
              <X size={20} />
            </button>
          </div>
        </div>
        
        {/* Preview Section */}
        <div className="p-6">
          {/* Format Info */}
          <div className="mb-6 p-4 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-lg border border-indigo-500/20">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 bg-indigo-500/20 rounded-lg flex items-center justify-center">
                <span className="text-indigo-300 text-sm font-bold">{editorInfo.aspectRatio}</span>
              </div>
              <div>
                <h3 className="text-white font-semibold">{editorInfo.displayFormat}</h3>
                <p className="text-gray-400 text-sm">{editorInfo.description}</p>
              </div>
            </div>
          </div>
          
          {/* Template Preview */}
          {template.preview && (
            <div className="mb-6">
              <div className="relative bg-black/20 rounded-lg overflow-hidden" style={{
                aspectRatio: editorInfo.format === 'shorts' || editorInfo.format === 'story' ? '9/16' : 
                            editorInfo.format === 'square' ? '1/1' : '16/9'
              }}>
                <img
                  src={template.preview}
                  alt={template.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
                {(template.category === 'TikTok Video' || template.category === 'YouTube Video' || template.useVideoPreview) && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                    <button
                      onClick={handleQuickPreview}
                      className="flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-lg text-white hover:bg-white/30 transition"
                    >
                      <Play size={16} />
                      Preview Video
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Template Description */}
          {template.desc && (
            <div className="mb-6">
              <p className="text-gray-300 leading-relaxed">{template.desc}</p>
            </div>
          )}
          
          {/* Tags */}
          {template.tags && template.tags.length > 0 && (
            <div className="mb-6">
              <div className="flex flex-wrap gap-2">
                {template.tags.slice(0, 6).map((tag: string, index: number) => (
                  <span
                    key={index}
                    className="text-xs bg-gray-700/50 text-gray-300 px-2 py-1 rounded-full"
                  >
                    {tag}
                  </span>
                ))}
                {template.tags.length > 6 && (
                  <span className="text-xs bg-gray-700/50 text-gray-300 px-2 py-1 rounded-full">
                    +{template.tags.length - 6} more
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
        
        {/* Action Buttons */}
        <div className="p-6 pt-0">
          <div className="flex gap-3">
            <button
              onClick={handleOpenEditor}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-semibold rounded-lg hover:from-yellow-500 hover:to-orange-600 transition"
            >
              <Edit size={18} />
              Edit Template
            </button>
            
            {(template.preview || template.videoSource) && (
              <button
                onClick={handleQuickPreview}
                className="px-4 py-3 bg-gray-700/50 text-white font-medium rounded-lg hover:bg-gray-700/70 transition flex items-center gap-2"
              >
                <ExternalLink size={18} />
                Preview
              </button>
            )}
          </div>
          
          <div className="mt-3 text-center">
            <p className="text-xs text-gray-500">
              Template will open in {editorInfo.displayFormat} ({editorInfo.aspectRatio}) editor
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
