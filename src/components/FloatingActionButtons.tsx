import { useState, useEffect } from 'react';

interface FloatingAction {
  id: string;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  badge?: number;
  color?: string;
}

interface FloatingActionButtonsProps {
  actions: FloatingAction[];
  primaryAction?: FloatingAction;
  position?: 'right' | 'left' | 'center';
  autoHide?: boolean;
}

export default function FloatingActionButtons({
  actions,
  primaryAction,
  position = 'right',
  autoHide = true
}: FloatingActionButtonsProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // Auto-hide on scroll (like TikTok)
  useEffect(() => {
    if (!autoHide) return;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        // Scrolling down - hide
        setIsVisible(false);
        setIsExpanded(false);
      } else if (currentScrollY < lastScrollY) {
        // Scrolling up - show
        setIsVisible(true);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY, autoHide]);

  const getPositionClasses = () => {
    switch (position) {
      case 'left':
        return 'left-4';
      case 'center':
        return 'left-1/2 transform -translate-x-1/2';
      default:
        return 'right-4';
    }
  };

  const getActionPositionOffset = (index: number) => {
    const offset = (index + 1) * 60;
    return position === 'left' ? `-${offset}px` : position === 'center' ? `0` : `-${offset}px`;
  };

  return (
    <div 
      className={`fixed bottom-20 ${getPositionClasses()} z-50 transition-all duration-300 ${
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-16 opacity-0'
      }`}
    >
      {/* Secondary Actions */}
      <div className="flex flex-col space-y-3 mb-3">
        {actions.map((action, index) => (
          <div
            key={action.id}
            className={`relative transition-all duration-300 ease-out ${
              isExpanded 
                ? 'translate-y-0 opacity-100 scale-100' 
                : 'translate-y-4 opacity-0 scale-75 pointer-events-none'
            }`}
            style={{
              transitionDelay: isExpanded ? `${index * 50}ms` : '0ms',
              [position === 'center' ? 'marginLeft' : 'marginRight']: 
                isExpanded ? getActionPositionOffset(index) : '0px'
            }}
          >
            <button
              onClick={() => {
                action.onClick();
                setIsExpanded(false);
              }}
              className={`w-12 h-12 rounded-full shadow-lg flex items-center justify-center text-white transition-all duration-200 hover:scale-110 active:scale-95 ${
                action.color || 'bg-gray-700/90 backdrop-blur-sm'
              }`}
            >
              {action.icon}
              
              {/* Badge */}
              {action.badge && action.badge > 0 && (
                <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                  {action.badge > 99 ? '99+' : action.badge}
                </div>
              )}
            </button>
            
            {/* Label */}
            <div className={`absolute ${position === 'right' ? 'right-14' : 'left-14'} top-1/2 transform -translate-y-1/2 bg-black/80 text-white text-xs px-2 py-1 rounded whitespace-nowrap transition-all duration-200 ${
              isExpanded ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
            }`}>
              {action.label}
            </div>
          </div>
        ))}
      </div>

      {/* Primary Action Button */}
      {primaryAction && (
        <div className="relative">
          <button
            onClick={() => {
              if (actions.length > 0) {
                setIsExpanded(!isExpanded);
              } else {
                primaryAction.onClick();
              }
            }}
            className={`w-14 h-14 rounded-full shadow-xl flex items-center justify-center text-white transition-all duration-300 hover:scale-110 active:scale-95 ${
              primaryAction.color || 'bg-yellow-500'
            } ${isExpanded ? 'rotate-45' : 'rotate-0'}`}
          >
            {isExpanded ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              primaryAction.icon
            )}
            
            {/* Primary Badge */}
            {primaryAction.badge && primaryAction.badge > 0 && (
              <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full min-w-[20px] h-[20px] flex items-center justify-center px-1">
                {primaryAction.badge > 99 ? '99+' : primaryAction.badge}
              </div>
            )}
          </button>

          {/* Ripple Effect */}
          <div className={`absolute inset-0 rounded-full border-2 border-yellow-400 transition-all duration-1000 ${
            isExpanded ? 'scale-150 opacity-0' : 'scale-100 opacity-0'
          }`} />
        </div>
      )}

      {/* Background Overlay when expanded */}
      {isExpanded && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm -z-10"
          onClick={() => setIsExpanded(false)}
        />
      )}
    </div>
  );
}

// Predefined action sets
export const createVideoActions: FloatingAction[] = [
  {
    id: 'upload',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
      </svg>
    ),
    label: 'Upload Video',
    onClick: () => console.log('Upload video'),
    color: 'bg-blue-500'
  },
  {
    id: 'camera',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    label: 'Record Video',
    onClick: () => console.log('Record video'),
    color: 'bg-green-500'
  },
  {
    id: 'template',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
      </svg>
    ),
    label: 'Use Template',
    onClick: () => console.log('Use template'),
    color: 'bg-purple-500'
  },
  {
    id: 'live',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
      </svg>
    ),
    label: 'Go Live',
    onClick: () => console.log('Go live'),
    color: 'bg-red-500'
  }
];

export const primaryCreateAction: FloatingAction = {
  id: 'create',
  icon: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  ),
  label: 'Create',
  onClick: () => console.log('Create menu'),
  color: 'bg-yellow-500'
};