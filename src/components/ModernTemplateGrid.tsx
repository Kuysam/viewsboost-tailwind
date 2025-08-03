import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, Pause, Heart, Download, Eye, Star, 
  Clock, Zap, Crown, Sparkles, Video, Image as ImageIcon,
  ExternalLink, Edit3, Copy, Share2, Bookmark,
  Filter, Search, Grid3X3, LayoutGrid, List
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface ModernTemplate {
  id: string;
  title: string;
  category: string;
  desc?: string;
  preview?: string;
  videoSource?: string;
  useVideoPreview?: boolean;
  icon?: string;
  platform?: string;
  quality?: string;
  tags?: string[];
  isPremium?: boolean;
  isNew?: boolean;
  isTrending?: boolean;
  likes?: number;
  views?: number;
  duration?: string;
  aspectRatio?: string;
  creator?: {
    name: string;
    avatar?: string;
  };
}

interface ModernTemplateGridProps {
  templates: ModernTemplate[];
  onTemplateSelect: (template: ModernTemplate) => void;
  onTemplatePreview?: (template: ModernTemplate) => void;
  loading?: boolean;
  category?: string;
  viewMode?: 'grid' | 'list';
  showFilters?: boolean;
}

const ModernTemplateCard: React.FC<{
  template: ModernTemplate;
  onSelect: (template: ModernTemplate) => void;
  onPreview?: (template: ModernTemplate) => void;
  viewMode?: 'grid' | 'list';
}> = ({ template, onSelect, onPreview, viewMode = 'grid' }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleMouseEnter = () => {
    setIsHovered(true);
    if (template.videoSource && videoRef.current && !isPlaying) {
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    if (videoRef.current && isPlaying) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
      setIsPlaying(false);
    }
  };

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsLiked(!isLiked);
    toast.success(isLiked ? 'Removed from favorites' : 'Added to favorites');
  };

  const handleBookmark = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsBookmarked(!isBookmarked);
    toast.success(isBookmarked ? 'Removed from bookmarks' : 'Bookmarked');
  };

  const handlePreview = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onPreview) {
      onPreview(template);
    }
  };

  const getAspectRatioClass = () => {
    if (template.aspectRatio === '9:16' || template.category?.toLowerCase().includes('short')) {
      return 'aspect-[9/16]';
    } else if (template.aspectRatio === '1:1') {
      return 'aspect-square';
    } else if (template.aspectRatio === '4:5') {
      return 'aspect-[4/5]';
    }
    return 'aspect-video'; // 16:9 default
  };

  // Helper to detect if template is a video
  const isVideoTemplate = (template: any) => {
    if (template.fileType === 'video') return true;
    if (template.videoSource && (template.videoSource.endsWith('.mp4') || template.videoSource.endsWith('.mov') || template.videoSource.endsWith('.webm'))) return true;
    if (template.detectedPlatform && template.detectedPlatform.toLowerCase().includes('video')) return true;
    return false;
  };

  if (viewMode === 'list') {
    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -2 }}
        className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 cursor-pointer hover:bg-white/10 transition-all duration-300"
        onClick={() => onSelect(template)}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div className="flex items-center gap-4">
          {/* Thumbnail */}
          <div className="relative w-24 h-16 rounded-lg overflow-hidden bg-gray-800 flex-shrink-0">
            {template.videoSource ? (
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                muted
                loop
                playsInline
                onLoadedData={() => setVideoLoaded(true)}
              >
                <source src={template.videoSource} type="video/mp4" />
              </video>
            ) : template.preview ? (
              <img
                src={template.preview}
                alt={template.title}
                className="w-full h-full object-cover"
                onLoad={() => setImageLoaded(true)}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-500">
                <ImageIcon size={20} />
              </div>
            )}
            
            {/* Play indicator for videos */}
            {template.videoSource && !isPlaying && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                <div className="w-8 h-8 bg-white/90 rounded-full flex items-center justify-center">
                  <Play size={14} className="text-gray-800 ml-0.5" />
                </div>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div className="min-w-0 flex-1">
                <h3 className="text-white font-semibold text-lg truncate">{template.title}</h3>
                <p className="text-gray-400 text-sm mt-1 line-clamp-2">{template.desc}</p>
                
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-1 rounded-full">
                    {template.category}
                  </span>
                  {isVideoTemplate(template) && template.duration && (
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <Clock size={12} />
                      {template.duration}
                    </span>
                  )}
                  {template.views && (
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <Eye size={12} />
                      {template.views.toLocaleString()}
                    </span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 ml-4">
                <button
                  onClick={handleLike}
                  className={`p-2 rounded-lg transition-colors ${
                    isLiked ? 'bg-red-500/20 text-red-400' : 'bg-white/10 text-gray-400 hover:text-white'
                  }`}
                >
                  <Heart size={16} fill={isLiked ? 'currentColor' : 'none'} />
                </button>
                <button
                  onClick={handlePreview}
                  className="p-2 bg-white/10 text-gray-400 hover:text-white rounded-lg transition-colors"
                >
                  <ExternalLink size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -8, scale: 1.02 }}
      className="group relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden cursor-pointer hover:border-white/20 transition-all duration-300"
      onClick={() => onSelect(template)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Main Preview */}
      <div className={`relative ${getAspectRatioClass()} overflow-hidden bg-gray-900`}>
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20" />
        
        {/* Video Preview */}
        {template.videoSource && (
          <video
            ref={videoRef}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            muted
            loop
            playsInline
            onLoadedData={() => setVideoLoaded(true)}
          >
            <source src={template.videoSource} type="video/mp4" />
          </video>
        )}

        {/* Static Preview */}
        {template.preview && !template.videoSource && (
          <img
            src={template.preview}
            alt={template.title}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            onLoad={() => setImageLoaded(true)}
          />
        )}

        {/* Fallback */}
        {!template.preview && !template.videoSource && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-4xl mb-2">{template.icon || '🎨'}</div>
              <div className="text-white font-medium">{template.title}</div>
            </div>
          </div>
        )}

        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        {/* Top badges */}
        <div className="absolute top-3 left-3 flex gap-2">
          {template.isPremium && (
            <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1">
              <Crown size={12} />
              PRO
            </div>
          )}
          {template.isNew && (
            <div className="bg-gradient-to-r from-green-400 to-emerald-500 text-white px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1">
              <Sparkles size={12} />
              NEW
            </div>
          )}
          {template.isTrending && (
            <div className="bg-gradient-to-r from-pink-400 to-red-500 text-white px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1">
              <Zap size={12} />
              TRENDING
            </div>
          )}
        </div>

        {/* Top right actions */}
        <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={handleBookmark}
            className={`p-2 rounded-full backdrop-blur-sm transition-colors ${
              isBookmarked 
                ? 'bg-blue-500/80 text-white' 
                : 'bg-black/40 text-white hover:bg-black/60'
            }`}
          >
            <Bookmark size={14} fill={isBookmarked ? 'currentColor' : 'none'} />
          </button>
          <button
            onClick={handlePreview}
            className="p-2 bg-black/40 hover:bg-black/60 text-white rounded-full backdrop-blur-sm transition-colors"
          >
            <ExternalLink size={14} />
          </button>
        </div>

        {/* Play button for videos */}
        {template.videoSource && !isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center backdrop-blur-sm">
              <Play size={24} className="text-gray-800 ml-1" />
            </div>
          </div>
        )}

        {/* Duration badge */}
        {isVideoTemplate(template) && template.duration && (
          <div className="absolute bottom-3 right-3 bg-black/60 text-white px-2 py-1 rounded text-xs font-medium backdrop-blur-sm">
            {template.duration}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-white font-semibold text-lg line-clamp-1 flex-1 mr-2">
            {template.title}
          </h3>
          <button
            onClick={handleLike}
            className={`p-1 rounded transition-colors flex-shrink-0 ${
              isLiked ? 'text-red-400' : 'text-gray-400 hover:text-red-400'
            }`}
          >
            <Heart size={16} fill={isLiked ? 'currentColor' : 'none'} />
          </button>
        </div>

        <p className="text-gray-400 text-sm line-clamp-2 mb-3">{template.desc}</p>

        {/* Tags */}
        {template.tags && template.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {template.tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="text-xs bg-white/10 text-gray-300 px-2 py-1 rounded-full"
              >
                {tag}
              </span>
            ))}
            {template.tags.length > 3 && (
              <span className="text-xs text-gray-400">+{template.tags.length - 3}</span>
            )}
          </div>
        )}

        {/* Stats */}
        <div className="flex items-center justify-between text-xs text-gray-400">
          <div className="flex items-center gap-3">
            <span className="bg-blue-500/20 text-blue-300 px-2 py-1 rounded-full">
              {template.category}
            </span>
            {template.views && (
              <span className="flex items-center gap-1">
                <Eye size={12} />
                {template.views.toLocaleString()}
              </span>
            )}
          </div>
          
          {template.creator && (
            <div className="flex items-center gap-2">
              {template.creator.avatar && (
                <img
                  src={template.creator.avatar}
                  alt={template.creator.name}
                  className="w-5 h-5 rounded-full"
                />
              )}
              <span>{template.creator.name}</span>
            </div>
          )}
        </div>

        {/* Hover actions */}
        <AnimatePresence>
          {isHovered && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="flex gap-2 mt-3 pt-3 border-t border-white/10"
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect(template);
                }}
                className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 text-white py-2 px-4 rounded-lg font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
              >
                <Edit3 size={14} />
                Edit
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigator.clipboard.writeText(template.title);
                  toast.success('Template name copied!');
                }}
                className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
              >
                <Copy size={14} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toast.success('Share link copied!');
                }}
                className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
              >
                <Share2 size={14} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

const ModernTemplateGrid: React.FC<ModernTemplateGridProps> = ({
  templates,
  onTemplateSelect,
  onTemplatePreview,
  loading = false,
  category,
  viewMode = 'grid',
  showFilters = true
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'popular' | 'trending'>('newest');
  const [filterBy, setFilterBy] = useState<'all' | 'free' | 'premium'>('all');
  const [currentViewMode, setCurrentViewMode] = useState(viewMode);

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.desc?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesFilter = filterBy === 'all' || 
                         (filterBy === 'premium' && template.isPremium) ||
                         (filterBy === 'free' && !template.isPremium);

    return matchesSearch && matchesFilter;
  });

  const sortedTemplates = [...filteredTemplates].sort((a, b) => {
    switch (sortBy) {
      case 'popular':
        return (b.views || 0) - (a.views || 0);
      case 'trending':
        return (b.isTrending ? 1 : 0) - (a.isTrending ? 1 : 0);
      default:
        return (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0);
    }
  });

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Loading skeleton */}
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-white/10 rounded-lg w-1/3" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <div className="aspect-video bg-white/10 rounded-xl" />
                <div className="h-4 bg-white/10 rounded w-3/4" />
                <div className="h-3 bg-white/10 rounded w-1/2" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">
            {category ? `${category} Templates` : 'All Templates'}
          </h2>
          <p className="text-gray-400">
            {sortedTemplates.length} template{sortedTemplates.length !== 1 ? 's' : ''} available
          </p>
        </div>

        {/* View mode toggle */}
        <div className="flex items-center gap-2 bg-white/10 rounded-lg p-1">
          <button
            onClick={() => setCurrentViewMode('grid')}
            className={`p-2 rounded transition-colors ${
              currentViewMode === 'grid' 
                ? 'bg-white/20 text-white' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <LayoutGrid size={16} />
          </button>
          <button
            onClick={() => setCurrentViewMode('list')}
            className={`p-2 rounded transition-colors ${
              currentViewMode === 'list' 
                ? 'bg-white/20 text-white' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <List size={16} />
          </button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-blue-400 transition-colors"
            />
          </div>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:border-blue-400 transition-colors"
          >
            <option value="newest">Newest</option>
            <option value="popular">Most Popular</option>
            <option value="trending">Trending</option>
          </select>

          {/* Filter */}
          <select
            value={filterBy}
            onChange={(e) => setFilterBy(e.target.value as any)}
            className="px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:border-blue-400 transition-colors"
          >
            <option value="all">All Templates</option>
            <option value="free">Free Only</option>
            <option value="premium">Premium Only</option>
          </select>
        </div>
      )}

      {/* Templates Grid */}
      {sortedTemplates.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-6xl mb-4 opacity-50">🎨</div>
          <h3 className="text-2xl font-bold text-white mb-2">No templates found</h3>
          <p className="text-gray-400 max-w-md mx-auto">
            {searchQuery 
              ? `No templates match "${searchQuery}". Try adjusting your search.`
              : 'No templates available in this category yet.'
            }
          </p>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="mt-4 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium transition-colors"
            >
              Clear Search
            </button>
          )}
        </div>
      ) : (
        <motion.div
          layout
          className={
            currentViewMode === 'grid'
              ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6'
              : 'space-y-4'
          }
        >
          <AnimatePresence>
            {sortedTemplates.map((template) => (
              <ModernTemplateCard
                key={template.id}
                template={template}
                onSelect={onTemplateSelect}
                onPreview={onTemplatePreview}
                viewMode={currentViewMode}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
};

export default ModernTemplateGrid;