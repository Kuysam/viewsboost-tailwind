import React, { useRef, useEffect, useState } from 'react';
import { fabric } from 'fabric';
import { Type, Square, Download } from 'lucide-react';

const SimpleCanvaEditor: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [canvas, setCanvas] = useState<fabric.Canvas | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const fabricCanvas = new fabric.Canvas(canvasRef.current, {
      width: 800,
      height: 600,
      backgroundColor: '#ffffff',
    });

    setCanvas(fabricCanvas);

    return () => {
      fabricCanvas.dispose();
    };
  }, []);

  const addText = () => {
    if (!canvas) return;
    
    const text = new fabric.IText('Click to edit', {
      left: 100,
      top: 100,
      fontSize: 24,
      fill: '#000000',
    });
    
    canvas.add(text);
    canvas.setActiveObject(text);
    canvas.renderAll();
  };

  const addShape = () => {
    if (!canvas) return;
    
    const rect = new fabric.Rect({
      left: 100,
      top: 100,
      width: 100,
      height: 100,
      fill: '#3b82f6',
    });
    
    canvas.add(rect);
    canvas.setActiveObject(rect);
    canvas.renderAll();
  };

  const exportCanvas = () => {
    if (!canvas) return;
    
    const dataURL = canvas.toDataURL({
      format: 'png',
      quality: 1,
    });
    
    const link = document.createElement('a');
    link.download = 'design.png';
    link.href = dataURL;
    link.click();
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Simple Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 p-4">
        <h3 className="text-lg font-semibold mb-4">Tools</h3>
        
        <div className="space-y-2">
          <button
            onClick={addText}
            className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 flex items-center gap-2"
          >
            <Type size={16} />
            Add Text
          </button>
          
          <button
            onClick={addShape}
            className="w-full bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600 flex items-center gap-2"
          >
            <Square size={16} />
            Add Shape
          </button>
          
          <button
            onClick={exportCanvas}
            className="w-full bg-purple-500 text-white py-2 px-4 rounded hover:bg-purple-600 flex items-center gap-2"
          >
            <Download size={16} />
            Export
          </button>
        </div>
      </div>

      {/* Canvas Area */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          <canvas ref={canvasRef} className="border border-gray-300" />
        </div>
      </div>
    </div>
  );
};

export default SimpleCanvaEditor; 