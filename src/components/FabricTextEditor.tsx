import React, { useRef, useEffect, useState } from 'react';
import * as fabric from 'fabric';
import { 
  Type, 
  Bold, 
  Italic, 
  Underline, 
  AlignLeft, 
  AlignCenter, 
  AlignRight,
  Palette,
  Plus,
  Minus,
  RotateCw,
  Move,
  Copy,
  Trash2,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  ZoomIn,
  ZoomOut,
  Grid3X3,
  Download
} from 'lucide-react';
import { ChromePicker } from 'react-color';

interface FabricTextEditorProps {
  width?: number;
  height?: number;
  backgroundColor?: string;
  onSave?: (elements: any[]) => void;
  className?: string;
}

const FabricTextEditor: React.FC<FabricTextEditorProps> = ({
  width = 1920,
  height = 1080,
  backgroundColor = '#ffffff',
  onSave,
  className = ''
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null);
  const [zoom, setZoom] = useState(100);
  const [showGrid, setShowGrid] = useState(true);
  const [selectedObject, setSelectedObject] = useState<fabric.Object | null>(null);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [selectedColor, setSelectedColor] = useState('#000000');
  const [properties, setProperties] = useState({
    x: 0,
    y: 0,
    fontSize: 24,
    fontFamily: 'Inter',
    fontWeight: 'normal',
    fontStyle: 'normal',
    textDecoration: 'none',
    textAlign: 'left',
    opacity: 100,
    rotation: 0,
    visible: true,
    locked: false
  });

  const fontFamilies = [
    'Inter',
    'Roboto',
    'Poppins',
    'Montserrat',
    'Arial',
    'Helvetica',
    'Georgia',
    'Times New Roman',
    'Courier New',
    'Verdana',
    'Impact',
    'Comic Sans MS'
  ];

  const fontWeights = [
    { value: '300', label: 'Light' },
    { value: '400', label: 'Normal' },
    { value: '500', label: 'Medium' },
    { value: '600', label: 'Semi Bold' },
    { value: '700', label: 'Bold' },
    { value: '800', label: 'Extra Bold' }
  ];

  // Initialize Fabric.js canvas
  useEffect(() => {
    if (!canvasRef.current || fabricCanvasRef.current) return;

    const fabricCanvas = new fabric.Canvas(canvasRef.current, {
      width: width,
      height: height,
      backgroundColor: backgroundColor,
    });

    fabricCanvasRef.current = fabricCanvas;

    // Handle object selection
    fabricCanvas.on('selection:created', (e) => {
      if (e.selected && e.selected[0]) {
        setSelectedObject(e.selected[0]);
        updatePropertiesFromObject(e.selected[0]);
      }
    });

    fabricCanvas.on('selection:updated', (e) => {
      if (e.selected && e.selected[0]) {
        setSelectedObject(e.selected[0]);
        updatePropertiesFromObject(e.selected[0]);
      }
    });

    fabricCanvas.on('selection:cleared', () => {
      setSelectedObject(null);
    });

    // Handle object modifications
    fabricCanvas.on('object:modified', (e) => {
      if (e.target) {
        updatePropertiesFromObject(e.target);
      }
    });

    // Add grid
    if (showGrid) {
      addGrid(fabricCanvas);
    }

    // Listen for addText event from Studio.tsx
    const handleAddTextEvent = () => {
      addText();
    };

    window.addEventListener('addText', handleAddTextEvent);

    return () => {
      window.removeEventListener('addText', handleAddTextEvent);
      fabricCanvas.dispose();
      fabricCanvasRef.current = null;
    };
  }, [width, height, backgroundColor]);

  // Update grid when showGrid changes
  useEffect(() => {
    const fabricCanvas = fabricCanvasRef.current;
    if (!fabricCanvas) return;

    // Remove existing grid
    const objects = fabricCanvas.getObjects();
    objects.forEach(obj => {
      if ((obj as any).isGrid) {
        fabricCanvas.remove(obj);
      }
    });

    if (showGrid) {
      addGrid(fabricCanvas);
    }

    fabricCanvas.renderAll();
  }, [showGrid]);

  const addGrid = (canvas: fabric.Canvas) => {
    const gridSize = 50;
    const lines = [];

    // Vertical lines
    for (let i = 0; i <= width; i += gridSize) {
      const line = new fabric.Line([i, 0, i, height], {
        stroke: '#e5e7eb',
        strokeWidth: 1,
        selectable: false,
        evented: false,
        isGrid: true
      });
      lines.push(line);
    }

    // Horizontal lines
    for (let i = 0; i <= height; i += gridSize) {
      const line = new fabric.Line([0, i, width, i], {
        stroke: '#e5e7eb',
        strokeWidth: 1,
        selectable: false,
        evented: false,
        isGrid: true
      });
      lines.push(line);
    }

    lines.forEach(line => {
      canvas.add(line);
      canvas.sendObjectToBack(line);
    });
  };

  const updatePropertiesFromObject = (obj: fabric.Object) => {
    const textObj = obj as fabric.IText;
    
    setProperties({
      x: Math.round(obj.left || 0),
      y: Math.round(obj.top || 0),
      fontSize: textObj.fontSize || 24,
      fontFamily: textObj.fontFamily || 'Inter',
      fontWeight: textObj.fontWeight || 'normal',
      fontStyle: textObj.fontStyle || 'normal',
      textDecoration: textObj.underline ? 'underline' : 'none',
      textAlign: textObj.textAlign || 'left',
      opacity: Math.round((obj.opacity || 1) * 100),
      rotation: Math.round(obj.angle || 0),
      visible: obj.visible !== false,
      locked: obj.selectable === false
    });

    if (obj.fill) {
      setSelectedColor(obj.fill as string);
    }
  };

  const updateSelectedObject = (updates: any) => {
    const canvas = fabricCanvasRef.current;
    if (!canvas || !selectedObject) return;

    Object.keys(updates).forEach(key => {
      if (key === 'opacity') {
        selectedObject.set(key, updates[key] / 100);
      } else if (key === 'rotation') {
        selectedObject.set('angle', updates[key]);
      } else if (key === 'x') {
        selectedObject.set('left', updates[key]);
      } else if (key === 'y') {
        selectedObject.set('top', updates[key]);
      } else if (key === 'textDecoration') {
        (selectedObject as fabric.IText).set('underline', updates[key] === 'underline');
      } else {
        selectedObject.set(key, updates[key]);
      }
    });

    selectedObject.setCoords();
    canvas.renderAll();
  };

  // Text editing functions
  const addText = () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    const text = new fabric.IText('Click to edit text', {
      left: 100,
      top: 100,
      fontFamily: 'Inter',
      fontSize: 24,
      fill: '#000000',
      selectable: true,
      editable: true
    });

    canvas.add(text);
    canvas.setActiveObject(text);
    canvas.renderAll();
    
    // Start editing immediately
    text.enterEditing();
    text.selectAll();
  };

  const handlePropertyChange = (property: string, value: any) => {
    setProperties(prev => ({ ...prev, [property]: value }));
    updateSelectedObject({ [property]: value });
  };

  const handleColorChange = (color: any) => {
    setSelectedColor(color.hex);
    updateSelectedObject({ fill: color.hex });
  };

  const duplicateObject = () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas || !selectedObject) return;

    selectedObject.clone().then((cloned: fabric.Object) => {
      cloned.set({
        left: (cloned.left || 0) + 10,
        top: (cloned.top || 0) + 10,
      });
      canvas.add(cloned);
      canvas.setActiveObject(cloned);
      canvas.renderAll();
    });
  };

  const deleteObject = () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas || !selectedObject) return;

    canvas.remove(selectedObject);
    canvas.renderAll();
    setSelectedObject(null);
  };

  const toggleBold = () => {
    const newWeight = properties.fontWeight === 'bold' ? 'normal' : 'bold';
    handlePropertyChange('fontWeight', newWeight);
  };

  const toggleItalic = () => {
    const newStyle = properties.fontStyle === 'italic' ? 'normal' : 'italic';
    handlePropertyChange('fontStyle', newStyle);
  };

  const toggleUnderline = () => {
    const newDecoration = properties.textDecoration === 'underline' ? 'none' : 'underline';
    handlePropertyChange('textDecoration', newDecoration);
  };

  const setTextAlign = (align: string) => {
    handlePropertyChange('textAlign', align);
  };

  const handleZoom = (delta: number) => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    const newZoom = Math.max(25, Math.min(400, zoom + delta));
    setZoom(newZoom);
    canvas.setZoom(newZoom / 100);
    canvas.renderAll();
  };

  const handleExport = () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    const dataURL = canvas.toDataURL({
      format: 'png',
      quality: 1,
    });

    const link = document.createElement('a');
    link.download = 'text-design.png';
    link.href = dataURL;
    link.click();
  };

  const handleSave = () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas || !onSave) return;

    const objects = canvas.getObjects().filter(obj => !(obj as any).isGrid);
    onSave(objects);
  };

  const isTextObject = selectedObject instanceof fabric.IText;

  return (
    <div className={`flex h-full bg-gray-100 ${className}`}>
      {/* Left Toolbar */}
      <div className="w-16 bg-gray-800 flex flex-col items-center py-4 space-y-4">
        <button
          onClick={addText}
          className="p-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          title="Add Text"
        >
          <Type className="w-5 h-5 text-white" />
        </button>
        
        <button
          onClick={() => setShowGrid(!showGrid)}
          className={`p-3 rounded-lg transition-colors ${
            showGrid ? 'bg-gray-600' : 'bg-gray-700 hover:bg-gray-600'
          }`}
          title="Toggle Grid"
        >
          <Grid3X3 className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* Main Canvas Area */}
      <div className="flex-1 flex flex-col">
        {/* Top Controls */}
        <div className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleZoom(-25)}
              className="p-2 hover:bg-gray-100 rounded"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-sm font-medium min-w-12 text-center">{zoom}%</span>
            <button
              onClick={() => handleZoom(25)}
              className="p-2 hover:bg-gray-100 rounded"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Save
            </button>
            <button
              onClick={handleExport}
              className="p-2 hover:bg-gray-100 rounded"
              title="Export"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Text Formatting Bar */}
        {isTextObject && (
          <div className="h-12 bg-gray-50 border-b border-gray-200 flex items-center px-4 space-x-4">
            <select
              value={properties.fontFamily}
              onChange={(e) => handlePropertyChange('fontFamily', e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {fontFamilies.map(font => (
                <option key={font} value={font}>{font}</option>
              ))}
            </select>

            <div className="flex items-center space-x-1">
              <button
                onClick={() => handlePropertyChange('fontSize', Math.max(8, properties.fontSize - 2))}
                className="p-1 hover:bg-gray-200 rounded"
              >
                <Minus className="w-3 h-3" />
              </button>
              <input
                type="number"
                value={properties.fontSize}
                onChange={(e) => handlePropertyChange('fontSize', parseInt(e.target.value) || 12)}
                className="w-12 px-2 py-1 border border-gray-300 rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="8"
                max="200"
              />
              <button
                onClick={() => handlePropertyChange('fontSize', Math.min(200, properties.fontSize + 2))}
                className="p-1 hover:bg-gray-200 rounded"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>

            <div className="flex items-center space-x-1">
              <button
                onClick={toggleBold}
                className={`p-2 rounded ${properties.fontWeight === 'bold' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-200'}`}
              >
                <Bold className="w-4 h-4" />
              </button>
              <button
                onClick={toggleItalic}
                className={`p-2 rounded ${properties.fontStyle === 'italic' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-200'}`}
              >
                <Italic className="w-4 h-4" />
              </button>
              <button
                onClick={toggleUnderline}
                className={`p-2 rounded ${properties.textDecoration === 'underline' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-200'}`}
              >
                <Underline className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center space-x-1">
              <button
                onClick={() => setTextAlign('left')}
                className={`p-2 rounded ${properties.textAlign === 'left' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-200'}`}
              >
                <AlignLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setTextAlign('center')}
                className={`p-2 rounded ${properties.textAlign === 'center' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-200'}`}
              >
                <AlignCenter className="w-4 h-4" />
              </button>
              <button
                onClick={() => setTextAlign('right')}
                className={`p-2 rounded ${properties.textAlign === 'right' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-200'}`}
              >
                <AlignRight className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowColorPicker(!showColorPicker)}
                className="flex items-center space-x-2 p-2 hover:bg-gray-200 rounded"
              >
                <Palette className="w-4 h-4" />
                <div
                  className="w-4 h-4 rounded border border-gray-300"
                  style={{ backgroundColor: selectedColor }}
                />
              </button>
              {showColorPicker && (
                <div className="absolute z-50 mt-2">
                  <div
                    className="fixed inset-0"
                    onClick={() => setShowColorPicker(false)}
                  />
                  <ChromePicker
                    color={selectedColor}
                    onChange={handleColorChange}
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Canvas Container */}
        <div className="flex-1 flex items-center justify-center p-8 bg-gray-100">
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <canvas
              ref={canvasRef}
              className="max-w-full max-h-full"
              style={{ 
                width: `${width * (zoom / 100)}px`, 
                height: `${height * (zoom / 100)}px` 
              }}
            />
          </div>
        </div>
      </div>

      {/* Right Properties Panel */}
      {selectedObject && (
        <div className="w-80 bg-white border-l border-gray-200 p-4 space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-4">Properties</h3>
            
            {/* Object Controls */}
            <div className="flex items-center space-x-2 mb-4">
              <button
                onClick={duplicateObject}
                className="p-2 hover:bg-gray-100 rounded"
                title="Duplicate"
              >
                <Copy className="w-4 h-4" />
              </button>
              <button
                onClick={deleteObject}
                className="p-2 hover:bg-gray-100 rounded text-red-600"
                title="Delete"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            {/* Transform */}
            <div className="space-y-3">
              <h4 className="font-medium">Transform</h4>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">X</label>
                  <input
                    type="number"
                    value={properties.x}
                    onChange={(e) => handlePropertyChange('x', parseInt(e.target.value) || 0)}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Y</label>
                  <input
                    type="number"
                    value={properties.y}
                    onChange={(e) => handlePropertyChange('y', parseInt(e.target.value) || 0)}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Rotation: {properties.rotation}°
                </label>
                <input
                  type="range"
                  min="-180"
                  max="180"
                  value={properties.rotation}
                  onChange={(e) => handlePropertyChange('rotation', parseInt(e.target.value))}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Opacity: {properties.opacity}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={properties.opacity}
                  onChange={(e) => handlePropertyChange('opacity', parseInt(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>

            {/* Text Properties */}
            {isTextObject && (
              <div className="space-y-3 pt-4 border-t">
                <h4 className="font-medium">Text Style</h4>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Font Weight</label>
                  <select
                    value={properties.fontWeight}
                    onChange={(e) => handlePropertyChange('fontWeight', e.target.value)}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {fontWeights.map(weight => (
                      <option key={weight.value} value={weight.value}>{weight.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default FabricTextEditor;