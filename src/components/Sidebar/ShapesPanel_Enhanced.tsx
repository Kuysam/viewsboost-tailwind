import React from 'react';
import { fabric } from 'fabric';
import { Square, Circle, Triangle, Minus, Star, Heart, Hexagon } from 'lucide-react';
import { useEditorStore } from '../../store/editorStore';

const ShapesPanel: React.FC = () => {
  const { canvas } = useEditorStore();

  const shapes = [
    { 
      name: 'Rectangle', 
      icon: <Square size={20} />, 
      color: 'from-blue-400 to-blue-600',
      create: () => new fabric.Rect({
        left: 100,
        top: 100,
        width: 100,
        height: 80,
        fill: '#3b82f6',
        rx: 8,
        ry: 8
      })
    },
    { 
      name: 'Circle', 
      icon: <Circle size={20} />, 
      color: 'from-green-400 to-green-600',
      create: () => new fabric.Circle({
        left: 100,
        top: 100,
        radius: 50,
        fill: '#10b981'
      })
    },
    { 
      name: 'Triangle', 
      icon: <Triangle size={20} />, 
      color: 'from-yellow-400 to-yellow-600',
      create: () => new fabric.Triangle({
        left: 100,
        top: 100,
        width: 80,
        height: 80,
        fill: '#f59e0b'
      })
    },
    { 
      name: 'Line', 
      icon: <Minus size={20} />, 
      color: 'from-purple-400 to-purple-600',
      create: () => new fabric.Line([50, 50, 150, 50], {
        stroke: '#8b5cf6',
        strokeWidth: 4,
        left: 100,
        top: 100
      })
    },
    { 
      name: 'Star', 
      icon: <Star size={20} />, 
      color: 'from-pink-400 to-pink-600',
      create: () => {
        const points = [];
        const outerRadius = 40;
        const innerRadius = 20;
        const numPoints = 5;
        
        for (let i = 0; i < numPoints * 2; i++) {
          const radius = i % 2 === 0 ? outerRadius : innerRadius;
          const angle = (i * Math.PI) / numPoints;
          points.push({
            x: Math.cos(angle) * radius,
            y: Math.sin(angle) * radius
          });
        }
        
        return new fabric.Polygon(points, {
          left: 100,
          top: 100,
          fill: '#ec4899'
        });
      }
    },
    { 
      name: 'Heart', 
      icon: <Heart size={20} />, 
      color: 'from-red-400 to-red-600',
      create: () => {
        const heartPath = "M12,21.35l-1.45-1.32C5.4,15.36,2,12.28,2,8.5 C2,5.42,4.42,3,7.5,3c1.74,0,3.41,0.81,4.5,2.09C13.09,3.81,14.76,3,16.5,3 C19.58,3,22,5.42,22,8.5c0,3.78-3.4,6.86-8.55,11.54L12,21.35z";
        
        return new fabric.Path(heartPath, {
          left: 100,
          top: 100,
          fill: '#ef4444',
          scaleX: 2,
          scaleY: 2
        });
      }
    },
    { 
      name: 'Hexagon', 
      icon: <Hexagon size={20} />, 
      color: 'from-indigo-400 to-indigo-600',
      create: () => {
        const points = [];
        const radius = 40;
        
        for (let i = 0; i < 6; i++) {
          const angle = (i * Math.PI) / 3;
          points.push({
            x: Math.cos(angle) * radius,
            y: Math.sin(angle) * radius
          });
        }
        
        return new fabric.Polygon(points, {
          left: 100,
          top: 100,
          fill: '#6366f1'
        });
      }
    },
    { 
      name: 'Arrow', 
      icon: '→', 
      color: 'from-cyan-400 to-cyan-600',
      create: () => {
        const arrowPath = "M2,12 L22,12 M15,5 L22,12 L15,19";
        
        return new fabric.Path(arrowPath, {
          left: 100,
          top: 100,
          stroke: '#06b6d4',
          strokeWidth: 3,
          fill: '',
          scaleX: 2,
          scaleY: 2
        });
      }
    }
  ];

  const addShape = (shapeCreator: () => fabric.Object) => {
    if (!canvas) return;

    const shape = shapeCreator();
    
    // Add unique ID for tracking
    (shape as any).id = `shape-${Date.now()}`;
    
    canvas.add(shape);
    canvas.setActiveObject(shape);
    canvas.renderAll();
  };

  const activeObject = canvas?.getActiveObject();
  const isShapeSelected = activeObject && activeObject.type !== 'i-text';

  const updateShapeProperty = (property: string, value: any) => {
    if (!canvas || !activeObject) return;
    
    (activeObject as any).set(property, value);
    canvas.renderAll();
  };

  return (
    <div className="space-y-6">
      {/* Basic Shapes */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-3">Basic Shapes</h3>
        <div className="grid grid-cols-2 gap-3">
          {shapes.map((shape) => (
            <button
              key={shape.name}
              onClick={() => addShape(shape.create)}
              className="group aspect-square bg-white border border-gray-200 rounded-xl hover:border-blue-300 hover:shadow-lg transition-all duration-300 cursor-pointer flex flex-col items-center justify-center gap-2 p-3"
            >
              <div className={`w-10 h-10 bg-gradient-to-r ${shape.color} rounded-lg flex items-center justify-center text-white group-hover:scale-110 transition-transform duration-200`}>
                {typeof shape.icon === 'string' ? (
                  <span className="text-lg font-bold">{shape.icon}</span>
                ) : (
                  shape.icon
                )}
              </div>
              <div className="text-center">
                <div className="text-xs font-medium text-gray-800">{shape.name}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Shape Properties */}
      {isShapeSelected && (
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3">Shape Properties</h3>
          <div className="space-y-4">
            {/* Fill Color */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Fill Color</label>
              <input
                type="color"
                value={(activeObject as any).fill || '#000000'}
                onChange={(e) => updateShapeProperty('fill', e.target.value)}
                className="w-full h-8 border border-gray-300 rounded cursor-pointer"
              />
            </div>

            {/* Stroke */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Stroke Color</label>
              <input
                type="color"
                value={(activeObject as any).stroke || '#000000'}
                onChange={(e) => updateShapeProperty('stroke', e.target.value)}
                className="w-full h-8 border border-gray-300 rounded cursor-pointer"
              />
            </div>

            {/* Stroke Width */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Stroke Width</label>
              <input
                type="range"
                min="0"
                max="20"
                value={(activeObject as any).strokeWidth || 0}
                onChange={(e) => updateShapeProperty('strokeWidth', parseInt(e.target.value))}
                className="w-full"
              />
              <div className="text-xs text-gray-500 mt-1">{(activeObject as any).strokeWidth || 0}px</div>
            </div>

            {/* Opacity */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Opacity</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={(activeObject as any).opacity || 1}
                onChange={(e) => updateShapeProperty('opacity', parseFloat(e.target.value))}
                className="w-full"
              />
              <div className="text-xs text-gray-500 mt-1">{Math.round(((activeObject as any).opacity || 1) * 100)}%</div>
            </div>

            {/* Border Radius (for rectangles) */}
            {activeObject.type === 'rect' && (
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Border Radius</label>
                <input
                  type="range"
                  min="0"
                  max="50"
                  value={(activeObject as any).rx || 0}
                  onChange={(e) => {
                    const radius = parseInt(e.target.value);
                    updateShapeProperty('rx', radius);
                    updateShapeProperty('ry', radius);
                  }}
                  className="w-full"
                />
                <div className="text-xs text-gray-500 mt-1">{(activeObject as any).rx || 0}px</div>
              </div>
            )}

            {/* Delete Button */}
            <button
              onClick={() => {
                if (canvas && activeObject) {
                  canvas.remove(activeObject);
                  canvas.renderAll();
                }
              }}
              className="w-full px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors text-sm font-medium"
            >
              Delete Shape
            </button>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-3">Quick Actions</h3>
        <div className="space-y-2">
          <button
            onClick={() => {
              if (!canvas) return;
              const rect = new fabric.Rect({
                left: 50,
                top: 50,
                width: canvas.width! - 100,
                height: 4,
                fill: '#e5e7eb'
              });
              (rect as any).id = `divider-${Date.now()}`;
              canvas.add(rect);
              canvas.renderAll();
            }}
            className="w-full px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors text-sm"
          >
            Add Divider Line
          </button>
          
          <button
            onClick={() => {
              if (!canvas) return;
              const rect = new fabric.Rect({
                left: 50,
                top: 50,
                width: 200,
                height: 40,
                fill: '#3b82f6',
                rx: 20,
                ry: 20
              });
              (rect as any).id = `button-${Date.now()}`;
              canvas.add(rect);
              canvas.renderAll();
            }}
            className="w-full px-3 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors text-sm"
          >
            Add Button Shape
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShapesPanel;