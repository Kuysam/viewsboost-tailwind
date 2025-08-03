import { useState, useCallback, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { 
  EnhancedCanvasElement, 
  LayerInfo, 
  TimelineTrack,
  layerUtils,
  elementCreators,
  templateEnhancements,
  exportUtils,
  KEYBOARD_SHORTCUTS,
  validationUtils
} from '../utils/editorEnhancementUtils';

// Hook to enhance the existing Studio with professional features
export const useEditorEnhancements = (
  canvasElements: any[],
  setCanvasElements: (elements: any[]) => void,
  selectedElementId: string | null,
  setSelectedElementId: (id: string | null) => void,
  saveToHistory: () => void
) => {
  // Enhanced state
  const [layers, setLayers] = useState<LayerInfo[]>([]);
  const [timelineTracks, setTimelineTracks] = useState<TimelineTrack[]>([]);
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(10);
  const [isPlaying, setIsPlaying] = useState(false);
  const [timelineZoom, setTimelineZoom] = useState(1);

  // Update layers when canvas elements change
  useEffect(() => {
    const enhancedElements = canvasElements as EnhancedCanvasElement[];
    const newLayers = layerUtils.elementsToLayers(enhancedElements);
    const newTracks = layerUtils.elementsToTracks(enhancedElements);
    
    setLayers(newLayers);
    setTimelineTracks(newTracks);
  }, [canvasElements]);

  // Sync selected element with selected layer
  useEffect(() => {
    if (selectedElementId !== selectedLayerId) {
      setSelectedLayerId(selectedElementId);
    }
  }, [selectedElementId]);

  // Professional text creation
  const addProfessionalText = useCallback((
    preset: 'heading' | 'subheading' | 'body' | 'button' | 'caption',
    position?: { x: number; y: number },
    customText?: string
  ) => {
    const pos = position || { x: 100, y: 100 };
    const newElement = elementCreators.createTextElement(preset, pos, customText);
    
    setCanvasElements([...canvasElements, newElement]);
    setSelectedElementId(newElement.id);
    saveToHistory();
    toast.success(`${preset} text added!`);
  }, [canvasElements, setCanvasElements, setSelectedElementId, saveToHistory]);

  // Professional shape creation
  const addProfessionalShape = useCallback((
    shapeType: 'rectangle' | 'circle' | 'triangle',
    position?: { x: number; y: number },
    style?: any
  ) => {
    const pos = position || { x: 100, y: 100 };
    const newElement = elementCreators.createShape(shapeType, pos, style);
    
    setCanvasElements([...canvasElements, newElement]);
    setSelectedElementId(newElement.id);
    saveToHistory();
    toast.success(`${shapeType} shape added!`);
  }, [canvasElements, setCanvasElements, setSelectedElementId, saveToHistory]);

  // Create professional button
  const addProfessionalButton = useCallback((
    text: string = 'Click Here',
    position?: { x: number; y: number },
    style?: any
  ) => {
    const pos = position || { x: 100, y: 100 };
    const newElement = elementCreators.createButton(text, pos, style);
    
    setCanvasElements([...canvasElements, newElement]);
    setSelectedElementId(newElement.id);
    saveToHistory();
    toast.success('Button added!');
  }, [canvasElements, setCanvasElements, setSelectedElementId, saveToHistory]);

  // Layer management functions
  const toggleLayerVisibility = useCallback((layerId: string) => {
    const newElements = canvasElements.map(el => 
      el.id === layerId ? { ...el, visible: !el.visible } : el
    );
    setCanvasElements(newElements);
    saveToHistory();
  }, [canvasElements, setCanvasElements, saveToHistory]);

  const toggleLayerLock = useCallback((layerId: string) => {
    const newElements = canvasElements.map(el => 
      el.id === layerId ? { ...el, locked: !el.locked } : el
    );
    setCanvasElements(newElements);
    saveToHistory();
  }, [canvasElements, setCanvasElements, saveToHistory]);

  const deleteLayer = useCallback((layerId: string) => {
    if (layerId === 'background') {
      toast.error('Cannot delete background layer');
      return;
    }
    
    const newElements = canvasElements.filter(el => el.id !== layerId);
    setCanvasElements(newElements);
    
    if (selectedElementId === layerId) {
      setSelectedElementId(null);
    }
    
    saveToHistory();
    toast.success('Layer deleted!');
  }, [canvasElements, setCanvasElements, selectedElementId, setSelectedElementId, saveToHistory]);

  const duplicateLayer = useCallback((layerId: string) => {
    const element = canvasElements.find(el => el.id === layerId);
    if (!element) return;

    const duplicatedElement = templateEnhancements.smartDuplicate(element);
    setCanvasElements([...canvasElements, duplicatedElement]);
    setSelectedElementId(duplicatedElement.id);
    saveToHistory();
    toast.success('Layer duplicated!');
  }, [canvasElements, setCanvasElements, setSelectedElementId, saveToHistory]);

  const reorderLayer = useCallback((layerId: string, direction: 'up' | 'down' | 'front' | 'back') => {
    const newElements = layerUtils.reorderElement(canvasElements, layerId, direction);
    setCanvasElements(newElements);
    saveToHistory();
    
    const directionLabels = {
      up: 'moved forward',
      down: 'moved backward', 
      front: 'brought to front',
      back: 'sent to back'
    };
    toast.success(`Layer ${directionLabels[direction]}!`);
  }, [canvasElements, setCanvasElements, saveToHistory]);

  // Timeline functions
  const togglePlayback = useCallback(() => {
    const newIsPlaying = !isPlaying;
    setIsPlaying(newIsPlaying);
    
    if (newIsPlaying) {
      const interval = setInterval(() => {
        setCurrentTime(time => {
          const newTime = time + 0.1;
          if (newTime >= totalDuration) {
            setIsPlaying(false);
            clearInterval(interval);
            return 0;
          }
          return newTime;
        });
      }, 100);
      (window as any).playbackInterval = interval;
    } else {
      if ((window as any).playbackInterval) {
        clearInterval((window as any).playbackInterval);
      }
    }
  }, [isPlaying, totalDuration]);

  const seekToTime = useCallback((time: number) => {
    setCurrentTime(Math.max(0, Math.min(totalDuration, time)));
  }, [totalDuration]);

  const updateElementTiming = useCallback((elementId: string, startTime: number, duration: number) => {
    const newElements = canvasElements.map(el => 
      el.id === elementId ? { ...el, startTime, duration, endTime: startTime + duration } : el
    );
    setCanvasElements(newElements);
    saveToHistory();
  }, [canvasElements, setCanvasElements, saveToHistory]);

  // Animation functions
  const addElementAnimation = useCallback((
    elementId: string, 
    animationType: 'fadeIn' | 'slideIn' | 'zoomIn' | 'rotateIn' | 'bounceIn'
  ) => {
    const newElements = canvasElements.map(el => 
      el.id === elementId 
        ? templateEnhancements.addElementAnimation(el, animationType)
        : el
    );
    setCanvasElements(newElements);
    saveToHistory();
    toast.success(`${animationType} animation applied!`);
  }, [canvasElements, setCanvasElements, saveToHistory]);

  // Color palette functions
  const applyColorPalette = useCallback((paletteName: 'brand' | 'warm' | 'cool' | 'earth' | 'modern' | 'pastel') => {
    const newElements = templateEnhancements.applyColorPalette(canvasElements, paletteName);
    setCanvasElements(newElements);
    saveToHistory();
    toast.success(`${paletteName} color palette applied!`);
  }, [canvasElements, setCanvasElements, saveToHistory]);

  // Layout functions
  const autoArrangeGrid = useCallback((canvasWidth: number, canvasHeight: number) => {
    const newElements = templateEnhancements.autoArrangeGrid(canvasElements, canvasWidth, canvasHeight);
    setCanvasElements(newElements);
    saveToHistory();
    toast.success('Elements arranged in grid!');
  }, [canvasElements, setCanvasElements, saveToHistory]);

  // Enhanced export
  const exportEnhancedTemplate = useCallback((metadata: {
    width: number;
    height: number;
    backgroundColor: string;
  }) => {
    const templateData = exportUtils.exportTemplate(canvasElements, {
      ...metadata,
      totalDuration
    });

    const dataStr = JSON.stringify(templateData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `viewsboost-enhanced-template-${Date.now()}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
    toast.success('Enhanced template exported!');
  }, [canvasElements, totalDuration]);

  // Load enhanced template
  const loadEnhancedTemplate = useCallback((templateData: any) => {
    try {
      if (templateData.elements) {
        // Validate elements
        const validation = validationUtils.validateTimeline(templateData.elements);
        if (!validation.isValid) {
          toast.error(`Template validation failed: ${validation.errors.join(', ')}`);
          return;
        }

        setCanvasElements(templateData.elements);
        
        if (templateData.metadata?.totalDuration) {
          setTotalDuration(templateData.metadata.totalDuration);
        }
        
        saveToHistory();
        toast.success('Enhanced template loaded!');
      } else {
        toast.error('Invalid template format');
      }
    } catch (error) {
      toast.error('Failed to load template');
      console.error('Template load error:', error);
    }
  }, [setCanvasElements, saveToHistory]);

  // Keyboard shortcuts handler
  const handleKeyboardShortcut = useCallback((event: KeyboardEvent) => {
    const key = event.key;
    const isCtrl = event.ctrlKey || event.metaKey;
    const isShift = event.shiftKey;
    
    let shortcutKey = key;
    if (isCtrl && isShift) shortcutKey = `Ctrl+Shift+${key}`;
    else if (isCtrl) shortcutKey = `Ctrl+${key}`;
    
    const action = KEYBOARD_SHORTCUTS[shortcutKey as keyof typeof KEYBOARD_SHORTCUTS];
    
    if (action && selectedElementId) {
      event.preventDefault();
      
      switch (action) {
        case 'delete':
          deleteLayer(selectedElementId);
          break;
        case 'duplicate':
          duplicateLayer(selectedElementId);
          break;
        case 'bringForward':
          reorderLayer(selectedElementId, 'up');
          break;
        case 'sendBackward':
          reorderLayer(selectedElementId, 'down');
          break;
        case 'bringToFront':
          reorderLayer(selectedElementId, 'front');
          break;
        case 'sendToBack':
          reorderLayer(selectedElementId, 'back');
          break;
      }
    }
  }, [selectedElementId, deleteLayer, duplicateLayer, reorderLayer]);

  // Setup keyboard shortcuts
  useEffect(() => {
    document.addEventListener('keydown', handleKeyboardShortcut);
    return () => document.removeEventListener('keydown', handleKeyboardShortcut);
  }, [handleKeyboardShortcut]);

  // Format time for display
  const formatTime = useCallback((time: number): string => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    const centiseconds = Math.floor((time % 1) * 100);
    return `${minutes}:${seconds.toString().padStart(2, '0')}.${centiseconds.toString().padStart(2, '0')}`;
  }, []);

  return {
    // State
    layers,
    timelineTracks,
    selectedLayerId,
    currentTime,
    totalDuration,
    isPlaying,
    timelineZoom,
    
    // Professional creation functions
    addProfessionalText,
    addProfessionalShape,
    addProfessionalButton,
    
    // Layer management
    toggleLayerVisibility,
    toggleLayerLock,
    deleteLayer,
    duplicateLayer,
    reorderLayer,
    setSelectedLayerId,
    
    // Timeline controls
    togglePlayback,
    seekToTime,
    updateElementTiming,
    setCurrentTime,
    setTotalDuration,
    setTimelineZoom,
    
    // Animation and styling
    addElementAnimation,
    applyColorPalette,
    autoArrangeGrid,
    
    // Export/Import
    exportEnhancedTemplate,
    loadEnhancedTemplate,
    
    // Utilities
    formatTime
  };
};

export default useEditorEnhancements; 