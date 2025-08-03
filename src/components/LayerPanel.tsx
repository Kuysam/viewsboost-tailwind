import React from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { 
  Eye, EyeOff, Lock, Unlock, Type, Image, Video, Square, 
  Copy, Trash2, MoreHorizontal 
} from 'lucide-react';

export interface LayerItem {
  id: string;
  type: 'text' | 'image' | 'video' | 'shape' | 'background';
  name: string;
  visible: boolean;
  locked: boolean;
  zIndex: number;
  opacity?: number;
}

interface LayerPanelProps {
  layers: LayerItem[];
  selectedLayerIds: string[];
  onLayersReorder: (newLayers: LayerItem[]) => void;
  onLayerSelect: (id: string, multiSelect: boolean) => void;
  onLayerToggleVisibility: (id: string) => void;
  onLayerToggleLock: (id: string) => void;
  onLayerDuplicate: (id: string) => void;
  onLayerDelete: (id: string) => void;
  onLayerRename: (id: string, newName: string) => void;
}

function SortableLayerItem({ 
  layer, 
  isSelected, 
  onSelect, 
  onToggleVisibility, 
  onToggleLock,
  onDuplicate,
  onDelete,
  onRename
}: {
  layer: LayerItem;
  isSelected: boolean;
  onSelect: (multiSelect: boolean) => void;
  onToggleVisibility: () => void;
  onToggleLock: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onRename: (newName: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: layer.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const getLayerIcon = () => {
    switch (layer.type) {
      case 'text': return <Type size={16} />;
      case 'image': return <Image size={16} />;
      case 'video': return <Video size={16} />;
      case 'shape': return <Square size={16} />;
      case 'background': return <Square size={16} className="text-gray-500" />;
      default: return <Square size={16} />;
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        flex items-center gap-2 p-2 rounded-lg border transition-all
        ${isSelected 
          ? 'bg-blue-500/20 border-blue-500' 
          : 'bg-gray-800/50 border-gray-600/30 hover:bg-gray-700/50'
        }
        ${!layer.visible ? 'opacity-50' : ''}
        ${layer.locked ? 'cursor-not-allowed' : 'cursor-pointer'}
      `}
      onClick={(e) => onSelect(e.ctrlKey || e.metaKey)}
    >
      {/* Drag handle */}
      <div 
        {...attributes} 
        {...listeners}
        className="cursor-grab active:cursor-grabbing p-1 text-gray-400 hover:text-white"
      >
        <MoreHorizontal size={16} />
      </div>

      {/* Layer icon */}
      <div className="text-gray-300">
        {getLayerIcon()}
      </div>

      {/* Layer name */}
      <div className="flex-1 min-w-0">
        <input
          type="text"
          value={layer.name}
          onChange={(e) => onRename(e.target.value)}
          className="w-full bg-transparent text-white text-sm outline-none border-none p-0"
          onFocus={(e) => e.target.select()}
        />
      </div>

      {/* Opacity indicator */}
      {layer.opacity !== undefined && layer.opacity < 1 && (
        <div className="text-xs text-gray-400">
          {Math.round(layer.opacity * 100)}%
        </div>
      )}

      {/* Layer controls */}
      <div className="flex items-center gap-1">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleVisibility();
          }}
          className="p-1 text-gray-400 hover:text-white transition"
          title={layer.visible ? 'Hide layer' : 'Show layer'}
        >
          {layer.visible ? <Eye size={16} /> : <EyeOff size={16} />}
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleLock();
          }}
          className="p-1 text-gray-400 hover:text-white transition"
          title={layer.locked ? 'Unlock layer' : 'Lock layer'}
        >
          {layer.locked ? <Lock size={16} /> : <Unlock size={16} />}
        </button>

        <div className="relative group">
          <button
            className="p-1 text-gray-400 hover:text-white transition"
            title="Layer options"
          >
            <MoreHorizontal size={16} />
          </button>
          
          {/* Dropdown menu */}
          <div className="absolute right-0 top-full mt-1 bg-gray-800 border border-gray-600 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 min-w-[120px]">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDuplicate();
              }}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 rounded-t-lg"
            >
              <Copy size={14} />
              Duplicate
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-400 hover:bg-gray-700 rounded-b-lg"
            >
              <Trash2 size={14} />
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function LayerPanel({
  layers,
  selectedLayerIds,
  onLayersReorder,
  onLayerSelect,
  onLayerToggleVisibility,
  onLayerToggleLock,
  onLayerDuplicate,
  onLayerDelete,
  onLayerRename,
}: LayerPanelProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = layers.findIndex(layer => layer.id === active.id);
      const newIndex = layers.findIndex(layer => layer.id === over?.id);
      
      const newLayers = arrayMove(layers, oldIndex, newIndex);
      // Update z-indices based on new order
      const updatedLayers = newLayers.map((layer, index) => ({
        ...layer,
        zIndex: newLayers.length - index
      }));
      
      onLayersReorder(updatedLayers);
    }
  }

  // Sort layers by z-index (highest first)
  const sortedLayers = [...layers].sort((a, b) => b.zIndex - a.zIndex);

  return (
    <div className="w-full h-full bg-gray-900/50 border border-gray-700/50 rounded-lg">
      <div className="p-3 border-b border-gray-700/50">
        <h3 className="text-white font-medium text-sm">Layers</h3>
      </div>
      
      <div className="p-2 max-h-96 overflow-y-auto">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={sortedLayers.map(layer => layer.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-1">
              {sortedLayers.map((layer) => (
                <SortableLayerItem
                  key={layer.id}
                  layer={layer}
                  isSelected={selectedLayerIds.includes(layer.id)}
                  onSelect={(multiSelect) => onLayerSelect(layer.id, multiSelect)}
                  onToggleVisibility={() => onLayerToggleVisibility(layer.id)}
                  onToggleLock={() => onLayerToggleLock(layer.id)}
                  onDuplicate={() => onLayerDuplicate(layer.id)}
                  onDelete={() => onLayerDelete(layer.id)}
                  onRename={(newName) => onLayerRename(layer.id, newName)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </div>
    </div>
  );
}