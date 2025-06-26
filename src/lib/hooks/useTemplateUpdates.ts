import { useState, useEffect } from 'react';

// Hook for tracking template updates from admin panel
// Provides real-time synchronization between admin changes and template display

export interface TemplateUpdateEvent {
  source: string;
  templateId?: string;
  category?: string;
  timestamp: number;
  action?: string;
}

export function useTemplateUpdates() {
  const [lastUpdateTimestamp, setLastUpdateTimestamp] = useState<number>(Date.now());
  const [lastUpdate, setLastUpdate] = useState<TemplateUpdateEvent | null>(null);

  useEffect(() => {
    const handleTemplateUpdate = (event: CustomEvent<TemplateUpdateEvent>) => {
      console.log('🔄 [useTemplateUpdates] Received template update event:', event.detail);
      
      setLastUpdate(event.detail);
      setLastUpdateTimestamp(event.detail.timestamp);
    };

    // Listen for template update events dispatched from admin panel
    window.addEventListener('templatesUpdated', handleTemplateUpdate as EventListener);
    
    return () => {
      window.removeEventListener('templatesUpdated', handleTemplateUpdate as EventListener);
    };
  }, []);

  return {
    lastUpdateTimestamp,
    lastUpdate
  };
} 