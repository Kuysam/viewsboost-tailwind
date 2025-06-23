import { useState, useRef, useCallback, ReactNode } from 'react';

interface PullToRefreshProps {
  children: ReactNode;
  onRefresh: () => Promise<void>;
  refreshThreshold?: number;
  maxPullDistance?: number;
  disabled?: boolean;
}

export default function PullToRefresh({
  children,
  onRefresh,
  refreshThreshold = 80,
  maxPullDistance = 120,
  disabled = false
}: PullToRefreshProps) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [canRelease, setCanRelease] = useState(false);
  
  const startY = useRef<number>(0);
  const currentY = useRef<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (disabled || isRefreshing) return;
    
    // Only trigger if at the top of the page
    if (window.scrollY > 0) return;
    
    startY.current = e.touches[0].clientY;
    currentY.current = startY.current;
  }, [disabled, isRefreshing]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (disabled || isRefreshing) return;
    
    // Only trigger if at the top of the page
    if (window.scrollY > 0) return;
    
    currentY.current = e.touches[0].clientY;
    const diff = currentY.current - startY.current;
    
    if (diff > 0) {
      e.preventDefault();
      
      // Apply resistance for a more natural feel
      const resistance = Math.max(0, 1 - (diff / maxPullDistance) * 0.5);
      const distance = Math.min(diff * resistance, maxPullDistance);
      
      setPullDistance(distance);
      setCanRelease(distance >= refreshThreshold);
      
      // Add haptic feedback when threshold is reached
      if (distance >= refreshThreshold && !canRelease) {
        if ('vibrate' in navigator) {
          navigator.vibrate(10);
        }
      }
    }
  }, [disabled, isRefreshing, maxPullDistance, refreshThreshold, canRelease]);

  const handleTouchEnd = useCallback(async () => {
    if (disabled || isRefreshing) return;
    
    if (canRelease && pullDistance >= refreshThreshold) {
      setIsRefreshing(true);
      setPullDistance(refreshThreshold);
      
      try {
        await onRefresh();
        // Add success haptic feedback
        if ('vibrate' in navigator) {
          navigator.vibrate([10, 50, 10]);
        }
      } catch (error) {
        console.error('Refresh failed:', error);
        // Add error haptic feedback
        if ('vibrate' in navigator) {
          navigator.vibrate([100, 50, 100]);
        }
      } finally {
        // Smooth reset animation
        setTimeout(() => {
          setIsRefreshing(false);
          setPullDistance(0);
          setCanRelease(false);
        }, 300);
      }
    } else {
      // Snap back animation
      setPullDistance(0);
      setCanRelease(false);
    }
  }, [disabled, isRefreshing, canRelease, pullDistance, refreshThreshold, onRefresh]);

  const getRefreshIcon = () => {
    if (isRefreshing) {
      return (
        <div className="animate-spin">
          <svg className="w-6 h-6 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </div>
      );
    }

    if (canRelease) {
      return (
        <div className="text-green-500">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      );
    }

    return (
      <div className="text-gray-400" style={{ transform: `rotate(${pullDistance * 2}deg)` }}>
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      </div>
    );
  };

  const getRefreshText = () => {
    if (isRefreshing) return 'Refreshing...';
    if (canRelease) return 'Release to refresh';
    return 'Pull to refresh';
  };

  return (
    <div 
      ref={containerRef}
      className="relative"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull to refresh indicator */}
      <div 
        className="absolute top-0 left-0 right-0 flex flex-col items-center justify-center bg-black z-10 transition-all duration-200 ease-out"
        style={{
          transform: `translateY(${pullDistance - 60}px)`,
          opacity: pullDistance > 20 ? 1 : 0
        }}
      >
        <div className="flex flex-col items-center space-y-2 py-4">
          {getRefreshIcon()}
          <span className={`text-sm font-medium transition-colors ${
            isRefreshing ? 'text-yellow-500' : 
            canRelease ? 'text-green-500' : 'text-gray-400'
          }`}>
            {getRefreshText()}
          </span>
        </div>
      </div>

      {/* Content */}
      <div 
        className="transition-transform duration-200 ease-out"
        style={{
          transform: `translateY(${pullDistance}px)`
        }}
      >
        {children}
      </div>
    </div>
  );
}