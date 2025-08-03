import React, { useState } from 'react';
import { 
  Square, Circle, Triangle, Star, Heart, ArrowRight, ArrowUp, ArrowDown, ArrowLeft,
  Hexagon, Pentagon, Diamond, Plus, Minus, X, Check, Info, AlertTriangle, Zap,
  Sun, Moon, Cloud, Umbrella, Music, Camera, Phone, Mail, MapPin, Home
} from 'lucide-react';

export interface ShapeConfig {
  id: string;
  name: string;
  category: 'basic' | 'arrows' | 'symbols' | 'icons';
  icon: React.ReactNode;
  svgPath?: string;
  svgViewBox?: string;
  component?: React.ComponentType<{ size?: number; color?: string; className?: string }>;
}

interface ShapeLibraryProps {
  onShapeSelect: (shape: ShapeConfig, properties: ShapeProperties) => void;
}

export interface ShapeProperties {
  fill: string;
  stroke: string;
  strokeWidth: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  borderRadius?: number;
}

const DEFAULT_PROPERTIES: ShapeProperties = {
  fill: '#3B82F6',
  stroke: '#1E40AF',
  strokeWidth: 2,
  width: 100,
  height: 100,
  rotation: 0,
  opacity: 1,
  borderRadius: 0,
};

const SHAPES: ShapeConfig[] = [
  // Basic Shapes
  {
    id: 'rectangle',
    name: 'Rectangle',
    category: 'basic',
    icon: <Square size={24} />,
    svgPath: 'M0,0 L100,0 L100,100 L0,100 Z',
    svgViewBox: '0 0 100 100',
  },
  {
    id: 'circle',
    name: 'Circle',
    category: 'basic',
    icon: <Circle size={24} />,
    svgPath: 'M50,50 m-45,0 a45,45 0 1,0 90,0 a45,45 0 1,0 -90,0',
    svgViewBox: '0 0 100 100',
  },
  {
    id: 'triangle',
    name: 'Triangle',
    category: 'basic',
    icon: <Triangle size={24} />,
    svgPath: 'M50,10 L90,90 L10,90 Z',
    svgViewBox: '0 0 100 100',
  },
  {
    id: 'star',
    name: 'Star',
    category: 'basic',
    icon: <Star size={24} />,
    svgPath: 'M50,15 L61,35 L85,35 L67,50 L73,74 L50,60 L27,74 L33,50 L15,35 L39,35 Z',
    svgViewBox: '0 0 100 100',
  },
  {
    id: 'heart',
    name: 'Heart',
    category: 'basic',
    icon: <Heart size={24} />,
    svgPath: 'M50,85 C50,85 15,55 15,35 C15,25 25,15 35,15 C42,15 50,20 50,20 C50,20 58,15 65,15 C75,15 85,25 85,35 C85,55 50,85 50,85 Z',
    svgViewBox: '0 0 100 100',
  },
  {
    id: 'hexagon',
    name: 'Hexagon',
    category: 'basic',
    icon: <Hexagon size={24} />,
    svgPath: 'M25,15 L75,15 L90,50 L75,85 L25,85 L10,50 Z',
    svgViewBox: '0 0 100 100',
  },
  {
    id: 'diamond',
    name: 'Diamond',
    category: 'basic',
    icon: <Diamond size={24} />,
    svgPath: 'M50,10 L85,50 L50,90 L15,50 Z',
    svgViewBox: '0 0 100 100',
  },

  // Arrows
  {
    id: 'arrow-right',
    name: 'Arrow Right',
    category: 'arrows',
    icon: <ArrowRight size={24} />,
    svgPath: 'M10,45 L70,45 L70,35 L90,50 L70,65 L70,55 L10,55 Z',
    svgViewBox: '0 0 100 100',
  },
  {
    id: 'arrow-left',
    name: 'Arrow Left',
    category: 'arrows',
    icon: <ArrowLeft size={24} />,
    svgPath: 'M90,45 L30,45 L30,35 L10,50 L30,65 L30,55 L90,55 Z',
    svgViewBox: '0 0 100 100',
  },
  {
    id: 'arrow-up',
    name: 'Arrow Up',
    category: 'arrows',
    icon: <ArrowUp size={24} />,
    svgPath: 'M45,90 L45,30 L35,30 L50,10 L65,30 L55,30 L55,90 Z',
    svgViewBox: '0 0 100 100',
  },
  {
    id: 'arrow-down',
    name: 'Arrow Down',
    category: 'arrows',
    icon: <ArrowDown size={24} />,
    svgPath: 'M45,10 L45,70 L35,70 L50,90 L65,70 L55,70 L55,10 Z',
    svgViewBox: '0 0 100 100',
  },

  // Symbols
  {
    id: 'plus',
    name: 'Plus',
    category: 'symbols',
    icon: <Plus size={24} />,
    svgPath: 'M40,10 L60,10 L60,40 L90,40 L90,60 L60,60 L60,90 L40,90 L40,60 L10,60 L10,40 L40,40 Z',
    svgViewBox: '0 0 100 100',
  },
  {
    id: 'minus',
    name: 'Minus',
    category: 'symbols',
    icon: <Minus size={24} />,
    svgPath: 'M10,40 L90,40 L90,60 L10,60 Z',
    svgViewBox: '0 0 100 100',
  },
  {
    id: 'cross',
    name: 'Cross',
    category: 'symbols',
    icon: <X size={24} />,
    svgPath: 'M25,15 L50,40 L75,15 L85,25 L60,50 L85,75 L75,85 L50,60 L25,85 L15,75 L40,50 L15,25 Z',
    svgViewBox: '0 0 100 100',
  },
  {
    id: 'check',
    name: 'Check',
    category: 'symbols',
    icon: <Check size={24} />,
    svgPath: 'M15,50 L35,70 L85,20 L90,25 L35,80 L10,55 Z',
    svgViewBox: '0 0 100 100',
  },

  // Icons
  {
    id: 'sun',
    name: 'Sun',
    category: 'icons',
    component: Sun,
  },
  {
    id: 'moon',
    name: 'Moon',
    category: 'icons',
    component: Moon,
  },
  {
    id: 'cloud',
    name: 'Cloud',
    category: 'icons',
    component: Cloud,
  },
  {
    id: 'umbrella',
    name: 'Umbrella',
    category: 'icons',
    component: Umbrella,
  },
  {
    id: 'music',
    name: 'Music',
    category: 'icons',
    component: Music,
  },
  {
    id: 'camera',
    name: 'Camera',
    category: 'icons',
    component: Camera,
  },
  {
    id: 'phone',
    name: 'Phone',
    category: 'icons',
    component: Phone,
  },
  {
    id: 'mail',
    name: 'Mail',
    category: 'icons',
    component: Mail,
  },
  {
    id: 'map-pin',
    name: 'Location',
    category: 'icons',
    component: MapPin,
  },
  {
    id: 'home',
    name: 'Home',
    category: 'icons',
    component: Home,
  },
];

const CATEGORIES = [
  { id: 'all', name: 'All Shapes' },
  { id: 'basic', name: 'Basic' },
  { id: 'arrows', name: 'Arrows' },
  { id: 'symbols', name: 'Symbols' },
  { id: 'icons', name: 'Icons' },
];

export function ShapeLibrary({ onShapeSelect }: ShapeLibraryProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [shapeProperties, setShapeProperties] = useState<ShapeProperties>(DEFAULT_PROPERTIES);
  const [selectedShape, setSelectedShape] = useState<ShapeConfig | null>(null);

  const filteredShapes = selectedCategory === 'all' 
    ? SHAPES 
    : SHAPES.filter(shape => shape.category === selectedCategory);

  const handleShapeClick = (shape: ShapeConfig) => {
    setSelectedShape(shape);
  };

  const handleAddShape = () => {
    if (selectedShape) {
      onShapeSelect(selectedShape, shapeProperties);
    }
  };

  const updateProperty = (property: keyof ShapeProperties, value: number | string) => {
    setShapeProperties(prev => ({
      ...prev,
      [property]: value,
    }));
  };

  const renderShapePreview = (shape: ShapeConfig) => {
    if (shape.component) {
      const Component = shape.component;
      return (
        <Component 
          size={32} 
          color={shapeProperties.fill}
          className="transition-colors"
        />
      );
    }

    if (shape.svgPath && shape.svgViewBox) {
      return (
        <svg
          width="32"
          height="32"
          viewBox={shape.svgViewBox}
          className="transition-colors"
        >
          <path
            d={shape.svgPath}
            fill={shapeProperties.fill}
            stroke={shapeProperties.stroke}
            strokeWidth={shapeProperties.strokeWidth}
            opacity={shapeProperties.opacity}
          />
        </svg>
      );
    }

    return shape.icon;
  };

  return (
    <div className="space-y-4">
      {/* Category Tabs */}
      <div className="flex flex-wrap gap-1 bg-gray-700 rounded-lg p-1">
        {CATEGORIES.map((category) => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            className={`px-3 py-2 rounded text-sm font-medium transition ${
              selectedCategory === category.id
                ? 'bg-blue-500 text-white'
                : 'text-gray-300 hover:text-white hover:bg-gray-600'
            }`}
          >
            {category.name}
          </button>
        ))}
      </div>

      {/* Shape Grid */}
      <div className="grid grid-cols-4 gap-2 max-h-64 overflow-y-auto">
        {filteredShapes.map((shape) => (
          <button
            key={shape.id}
            onClick={() => handleShapeClick(shape)}
            className={`p-3 rounded-lg border-2 transition-all hover:bg-gray-700 ${
              selectedShape?.id === shape.id
                ? 'border-blue-500 bg-blue-500/20'
                : 'border-gray-600 bg-gray-800'
            }`}
            title={shape.name}
          >
            <div className="flex flex-col items-center gap-1">
              {renderShapePreview(shape)}
              <span className="text-xs text-gray-300 truncate w-full text-center">
                {shape.name}
              </span>
            </div>
          </button>
        ))}
      </div>

      {/* Shape Properties */}
      {selectedShape && (
        <div className="space-y-4 border-t border-gray-700 pt-4">
          <div className="flex items-center justify-between">
            <h4 className="text-white font-medium">Properties</h4>
            <button
              onClick={handleAddShape}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-sm"
            >
              Add Shape
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Fill Color */}
            <div>
              <label className="block text-sm text-gray-300 mb-1">Fill</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={shapeProperties.fill}
                  onChange={(e) => updateProperty('fill', e.target.value)}
                  className="w-8 h-8 rounded border border-gray-600"
                />
                <input
                  type="text"
                  value={shapeProperties.fill}
                  onChange={(e) => updateProperty('fill', e.target.value)}
                  className="flex-1 bg-gray-700 text-white px-2 py-1 rounded text-xs"
                />
              </div>
            </div>

            {/* Stroke Color */}
            <div>
              <label className="block text-sm text-gray-300 mb-1">Stroke</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={shapeProperties.stroke}
                  onChange={(e) => updateProperty('stroke', e.target.value)}
                  className="w-8 h-8 rounded border border-gray-600"
                />
                <input
                  type="text"
                  value={shapeProperties.stroke}
                  onChange={(e) => updateProperty('stroke', e.target.value)}
                  className="flex-1 bg-gray-700 text-white px-2 py-1 rounded text-xs"
                />
              </div>
            </div>

            {/* Width */}
            <div>
              <label className="block text-sm text-gray-300 mb-1">Width</label>
              <input
                type="range"
                min="20"
                max="400"
                value={shapeProperties.width}
                onChange={(e) => updateProperty('width', Number(e.target.value))}
                className="w-full"
              />
              <div className="text-xs text-gray-400 text-center">{shapeProperties.width}px</div>
            </div>

            {/* Height */}
            <div>
              <label className="block text-sm text-gray-300 mb-1">Height</label>
              <input
                type="range"
                min="20"
                max="400"
                value={shapeProperties.height}
                onChange={(e) => updateProperty('height', Number(e.target.value))}
                className="w-full"
              />
              <div className="text-xs text-gray-400 text-center">{shapeProperties.height}px</div>
            </div>

            {/* Stroke Width */}
            <div>
              <label className="block text-sm text-gray-300 mb-1">Stroke Width</label>
              <input
                type="range"
                min="0"
                max="20"
                value={shapeProperties.strokeWidth}
                onChange={(e) => updateProperty('strokeWidth', Number(e.target.value))}
                className="w-full"
              />
              <div className="text-xs text-gray-400 text-center">{shapeProperties.strokeWidth}px</div>
            </div>

            {/* Opacity */}
            <div>
              <label className="block text-sm text-gray-300 mb-1">Opacity</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={shapeProperties.opacity}
                onChange={(e) => updateProperty('opacity', Number(e.target.value))}
                className="w-full"
              />
              <div className="text-xs text-gray-400 text-center">{Math.round(shapeProperties.opacity * 100)}%</div>
            </div>
          </div>

          {/* Shape Preview */}
          <div className="flex items-center justify-center p-4 bg-gray-800 rounded-lg">
            <div className="bg-white/10 p-4 rounded">
              {selectedShape.component ? (
                <selectedShape.component 
                  size={Math.min(shapeProperties.width, shapeProperties.height) / 2} 
                  color={shapeProperties.fill}
                />
              ) : selectedShape.svgPath && selectedShape.svgViewBox ? (
                <svg
                  width={Math.min(shapeProperties.width / 2, 80)}
                  height={Math.min(shapeProperties.height / 2, 80)}
                  viewBox={selectedShape.svgViewBox}
                >
                  <path
                    d={selectedShape.svgPath}
                    fill={shapeProperties.fill}
                    stroke={shapeProperties.stroke}
                    strokeWidth={shapeProperties.strokeWidth}
                    opacity={shapeProperties.opacity}
                  />
                </svg>
              ) : (
                selectedShape.icon
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}