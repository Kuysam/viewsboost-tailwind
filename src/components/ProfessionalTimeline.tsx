import React, { useMemo, useCallback } from 'react';
import { useTimelineEngine } from '../hooks/useTimelineEngine';
import { TimelineClip } from '../services/TimelineEngine';
import { 
  Play, 
  Pause, 
  Square, 
  ZoomIn, 
  ZoomOut, 
  SkipBack, 
  SkipForward,
  Volume2,
  Settings,
  Scissors,
  Copy,
  Trash2,
  Video,
  Music,
  Type,
  Shapes
} from 'lucide-react';

interface ProfessionalTimelineProps {
  clips?: TimelineClip[];
  onClipSelect?: (clip: TimelineClip) => void;
  onClipMove?: (clip: TimelineClip, newStartTime: number, newTrackIndex: number) => void;
  onClipResize?: (clip: TimelineClip, newDuration: number) => void;
  onPlayheadMove?: (time: number) => void;
  className?: string;
}

export const ProfessionalTimeline: React.FC<ProfessionalTimelineProps> = React.memo(({
  clips = [],
  onClipSelect,
  onClipMove,
  onClipResize,
  onPlayheadMove,
  className = '',
}) => {
  // Context menu state and handlers (defined before useTimelineEngine to fix hoisting)
  const [contextMenu, setContextMenu] = React.useState<{
    clip: TimelineClip | null;
    x: number;
    y: number;
    visible: boolean;
  }>({ clip: null, x: 0, y: 0, visible: false });

  const handleContextMenu = useCallback((clip: TimelineClip | null, x: number, y: number) => {
    setContextMenu({ clip, x, y, visible: true });
  }, []);

  const hideContextMenu = useCallback(() => {
    setContextMenu(prev => ({ ...prev, visible: false }));
  }, []);

  const {
    timelineRef,
    currentTime,
    totalDuration,
    selectedClips,
    isInitialized,
    addClip,
    removeClip,
    updateClip,
    setPlayheadPosition,
    setZoom,
    play,
    pause,
    stop,
    clearSelection,
  } = useTimelineEngine({
    config: {
      width: 1200,
      height: 370, // Increased height for 4 tracks
      trackHeight: 80, // Larger track height for better thumbnail visibility
      rulerHeight: 50, // Taller ruler for modern design
      timeScale: 80, // More detailed timeline for thumbnail precision
    },
    onClipSelect,
    onClipMove,
    onClipResize,
    onPlayheadMove,
    onContextMenu: handleContextMenu,
  });

  // Format time display
  const formatTime = useCallback((seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    const frames = Math.floor((seconds % 1) * 30); // 30fps
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}:${frames.toString().padStart(2, '0')}`;
  }, []);

  // Zoom levels
  const zoomLevels = [25, 50, 75, 100, 150, 200, 300];
  const [currentZoomIndex, setCurrentZoomIndex] = React.useState(3); // Default to 100

  const handleZoomIn = useCallback(() => {
    if (currentZoomIndex < zoomLevels.length - 1) {
      const newIndex = currentZoomIndex + 1;
      setCurrentZoomIndex(newIndex);
      setZoom(zoomLevels[newIndex]);
    }
  }, [currentZoomIndex, setZoom, zoomLevels]);

  const handleZoomOut = useCallback(() => {
    if (currentZoomIndex > 0) {
      const newIndex = currentZoomIndex - 1;
      setCurrentZoomIndex(newIndex);
      setZoom(zoomLevels[newIndex]);
    }
  }, [currentZoomIndex, setZoom, zoomLevels]);

  // Add sample clips with thumbnails if none provided
  React.useEffect(() => {
    if (isInitialized && clips.length === 0) {
      // Add sample clips with modern multi-track content
      const sampleClips: TimelineClip[] = [
        {
          id: 'video1',
          type: 'video',
          trackIndex: 0,
          startTime: 0,
          duration: 8.5,
          title: 'Main Video',
          thumbnailUrl: 'https://picsum.photos/160/90?random=1',
          color: 0x3b82f6,
          opacity: 1.0,
          transitions: {
            in: 'fade',
            out: 'fade',
            duration: 1.0,
          },
          effects: ['color_correction', 'stabilization'],
        },
        {
          id: 'video2',
          type: 'video',
          trackIndex: 0,
          startTime: 10,
          duration: 6.2,
          title: 'B-Roll',
          thumbnailUrl: 'https://picsum.photos/160/90?random=2',
          color: 0x3b82f6,
          opacity: 1.0,
        },
        {
          id: 'audio1',
          type: 'audio',
          trackIndex: 1,
          startTime: 0,
          duration: 15,
          title: 'Background Music',
          color: 0x14b8a6,
          volume: 0.7,
        },
        {
          id: 'text1',
          type: 'text',
          trackIndex: 2,
          startTime: 2,
          duration: 3,
          title: 'Opening Title',
          color: 0x8b5cf6,
          opacity: 1.0,
          transitions: {
            in: 'slide',
            out: 'fade',
            duration: 0.5,
          },
          effects: ['glow', 'typewriter'],
        },
        {
          id: 'text2',
          type: 'text',
          trackIndex: 2,
          startTime: 12,
          duration: 2.5,
          title: 'Subtitle',
          color: 0x8b5cf6,
          opacity: 0.9,
        },
        {
          id: 'graphics1',
          type: 'graphics',
          trackIndex: 3,
          startTime: 1,
          duration: 4,
          title: 'Logo Animation',
          color: 0xf59e0b,
          opacity: 0.8,
        },
        {
          id: 'video3',
          type: 'video',
          trackIndex: 0,
          startTime: 17,
          duration: 4.8,
          title: 'Outro',
          thumbnailUrl: 'https://picsum.photos/160/90?random=3',
          color: 0x3b82f6,
          opacity: 1.0,
        },
      ];

      sampleClips.forEach(clip => addClip(clip));
    }
  }, [isInitialized, clips.length, addClip]);

  // Playback control
  const [isPlaying, setIsPlaying] = React.useState(false);

  const handlePlayPause = useCallback(() => {
    if (isPlaying) {
      pause();
      setIsPlaying(false);
      try { (window as any).__viewsboost_video_controls?.pause(); } catch {}
    } else {
      play();
      setIsPlaying(true);
      try { (window as any).__viewsboost_video_controls?.play(); } catch {}
    }
  }, [isPlaying, play, pause]);

  const handleStop = useCallback(() => {
    stop();
    setIsPlaying(false);
  }, [stop]);

  const handleSkipBack = useCallback(() => {
    const newTime = Math.max(0, currentTime - 1);
    setPlayheadPosition(newTime);
    try { (window as any).__viewsboost_video_controls?.seek(newTime); } catch {}
  }, [currentTime, setPlayheadPosition]);

  const handleSkipForward = useCallback(() => {
    const newTime = Math.min(totalDuration, currentTime + 1);
    setPlayheadPosition(newTime);
    try { (window as any).__viewsboost_video_controls?.seek(newTime); } catch {}
  }, [currentTime, totalDuration, setPlayheadPosition]);

  // Enhanced scrubbing functionality
  const [isScrubbing, setIsScrubbing] = React.useState(false);
  const [wasPlayingBeforeScrub, setWasPlayingBeforeScrub] = React.useState(false);

  const handleScrubStart = useCallback(() => {
    setIsScrubbing(true);
    setWasPlayingBeforeScrub(isPlaying);
    if (isPlaying) {
      pause();
    }
    try { (window as any).__viewsboost_video_controls?.pause(); } catch {}
  }, [isPlaying, pause]);

  const handleScrubEnd = useCallback(() => {
    setIsScrubbing(false);
    if (wasPlayingBeforeScrub) {
      // Small delay to prevent audio pops
      setTimeout(() => play(), 100);
    }
    try {
      const t = currentTime;
      (window as any).__viewsboost_video_controls?.seek(t);
      if (wasPlayingBeforeScrub) (window as any).__viewsboost_video_controls?.play();
    } catch {}
  }, [wasPlayingBeforeScrub, play, currentTime]);

  const handleMouseScrub = useCallback((event: React.MouseEvent) => {
    if (event.buttons === 1) { // Left mouse button held
      const rect = event.currentTarget.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const percentage = Math.max(0, Math.min(1, x / rect.width));
      const newTime = percentage * totalDuration;
      setPlayheadPosition(newTime);
      try { (window as any).__viewsboost_video_controls?.seek(newTime); } catch {}
    }
  }, [totalDuration, setPlayheadPosition]);

  // Clip operations
  const handleDeleteSelectedClips = useCallback(() => {
    selectedClips.forEach(clip => removeClip(clip.id));
  }, [selectedClips, removeClip]);

  const handleCopySelectedClips = useCallback(() => {
    // TODO: Implement clipboard functionality
    console.log('Copy clips:', selectedClips);
  }, [selectedClips]);

  // Context menu state


  // Close context menu on click outside or escape
  React.useEffect(() => {
    const handleClickOutside = () => hideContextMenu();
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') hideContextMenu();
    };

    if (contextMenu.visible) {
      document.addEventListener('click', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
      return () => {
        document.removeEventListener('click', handleClickOutside);
        document.removeEventListener('keydown', handleEscape);
      };
    }
  }, [contextMenu.visible, hideContextMenu]);

  const handleSplitSelectedClips = useCallback(() => {
    selectedClips.forEach(clip => {
      const splitTime = currentTime - clip.startTime;
      if (splitTime > 0 && splitTime < clip.duration) {
        // Create two clips from the split
        const leftClip: TimelineClip = {
          ...clip,
          id: `${clip.id}_left`,
          duration: splitTime,
        };
        const rightClip: TimelineClip = {
          ...clip,
          id: `${clip.id}_right`,
          startTime: currentTime,
          duration: clip.duration - splitTime,
        };
        
        removeClip(clip.id);
        addClip(leftClip);
        addClip(rightClip);
      }
    });
  }, [selectedClips, currentTime, removeClip, addClip]);

  // Keyboard shortcuts for zoom and playback
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
          case '=':
          case '+':
            event.preventDefault();
            handleZoomIn();
            break;
          case '-':
            event.preventDefault();
            handleZoomOut();
            break;
          case '0':
            event.preventDefault();
            // Reset to 100% zoom
            setCurrentZoomIndex(3);
            setZoom(100);
            break;
        }
      } else {
        switch (event.key) {
          case ' ':
            event.preventDefault();
            handlePlayPause();
            break;
          case 'ArrowLeft':
            event.preventDefault();
            handleSkipBack();
            break;
          case 'ArrowRight':
            event.preventDefault();
            handleSkipForward();
            break;
          case 'Home':
            event.preventDefault();
            setPlayheadPosition(0);
            break;
          case 'End':
            event.preventDefault();
            setPlayheadPosition(totalDuration);
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleZoomIn, handleZoomOut, handlePlayPause, handleSkipBack, handleSkipForward, setZoom, setPlayheadPosition, totalDuration]);

  return (
    <div className={`bg-gray-900 rounded-lg overflow-hidden shadow-2xl ${className}`}>
      {/* Timeline Header Controls - More compact and professional */}
      <div className="bg-gray-850 px-4 py-2 border-b border-gray-700">
        <div className="flex items-center justify-between">
          {/* Enhanced Playback Controls */}
          <div className="flex items-center space-x-2">
            {/* Frame-by-frame controls */}
            <div className="flex items-center bg-gray-700 rounded-lg">
              <button
                onClick={() => setPlayheadPosition(Math.max(0, currentTime - 1/30))}
                className="p-1.5 hover:bg-gray-600 rounded-l-lg transition-colors"
                title="Previous frame"
              >
                <SkipBack className="w-3 h-3 text-white" />
              </button>
              
              <div className="w-px h-6 bg-gray-600"></div>
              
              <button
                onClick={handleSkipBack}
                className="p-1.5 hover:bg-gray-600 transition-colors"
                title="Skip back 1s (←)"
              >
                <SkipBack className="w-3.5 h-3.5 text-white" />
              </button>
            </div>
            
            {/* Main play/pause button */}
            <button
              onClick={handlePlayPause}
              className={`p-3 ${isPlaying ? 'bg-amber-600 hover:bg-amber-700' : 'bg-blue-600 hover:bg-blue-700'} 
                         rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105`}
              title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
            >
              {isPlaying ? (
                <Pause className="w-5 h-5 text-white" />
              ) : (
                <Play className="w-5 h-5 text-white ml-0.5" /> // Slight offset for visual balance
              )}
            </button>
            
            {/* Stop button */}
            <button
              onClick={handleStop}
              className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
              title="Stop"
            >
              <Square className="w-4 h-4 text-white" />
            </button>
            
            {/* Forward controls */}
            <div className="flex items-center bg-gray-700 rounded-lg">
              <button
                onClick={handleSkipForward}
                className="p-1.5 hover:bg-gray-600 transition-colors"
                title="Skip forward 1s (→)"
              >
                <SkipForward className="w-3.5 h-3.5 text-white" />
              </button>
              
              <div className="w-px h-6 bg-gray-600"></div>
              
              <button
                onClick={() => setPlayheadPosition(Math.min(totalDuration, currentTime + 1/30))}
                className="p-1.5 hover:bg-gray-600 rounded-r-lg transition-colors"
                title="Next frame"
              >
                <SkipForward className="w-3 h-3 text-white" />
              </button>
            </div>
            
            {/* Loop/Repeat toggle */}
            <button
              className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors opacity-50"
              title="Loop playback (Coming soon)"
            >
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
            </button>
          </div>

          {/* Enhanced Time Display with Scrub Bar and Zoom Slider */}
          <div className="flex items-center space-x-4">
            <div className="bg-black px-3 py-1 rounded text-green-400 font-mono text-sm min-w-[80px] text-center">
              {formatTime(currentTime)}
            </div>
            
            {/* Scrub Bar */}
            <div className="flex-1 max-w-[200px] mx-4">
              <div 
                className="relative h-2 bg-gray-700 rounded-full cursor-pointer group"
                onMouseDown={handleScrubStart}
                onMouseUp={handleScrubEnd}
                onMouseMove={handleMouseScrub}
                onMouseLeave={handleScrubEnd}
              >
                {/* Progress bar */}
                <div 
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 to-blue-400 rounded-full transition-all duration-75"
                  style={{ width: `${(currentTime / Math.max(totalDuration, 0.1)) * 100}%` }}
                />
                
                {/* Scrub handle */}
                <div 
                  className={`absolute top-1/2 transform -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg border-2 border-blue-500 transition-all duration-75 ${
                    isScrubbing ? 'scale-125' : 'group-hover:scale-110'
                  }`}
                  style={{ left: `calc(${(currentTime / Math.max(totalDuration, 0.1)) * 100}% - 6px)` }}
                />
              </div>
            </div>
            
            <span className="text-gray-400 text-sm">/</span>
            <div className="bg-black px-3 py-1 rounded text-gray-300 font-mono text-sm min-w-[80px] text-center">
              {formatTime(totalDuration)}
            </div>
            
            {/* Playback Speed Indicator */}
            {isScrubbing && (
              <div className="bg-amber-500 text-black px-2 py-1 rounded text-xs font-semibold animate-pulse">
                SCRUB
              </div>
            )}
          </div>

          {/* Tool Controls */}
          <div className="flex items-center space-x-2">
            {/* Clip Operations */}
            {selectedClips.length > 0 && (
              <>
                <button
                  onClick={handleSplitSelectedClips}
                  className="p-1.5 bg-yellow-600 hover:bg-yellow-700 rounded transition-colors"
                  title="Split clip at playhead"
                >
                  <Scissors className="w-3.5 h-3.5 text-white" />
                </button>
                
                <button
                  onClick={handleCopySelectedClips}
                  className="p-1.5 bg-green-600 hover:bg-green-700 rounded transition-colors"
                  title="Copy selected clips"
                >
                  <Copy className="w-3.5 h-3.5 text-white" />
                </button>
                
                <button
                  onClick={handleDeleteSelectedClips}
                  className="p-1.5 bg-red-600 hover:bg-red-700 rounded transition-colors"
                  title="Delete selected clips"
                >
                  <Trash2 className="w-3.5 h-3.5 text-white" />
                </button>
              </>
            )}

            {/* Enhanced Zoom Controls */}
            <div className="flex items-center space-x-2">
              <div className="flex items-center bg-gray-700 rounded-lg px-3 py-1.5">
                <button
                  onClick={handleZoomOut}
                  disabled={currentZoomIndex <= 0}
                  className="p-1 hover:bg-gray-600 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title="Zoom out (Ctrl + -)"
                >
                  <ZoomOut className="w-3.5 h-3.5 text-white" />
                </button>
                
                <span className="px-3 text-white text-xs font-mono min-w-[45px] text-center font-semibold">
                  {zoomLevels[currentZoomIndex]}%
                </span>
                
                <button
                  onClick={handleZoomIn}
                  disabled={currentZoomIndex >= zoomLevels.length - 1}
                  className="p-1 hover:bg-gray-600 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title="Zoom in (Ctrl + +)"
                >
                  <ZoomIn className="w-3.5 h-3.5 text-white" />
                </button>
              </div>
              
              {/* Fit to Timeline Button */}
              <button
                onClick={() => {
                  // Calculate optimal zoom to fit all content
                  const optimalZoom = Math.min(100, Math.max(25, Math.floor((1200 / (totalDuration * 80)) * 100)));
                  const zoomIndex = zoomLevels.findIndex(level => level >= optimalZoom);
                  setCurrentZoomIndex(Math.max(0, zoomIndex));
                  setZoom(zoomLevels[Math.max(0, zoomIndex)]);
                }}
                className="px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs text-white font-medium transition-colors"
                title="Fit timeline to view"
              >
                Fit
              </button>
            </div>

            {/* Zoom slider (like Canva bottom-right) */}
            <div className="flex items-center space-x-2 ml-4">
              <ZoomOut className="w-3.5 h-3.5 text-white" />
              <input
                type="range"
                min={0}
                max={zoomLevels.length - 1}
                step={1}
                value={currentZoomIndex}
                onChange={(e) => {
                  const idx = Number(e.target.value);
                  setCurrentZoomIndex(idx);
                  setZoom(zoomLevels[idx]);
                }}
                className="w-32"
              />
              <ZoomIn className="w-3.5 h-3.5 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Track Labels and Timeline */}
      <div className="flex">
        {/* Track Labels - default only Video. Audio will appear when user adds it from sidebar */}
        <div className="w-32 bg-gray-800 border-r border-gray-700">
          <div className="h-12 bg-gray-750 border-b border-gray-600 flex items-center px-3">
            <span className="text-white text-xs font-bold tracking-wide">TRACKS</span>
          </div>
          <div className="space-y-0">
            {[
              { label: 'Video', icon: Video, color: 'blue', bgColor: 'bg-slate-800' },
            ].map(({ label, icon: Icon, color, bgColor }, index) => (
              <div
                key={label}
                className={`h-[80px] border-b border-gray-700 flex items-center px-3 ${bgColor} hover:brightness-110 transition-all duration-200`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${
                    color === 'blue' ? 'bg-blue-500' : 
                    color === 'teal' ? 'bg-teal-500' :
                    color === 'purple' ? 'bg-purple-500' : 'bg-orange-500'
                  } shadow-lg`} />
                  <Icon className={`w-4 h-4 ${
                    color === 'blue' ? 'text-blue-400' : 
                    color === 'teal' ? 'text-teal-400' :
                    color === 'purple' ? 'text-purple-400' : 'text-orange-400'
                  }`} />
                  <span className="text-white text-xs font-medium">{label}</span>
                </div>
              </div>
            ))}
            {/* Placeholder for Audio track instruction */}
            <div className="h-[80px] border-b border-gray-700 flex items-center px-3 bg-gray-900/40">
              <span className="text-gray-400 text-[11px]">Add Audio from sidebar to create an audio track</span>
            </div>
          </div>
        </div>

        {/* Timeline Canvas */}
        <div className="flex-1 relative bg-gray-900">
          <div 
            ref={timelineRef} 
            className="w-full h-[370px]" // 50px ruler + 320px tracks (4 tracks * 80px)
            style={{ cursor: 'crosshair' }}
          />
          
          {!isInitialized && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-90 backdrop-blur-sm">
              <div className="text-white text-center p-6 bg-gray-800 rounded-xl shadow-2xl">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent mx-auto mb-3"></div>
                <div className="text-sm font-medium">Loading Timeline Engine...</div>
                <div className="text-xs text-gray-400 mt-1">Initializing PIXI.js renderer</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mini Timeline Overview */}
      <div className="bg-gray-800 px-4 py-2 border-t border-gray-700">
        <div className="flex items-center justify-between mb-2">
          <span className="text-white text-xs font-semibold">OVERVIEW</span>
          <div className="flex items-center space-x-2 text-xs text-gray-400">
            <span>Magnetic Snap</span>
            <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
          </div>
        </div>
        
        {/* Mini Timeline (scrubbable overview) */}
        <div
          className="relative h-8 bg-gray-900 rounded-md overflow-hidden cursor-pointer"
          onMouseDown={(e) => {
            const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
            const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
            setPlayheadPosition(pct * Math.max(totalDuration, 0));
          }}
          onMouseMove={(e) => {
            if (e.buttons === 1) {
              const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
              const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
              setPlayheadPosition(pct * Math.max(totalDuration, 0));
            }
          }}
        >
          {/* Timeline background */}
          <div className="absolute inset-0 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900"></div>
          
          {/* Clips overview */}
          <div className="absolute inset-y-0 flex items-center">
            {selectedClips.concat(clips).slice(0, 10).map((clip, index) => {
              const startPercent = (clip.startTime / Math.max(totalDuration, 30)) * 100;
              const widthPercent = (clip.duration / Math.max(totalDuration, 30)) * 100;
              const clipColor = clip.type === 'video' ? 'bg-blue-500' : 
                              clip.type === 'audio' ? 'bg-teal-500' :
                              clip.type === 'text' ? 'bg-purple-500' : 'bg-orange-500';
              
              return (
                <div
                  key={`${clip.id}-${index}`}
                  className={`absolute h-3 ${clipColor} rounded-sm opacity-80 hover:opacity-100 transition-opacity`}
                  style={{
                    left: `${startPercent}%`,
                    width: `${Math.max(widthPercent, 0.5)}%`,
                    top: '50%',
                    transform: 'translateY(-50%)'
                  }}
                  title={clip.title}
                />
              );
            })}
          </div>
          
          {/* Current view indicator */}
          <div className="absolute inset-y-0 border-2 border-amber-500 bg-amber-500 bg-opacity-20 rounded"
               style={{
                 left: '0%',
                 width: `${Math.min(100, (30 / Math.max(totalDuration, 30)) * 100)}%`
               }}
          />
          
          {/* Playhead indicator */}
          <div 
            className="absolute inset-y-0 w-0.5 bg-amber-500 shadow-lg"
            style={{ left: `${(currentTime / Math.max(totalDuration, 30)) * 100}%` }}
          />
        </div>
      </div>

      {/* Status Bar - Enhanced */}
      <div className="bg-gray-850 px-4 py-1.5 border-t border-gray-700 flex items-center justify-between text-xs text-gray-400">
        <div className="flex items-center space-x-4">
          <span className="flex items-center space-x-1">
            <div className={`w-2 h-2 rounded-full ${selectedClips.length > 0 ? 'bg-blue-500' : 'bg-gray-500'}`} />
            <span>
              {selectedClips.length > 0 
                ? `${selectedClips.length} clip${selectedClips.length !== 1 ? 's' : ''} selected`
                : 'No selection'
              }
            </span>
          </span>
          <span>•</span>
          <span>Zoom: {zoomLevels[currentZoomIndex]}%</span>
          <span>•</span>
          <span>Duration: {formatTime(totalDuration)}</span>
          <span>•</span>
          <span className="flex items-center space-x-1">
            <span>FPS: 60</span>
            <div className="w-1 h-1 bg-green-500 rounded-full animate-pulse"></div>
          </span>
        </div>
        <div className="flex items-center space-x-3">
          <span className="flex items-center space-x-1">
            <span>Render Queue: 0</span>
          </span>
          <span>•</span>
          <span className="flex items-center space-x-1">
            <span>GPU Accelerated</span>
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
          </span>
        </div>
      </div>

      {/* Context Menu */}
      {contextMenu.visible && (
        <div
          className="fixed z-50 bg-gray-800 border border-gray-600 rounded-lg shadow-xl py-2 min-w-[180px]"
          style={{
            left: `${Math.min(contextMenu.x, window.innerWidth - 200)}px`,
            top: `${Math.min(contextMenu.y, window.innerHeight - 300)}px`,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {contextMenu.clip ? (
            // Clip context menu
            <>
              <div className="px-3 py-1 text-xs text-gray-400 border-b border-gray-700 mb-1">
                {contextMenu.clip.title} ({contextMenu.clip.type})
              </div>
              
              <button
                onClick={() => {
                  handleCopySelectedClips();
                  hideContextMenu();
                }}
                className="w-full text-left px-3 py-1.5 text-sm text-white hover:bg-gray-700 flex items-center space-x-2"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy</span>
              </button>
              
              <button
                onClick={() => {
                  handleSplitSelectedClips();
                  hideContextMenu();
                }}
                className="w-full text-left px-3 py-1.5 text-sm text-white hover:bg-gray-700 flex items-center space-x-2"
              >
                <Scissors className="w-3.5 h-3.5" />
                <span>Split at Playhead</span>
              </button>
              
              <div className="border-t border-gray-700 my-1"></div>
              
              <button
                onClick={() => {
                  // TODO: Implement duplicate
                  console.log('Duplicate clip:', contextMenu.clip);
                  hideContextMenu();
                }}
                className="w-full text-left px-3 py-1.5 text-sm text-white hover:bg-gray-700"
              >
                Duplicate
              </button>
              
              <button
                onClick={() => {
                  // TODO: Implement properties
                  console.log('Show properties:', contextMenu.clip);
                  hideContextMenu();
                }}
                className="w-full text-left px-3 py-1.5 text-sm text-white hover:bg-gray-700 flex items-center space-x-2"
              >
                <Settings className="w-3.5 h-3.5" />
                <span>Properties</span>
              </button>
              
              <div className="border-t border-gray-700 my-1"></div>
              
              <button
                onClick={() => {
                  if (contextMenu.clip) {
                    removeClip(contextMenu.clip.id);
                  }
                  hideContextMenu();
                }}
                className="w-full text-left px-3 py-1.5 text-sm text-red-400 hover:bg-red-900 hover:bg-opacity-30 flex items-center space-x-2"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            </>
          ) : (
            // Empty area context menu
            <>
              <div className="px-3 py-1 text-xs text-gray-400 border-b border-gray-700 mb-1">
                Timeline
              </div>
              
              <button
                onClick={() => {
                  // TODO: Implement paste
                  console.log('Paste clips');
                  hideContextMenu();
                }}
                className="w-full text-left px-3 py-1.5 text-sm text-white hover:bg-gray-700"
              >
                Paste
              </button>
              
              <button
                onClick={() => {
                  setPlayheadPosition(0);
                  hideContextMenu();
                }}
                className="w-full text-left px-3 py-1.5 text-sm text-white hover:bg-gray-700"
              >
                Go to Start
              </button>
              
              <button
                onClick={() => {
                  setPlayheadPosition(totalDuration);
                  hideContextMenu();
                }}
                className="w-full text-left px-3 py-1.5 text-sm text-white hover:bg-gray-700"
              >
                Go to End
              </button>
              
              <div className="border-t border-gray-700 my-1"></div>
              
              <button
                onClick={() => {
                  // Calculate optimal zoom to fit all content
                  const optimalZoom = Math.min(100, Math.max(25, Math.floor((1200 / (totalDuration * 80)) * 100)));
                  const zoomIndex = zoomLevels.findIndex(level => level >= optimalZoom);
                  setCurrentZoomIndex(Math.max(0, zoomIndex));
                  setZoom(zoomLevels[Math.max(0, zoomIndex)]);
                  hideContextMenu();
                }}
                className="w-full text-left px-3 py-1.5 text-sm text-white hover:bg-gray-700"
              >
                Fit to Timeline
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}); 