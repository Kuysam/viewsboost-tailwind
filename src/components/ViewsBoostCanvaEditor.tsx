// ViewsBoostCanvaEditor.tsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import { fabric } from 'fabric';
import { addMediaLayer } from '../utils/canvasMedia';
import { CanvasHost } from '@/canvas/host';
import {
  Type, Image, Square, Circle, Triangle, Upload, Download, Save,
  Undo, Redo, Copy, Trash2, RotateCw, Palette, AlignLeft, AlignCenter,
  AlignRight, Bold, Italic, Underline, Plus, Minus, Move, Lock,
  Unlock, Eye, EyeOff, Layers, ZoomIn, ZoomOut, Home, Grid,
  Settings, Share, Play, Pause, Volume2, Crop, Filter
} from "lucide-react";

// Types for ViewsBoost Studio integration
interface TemplateData {
  id: string;
  title: string;
  category: string;
  subcategory?: string;
  studioEditor?: {
    canvasType: string;
    dimensions: { width: number; height: number };
    layers: any[];
  };
  assets?: {
    background?: string;
    thumbnail?: string;
    preview?: string;
  };
  metadata?: any;
}

interface EditorProps {
  template?: TemplateData;
  onSave?: (canvasData: any) => void;
  onExport?: (format: string) => void;
  onClose?: () => void;
}

// Toolbar sections
const TOOLBAR_SECTIONS = {
  ELEMENTS: [
    { key: 'text', icon: <Type size={18} />, label: 'Text' },
    { key: 'shapes', icon: <Square size={18} />, label: 'Shapes' },
    { key: 'images', icon: <Image size={18} />, label: 'Images' },
    { key: 'upload', icon: <Upload size={18} />, label: 'Upload' }
  ],
  TOOLS: [
    { key: 'move', icon: <Move size={18} />, label: 'Move' },
    { key: 'crop', icon: <Crop size={18} />, label: 'Crop' },
    { key: 'filter', icon: <Filter size={18} />, label: 'Filter' }
  ],
  ACTIONS: [
    { key: 'undo', icon: <Undo size={18} />, label: 'Undo' },
    { key: 'redo', icon: <Redo size={18} />, label: 'Redo' },
    { key: 'copy', icon: <Copy size={18} />, label: 'Copy' },
    { key: 'delete', icon: <Trash2 size={18} />, label: 'Delete' }
  ]
};

const SHAPE_TYPES = [
  { type: 'rectangle', icon: <Square size={20} />, label: 'Rectangle' },
  { type: 'circle', icon: <Circle size={20} />, label: 'Circle' },
  { type: 'triangle', icon: <Triangle size={20} />, label: 'Triangle' }
];

const TEXT_PRESETS = [
  { name: 'Heading', fontSize: 48, fontWeight: 'bold', fontFamily: 'Arial' },
  { name: 'Subheading', fontSize: 32, fontWeight: 'normal', fontFamily: 'Arial' },
  { name: 'Body', fontSize: 16, fontWeight: 'normal', fontFamily: 'Arial' },
  { name: 'Caption', fontSize: 12, fontWeight: 'normal', fontFamily: 'Arial' }
];

const PRESET_COLORS = [
  '#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF',
  '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500', '#800080'
];

export default function ViewsBoostCanvaEditor({ template, onSave, onExport, onClose }: EditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [canvas, setCanvas] = useState<fabric.Canvas | null>(null);
  const [selectedObject, setSelectedObject] = useState<fabric.Object | null>(null);
  const [activePanel, setActivePanel] = useState<string | null>(null);
  const [canvasHistory, setCanvasHistory] = useState<string[]>([]);
  const [historyStep, setHistoryStep] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);

  // Initialize canvas once
  useEffect(() => {
    if (canvasRef.current && !canvas) {
      const fabricCanvas = new fabric.Canvas(canvasRef.current, {
        width: 1920,
        height: 1080,
        backgroundColor: '#ffffff',
        selection: true
      });

      setupCanvasEvents(fabricCanvas);
      setCanvas(fabricCanvas);
      // Expose the main canvas globally for Studio Dashboard quick-insert actions
      // (e.g., adding stock images/videos directly after opening the editor)
      try {
        (window as any).__viewsboost_main_canvas = fabricCanvas;
      } catch {
        // no-op: safe guard for environments without window
      }

      return () => {
        // Remove global reference if it points to this canvas
        try {
          if ((window as any).__viewsboost_main_canvas === fabricCanvas) {
            delete (window as any).__viewsboost_main_canvas;
          }
        } catch {
          // ignore cleanup errors
        }
        fabricCanvas.dispose();
      };
    }
  }, []);

  // Bind global CanvasHost so TopBar controls operate this editor
  useEffect(() => {
    if (!canvas) return;
    CanvasHost.bind({
      undo: () => {
        // reuse component undo
        if (historyStep > 0) {
          const prevState = canvasHistory[historyStep - 1];
          canvas.loadFromJSON(prevState, () => {
            canvas.renderAll();
            setHistoryStep(historyStep - 1);
          });
        }
      },
      redo: () => {
        if (historyStep < canvasHistory.length - 1) {
          const nextState = canvasHistory[historyStep + 1];
          canvas.loadFromJSON(nextState, () => {
            canvas.renderAll();
            setHistoryStep(historyStep + 1);
          });
        }
      },
      export: async (fmt, scale, transparent) => {
        const format = fmt === 'jpg' ? 'jpeg' : 'png';
        const dataUrl = (canvas as any).toDataURL({ format, multiplier: scale });
        const res = await fetch(dataUrl);
        return await res.blob();
      },
      newDesign: (w, h) => {
        canvas.setDimensions({ width: w, height: h });
        canvas.clear();
        canvas.renderAll();
        // record fresh state
        const currentState = JSON.stringify(canvas.toJSON());
        const next = [currentState];
        setCanvasHistory(next);
        setHistoryStep(0);
      },
    });
  }, [canvas, canvasHistory, historyStep]);

  // Load template (studio layers or external jsonPath)
  useEffect(() => {
    if (!canvas || !template) return;

    try {
      console.log('[Editor] Template received:', {
        hasStudioLayers: !!template?.studioEditor?.layers,
        jsonPath: (template as any).jsonPath,
        width: (template as any).width,
        height: (template as any).height,
      });
    } catch {}

    // Resize canvas to template dimensions if provided
    if ((template as any).width && (template as any).height) {
      canvas.setDimensions({ width: (template as any).width, height: (template as any).height });
    }

    const run = async () => {
      canvas.clear();
      if (template?.studioEditor?.layers) {
        try { console.log('[Editor] Loading studioEditor template with layers:', template.studioEditor?.layers?.length || 0); } catch {}
        loadTemplateToCanvas(canvas, template);
        canvas.renderAll();
        saveCanvasState(canvas);
        return;
      }

      const jp: any = (template as any).jsonPath;
      if (typeof jp === 'string' && jp.length > 0) {
        try {
          const tpl = await (await fetch(jp)).json();
          if (import.meta.env.DEV) {
            console.log('[Editor] Loaded JSON template from', jp, 'layers:', tpl.layers?.length || 0);
          }
          canvas.clear();

          for (const layer of tpl.layers ?? []) {
            await addMediaLayer(canvas, layer); // works for image or video layers
          }

          canvas.requestRenderAll();
          saveCanvasState(canvas);
        } catch (e) {
          console.warn('Failed to load external template JSON:', jp, e);
        }
      }
    };

    run();
  }, [canvas, template]);

  // Setup canvas event listeners
  const setupCanvasEvents = (fabricCanvas: fabric.Canvas) => {
    fabricCanvas.on('selection:created', (e) => {
      setSelectedObject(e.selected?.[0] || null);
    });

    fabricCanvas.on('selection:updated', (e) => {
      setSelectedObject(e.selected?.[0] || null);
    });

    fabricCanvas.on('selection:cleared', () => {
      setSelectedObject(null);
    });

    fabricCanvas.on('object:modified', () => {
      saveCanvasState(fabricCanvas);
    });

    fabricCanvas.on('path:created', () => {
      saveCanvasState(fabricCanvas);
    });
  };

  // Load template data to canvas
  const addImageLayer = async (canvas: fabric.Canvas, layer: any) => {
    return new Promise<void>((resolve) => {
      const options = { crossOrigin: 'anonymous' as const };
      fabric.Image.fromURL(String(layer.url || ''), (img) => {
        if (!img) { console.warn('Image load failed (CORS or network):', layer?.url); return resolve(); }
        if (typeof layer.w === 'number' && layer.w > 0) {
          img.scaleToWidth(layer.w);
        }
        img.set({
          left: typeof layer.x === 'number' ? layer.x : 0,
          top: typeof layer.y === 'number' ? layer.y : 0,
          selectable: true,
        });
        canvas.add(img);
        canvas.requestRenderAll();
        resolve();
      }, options);
    });
  };

  const loadTemplateToCanvas = (fabricCanvas: fabric.Canvas, templateData: TemplateData) => {
    if (!templateData.studioEditor?.layers) return;

    templateData.studioEditor.layers.forEach((layer: any) => {
      switch (layer.type) {
        case 'background':
          if (layer.asset) {
            fabric.Image.fromURL(layer.asset, (img) => {
              img.set({
                scaleX: fabricCanvas.width! / img.width!,
                scaleY: fabricCanvas.height! / img.height!,
                selectable: layer.editable !== false
              });
              fabricCanvas.setBackgroundImage(img, fabricCanvas.renderAll.bind(fabricCanvas));
            }, { crossOrigin: 'anonymous' });
          }
          break;
        case 'image':
          addImageLayer(fabricCanvas, layer);
          break;
        case 'video':
          // Use shared media helper which handles autoplay, loop, render loop, etc.
          addMediaLayer(fabricCanvas, {
            type: 'video',
            url: String(layer.url || ''),
            w: typeof layer.w === 'number' ? layer.w : undefined,
            autoplay: layer.autoplay ?? true,
            loop: layer.loop ?? true,
            muted: layer.muted ?? true,
          } as any);
          break;
        
        case 'text':
          const text = new fabric.IText(layer.content || 'Sample Text', {
            left: layer.position?.x || 100,
            top: layer.position?.y || 100,
            fontSize: layer.style?.fontSize || 24,
            fontFamily: layer.style?.fontFamily || 'Arial',
            fill: layer.style?.color || '#000000',
            textAlign: layer.style?.textAlign || 'left',
            selectable: layer.editable !== false
          });
          fabricCanvas.add(text);
          break;

        case 'shape':
          if (layer.element === 'rectangle') {
            const rect = new fabric.Rect({
              left: layer.position?.x || 100,
              top: layer.position?.y || 100,
              width: layer.style?.width || 100,
              height: layer.style?.height || 100,
              fill: layer.style?.fill || '#000000',
              opacity: layer.style?.opacity || 1,
              selectable: layer.editable !== false
            });
            fabricCanvas.add(rect);
          }
          break;
      }
    });

    fabricCanvas.renderAll();
  };

  // Save canvas state for undo/redo
  const saveCanvasState = (fabricCanvas: fabric.Canvas) => {
    const currentState = JSON.stringify(fabricCanvas.toJSON());
    const newHistory = canvasHistory.slice(0, historyStep + 1);
    newHistory.push(currentState);
    setCanvasHistory(newHistory);
    setHistoryStep(newHistory.length - 1);
  };

  // Add text to canvas
  const addText = (preset = TEXT_PRESETS[0]) => {
    if (!canvas) return;
    
    const text = new fabric.IText('Click to edit', {
      left: 100,
      top: 100,
      fontSize: preset.fontSize,
      fontWeight: preset.fontWeight,
      fontFamily: preset.fontFamily,
      fill: '#000000'
    });
    
    canvas.add(text);
    canvas.setActiveObject(text);
    canvas.renderAll();
    saveCanvasState(canvas);
  };

  // Add shape to canvas
  const addShape = (shapeType: string) => {
    if (!canvas) return;
    
    let shape: fabric.Object;
    
    switch (shapeType) {
      case 'rectangle':
        shape = new fabric.Rect({
          left: 100,
          top: 100,
          width: 150,
          height: 100,
          fill: '#3b82f6'
        });
        break;
      case 'circle':
        shape = new fabric.Circle({
          left: 100,
          top: 100,
          radius: 50,
          fill: '#ef4444'
        });
        break;
      case 'triangle':
        shape = new fabric.Triangle({
          left: 100,
          top: 100,
          width: 100,
          height: 100,
          fill: '#10b981'
        });
        break;
      default:
        return;
    }
    
    canvas.add(shape);
    canvas.setActiveObject(shape);
    canvas.renderAll();
    saveCanvasState(canvas);
  };

  // Handle file upload
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !canvas) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const imgUrl = e.target?.result as string;
      fabric.Image.fromURL(imgUrl, (img) => {
        img.set({
          left: 100,
          top: 100,
          scaleX: 0.5,
          scaleY: 0.5
        });
        canvas.add(img);
        canvas.setActiveObject(img);
        canvas.renderAll();
        saveCanvasState(canvas);
      });
    };
    reader.readAsDataURL(file);
  };

  // Update object properties
  const updateObjectProperty = (property: string, value: any) => {
    if (!selectedObject || !canvas) return;
    
    selectedObject.set(property as any, value as any);
    canvas.renderAll();
    saveCanvasState(canvas);
  };

  // Undo/Redo functionality
  const undo = () => {
    if (historyStep > 0 && canvas) {
      const prevState = canvasHistory[historyStep - 1];
      canvas.loadFromJSON(prevState, () => {
        canvas.renderAll();
        setHistoryStep(historyStep - 1);
      });
    }
  };

  const redo = () => {
    if (historyStep < canvasHistory.length - 1 && canvas) {
      const nextState = canvasHistory[historyStep + 1];
      canvas.loadFromJSON(nextState, () => {
        canvas.renderAll();
        setHistoryStep(historyStep + 1);
      });
    }
  };

  // Copy selected object
  const copyObject = () => {
    if (!selectedObject || !canvas) return;
    
    selectedObject.clone((cloned: fabric.Object) => {
      cloned.set({
        left: (selectedObject.left || 0) + 20,
        top: (selectedObject.top || 0) + 20
      });
      canvas.add(cloned);
      canvas.setActiveObject(cloned);
      canvas.renderAll();
      saveCanvasState(canvas);
    });
  };

  // Delete selected object
  const deleteObject = () => {
    if (!selectedObject || !canvas) return;
    
    canvas.remove(selectedObject);
    canvas.renderAll();
    saveCanvasState(canvas);
  };

  // Zoom functions
  const zoomIn = () => {
    if (!canvas) return;
    const newZoom = Math.min(zoom * 1.1, 3);
    setZoom(newZoom);
    canvas.setZoom(newZoom);
    canvas.renderAll();
  };

  const zoomOut = () => {
    if (!canvas) return;
    const newZoom = Math.max(zoom / 1.1, 0.1);
    setZoom(newZoom);
    canvas.setZoom(newZoom);
    canvas.renderAll();
  };

  const resetZoom = () => {
    if (!canvas) return;
    setZoom(1);
    canvas.setZoom(1);
    canvas.renderAll();
  };

  // Export canvas
  const exportCanvas = (format: 'png' | 'jpg' | 'svg' | 'pdf') => {
    if (!canvas) return;
    
    switch (format) {
      case 'png':
        const pngUrl = (canvas as any).toDataURL('image/png');
        downloadFile(pngUrl, 'design.png');
        break;
      case 'jpg':
        const jpgUrl = (canvas as any).toDataURL('image/jpeg', 0.9);
        downloadFile(jpgUrl, 'design.jpg');
        break;
      case 'svg':
        const svgData = canvas.toSVG();
        downloadFile(`data:image/svg+xml;base64,${btoa(svgData)}`, 'design.svg');
        break;
    }
    
    onExport?.(format);
  };

  // Download file helper
  const downloadFile = (url: string, filename: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Save canvas data
  const saveCanvas = () => {
    if (!canvas) return;
    
    const canvasData = canvas.toJSON();
    onSave?.(canvasData);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-900">
      {/* Top Toolbar */}
      <div className="bg-gray-800 border-b border-gray-700 p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={onClose}
            className="text-white hover:text-yellow-400 transition"
          >
            <Home size={20} />
          </button>
          <h1 className="text-white font-bold text-lg">
            {template ? `Editing: ${template.title}` : 'ViewsBoost Editor'}
          </h1>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={undo}
            disabled={historyStep <= 0}
            className="p-2 text-white hover:text-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Undo"
          >
            <Undo size={18} />
          </button>
          <button 
            onClick={redo}
            disabled={historyStep >= canvasHistory.length - 1}
            className="p-2 text-white hover:text-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Redo"
          >
            <Redo size={18} />
          </button>
          <div className="w-px h-6 bg-gray-600 mx-2" />
          <button 
            onClick={zoomOut}
            className="p-2 text-white hover:text-yellow-400"
            title="Zoom Out"
          >
            <ZoomOut size={18} />
          </button>
          <span className="text-white text-sm min-w-[60px] text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button 
            onClick={zoomIn}
            className="p-2 text-white hover:text-yellow-400"
            title="Zoom In"
          >
            <ZoomIn size={18} />
          </button>
          <button 
            onClick={resetZoom}
            className="p-2 text-white hover:text-yellow-400"
            title="Reset Zoom"
          >
            <Grid size={18} />
          </button>
          <div className="w-px h-6 bg-gray-600 mx-2" />
          <button 
            onClick={saveCanvas}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
          >
            <Save size={18} className="inline mr-2" />
            Save
          </button>
          <button 
            onClick={() => exportCanvas('png')}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
          >
            <Download size={18} className="inline mr-2" />
            Export
          </button>
        </div>
      </div>

      <div className="flex flex-1">
        {/* Left Sidebar */}
        <div className="w-80 bg-gray-800 border-r border-gray-700 flex flex-col">
          {/* Tool Categories */}
          <div className="p-4 border-b border-gray-700">
            <h3 className="text-white font-semibold mb-3">Elements</h3>
            <div className="grid grid-cols-2 gap-2">
              {TOOLBAR_SECTIONS.ELEMENTS.map((tool) => (
                <button
                  key={tool.key}
                  onClick={() => setActivePanel(activePanel === tool.key ? null : tool.key)}
                  className={`p-3 rounded flex flex-col items-center gap-1 transition ${
                    activePanel === tool.key 
                      ? 'bg-yellow-400 text-black' 
                      : 'bg-gray-700 text-white hover:bg-gray-600'
                  }`}
                >
                  {tool.icon}
                  <span className="text-xs">{tool.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Dynamic Panel Content */}
          <div className="flex-1 overflow-y-auto">
            {activePanel === 'text' && (
              <div className="p-4">
                <h4 className="text-white font-semibold mb-3">Text Presets</h4>
                <div className="space-y-2">
                  {TEXT_PRESETS.map((preset, index) => (
                    <button
                      key={index}
                      onClick={() => addText(preset)}
                      className="w-full p-3 bg-gray-700 hover:bg-gray-600 text-white rounded text-left"
                    >
                      <div className="font-semibold">{preset.name}</div>
                      <div className="text-sm text-gray-300">{preset.fontSize}px</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {activePanel === 'shapes' && (
              <div className="p-4">
                <h4 className="text-white font-semibold mb-3">Shapes</h4>
                <div className="grid grid-cols-2 gap-2">
                  {SHAPE_TYPES.map((shape) => (
                    <button
                      key={shape.type}
                      onClick={() => addShape(shape.type)}
                      className="p-4 bg-gray-700 hover:bg-gray-600 text-white rounded flex flex-col items-center gap-2"
                    >
                      {shape.icon}
                      <span className="text-xs">{shape.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {activePanel === 'upload' && (
              <div className="p-4">
                <h4 className="text-white font-semibold mb-3">Upload Image</h4>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="image-upload"
                />
                <label
                  htmlFor="image-upload"
                  className="w-full p-4 border-2 border-dashed border-gray-600 rounded-lg flex flex-col items-center gap-2 cursor-pointer hover:border-yellow-400 transition"
                >
                  <Upload size={32} className="text-gray-400" />
                  <span className="text-white">Click to upload image</span>
                </label>
              </div>
            )}
          </div>
        </div>

        {/* Canvas Area */}
        <div className="flex-1 bg-gray-900 flex items-center justify-center p-8">
          <div className="bg-white shadow-2xl rounded-lg overflow-hidden" style={{ width: (template as any)?.width || 1920, height: (template as any)?.height || 1080 }}>
            <canvas ref={canvasRef} width={(template as any)?.width || 1920} height={(template as any)?.height || 1080} />
          </div>
        </div>

        {/* Right Sidebar - Properties */}
        <div className="w-80 bg-gray-800 border-l border-gray-700 p-4">
          <h3 className="text-white font-semibold mb-4">Properties</h3>
          
          {selectedObject ? (
            <div className="space-y-4">
              {/* Position */}
              <div>
                <label className="block text-white text-sm font-medium mb-2">Position</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    placeholder="X"
                    value={Math.round(selectedObject.left || 0)}
                    onChange={(e) => updateObjectProperty('left', parseInt(e.target.value))}
                    className="bg-gray-700 text-white p-2 rounded text-sm"
                  />
                  <input
                    type="number"
                    placeholder="Y"
                    value={Math.round(selectedObject.top || 0)}
                    onChange={(e) => updateObjectProperty('top', parseInt(e.target.value))}
                    className="bg-gray-700 text-white p-2 rounded text-sm"
                  />
                </div>
              </div>

              {/* Size (for shapes and images) */}
              {(selectedObject.type === 'rect' || selectedObject.type === 'circle' || selectedObject.type === 'image') && (
                <div>
                  <label className="block text-white text-sm font-medium mb-2">Size</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      placeholder="Width"
                      value={Math.round((selectedObject as any).width * (selectedObject.scaleX || 1) || 0)}
                      onChange={(e) => {
                        const newWidth = parseInt(e.target.value);
                        const currentWidth = (selectedObject as any).width || 1;
                        updateObjectProperty('scaleX', newWidth / currentWidth);
                      }}
                      className="bg-gray-700 text-white p-2 rounded text-sm"
                    />
                    <input
                      type="number"
                      placeholder="Height"
                      value={Math.round((selectedObject as any).height * (selectedObject.scaleY || 1) || 0)}
                      onChange={(e) => {
                        const newHeight = parseInt(e.target.value);
                        const currentHeight = (selectedObject as any).height || 1;
                        updateObjectProperty('scaleY', newHeight / currentHeight);
                      }}
                      className="bg-gray-700 text-white p-2 rounded text-sm"
                    />
                  </div>
                </div>
              )}

              {/* Color */}
              <div>
                <label className="block text-white text-sm font-medium mb-2">Color</label>
                <div className="grid grid-cols-5 gap-2 mb-2">
                  {PRESET_COLORS.map((color) => (
                    <button
                      key={color}
                      onClick={() => updateObjectProperty('fill', color)}
                      className="w-8 h-8 rounded border-2 border-gray-600 hover:border-white"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                <input
                  type="color"
                  value={selectedObject.fill as string || '#000000'}
                  onChange={(e) => updateObjectProperty('fill', e.target.value)}
                  className="w-full h-10 rounded"
                />
              </div>

              {/* Opacity */}
              <div>
                <label className="block text-white text-sm font-medium mb-2">
                  Opacity: {Math.round((selectedObject.opacity || 1) * 100)}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={selectedObject.opacity || 1}
                  onChange={(e) => updateObjectProperty('opacity', parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>

              {/* Text Properties */}
              {selectedObject.type === 'i-text' && (
                <>
                  <div>
                    <label className="block text-white text-sm font-medium mb-2">Font Size</label>
                    <input
                      type="range"
                      min="8"
                      max="200"
                      value={(selectedObject as fabric.IText).fontSize || 24}
                      onChange={(e) => updateObjectProperty('fontSize', parseInt(e.target.value))}
                      className="w-full"
                    />
                    <span className="text-white text-sm">{(selectedObject as fabric.IText).fontSize || 24}px</span>
                  </div>

                  <div>
                    <label className="block text-white text-sm font-medium mb-2">Text Align</label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => updateObjectProperty('textAlign', 'left')}
                        className="p-2 bg-gray-700 hover:bg-gray-600 text-white rounded"
                      >
                        <AlignLeft size={16} />
                      </button>
                      <button
                        onClick={() => updateObjectProperty('textAlign', 'center')}
                        className="p-2 bg-gray-700 hover:bg-gray-600 text-white rounded"
                      >
                        <AlignCenter size={16} />
                      </button>
                      <button
                        onClick={() => updateObjectProperty('textAlign', 'right')}
                        className="p-2 bg-gray-700 hover:bg-gray-600 text-white rounded"
                      >
                        <AlignRight size={16} />
                      </button>
                    </div>
                  </div>
                </>
              )}

              {/* Actions */}
              <div className="pt-4 border-t border-gray-700">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={copyObject}
                    className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded flex items-center justify-center gap-2"
                  >
                    <Copy size={16} />
                    Copy
                  </button>
                  <button
                    onClick={deleteObject}
                    className="p-2 bg-red-600 hover:bg-red-700 text-white rounded flex items-center justify-center gap-2"
                  >
                    <Trash2 size={16} />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-gray-400 mb-2">
                <Settings size={48} className="mx-auto" />
              </div>
              <p className="text-gray-400">Select an object to edit properties</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}