import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Sliders, RotateCcw, Eye, Download, Palette } from 'lucide-react';

interface FilterState {
  brightness: number;
  contrast: number;
  saturation: number;
  hue: number;
  blur: number;
  sepia: number;
  grayscale: number;
  invert: number;
  opacity: number;
}

interface ImageFiltersProps {
  imageSrc: string;
  onFilterChange: (filteredImageBlob: Blob, filters: FilterState) => void;
  onCancel: () => void;
  initialFilters?: Partial<FilterState>;
}

const DEFAULT_FILTERS: FilterState = {
  brightness: 100,
  contrast: 100,
  saturation: 100,
  hue: 0,
  blur: 0,
  sepia: 0,
  grayscale: 0,
  invert: 0,
  opacity: 100,
};

const FILTER_PRESETS = [
  {
    name: 'Original',
    filters: DEFAULT_FILTERS,
  },
  {
    name: 'Vintage',
    filters: {
      ...DEFAULT_FILTERS,
      brightness: 110,
      contrast: 90,
      saturation: 80,
      sepia: 30,
    },
  },
  {
    name: 'Black & White',
    filters: {
      ...DEFAULT_FILTERS,
      grayscale: 100,
      contrast: 110,
    },
  },
  {
    name: 'High Contrast',
    filters: {
      ...DEFAULT_FILTERS,
      contrast: 140,
      brightness: 110,
      saturation: 120,
    },
  },
  {
    name: 'Warm',
    filters: {
      ...DEFAULT_FILTERS,
      hue: 10,
      brightness: 105,
      saturation: 110,
    },
  },
  {
    name: 'Cool',
    filters: {
      ...DEFAULT_FILTERS,
      hue: -10,
      brightness: 95,
      saturation: 90,
    },
  },
  {
    name: 'Dramatic',
    filters: {
      ...DEFAULT_FILTERS,
      contrast: 150,
      brightness: 90,
      saturation: 130,
    },
  },
  {
    name: 'Soft',
    filters: {
      ...DEFAULT_FILTERS,
      contrast: 80,
      brightness: 110,
      blur: 1,
    },
  },
];

export function ImageFilters({
  imageSrc,
  onFilterChange,
  onCancel,
  initialFilters = {},
}: ImageFiltersProps) {
  const [filters, setFilters] = useState<FilterState>({
    ...DEFAULT_FILTERS,
    ...initialFilters,
  });
  const [selectedPreset, setSelectedPreset] = useState<string>('Original');
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  const imgRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const generateFilteredImage = useCallback(async (currentFilters: FilterState): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      if (!imgRef.current || !canvasRef.current) {
        reject(new Error('Image or canvas not available'));
        return;
      }

      const img = imgRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }

      // Set canvas size to match image
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;

      // Apply filters using CSS filter string
      const filterString = [
        `brightness(${currentFilters.brightness}%)`,
        `contrast(${currentFilters.contrast}%)`,
        `saturate(${currentFilters.saturation}%)`,
        `hue-rotate(${currentFilters.hue}deg)`,
        `blur(${currentFilters.blur}px)`,
        `sepia(${currentFilters.sepia}%)`,
        `grayscale(${currentFilters.grayscale}%)`,
        `invert(${currentFilters.invert}%)`,
        `opacity(${currentFilters.opacity}%)`,
      ].join(' ');

      ctx.filter = filterString;
      ctx.drawImage(img, 0, 0);

      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to generate blob'));
        }
      }, 'image/jpeg', 0.95);
    });
  }, []);

  const updateFilters = useCallback(async (newFilters: FilterState) => {
    setFilters(newFilters);
    try {
      const filteredBlob = await generateFilteredImage(newFilters);
      onFilterChange(filteredBlob, newFilters);
    } catch (error) {
      console.error('Error applying filters:', error);
    }
  }, [generateFilteredImage, onFilterChange]);

  const handleFilterChange = useCallback((filterName: keyof FilterState, value: number) => {
    const newFilters = { ...filters, [filterName]: value };
    updateFilters(newFilters);
    setSelectedPreset('Custom');
  }, [filters, updateFilters]);

  const applyPreset = useCallback((preset: typeof FILTER_PRESETS[0]) => {
    updateFilters(preset.filters);
    setSelectedPreset(preset.name);
  }, [updateFilters]);

  const resetFilters = useCallback(() => {
    updateFilters(DEFAULT_FILTERS);
    setSelectedPreset('Original');
  }, [updateFilters]);

  const getCSSFilter = useCallback((currentFilters: FilterState) => {
    return [
      `brightness(${currentFilters.brightness}%)`,
      `contrast(${currentFilters.contrast}%)`,
      `saturate(${currentFilters.saturation}%)`,
      `hue-rotate(${currentFilters.hue}deg)`,
      `blur(${currentFilters.blur}px)`,
      `sepia(${currentFilters.sepia}%)`,
      `grayscale(${currentFilters.grayscale}%)`,
      `invert(${currentFilters.invert}%)`,
      `opacity(${currentFilters.opacity}%)`,
    ].join(' ');
  }, []);

  const renderSlider = (
    label: string,
    filterName: keyof FilterState,
    min: number,
    max: number,
    step: number = 1,
    unit: string = '%'
  ) => (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-gray-300 text-sm">{label}</span>
        <span className="text-white text-sm font-mono">
          {filters[filterName]}{unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={filters[filterName]}
        onChange={(e) => handleFilterChange(filterName, Number(e.target.value))}
        className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
      />
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-gray-900 rounded-lg shadow-2xl max-w-7xl max-h-[90vh] w-full mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <Sliders size={20} className="text-blue-400" />
            <h2 className="text-white font-semibold">Image Filters</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="px-3 py-1 bg-gray-700 text-gray-300 rounded text-sm hover:bg-gray-600 transition"
            >
              <Eye size={14} className="inline mr-1" />
              {showAdvanced ? 'Simple' : 'Advanced'}
            </button>
            <button
              onClick={resetFilters}
              className="px-3 py-1 bg-gray-700 text-gray-300 rounded text-sm hover:bg-gray-600 transition"
            >
              <RotateCcw size={14} className="inline mr-1" />
              Reset
            </button>
            <button
              onClick={onCancel}
              className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition"
            >
              Cancel
            </button>
            <button
              onClick={() => updateFilters(filters)}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
            >
              Apply
            </button>
          </div>
        </div>

        <div className="flex h-[calc(90vh-80px)]">
          {/* Left Sidebar - Controls */}
          <div className="w-80 p-4 border-r border-gray-700 bg-gray-800/50 overflow-y-auto">
            {/* Filter Presets */}
            <div className="mb-6">
              <h3 className="text-white font-medium mb-3">Presets</h3>
              <div className="grid grid-cols-2 gap-2">
                {FILTER_PRESETS.map((preset) => (
                  <button
                    key={preset.name}
                    onClick={() => applyPreset(preset)}
                    className={`p-2 rounded-lg text-sm font-medium transition ${
                      selectedPreset === preset.name
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Basic Adjustments */}
            <div className="space-y-4 mb-6">
              <h3 className="text-white font-medium">Basic Adjustments</h3>
              {renderSlider('Brightness', 'brightness', 0, 200)}
              {renderSlider('Contrast', 'contrast', 0, 200)}
              {renderSlider('Saturation', 'saturation', 0, 200)}
              {renderSlider('Opacity', 'opacity', 0, 100)}
            </div>

            {showAdvanced && (
              <>
                {/* Color Adjustments */}
                <div className="space-y-4 mb-6">
                  <h3 className="text-white font-medium">Color</h3>
                  {renderSlider('Hue', 'hue', -180, 180, 1, '°')}
                  {renderSlider('Sepia', 'sepia', 0, 100)}
                  {renderSlider('Grayscale', 'grayscale', 0, 100)}
                  {renderSlider('Invert', 'invert', 0, 100)}
                </div>

                {/* Effects */}
                <div className="space-y-4">
                  <h3 className="text-white font-medium">Effects</h3>
                  {renderSlider('Blur', 'blur', 0, 10, 0.1, 'px')}
                </div>
              </>
            )}

            {/* Filter String Display */}
            <div className="mt-6 p-3 bg-gray-800 rounded-lg">
              <h4 className="text-gray-300 text-sm mb-2">CSS Filter</h4>
              <div className="text-xs text-gray-400 font-mono break-all">
                {getCSSFilter(filters)}
              </div>
            </div>
          </div>

          {/* Main Content - Image Preview */}
          <div className="flex-1 p-4 overflow-auto bg-gray-800/20">
            <div className="flex items-center justify-center h-full">
              <img
                ref={imgRef}
                src={imageSrc}
                alt="Filter preview"
                style={{
                  filter: getCSSFilter(filters),
                  maxWidth: '100%',
                  maxHeight: '100%',
                  objectFit: 'contain',
                }}
                className="rounded-lg shadow-lg"
              />
            </div>
          </div>
        </div>

        {/* Hidden canvas for image generation */}
        <canvas
          ref={canvasRef}
          style={{ display: 'none' }}
        />
      </div>
    </div>
  );
}