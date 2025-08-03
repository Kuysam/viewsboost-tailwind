import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Plus, Undo, Redo, ZoomIn, ZoomOut, Grid3X3, Move, MousePointer, Type, Save, Download, Settings, Layers, Eye, EyeOff } from 'lucide-react';
import { TextElement, TextPreset, TextEditorState, KeyboardShortcut } from '../types/textPresets';
import TextElementEditor from './TextElementEditor';
import TextPresetsPanel from './TextPresetsPanel';

interface TextEditorCanvasProps {
  width?: number;
  height?: number;
  backgroundColor?: string;
  onSave?: (elements: TextElement[]) => void;
  onExport?: (elements: TextElement[]) => void;
  className?: string;
}

const TextEditorCanvas: React.FC<TextEditorCanvasProps> = ({
  width = 1920,
  height = 1080,
  backgroundColor = '#ffffff',
  onSave,
  onExport,
  className = ''
}) => {
  // State management
  const [editorState, setEditorState] = useState<TextEditorState>({
    textElements: [],
    selectedElements: [],
    clipboard: [],
    history: [[]],
    historyIndex: 0,
    canUndo: false,
    canRedo: false,
    isEditing: false,
    selectedTool: 'select',
    snapToGrid: false,
    showGuides: false,
    gridSize: 20,
    canvasSize: { width, height },
    zoom: 1,
    pan: { x: 0, y: 0 }
  });

  const [showPresetsPanel, setShowPresetsPanel] = useState(false);
  const [editingElementId, setEditingElementId] = useState<string | null>(null);
  const [showLayersPanel, setShowLayersPanel] = useState(false);
  const [nextZIndex, setNextZIndex] = useState(1);

  const canvasRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Generate unique ID
  const generateId = () => `text-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Add to history
  const addToHistory = useCallback((elements: TextElement[]) => {
    setEditorState(prev => {
      const newHistory = prev.history.slice(0, prev.historyIndex + 1);
      newHistory.push([...elements]);
      const newIndex = newHistory.length - 1;
      
      return {
        ...prev,
        history: newHistory.slice(-50), // Keep only last 50 states
        historyIndex: Math.min(newIndex, 49),
        canUndo: true,
        canRedo: false
      };
    });
  }, []);

  // Update element
  const updateElement = useCallback((updatedElement: TextElement) => {
    setEditorState(prev => {
      const newElements = prev.textElements.map(el => 
        el.id === updatedElement.id ? updatedElement : el
      );
      addToHistory(newElements);
      return {
        ...prev,
        textElements: newElements
      };
    });
  }, [addToHistory]);

  // Add element from preset
  const addElementFromPreset = useCallback((preset: TextPreset) => {
    const newElement: TextElement = {
      id: generateId(),
      presetId: preset.id,
      text: preset.sampleText,
      position: { 
        x: Math.random() * (editorState.canvasSize.width - 200) + 100, 
        y: Math.random() * (editorState.canvasSize.height - 100) + 50 
      },
      size: { width: 300, height: 80 },
      style: preset.style,
      animation: preset.animation,
      zIndex: nextZIndex,
      isSelected: false,
      isEditing: false,
      rotation: 0,
      scale: 1,
      opacity: 1,
      locked: false,
      visible: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    setNextZIndex(prev => prev + 1);
    setEditorState(prev => {
      const newElements = [...prev.textElements, newElement];
      addToHistory(newElements);
      return {
        ...prev,
        textElements: newElements,
        selectedElements: [newElement.id]
      };
    });
    setShowPresetsPanel(false);
  }, [editorState.canvasSize, nextZIndex, addToHistory]);

  // Delete element
  const deleteElement = useCallback((elementId: string) => {
    setEditorState(prev => {
      const newElements = prev.textElements.filter(el => el.id !== elementId);
      addToHistory(newElements);
      return {
        ...prev,
        textElements: newElements,
        selectedElements: prev.selectedElements.filter(id => id !== elementId)
      };
    });
  }, [addToHistory]);

  // Duplicate element
  const duplicateElement = useCallback((element: TextElement) => {
    const newElement: TextElement = {
      ...element,
      id: generateId(),
      position: { 
        x: element.position.x + 20, 
        y: element.position.y + 20 
      },
      zIndex: nextZIndex,
      isSelected: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    setNextZIndex(prev => prev + 1);
    setEditorState(prev => {
      const newElements = [...prev.textElements, newElement];
      addToHistory(newElements);
      return {
        ...prev,
        textElements: newElements,
        selectedElements: [newElement.id]
      };
    });
  }, [nextZIndex, addToHistory]);

  // Select element
  const selectElement = useCallback((elementId: string, addToSelection = false) => {
    setEditorState(prev => {
      const newSelection = addToSelection 
        ? prev.selectedElements.includes(elementId)
          ? prev.selectedElements.filter(id => id !== elementId)
          : [...prev.selectedElements, elementId]
        : [elementId];

      const newElements = prev.textElements.map(el => ({
        ...el,
        isSelected: newSelection.includes(el.id)
      }));

      return {
        ...prev,
        textElements: newElements,
        selectedElements: newSelection
      };
    });
  }, []);

  // Clear selection
  const clearSelection = useCallback(() => {
    setEditorState(prev => ({
      ...prev,
      textElements: prev.textElements.map(el => ({ ...el, isSelected: false })),
      selectedElements: []
    }));
  }, []);

  // Start editing text
  const startEditingText = useCallback((elementId: string) => {
    setEditingElementId(elementId);
    setEditorState(prev => ({
      ...prev,
      textElements: prev.textElements.map(el => ({
        ...el,
        isEditing: el.id === elementId
      })),
      isEditing: true
    }));
  }, []);

  // End editing text
  const endEditingText = useCallback(() => {
    setEditingElementId(null);
    setEditorState(prev => ({
      ...prev,
      textElements: prev.textElements.map(el => ({ ...el, isEditing: false })),
      isEditing: false
    }));
  }, []);

  // Undo/Redo
  const undo = useCallback(() => {
    setEditorState(prev => {
      if (prev.historyIndex > 0) {
        const newIndex = prev.historyIndex - 1;
        return {
          ...prev,
          textElements: [...prev.history[newIndex]],
          historyIndex: newIndex,
          canUndo: newIndex > 0,
          canRedo: true
        };
      }
      return prev;
    });
  }, []);

  const redo = useCallback(() => {
    setEditorState(prev => {
      if (prev.historyIndex < prev.history.length - 1) {
        const newIndex = prev.historyIndex + 1;
        return {
          ...prev,
          textElements: [...prev.history[newIndex]],
          historyIndex: newIndex,
          canUndo: true,
          canRedo: newIndex < prev.history.length - 1
        };
      }
      return prev;
    });
  }, []);

  // Zoom controls
  const zoomIn = () => {
    setEditorState(prev => ({
      ...prev,
      zoom: Math.min(prev.zoom * 1.2, 5)
    }));
  };

  const zoomOut = () => {
    setEditorState(prev => ({
      ...prev,
      zoom: Math.max(prev.zoom / 1.2, 0.1)
    }));
  };

  const resetZoom = () => {
    setEditorState(prev => ({ ...prev, zoom: 1 }));
  };

  // Keyboard shortcuts
  const keyboardShortcuts: KeyboardShortcut[] = [
    { key: 'z', ctrlKey: true, description: 'Undo', action: undo },
    { key: 'y', ctrlKey: true, description: 'Redo', action: redo },
    { key: 'z', ctrlKey: true, shiftKey: true, description: 'Redo', action: redo },
    { key: 'c', ctrlKey: true, description: 'Copy', action: () => {} },
    { key: 'v', ctrlKey: true, description: 'Paste', action: () => {} },
    { key: 'a', ctrlKey: true, description: 'Select All', action: () => {} },
    { key: 'Delete', description: 'Delete Selected', action: () => {
      editorState.selectedElements.forEach(deleteElement);
    }},
    { key: 'Escape', description: 'Clear Selection', action: clearSelection },
    { key: 't', description: 'Add Text', action: () => setShowPresetsPanel(true) }
  ];

  // Handle keyboard events
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const shortcut = keyboardShortcuts.find(s => 
        s.key.toLowerCase() === e.key.toLowerCase() &&
        !!s.ctrlKey === e.ctrlKey &&
        !!s.shiftKey === e.shiftKey &&
        !!s.altKey === e.altKey
      );

      if (shortcut && !editorState.isEditing) {
        e.preventDefault();
        shortcut.action();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [keyboardShortcuts, editorState.isEditing, editorState.selectedElements, deleteElement, clearSelection]);

  // Handle canvas click
  const handleCanvasClick = (e: React.MouseEvent) => {
    if (e.target === canvasRef.current) {
      clearSelection();
    }
  };

  // Handle save
  const handleSave = () => {
    if (onSave) {
      onSave(editorState.textElements);
    }
  };

  // Handle export
  const handleExport = () => {
    if (onExport) {
      onExport(editorState.textElements);
    }
  };

  // Render grid
  const renderGrid = () => {
    if (!editorState.showGuides) return null;

    const lines = [];
    const { width, height } = editorState.canvasSize;
    const { gridSize } = editorState;

    // Vertical lines
    for (let x = 0; x <= width; x += gridSize) {
      lines.push(
        <line
          key={`v-${x}`}
          x1={x}
          y1={0}
          x2={x}
          y2={height}
          stroke="#374151"
          strokeWidth={0.5}
          opacity={0.3}
        />
      );
    }

    // Horizontal lines
    for (let y = 0; y <= height; y += gridSize) {
      lines.push(
        <line
          key={`h-${y}`}
          x1={0}
          y1={y}
          x2={width}
          y2={y}
          stroke="#374151"
          strokeWidth={0.5}
          opacity={0.3}
        />
      );
    }

    return (
      <svg
        className="absolute inset-0 pointer-events-none"
        width={width}
        height={height}
      >
        {lines}
      </svg>
    );
  };

  // Render layers panel
  const renderLayersPanel = () => {
    if (!showLayersPanel) return null;

    const sortedElements = [...editorState.textElements].sort((a, b) => b.zIndex - a.zIndex);

    return (
      <div className="absolute top-16 right-4 w-64 bg-gray-800 border border-gray-600 rounded-lg shadow-lg p-4 z-20">
        <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
          <Layers className="w-4 h-4" />
          Layers ({sortedElements.length})
        </h3>
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {sortedElements.map((element) => (
            <div
              key={element.id}
              className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-colors ${
                element.isSelected ? 'bg-yellow-500/20 border border-yellow-500/50' : 'bg-gray-700 hover:bg-gray-600'
              }`}
              onClick={() => selectElement(element.id)}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  updateElement({ ...element, visible: !element.visible });
                }}
                className="text-gray-400 hover:text-white"
              >
                {element.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </button>
              <div className="flex-1 min-w-0">
                <div className="text-white text-sm truncate">{element.text}</div>
                <div className="text-gray-400 text-xs">Layer {element.zIndex}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className={`relative w-full h-full bg-gray-900 overflow-hidden ${className}`} ref={containerRef}>
      {/* Toolbar */}
      <div className="absolute top-4 left-4 right-4 bg-gray-800 border border-gray-600 rounded-lg p-3 shadow-lg z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Tool selection */}
            <div className="flex bg-gray-700 rounded-lg overflow-hidden">
              <button
                onClick={() => setEditorState(prev => ({ ...prev, selectedTool: 'select' }))}
                className={`p-2 ${editorState.selectedTool === 'select' ? 'bg-yellow-500 text-black' : 'text-gray-300 hover:text-white'}`}
                title="Select Tool"
              >
                <MousePointer className="w-4 h-4" />
              </button>
              <button
                onClick={() => setShowPresetsPanel(true)}
                className={`p-2 ${editorState.selectedTool === 'text' ? 'bg-yellow-500 text-black' : 'text-gray-300 hover:text-white'}`}
                title="Add Text"
              >
                <Type className="w-4 h-4" />
              </button>
            </div>

            {/* Divider */}
            <div className="w-px h-6 bg-gray-600" />

            {/* History controls */}
            <button
              onClick={undo}
              disabled={!editorState.canUndo}
              className="p-2 rounded text-gray-300 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
              title="Undo (Ctrl+Z)"
            >
              <Undo className="w-4 h-4" />
            </button>
            <button
              onClick={redo}
              disabled={!editorState.canRedo}
              className="p-2 rounded text-gray-300 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
              title="Redo (Ctrl+Y)"
            >
              <Redo className="w-4 h-4" />
            </button>

            {/* Divider */}
            <div className="w-px h-6 bg-gray-600" />

            {/* Zoom controls */}
            <button onClick={zoomOut} className="p-2 rounded text-gray-300 hover:text-white" title="Zoom Out">
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-gray-300 text-sm px-2 min-w-[60px] text-center">
              {Math.round(editorState.zoom * 100)}%
            </span>
            <button onClick={zoomIn} className="p-2 rounded text-gray-300 hover:text-white" title="Zoom In">
              <ZoomIn className="w-4 h-4" />
            </button>
            <button onClick={resetZoom} className="text-gray-400 hover:text-white text-xs px-2">
              Reset
            </button>

            {/* Divider */}
            <div className="w-px h-6 bg-gray-600" />

            {/* View controls */}
            <button
              onClick={() => setEditorState(prev => ({ ...prev, showGuides: !prev.showGuides }))}
              className={`p-2 rounded ${editorState.showGuides ? 'bg-yellow-500 text-black' : 'text-gray-300 hover:text-white'}`}
              title="Toggle Grid"
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowLayersPanel(!showLayersPanel)}
              className={`p-2 rounded ${showLayersPanel ? 'bg-yellow-500 text-black' : 'text-gray-300 hover:text-white'}`}
              title="Layers Panel"
            >
              <Layers className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* Element info */}
            <span className="text-gray-400 text-sm">
              {editorState.textElements.length} elements • {editorState.selectedElements.length} selected
            </span>

            {/* Divider */}
            <div className="w-px h-6 bg-gray-600" />

            {/* Actions */}
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
            >
              <Save className="w-4 h-4" />
              Save
            </button>
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg transition-colors"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Canvas */}
      <div className="absolute inset-0 pt-20 pb-4 px-4">
        <div className="w-full h-full overflow-auto bg-gray-800 rounded-lg">
          <div
            ref={canvasRef}
            className="relative mx-auto my-8 shadow-2xl"
            style={{
              width: editorState.canvasSize.width * editorState.zoom,
              height: editorState.canvasSize.height * editorState.zoom,
              backgroundColor,
              transform: `scale(${editorState.zoom})`,
              transformOrigin: 'top left'
            }}
            onClick={handleCanvasClick}
          >
            {renderGrid()}
            
            {/* Text Elements */}
            {editorState.textElements.map((element) => (
              <TextElementEditor
                key={element.id}
                element={element}
                onUpdate={updateElement}
                onDelete={deleteElement}
                onDuplicate={duplicateElement}
                isSelected={element.isSelected}
                onSelect={selectElement}
                canvasSize={editorState.canvasSize}
                zoom={editorState.zoom}
                onStartEdit={startEditingText}
                onEndEdit={endEditingText}
                showHandles={!editorState.isEditing || editingElementId === element.id}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Text Presets Panel */}
      <TextPresetsPanel
        isOpen={showPresetsPanel}
        onClose={() => setShowPresetsPanel(false)}
        onPresetSelect={addElementFromPreset}
      />

      {/* Layers Panel */}
      {renderLayersPanel()}
    </div>
  );
};

export default TextEditorCanvas;