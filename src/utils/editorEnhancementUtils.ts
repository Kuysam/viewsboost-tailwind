import { toast } from 'react-hot-toast';

// Enhanced CanvasElement interface that extends the existing one
export interface EnhancedCanvasElement {
  id: string;
  type: 'text' | 'image' | 'video' | 'shape' | 'background';
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  opacity?: number;
  zIndex: number;
  locked?: boolean;
  visible?: boolean;
  
  // Timeline properties
  startTime?: number;
  duration?: number;
  endTime?: number;
  
  // Text properties
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string;
  fontStyle?: string;
  textAlign?: 'left' | 'center' | 'right';
  color?: string;
  textDecoration?: string;
  letterSpacing?: number;
  lineHeight?: number;
  textShadow?: string;
  
  // Media properties
  src?: string;
  objectFit?: 'cover' | 'contain' | 'fill';
  filter?: string;
  brightness?: number;
  contrast?: number;
  saturation?: number;
  blur?: number;
  
  // Shape properties
  shapeType?: 'rectangle' | 'circle' | 'triangle';
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  borderRadius?: number;
  
  // Animation properties
  animation?: {
    type: 'fadeIn' | 'slideIn' | 'zoomIn' | 'rotateIn' | 'bounceIn';
    duration: number;
    delay: number;
    easing: string;
  };
  
  // Blend mode
  blendMode?: string;
}

export interface LayerInfo {
  id: string;
  name: string;
  type: string;
  visible: boolean;
  locked: boolean;
  opacity: number;
  thumbnail?: string;
}

export interface TimelineTrack {
  id: string;
  elementId: string;
  startTime: number;
  duration: number;
  color: string;
  name: string;
}

// Professional text presets
export const TEXT_PRESETS = {
  heading: {
    fontSize: 48,
    fontWeight: 'bold',
    text: 'Main Heading',
    color: '#ffffff',
    textShadow: '2px 2px 4px rgba(0,0,0,0.5)'
  },
  subheading: {
    fontSize: 32,
    fontWeight: '600',
    text: 'Subheading Text',
    color: '#ffffff',
    opacity: 0.9
  },
  body: {
    fontSize: 20,
    fontWeight: 'normal',
    text: 'Body text content goes here',
    color: '#ffffff',
    lineHeight: 1.4
  },
  button: {
    fontSize: 24,
    fontWeight: 'bold',
    text: 'Click Here',
    color: '#ffffff',
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    padding: '12px 24px'
  },
  caption: {
    fontSize: 14,
    fontWeight: 'normal',
    text: 'Caption text',
    color: '#cccccc',
    opacity: 0.8
  }
};

// Professional color palettes
export const COLOR_PALETTES = {
  brand: ['#3B82F6', '#1E40AF', '#1D4ED8', '#2563EB', '#3730A3'],
  warm: ['#FFA500', '#FF6347', '#FFD700', '#FF4500', '#FF69B4'],
  cool: ['#00CED1', '#4169E1', '#9370DB', '#00BFFF', '#1E90FF'],
  earth: ['#8B4513', '#228B22', '#CD853F', '#DAA520', '#B8860B'],
  modern: ['#2F2F2F', '#4A4A4A', '#F0F0F0', '#FF4081', '#00BCD4'],
  pastel: ['#FFB3BA', '#FFDFBA', '#FFFFBA', '#BAFFC9', '#BAE1FF']
};

// Animation presets
export const ANIMATION_PRESETS = {
  fadeIn: {
    type: 'fadeIn',
    duration: 0.5,
    delay: 0,
    easing: 'ease-out'
  },
  slideInLeft: {
    type: 'slideIn',
    duration: 0.6,
    delay: 0,
    easing: 'ease-out',
    direction: 'left'
  },
  slideInRight: {
    type: 'slideIn',
    duration: 0.6,
    delay: 0,
    easing: 'ease-out',
    direction: 'right'
  },
  zoomIn: {
    type: 'zoomIn',
    duration: 0.4,
    delay: 0,
    easing: 'ease-back'
  },
  bounceIn: {
    type: 'bounceIn',
    duration: 0.8,
    delay: 0,
    easing: 'ease-bounce'
  }
};

// Enhanced layer management functions
export const layerUtils = {
  // Convert canvas elements to layer info
  elementsToLayers: (elements: EnhancedCanvasElement[]): LayerInfo[] => {
    return elements.map((element, index) => ({
      id: element.id,
      name: element.text || `${element.type} ${index + 1}`,
      type: element.type,
      visible: element.visible !== false,
      locked: element.locked || false,
      opacity: element.opacity || 1,
      thumbnail: element.src || undefined
    }));
  },

  // Generate timeline tracks from elements
  elementsToTracks: (elements: EnhancedCanvasElement[]): TimelineTrack[] => {
    return elements
      .filter(el => el.type !== 'background')
      .map(element => ({
        id: `track-${element.id}`,
        elementId: element.id,
        startTime: element.startTime || 0,
        duration: element.duration || 3,
        color: getTrackColor(element.type),
        name: element.text || `${element.type} layer`
      }));
  },

  // Reorder elements (for bring to front/send to back)
  reorderElement: (
    elements: EnhancedCanvasElement[], 
    elementId: string, 
    direction: 'up' | 'down' | 'front' | 'back'
  ): EnhancedCanvasElement[] => {
    const elementIndex = elements.findIndex(el => el.id === elementId);
    if (elementIndex === -1) return elements;

    const newElements = [...elements];
    const element = newElements[elementIndex];

    switch (direction) {
      case 'up':
        element.zIndex = Math.min(element.zIndex + 1, elements.length);
        break;
      case 'down':
        element.zIndex = Math.max(element.zIndex - 1, 0);
        break;
      case 'front':
        element.zIndex = Math.max(...elements.map(el => el.zIndex)) + 1;
        break;
      case 'back':
        element.zIndex = 0;
        // Adjust other elements' zIndex
        newElements.forEach(el => {
          if (el.id !== elementId && el.zIndex >= 0) {
            el.zIndex += 1;
          }
        });
        break;
    }

    return newElements.sort((a, b) => a.zIndex - b.zIndex);
  }
};

// Get track color based on element type
function getTrackColor(type: string): string {
  const colors = {
    text: '#3B82F6',
    image: '#10B981',
    video: '#F59E0B',
    shape: '#8B5CF6',
    background: '#6B7280'
  };
  return colors[type as keyof typeof colors] || '#6B7280';
}

// Professional element creation functions
export const elementCreators = {
  // Create enhanced text element
  createTextElement: (
    preset: keyof typeof TEXT_PRESETS,
    position: { x: number; y: number },
    customText?: string
  ): EnhancedCanvasElement => {
    const config = TEXT_PRESETS[preset];
    return {
      id: `text-${Date.now()}`,
      type: 'text',
      x: position.x,
      y: position.y,
      width: 200,
      height: 50,
      zIndex: 1,
      visible: true,
      locked: false,
      ...config,
      text: customText || config.text,
      startTime: 0,
      duration: 3
    };
  },

  // Create shape with advanced properties
  createShape: (
    shapeType: 'rectangle' | 'circle' | 'triangle',
    position: { x: number; y: number },
    style?: Partial<EnhancedCanvasElement>
  ): EnhancedCanvasElement => {
    const baseShape = {
      id: `shape-${Date.now()}`,
      type: 'shape' as const,
      x: position.x,
      y: position.y,
      width: 150,
      height: 150,
      zIndex: 1,
      visible: true,
      locked: false,
      shapeType,
      backgroundColor: '#3B82F6',
      borderRadius: shapeType === 'rectangle' ? 8 : 0,
      startTime: 0,
      duration: 3
    };

    return { ...baseShape, ...style };
  },

  // Create button element
  createButton: (
    text: string,
    position: { x: number; y: number },
    style?: Partial<EnhancedCanvasElement>
  ): EnhancedCanvasElement => {
    return {
      id: `button-${Date.now()}`,
      type: 'shape',
      x: position.x,
      y: position.y,
      width: 200,
      height: 60,
      zIndex: 1,
      visible: true,
      locked: false,
      shapeType: 'rectangle',
      backgroundColor: '#3B82F6',
      borderRadius: 8,
      text,
      fontSize: 18,
      fontWeight: 'bold',
      color: '#ffffff',
      textAlign: 'center',
      startTime: 0,
      duration: 3,
      ...style
    };
  }
};

// Template enhancement functions
export const templateEnhancements = {
  // Add professional animations to elements
  addElementAnimation: (
    element: EnhancedCanvasElement,
    animationType: keyof typeof ANIMATION_PRESETS
  ): EnhancedCanvasElement => {
    return {
      ...element,
      animation: ANIMATION_PRESETS[animationType]
    };
  },

  // Apply color palette to multiple elements
  applyColorPalette: (
    elements: EnhancedCanvasElement[],
    paletteName: keyof typeof COLOR_PALETTES
  ): EnhancedCanvasElement[] => {
    const palette = COLOR_PALETTES[paletteName];
    return elements.map((element, index) => {
      if (element.type === 'text' || element.type === 'shape') {
        return {
          ...element,
          color: element.type === 'text' ? palette[index % palette.length] : element.color,
          backgroundColor: element.type === 'shape' ? palette[index % palette.length] : element.backgroundColor
        };
      }
      return element;
    });
  },

  // Auto-arrange elements in a grid
  autoArrangeGrid: (
    elements: EnhancedCanvasElement[],
    canvasWidth: number,
    canvasHeight: number,
    padding: number = 20
  ): EnhancedCanvasElement[] => {
    const nonBackgroundElements = elements.filter(el => el.type !== 'background');
    const cols = Math.ceil(Math.sqrt(nonBackgroundElements.length));
    const rows = Math.ceil(nonBackgroundElements.length / cols);
    
    const cellWidth = (canvasWidth - padding * (cols + 1)) / cols;
    const cellHeight = (canvasHeight - padding * (rows + 1)) / rows;

    return elements.map(element => {
      if (element.type === 'background') return element;
      
      const index = nonBackgroundElements.findIndex(el => el.id === element.id);
      const row = Math.floor(index / cols);
      const col = index % cols;
      
      return {
        ...element,
        x: padding + col * (cellWidth + padding),
        y: padding + row * (cellHeight + padding),
        width: Math.min(cellWidth, element.width),
        height: Math.min(cellHeight, element.height)
      };
    });
  },

  // Smart duplicate with offset
  smartDuplicate: (
    element: EnhancedCanvasElement,
    offset: { x: number; y: number } = { x: 20, y: 20 }
  ): EnhancedCanvasElement => {
    return {
      ...element,
      id: `${element.id}-copy-${Date.now()}`,
      x: element.x + offset.x,
      y: element.y + offset.y,
      zIndex: element.zIndex + 1
    };
  }
};

// Enhanced export functions
export const exportUtils = {
  // Export template with enhanced metadata
  exportTemplate: (
    elements: EnhancedCanvasElement[],
    metadata: {
      width: number;
      height: number;
      backgroundColor: string;
      totalDuration: number;
    }
  ) => {
    const templateData = {
      version: '2.0',
      timestamp: new Date().toISOString(),
      metadata: {
        ...metadata,
        elementsCount: elements.length,
        hasAnimations: elements.some(el => el.animation),
        totalTracks: elements.filter(el => el.startTime !== undefined).length
      },
      elements,
      layers: layerUtils.elementsToLayers(elements),
      timeline: layerUtils.elementsToTracks(elements)
    };

    return templateData;
  },

  // Generate thumbnail from canvas elements
  generateThumbnail: (elements: EnhancedCanvasElement[]): string => {
    // This would generate a small preview image
    // Implementation would depend on your canvas rendering setup
    return '';
  }
};

// Keyboard shortcuts
export const KEYBOARD_SHORTCUTS = {
  // Tool shortcuts
  'v': 'select',
  't': 'text',
  'i': 'image',
  'r': 'rectangle',
  'o': 'circle',
  
  // Action shortcuts
  'Delete': 'delete',
  'Backspace': 'delete',
  'Ctrl+D': 'duplicate',
  'Cmd+D': 'duplicate',
  'Ctrl+Z': 'undo',
  'Cmd+Z': 'undo',
  'Ctrl+Y': 'redo',
  'Cmd+Y': 'redo',
  'Ctrl+S': 'save',
  'Cmd+S': 'save',
  
  // Layer shortcuts
  'Ctrl+]': 'bringForward',
  'Cmd+]': 'bringForward',
  'Ctrl+[': 'sendBackward',
  'Cmd+[': 'sendBackward',
  'Ctrl+Shift+]': 'bringToFront',
  'Cmd+Shift+]': 'bringToFront',
  'Ctrl+Shift+[': 'sendToBack',
  'Cmd+Shift+[': 'sendToBack',
};

// Validation utilities
export const validationUtils = {
  // Validate element properties
  validateElement: (element: EnhancedCanvasElement): boolean => {
    return !!(
      element.id &&
      element.type &&
      typeof element.x === 'number' &&
      typeof element.y === 'number' &&
      element.width > 0 &&
      element.height > 0
    );
  },

  // Validate timeline constraints
  validateTimeline: (elements: EnhancedCanvasElement[]): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];
    
    elements.forEach(element => {
      if (element.startTime !== undefined && element.duration !== undefined) {
        if (element.startTime < 0) {
          errors.push(`Element ${element.id} has negative start time`);
        }
        if (element.duration <= 0) {
          errors.push(`Element ${element.id} has invalid duration`);
        }
      }
    });

    return {
      isValid: errors.length === 0,
      errors
    };
  }
};

export default {
  TEXT_PRESETS,
  COLOR_PALETTES,
  ANIMATION_PRESETS,
  layerUtils,
  elementCreators,
  templateEnhancements,
  exportUtils,
  KEYBOARD_SHORTCUTS,
  validationUtils
}; 