import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Layers, Eye, EyeOff, Lock, Unlock, Copy, Trash2,
  ChevronUp, ChevronDown, RotateCw, FlipHorizontal,
  Crop, Filter, Sliders, PaintBucket, Wand2,
  Type, Bold, Italic, AlignLeft, AlignCenter, AlignRight
} from 'lucide-react';
import { toast } from 'react-hot-toast';

// Enhanced layer management component
interface LayerItem {
  id: string;
  name: string;
  type: string;
  visible: boolean;
  locked: boolean;
  opacity: number;
  thumbnail?: string;
}

interface LayersPanelProps {
  layers: LayerItem[];
  selectedLayerId: string | null;
  onSelectLayer: (id: string) => void;
  onToggleVisibility: (id: string) => void;
  onToggleLock: (id: string) => void;
  onDeleteLayer: (id: string) => void;
  onDuplicateLayer: (id: string) => void;
  onReorderLayer: (id: string, direction: 'up' | 'down') => void;
}

export const ProfessionalLayersPanel: React.FC<LayersPanelProps> = ({
  layers,
  selectedLayerId,
  onSelectLayer,
  onToggleVisibility,
  onToggleLock,
  onDeleteLayer,
  onDuplicateLayer,
  onReorderLayer
}) => {
  return (
    <div className="w-80 bg-gray-800 border-l border-gray-700 overflow-y-auto">
      <div className="p-4">
        <h3 className="text-lg font-semibold mb-4 text-white">Layers</h3>
        
        <div className="space-y-1">
          {layers.slice().reverse().map(layer => (
            <motion.div
              key={layer.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-3 rounded flex items-center gap-3 cursor-pointer transition-colors ${
                selectedLayerId === layer.id 
                  ? 'bg-blue-600' 
                  : 'bg-gray-700 hover:bg-gray-600'
              }`}
              onClick={() => onSelectLayer(layer.id)}
            >
              {/* Thumbnail */}
              <div className="w-8 h-8 bg-gray-600 rounded flex items-center justify-center overflow-hidden">
                {layer.thumbnail ? (
                  <img 
                    src={layer.thumbnail} 
                    alt="" 
                    className="w-full h-full object-cover" 
                  />
                ) : (
                  <span className="text-xs text-gray-300">
                    {layer.type[0].toUpperCase()}
                  </span>
                )}
              </div>

              {/* Layer info */}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-white truncate">
                  {layer.name}
                </div>
                <div className="text-xs text-gray-400">
                  {layer.type} • {Math.round(layer.opacity * 100)}%
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleVisibility(layer.id);
                  }}
                  className="p-1 hover:bg-gray-500 rounded transition-colors"
                  title={layer.visible ? 'Hide layer' : 'Show layer'}
                >
                  {layer.visible ? (
                    <Eye size={14} className="text-gray-300" />
                  ) : (
                    <EyeOff size={14} className="text-gray-500" />
                  )}
                </button>
                
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleLock(layer.id);
                  }}
                  className="p-1 hover:bg-gray-500 rounded transition-colors"
                  title={layer.locked ? 'Unlock layer' : 'Lock layer'}
                >
                  {layer.locked ? (
                    <Lock size={14} className="text-orange-400" />
                  ) : (
                    <Unlock size={14} className="text-gray-300" />
                  )}
                </button>
                
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDuplicateLayer(layer.id);
                  }}
                  className="p-1 hover:bg-gray-500 rounded transition-colors"
                  title="Duplicate layer"
                >
                  <Copy size={14} className="text-gray-300" />
                </button>
                
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteLayer(layer.id);
                  }}
                  className="p-1 hover:bg-gray-500 rounded transition-colors"
                  title="Delete layer"
                >
                  <Trash2 size={14} className="text-red-400" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Layer reorder controls */}
        {selectedLayerId && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 flex gap-2"
          >
            <button
              onClick={() => onReorderLayer(selectedLayerId, 'up')}
              className="flex-1 flex items-center justify-center gap-2 p-2 bg-gray-700 hover:bg-gray-600 rounded transition-colors"
            >
              <ChevronUp size={16} />
              <span className="text-sm">Bring Forward</span>
            </button>
            <button
              onClick={() => onReorderLayer(selectedLayerId, 'down')}
              className="flex-1 flex items-center justify-center gap-2 p-2 bg-gray-700 hover:bg-gray-600 rounded transition-colors"
            >
              <ChevronDown size={16} />
              <span className="text-sm">Send Back</span>
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
};

// Enhanced text editing tools
interface TextToolsProps {
  selectedElement: any;
  onUpdate: (id: string, updates: any) => void;
}

export const ProfessionalTextTools: React.FC<TextToolsProps> = ({
  selectedElement,
  onUpdate
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const updateTextProperty = (property: string, value: any) => {
    if (selectedElement) {
      onUpdate(selectedElement.id, { [property]: value });
    }
  };

  const textPresets = [
    { name: 'Heading', fontSize: 48, fontWeight: 'bold' },
    { name: 'Subheading', fontSize: 32, fontWeight: '600' },
    { name: 'Body', fontSize: 20, fontWeight: 'normal' },
    { name: 'Caption', fontSize: 14, fontWeight: 'normal' },
  ];

  return (
    <div className="space-y-4">
      {/* Quick text presets */}
      <div>
        <h4 className="text-sm font-medium text-gray-300 mb-2">Text Presets</h4>
        <div className="grid grid-cols-2 gap-2">
          {textPresets.map(preset => (
            <button
              key={preset.name}
              onClick={() => {
                updateTextProperty('fontSize', preset.fontSize);
                updateTextProperty('fontWeight', preset.fontWeight);
              }}
              className="p-2 bg-gray-700 hover:bg-gray-600 rounded text-left transition-colors"
            >
              <div className="text-white text-sm font-medium">{preset.name}</div>
              <div className="text-gray-400 text-xs">{preset.fontSize}px</div>
            </button>
          ))}
        </div>
      </div>

      {selectedElement?.type === 'text' && (
        <>
          {/* Font controls */}
          <div className="space-y-3">
            <div>
              <label className="text-sm text-gray-300 block mb-1">Font Size</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={selectedElement.fontSize || 16}
                  onChange={(e) => updateTextProperty('fontSize', Number(e.target.value))}
                  className="w-20 px-2 py-1 bg-gray-800 text-white rounded border border-gray-600 focus:border-blue-400 outline-none"
                  min="8"
                  max="200"
                />
                <div className="flex gap-1">
                  <button
                    onClick={() => updateTextProperty('fontWeight', 
                      selectedElement.fontWeight === 'bold' ? 'normal' : 'bold'
                    )}
                    className={`p-2 rounded transition-colors ${
                      selectedElement.fontWeight === 'bold' 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                    title="Bold"
                  >
                    <Bold size={14} />
                  </button>
                  <button
                    onClick={() => updateTextProperty('fontStyle', 
                      selectedElement.fontStyle === 'italic' ? 'normal' : 'italic'
                    )}
                    className={`p-2 rounded transition-colors ${
                      selectedElement.fontStyle === 'italic' 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                    title="Italic"
                  >
                    <Italic size={14} />
                  </button>
                </div>
              </div>
            </div>

            {/* Text alignment */}
            <div>
              <label className="text-sm text-gray-300 block mb-1">Alignment</label>
              <div className="flex gap-1">
                {[
                  { value: 'left', icon: AlignLeft },
                  { value: 'center', icon: AlignCenter },
                  { value: 'right', icon: AlignRight },
                ].map(align => (
                  <button
                    key={align.value}
                    onClick={() => updateTextProperty('textAlign', align.value)}
                    className={`p-2 rounded transition-colors ${
                      selectedElement.textAlign === align.value 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    <align.icon size={14} />
                  </button>
                ))}
              </div>
            </div>

            {/* Color picker */}
            <div>
              <label className="text-sm text-gray-300 block mb-1">Text Color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={selectedElement.color || '#000000'}
                  onChange={(e) => updateTextProperty('color', e.target.value)}
                  className="w-12 h-8 rounded border border-gray-600 bg-gray-800"
                />
                <div className="flex gap-1">
                  {['#000000', '#ffffff', '#3B82F6', '#10B981', '#F59E0B', '#EF4444'].map(color => (
                    <button
                      key={color}
                      onClick={() => updateTextProperty('color', color)}
                      className="w-6 h-6 rounded border border-gray-600 hover:scale-110 transition-transform"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Advanced controls toggle */}
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="w-full p-2 bg-gray-700 hover:bg-gray-600 rounded text-sm transition-colors"
            >
              {showAdvanced ? 'Hide' : 'Show'} Advanced Options
            </button>

            {/* Advanced text controls */}
            <AnimatePresence>
              {showAdvanced && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-3"
                >
                  <div>
                    <label className="text-sm text-gray-300 block mb-1">Letter Spacing</label>
                    <input
                      type="range"
                      min="-5"
                      max="10"
                      step="0.5"
                      value={selectedElement.letterSpacing || 0}
                      onChange={(e) => updateTextProperty('letterSpacing', Number(e.target.value))}
                      className="w-full"
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm text-gray-300 block mb-1">Line Height</label>
                    <input
                      type="range"
                      min="0.8"
                      max="3"
                      step="0.1"
                      value={selectedElement.lineHeight || 1.2}
                      onChange={(e) => updateTextProperty('lineHeight', Number(e.target.value))}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="text-sm text-gray-300 block mb-1">Text Shadow</label>
                    <select
                      value={selectedElement.textShadow || 'none'}
                      onChange={(e) => updateTextProperty('textShadow', e.target.value)}
                      className="w-full px-2 py-1 bg-gray-800 text-white rounded border border-gray-600"
                    >
                      <option value="none">None</option>
                      <option value="2px 2px 4px rgba(0,0,0,0.5)">Soft Shadow</option>
                      <option value="3px 3px 0px rgba(0,0,0,0.8)">Hard Shadow</option>
                      <option value="0px 0px 10px rgba(255,255,255,0.8)">Glow</option>
                    </select>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </>
      )}
    </div>
  );
};

// Professional timeline component
interface TimelineTrack {
  id: string;
  elementId: string;
  startTime: number;
  duration: number;
  color: string;
  name: string;
}

interface ProfessionalTimelineProps {
  tracks: TimelineTrack[];
  currentTime: number;
  totalDuration: number;
  isPlaying: boolean;
  onPlay: () => void;
  onSeek: (time: number) => void;
  onTrackUpdate: (trackId: string, updates: Partial<TimelineTrack>) => void;
}

export const ProfessionalTimeline: React.FC<ProfessionalTimelineProps> = ({
  tracks,
  currentTime,
  totalDuration,
  isPlaying,
  onPlay,
  onSeek,
  onTrackUpdate
}) => {
  const formatTime = (time: number): string => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="h-48 bg-gray-800 border-t border-gray-700 p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onPlay}
            className="flex items-center justify-center w-10 h-10 bg-blue-600 hover:bg-blue-500 rounded-full transition-colors"
          >
            {isPlaying ? (
              <div className="w-3 h-3 bg-white rounded-sm" />
            ) : (
              <div className="w-0 h-0 border-l-4 border-l-white border-t-2 border-t-transparent border-b-2 border-b-transparent ml-1" />
            )}
          </button>
          
          <div className="text-white font-mono">
            {formatTime(currentTime)} / {formatTime(totalDuration)}
          </div>
        </div>
      </div>

      {/* Timeline ruler */}
      <div className="relative mb-4">
        <div className="h-8 bg-gray-700 rounded relative overflow-hidden">
          {/* Time markers */}
          {Array.from({ length: Math.ceil(totalDuration) + 1 }, (_, i) => (
            <div
              key={i}
              className="absolute top-0 h-full border-l border-gray-500 flex items-center"
              style={{ left: `${(i / totalDuration) * 100}%` }}
            >
              <span className="text-xs text-gray-400 ml-1">{i}s</span>
            </div>
          ))}
          
          {/* Playhead */}
          <div
            className="absolute top-0 w-0.5 h-full bg-yellow-400 z-10 cursor-pointer"
            style={{ left: `${(currentTime / totalDuration) * 100}%` }}
            onClick={(e) => {
              const rect = e.currentTarget.parentElement!.getBoundingClientRect();
              const x = e.clientX - rect.left;
              const newTime = (x / rect.width) * totalDuration;
              onSeek(newTime);
            }}
          />
        </div>
      </div>

      {/* Timeline tracks */}
      <div className="space-y-1 max-h-32 overflow-y-auto">
        {tracks.map(track => (
          <div
            key={track.id}
            className="h-8 bg-gray-700 rounded relative overflow-hidden hover:bg-gray-600 transition-colors"
          >
            <div
              className="absolute h-full rounded flex items-center px-2 text-white text-xs font-medium"
              style={{
                left: `${(track.startTime / totalDuration) * 100}%`,
                width: `${(track.duration / totalDuration) * 100}%`,
                backgroundColor: track.color,
                minWidth: '60px'
              }}
            >
              <span className="truncate">{track.name}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Enhanced background editor
interface BackgroundEditorProps {
  onColorChange: (color: string) => void;
  onImageChange: (file: File) => void;
  onGradientChange: (gradient: string) => void;
}

export const ProfessionalBackgroundEditor: React.FC<BackgroundEditorProps> = ({
  onColorChange,
  onImageChange,
  onGradientChange
}) => {
  const [activeTab, setActiveTab] = useState<'color' | 'image' | 'gradient'>('color');

  const gradientPresets = [
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
  ];

  return (
    <div className="p-4 bg-gray-800 rounded-lg">
      <h4 className="text-lg font-semibold text-white mb-4">Background Editor</h4>
      
      {/* Tab navigation */}
      <div className="flex gap-2 mb-4">
        {[
          { id: 'color', label: 'Color' },
          { id: 'image', label: 'Image' },
          { id: 'gradient', label: 'Gradient' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-3 py-2 rounded text-sm transition-colors ${
              activeTab === tab.id
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        {activeTab === 'color' && (
          <motion.div
            key="color"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <div className="grid grid-cols-6 gap-2">
              {[
                '#ffffff', '#f3f4f6', '#e5e7eb', '#d1d5db',
                '#9ca3af', '#6b7280', '#4b5563', '#374151',
                '#1f2937', '#111827', '#000000', '#ef4444',
                '#f97316', '#f59e0b', '#eab308', '#84cc16',
                '#22c55e', '#10b981', '#14b8a6', '#06b6d4',
                '#0ea5e9', '#3b82f6', '#6366f1', '#8b5cf6',
                '#a855f7', '#d946ef', '#ec4899', '#f43f5e'
              ].map(color => (
                <button
                  key={color}
                  onClick={() => onColorChange(color)}
                  className="w-full h-8 rounded border-2 border-gray-600 hover:border-gray-400 transition-colors"
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            
            <div className="mt-4">
              <label className="block text-sm text-gray-300 mb-2">Custom Color</label>
              <input
                type="color"
                onChange={(e) => onColorChange(e.target.value)}
                className="w-full h-10 rounded border border-gray-600 bg-gray-800"
              />
            </div>
          </motion.div>
        )}

        {activeTab === 'image' && (
          <motion.div
            key="image"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <label className="block w-full p-6 border-2 border-dashed border-gray-600 rounded-lg text-center cursor-pointer hover:border-gray-500 transition-colors">
              <PaintBucket size={32} className="mx-auto mb-2 text-gray-400" />
              <span className="text-gray-300">Click to upload background image</span>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => e.target.files?.[0] && onImageChange(e.target.files[0])}
                className="hidden"
              />
            </label>
          </motion.div>
        )}

        {activeTab === 'gradient' && (
          <motion.div
            key="gradient"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <div className="grid grid-cols-2 gap-2">
              {gradientPresets.map((gradient, index) => (
                <button
                  key={index}
                  onClick={() => onGradientChange(gradient)}
                  className="h-12 rounded border-2 border-gray-600 hover:border-gray-400 transition-colors"
                  style={{ background: gradient }}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default {
  ProfessionalLayersPanel,
  ProfessionalTextTools,
  ProfessionalTimeline,
  ProfessionalBackgroundEditor
}; 