import React, { useRef, useEffect, useCallback } from 'react';
import { fabric } from 'fabric';
import { useEditorStore, CanvasObject } from '../../store/editorStore';

interface CanvasCoreProps {
  width: number;
  height: number;
  backgroundColor?: string;
  onObjectAdded?: (object: fabric.Object) => void;
  onObjectModified?: (object: fabric.Object) => void;
  onObjectSelected?: (object: fabric.Object) => void;
  onSelectionCleared?: () => void;
}

const CanvasCore: React.FC<CanvasCoreProps> = ({
  width,
  height,
  backgroundColor = '#ffffff',
  onObjectAdded,
  onObjectModified,
  onObjectSelected,
  onSelectionCleared,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null);
  
  const {
    setCanvas,
    addObject,
    selectObjects,
    clearSelection,
    saveToHistory,
    showGrid,
    zoom,
  } = useEditorStore();

  // Initialize Fabric.js canvas
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = new fabric.Canvas(canvasRef.current, {
      width,
      height,
      backgroundColor,
      selection: true,
      preserveObjectStacking: true,
      imageSmoothingEnabled: true,
      enableRetinaScaling: true,
      fireRightClick: true,
      stopContextMenu: true,
    });

    fabricCanvasRef.current = canvas;
    setCanvas(canvas);

    // Setup event listeners
    setupEventListeners(canvas);

    // Set initial zoom
    canvas.setZoom(zoom);

    // Add grid if enabled
    if (showGrid) {
      addGridToCanvas(canvas);
    }

    return () => {
      canvas.dispose();
      fabricCanvasRef.current = null;
    };
  }, [width, height, backgroundColor, setCanvas]);

  // Update zoom when store changes
  useEffect(() => {
    const canvas = fabricCanvasRef.current;
    if (canvas && canvas.getZoom() !== zoom) {
      canvas.setZoom(zoom);
      canvas.renderAll();
    }
  }, [zoom]);

  // Update grid visibility
  useEffect(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    // Remove existing grid
    const objects = canvas.getObjects();
    objects.forEach(obj => {
      if ((obj as any).isGrid) {
        canvas.remove(obj);
      }
    });

    if (showGrid) {
      addGridToCanvas(canvas);
    }

    canvas.renderAll();
  }, [showGrid]);

  const setupEventListeners = useCallback((canvas: fabric.Canvas) => {
    // Object added to canvas
    canvas.on('object:added', (e) => {
      if (e.target && !(e.target as any).isGrid) {
        const fabricObject = e.target;
        const id = (fabricObject as any).id || `object-${Date.now()}`;
        (fabricObject as any).id = id;

        const canvasObject: CanvasObject = {
          id,
          type: getObjectType(fabricObject),
          fabricObject,
          properties: extractObjectProperties(fabricObject),
          layer: {
            name: `${getObjectType(fabricObject)} ${id.split('-')[1]}`,
            order: canvas.getObjects().length,
          },
        };

        addObject(canvasObject);
        onObjectAdded?.(fabricObject);
        saveToHistory();
      }
    });

    // Object modified
    canvas.on('object:modified', (e) => {
      if (e.target && !(e.target as any).isGrid) {
        onObjectModified?.(e.target);
        saveToHistory();
      }
    });

    // Selection created
    canvas.on('selection:created', (e) => {
      if (e.selected && e.selected.length > 0) {
        const selectedIds = e.selected
          .filter(obj => !(obj as any).isGrid)
          .map(obj => (obj as any).id)
          .filter(Boolean);
        
        selectObjects(selectedIds);
        
        if (e.selected[0]) {
          onObjectSelected?.(e.selected[0]);
        }
      }
    });

    // Selection updated
    canvas.on('selection:updated', (e) => {
      if (e.selected && e.selected.length > 0) {
        const selectedIds = e.selected
          .filter(obj => !(obj as any).isGrid)
          .map(obj => (obj as any).id)
          .filter(Boolean);
        
        selectObjects(selectedIds);
        
        if (e.selected[0]) {
          onObjectSelected?.(e.selected[0]);
        }
      }
    });

    // Selection cleared
    canvas.on('selection:cleared', () => {
      clearSelection();
      onSelectionCleared?.();
    });

    // Mouse wheel zoom
    canvas.on('mouse:wheel', (opt) => {
      const delta = opt.e.deltaY;
      let zoom = canvas.getZoom();
      zoom *= 0.999 ** delta;
      if (zoom > 20) zoom = 20;
      if (zoom < 0.01) zoom = 0.01;
      canvas.setZoom(zoom);
      opt.e.preventDefault();
      opt.e.stopPropagation();
    });
  }, [addObject, selectObjects, clearSelection, saveToHistory, onObjectAdded, onObjectModified, onObjectSelected, onSelectionCleared]);

  const getObjectType = (fabricObject: fabric.Object): CanvasObject['type'] => {
    if (fabricObject instanceof fabric.IText || fabricObject instanceof fabric.Text) {
      return 'text';
    } else if (fabricObject instanceof fabric.Image) {
      return 'image';
    } else if (fabricObject instanceof fabric.Group) {
      return 'group';
    } else {
      return 'shape';
    }
  };

  const extractObjectProperties = (fabricObject: fabric.Object) => {
    return {
      x: fabricObject.left || 0,
      y: fabricObject.top || 0,
      width: fabricObject.width || 0,
      height: fabricObject.height || 0,
      rotation: fabricObject.angle || 0,
      opacity: (fabricObject.opacity || 1) * 100,
      visible: fabricObject.visible !== false,
      locked: fabricObject.selectable === false,
      zIndex: fabricObject.zIndex || 0,
      // Type-specific properties
      ...(fabricObject instanceof fabric.IText && {
        text: fabricObject.text,
        fontSize: fabricObject.fontSize,
        fontFamily: fabricObject.fontFamily,
        fontWeight: fabricObject.fontWeight,
        fontStyle: fabricObject.fontStyle,
        textAlign: fabricObject.textAlign,
        fill: fabricObject.fill,
        underline: fabricObject.underline,
        linethrough: fabricObject.linethrough,
        overline: fabricObject.overline,
      }),
      ...(fabricObject instanceof fabric.Object && fabricObject.fill && {
        fill: fabricObject.fill,
      }),
    };
  };

  const addGridToCanvas = (canvas: fabric.Canvas) => {
    const gridSize = 20;
    const canvasWidth = canvas.getWidth();
    const canvasHeight = canvas.getHeight();

    // Vertical lines
    for (let i = 0; i <= canvasWidth / gridSize; i++) {
      const line = new fabric.Line([i * gridSize, 0, i * gridSize, canvasHeight], {
        stroke: '#e5e7eb',
        strokeWidth: 1,
        selectable: false,
        evented: false,
        excludeFromExport: true,
      });
      (line as any).isGrid = true;
      canvas.add(line);
    }

    // Horizontal lines
    for (let i = 0; i <= canvasHeight / gridSize; i++) {
      const line = new fabric.Line([0, i * gridSize, canvasWidth, i * gridSize], {
        stroke: '#e5e7eb',
        strokeWidth: 1,
        selectable: false,
        evented: false,
        excludeFromExport: true,
      });
      (line as any).isGrid = true;
      canvas.add(line);
    }

    // Send grid to back
    canvas.getObjects().forEach(obj => {
      if ((obj as any).isGrid) {
        canvas.sendToBack(obj);
      }
    });
  };

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        className="border border-gray-300 rounded-lg shadow-lg bg-white"
        style={{
          display: 'block',
          cursor: 'crosshair',
        }}
      />
    </div>
  );
};

export default CanvasCore; 