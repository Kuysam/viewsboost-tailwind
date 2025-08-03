import React, { useEffect, useRef, useState, useCallback } from 'react';
import { fabric } from 'fabric';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import * as Tone from 'tone';
import chroma from 'chroma-js';
import { useGesture } from '@use-gesture/react';
import { isMobile } from 'react-device-detect';
import { 
  Play, 
  Pause, 
  Download, 
  Upload, 
  Palette, 
  Type, 
  Square, 
  Circle, 
  Image as ImageIcon,
  Wand2,
  Layers,
  Undo,
  Redo,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Move,
  Trash2,
  Copy,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Volume2,
  Settings,
  Crop,
  FileText,
  Save,
  FolderOpen,
  Blend
} from 'lucide-react';
import { removeBackground } from '@imgly/background-removal';
import Tesseract from 'tesseract.js';
import QRCode from 'qrcode';
import JsBarcode from 'jsbarcode';
import * as d3 from 'd3';

interface AdvancedEditorProps {
  width?: number;
  height?: number;
  backgroundColor?: string;
  onSave?: (dataURL: string) => void;
  templates?: any[];
  enableAI?: boolean;
  enableAudio?: boolean;
  enableCollaboration?: boolean;
}

interface LayerInfo {
  id: string;
  name: string;
  type: string;
  visible: boolean;
  locked: boolean;
  opacity: number;
}

const AdvancedEditor: React.FC<AdvancedEditorProps> = ({
  width = 1200,
  height = 800,
  backgroundColor = '#ffffff',
  onSave,
  templates = [],
  enableAI = true,
  enableAudio = true,
  enableCollaboration = true
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // State management
  const [canvas, setCanvas] = useState<fabric.Canvas | null>(null);
  const [selectedTool, setSelectedTool] = useState<string>('select');
  const [layers, setLayers] = useState<LayerInfo[]>([]);
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [zoom, setZoom] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentColor, setCurrentColor] = useState('#6366f1');
  const [brushSize, setBrushSize] = useState(10);
  const [showLayers, setShowLayers] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Audio context for sound feedback
  const [audioContext, setAudioContext] = useState<Tone.Player | null>(null);

  // Initialize canvas and setup
  useEffect(() => {
    if (!canvasRef.current) return;

    const fabricCanvas = new fabric.Canvas(canvasRef.current, {
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

    // Enable high DPI support
    const dpr = window.devicePixelRatio || 1;
    const rect = canvasRef.current.getBoundingClientRect();
    canvasRef.current.width = rect.width * dpr;
    canvasRef.current.height = rect.height * dpr;
    fabricCanvas.setDimensions({ width: rect.width, height: rect.height });

    fabricCanvasRef.current = fabricCanvas;
    setCanvas(fabricCanvas);

    // Setup event listeners
    setupCanvasEvents(fabricCanvas);

    // Initialize audio if enabled
    if (enableAudio) {
      initializeAudio();
    }

    // Add default welcome objects
    addWelcomeObjects(fabricCanvas);

    // Save initial state
    saveCanvasState(fabricCanvas);

    return () => {
      fabricCanvas.dispose();
      if (audioContext) {
        audioContext.dispose();
      }
    };
  }, [width, height, backgroundColor, enableAudio]);

  // Setup canvas event listeners
  const setupCanvasEvents = (canvas: fabric.Canvas) => {
    canvas.on('object:added', () => updateLayers(canvas));
    canvas.on('object:removed', () => updateLayers(canvas));
    canvas.on('object:modified', () => {
      updateLayers(canvas);
      saveCanvasState(canvas);
      playSound('modify');
    });
    canvas.on('selection:created', () => playSound('select'));
    canvas.on('selection:updated', () => playSound('select'));
    canvas.on('object:moving', () => throttledUpdate(canvas));
    canvas.on('object:scaling', () => throttledUpdate(canvas));
    canvas.on('object:rotating', () => throttledUpdate(canvas));
  };

  // Initialize audio system
  const initializeAudio = async () => {
    try {
      await Tone.start();
      const player = new Tone.Player().toDestination();
      setAudioContext(player);
    } catch (error) {
      console.warn('Audio initialization failed:', error);
    }
  };

  // Play sound feedback
  const playSound = (type: string) => {
    if (!enableAudio || !audioContext) return;
    
    try {
      const synth = new Tone.Synth().toDestination();
      const notes = {
        select: 'C4',
        modify: 'D4',
        add: 'E4',
        delete: 'F4',
        save: 'G4'
      };
      synth.triggerAttackRelease(notes[type as keyof typeof notes] || 'C4', '8n');
    } catch (error) {
      console.warn('Sound playback failed:', error);
    }
  };

  // Throttled update for performance
  const throttledUpdate = useCallback(
    throttle((canvas: fabric.Canvas) => {
      updateLayers(canvas);
    }, 100),
    []
  );

  // Add welcome objects to demonstrate capabilities
  const addWelcomeObjects = (canvas: fabric.Canvas) => {
    // Add a welcome text
    const welcomeText = new fabric.Text('Advanced Template Editor', {
      left: 50,
      top: 50,
      fontFamily: 'Arial',
      fontSize: 32,
      fill: currentColor,
      fontWeight: 'bold',
    });

    // Add a gradient rectangle
    const gradientRect = new fabric.Rect({
      left: 50,
      top: 120,
      width: 200,
      height: 100,
      fill: new fabric.Gradient({
        type: 'linear',
        coords: { x1: 0, y1: 0, x2: 200, y2: 0 },
        colorStops: [
          { offset: 0, color: '#6366f1' },
          { offset: 1, color: '#8b5cf6' },
        ],
      }),
      rx: 10,
      ry: 10,
    });

    // Add a circle with shadow
    const circle = new fabric.Circle({
      left: 300,
      top: 120,
      radius: 50,
      fill: '#f59e0b',
      shadow: new fabric.Shadow({
        color: 'rgba(0,0,0,0.3)',
        blur: 10,
        offsetX: 5,
        offsetY: 5,
      }),
    });

    canvas.add(welcomeText, gradientRect, circle);
  };

  // Update layers panel
  const updateLayers = (canvas: fabric.Canvas) => {
    const objects = canvas.getObjects();
    const layerInfo: LayerInfo[] = objects.map((obj, index) => ({
      id: obj.id || `layer-${index}`,
      name: obj.name || `${obj.type} ${index + 1}`,
      type: obj.type || 'object',
      visible: obj.visible !== false,
      locked: obj.selectable === false,
      opacity: obj.opacity || 1,
    }));
    setLayers(layerInfo);
  };

  // Save canvas state for undo/redo
  const saveCanvasState = (canvas: fabric.Canvas) => {
    const state = JSON.stringify(canvas.toJSON());
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(state);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  // Undo functionality
  const undo = () => {
    if (historyIndex > 0 && canvas) {
      const prevState = history[historyIndex - 1];
      canvas.loadFromJSON(prevState, () => {
        canvas.renderAll();
        setHistoryIndex(historyIndex - 1);
        updateLayers(canvas);
        playSound('modify');
      });
    }
  };

  // Redo functionality
  const redo = () => {
    if (historyIndex < history.length - 1 && canvas) {
      const nextState = history[historyIndex + 1];
      canvas.loadFromJSON(nextState, () => {
        canvas.renderAll();
        setHistoryIndex(historyIndex + 1);
        updateLayers(canvas);
        playSound('modify');
      });
    }
  };

  // Add text object
  const addText = () => {
    if (!canvas) return;
    
    const text = new fabric.IText('Click to edit text', {
      left: 100,
      top: 100,
      fontFamily: 'Arial',
      fontSize: 20,
      fill: currentColor,
    });
    
    canvas.add(text);
    canvas.setActiveObject(text);
    saveCanvasState(canvas);
    playSound('add');
    toast.success('Text added');
  };

  // Add shape
  const addShape = (type: 'rectangle' | 'circle' | 'triangle') => {
    if (!canvas) return;

    let shape: fabric.Object;
    
    switch (type) {
      case 'rectangle':
        shape = new fabric.Rect({
          left: 100,
          top: 100,
          width: 100,
          height: 80,
          fill: currentColor,
          rx: 5,
          ry: 5,
        });
        break;
      case 'circle':
        shape = new fabric.Circle({
          left: 100,
          top: 100,
          radius: 50,
          fill: currentColor,
        });
        break;
      case 'triangle':
        shape = new fabric.Triangle({
          left: 100,
          top: 100,
          width: 100,
          height: 100,
          fill: currentColor,
        });
        break;
      default:
        return;
    }

    canvas.add(shape);
    canvas.setActiveObject(shape);
    saveCanvasState(canvas);
    playSound('add');
    toast.success(`${type} added`);
  };

  // Add image from file
  const addImage = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!canvas || !event.target.files?.[0]) return;

    const file = event.target.files[0];
    const reader = new FileReader();

    reader.onload = (e) => {
      fabric.Image.fromURL(e.target?.result as string, (img) => {
        img.scaleToWidth(200);
        img.set({ left: 100, top: 100 });
        canvas.add(img);
        canvas.setActiveObject(img);
        saveCanvasState(canvas);
        playSound('add');
        toast.success('Image added');
      });
    };

    reader.readAsDataURL(file);
  };

  // AI Background Removal
  const removeImageBackground = async () => {
    if (!canvas || !enableAI) return;

    const activeObject = canvas.getActiveObject();
    if (!activeObject || activeObject.type !== 'image') {
      toast.error('Please select an image first');
      return;
    }

    setIsProcessing(true);
    toast.loading('Removing background...');

    try {
      const imageElement = (activeObject as fabric.Image).getElement() as HTMLImageElement;
      const blob = await removeBackground(imageElement.src);
      const url = URL.createObjectURL(blob);

      fabric.Image.fromURL(url, (newImg) => {
        newImg.set({
          left: activeObject.left,
          top: activeObject.top,
          scaleX: activeObject.scaleX,
          scaleY: activeObject.scaleY,
        });
        
        canvas.remove(activeObject);
        canvas.add(newImg);
        canvas.setActiveObject(newImg);
        saveCanvasState(canvas);
        toast.dismiss();
        toast.success('Background removed!');
        playSound('modify');
      });
    } catch (error) {
      toast.dismiss();
      toast.error('Background removal failed');
      console.error('Background removal error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  // OCR Text Recognition
  const extractTextFromImage = async () => {
    if (!canvas || !enableAI) return;

    const activeObject = canvas.getActiveObject();
    if (!activeObject || activeObject.type !== 'image') {
      toast.error('Please select an image first');
      return;
    }

    setIsProcessing(true);
    toast.loading('Extracting text...');

    try {
      const imageElement = (activeObject as fabric.Image).getElement() as HTMLImageElement;
      const { data: { text } } = await Tesseract.recognize(imageElement.src, 'eng');
      
      if (text.trim()) {
        const textObject = new fabric.Text(text.trim(), {
          left: activeObject.left! + (activeObject.width! * activeObject.scaleX!) + 20,
          top: activeObject.top,
          fontSize: 16,
          fill: currentColor,
        });
        
        canvas.add(textObject);
        canvas.setActiveObject(textObject);
        saveCanvasState(canvas);
        toast.dismiss();
        toast.success('Text extracted!');
        playSound('add');
      } else {
        toast.dismiss();
        toast.error('No text found in image');
      }
    } catch (error) {
      toast.dismiss();
      toast.error('Text extraction failed');
      console.error('OCR error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Generate QR Code
  const generateQRCode = async () => {
    if (!canvas) return;

    const text = prompt('Enter text or URL for QR code:');
    if (!text) return;

    try {
      const qrDataURL = await QRCode.toDataURL(text, {
        width: 200,
        color: {
          dark: currentColor,
          light: '#FFFFFF',
        },
      });

      fabric.Image.fromURL(qrDataURL, (img) => {
        img.set({ left: 100, top: 100 });
        canvas.add(img);
        canvas.setActiveObject(img);
        saveCanvasState(canvas);
        playSound('add');
        toast.success('QR code generated!');
      });
    } catch (error) {
      toast.error('QR code generation failed');
      console.error('QR code error:', error);
    }
  };

  // Generate Barcode
  const generateBarcode = () => {
    if (!canvas) return;

    const text = prompt('Enter text for barcode:');
    if (!text) return;

    try {
      const canvasElement = document.createElement('canvas');
      JsBarcode(canvasElement, text, {
        format: 'CODE128',
        width: 2,
        height: 100,
        displayValue: true,
      });

      fabric.Image.fromURL(canvasElement.toDataURL(), (img) => {
        img.set({ left: 100, top: 100 });
        canvas.add(img);
        canvas.setActiveObject(img);
        saveCanvasState(canvas);
        playSound('add');
        toast.success('Barcode generated!');
      });
    } catch (error) {
      toast.error('Barcode generation failed');
      console.error('Barcode error:', error);
    }
  };

  // Crop Image with preview
  const cropImage = () => {
    if (!canvas) return;

    const activeObject = canvas.getActiveObject();
    if (!activeObject || activeObject.type !== 'image') {
      toast.error('Please select an image first');
      return;
    }

    const img = activeObject as fabric.Image;
    const originalWidth = img.width || 0;
    const originalHeight = img.height || 0;

    // Create crop controls
    const cropRect = new fabric.Rect({
      left: img.left! + 20,
      top: img.top! + 20,
      width: Math.min(200, originalWidth - 40),
      height: Math.min(200, originalHeight - 40),
      fill: 'transparent',
      stroke: '#ff4444',
      strokeWidth: 2,
      strokeDashArray: [5, 5],
      selectable: true,
      hasControls: true,
      hasBorders: true,
      transparentCorners: false,
      cornerColor: '#ff4444',
      cornerSize: 8,
    });

    canvas.add(cropRect);
    canvas.setActiveObject(cropRect);

    // Apply crop when double-clicked
    cropRect.on('mousedblclick', () => {
      const cropX = Math.max(0, cropRect.left! - img.left!);
      const cropY = Math.max(0, cropRect.top! - img.top!);
      const cropWidth = Math.min(cropRect.width!, originalWidth - cropX);
      const cropHeight = Math.min(cropRect.height!, originalHeight - cropY);

      img.set({
        cropX: cropX / img.scaleX!,
        cropY: cropY / img.scaleY!,
        width: cropWidth / img.scaleX!,
        height: cropHeight / img.scaleY!,
      });

      canvas.remove(cropRect);
      canvas.setActiveObject(img);
      canvas.renderAll();
      saveCanvasState(canvas);
      playSound('modify');
      toast.success('Image cropped! Double-click crop area to apply.');
    });

    toast.info('Adjust crop area and double-click to apply crop');
  };

  // Add image with blend modes
  const addImageWithBlend = (event: React.ChangeEvent<HTMLInputElement>, blendMode: string = 'source-over') => {
    if (!canvas || !event.target.files?.[0]) return;

    const file = event.target.files[0];
    const reader = new FileReader();

    reader.onload = (e) => {
      fabric.Image.fromURL(e.target?.result as string, (img) => {
        img.set({
          left: 100,
          top: 100,
          opacity: blendMode !== 'source-over' ? 0.7 : 1,
          selectable: true,
        });
        
        // Apply blend mode
        if (blendMode !== 'source-over') {
          (img as any).globalCompositeOperation = blendMode;
        }
        
        img.scaleToWidth(200);
        canvas.add(img);
        canvas.setActiveObject(img);
        saveCanvasState(canvas);
        playSound('add');
        toast.success(`Image added with ${blendMode} blend mode`);
      });
    };

    reader.readAsDataURL(file);
  };

  // Add advanced textbox with formatting
  const addTextBox = () => {
    if (!canvas) return;
    
    const textbox = new fabric.Textbox('Click to edit this text box', {
      left: 100,
      top: 100,
      width: 200,
      fontSize: 20,
      fill: currentColor,
      fontFamily: 'Arial',
      textAlign: 'left',
      lineHeight: 1.2,
      charSpacing: 0,
      styles: {},
      splitByGrapheme: false,
    });
    
    canvas.add(textbox);
    canvas.setActiveObject(textbox);
    
    // Enter edit mode immediately
    textbox.enterEditing();
    textbox.selectAll();
    
    saveCanvasState(canvas);
    playSound('add');
    toast.success('Text box added - start typing!');
  };

  // Save template as JSON
  const saveTemplate = () => {
    if (!canvas) return;

    try {
      const json = canvas.toJSON(['id', 'name', 'globalCompositeOperation', 'cropX', 'cropY']);
      const templateData = {
        version: '1.0',
        timestamp: new Date().toISOString(),
        canvas: json,
        metadata: {
          width: canvas.width,
          height: canvas.height,
          backgroundColor: canvas.backgroundColor,
          zoom: zoom,
        }
      };

      const dataStr = JSON.stringify(templateData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `template-${Date.now()}.json`;
      link.click();
      
      URL.revokeObjectURL(url);
      playSound('save');
      toast.success('Template saved!');
    } catch (error) {
      toast.error('Failed to save template');
      console.error('Save template error:', error);
    }
  };

  // Load template from JSON
  const loadTemplate = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!canvas || !event.target.files?.[0]) return;

    const file = event.target.files[0];
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const templateData = JSON.parse(e.target?.result as string);
        
        if (templateData.canvas) {
          canvas.loadFromJSON(templateData.canvas, () => {
            canvas.renderAll();
            
            // Restore metadata if available
            if (templateData.metadata) {
              if (templateData.metadata.backgroundColor) {
                canvas.setBackgroundColor(templateData.metadata.backgroundColor, canvas.renderAll.bind(canvas));
              }
              if (templateData.metadata.zoom) {
                setZoom(templateData.metadata.zoom);
                canvas.setZoom(templateData.metadata.zoom);
              }
            }
            
            updateLayers(canvas);
            saveCanvasState(canvas);
            playSound('add');
            toast.success('Template loaded!');
          });
        } else {
          throw new Error('Invalid template format');
        }
      } catch (error) {
        toast.error('Failed to load template');
        console.error('Load template error:', error);
      }
    };

    reader.readAsText(file);
  };

  // Apply blend mode to selected object
  const applyBlendMode = (blendMode: string) => {
    if (!canvas) return;

    const activeObject = canvas.getActiveObject();
    if (activeObject) {
      (activeObject as any).globalCompositeOperation = blendMode;
      canvas.renderAll();
      saveCanvasState(canvas);
      playSound('modify');
      toast.success(`Applied ${blendMode} blend mode`);
    } else {
      toast.error('Please select an object first');
    }
  };

  // Delete selected object
  const deleteSelected = () => {
    if (!canvas) return;

    const activeObjects = canvas.getActiveObjects();
    if (activeObjects.length > 0) {
      activeObjects.forEach(obj => canvas.remove(obj));
      canvas.discardActiveObject();
      saveCanvasState(canvas);
      playSound('delete');
      toast.success('Objects deleted');
    }
  };

  // Copy selected object
  const copySelected = () => {
    if (!canvas) return;

    const activeObject = canvas.getActiveObject();
    if (activeObject) {
      activeObject.clone((cloned: fabric.Object) => {
        cloned.set({
          left: (cloned.left || 0) + 20,
          top: (cloned.top || 0) + 20,
        });
        canvas.add(cloned);
        canvas.setActiveObject(cloned);
        saveCanvasState(canvas);
        playSound('add');
        toast.success('Object copied');
      });
    }
  };

  // Zoom controls
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

  // Export canvas
  const exportCanvas = () => {
    if (!canvas) return;

    const dataURL = canvas.toDataURL({
      format: 'png',
      quality: 1,
      multiplier: 2,
    });

    // Create download link
    const link = document.createElement('a');
    link.download = 'advanced-editor-export.png';
    link.href = dataURL;
    link.click();

    if (onSave) {
      onSave(dataURL);
    }

    playSound('save');
    toast.success('Canvas exported!');
  };

  // Color picker
  const ColorPicker = () => (
    <AnimatePresence>
      {showColorPicker && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="absolute top-12 left-0 z-50 bg-white rounded-lg shadow-xl p-4 border"
        >
          <div className="grid grid-cols-6 gap-2 mb-4">
            {chroma.scale(['#6366f1', '#8b5cf6', '#ec4899', '#ef4444', '#f59e0b', '#10b981'])
              .mode('hsl')
              .colors(24)
              .map((color, index) => (
                <button
                  key={index}
                  className="w-8 h-8 rounded border-2 border-gray-200 hover:border-gray-400 transition-colors"
                  style={{ backgroundColor: color }}
                  onClick={() => {
                    setCurrentColor(color);
                    setShowColorPicker(false);
                  }}
                />
              ))}
          </div>
          <input
            type="color"
            value={currentColor}
            onChange={(e) => setCurrentColor(e.target.value)}
            className="w-full h-10 rounded border"
          />
        </motion.div>
      )}
    </AnimatePresence>
  );

  // Layers panel
  const LayersPanel = () => (
    <AnimatePresence>
      {showLayers && (
        <motion.div
          initial={{ opacity: 0, x: 300 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 300 }}
          className="absolute top-0 right-0 w-80 h-full bg-white shadow-xl border-l z-40 overflow-y-auto"
        >
          <div className="p-4 border-b">
            <h3 className="text-lg font-semibold">Layers</h3>
          </div>
          <div className="p-2">
            {layers.map((layer, index) => (
              <div
                key={layer.id}
                className="flex items-center justify-between p-2 hover:bg-gray-50 rounded"
              >
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const obj = canvas?.getObjects()[layers.length - 1 - index];
                      if (obj) {
                        obj.set('visible', !layer.visible);
                        canvas?.renderAll();
                        updateLayers(canvas!);
                      }
                    }}
                  >
                    {layer.visible ? <Eye size={16} /> : <EyeOff size={16} />}
                  </button>
                  <button
                    onClick={() => {
                      const obj = canvas?.getObjects()[layers.length - 1 - index];
                      if (obj) {
                        obj.set('selectable', layer.locked);
                        updateLayers(canvas!);
                      }
                    }}
                  >
                    {layer.locked ? <Lock size={16} /> : <Unlock size={16} />}
                  </button>
                  <span className="text-sm truncate">{layer.name}</span>
                </div>
                <button
                  onClick={() => {
                    const obj = canvas?.getObjects()[layers.length - 1 - index];
                    if (obj) {
                      canvas?.remove(obj);
                      saveCanvasState(canvas!);
                    }
                  }}
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  // Gesture handling for mobile
  const bind = useGesture(
    {
      onPinch: ({ delta: [d], memo = zoom }) => {
        if (!canvas) return memo;
        const newZoom = Math.max(0.1, Math.min(3, memo + d / 100));
        setZoom(newZoom);
        canvas.setZoom(newZoom);
        canvas.renderAll();
        return newZoom;
      },
    },
    {
      target: containerRef,
      eventOptions: { passive: false },
    }
  );

  return (
    <div className="relative w-full h-screen bg-gray-100 overflow-hidden">
      {/* Top Toolbar */}
      <div className="absolute top-0 left-0 right-0 z-30 bg-white shadow-md border-b">
        <div className="flex items-center justify-between p-4">
          {/* Left Tools */}
          <div className="flex items-center gap-2">
            <button
              onClick={undo}
              disabled={historyIndex <= 0}
              className="p-2 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Undo"
            >
              <Undo size={20} />
            </button>
            <button
              onClick={redo}
              disabled={historyIndex >= history.length - 1}
              className="p-2 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Redo"
            >
              <Redo size={20} />
            </button>
            
            <div className="w-px h-6 bg-gray-300 mx-2" />
            
            <button
              onClick={addText}
              className={`p-2 rounded hover:bg-gray-100 ${selectedTool === 'text' ? 'bg-blue-100' : ''}`}
              title="Add Text"
            >
              <Type size={20} />
            </button>
            
            <button
              onClick={() => addShape('rectangle')}
              className="p-2 rounded hover:bg-gray-100"
              title="Add Rectangle"
            >
              <Square size={20} />
            </button>
            
            <button
              onClick={() => addShape('circle')}
              className="p-2 rounded hover:bg-gray-100"
              title="Add Circle"
            >
              <Circle size={20} />
            </button>
            
            <label className="p-2 rounded hover:bg-gray-100 cursor-pointer" title="Add Image">
              <ImageIcon size={20} />
              <input
                type="file"
                accept="image/*"
                onChange={addImage}
                className="hidden"
              />
            </label>

            <button
              onClick={addTextBox}
              className="p-2 rounded hover:bg-gray-100"
              title="Add Text Box"
            >
              <FileText size={20} />
            </button>

            <button
              onClick={cropImage}
              className="p-2 rounded hover:bg-gray-100"
              title="Crop Image"
            >
              <Crop size={20} />
            </button>

            <div className="w-px h-6 bg-gray-300 mx-2" />

            {/* Color Picker */}
            <div className="relative">
              <button
                onClick={() => setShowColorPicker(!showColorPicker)}
                className="p-2 rounded hover:bg-gray-100 flex items-center gap-2"
                title="Color Picker"
              >
                <Palette size={20} />
                <div
                  className="w-6 h-6 rounded border-2 border-gray-300"
                  style={{ backgroundColor: currentColor }}
                />
              </button>
              <ColorPicker />
            </div>
          </div>

          {/* Center Tools */}
          <div className="flex items-center gap-2">
            {enableAI && (
              <>
                <button
                  onClick={removeImageBackground}
                  disabled={isProcessing}
                  className="px-3 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50"
                  title="Remove Background (AI)"
                >
                  <Wand2 size={16} />
                </button>
                
                <button
                  onClick={extractTextFromImage}
                  disabled={isProcessing}
                  className="px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
                  title="Extract Text (OCR)"
                >
                  OCR
                </button>
              </>
            )}
            
            <button
              onClick={generateQRCode}
              className="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              title="Generate QR Code"
            >
              QR
            </button>
            
            <button
              onClick={generateBarcode}
              className="px-3 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600"
              title="Generate Barcode"
            >
              Barcode
            </button>

            {/* Blend Mode Dropdown */}
            <div className="relative">
              <select
                onChange={(e) => applyBlendMode(e.target.value)}
                className="px-3 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                title="Blend Modes"
                defaultValue=""
              >
                <option value="" disabled>Blend Mode</option>
                <option value="source-over">Normal</option>
                <option value="multiply">Multiply</option>
                <option value="screen">Screen</option>
                <option value="overlay">Overlay</option>
                <option value="darken">Darken</option>
                <option value="lighten">Lighten</option>
                <option value="color-dodge">Color Dodge</option>
                <option value="color-burn">Color Burn</option>
                <option value="hard-light">Hard Light</option>
                <option value="soft-light">Soft Light</option>
                <option value="difference">Difference</option>
                <option value="exclusion">Exclusion</option>
              </select>
            </div>
          </div>

          {/* Right Tools */}
          <div className="flex items-center gap-2">
            <button
              onClick={copySelected}
              className="p-2 rounded hover:bg-gray-100"
              title="Copy"
            >
              <Copy size={20} />
            </button>
            
            <button
              onClick={deleteSelected}
              className="p-2 rounded hover:bg-gray-100 text-red-500"
              title="Delete"
            >
              <Trash2 size={20} />
            </button>

            <div className="w-px h-6 bg-gray-300 mx-2" />

            <button
              onClick={zoomOut}
              className="p-2 rounded hover:bg-gray-100"
              title="Zoom Out"
            >
              <ZoomOut size={20} />
            </button>
            
            <span className="text-sm font-mono min-w-16 text-center">
              {Math.round(zoom * 100)}%
            </span>
            
            <button
              onClick={zoomIn}
              className="p-2 rounded hover:bg-gray-100"
              title="Zoom In"
            >
              <ZoomIn size={20} />
            </button>

            <div className="w-px h-6 bg-gray-300 mx-2" />

            <button
              onClick={() => setShowLayers(!showLayers)}
              className={`p-2 rounded hover:bg-gray-100 ${showLayers ? 'bg-blue-100' : ''}`}
              title="Layers"
            >
              <Layers size={20} />
            </button>

            <button
              onClick={exportCanvas}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
              title="Export"
            >
              <Download size={16} />
            </button>

            <button
              onClick={saveTemplate}
              className="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center gap-2"
              title="Save Template"
            >
              <Save size={16} />
              Save
            </button>

            <label className="px-3 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 cursor-pointer flex items-center gap-2" title="Load Template">
              <FolderOpen size={16} />
              Load
              <input
                type="file"
                accept=".json"
                onChange={loadTemplate}
                className="hidden"
              />
            </label>
          </div>
        </div>
      </div>

      {/* Canvas Container */}
      <div
        ref={containerRef}
        {...(isMobile ? bind() : {})}
        className="absolute inset-0 pt-20 flex items-center justify-center bg-gray-100"
        style={{ touchAction: 'none' }}
      >
        <div className="bg-white shadow-2xl rounded-lg overflow-hidden">
          <canvas
            ref={canvasRef}
            className="block max-w-full max-h-full"
          />
        </div>
      </div>

      {/* Layers Panel */}
      <LayersPanel />

      {/* Processing Overlay */}
      <AnimatePresence>
        {isProcessing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          >
            <div className="bg-white rounded-lg p-6 flex items-center gap-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
              <span className="text-lg">Processing...</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Utility functions
function throttle<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  let previous = 0;
  
  return function executedFunction(...args: Parameters<T>) {
    const now = Date.now();
    
    if (!previous) previous = now;
    
    const remaining = wait - (now - previous);
    
    if (remaining <= 0 || remaining > wait) {
      if (timeout) {
        clearTimeout(timeout);
        timeout = null;
      }
      previous = now;
      func.apply(this, args);
    } else if (!timeout) {
      timeout = setTimeout(() => {
        previous = Date.now();
        timeout = null;
        func.apply(this, args);
      }, remaining);
    }
  };
}

export default AdvancedEditor; 