import { useState, useEffect, useRef, useCallback } from 'react';
import { Template } from '../types';

interface StoriesProps {
  templates: Template[];
  onStoryComplete?: () => void;
  onClose?: () => void;
}

export default function InstagramStories({ templates, onStoryComplete, onClose }: StoriesProps) {
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const progressRef = useRef<number>(0);
  const intervalRef = useRef<number | null>(null);

  const STORY_DURATION = 5000; // 5 seconds per story
  const PROGRESS_INTERVAL = 50; // Update every 50ms

  // Auto-advance stories with progress tracking
  useEffect(() => {
    if (isPaused) return;

    intervalRef.current = setInterval(() => {
      progressRef.current += PROGRESS_INTERVAL;
      setProgress((progressRef.current / STORY_DURATION) * 100);

      if (progressRef.current >= STORY_DURATION) {
        if (currentStoryIndex < templates.length - 1) {
          // Next story
          setCurrentStoryIndex(prev => prev + 1);
          progressRef.current = 0;
          setProgress(0);
        } else {
          // All stories completed
          onStoryComplete?.();
        }
      }
    }, PROGRESS_INTERVAL);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [currentStoryIndex, templates.length, isPaused, onStoryComplete]);

  // Reset progress when story changes
  useEffect(() => {
    progressRef.current = 0;
    setProgress(0);
  }, [currentStoryIndex]);

  // Handle tap interactions
  const handleLeftTap = useCallback(() => {
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex(prev => prev - 1);
      progressRef.current = 0;
      setProgress(0);
    }
  }, [currentStoryIndex]);

  const handleRightTap = useCallback(() => {
    if (currentStoryIndex < templates.length - 1) {
      setCurrentStoryIndex(prev => prev + 1);
      progressRef.current = 0;
      setProgress(0);
    } else {
      onStoryComplete?.();
    }
  }, [currentStoryIndex, templates.length, onStoryComplete]);

  const handleCenterTap = useCallback(() => {
    setIsPaused(!isPaused);
  }, [isPaused]);

  const currentTemplate = templates[currentStoryIndex];

  if (!currentTemplate) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header with progress bars */}
      <div className="flex items-center justify-between p-4 pb-2">
        <div className="flex space-x-1 flex-1 mr-4">
          {templates.map((_, index) => (
            <div key={index} className="h-1 bg-white/30 rounded-full flex-1 overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-all duration-100 ease-linear"
                style={{
                  width: index < currentStoryIndex ? '100%' : 
                         index === currentStoryIndex ? `${progress}%` : '0%'
                }}
              />
            </div>
          ))}
        </div>
        
        <button
          onClick={onClose}
          className="text-white hover:text-gray-300 transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Story Content */}
      <div className="flex-1 relative">
        <img
          src={currentTemplate.preview || currentTemplate.imageUrl || '/default-template.png'}
          alt={currentTemplate.title}
          className="w-full h-full object-cover"
        />

        {/* Pause overlay */}
        {isPaused && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20">
            <div className="bg-white/20 rounded-full p-4">
              <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z"/>
              </svg>
            </div>
          </div>
        )}

        {/* Tap Areas */}
        <div className="absolute inset-0 flex">
          <div 
            className="w-1/3 h-full cursor-pointer"
            onClick={handleLeftTap}
          />
          <div 
            className="w-1/3 h-full cursor-pointer"
            onClick={handleCenterTap}
          />
          <div 
            className="w-1/3 h-full cursor-pointer"
            onClick={handleRightTap}
          />
        </div>

        {/* Template Info */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4">
          <div className="text-white">
            <h2 className="text-xl font-bold mb-2">{currentTemplate.title}</h2>
            <p className="text-gray-200 text-sm mb-3 line-clamp-2">
              {currentTemplate.description || currentTemplate.desc}
            </p>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <span className="text-xs bg-yellow-500 text-black px-2 py-1 rounded-full font-medium">
                  {currentTemplate.category}
                </span>
                {currentTemplate.platform && (
                  <span className="text-xs text-gray-300">
                    {currentTemplate.platform}
                  </span>
                )}
              </div>

              {/* Quick Actions */}
              <div className="flex space-x-2">
                <button className="bg-yellow-500 text-black px-4 py-2 rounded-full text-sm font-medium hover:bg-yellow-400 transition-colors">
                  Use Template
                </button>
                <button className="bg-white/20 text-white p-2 rounded-full hover:bg-white/30 transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </button>
                <button className="bg-white/20 text-white p-2 rounded-full hover:bg-white/30 transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Story Counter */}
        <div className="absolute top-20 right-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
          {currentStoryIndex + 1} / {templates.length}
        </div>
      </div>
    </div>
  );
}