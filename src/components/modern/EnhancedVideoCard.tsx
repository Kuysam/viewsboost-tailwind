import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Heart, MessageCircle, Share, MoreVertical, Eye } from 'lucide-react';
import YouTube from 'react-youtube';
import { Video } from '../../lib/services/videoService';
import GlassCard from './GlassCard';

interface EnhancedVideoCardProps {
  video: Video;
  onPlay?: (videoId: string) => void;
  onLike?: (videoId: string) => void;
  onShare?: (videoId: string) => void;
  showStats?: boolean;
  autoPreview?: boolean;
}

export default function EnhancedVideoCard({
  video,
  onPlay,
  onLike,
  onShare,
  showStats = true,
  autoPreview = true
}: EnhancedVideoCardProps) {
  const [isHovering, setIsHovering] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const hoverTimeoutRef = useRef<number>();

  const handleMouseEnter = () => {
    setIsHovering(true);
    if (autoPreview) {
      hoverTimeoutRef.current = window.setTimeout(() => {
        setShowPreview(true);
      }, 500); // Delay before auto-preview
    }
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
    setShowPreview(false);
    setShowActions(false);
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
  };

  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsLiked(!isLiked);
    onLike?.(video.id);
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    onShare?.(video.id);
  };

  const handlePlay = () => {
    onPlay?.(video.id);
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const opts = {
    height: '100%',
    width: '100%',
    playerVars: {
      autoplay: 1,
      controls: 0,
      disablekb: 1,
      fs: 0,
      modestbranding: 1,
      rel: 0,
      showinfo: 0,
      mute: 1,
    },
  };

  return (
    <motion.div
      className="group cursor-pointer"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handlePlay}
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
      layout
    >
      <GlassCard 
        className="overflow-hidden h-full"
        hover={false}
        opacity="low"
      >
        {/* Video Thumbnail/Preview */}
        <div className="relative aspect-video overflow-hidden rounded-t-xl">
          <AnimatePresence mode="wait">
            {showPreview ? (
              <motion.div
                key="preview"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-10"
              >
                <YouTube
                  videoId={video.id}
                  opts={opts}
                  className="w-full h-full"
                />
              </motion.div>
            ) : (
              <motion.img
                key="thumbnail"
                src={video.thumbnail}
                alt={video.title}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                initial={{ opacity: 1 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              />
            )}
          </AnimatePresence>

          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {/* Duration Badge */}
          <motion.div
            className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded-md backdrop-blur-sm"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            {formatDuration(video.duration)}
          </motion.div>

          {/* Video Type Badge */}
          {video.type === 'short' && (
            <motion.div
              className="absolute top-2 left-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white text-xs px-2 py-1 rounded-md font-semibold"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              Short
            </motion.div>
          )}

          {/* Play Button Overlay */}
          <AnimatePresence>
            {isHovering && !showPreview && (
              <motion.div
                className="absolute inset-0 flex items-center justify-center z-20"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                transition={{ type: "spring", duration: 0.3 }}
              >
                <motion.div
                  className="bg-white/90 backdrop-blur-sm rounded-full p-4 shadow-2xl"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Play className="w-8 h-8 text-black fill-current" />
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Quick Actions */}
          <AnimatePresence>
            {isHovering && (
              <motion.div
                className="absolute top-2 right-2 flex flex-col gap-2 z-20"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
              >
                <motion.button
                  className="bg-black/60 backdrop-blur-sm text-white p-2 rounded-full hover:bg-black/80 transition-colors"
                  onClick={handleLike}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Heart className={`w-4 h-4 ${isLiked ? 'fill-red-500 text-red-500' : ''}`} />
                </motion.button>
                <motion.button
                  className="bg-black/60 backdrop-blur-sm text-white p-2 rounded-full hover:bg-black/80 transition-colors"
                  onClick={handleShare}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Share className="w-4 h-4" />
                </motion.button>
                <motion.button
                  className="bg-black/60 backdrop-blur-sm text-white p-2 rounded-full hover:bg-black/80 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowActions(!showActions);
                  }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <MoreVertical className="w-4 h-4" />
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Video Info */}
        <div className="p-4">
          <motion.h3
            className="font-semibold text-white text-sm line-clamp-2 mb-2"
            initial={{ opacity: 0.8 }}
            whileHover={{ opacity: 1 }}
          >
            {video.title}
          </motion.h3>

          {/* Stats */}
          {showStats && (
            <motion.div
              className="flex items-center gap-4 text-xs text-gray-400"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <div className="flex items-center gap-1">
                <Eye className="w-3 h-3" />
                <span>{Math.floor(Math.random() * 10000).toLocaleString()} views</span>
              </div>
              <div className="flex items-center gap-1">
                <Heart className="w-3 h-3" />
                <span>{Math.floor(Math.random() * 1000)} likes</span>
              </div>
              <div className="flex items-center gap-1">
                <MessageCircle className="w-3 h-3" />
                <span>{Math.floor(Math.random() * 100)} comments</span>
              </div>
            </motion.div>
          )}

          {/* Creator Info */}
          <motion.div
            className="flex items-center gap-2 mt-3"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-xs font-bold text-white">
              {video.title.charAt(0).toUpperCase()}
            </div>
            <span className="text-xs text-gray-400">Creator Name</span>
          </motion.div>
        </div>

        {/* Action Dropdown */}
        <AnimatePresence>
          {showActions && (
            <motion.div
              className="absolute top-16 right-2 bg-black/90 backdrop-blur-md rounded-lg p-2 z-30 min-w-32"
              initial={{ opacity: 0, scale: 0.8, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <button className="w-full text-left px-3 py-2 text-sm text-white hover:bg-white/10 rounded transition-colors">
                Add to playlist
              </button>
              <button className="w-full text-left px-3 py-2 text-sm text-white hover:bg-white/10 rounded transition-colors">
                Download
              </button>
              <button className="w-full text-left px-3 py-2 text-sm text-white hover:bg-white/10 rounded transition-colors">
                Report
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </GlassCard>
    </motion.div>
  );
}