import React, { useState } from 'react';
import { fabric } from 'fabric';
import { 
  Eye, EyeOff, Lock, Unlock, Trash2, Copy, 
  ChevronUp, ChevronDown, MoreHorizontal, Type,
  Square, Circle, Image, Layers
} from 'lucide-react';
import { useEditorStore, useCanvasObjects } from '../../store/editorStore';

interface LayerItem {
  id: string;
  name: string;
  type: 'text' | 'image' | 'shape' | 'group';
  visible: boolean;
  locked: boolean;
  zIndex: number;
  fabricObject: fabric.Object;
}

const LayersPanel: React.FC = () => {
  const { canvas, selectedObjectIds, selectObjects, removeObject, duplicateObject } = useEditorStore();
  const canvasObjects = useCanvasObjects();
  const [showActions, setShowActions] = useState<string | null>(null);

  // Convert canvas objects to layer items
  const layers: LayerItem[] = canvasObjects
    .map(obj => ({
      id: obj.id,
      name: obj.layer.name,
      type: obj.type,
      visible: obj.properties.visible,
      locked: obj.properties.locked,
      zIndex: obj.properties.zIndex,
      fabricObject: obj.fabricObject,
    }))
    .sort((a, b) => b.zIndex - a.zIndex); // Sort by z-index (top to bottom)

  const getLayerIcon = (type: string) => {
    switch (type) {
      case 'text': return <Type size={16} className="text-blue-500" />;
      case 'image': return <Image size={16} className="text-green-500" />;
      case 'shape': return <Square size={16} className="text-purple-500" />;
      case 'group': return <Layers size={16} className="text-orange-500" />;
      default: return <Circle size={16} className="text-gray-500" />;
    }
  };

  const toggleVisibility = (layerId: string) => {
    if (!canvas) return;
    
    const layer = layers.find(l => l.id === layerId);
    if (layer) {
      const newVisible = !layer.visible;
      layer.fabricObject.set('visible', newVisible);
      canvas.renderAll();
    }
  };

  const toggleLock = (layerId: string) => {
    if (!canvas) return;
    
    const layer = layers.find(l => l.id === layerId);
    if (layer) {
      const newLocked = !layer.locked;
      layer.fabricObject.set('selectable', !newLocked);
      layer.fabricObject.set('evented', !newLocked);
      canvas.renderAll();
    }
  };

  const selectLayer = (layerId: string, multiSelect = false) => {
    if (!canvas) return;
    
    const layer = layers.find(l => l.id === layerId);
    if (!layer) return;

    if (multiSelect) {
      const newSelection = selectedObjectIds.includes(layerId)
        ? selectedObjectIds.filter(id => id !== layerId)
        : [...selectedObjectIds, layerId];
      selectObjects(newSelection);
      
      // Update canvas selection
      const fabricObjects = newSelection
        .map(id => layers.find(l => l.id === id)?.fabricObject)
        .filter(Boolean);
      
      if (fabricObjects.length === 1) {
        canvas.setActiveObject(fabricObjects[0]!);
      } else if (fabricObjects.length > 1) {
        const selection = new fabric.ActiveSelection(fabricObjects, { canvas });
        canvas.setActiveObject(selection);
      } else {
        canvas.discardActiveObject();
      }
    } else {
      selectObjects([layerId]);
      canvas.setActiveObject(layer.fabricObject);
    }
    
    canvas.renderAll();
  };

  const moveLayer = (layerId: string, direction: 'up' | 'down') => {
    if (!canvas) return;
    
    const layer = layers.find(l => l.id === layerId);
    if (!layer) return;

    if (direction === 'up') {
      canvas.bringForward(layer.fabricObject);
    } else {
      canvas.sendBackwards(layer.fabricObject);
    }
    
    canvas.renderAll();
  };

  const moveToTop = (layerId: string) => {
    if (!canvas) return;
    
    const layer = layers.find(l => l.id === layerId);
    if (layer) {
      canvas.bringToFront(layer.fabricObject);
      canvas.renderAll();
    }
  };

  const moveToBottom = (layerId: string) => {
    if (!canvas) return;
    
    const layer = layers.find(l => l.id === layerId);
    if (layer) {
      canvas.sendToBack(layer.fabricObject);
      canvas.renderAll();
    }
  };

  const renameLayer = (layerId: string, newName: string) => {
    // Update layer name in store
    // This would need to be implemented in the store
    console.log('Rename layer:', layerId, newName);
  };

  const handleLayerAction = (action: string, layerId: string) => {
    setShowActions(null);
    
    switch (action) {
      case 'duplicate':
        duplicateObject(layerId);
        break;
      case 'delete':
        removeObject(layerId);
        break;
      case 'moveToTop':
        moveToTop(layerId);
        break;
      case 'moveToBottom':
        moveToBottom(layerId);
        break;
    }
  };

  if (layers.length === 0) {
    return (
      <div className="p-4">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Layers size={20} />
          Layers
        </h3>
        <div className="text-center py-8 text-gray-500">
          <Layers size={48} className="mx-auto mb-4 opacity-30" />
          <p>No layers yet</p>
          <p className="text-sm mt-1">Add text, shapes, or images to see layers</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 h-full flex flex-col">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Layers size={20} />
        Layers
      </h3>
      
      <div className="text-xs text-gray-500 mb-3">
        {layers.length} layer{layers.length !== 1 ? 's' : ''} • {selectedObjectIds.length} selected
      </div>

      <div className="flex-1 overflow-y-auto space-y-1">
        {layers.map((layer, index) => {
          const isSelected = selectedObjectIds.includes(layer.id);
          
          return (
            <div
              key={layer.id}
              className={`group relative border rounded-lg p-3 cursor-pointer transition-all ${
                isSelected 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
              onClick={(e) => selectLayer(layer.id, e.ctrlKey || e.metaKey)}
            >
              {/* Layer Content */}
              <div className="flex items-center gap-3">
                {/* Layer Icon */}
                <div className="flex-shrink-0">
                  {getLayerIcon(layer.type)}
                </div>
                
                {/* Layer Info */}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-800 truncate">
                    {layer.name}
                  </div>
                  <div className="text-xs text-gray-500 capitalize">
                    {layer.type}
                  </div>
                </div>
                
                {/* Layer Controls */}
                <div className="flex items-center gap-1">
                  {/* Move Up/Down */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      moveLayer(layer.id, 'up');
                    }}
                    disabled={index === 0}
                    className="p-1 rounded hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Bring Forward"
                  >
                    <ChevronUp size={14} />
                  </button>
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      moveLayer(layer.id, 'down');
                    }}
                    disabled={index === layers.length - 1}
                    className="p-1 rounded hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Send Backward"
                  >
                    <ChevronDown size={14} />
                  </button>
                  
                  {/* Visibility Toggle */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleVisibility(layer.id);
                    }}
                    className={`p-1 rounded hover:bg-gray-200 ${
                      !layer.visible ? 'text-gray-400' : 'text-gray-600'
                    }`}
                    title={layer.visible ? 'Hide' : 'Show'}
                  >
                    {layer.visible ? <Eye size={14} /> : <EyeOff size={14} />}
                  </button>
                  
                  {/* Lock Toggle */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleLock(layer.id);
                    }}
                    className={`p-1 rounded hover:bg-gray-200 ${
                      layer.locked ? 'text-red-500' : 'text-gray-600'
                    }`}
                    title={layer.locked ? 'Unlock' : 'Lock'}
                  >
                    {layer.locked ? <Lock size={14} /> : <Unlock size={14} />}
                  </button>
                  
                  {/* More Actions */}
                  <div className="relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowActions(showActions === layer.id ? null : layer.id);
                      }}
                      className="p-1 rounded hover:bg-gray-200"
                      title="More Actions"
                    >
                      <MoreHorizontal size={14} />
                    </button>
                    
                    {showActions === layer.id && (
                      <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-36">
                        <button
                          onClick={() => handleLayerAction('duplicate', layer.id)}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 flex items-center gap-2"
                        >
                          <Copy size={14} />
                          Duplicate
                        </button>
                        <button
                          onClick={() => handleLayerAction('moveToTop', layer.id)}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 flex items-center gap-2"
                        >
                          <ChevronUp size={14} />
                          Bring to Front
                        </button>
                        <button
                          onClick={() => handleLayerAction('moveToBottom', layer.id)}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 flex items-center gap-2"
                        >
                          <ChevronDown size={14} />
                          Send to Back
                        </button>
                        <hr className="my-1" />
                        <button
                          onClick={() => handleLayerAction('delete', layer.id)}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-red-50 text-red-600 flex items-center gap-2"
                        >
                          <Trash2 size={14} />
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Selection Indicator */}
              {isSelected && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 rounded-l-lg" />
              )}
            </div>
          );
        })}
      </div>
      
      {/* Layer Actions */}
      {selectedObjectIds.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex gap-2">
            <button
              onClick={() => selectedObjectIds.forEach(id => duplicateObject(id))}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-3 rounded text-sm flex items-center justify-center gap-2"
            >
              <Copy size={14} />
              Duplicate
            </button>
            <button
              onClick={() => selectedObjectIds.forEach(id => removeObject(id))}
              className="flex-1 bg-red-100 hover:bg-red-200 text-red-700 py-2 px-3 rounded text-sm flex items-center justify-center gap-2"
            >
              <Trash2 size={14} />
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LayersPanel; 