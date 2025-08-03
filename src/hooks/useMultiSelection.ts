import { useState, useCallback, useRef } from 'react';

export interface SelectionRect {
  startX: number;
  startY: number;
  width: number;
  height: number;
}

export interface MultiSelectionState {
  selectedIds: string[];
  isSelecting: boolean;
  selectionRect: SelectionRect | null;
}

export function useMultiSelection() {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionRect, setSelectionRect] = useState<SelectionRect | null>(null);
  const selectionStartRef = useRef<{ x: number; y: number } | null>(null);

  const startSelection = useCallback((x: number, y: number) => {
    setIsSelecting(true);
    selectionStartRef.current = { x, y };
    setSelectionRect({ startX: x, startY: y, width: 0, height: 0 });
  }, []);

  const updateSelection = useCallback((x: number, y: number) => {
    if (!isSelecting || !selectionStartRef.current) return;

    const start = selectionStartRef.current;
    const width = x - start.x;
    const height = y - start.y;

    setSelectionRect({
      startX: width < 0 ? x : start.x,
      startY: height < 0 ? y : start.y,
      width: Math.abs(width),
      height: Math.abs(height),
    });
  }, [isSelecting]);

  const endSelection = useCallback((elements: Array<{ id: string; x: number; y: number; width: number; height: number }>) => {
    if (!selectionRect) {
      setIsSelecting(false);
      return;
    }

    // Find elements within selection rectangle
    const selectedElements = elements.filter(element => {
      const elementRight = element.x + element.width;
      const elementBottom = element.y + element.height;
      const selectionRight = selectionRect.startX + selectionRect.width;
      const selectionBottom = selectionRect.startY + selectionRect.height;

      return (
        element.x < selectionRight &&
        elementRight > selectionRect.startX &&
        element.y < selectionBottom &&
        elementBottom > selectionRect.startY
      );
    });

    setSelectedIds(selectedElements.map(el => el.id));
    setIsSelecting(false);
    setSelectionRect(null);
    selectionStartRef.current = null;
  }, [selectionRect]);

  const selectElement = useCallback((id: string, multiSelect = false) => {
    if (multiSelect) {
      setSelectedIds(prev => 
        prev.includes(id) 
          ? prev.filter(selectedId => selectedId !== id)
          : [...prev, id]
      );
    } else {
      setSelectedIds([id]);
    }
  }, []);

  const selectAll = useCallback((elementIds: string[]) => {
    setSelectedIds(elementIds);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedIds([]);
  }, []);

  const deleteSelected = useCallback(() => {
    const toDelete = [...selectedIds];
    setSelectedIds([]);
    return toDelete;
  }, [selectedIds]);

  return {
    selectedIds,
    isSelecting,
    selectionRect,
    startSelection,
    updateSelection,
    endSelection,
    selectElement,
    selectAll,
    clearSelection,
    deleteSelected,
  };
}