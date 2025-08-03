import React, { useState } from 'react';
import { fabric } from 'fabric';
import { Search, Grid3X3, List, Star, Heart, Eye, Download } from 'lucide-react';
import { useTemplates } from '../../lib/useTemplates';
import { useEditorStore } from '../../store/editorStore';

interface Template {
  id: string;
  title: string;
  category: string;
  desc?: string;
  preview?: string;
  videoSource?: string;
  isPremium?: boolean;
  isNew?: boolean;
  likes?: number;
  views?: number;
  imageUrl?: string;
  previewUrl?: string;
  type?: string;
}

interface TemplatesPanelProps {
  onSelectTemplate?: (template: Template) => void;
}

const categories = [
  'All',
  'Business',
  'Marketing', 
  'Social Media',
  'Web Design',
  'Documents',
  'Education',
  'Events',
  'Personal'
];

const TemplatesPanel: React.FC<TemplatesPanelProps> = ({ onSelectTemplate }) => {
  const { canvas, setCanvasSize, setBackgroundColor } = useEditorStore();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showBrowseModal, setShowBrowseModal] = useState(false);
  
  // Get templates from existing system
  const templateCategory = selectedCategory === 'All' ? null : selectedCategory;
  const { templates, loading } = useTemplates(templateCategory);

  // Filter templates by search
  const filteredTemplates = templates.filter((template: Template) =>
    template.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    template.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    template.desc?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const loadTemplate = async (template: Template) => {
    console.log('Loading template:', template);
    
    // Call the parent's onSelectTemplate if provided (for Studio.tsx integration)
    if (onSelectTemplate) {
      // Add missing properties for compatibility
      const templateWithProps = {
        ...template,
        imageUrl: template.preview || template.imageUrl,
        previewUrl: template.preview || template.previewUrl,
        type: template.videoSource ? 'video' : 'image'
      };
      onSelectTemplate(templateWithProps);
      return;
    }
    
    if (!canvas) {
      console.error('No canvas available');
      return;
    }

    // Validate canvas has proper element and context
    if (!canvas.getElement || !canvas.getElement()) {
      console.error('Canvas element not available');
      return;
    }

    try {
      // Clear current canvas safely
      if (canvas.getContext && canvas.getContext()) {
        canvas.clear();
      } else {
        console.warn('Canvas context not available, skipping clear');
      }
      
      // Set canvas size based on template type
      let canvasWidth = 800;
      let canvasHeight = 600;
      
      // Determine canvas size from template category
      const category = template.category.toLowerCase();
      if (category.includes('social media') || category.includes('instagram')) {
        canvasWidth = 1080;
        canvasHeight = 1080; // Square format
      } else if (category.includes('story')) {
        canvasWidth = 1080;
        canvasHeight = 1920; // Story format
      } else if (category.includes('youtube') || category.includes('video')) {
        canvasWidth = 1920;
        canvasHeight = 1080; // Video format
      } else if (category.includes('business card')) {
        canvasWidth = 1050;
        canvasHeight = 600; // Business card format
      }

      setCanvasSize({ width: canvasWidth, height: canvasHeight });

      // Load template background if it has an image/video
      if (template.preview || template.videoSource) {
        const imageUrl = template.preview || template.videoSource;
        
        // Check if it's a video template
        const isVideo = imageUrl.includes('.mp4') || imageUrl.includes('.webm') || imageUrl.includes('.mov') || template.videoSource;
        
        if (isVideo && template.videoSource) {
          // Handle video templates
          const video = document.createElement('video');
          video.src = template.videoSource;
          video.crossOrigin = 'anonymous';
          video.autoplay = false;
          video.loop = true;
          video.muted = true;
          video.width = canvasWidth;
          video.height = canvasHeight;
          
          video.onloadeddata = () => {
            if (canvas && canvas.getElement && canvas.getElement()) {
              try {
                const videoObject = new fabric.Image(video, {
                  left: 0,
                  top: 0,
                  selectable: true,
                  evented: true,
                });
                
                // Scale video to fit canvas
                const scaleX = canvasWidth / video.videoWidth;
                const scaleY = canvasHeight / video.videoHeight;
                const scale = Math.min(scaleX, scaleY);
                
                videoObject.set({
                  scaleX: scale,
                  scaleY: scale,
                });
                
                (videoObject as any).type = 'video';
                (videoObject as any).id = `template-video-${Date.now()}`;
                
                canvas.add(videoObject);
                canvas.centerObject(videoObject);
                canvas.renderAll();
                
                // Play video
                video.play();
              } catch (error) {
                console.error('Error adding video to canvas:', error);
              }
            }
          };
          
          video.onerror = () => {
            console.error('Error loading video template:', template.videoSource);
            // Fallback to preview image if video fails
            if (template.preview) {
              loadImageTemplate(template.preview, canvasWidth, canvasHeight);
            }
          };
        } else {
          // Handle image templates
          loadImageTemplate(imageUrl, canvasWidth, canvasHeight);
        }
      }
      
      // Helper function to load image templates
      function loadImageTemplate(imageUrl: string, width: number, height: number) {
        fabric.Image.fromURL(imageUrl, (img) => {
          if (img && canvas && canvas.getElement && canvas.getElement()) {
            try {
              // Scale image to fit canvas
              const scaleX = width / (img.width || 1);
              const scaleY = height / (img.height || 1);
              const scale = Math.min(scaleX, scaleY);
              
              img.set({
                left: 0,
                top: 0,
                scaleX: scale,
                scaleY: scale,
                selectable: false,
                evented: false,
              });

              canvas.setBackgroundImage(img, () => {
                if (canvas.renderAll) {
                  canvas.renderAll();
                }
              });
            } catch (error) {
              console.error('Error setting background image:', error);
            }
          }
        }, { 
          crossOrigin: 'anonymous',
          onerror: (e) => {
            console.error('Error loading image:', imageUrl, e);
          }
        });
      }

      // Add sample text based on template
      const sampleTexts = getSampleTextForTemplate(template);
      sampleTexts.forEach((textConfig, index) => {
        setTimeout(() => {
          if (canvas && canvas.getElement && canvas.getElement()) {
            try {
              const textObject = new fabric.IText(textConfig.text, {
                left: textConfig.left,
                top: textConfig.top,
                fontSize: textConfig.fontSize,
                fontFamily: textConfig.fontFamily,
                fontWeight: textConfig.fontWeight,
                fill: textConfig.color,
                textAlign: textConfig.textAlign,
              });

              const id = `template-text-${Date.now()}-${index}`;
              (textObject as any).id = id;

              canvas.add(textObject);
              canvas.renderAll();
            } catch (error) {
              console.error('Error adding text to canvas:', error);
            }
          }
        }, index * 100);
      });

    } catch (error) {
      console.error('Error loading template:', error);
    }
  };

  const getSampleTextForTemplate = (template: Template) => {
    const category = template.category.toLowerCase();
    
    if (category.includes('business')) {
      return [
        {
          text: 'Your Company Name',
          left: 50,
          top: 50,
          fontSize: 32,
          fontFamily: 'Arial',
          fontWeight: 'bold',
          color: '#2563eb',
          textAlign: 'left' as const,
        },
        {
          text: 'Professional Services',
          left: 50,
          top: 100,
          fontSize: 18,
          fontFamily: 'Arial',
          fontWeight: 'normal',
          color: '#4b5563',
          textAlign: 'left' as const,
        }
      ];
    } else if (category.includes('social')) {
      return [
        {
          text: 'Social Media Post',
          left: 100,
          top: 200,
          fontSize: 48,
          fontFamily: 'Arial',
          fontWeight: 'bold',
          color: '#ffffff',
          textAlign: 'center' as const,
        },
        {
          text: '#hashtag #trending',
          left: 100,
          top: 280,
          fontSize: 24,
          fontFamily: 'Arial',
          fontWeight: 'normal',
          color: '#fbbf24',
          textAlign: 'center' as const,
        }
      ];
    } else if (category.includes('marketing')) {
      return [
        {
          text: 'Special Offer!',
          left: 100,
          top: 100,
          fontSize: 42,
          fontFamily: 'Arial',
          fontWeight: 'bold',
          color: '#dc2626',
          textAlign: 'center' as const,
        },
        {
          text: 'Limited Time Only',
          left: 100,
          top: 160,
          fontSize: 20,
          fontFamily: 'Arial',
          fontWeight: 'normal',
          color: '#374151',
          textAlign: 'center' as const,
        }
      ];
    }
    
    // Default template text
    return [
      {
        text: template.title || 'Your Title Here',
        left: 100,
        top: 100,
        fontSize: 36,
        fontFamily: 'Arial',
        fontWeight: 'bold',
        color: '#111827',
        textAlign: 'center' as const,
      }
    ];
  };

  if (loading) {
    return (
      <div className="p-4">
        <h3 className="text-lg font-semibold mb-4">Templates</h3>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="p-4 h-full flex flex-col">
        <h3 className="text-lg font-semibold mb-4">Templates</h3>
        
        {/* Browse Templates Button */}
        <button
          onClick={() => setShowBrowseModal(true)}
          className="w-full p-6 bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-dashed border-blue-200 rounded-2xl hover:from-blue-100 hover:to-purple-100 hover:border-blue-300 transition-all duration-300 flex flex-col items-center gap-3 group mb-6"
        >
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
            <span className="text-white text-2xl">🎨</span>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-gray-800 mb-1">Browse Templates</div>
            <div className="text-sm text-gray-600">Choose from 1000+ designs</div>
          </div>
        </button>
      
      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
        <input
          type="text"
          placeholder="Search templates..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* View Mode Toggle */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-1">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'}`}
          >
            <Grid3X3 size={16} />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded ${viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'}`}
          >
            <List size={16} />
          </button>
        </div>
        <span className="text-xs text-gray-500">{filteredTemplates.length} templates</span>
      </div>

      {/* Categories */}
      <div className="mb-4">
        <div className="flex flex-wrap gap-1">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-3 py-1 rounded-full text-xs transition-colors ${
                selectedCategory === category
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Templates Grid/List */}
      <div className="flex-1 overflow-y-auto">
        {filteredTemplates.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No templates found</p>
            <p className="text-sm mt-1">Try adjusting your search or category</p>
          </div>
        ) : (
          <div className={`gap-3 ${viewMode === 'grid' ? 'grid grid-cols-2' : 'space-y-2'}`}>
            {filteredTemplates.map((template: Template) => (
              <div
                key={template.id}
                className={`group cursor-pointer border border-gray-200 rounded-lg overflow-hidden hover:border-blue-300 hover:shadow-md transition-all ${
                  viewMode === 'list' ? 'flex' : ''
                }`}
                onClick={() => loadTemplate(template)}
              >
                {/* Template Preview */}
                <div className={`relative bg-gray-100 ${viewMode === 'grid' ? 'aspect-video' : 'w-20 h-16 flex-shrink-0'}`}>
                  {template.preview || template.videoSource ? (
                    <img
                      src={template.preview || template.videoSource}
                      alt={template.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <Eye size={24} />
                    </div>
                  )}
                  
                  {/* Premium Badge */}
                  {template.isPremium && (
                    <div className="absolute top-2 right-2 bg-yellow-500 text-white px-2 py-1 rounded text-xs font-semibold">
                      PRO
                    </div>
                  )}
                  
                  {/* New Badge */}
                  {template.isNew && (
                    <div className="absolute top-2 left-2 bg-green-500 text-white px-2 py-1 rounded text-xs font-semibold">
                      NEW
                    </div>
                  )}

                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all flex items-center justify-center">
                    <button className="opacity-0 group-hover:opacity-100 bg-white text-gray-800 px-3 py-1 rounded-lg text-sm font-medium transition-opacity">
                      Use Template
                    </button>
                  </div>
                </div>

                {/* Template Info */}
                <div className={`p-3 ${viewMode === 'list' ? 'flex-1' : ''}`}>
                  <h4 className="font-medium text-sm text-gray-800 line-clamp-2 mb-1">
                    {template.title}
                  </h4>
                  <p className="text-xs text-gray-500 mb-2">{template.category}</p>
                  
                  {viewMode === 'grid' && (
                    <div className="flex items-center justify-between text-xs text-gray-400">
                      <div className="flex items-center gap-3">
                        {template.likes && (
                          <div className="flex items-center gap-1">
                            <Heart size={12} />
                            <span>{template.likes}</span>
                          </div>
                        )}
                        {template.views && (
                          <div className="flex items-center gap-1">
                            <Eye size={12} />
                            <span>{template.views}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>

    {/* Browse Templates Modal */}
    {showBrowseModal && (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div
          className="absolute inset-0 bg-black/40 backdrop-blur-md"
          onClick={() => setShowBrowseModal(false)}
        />
        <div className="relative z-10 bg-white rounded-2xl shadow-2xl mx-4 max-w-6xl w-full max-h-[90vh] overflow-hidden">
          {/* Modal Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
              <span className="text-2xl">🎨</span>
              Browse Templates
            </h2>
            <button
              onClick={() => setShowBrowseModal(false)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <span className="text-gray-500 text-xl">✕</span>
            </button>
          </div>
          
          {/* Modal Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
            {/* Quick Categories */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-4">Quick Categories</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {['Social Media', 'Business', 'Marketing', 'Personal'].map((category) => (
                  <button
                    key={category}
                    onClick={() => {
                      setSelectedCategory(category);
                      setShowBrowseModal(false);
                    }}
                    className="p-4 bg-gray-50 border border-gray-200 rounded-xl hover:border-blue-300 hover:shadow-md transition-all duration-200 text-left group"
                  >
                    <div className="text-2xl mb-2">
                      {category === 'Social Media' ? '📱' : 
                       category === 'Business' ? '💼' : 
                       category === 'Marketing' ? '📢' : '👤'}
                    </div>
                    <div className="font-medium text-gray-800">{category}</div>
                    <div className="text-sm text-gray-500">Templates</div>
                  </button>
                ))}
              </div>
            </div>

            {/* All Templates Grid */}
            <div>
              <h3 className="text-lg font-semibold mb-4">All Templates</h3>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {templates.slice(0, 20).map((template: Template) => (
                    <div
                      key={template.id}
                      className="group cursor-pointer border border-gray-200 rounded-lg overflow-hidden hover:border-blue-300 hover:shadow-lg transition-all"
                      onClick={() => {
                        loadTemplate(template);
                        setShowBrowseModal(false);
                      }}
                    >
                      {/* Template Preview */}
                      <div className="relative bg-gray-100 aspect-video">
                        {template.preview || template.videoSource ? (
                          <img
                            src={template.preview || template.videoSource}
                            alt={template.title}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <Eye size={24} />
                          </div>
                        )}
                        
                        {/* Premium Badge */}
                        {template.isPremium && (
                          <div className="absolute top-2 right-2 bg-yellow-500 text-white px-2 py-1 rounded text-xs font-semibold">
                            PRO
                          </div>
                        )}
                        
                        {/* New Badge */}
                        {template.isNew && (
                          <div className="absolute top-2 left-2 bg-green-500 text-white px-2 py-1 rounded text-xs font-semibold">
                            NEW
                          </div>
                        )}

                        {/* Hover Overlay */}
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all flex items-center justify-center">
                          <button className="opacity-0 group-hover:opacity-100 bg-white text-gray-800 px-4 py-2 rounded-lg text-sm font-medium transition-opacity">
                            Use Template
                          </button>
                        </div>
                      </div>

                      {/* Template Info */}
                      <div className="p-3">
                        <h4 className="font-medium text-sm text-gray-800 line-clamp-2 mb-1">
                          {template.title}
                        </h4>
                        <p className="text-xs text-gray-500">{template.category}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )}
    </>
  );
};

export default TemplatesPanel; 