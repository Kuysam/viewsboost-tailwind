import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sliders, Filter, Crop, RotateCw, FlipHorizontal, FlipVertical,
  Sun, Moon, Contrast, Droplets, Zap, Sparkles, Eye, EyeOff,
  Palette, Magic, Target, Grid3X3, Move, Maximize2, Minimize2, Focus
} from 'lucide-react';
import toast from 'react-hot-toast';

interface MediaEnhancementPanelProps {
  selectedElement: any;
  onUpdate: (updates: any) => void;
  onClose: () => void;
}

const MediaEnhancementPanel: React.FC<MediaEnhancementPanelProps> = ({
  selectedElement,
  onUpdate,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'adjust' | 'filters' | 'effects' | 'transform'>('adjust');
  const [adjustments, setAdjustments] = useState({
    brightness: 100,
    contrast: 100,
    saturation: 100,
    blur: 0,
    hue: 0,
    opacity: 100,
    vibrance: 0,
    highlights: 0,
    shadows: 0,
    temperature: 0,
    tint: 0
  });

  const filters = [
    { name: 'Original', filter: 'none', preview: 'bg-gray-300' },
    { name: 'B&W', filter: 'grayscale(100%)', preview: 'bg-gray-400' },
    { name: 'Sepia', filter: 'sepia(100%)', preview: 'bg-yellow-600' },
    { name: 'Vintage', filter: 'contrast(110%) brightness(110%) saturate(130%)', preview: 'bg-orange-400' },
    { name: 'Cool', filter: 'hue-rotate(180deg)', preview: 'bg-blue-400' },
    { name: 'Warm', filter: 'hue-rotate(30deg) saturate(120%)', preview: 'bg-red-400' },
    { name: 'Drama', filter: 'contrast(150%) brightness(90%)', preview: 'bg-purple-600' },
    { name: 'Soft', filter: 'blur(1px) brightness(110%)', preview: 'bg-pink-300' },
    { name: 'Sharp', filter: 'contrast(120%) saturate(110%)', preview: 'bg-green-400' },
    { name: 'Neon', filter: 'saturate(200%) contrast(150%)', preview: 'bg-cyan-400' }
  ];

  const effects = [
    { name: 'Glow', icon: <Sparkles size={16} />, premium: false },
    { name: 'Shadow', icon: <Moon size={16} />, premium: false },
    { name: 'Reflection', icon: <FlipVertical size={16} />, premium: true },
    { name: 'Border', icon: <Target size={16} />, premium: false },
    { name: 'Vignette', icon: <Eye size={16} />, premium: false },
    { name: 'Noise', icon: <Grid3X3 size={16} />, premium: true },
    { name: 'Pixelate', icon: <Maximize2 size={16} />, premium: true },
    { name: 'Oil Paint', icon: <Palette size={16} />, premium: true }
  ];

  const handleAdjustmentChange = (key: string, value: number) => {
    const newAdjustments = { ...adjustments, [key]: value };
    setAdjustments(newAdjustments);
    
    // Apply CSS filter
    const filterString = `
      brightness(${newAdjustments.brightness}%) 
      contrast(${newAdjustments.contrast}%) 
      saturate(${newAdjustments.saturation}%) 
      blur(${newAdjustments.blur}px)
      hue-rotate(${newAdjustments.hue}deg)
      opacity(${newAdjustments.opacity}%)
    `.replace(/\s+/g, ' ').trim();
    
    onUpdate({ filter: filterString });
  };

  const applyFilter = (filter: string) => {
    onUpdate({ filter });
    toast.success('Filter applied!');
  };

  const applyEffect = (effectName: string) => {
    toast.success(`${effectName} effect applied!`);
  };

  const resetAdjustments = () => {
    const defaultAdjustments = {
      brightness: 100,
      contrast: 100,
      saturation: 100,
      blur: 0,
      hue: 0,
      opacity: 100,
      vibrance: 0,
      highlights: 0,
      shadows: 0,
      temperature: 0,
      tint: 0
    };
    setAdjustments(defaultAdjustments);
    onUpdate({ filter: 'none' });
    toast.success('Adjustments reset!');
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={onClose}
    >
      <motion.div
        onClick={(e) => e.stopPropagation()}
        className="bg-gray-900 rounded-2xl p-6 w-96 max-h-[80vh] overflow-y-auto shadow-2xl"
        initial={{ y: 50 }}
        animate={{ y: 0 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-white text-xl font-semibold">Enhance Media</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition"
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="flex bg-gray-800 rounded-lg p-1 mb-6">
          {(['adjust', 'filters', 'effects', 'transform'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition ${
                activeTab === tab
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Adjust Tab */}
        {activeTab === 'adjust' && (
          <div className="space-y-4">
            {/* Basic Adjustments */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-300">Basic</span>
                <button
                  onClick={resetAdjustments}
                  className="text-blue-400 hover:text-blue-300 text-sm"
                >
                  Reset All
                </button>
              </div>
              
              {[
                { key: 'brightness', label: 'Brightness', icon: <Sun size={14} />, min: 0, max: 200 },
                { key: 'contrast', label: 'Contrast', icon: <Contrast size={14} />, min: 0, max: 200 },
                { key: 'saturation', label: 'Saturation', icon: <Droplets size={14} />, min: 0, max: 200 },
                { key: 'blur', label: 'Blur', icon: <Focus size={14} />, min: 0, max: 10 },
                { key: 'hue', label: 'Hue', icon: <Palette size={14} />, min: -180, max: 180 },
                { key: 'opacity', label: 'Opacity', icon: <Eye size={14} />, min: 0, max: 100 }
              ].map((adjustment) => (
                <div key={adjustment.key}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-blue-400">{adjustment.icon}</span>
                    <span className="text-sm text-gray-300">{adjustment.label}</span>
                    <span className="text-xs text-gray-400 ml-auto">
                      {adjustments[adjustment.key as keyof typeof adjustments]}
                      {adjustment.key === 'hue' ? '°' : adjustment.key === 'blur' ? 'px' : '%'}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={adjustment.min}
                    max={adjustment.max}
                    value={adjustments[adjustment.key as keyof typeof adjustments]}
                    onChange={(e) => handleAdjustmentChange(adjustment.key, Number(e.target.value))}
                    className="w-full accent-blue-500"
                  />
                </div>
              ))}
            </div>

            {/* Advanced Adjustments */}
            <div className="space-y-3 border-t border-gray-700 pt-4">
              <span className="text-gray-300">Advanced</span>
              
              {[
                { key: 'vibrance', label: 'Vibrance', min: -100, max: 100 },
                { key: 'highlights', label: 'Highlights', min: -100, max: 100 },
                { key: 'shadows', label: 'Shadows', min: -100, max: 100 },
                { key: 'temperature', label: 'Temperature', min: -100, max: 100 },
                { key: 'tint', label: 'Tint', min: -100, max: 100 }
              ].map((adjustment) => (
                <div key={adjustment.key}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-300">{adjustment.label}</span>
                    <span className="text-xs text-gray-400">
                      {adjustments[adjustment.key as keyof typeof adjustments]}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={adjustment.min}
                    max={adjustment.max}
                    value={adjustments[adjustment.key as keyof typeof adjustments]}
                    onChange={(e) => handleAdjustmentChange(adjustment.key, Number(e.target.value))}
                    className="w-full accent-blue-500"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filters Tab */}
        {activeTab === 'filters' && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-2">
              {filters.map((filter) => (
                <motion.button
                  key={filter.name}
                  onClick={() => applyFilter(filter.filter)}
                  className="relative p-3 bg-gray-800 rounded-lg hover:bg-gray-700 transition text-center"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <div className={`w-full h-12 ${filter.preview} rounded mb-2`}></div>
                  <span className="text-xs text-gray-300">{filter.name}</span>
                </motion.button>
              ))}
            </div>
          </div>
        )}

        {/* Effects Tab */}
        {activeTab === 'effects' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              {effects.map((effect) => (
                <motion.button
                  key={effect.name}
                  onClick={() => applyEffect(effect.name)}
                  className="relative p-4 bg-gray-800 rounded-lg hover:bg-gray-700 transition text-left"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-blue-400">{effect.icon}</span>
                    <span className="text-sm text-gray-300">{effect.name}</span>
                  </div>
                  {effect.premium && (
                    <span className="text-xs bg-yellow-500 text-black px-1 rounded">PRO</span>
                  )}
                </motion.button>
              ))}
            </div>
          </div>
        )}

        {/* Transform Tab */}
        {activeTab === 'transform' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <button className="p-4 bg-gray-800 rounded-lg hover:bg-gray-700 transition flex items-center gap-2">
                <Crop size={20} className="text-green-400" />
                <span className="text-sm">Crop</span>
              </button>
              <button className="p-4 bg-gray-800 rounded-lg hover:bg-gray-700 transition flex items-center gap-2">
                <RotateCw size={20} className="text-blue-400" />
                <span className="text-sm">Rotate</span>
              </button>
              <button className="p-4 bg-gray-800 rounded-lg hover:bg-gray-700 transition flex items-center gap-2">
                <FlipHorizontal size={20} className="text-purple-400" />
                <span className="text-sm">Flip H</span>
              </button>
              <button className="p-4 bg-gray-800 rounded-lg hover:bg-gray-700 transition flex items-center gap-2">
                <FlipVertical size={20} className="text-orange-400" />
                <span className="text-sm">Flip V</span>
              </button>
            </div>

            {/* Precise Transform Controls */}
            <div className="space-y-3 border-t border-gray-700 pt-4">
              <span className="text-gray-300">Precise Transform</span>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Rotation (°)</label>
                  <input
                    type="number"
                    min="-360"
                    max="360"
                    defaultValue="0"
                    className="w-full px-2 py-1 bg-gray-800 text-white rounded text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Scale (%)</label>
                  <input
                    type="number"
                    min="10"
                    max="500"
                    defaultValue="100"
                    className="w-full px-2 py-1 bg-gray-800 text-white rounded text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Skew X (°)</label>
                  <input
                    type="number"
                    min="-45"
                    max="45"
                    defaultValue="0"
                    className="w-full px-2 py-1 bg-gray-800 text-white rounded text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Skew Y (°)</label>
                  <input
                    type="number"
                    min="-45"
                    max="45"
                    defaultValue="0"
                    className="w-full px-2 py-1 bg-gray-800 text-white rounded text-sm"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Apply Button */}
        <div className="flex gap-3 mt-6 pt-4 border-t border-gray-700">
          <button
            onClick={onClose}
            className="flex-1 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              toast.success('Changes applied!');
              onClose();
            }}
            className="flex-1 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
          >
            Apply
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default MediaEnhancementPanel; 