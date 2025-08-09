import React, { useState } from 'react';
import { fabric } from 'fabric';
import { 
  Square, Circle, Triangle, Star, Heart, Hexagon, 
  Diamond, Plus, Palette, Trash2, Minus
} from 'lucide-react';
import { useEditorStore } from '../../store/editorStore';

interface ShapesPanelProps {
  onAddShape?: (type: string) => void;
  onDelete?: () => void;
  selectedObject?: fabric.Object | null;
}

interface ShapePreset {
  id: string;
  name: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  createShape: (options: any) => fabric.Object;
}

const shapePresets: ShapePreset[] = [
  {
    id: 'rectangle',
    name: 'Rectangle',
    icon: Square,
    createShape: (options) => new fabric.Rect({
      width: 100,
      height: 60,
      ...options,
    }),
  },
  {
    id: 'square',
    name: 'Square',
    icon: Square,
    createShape: (options) => new fabric.Rect({
      width: 80,
      height: 80,
      ...options,
    }),
  },
  {
    id: 'circle',
    name: 'Circle',
    icon: Circle,
    createShape: (options) => new fabric.Circle({
      radius: 40,
      ...options,
    }),
  },
  {
    id: 'triangle',
    name: 'Triangle',
    icon: Triangle,
    createShape: (options) => new fabric.Triangle({
      width: 80,
      height: 80,
      ...options,
    }),
  },
  {
    id: 'line',
    name: 'Line',
    icon: ({ size = 24, className = '' }) => (
      <div className={`flex items-center justify-center ${className}`}>
        <div 
          style={{ 
            width: size * 0.8, 
            height: 2, 
            backgroundColor: 'currentColor',
            borderRadius: 1 
          }} 
        />
      </div>
    ),
    createShape: (options) => new fabric.Line([0, 0, 100, 0], {
      strokeWidth: 2,
      stroke: options.fill || '#000000',
      fill: '',
      ...options,
    }),
  },
];

// Additional complex shapes using paths
const complexShapes = [
  {
    id: 'star',
    name: 'Star',
    icon: Star,
    path: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
  },
  {
    id: 'heart',
    name: 'Heart',
    icon: Heart,
    path: 'M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z',
  },
  {
    id: 'hexagon',
    name: 'Hexagon',
    icon: Hexagon,
    path: 'M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z',
  },
  {
    id: 'diamond',
    name: 'Diamond',
    icon: Diamond,
    path: 'M6 3h12l4 6-10 13L2 9l4-6z',
  },
];

const ShapesPanel: React.FC<ShapesPanelProps> = ({ onAddShape, onDelete, selectedObject }) => {
  const { canvas } = useEditorStore();
  const [activeColor, setActiveColor] = useState('#3b82f6');
  const [strokeColor, setStrokeColor] = useState('#000000');
  const [strokeWidth, setStrokeWidth] = useState(0);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const addShape = (preset: ShapePreset) => {
    if (!canvas) return;

    const shapeOptions = {
      left: 100,
      top: 100,
      fill: activeColor,
      stroke: strokeWidth > 0 ? strokeColor : '',
      strokeWidth: strokeWidth,
    };

    const shape = preset.createShape(shapeOptions);
    const id = `${preset.id}-${Date.now()}`;
    (shape as any).id = id;

    canvas.add(shape);
    canvas.setActiveObject(shape);
    canvas.renderAll();
  };

  const addComplexShape = (shapeConfig: typeof complexShapes[0]) => {
    if (!canvas) return;

    const path = new fabric.Path(shapeConfig.path, {
      left: 100,
      top: 100,
      fill: activeColor,
      stroke: strokeWidth > 0 ? strokeColor : '',
      strokeWidth: strokeWidth,
      scaleX: 2,
      scaleY: 2,
    });

    const id = `${shapeConfig.id}-${Date.now()}`;
    (path as any).id = id;

    canvas.add(path);
    canvas.setActiveObject(path);
    canvas.renderAll();
  };

  const addCustomPolygon = (sides: number) => {
    if (!canvas) return;

    const radius = 40;
    const points = [];
    
    for (let i = 0; i < sides; i++) {
      const angle = (i * 2 * Math.PI) / sides;
      const x = radius * Math.cos(angle);
      const y = radius * Math.sin(angle);
      points.push({ x, y });
    }

    const polygon = new fabric.Polygon(points, {
      left: 100,
      top: 100,
      fill: activeColor,
      stroke: strokeWidth > 0 ? strokeColor : '',
      strokeWidth: strokeWidth,
    });

    const id = `polygon-${sides}-${Date.now()}`;
    (polygon as any).id = id;

    canvas.add(polygon);
    canvas.setActiveObject(polygon);
    canvas.renderAll();
  };

  const canvasSelectedObject = canvas?.getActiveObject();
  const isShapeSelected = canvasSelectedObject && 
    !(canvasSelectedObject instanceof fabric.IText) && 
    !(canvasSelectedObject instanceof fabric.Image);

  const updateSelectedShape = (property: string, value: any) => {
    if (!canvas || !canvasSelectedObject) return;

    (canvasSelectedObject as any)[property] = value;
    canvasSelectedObject.dirty = true;
    canvas.renderAll();
  };

  return (
    <div className="p-4 space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4 text-gray-800">Shapes</h3>
        
        {/* Quick Shape Buttons (from CanvasEditor) */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-600 mb-3">Quick Add</h4>
          <div className="space-y-2">
            <button 
              onClick={() => onAddShape ? onAddShape('rect') : addShape(shapePresets[0])}
              className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition flex items-center justify-center gap-2"
            >
              <Square size={16} />
              Add Rectangle
            </button>
            <button 
              onClick={() => onAddShape ? onAddShape('circle') : addShape(shapePresets[2])}
              className="w-full bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600 transition flex items-center justify-center gap-2"
            >
              <Circle size={16} />
              Add Circle
            </button>
            <button 
              onClick={() => onAddShape ? onAddShape('line') : null}
              className="w-full bg-purple-500 text-white py-2 px-4 rounded-lg hover:bg-purple-600 transition flex items-center justify-center gap-2"
            >
              <Minus size={16} />
              Add Line
            </button>
            {onDelete && selectedObject && (
              <button
                onClick={onDelete}
                className="w-full bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-red-600 transition flex items-center justify-center gap-2"
              >
                <Trash2 size={16} />
                Delete Selected
              </button>
            )}
          </div>
        </div>

        {/* Basic Shapes */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-600 mb-3">Shape Presets</h4>
          <div className="grid grid-cols-3 gap-2">
            {shapePresets.map((preset) => (
              <button
                key={preset.id}
                onClick={() => addShape(preset)}
                className="aspect-square bg-gray-50 hover:bg-gray-100 rounded-lg flex flex-col items-center justify-center p-2 transition-colors border"
                title={preset.name}
              >
                <preset.icon size={24} className="mb-1 text-gray-600" />
                <span className="text-xs text-gray-500">{preset.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Complex Shapes */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-600 mb-3">Icons & Symbols</h4>
          <div className="grid grid-cols-3 gap-2">
            {complexShapes.map((shape) => (
              <button
                key={shape.id}
                onClick={() => addComplexShape(shape)}
                className="aspect-square bg-gray-50 hover:bg-gray-100 rounded-lg flex flex-col items-center justify-center p-2 transition-colors border"
                title={shape.name}
              >
                <shape.icon size={24} className="mb-1 text-gray-600" />
                <span className="text-xs text-gray-500">{shape.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Polygons */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-600 mb-3">Polygons</h4>
          <div className="grid grid-cols-3 gap-2">
            {[3, 5, 6, 7, 8, 10].map((sides) => (
              <button
                key={sides}
                onClick={() => addCustomPolygon(sides)}
                className="aspect-square bg-gray-50 hover:bg-gray-100 rounded-lg flex flex-col items-center justify-center p-2 transition-colors border"
                title={`${sides}-sided polygon`}
              >
                <div className="w-6 h-6 mb-1 flex items-center justify-center">
                  <div className="text-sm font-mono text-gray-600">{sides}</div>
                </div>
                <span className="text-xs text-gray-500">{sides}-gon</span>
              </button>
            ))}
          </div>
        </div>

        {/* Style Controls */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-gray-600">Style</h4>
          
          {/* Fill Color */}
          <div>
            <label className="block text-xs text-gray-500 mb-1">Fill Color</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={activeColor}
                onChange={(e) => {
                  setActiveColor(e.target.value);
                  if (isShapeSelected) {
                    updateSelectedShape('fill', e.target.value);
                  }
                }}
                className="w-8 h-8 rounded border cursor-pointer"
              />
              <input
                type="text"
                value={activeColor}
                onChange={(e) => {
                  setActiveColor(e.target.value);
                  if (isShapeSelected) {
                    updateSelectedShape('fill', e.target.value);
                  }
                }}
                className="flex-1 p-1 text-xs border border-gray-300 rounded"
                placeholder="#3b82f6"
              />
            </div>
          </div>

          {/* Stroke */}
          <div>
            <label className="block text-xs text-gray-500 mb-1">Stroke Width</label>
            <input
              type="range"
              min="0"
              max="10"
              value={strokeWidth}
              onChange={(e) => {
                const width = parseInt(e.target.value);
                setStrokeWidth(width);
                if (isShapeSelected) {
                  updateSelectedShape('strokeWidth', width);
                  if (width > 0) {
                    updateSelectedShape('stroke', strokeColor);
                  }
                }
              }}
              className="w-full"
            />
            <div className="text-xs text-gray-500 mt-1">{strokeWidth}px</div>
          </div>

          {strokeWidth > 0 && (
            <div>
              <label className="block text-xs text-gray-500 mb-1">Stroke Color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={strokeColor}
                  onChange={(e) => {
                    setStrokeColor(e.target.value);
                    if (isShapeSelected && strokeWidth > 0) {
                      updateSelectedShape('stroke', e.target.value);
                    }
                  }}
                  className="w-8 h-8 rounded border cursor-pointer"
                />
                <input
                  type="text"
                  value={strokeColor}
                  onChange={(e) => {
                    setStrokeColor(e.target.value);
                    if (isShapeSelected && strokeWidth > 0) {
                      updateSelectedShape('stroke', e.target.value);
                    }
                  }}
                  className="flex-1 p-1 text-xs border border-gray-300 rounded"
                  placeholder="#000000"
                />
              </div>
            </div>
          )}

          {/* Opacity for selected shapes */}
          {isShapeSelected && (
            <div>
              <label className="block text-xs text-gray-500 mb-1">Opacity</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={canvasSelectedObject?.opacity || 1}
                onChange={(e) => updateSelectedShape('opacity', parseFloat(e.target.value))}
                className="w-full"
              />
              <div className="text-xs text-gray-500 mt-1">
                {Math.round((canvasSelectedObject?.opacity || 1) * 100)}%
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShapesPanel; 