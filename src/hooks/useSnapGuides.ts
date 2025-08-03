import { useState, useCallback } from 'react';

export interface SnapGuide {
  id: string;
  type: 'vertical' | 'horizontal';
  position: number;
  elements: string[];
}

export interface SnapResult {
  x: number;
  y: number;
  snappedX: boolean;
  snappedY: boolean;
}

export interface UseSnapGuidesOptions {
  snapThreshold?: number;
  gridSize?: number;
  showGrid?: boolean;
}

export function useSnapGuides(options: UseSnapGuidesOptions = {}) {
  const { snapThreshold = 10, gridSize = 20, showGrid = true } = options;
  const [activeGuides, setActiveGuides] = useState<SnapGuide[]>([]);
  const [isGridEnabled, setIsGridEnabled] = useState(true);

  const snapToGrid = useCallback((x: number, y: number): SnapResult => {
    if (!isGridEnabled) return { x, y, snappedX: false, snappedY: false };

    const snappedX = Math.round(x / gridSize) * gridSize;
    const snappedY = Math.round(y / gridSize) * gridSize;

    return {
      x: Math.abs(x - snappedX) <= snapThreshold ? snappedX : x,
      y: Math.abs(y - snappedY) <= snapThreshold ? snappedY : y,
      snappedX: Math.abs(x - snappedX) <= snapThreshold,
      snappedY: Math.abs(y - snappedY) <= snapThreshold,
    };
  }, [gridSize, snapThreshold, isGridEnabled]);

  const generateSmartGuides = useCallback((
    movingElement: { id: string; x: number; y: number; width: number; height: number },
    allElements: Array<{ id: string; x: number; y: number; width: number; height: number }>
  ): SnapGuide[] => {
    const guides: SnapGuide[] = [];
    const otherElements = allElements.filter(el => el.id !== movingElement.id);

    otherElements.forEach(element => {
      // Vertical alignment guides
      const leftAlign = element.x;
      const centerAlign = element.x + element.width / 2;
      const rightAlign = element.x + element.width;

      // Horizontal alignment guides
      const topAlign = element.y;
      const middleAlign = element.y + element.height / 2;
      const bottomAlign = element.y + element.height;

      // Check if moving element aligns with other elements
      const movingCenterX = movingElement.x + movingElement.width / 2;
      const movingCenterY = movingElement.y + movingElement.height / 2;

      // Vertical guides
      if (Math.abs(movingElement.x - leftAlign) <= snapThreshold) {
        guides.push({ id: `v-left-${element.id}`, type: 'vertical', position: leftAlign, elements: [element.id] });
      }
      if (Math.abs(movingCenterX - centerAlign) <= snapThreshold) {
        guides.push({ id: `v-center-${element.id}`, type: 'vertical', position: centerAlign, elements: [element.id] });
      }
      if (Math.abs(movingElement.x + movingElement.width - rightAlign) <= snapThreshold) {
        guides.push({ id: `v-right-${element.id}`, type: 'vertical', position: rightAlign, elements: [element.id] });
      }

      // Horizontal guides
      if (Math.abs(movingElement.y - topAlign) <= snapThreshold) {
        guides.push({ id: `h-top-${element.id}`, type: 'horizontal', position: topAlign, elements: [element.id] });
      }
      if (Math.abs(movingCenterY - middleAlign) <= snapThreshold) {
        guides.push({ id: `h-middle-${element.id}`, type: 'horizontal', position: middleAlign, elements: [element.id] });
      }
      if (Math.abs(movingElement.y + movingElement.height - bottomAlign) <= snapThreshold) {
        guides.push({ id: `h-bottom-${element.id}`, type: 'horizontal', position: bottomAlign, elements: [element.id] });
      }
    });

    return guides;
  }, [snapThreshold]);

  const snapToGuides = useCallback((
    x: number,
    y: number,
    width: number,
    height: number,
    allElements: Array<{ id: string; x: number; y: number; width: number; height: number }>,
    movingElementId: string
  ): SnapResult => {
    const movingElement = { id: movingElementId, x, y, width, height };
    const guides = generateSmartGuides(movingElement, allElements);
    
    let snappedX = x;
    let snappedY = y;
    let hasSnappedX = false;
    let hasSnappedY = false;

    guides.forEach(guide => {
      if (guide.type === 'vertical') {
        const centerX = x + width / 2;
        const rightX = x + width;

        if (Math.abs(x - guide.position) <= snapThreshold) {
          snappedX = guide.position;
          hasSnappedX = true;
        } else if (Math.abs(centerX - guide.position) <= snapThreshold) {
          snappedX = guide.position - width / 2;
          hasSnappedX = true;
        } else if (Math.abs(rightX - guide.position) <= snapThreshold) {
          snappedX = guide.position - width;
          hasSnappedX = true;
        }
      } else if (guide.type === 'horizontal') {
        const centerY = y + height / 2;
        const bottomY = y + height;

        if (Math.abs(y - guide.position) <= snapThreshold) {
          snappedY = guide.position;
          hasSnappedY = true;
        } else if (Math.abs(centerY - guide.position) <= snapThreshold) {
          snappedY = guide.position - height / 2;
          hasSnappedY = true;
        } else if (Math.abs(bottomY - guide.position) <= snapThreshold) {
          snappedY = guide.position - height;
          hasSnappedY = true;
        }
      }
    });

    setActiveGuides(guides);

    return {
      x: snappedX,
      y: snappedY,
      snappedX: hasSnappedX,
      snappedY: hasSnappedY,
    };
  }, [generateSmartGuides, snapThreshold]);

  const clearGuides = useCallback(() => {
    setActiveGuides([]);
  }, []);

  const toggleGrid = useCallback(() => {
    setIsGridEnabled(prev => !prev);
  }, []);

  return {
    activeGuides,
    isGridEnabled,
    gridSize,
    snapToGrid,
    snapToGuides,
    clearGuides,
    toggleGrid,
  };
}