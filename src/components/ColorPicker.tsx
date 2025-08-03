import React, { useState, useCallback, useRef, useEffect } from 'react';
import { SketchPicker, ColorResult } from 'react-color';
import { Palette, Pipette, History, Copy, Check } from 'lucide-react';

interface ColorSwatch {
  id: string;
  color: string;
  name?: string;
  timestamp: number;
}

interface AdvancedColorPickerProps {
  color: string;
  onChange: (color: string) => void;
  onClose?: () => void;
  showEyedropper?: boolean;
  presetColors?: string[];
}

export function AdvancedColorPicker({
  color,
  onChange,
  onClose,
  showEyedropper = true,
  presetColors = [
    '#FF0000', '#FF8000', '#FFFF00', '#80FF00', '#00FF00', '#00FF80',
    '#00FFFF', '#0080FF', '#0000FF', '#8000FF', '#FF00FF', '#FF0080',
    '#000000', '#404040', '#808080', '#C0C0C0', '#FFFFFF'
  ]
}: AdvancedColorPickerProps) {
  const [activeTab, setActiveTab] = useState<'picker' | 'swatches' | 'recent'>('picker');
  const [recentColors, setRecentColors] = useState<ColorSwatch[]>([]);
  const [isEyedropperActive, setIsEyedropperActive] = useState(false);
  const [copiedColor, setCopiedColor] = useState<string | null>(null);
  const eyedropperRef = useRef<boolean>(false);

  // Load recent colors from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('color-picker-recent');
    if (saved) {
      try {
        setRecentColors(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load recent colors:', e);
      }
    }
  }, []);

  // Save recent colors to localStorage
  const saveRecentColor = useCallback((newColor: string) => {
    const colorSwatch: ColorSwatch = {
      id: `color-${Date.now()}`,
      color: newColor,
      timestamp: Date.now(),
    };

    setRecentColors(prev => {
      const filtered = prev.filter(c => c.color !== newColor);
      const updated = [colorSwatch, ...filtered].slice(0, 20); // Keep last 20 colors
      localStorage.setItem('color-picker-recent', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const handleColorChange = useCallback((colorResult: ColorResult) => {
    const newColor = colorResult.hex;
    onChange(newColor);
    saveRecentColor(newColor);
  }, [onChange, saveRecentColor]);

  const startEyedropper = useCallback(async () => {
    if (!('EyeDropper' in window)) {
      alert('Eyedropper is not supported in this browser');
      return;
    }

    try {
      setIsEyedropperActive(true);
      eyedropperRef.current = true;
      
      // @ts-ignore - EyeDropper is not in TypeScript definitions yet
      const eyeDropper = new EyeDropper();
      const result = await eyeDropper.open();
      
      if (eyedropperRef.current && result?.sRGBHex) {
        onChange(result.sRGBHex);
        saveRecentColor(result.sRGBHex);
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        // User cancelled the eyedropper
      } else {
        console.error('Eyedropper error:', error);
      }
    } finally {
      setIsEyedropperActive(false);
      eyedropperRef.current = false;
    }
  }, [onChange, saveRecentColor]);

  const copyColorToClipboard = useCallback(async (colorToCopy: string) => {
    try {
      await navigator.clipboard.writeText(colorToCopy);
      setCopiedColor(colorToCopy);
      setTimeout(() => setCopiedColor(null), 2000);
    } catch (error) {
      console.error('Failed to copy color:', error);
    }
  }, []);

  const applyColor = useCallback((colorToApply: string) => {
    onChange(colorToApply);
    saveRecentColor(colorToApply);
  }, [onChange, saveRecentColor]);

  return (
    <div className="bg-gray-800 border border-gray-600 rounded-lg shadow-xl p-4 w-80">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-medium">Color Picker</h3>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1 rounded"
          >
            ×
          </button>
        )}
      </div>

      {/* Color Display */}
      <div className="flex items-center gap-3 mb-4">
        <div
          className="w-12 h-12 rounded-lg border-2 border-gray-600 shadow-inner"
          style={{ backgroundColor: color }}
        />
        <div className="flex-1">
          <input
            type="text"
            value={color}
            onChange={(e) => onChange(e.target.value)}
            className="w-full bg-gray-700 text-white px-3 py-2 rounded border border-gray-600 text-sm font-mono"
            placeholder="#000000"
          />
        </div>
        <button
          onClick={() => copyColorToClipboard(color)}
          className="p-2 text-gray-400 hover:text-white transition"
          title="Copy color"
        >
          {copiedColor === color ? <Check size={18} /> : <Copy size={18} />}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex mb-4 bg-gray-700 rounded-lg p-1">
        <button
          onClick={() => setActiveTab('picker')}
          className={`flex-1 py-2 px-3 rounded text-sm font-medium transition ${
            activeTab === 'picker'
              ? 'bg-blue-500 text-white'
              : 'text-gray-300 hover:text-white'
          }`}
        >
          <Palette size={16} className="inline mr-2" />
          Picker
        </button>
        <button
          onClick={() => setActiveTab('swatches')}
          className={`flex-1 py-2 px-3 rounded text-sm font-medium transition ${
            activeTab === 'swatches'
              ? 'bg-blue-500 text-white'
              : 'text-gray-300 hover:text-white'
          }`}
        >
          Swatches
        </button>
        <button
          onClick={() => setActiveTab('recent')}
          className={`flex-1 py-2 px-3 rounded text-sm font-medium transition ${
            activeTab === 'recent'
              ? 'bg-blue-500 text-white'
              : 'text-gray-300 hover:text-white'
          }`}
        >
          <History size={16} className="inline mr-2" />
          Recent
        </button>
      </div>

      {/* Content */}
      {activeTab === 'picker' && (
        <div>
          <SketchPicker
            color={color}
            onChange={handleColorChange}
            disableAlpha={false}
            presetColors={presetColors}
            styles={{
              default: {
                picker: {
                  backgroundColor: 'transparent',
                  boxShadow: 'none',
                  border: 'none',
                  fontFamily: 'inherit',
                },
              },
            }}
          />
          
          {showEyedropper && 'EyeDropper' in window && (
            <button
              onClick={startEyedropper}
              disabled={isEyedropperActive}
              className={`w-full mt-4 py-2 px-4 rounded-lg font-medium transition ${
                isEyedropperActive
                  ? 'bg-orange-500 text-white cursor-wait'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white'
              }`}
            >
              <Pipette size={16} className="inline mr-2" />
              {isEyedropperActive ? 'Click to sample color...' : 'Use Eyedropper'}
            </button>
          )}
        </div>
      )}

      {activeTab === 'swatches' && (
        <div className="grid grid-cols-6 gap-2">
          {presetColors.map((presetColor, index) => (
            <button
              key={index}
              onClick={() => applyColor(presetColor)}
              className="w-10 h-10 rounded-lg border-2 border-gray-600 hover:border-gray-400 transition shadow-sm"
              style={{ backgroundColor: presetColor }}
              title={presetColor}
            />
          ))}
        </div>
      )}

      {activeTab === 'recent' && (
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {recentColors.length === 0 ? (
            <div className="text-center text-gray-400 py-8">
              <History size={24} className="mx-auto mb-2 opacity-50" />
              <p className="text-sm">No recent colors</p>
            </div>
          ) : (
            recentColors.map((swatch) => (
              <div
                key={swatch.id}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-700 cursor-pointer group"
                onClick={() => applyColor(swatch.color)}
              >
                <div
                  className="w-8 h-8 rounded border-2 border-gray-600"
                  style={{ backgroundColor: swatch.color }}
                />
                <div className="flex-1">
                  <div className="text-white text-sm font-mono">{swatch.color}</div>
                  <div className="text-gray-400 text-xs">
                    {new Date(swatch.timestamp).toLocaleTimeString()}
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    copyColorToClipboard(swatch.color);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-white transition"
                >
                  {copiedColor === swatch.color ? <Check size={16} /> : <Copy size={16} />}
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}