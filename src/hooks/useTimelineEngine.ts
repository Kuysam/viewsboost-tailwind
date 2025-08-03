import { useEffect, useRef, useCallback, useState } from 'react';
import { TimelineEngine, TimelineConfig, TimelineClip, TimelineEvents } from '../services/TimelineEngine';

// Default timeline configuration with modern theme
const DEFAULT_CONFIG: TimelineConfig = {
  width: 1200,
  height: 320, // Increased height for 4 tracks
  trackHeight: 80,
  rulerHeight: 50, // Slightly taller for better typography
  timeScale: 80, // 80 pixels per second for detailed editing
  backgroundColor: 0x0f0f0f,
  trackColors: {
    video: 0x1e293b,    // Slate-800
    audio: 0x134e4a,    // Teal-900
    text: 0x581c87,     // Purple-900
    graphics: 0x7c2d12, // Orange-900
  },
  modernTheme: {
    primary: 0x3b82f6,      // Blue-500
    secondary: 0x6b7280,    // Gray-500
    accent: 0xf59e0b,       // Amber-500
    surface: 0x1f2937,      // Gray-800
    surfaceVariant: 0x374151, // Gray-700
    outline: 0x4b5563,      // Gray-600
    shadow: 0x000000,       // Black
  },
};

export interface UseTimelineEngineOptions {
  config?: Partial<TimelineConfig>;
  onClipSelect?: (clip: TimelineClip) => void;
  onClipMove?: (clip: TimelineClip, newStartTime: number, newTrackIndex: number) => void;
  onClipResize?: (clip: TimelineClip, newDuration: number) => void;
  onPlayheadMove?: (time: number) => void;
  onZoomChange?: (scale: number) => void;
}

export interface UseTimelineEngineReturn {
  timelineRef: React.RefObject<HTMLDivElement>;
  timeline: TimelineEngine | null;
  currentTime: number;
  totalDuration: number;
  selectedClips: TimelineClip[];
  isInitialized: boolean;
  
  // Timeline control methods
  addClip: (clip: TimelineClip) => void;
  removeClip: (clipId: string) => void;
  updateClip: (clip: TimelineClip) => void;
  setPlayheadPosition: (time: number) => void;
  setZoom: (scale: number) => void;
  play: () => void;
  pause: () => void;
  stop: () => void;
  
  // Utility methods
  clearSelection: () => void;
  getClipAt: (x: number, y: number) => TimelineClip | null;
  exportTimeline: () => TimelineClip[];
  importTimeline: (clips: TimelineClip[]) => void;
}

export function useTimelineEngine(options: UseTimelineEngineOptions = {}): UseTimelineEngineReturn {
  const timelineRef = useRef<HTMLDivElement>(null);
  const timelineEngine = useRef<TimelineEngine | null>(null);
  const animationFrame = useRef<number | null>(null);
  
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(0);
  const [selectedClips, setSelectedClips] = useState<TimelineClip[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  // Merge default config with provided options
  const config: TimelineConfig = { ...DEFAULT_CONFIG, ...options.config };

  // Timeline event handlers
  const events: TimelineEvents = {
    onClipSelect: useCallback((clip: TimelineClip) => {
      setSelectedClips([clip]);
      options.onClipSelect?.(clip);
    }, [options.onClipSelect]),

    onClipMove: useCallback((clip: TimelineClip, newStartTime: number, newTrackIndex: number) => {
      setTotalDuration(timelineEngine.current?.getTotalDuration() || 0);
      options.onClipMove?.(clip, newStartTime, newTrackIndex);
    }, [options.onClipMove]),

    onClipResize: useCallback((clip: TimelineClip, newDuration: number) => {
      setTotalDuration(timelineEngine.current?.getTotalDuration() || 0);
      options.onClipResize?.(clip, newDuration);
    }, [options.onClipResize]),

    onPlayheadMove: useCallback((time: number) => {
      setCurrentTime(time);
      options.onPlayheadMove?.(time);
    }, [options.onPlayheadMove]),

    onZoomChange: useCallback((scale: number) => {
      options.onZoomChange?.(scale);
    }, [options.onZoomChange]),
  };

  // Initialize timeline engine
  useEffect(() => {
    if (!timelineRef.current || timelineEngine.current) return;

    // Add a longer delay to ensure DOM is ready and avoid race conditions
    const initTimeout = setTimeout(() => {
      try {
        // Check if container still exists and has dimensions
        if (!timelineRef.current || timelineRef.current.offsetWidth === 0) {
          console.warn('⚠️ [Timeline] Container not ready, skipping initialization');
          setIsInitialized(true); // Still set to true to prevent infinite loading
          return;
        }
        
        console.log('🔄 [Timeline] Initializing timeline engine...');
        timelineEngine.current = new TimelineEngine(timelineRef.current!, config, events);
        setIsInitialized(true);
        console.log('✅ [Timeline] Timeline engine initialized successfully');
      } catch (error) {
        console.error('❌ [Timeline] Failed to initialize timeline engine:', error);
        // Force initialization after error to prevent infinite loading
        setIsInitialized(true);
      }
    }, 300); // Increased delay

    return () => {
      clearTimeout(initTimeout);
      if (timelineEngine.current) {
        try {
          timelineEngine.current.destroy();
        } catch (error) {
          console.warn('⚠️ [Timeline] Error during timeline cleanup:', error);
        }
        timelineEngine.current = null;
        setIsInitialized(false);
      }
    };
  }, [config, events]);

  // Handle resize
  useEffect(() => {
    if (!timelineEngine.current) return;

    const handleResize = () => {
      if (timelineRef.current && timelineEngine.current) {
        const rect = timelineRef.current.getBoundingClientRect();
        timelineEngine.current.resize(rect.width, config.height);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isInitialized, config.height]);

  // Animation loop for playback
  const animate = useCallback(() => {
    if (!isPlaying || !timelineEngine.current) return;

    const newTime = timelineEngine.current.getCurrentTime() + 1/60; // 60 FPS
    const duration = timelineEngine.current.getTotalDuration();

    if (newTime >= duration) {
      setIsPlaying(false);
      setCurrentTime(duration);
      timelineEngine.current.setPlayheadPosition(duration);
    } else {
      setCurrentTime(newTime);
      timelineEngine.current.setPlayheadPosition(newTime);
      animationFrame.current = requestAnimationFrame(animate);
    }
  }, [isPlaying]);

  useEffect(() => {
    if (isPlaying) {
      animationFrame.current = requestAnimationFrame(animate);
    } else if (animationFrame.current) {
      cancelAnimationFrame(animationFrame.current);
      animationFrame.current = null;
    }

    return () => {
      if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current);
      }
    };
  }, [isPlaying, animate]);

  // Timeline control methods
  const addClip = useCallback((clip: TimelineClip) => {
    if (!timelineEngine.current) return;
    timelineEngine.current.addClip(clip);
    setTotalDuration(timelineEngine.current.getTotalDuration());
  }, []);

  const removeClip = useCallback((clipId: string) => {
    if (!timelineEngine.current) return;
    timelineEngine.current.removeClip(clipId);
    setTotalDuration(timelineEngine.current.getTotalDuration());
    setSelectedClips(prev => prev.filter(clip => clip.id !== clipId));
  }, []);

  const updateClip = useCallback((clip: TimelineClip) => {
    if (!timelineEngine.current) return;
    timelineEngine.current.updateClip(clip);
    setTotalDuration(timelineEngine.current.getTotalDuration());
    setSelectedClips(prev => prev.map(selected => 
      selected.id === clip.id ? clip : selected
    ));
  }, []);

  const setPlayheadPosition = useCallback((time: number) => {
    if (!timelineEngine.current) return;
    timelineEngine.current.setPlayheadPosition(time);
    setCurrentTime(time);
  }, []);

  const setZoom = useCallback((scale: number) => {
    if (!timelineEngine.current) return;
    timelineEngine.current.setTimeScale(scale);
  }, []);

  const play = useCallback(() => {
    setIsPlaying(true);
  }, []);

  const pause = useCallback(() => {
    setIsPlaying(false);
  }, []);

  const stop = useCallback(() => {
    setIsPlaying(false);
    setPlayheadPosition(0);
  }, [setPlayheadPosition]);

  const clearSelection = useCallback(() => {
    setSelectedClips([]);
    // Note: Timeline engine handles its own internal selection clearing
  }, []);

  const getClipAt = useCallback((x: number, y: number): TimelineClip | null => {
    if (!timelineEngine.current) return null;
    return timelineEngine.current.getClipAt(x, y);
  }, []);

  const exportTimeline = useCallback((): TimelineClip[] => {
    if (!timelineEngine.current) return [];
    return timelineEngine.current.getSelectedClips();
  }, []);

  const importTimeline = useCallback((clips: TimelineClip[]) => {
    if (!timelineEngine.current) return;
    
    // Clear existing clips
    const existingClips = timelineEngine.current.getSelectedClips();
    existingClips.forEach(clip => removeClip(clip.id));
    
    // Add new clips
    clips.forEach(clip => addClip(clip));
  }, [addClip, removeClip]);

  return {
    timelineRef,
    timeline: timelineEngine.current,
    currentTime,
    totalDuration,
    selectedClips,
    isInitialized,
    
    // Control methods
    addClip,
    removeClip,
    updateClip,
    setPlayheadPosition,
    setZoom,
    play,
    pause,
    stop,
    
    // Utility methods
    clearSelection,
    getClipAt,
    exportTimeline,
    importTimeline,
  };
} 