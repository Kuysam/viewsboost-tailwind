import React from 'react';
import { fabric } from 'fabric';
import { Type, Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight } from 'lucide-react';
import { useEditorStore } from '../../store/editorStore';

const TextPanel: React.FC = () => {
  const { canvas, selectedObjectIds, objects } = useEditorStore();
  
  const selectedObjects = objects.filter(obj => selectedObjectIds.includes(obj.id));
  const selectedTextObject = selectedObjects.find(obj => obj.type === 'text');

  const addText = (type: 'heading' | 'subheading' | 'body') => {
    if (!canvas) return;

    const textConfigs = {
      heading: { text: 'Add a heading', fontSize: 36, fontWeight: 'bold' },
      subheading: { text: 'Add a subheading', fontSize: 24, fontWeight: '600' },
      body: { text: 'Add body text', fontSize: 16, fontWeight: 'normal' }
    };

    const config = textConfigs[type];
    const textObject = new fabric.IText(config.text, {
      left: 100,
      top: 100,
      fontSize: config.fontSize,
      fontWeight: config.fontWeight,
      fontFamily: 'Inter, Arial, sans-serif',
      fill: '#000000',
    });

    // Add unique ID for tracking
    (textObject as any).id = `text-${Date.now()}`;
    
    canvas.add(textObject);
    canvas.setActiveObject(textObject);
    canvas.renderAll();
  };

  const updateTextProperty = (property: string, value: any) => {
    if (!canvas) return;
    
    const activeObject = canvas.getActiveObject();
    if (activeObject && activeObject.type === 'i-text') {
      (activeObject as any).set(property, value);
      canvas.renderAll();
    }
  };

  const formatText = (format: 'bold' | 'italic' | 'underline') => {
    if (!canvas) return;
    
    const activeObject = canvas.getActiveObject() as fabric.IText;
    if (activeObject && activeObject.type === 'i-text') {
      switch (format) {
        case 'bold':
          const currentWeight = activeObject.fontWeight;
          activeObject.set('fontWeight', currentWeight === 'bold' ? 'normal' : 'bold');
          break;
        case 'italic':
          const currentStyle = activeObject.fontStyle;
          activeObject.set('fontStyle', currentStyle === 'italic' ? 'normal' : 'italic');
          break;
        case 'underline':
          const currentUnderline = activeObject.underline;
          activeObject.set('underline', !currentUnderline);
          break;
      }
      canvas.renderAll();
    }
  };

  const alignText = (alignment: 'left' | 'center' | 'right') => {
    if (!canvas) return;
    
    const activeObject = canvas.getActiveObject() as fabric.IText;
    if (activeObject && activeObject.type === 'i-text') {
      activeObject.set('textAlign', alignment);
      canvas.renderAll();
    }
  };

  const activeObject = canvas?.getActiveObject() as fabric.IText;
  const isTextSelected = activeObject && activeObject.type === 'i-text';

  return (
    <div className="space-y-6">
      {/* Quick Add Text */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-3">Quick Add</h3>
        <div className="space-y-2">
          {[
            { type: 'heading' as const, label: 'Add a heading', icon: '🔤', size: 'text-xl font-bold' },
            { type: 'subheading' as const, label: 'Add a subheading', icon: '📝', size: 'text-lg font-semibold' },
            { type: 'body' as const, label: 'Add body text', icon: '📄', size: 'text-base' }
          ].map((item) => (
            <button
              key={item.type}
              onClick={() => addText(item.type)}
              className="w-full p-3 bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all duration-200 text-left group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-sm group-hover:bg-blue-200 transition-colors">
                  {item.icon}
                </div>
                <div>
                  <div className={`${item.size} text-gray-800`}>{item.label}</div>
                  <div className="text-xs text-gray-500">Click to add to canvas</div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Text Properties */}
      {isTextSelected && (
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3">Text Properties</h3>
          <div className="space-y-4">
            {/* Text Content */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Text</label>
              <textarea
                value={activeObject.text || ''}
                onChange={(e) => updateTextProperty('text', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={2}
              />
            </div>

            {/* Font Size */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Font Size</label>
              <input
                type="range"
                min="12"
                max="72"
                value={activeObject.fontSize || 16}
                onChange={(e) => updateTextProperty('fontSize', parseInt(e.target.value))}
                className="w-full"
              />
              <div className="text-xs text-gray-500 mt-1">{activeObject.fontSize || 16}px</div>
            </div>

            {/* Text Color */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Color</label>
              <input
                type="color"
                value={activeObject.fill as string || '#000000'}
                onChange={(e) => updateTextProperty('fill', e.target.value)}
                className="w-full h-8 border border-gray-300 rounded cursor-pointer"
              />
            </div>

            {/* Format Buttons */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-2">Format</label>
              <div className="flex gap-1">
                <button
                  onClick={() => formatText('bold')}
                  className={`p-2 rounded border ${
                    activeObject.fontWeight === 'bold' 
                      ? 'bg-blue-100 border-blue-300 text-blue-600' 
                      : 'bg-white border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <Bold size={16} />
                </button>
                <button
                  onClick={() => formatText('italic')}
                  className={`p-2 rounded border ${
                    activeObject.fontStyle === 'italic' 
                      ? 'bg-blue-100 border-blue-300 text-blue-600' 
                      : 'bg-white border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <Italic size={16} />
                </button>
                <button
                  onClick={() => formatText('underline')}
                  className={`p-2 rounded border ${
                    activeObject.underline 
                      ? 'bg-blue-100 border-blue-300 text-blue-600' 
                      : 'bg-white border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <Underline size={16} />
                </button>
              </div>
            </div>

            {/* Alignment */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-2">Alignment</label>
              <div className="flex gap-1">
                {[
                  { align: 'left' as const, icon: AlignLeft },
                  { align: 'center' as const, icon: AlignCenter },
                  { align: 'right' as const, icon: AlignRight }
                ].map(({ align, icon: Icon }) => (
                  <button
                    key={align}
                    onClick={() => alignText(align)}
                    className={`p-2 rounded border ${
                      activeObject.textAlign === align 
                        ? 'bg-blue-100 border-blue-300 text-blue-600' 
                        : 'bg-white border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <Icon size={16} />
                  </button>
                ))}
              </div>
            </div>

            {/* Delete Button */}
            <button
              onClick={() => {
                if (canvas && activeObject) {
                  canvas.remove(activeObject);
                  canvas.renderAll();
                }
              }}
              className="w-full px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors text-sm font-medium"
            >
              Delete Text
            </button>
          </div>
        </div>
      )}

      {/* Font Presets */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-3">Font Styles</h3>
        <div className="grid grid-cols-2 gap-2">
          {[
            { family: 'Arial', name: 'Arial' },
            { family: 'Times New Roman', name: 'Times' },
            { family: 'Helvetica', name: 'Helvetica' },
            { family: 'Georgia', name: 'Georgia' },
            { family: 'Verdana', name: 'Verdana' },
            { family: 'Inter', name: 'Inter' }
          ].map((font) => (
            <button
              key={font.family}
              onClick={() => updateTextProperty('fontFamily', font.family)}
              className="p-2 text-sm border border-gray-300 rounded hover:border-blue-300 hover:bg-blue-50 transition-colors"
              style={{ fontFamily: font.family }}
            >
              {font.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TextPanel;