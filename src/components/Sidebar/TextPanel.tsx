import React, { useState } from 'react';
import { fabric } from 'fabric';
import { 
  Type, Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight,
  Plus, Palette, ChevronDown
} from 'lucide-react';
import { useEditorStore } from '../../store/editorStore';

interface TextPreset {
  id: string;
  name: string;
  preview: string;
  style: {
    fontSize: number;
    fontFamily: string;
    fontWeight: string;
    color: string;
    textAlign: 'left' | 'center' | 'right';
  };
}

const textPresets: TextPreset[] = [
  {
    id: 'heading',
    name: 'Heading',
    preview: 'Add a heading',
    style: {
      fontSize: 48,
      fontFamily: 'Arial',
      fontWeight: 'bold',
      color: '#000000',
      textAlign: 'left',
    },
  },
  {
    id: 'subheading',
    name: 'Subheading',
    preview: 'Add a subheading',
    style: {
      fontSize: 32,
      fontFamily: 'Arial',
      fontWeight: '600',
      color: '#374151',
      textAlign: 'left',
    },
  },
  {
    id: 'body',
    name: 'Body Text',
    preview: 'Add a little bit of body text',
    style: {
      fontSize: 18,
      fontFamily: 'Arial',
      fontWeight: 'normal',
      color: '#6b7280',
      textAlign: 'left',
    },
  },
  {
    id: 'button',
    name: 'Button',
    preview: 'Click here',
    style: {
      fontSize: 16,
      fontFamily: 'Arial',
      fontWeight: 'bold',
      color: '#ffffff',
      textAlign: 'center',
    },
  },
];

const fontFamilies = [
  'Arial', 'Helvetica', 'Times New Roman', 'Georgia', 'Verdana',
  'Comic Sans MS', 'Impact', 'Lucida Console', 'Tahoma', 'Trebuchet MS',
  'Courier New', 'Palatino', 'Garamond', 'Bookman', 'Avant Garde',
  'Inter', 'Roboto', 'Poppins', 'Montserrat', 'Open Sans'
];

const TextPanel: React.FC = () => {
  const { canvas, selectedObjectIds } = useEditorStore();
  const [activeColor, setActiveColor] = useState('#000000');
  const [showFontDropdown, setShowFontDropdown] = useState(false);
  const [selectedFont, setSelectedFont] = useState('Arial');

  const addTextFromPreset = (preset: TextPreset) => {
    if (!canvas) return;

    const textObject = new fabric.IText(preset.preview, {
      left: 100,
      top: 100,
      fontSize: preset.style.fontSize,
      fontFamily: preset.style.fontFamily,
      fontWeight: preset.style.fontWeight,
      fill: preset.style.color,
      textAlign: preset.style.textAlign,
      editable: true,
    });

    const id = `text-${Date.now()}`;
    (textObject as any).id = id;

    canvas.add(textObject);
    canvas.setActiveObject(textObject);
    canvas.renderAll();

    // Start editing immediately
    setTimeout(() => {
      textObject.enterEditing();
      textObject.selectAll();
    }, 100);
  };

  const addCustomText = () => {
    if (!canvas) return;

    const textObject = new fabric.IText('Click to edit', {
      left: 100,
      top: 100,
      fontSize: 24,
      fontFamily: selectedFont,
      fill: activeColor,
      editable: true,
    });

    const id = `text-${Date.now()}`;
    (textObject as any).id = id;

    canvas.add(textObject);
    canvas.setActiveObject(textObject);
    canvas.renderAll();

    // Start editing immediately
    setTimeout(() => {
      textObject.enterEditing();
      textObject.selectAll();
    }, 100);
  };

  const applyTextFormatting = (property: string, value: any) => {
    if (!canvas) return;

    const activeObject = canvas.getActiveObject();
    if (activeObject && activeObject instanceof fabric.IText) {
      (activeObject as any)[property] = value;
      activeObject.dirty = true;
      canvas.renderAll();
    }
  };

  const toggleBold = () => {
    if (!canvas) return;
    const activeObject = canvas.getActiveObject();
    if (activeObject && activeObject instanceof fabric.IText) {
      const currentWeight = activeObject.fontWeight;
      const newWeight = currentWeight === 'bold' ? 'normal' : 'bold';
      applyTextFormatting('fontWeight', newWeight);
    }
  };

  const toggleItalic = () => {
    if (!canvas) return;
    const activeObject = canvas.getActiveObject();
    if (activeObject && activeObject instanceof fabric.IText) {
      const currentStyle = activeObject.fontStyle;
      const newStyle = currentStyle === 'italic' ? 'normal' : 'italic';
      applyTextFormatting('fontStyle', newStyle);
    }
  };

  const toggleUnderline = () => {
    if (!canvas) return;
    const activeObject = canvas.getActiveObject();
    if (activeObject && activeObject instanceof fabric.IText) {
      const currentUnderline = activeObject.underline;
      applyTextFormatting('underline', !currentUnderline);
    }
  };

  const setTextAlign = (align: 'left' | 'center' | 'right') => {
    applyTextFormatting('textAlign', align);
  };

  const changeFont = (fontFamily: string) => {
    setSelectedFont(fontFamily);
    setShowFontDropdown(false);
    applyTextFormatting('fontFamily', fontFamily);
  };

  const changeColor = (color: string) => {
    setActiveColor(color);
    applyTextFormatting('fill', color);
  };

  const selectedObject = canvas?.getActiveObject();
  const isTextSelected = selectedObject && selectedObject instanceof fabric.IText;

  return (
    <div className="p-4 space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4 text-gray-800">Text</h3>
        
        {/* Add Text Button */}
        <button
          onClick={addCustomText}
          className="w-full bg-blue-500 text-white py-3 px-4 rounded-lg hover:bg-blue-600 transition-colors mb-4 flex items-center justify-center gap-2"
        >
          <Plus size={18} />
          Add Text
        </button>

        {/* Text Presets */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-600 mb-2">Text Presets</h4>
          {textPresets.map((preset) => (
            <button
              key={preset.id}
              onClick={() => addTextFromPreset(preset)}
              className="w-full text-left p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors border"
            >
              <div className="text-xs text-gray-500 mb-1">{preset.name}</div>
              <div 
                style={{
                  fontSize: `${Math.min(preset.style.fontSize / 2, 18)}px`,
                  fontFamily: preset.style.fontFamily,
                  fontWeight: preset.style.fontWeight,
                  color: preset.style.color,
                  textAlign: preset.style.textAlign,
                }}
              >
                {preset.preview}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Text Formatting (only show when text is selected) */}
      {isTextSelected && (
        <div className="border-t pt-4">
          <h4 className="text-sm font-medium text-gray-600 mb-3">Format Text</h4>
          
          {/* Font Family */}
          <div className="mb-3">
            <label className="block text-xs text-gray-500 mb-1">Font</label>
            <div className="relative">
              <button
                onClick={() => setShowFontDropdown(!showFontDropdown)}
                className="w-full p-2 bg-white border border-gray-300 rounded text-left flex items-center justify-between text-sm"
              >
                {selectedFont}
                <ChevronDown size={16} />
              </button>
              {showFontDropdown && (
                <div className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded mt-1 max-h-48 overflow-y-auto z-50">
                  {fontFamilies.map((font) => (
                    <button
                      key={font}
                      onClick={() => changeFont(font)}
                      className="w-full text-left p-2 hover:bg-gray-100 text-sm"
                      style={{ fontFamily: font }}
                    >
                      {font}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Text Formatting Buttons */}
          <div className="flex gap-1 mb-3">
            <button
              onClick={toggleBold}
              className={`p-2 rounded ${
                (selectedObject as fabric.IText)?.fontWeight === 'bold' 
                  ? 'bg-blue-100 text-blue-600' 
                  : 'bg-gray-100 hover:bg-gray-200'
              }`}
              title="Bold"
            >
              <Bold size={16} />
            </button>
            <button
              onClick={toggleItalic}
              className={`p-2 rounded ${
                (selectedObject as fabric.IText)?.fontStyle === 'italic' 
                  ? 'bg-blue-100 text-blue-600' 
                  : 'bg-gray-100 hover:bg-gray-200'
              }`}
              title="Italic"
            >
              <Italic size={16} />
            </button>
            <button
              onClick={toggleUnderline}
              className={`p-2 rounded ${
                (selectedObject as fabric.IText)?.underline 
                  ? 'bg-blue-100 text-blue-600' 
                  : 'bg-gray-100 hover:bg-gray-200'
              }`}
              title="Underline"
            >
              <Underline size={16} />
            </button>
          </div>

          {/* Text Alignment */}
          <div className="flex gap-1 mb-3">
            <button
              onClick={() => setTextAlign('left')}
              className={`p-2 rounded ${
                (selectedObject as fabric.IText)?.textAlign === 'left' 
                  ? 'bg-blue-100 text-blue-600' 
                  : 'bg-gray-100 hover:bg-gray-200'
              }`}
              title="Align Left"
            >
              <AlignLeft size={16} />
            </button>
            <button
              onClick={() => setTextAlign('center')}
              className={`p-2 rounded ${
                (selectedObject as fabric.IText)?.textAlign === 'center' 
                  ? 'bg-blue-100 text-blue-600' 
                  : 'bg-gray-100 hover:bg-gray-200'
              }`}
              title="Align Center"
            >
              <AlignCenter size={16} />
            </button>
            <button
              onClick={() => setTextAlign('right')}
              className={`p-2 rounded ${
                (selectedObject as fabric.IText)?.textAlign === 'right' 
                  ? 'bg-blue-100 text-blue-600' 
                  : 'bg-gray-100 hover:bg-gray-200'
              }`}
              title="Align Right"
            >
              <AlignRight size={16} />
            </button>
          </div>

          {/* Color Picker */}
          <div>
            <label className="block text-xs text-gray-500 mb-1">Color</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={activeColor}
                onChange={(e) => changeColor(e.target.value)}
                className="w-8 h-8 rounded border cursor-pointer"
              />
              <input
                type="text"
                value={activeColor}
                onChange={(e) => changeColor(e.target.value)}
                className="flex-1 p-1 text-xs border border-gray-300 rounded"
                placeholder="#000000"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TextPanel; 