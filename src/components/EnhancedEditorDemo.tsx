import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  ProfessionalLayersPanel,
  ProfessionalTextTools,
  ProfessionalTimeline,
  ProfessionalBackgroundEditor
} from './ProfessionalEditorEnhancements';
import { Layers, Type, Clock, PaintBucket, Settings } from 'lucide-react';

// Demo component showing how to integrate professional features
const EnhancedEditorDemo: React.FC = () => {
  const [activePanel, setActivePanel] = useState<string>('layers');
  const [layers, setLayers] = useState([
    {
      id: 'bg-1',
      name: 'Background',
      type: 'background',
      visible: true,
      locked: false,
      opacity: 1,
    },
    {
      id: 'text-1',
      name: 'Main Heading',
      type: 'text',
      visible: true,
      locked: false,
      opacity: 1,
    },
    {
      id: 'shape-1',
      name: 'Rectangle',
      type: 'shape',
      visible: true,
      locked: false,
      opacity: 0.8,
    }
  ]);

  const [timelineTracks] = useState([
    {
      id: 'track-1',
      elementId: 'text-1',
      startTime: 0,
      duration: 5,
      color: '#3B82F6',
      name: 'Main Heading'
    },
    {
      id: 'track-2', 
      elementId: 'shape-1',
      startTime: 1,
      duration: 4,
      color: '#10B981',
      name: 'Rectangle'
    }
  ]);

  const [selectedLayer, setSelectedLayer] = useState<string | null>('text-1');
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  // Mock functions for demo
  const handleSelectLayer = (id: string) => setSelectedLayer(id);
  const handleToggleVisibility = (id: string) => {
    setLayers(layers.map(layer => 
      layer.id === id ? { ...layer, visible: !layer.visible } : layer
    ));
  };
  const handleToggleLock = (id: string) => {
    setLayers(layers.map(layer => 
      layer.id === id ? { ...layer, locked: !layer.locked } : layer
    ));
  };
  const handleDeleteLayer = (id: string) => {
    setLayers(layers.filter(layer => layer.id !== id));
  };
  const handleDuplicateLayer = (id: string) => {
    const layer = layers.find(l => l.id === id);
    if (layer) {
      const newLayer = { ...layer, id: `${id}-copy`, name: `${layer.name} Copy` };
      setLayers([...layers, newLayer]);
    }
  };
  const handleReorderLayer = (id: string, direction: 'up' | 'down') => {
    console.log(`Reorder ${id} ${direction}`);
  };

  const handlePlay = () => setIsPlaying(!isPlaying);
  const handleSeek = (time: number) => setCurrentTime(time);
  const handleTrackUpdate = (trackId: string, updates: any) => {
    console.log('Track update:', trackId, updates);
  };

  const handleColorChange = (color: string) => {
    console.log('Background color:', color);
  };
  const handleImageChange = (file: File) => {
    console.log('Background image:', file.name);
  };
  const handleGradientChange = (gradient: string) => {
    console.log('Background gradient:', gradient);
  };

  const handleTextUpdate = (id: string, updates: any) => {
    console.log('Text update:', id, updates);
  };

  const selectedElement = selectedLayer ? { 
    id: selectedLayer, 
    type: 'text',
    fontSize: 24,
    fontWeight: 'normal',
    textAlign: 'left' as const,
    color: '#ffffff'
  } : null;

  const panelTabs = [
    { id: 'layers', label: 'Layers', icon: Layers },
    { id: 'text', label: 'Text', icon: Type },
    { id: 'timeline', label: 'Timeline', icon: Clock },
    { id: 'background', label: 'Background', icon: PaintBucket },
  ];

  return (
    <div className="h-screen bg-gray-900 text-white flex">
      {/* Main Canvas Area */}
      <div className="flex-1 flex flex-col">
        {/* Top Toolbar */}
        <div className="h-16 bg-gray-800 border-b border-gray-700 flex items-center px-4">
          <h1 className="text-xl font-bold">Enhanced ViewsBoost Editor Demo</h1>
        </div>

        {/* Canvas */}
        <div className="flex-1 flex items-center justify-center bg-gray-900 p-8">
          <div className="bg-white rounded-lg shadow-2xl" style={{ width: 540, height: 960 }}>
            <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg p-8 flex flex-col items-center justify-center">
              <div className="text-white text-center">
                <h2 className="text-3xl font-bold mb-4">Demo Canvas</h2>
                <p className="text-lg opacity-90">Professional Editor Features</p>
                <div className="mt-8 bg-white/20 rounded-lg p-4">
                  <p className="text-sm">Current Time: {currentTime.toFixed(1)}s</p>
                  <p className="text-sm">Selected: {selectedLayer || 'None'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Timeline */}
        <ProfessionalTimeline
          tracks={timelineTracks}
          currentTime={currentTime}
          totalDuration={10}
          isPlaying={isPlaying}
          onPlay={handlePlay}
          onSeek={handleSeek}
          onTrackUpdate={handleTrackUpdate}
        />
      </div>

      {/* Right Sidebar */}
      <div className="w-96 bg-gray-800 border-l border-gray-700 flex flex-col">
        {/* Panel Tabs */}
        <div className="flex border-b border-gray-700">
          {panelTabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActivePanel(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 p-3 text-sm transition-colors ${
                activePanel === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Panel Content */}
        <div className="flex-1 overflow-hidden">
          {activePanel === 'layers' && (
            <ProfessionalLayersPanel
              layers={layers}
              selectedLayerId={selectedLayer}
              onSelectLayer={handleSelectLayer}
              onToggleVisibility={handleToggleVisibility}
              onToggleLock={handleToggleLock}
              onDeleteLayer={handleDeleteLayer}
              onDuplicateLayer={handleDuplicateLayer}
              onReorderLayer={handleReorderLayer}
            />
          )}

          {activePanel === 'text' && (
            <div className="p-4">
              <ProfessionalTextTools
                selectedElement={selectedElement}
                onUpdate={handleTextUpdate}
              />
            </div>
          )}

          {activePanel === 'background' && (
            <div className="p-4">
              <ProfessionalBackgroundEditor
                onColorChange={handleColorChange}
                onImageChange={handleImageChange}
                onGradientChange={handleGradientChange}
              />
            </div>
          )}

          {activePanel === 'timeline' && (
            <div className="p-4">
              <h3 className="text-lg font-semibold mb-4">Timeline Controls</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-300 mb-2">Current Time</label>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    step="0.1"
                    value={currentTime}
                    onChange={(e) => setCurrentTime(Number(e.target.value))}
                    className="w-full"
                  />
                  <div className="text-xs text-gray-400 mt-1">
                    {currentTime.toFixed(1)}s / 10.0s
                  </div>
                </div>
                
                <button
                  onClick={handlePlay}
                  className={`w-full p-3 rounded font-medium transition-colors ${
                    isPlaying 
                      ? 'bg-red-600 hover:bg-red-500 text-white'
                      : 'bg-green-600 hover:bg-green-500 text-white'
                  }`}
                >
                  {isPlaying ? 'Pause' : 'Play'} Preview
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EnhancedEditorDemo; 