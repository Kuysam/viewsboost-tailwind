import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HexColorPicker, HsvaColorPicker } from 'react-colorful';
import { 
  Palette, Droplets, Gradient, Eye, Copy, Check, Shuffle,
  Plus, Trash2, Star, StarOff, Grid3X3, Pipette
} from 'lucide-react';
import toast from 'react-hot-toast';

interface AdvancedColorPickerProps {
  color: string;
  onChange: (color: string) => void;
  onGradientChange?: (gradient: string) => void;
}

interface ColorPalette {
  id: string;
  name: string;
  colors: string[];
  isStarred?: boolean;
}

const AdvancedColorPicker: React.FC<AdvancedColorPickerProps> = ({
  color,
  onChange,
  onGradientChange
}) => {
  const [activeTab, setActiveTab] = useState<'solid' | 'gradient' | 'palette'>('solid');
  const [savedColors, setSavedColors] = useState<string[]>([
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD'
  ]);
  const [gradientType, setGradientType] = useState<'linear' | 'radial'>('linear');
  const [gradientAngle, setGradientAngle] = useState(90);
  const [gradientColors, setGradientColors] = useState(['#FF6B6B', '#4ECDC4']);
  const [selectedGradientStop, setSelectedGradientStop] = useState(0);
  const [eyedropperActive, setEyedropperActive] = useState(false);
  const eyedropperRef = useRef<HTMLInputElement>(null);

  const colorPalettes: ColorPalette[] = [
    {
      id: 'vibrant',
      name: 'Vibrant',
      colors: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD'],
      isStarred: true
    },
    {
      id: 'earth',
      name: 'Earth Tones',
      colors: ['#8B4513', '#CD853F', '#D2691E', '#A0522D', '#DEB887', '#F4A460']
    },
    {
      id: 'ocean',
      name: 'Ocean',
      colors: ['#006994', '#0080C7', '#5BA3D0', '#B8D4E3', '#E8F4F8', '#FFFFFF']
    },
    {
      id: 'sunset',
      name: 'Sunset',
      colors: ['#FF4E50', '#FC913A', '#F9D423', '#EDE574', '#E1F5C4', '#C7EDF4']
    },
    {
      id: 'monochrome',
      name: 'Monochrome',
      colors: ['#000000', '#2C2C2C', '#5A5A5A', '#8A8A8A', '#B8B8B8', '#FFFFFF']
    }
  ];

  const handleColorSave = () => {
    if (!savedColors.includes(color)) {
      setSavedColors([...savedColors, color]);
      toast.success('Color saved!');
    }
  };

  const handleColorCopy = (colorToCopy: string) => {
    navigator.clipboard.writeText(colorToCopy);
    toast.success('Color copied to clipboard!');
  };

  const generateRandomColor = () => {
    const randomColor = '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0');
    onChange(randomColor);
  };

  const updateGradient = () => {
    const gradient = gradientType === 'linear' 
      ? `linear-gradient(${gradientAngle}deg, ${gradientColors.join(', ')})`
      : `radial-gradient(circle, ${gradientColors.join(', ')})`;
    
    if (onGradientChange) {
      onGradientChange(gradient);
    }
  };

  const addGradientStop = () => {
    if (gradientColors.length < 5) {
      setGradientColors([...gradientColors, color]);
    }
  };

  const removeGradientStop = (index: number) => {
    if (gradientColors.length > 2) {
      const newColors = gradientColors.filter((_, i) => i !== index);
      setGradientColors(newColors);
      setSelectedGradientStop(Math.min(selectedGradientStop, newColors.length - 1));
    }
  };

  const updateGradientStop = (index: number, newColor: string) => {
    const newColors = [...gradientColors];
    newColors[index] = newColor;
    setGradientColors(newColors);
    updateGradient();
  };

  const activateEyedropper = async () => {
    if ('EyeDropper' in window) {
      try {
        // @ts-ignore
        const eyeDropper = new EyeDropper();
        const result = await eyeDropper.open();
        onChange(result.sRGBHex);
        setEyedropperActive(false);
      } catch (e) {
        console.log('User cancelled eyedropper');
      }
    } else {
      toast.error('Eyedropper not supported in this browser');
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-gray-900 rounded-lg p-4 w-80 space-y-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-white font-semibold flex items-center gap-2">
          <Palette size={20} className="text-blue-400" />
          Colors
        </h3>
        <div className="flex gap-2">
          <button
            onClick={activateEyedropper}
            className={`p-2 rounded transition ${
              eyedropperActive ? 'bg-blue-500 text-white' : 'bg-gray-700 text-gray-300 hover:text-white'
            }`}
            title="Eyedropper"
          >
            <Pipette size={16} />
          </button>
          <button
            onClick={generateRandomColor}
            className="p-2 bg-gray-700 text-gray-300 hover:text-white rounded transition"
            title="Random Color"
          >
            <Shuffle size={16} />
          </button>
        </div>
      </div>

      {/* Color Type Tabs */}
      <div className="flex bg-gray-800 rounded-lg p-1">
        {(['solid', 'gradient', 'palette'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition ${
              activeTab === tab
                ? 'bg-blue-500 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            {tab === 'solid' && 'Solid'}
            {tab === 'gradient' && 'Gradient'}
            {tab === 'palette' && 'Palettes'}
          </button>
        ))}
      </div>

      {/* Solid Color Tab */}
      {activeTab === 'solid' && (
        <div className="space-y-4">
          <HexColorPicker color={color} onChange={onChange} />
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-gray-400 text-sm">Hex Value</span>
              <div className="flex gap-2">
                <button
                  onClick={() => handleColorCopy(color)}
                  className="p-1 text-gray-400 hover:text-white transition"
                >
                  <Copy size={14} />
                </button>
                <button
                  onClick={handleColorSave}
                  className="p-1 text-gray-400 hover:text-white transition"
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>
            <input
              type="text"
              value={color}
              onChange={(e) => onChange(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 text-white rounded border border-gray-600 focus:border-blue-400"
            />
          </div>

          {/* Color Preview */}
          <div 
            className="w-full h-12 rounded-lg border border-gray-600"
            style={{ backgroundColor: color }}
          />

          {/* Saved Colors */}
          {savedColors.length > 0 && (
            <div className="space-y-2">
              <span className="text-gray-400 text-sm">Saved Colors</span>
              <div className="grid grid-cols-6 gap-2">
                {savedColors.map((savedColor, index) => (
                  <button
                    key={index}
                    onClick={() => onChange(savedColor)}
                    className="w-10 h-10 rounded border border-gray-600 hover:scale-110 transition-transform"
                    style={{ backgroundColor: savedColor }}
                    title={savedColor}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Gradient Tab */}
      {activeTab === 'gradient' && (
        <div className="space-y-4">
          <div className="flex gap-2">
            <button
              onClick={() => setGradientType('linear')}
              className={`flex-1 py-2 px-3 rounded text-sm ${
                gradientType === 'linear' ? 'bg-blue-500 text-white' : 'bg-gray-700 text-gray-300'
              }`}
            >
              Linear
            </button>
            <button
              onClick={() => setGradientType('radial')}
              className={`flex-1 py-2 px-3 rounded text-sm ${
                gradientType === 'radial' ? 'bg-blue-500 text-white' : 'bg-gray-700 text-gray-300'
              }`}
            >
              Radial
            </button>
          </div>

          {gradientType === 'linear' && (
            <div>
              <label className="text-gray-400 text-sm block mb-2">Angle</label>
              <input
                type="range"
                min="0"
                max="360"
                value={gradientAngle}
                onChange={(e) => {
                  setGradientAngle(Number(e.target.value));
                  updateGradient();
                }}
                className="w-full"
              />
              <span className="text-gray-400 text-sm">{gradientAngle}°</span>
            </div>
          )}

          {/* Gradient Preview */}
          <div 
            className="w-full h-16 rounded-lg border border-gray-600"
            style={{ 
              background: gradientType === 'linear' 
                ? `linear-gradient(${gradientAngle}deg, ${gradientColors.join(', ')})`
                : `radial-gradient(circle, ${gradientColors.join(', ')})`
            }}
          />

          {/* Gradient Stops */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-gray-400 text-sm">Color Stops</span>
              <button
                onClick={addGradientStop}
                disabled={gradientColors.length >= 5}
                className="p-1 text-gray-400 hover:text-white transition disabled:opacity-50"
              >
                <Plus size={14} />
              </button>
            </div>

            <div className="space-y-2">
              {gradientColors.map((stopColor, index) => (
                <div key={index} className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedGradientStop(index)}
                    className={`w-8 h-8 rounded border-2 transition ${
                      selectedGradientStop === index ? 'border-blue-400' : 'border-gray-600'
                    }`}
                    style={{ backgroundColor: stopColor }}
                  />
                  <input
                    type="text"
                    value={stopColor}
                    onChange={(e) => updateGradientStop(index, e.target.value)}
                    className="flex-1 px-2 py-1 bg-gray-800 text-white rounded text-sm"
                  />
                  {gradientColors.length > 2 && (
                    <button
                      onClick={() => removeGradientStop(index)}
                      className="p-1 text-gray-400 hover:text-red-400 transition"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <HexColorPicker 
            color={gradientColors[selectedGradientStop]} 
            onChange={(newColor) => updateGradientStop(selectedGradientStop, newColor)}
          />
        </div>
      )}

      {/* Palette Tab */}
      {activeTab === 'palette' && (
        <div className="space-y-4 max-h-80 overflow-y-auto">
          {colorPalettes.map((palette) => (
            <div key={palette.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-white font-medium">{palette.name}</span>
                <button className="text-gray-400 hover:text-yellow-400 transition">
                  {palette.isStarred ? <Star size={16} fill="currentColor" /> : <StarOff size={16} />}
                </button>
              </div>
              <div className="grid grid-cols-6 gap-1">
                {palette.colors.map((paletteColor, index) => (
                  <button
                    key={index}
                    onClick={() => onChange(paletteColor)}
                    className="aspect-square rounded hover:scale-110 transition-transform border border-gray-600"
                    style={{ backgroundColor: paletteColor }}
                    title={paletteColor}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default AdvancedColorPicker; 