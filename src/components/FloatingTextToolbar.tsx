import React, { useState, useEffect, useRef } from 'react';
import { 
  Bold, 
  Italic, 
  Underline, 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  Palette, 
  Type, 
  Minus, 
  Plus, 
  ChevronDown 
} from 'lucide-react';
import { TextElement } from '../types/textPresets';

interface FloatingTextToolbarProps {
  element: TextElement;
  isVisible: boolean;
  onUpdate: (element: TextElement) => void;
  position: { x: number; y: number };
}

const FloatingTextToolbar: React.FC<FloatingTextToolbarProps> = ({
  element,
  isVisible,
  onUpdate,
  position
}) => {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showFontSelector, setShowFontSelector] = useState(false);
  const colorPickerRef = useRef<HTMLDivElement>(null);
  const fontSelectorRef = useRef<HTMLDivElement>(null);

  const commonColors = [
    '#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF', '#FFFF00',
    '#FF00FF', '#00FFFF', '#FF8000', '#8000FF', '#0080FF', '#FF0080',
    '#80FF00', '#FF4000', '#4000FF', '#00FF80', '#FF8080', '#80FF80',
    '#8080FF', '#FFD700', '#FFA500', '#FF6347', '#32CD32', '#1E90FF'
  ];

  const fonts = [
    'Arial, sans-serif',
    'Helvetica, sans-serif',
    'Times New Roman, serif',
    'Georgia, serif',
    'Courier New, monospace',
    'Monaco, monospace',
    'Verdana, sans-serif',
    'Trebuchet MS, sans-serif',
    'Impact, sans-serif',
    'Arial Black, sans-serif',
    'Comic Sans MS, cursive',
    'Palatino, serif'
  ];

  // Handle font size change
  const handleFontSizeChange = (delta: number) => {
    const currentSize = parseInt(element.style.fontSize || '16px');
    const newSize = Math.max(8, Math.min(200, currentSize + delta));
    
    onUpdate({
      ...element,
      style: {
        ...element.style,
        fontSize: `${newSize}px`
      }
    });
  };

  // Handle color change
  const handleColorChange = (color: string) => {
    onUpdate({
      ...element,
      style: {
        ...element.style,
        color: color
      }
    });
    setShowColorPicker(false);
  };

  // Handle font family change
  const handleFontChange = (fontFamily: string) => {
    onUpdate({
      ...element,
      style: {
        ...element.style,
        fontFamily: fontFamily
      }
    });
    setShowFontSelector(false);
  };

  // Handle text alignment
  const handleAlignment = (align: 'left' | 'center' | 'right') => {
    onUpdate({
      ...element,
      style: {
        ...element.style,
        textAlign: align
      }
    });
  };

  // Handle font weight toggle
  const handleBold = () => {
    const currentWeight = element.style.fontWeight || 'normal';
    const newWeight = currentWeight === 'bold' ? 'normal' : 'bold';
    
    onUpdate({
      ...element,
      style: {
        ...element.style,
        fontWeight: newWeight
      }
    });
  };

  // Handle font style toggle
  const handleItalic = () => {
    const currentStyle = element.style.fontStyle || 'normal';
    const newStyle = currentStyle === 'italic' ? 'normal' : 'italic';
    
    onUpdate({
      ...element,
      style: {
        ...element.style,
        fontStyle: newStyle
      }
    });
  };

  // Handle text decoration toggle
  const handleUnderline = () => {
    const currentDecoration = element.style.textDecoration || 'none';
    const newDecoration = currentDecoration === 'underline' ? 'none' : 'underline';
    
    onUpdate({
      ...element,
      style: {
        ...element.style,
        textDecoration: newDecoration
      }
    });
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (colorPickerRef.current && !colorPickerRef.current.contains(event.target as Node)) {
        setShowColorPicker(false);
      }
      if (fontSelectorRef.current && !fontSelectorRef.current.contains(event.target as Node)) {
        setShowFontSelector(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!isVisible) return null;

  const currentFontSize = parseInt(element.style.fontSize || '16px');
  const currentColor = element.style.color || '#000000';
  const currentFontFamily = element.style.fontFamily || 'Arial, sans-serif';
  const currentAlign = element.style.textAlign || 'left';
  const isBold = element.style.fontWeight === 'bold';
  const isItalic = element.style.fontStyle === 'italic';
  const isUnderlined = element.style.textDecoration === 'underline';

  return (
    <div 
      className="fixed bg-white border border-gray-300 rounded-lg shadow-lg p-2 z-50 flex items-center gap-1"
      style={{ 
        left: position.x, 
        top: position.y - 60,
        transform: 'translateX(-50%)'
      }}
    >
      {/* Font Family Selector */}
      <div className="relative" ref={fontSelectorRef}>
        <button
          onClick={() => setShowFontSelector(!showFontSelector)}
          className="flex items-center gap-1 px-2 py-1 hover:bg-gray-100 rounded text-xs"
        >
          <Type className="w-3 h-3" />
          <span className="max-w-16 truncate">{currentFontFamily.split(',')[0]}</span>
          <ChevronDown className="w-3 h-3" />
        </button>
        
        {showFontSelector && (
          <div className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-40 overflow-y-auto min-w-40 z-60">
            {fonts.map((font) => (
              <button
                key={font}
                onClick={() => handleFontChange(font)}
                className={`w-full text-left px-3 py-2 hover:bg-gray-100 text-xs ${
                  currentFontFamily === font ? 'bg-blue-100' : ''
                }`}
                style={{ fontFamily: font }}
              >
                {font.split(',')[0]}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Font Size Controls */}
      <div className="flex items-center gap-1 border-l pl-2">
        <button
          onClick={() => handleFontSizeChange(-2)}
          className="p-1 hover:bg-gray-100 rounded"
        >
          <Minus className="w-3 h-3" />
        </button>
        <span className="text-xs font-mono min-w-8 text-center">{currentFontSize}</span>
        <button
          onClick={() => handleFontSizeChange(2)}
          className="p-1 hover:bg-gray-100 rounded"
        >
          <Plus className="w-3 h-3" />
        </button>
      </div>

      {/* Formatting Controls */}
      <div className="flex items-center gap-1 border-l pl-2">
        <button
          onClick={handleBold}
          className={`p-1 rounded ${isBold ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'}`}
        >
          <Bold className="w-3 h-3" />
        </button>
        <button
          onClick={handleItalic}
          className={`p-1 rounded ${isItalic ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'}`}
        >
          <Italic className="w-3 h-3" />
        </button>
        <button
          onClick={handleUnderline}
          className={`p-1 rounded ${isUnderlined ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'}`}
        >
          <Underline className="w-3 h-3" />
        </button>
      </div>

      {/* Alignment Controls */}
      <div className="flex items-center gap-1 border-l pl-2">
        <button
          onClick={() => handleAlignment('left')}
          className={`p-1 rounded ${currentAlign === 'left' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'}`}
        >
          <AlignLeft className="w-3 h-3" />
        </button>
        <button
          onClick={() => handleAlignment('center')}
          className={`p-1 rounded ${currentAlign === 'center' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'}`}
        >
          <AlignCenter className="w-3 h-3" />
        </button>
        <button
          onClick={() => handleAlignment('right')}
          className={`p-1 rounded ${currentAlign === 'right' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'}`}
        >
          <AlignRight className="w-3 h-3" />
        </button>
      </div>

      {/* Color Picker */}
      <div className="relative border-l pl-2" ref={colorPickerRef}>
        <button
          onClick={() => setShowColorPicker(!showColorPicker)}
          className="flex items-center gap-1 px-2 py-1 hover:bg-gray-100 rounded"
        >
          <Palette className="w-3 h-3" />
          <div 
            className="w-4 h-4 rounded border border-gray-300"
            style={{ backgroundColor: currentColor }}
          />
        </button>
        
        {showColorPicker && (
          <div className="absolute top-full right-0 mt-1 bg-white border border-gray-300 rounded-md shadow-lg p-2 z-60">
            <div className="grid grid-cols-6 gap-1 w-36">
              {commonColors.map((color) => (
                <button
                  key={color}
                  onClick={() => handleColorChange(color)}
                  className={`w-6 h-6 rounded border border-gray-300 hover:scale-110 transition-transform ${
                    currentColor === color ? 'ring-2 ring-blue-500' : ''
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FloatingTextToolbar;